import { useEffect, useMemo, useState } from 'react'
import { geoMercator } from 'd3-geo'
import { ExternalLink, MapPin } from '../../components/ui/icones'
import { buscarCaminho, lerCaminho, linkDoCaminho, nomeDoMeio, type Caminho, type Tables } from '@together/core'
import { supabase } from '../../lib/supabase'
import Carregando from '../../components/ui/Carregando'
import type { Trajeto } from './api'

// "Ver o caminho" (spec 121c), espelho do app (apps/mobile/app/caminho.tsx): por onde o trem ou o ônibus
// passa, com as paradas e o horário de cada uma. Dados do Transitous, guardados no trajeto depois da 1ª busca.
// Sem dado, fica o link do Google Maps.

type Destino = Tables<'destinos'>
const hora = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '')

export default function CaminhoDoTrajeto({ trajeto: t, destinos }: { trajeto: Trajeto; destinos: Destino[] }) {
  const de = destinos.find((d) => d.id === t.origem_id) ?? null
  const para = destinos.find((d) => d.id === t.destino_id) ?? null
  const nomeDe = t.estacao_partida ?? t.de_texto ?? de?.nome ?? 'Origem'
  const nomePara = t.estacao_chegada ?? t.para_texto ?? para?.nome ?? 'Destino'
  const [caminho, setCaminho] = useState<Caminho | null | 'carregando'>(() => lerCaminho(t.caminho) ?? 'carregando')

  useEffect(() => {
    if (caminho !== 'carregando') return
    let ativo = true
    const ponto = (d: Destino | null) => (d && d.latitude != null && d.longitude != null ? { latitude: d.latitude, longitude: d.longitude } : null)
    buscarCaminho({ estacao: t.estacao_partida, cidade: ponto(de) }, { estacao: t.estacao_chegada, cidade: ponto(para) }, t.partida, new Date().toISOString())
      .then((achado) => {
        if (!ativo) return
        setCaminho(achado)
        // Guarda pra próxima vez (quem não pode editar o trajeto só vê, sem guardar)
        if (achado) void supabase.from('trajetos').update({ caminho: achado as never }).eq('id', t.id).then(() => undefined)
      })
      .catch(() => ativo && setCaminho(null))
    return () => {
      ativo = false
    }
  }, [caminho, t, de, para])

  const desenho = useMemo(() => {
    if (!caminho || caminho === 'carregando' || caminho.paradas.length < 2) return null
    const pontos = caminho.linha.length ? caminho.linha : caminho.paradas.map((p) => [p.latitude, p.longitude] as [number, number])
    const projecao = geoMercator().fitExtent(
      [
        [20, 20],
        [380, 200],
      ],
      { type: 'MultiPoint', coordinates: pontos.map(([la, lo]) => [lo, la]) },
    )
    const linha = pontos
      .map(([la, lo]) => projecao([lo, la]))
      .filter((xy): xy is [number, number] => !!xy)
      .map((xy) => xy.join(','))
      .join(' ')
    return { linha, paradas: caminho.paradas.map((p) => projecao([p.longitude, p.latitude])) }
  }, [caminho])

  return (
    <div className="ps-form">
      <div>
        <p className="ps-sobre">{nomeDoMeio(t.meio)}</p>
        <h2 className="ps-painel-titulo">
          {nomeDe} → {nomePara}
        </h2>
        {caminho && caminho !== 'carregando' && caminho.linhas.length > 0 && <p className="ps-dica">{caminho.linhas.join(' · ')}</p>}
      </div>

      {caminho === 'carregando' ? (
        <Carregando texto="Procurando o caminho…" compacto />
      ) : caminho ? (
        <>
          {desenho && (
            <svg className="ps-mapa" viewBox="0 0 400 220" role="img" aria-label={`Mapa do caminho: ${caminho.paradas.map((p) => p.nome).join(', ')}`}>
              <polyline points={desenho.linha} fill="none" stroke="var(--couro)" strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
              {desenho.paradas.map((xy, i) => {
                const ponta = i === 0 || i === desenho.paradas.length - 1
                return xy ? <circle key={i} cx={xy[0]} cy={xy[1]} r={ponta ? 7 : 4.5} fill={ponta ? 'var(--couro)' : 'var(--cor-cartao)'} stroke="var(--couro)" strokeWidth={2} /> : null
              })}
            </svg>
          )}
          <ol className="ps-paradas">
            {caminho.paradas.map((p, i) => (
              <li key={`${p.nome}-${i}`} className={i === 0 || i === caminho.paradas.length - 1 ? 'ponta' : undefined}>
                <span>{p.nome}</span>
                <small>{hora(p.chega ?? p.sai)}</small>
              </li>
            ))}
          </ol>
          {caminho.paradas.length > 2 && (
            <div className="ps-cartao-texto">
              <b>
                <MapPin size={16} aria-hidden="true" /> Dá pra conhecer no caminho
              </b>
              <p>
                O {nomeDoMeio(t.meio).toLowerCase()} para em{' '}
                {caminho.paradas
                  .slice(1, -1)
                  .slice(0, 3)
                  .map((p) => p.nome)
                  .join(', ')}
                {caminho.paradas.length > 5 ? ' e outras' : ''}. Se der, desçam umas horas e sigam no próximo: vira carimbo novo.
              </p>
            </div>
          )}
          <p className="ps-dica pequena">Horários da tabela das empresas (Transitous). Confira na passagem.</p>
        </>
      ) : (
        <div className="ps-cartao-texto">
          <b>Ainda não temos as paradas desse trajeto</b>
          <p>Abra no Google Maps pra ver por onde passa. Ônibus de viagem no Brasil quase nunca tem esse dado aberto.</p>
        </div>
      )}
      <a className="botao" href={linkDoCaminho(nomeDe, nomePara)} target="_blank" rel="noreferrer noopener">
        <ExternalLink size={16} aria-hidden="true" /> Abrir no Google Maps
      </a>
    </div>
  )
}

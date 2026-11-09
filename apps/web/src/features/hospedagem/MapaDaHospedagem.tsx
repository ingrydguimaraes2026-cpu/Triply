import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ATRIBUICAO_DO_MAPA,
  buscarLugaresComVotos,
  enquadrarNoMapa,
  mapaDaHospedagem,
  rotulosQueCabem,
  textoDosMinutos,
  type CidadeDaNoite,
  type LugarParaMapa,
} from '@together/core'
import { Footprints, Plane, Star, TrainFront } from '../../components/ui/icones'
import { supabase } from '../../lib/supabase'
import Carregando from '../../components/ui/Carregando'
import './mapa-da-hospedagem.css'

// Spec 124: o mapa das opções de hospedagem de uma cidade (espelho de apps/mobile/src/ui/MapaDaHospedagem.tsx).
// Retrato fixo que enquadra as opções numeradas, a estação/aeroporto de chegada e o ponto principal.
// Clicar num pino (ou na linha embaixo) destaca a opção e desenha chegada → opção → ponto.

export default function MapaDaHospedagem({ viagemId, cidade, pessoas }: { viagemId: string; cidade: CidadeDaNoite; pessoas: number }) {
  const [lugares, setLugares] = useState<LugarParaMapa[] | null>(null)
  const [pontoId, setPontoId] = useState<string | null>(null)
  const [escolhido, setEscolhido] = useState<string | null>(null)
  const [largura, setLargura] = useState(0)
  const caixa = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let vivo = true
    buscarLugaresComVotos(supabase, viagemId)
      .then((lista) => {
        if (!vivo) return
        setLugares(
          lista
            .filter((l) => l.destino_id === cidade.destino.id)
            .map((l) => ({ id: l.id, nome: l.nome, tipo: l.tipo, latitude: l.latitude, longitude: l.longitude, votos: l.votos.length + l.prioridades.length })),
        )
      })
      .catch(() => vivo && setLugares([])) // sem lugares, o mapa sai sem o ponto principal
    return () => {
      vivo = false
    }
  }, [viagemId, cidade.destino.id])

  // Mede a largura já ao montar e quando a tela muda de tamanho (o quadro só existe depois dos lugares)
  const carregou = lugares !== null
  useEffect(() => {
    const el = caixa.current
    if (!el) return
    const medir = () => setLargura(Math.round(el.getBoundingClientRect().width))
    medir()
    const obs = new ResizeObserver(medir)
    obs.observe(el)
    return () => obs.disconnect()
  }, [carregou])

  const mapa = useMemo(() => mapaDaHospedagem(cidade, lugares ?? [], pessoas, pontoId), [cidade, lugares, pessoas, pontoId])
  // Celular: quase quadrado (os pinos ficam juntos perto da estação); tela larga: mais baixo
  const altura = Math.round(Math.min(Math.max(largura * (largura < 600 ? 1 : 0.62), 240), 480))
  const quadro = useMemo(() => {
    const pontos = [...mapa.pinos, ...(mapa.chegada ? [mapa.chegada] : []), ...(mapa.ponto ? [mapa.ponto] : [])]
    return enquadrarNoMapa(pontos, largura, altura)
  }, [mapa, largura, altura])

  if (lugares === null) return <Carregando texto="Montando o mapa…" compacto />
  if (!mapa.pinos.length && !mapa.chegada) return <p className="hn-dica">Informe o endereço das opções pra ver no mapa.</p>

  const selecionada = escolhido ?? cidade.escolhida?.id ?? cidade.opcoes[0]?.id ?? null
  const destaque = mapa.pinos.find((p) => p.opcao.id === selecionada) ?? null
  const cabem = quadro ? rotulosQueCabem(mapa.pinos.map((p) => ({ xy: quadro.xy(p), rotulo: p.rotulo, destaque: p.opcao.id === selecionada }))) : []
  const IconeDaChegada = /aeroporto|airport|aeroport/i.test(mapa.chegada?.nome ?? '') ? Plane : TrainFront

  return (
    <div className="mh">
      <div
        ref={caixa}
        className="mh-quadro"
        style={{ height: altura }}
        role="img"
        aria-label={`Mapa com ${mapa.pinos.length} opções${mapa.chegada ? `, ${mapa.chegada.nome}` : ''}${mapa.ponto ? ` e ${mapa.ponto.nome}` : ''}`}
      >
        {quadro && (
          <>
            {quadro.azulejos.map((a) => (
              <img key={a.chave} src={a.url} alt="" className="mh-azulejo" style={{ left: a.esquerda, top: a.topo, width: a.tamanho, height: a.tamanho }} />
            ))}
            <svg className="mh-retas" width={largura} height={altura} aria-hidden="true">
              {mapa.lugares
                .filter((l) => l.id !== mapa.ponto?.id)
                .map((l) => {
                  const [x, y] = quadro.xy(l)
                  return <circle key={l.id} cx={x} cy={y} r={4} className="mh-lugar" />
                })}
              {destaque && mapa.chegada && <Reta de={quadro.xy(mapa.chegada)} ate={quadro.xy(destaque)} />}
              {destaque && mapa.ponto && <Reta de={quadro.xy(destaque)} ate={quadro.xy(mapa.ponto)} />}
            </svg>

            {mapa.chegada && (
              <Marco xy={quadro.xy(mapa.chegada)} tipo="chegada" rotulo={mapa.chegada.nome}>
                <IconeDaChegada size={15} aria-hidden="true" />
              </Marco>
            )}
            {mapa.ponto && (
              <Marco xy={quadro.xy(mapa.ponto)} tipo="ponto" rotulo={mapa.ponto.nome}>
                <Star size={15} aria-hidden="true" />
              </Marco>
            )}

            {mapa.pinos.map((p, i) => {
              const [x, y] = quadro.xy(p)
              const ativo = p.opcao.id === selecionada
              const mostraRotulo = cabem[i]
              return (
                <button
                  key={p.opcao.id}
                  type="button"
                  className={`mh-pino${ativo ? ' ativo' : ''}${p.opcao.escolhida ? ' escolhida' : ''}`}
                  style={{ left: x, top: y }}
                  onClick={() => setEscolhido(p.opcao.id)}
                  aria-label={`${p.numero}. ${p.opcao.nome}, ${p.rotulo}`}
                  aria-pressed={ativo}
                >
                  <span className="mh-pino-rotulo" style={mostraRotulo ? undefined : { visibility: 'hidden' }}>
                    {p.rotulo}
                  </span>
                  <span className="mh-pino-numero">{p.numero}</span>
                </button>
              )
            })}
            <small className="mh-atribuicao">{ATRIBUICAO_DO_MAPA}</small>
          </>
        )}
      </div>

      {mapa.lugares.length > 1 && (
        <div className="mh-pontos">
          <span className="mh-pontos-titulo">Medir até</span>
          <div className="mh-pontos-lista">
            {mapa.lugares.map((l) => (
              <button key={l.id} type="button" className={l.id === mapa.ponto?.id ? 'ativo' : ''} aria-pressed={l.id === mapa.ponto?.id} onClick={() => setPontoId(l.id)}>
                {l.nome}
              </button>
            ))}
          </div>
        </div>
      )}

      <ul className="mh-linhas">
        {mapa.pinos.map((p) => {
          const minutos = textoDosMinutos(p, mapa)
          return (
            <li key={p.opcao.id}>
              <button type="button" className={p.opcao.id === selecionada ? 'ativo' : ''} onClick={() => setEscolhido(p.opcao.id)}>
                <span className={`mh-numero${p.opcao.escolhida ? ' escolhida' : ''}`}>{p.numero}</span>
                <span className="mh-linha-meio">
                  <b>{p.opcao.nome}</b>
                  {minutos && (
                    <small>
                      <Footprints size={12} aria-hidden="true" /> {minutos}
                    </small>
                  )}
                </span>
                <span className="mh-linha-preco">{p.rotulo}</span>
              </button>
            </li>
          )
        })}
        {mapa.semLugar.map((o) => (
          <li key={o.id} className="mh-sem-lugar">
            <b>{o.nome}</b>
            <small>Sem lugar no mapa: informe o endereço ou o link do anúncio</small>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Reta({ de, ate }: { de: [number, number]; ate: [number, number] }) {
  return <line x1={de[0]} y1={de[1]} x2={ate[0]} y2={ate[1]} className="mh-reta" />
}

function Marco({ xy: [x, y], tipo, rotulo, children }: { xy: [number, number]; tipo: 'chegada' | 'ponto'; rotulo: string; children: React.ReactNode }) {
  return (
    <span className={`mh-marco ${tipo}`} style={{ left: x, top: y }}>
      <span className="mh-marco-bola">{children}</span>
      <span className="mh-marco-nome">{rotulo}</span>
    </span>
  )
}

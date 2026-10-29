import { useEffect, useState } from 'react'
import { CloudSun } from 'lucide-react'
import { buscarClima, interpretarTempo, type PrevisaoDia } from '@together/core'
import { hojeTexto } from '../destinos/datas'
import type { Destino } from '../destinos/api'
import Cartao from '../../components/ui/Cartao'
import './clima.css'

// "2026-11-12" → "qua 12" (parse em UTC pra não escorregar de dia por fuso)
function diaCurto(data: string) {
  const [a, m, d] = data.split('-').map(Number)
  const dt = new Date(Date.UTC(a, m - 1, d))
  const semana = dt.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'UTC' }).replace('.', '')
  return `${semana} ${d}`
}

const grau = (t: number | null) => (t == null ? '—' : `${Math.round(t)}°`)

type ClimaDoDestino = { destino: Destino; dias: PrevisaoDia[] }

// Clima dia a dia dos destinos da viagem (roadmap #8). Só aparece quando há
// destino com coordenadas e datas, e com dias ainda por vir. Estimativa longe = pelo ano passado.
export default function ClimaDaViagem({ destinos }: { destinos: Destino[] }) {
  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'erro'>('carregando')
  const [resultado, setResultado] = useState<ClimaDoDestino[]>([])

  // Só destinos que dá pra consultar: têm coordenadas e pelo menos a data de chegada
  const elegiveis = destinos.filter((d) => d.latitude != null && d.longitude != null && d.chegada)
  const assinatura = elegiveis.map((d) => `${d.id}:${d.chegada}:${d.saida ?? ''}`).join('|')

  useEffect(() => {
    let vivo = true
    const hoje = hojeTexto()
    setEstado('carregando')
    Promise.all(
      elegiveis.map(async (destino) => ({
        destino,
        dias: await buscarClima(destino.latitude, destino.longitude, destino.chegada, destino.saida ?? destino.chegada, hoje),
      })),
    )
      .then((todos) => {
        if (!vivo) return
        setResultado(todos.filter((r) => r.dias.length > 0))
        setEstado('pronto')
      })
      .catch(() => vivo && setEstado('erro'))
    return () => {
      vivo = false
    }
    // assinatura resume os destinos elegíveis; refaz a busca só quando eles mudam
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assinatura])

  // Nada pra mostrar (sem coordenadas/datas, ou viagem já passou): o cartão nem aparece
  if (estado === 'pronto' && resultado.length === 0) return null
  if (estado === 'carregando' && elegiveis.length === 0) return null

  return (
    <Cartao titulo="Clima" icone={CloudSun} className="overview-clima">
      {estado === 'carregando' ? (
        <p className="carregando-texto">Carregando…</p>
      ) : estado === 'erro' ? (
        <p className="carregando-texto">Não deu pra buscar a previsão agora.</p>
      ) : (
        <div className="clima-destinos">
          {resultado.map(({ destino, dias }) => (
            <div key={destino.id} className="clima-destino">
              <h4>{destino.nome}</h4>
              <ul className="clima-dias">
                {dias.map((p) => {
                  const t = interpretarTempo(p.codigo)
                  return (
                    <li key={p.data} className={p.tipo === 'estimativa' ? 'estimativa' : undefined}>
                      <span className="clima-data">{diaCurto(p.data)}</span>
                      <span className="clima-emoji" title={t.rotulo} aria-label={t.rotulo}>
                        {t.emoji}
                      </span>
                      <span className="clima-temp">
                        <strong>{grau(p.tempMax)}</strong> {grau(p.tempMin)}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
          {resultado.some((r) => r.dias.some((p) => p.tipo === 'estimativa')) && (
            <p className="clima-nota">Dias mais distantes são estimativa pelo mesmo período do ano passado.</p>
          )}
        </div>
      )}
    </Cartao>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { buscarDisponibilidades, contarPorDia, janelasEmComum, marcarDia, type Disponibilidade } from '@together/core'
import { supabase } from '../../lib/supabase'
import { useViagemAtual } from '../viagens/hooks'
import { editarViagem } from '../viagens/api'
import { hojeTexto } from '../destinos/datas'
import { formatarData } from '../../lib/datas'
import './datas-em-comum.css'

const SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

// Dias do mês "2027-06" com espaços antes do dia 1 (pra começar no domingo)
function diasDoMes(mes: string): (string | null)[] {
  const [a, m] = mes.split('-').map(Number)
  const primeiro = new Date(Date.UTC(a, m - 1, 1)).getUTCDay()
  const total = new Date(Date.UTC(a, m, 0)).getUTCDate()
  return [...Array(primeiro).fill(null), ...Array.from({ length: total }, (_, i) => `${mes}-${String(i + 1).padStart(2, '0')}`)]
}

function somarMes(mes: string, n: number) {
  const [a, m] = mes.split('-').map(Number)
  const d = new Date(Date.UTC(a, m - 1 + n, 1))
  return d.toISOString().slice(0, 7)
}

// Datas em comum (spec 065): cada um pinta os dias em que pode; o app mostra as janelas boas pra todos
export default function DatasEmComum() {
  const { viagem, membros, meuId, euSouAdm, atualizarViagem } = useViagemAtual()
  const [disps, setDisps] = useState<Disponibilidade[] | null>(null)
  const [mes, setMes] = useState(() => (viagem.data_inicio ?? hojeTexto()).slice(0, 7))
  const [erro, setErro] = useState<string | null>(null)
  const [recado, setRecado] = useState<string | null>(null)

  const recarregar = useCallback(() => {
    buscarDisponibilidades(supabase, viagem.id)
      .then(setDisps)
      .catch(() => setErro('Não deu pra carregar as datas.'))
  }, [viagem.id])
  useEffect(recarregar, [recarregar])

  const porDia = useMemo(() => contarPorDia(disps ?? []), [disps])
  const total = membros.length
  const janelas = useMemo(() => {
    const todos = janelasEmComum(disps ?? [], total)
    return todos.length > 0 || total <= 2 ? todos : janelasEmComum(disps ?? [], total - 1)
  }, [disps, total])

  async function alternar(dia: string) {
    if (!disps) return
    const posso = !porDia.get(dia)?.has(meuId)
    setDisps(posso ? [...disps, { usuario_id: meuId, dia }] : disps.filter((d) => !(d.dia === dia && d.usuario_id === meuId)))
    try {
      await marcarDia(supabase, viagem.id, meuId, dia, posso)
    } catch {
      setErro('Não deu pra salvar. Tente de novo.')
      recarregar()
    }
  }

  async function usar(inicio: string, fim: string) {
    try {
      atualizarViagem(await editarViagem(viagem.id, { data_inicio: inicio, data_fim: fim }))
      setRecado(`Período da viagem: ${formatarData(inicio)} a ${formatarData(fim)}.`)
    } catch {
      setErro('Não deu pra mudar as datas da viagem.')
    }
  }

  if (!disps) return erro ? <p className="form-erro">{erro}</p> : <p className="carregando-texto">Carregando…</p>
  const quemMarcou = new Set(disps.map((d) => d.usuario_id)).size

  return (
    <div className="datas-comum">
      <p className="dica">Toque nos dias em que você pode viajar. {quemMarcou} de {total} já marcaram.</p>
      <div className="datas-comum-topo">
        <button type="button" className="botao-texto" aria-label="Mês anterior" onClick={() => setMes(somarMes(mes, -1))}>
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <strong>{new Date(`${mes}-15T12:00:00Z`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</strong>
        <button type="button" className="botao-texto" aria-label="Próximo mês" onClick={() => setMes(somarMes(mes, 1))}>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="datas-comum-grade" role="grid">
        {SEMANA.map((s, i) => (
          <span key={i} className="datas-comum-semana">
            {s}
          </span>
        ))}
        {diasDoMes(mes).map((dia, i) => {
          if (!dia) return <span key={`v${i}`} />
          const pessoas = porDia.get(dia)?.size ?? 0
          const eu = porDia.get(dia)?.has(meuId) ?? false
          const nivel = pessoas === 0 ? 0 : pessoas >= total ? 3 : pessoas >= total - 1 ? 2 : 1
          return (
            <button
              key={dia}
              type="button"
              className={`datas-comum-dia nivel-${nivel}${eu ? ' meu' : ''}`}
              aria-pressed={eu}
              aria-label={`${formatarData(dia)}: ${pessoas} de ${total} podem${eu ? ', inclusive você' : ''}`}
              onClick={() => alternar(dia)}
            >
              {Number(dia.slice(8))}
              {pessoas > 0 && <small>{pessoas}</small>}
            </button>
          )
        })}
      </div>
      {janelas.length > 0 && (
        <ul className="datas-comum-janelas">
          {janelas.slice(0, 3).map((j) => (
            <li key={j.inicio}>
              <span>
                <strong>
                  {formatarData(j.inicio)} a {formatarData(j.fim)}
                </strong>{' '}
                · {j.dias} dias · {j.pessoas === total ? 'todo mundo pode' : `${j.pessoas} de ${total} podem`}
              </span>
              {euSouAdm && (
                <button type="button" className="botao secundario pequeno" onClick={() => usar(j.inicio, j.fim)}>
                  Usar
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {recado && <p className="form-aviso">{recado}</p>}
      {erro && <p className="form-erro">{erro}</p>}
    </div>
  )
}

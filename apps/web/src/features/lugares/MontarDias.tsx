import { useState } from 'react'
import { Link } from 'react-router'
import { Wand2 } from 'lucide-react'
import { criarEventoDaAgenda, diasDoPeriodo, montarDiasPelosVotos, type Tables } from '@together/core'
import { supabase } from '../../lib/supabase'
import { avisarQueMudou } from '../tempo-real/avisos'
import { diaPorExtenso } from '../agenda/hooks'
import Gaveta from '../../components/ui/Gaveta'
import type { Lugar } from './regras'

// Montar os dias pelos votos (spec 096): propõe o que fazer em cada dia do destino.
// Nada muda até a pessoa tocar "Pôr na agenda".
type Props = { viagemId: string; destino: Tables<'destinos'>; lugares: Lugar[] }
export default function MontarDias({ viagemId, destino, lugares }: Props) {
  const [aberto, setAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [feito, setFeito] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const candidatos = lugares.filter((l) => !l.visitadoEm && l.tipo !== 'guarda_volumes')
  if (!destino.chegada || candidatos.length < 2) return null

  const dias = diasDoPeriodo(destino.chegada, destino.saida ?? destino.chegada)
  const proposta = montarDiasPelosVotos(
    dias,
    candidatos.map((l) => ({
      id: l.id,
      nome: l.nome,
      tipo: l.tipo,
      votos: l.votos.length,
      prioridades: l.prioridades?.length ?? 0,
      latitude: l.latitude,
      longitude: l.longitude,
      endereco: l.endereco,
    })),
  )

  async function aplicar() {
    setErro(null)
    setSalvando(true)
    try {
      for (const d of proposta.dias) {
        for (const i of d.itens) {
          await criarEventoDaAgenda(supabase, viagemId, { dia: d.dia, hora: i.hora || null, titulo: i.nome, local: i.local, observacao: 'Montado pelos votos' })
        }
      }
      avisarQueMudou('eventos_agenda')
      setFeito(true)
    } catch (e) {
      console.error('Erro ao pôr na agenda:', e)
      setErro('Não deu pra pôr tudo na agenda. Confira na Agenda o que entrou.')
    }
    setSalvando(false)
  }

  return (
    <>
      <button type="button" className="botao-texto montar-dias-botao" onClick={() => setAberto(true)}>
        <Wand2 size={15} aria-hidden="true" /> Montar os dias pelos votos
      </button>
      {aberto && (
        <Gaveta titulo={`Dias em ${destino.nome}`} aoFechar={() => !salvando && (setAberto(false), setFeito(false))}>
          {feito ? (
            <div className="form">
              <p>Pronto: está na Agenda. Dá pra mudar a hora ou apagar qualquer item lá.</p>
              <div className="form-rodape">
                <Link to="../agenda" className="botao">
                  Abrir a Agenda
                </Link>
              </div>
            </div>
          ) : (
            <div className="form">
              <p className="form-dica">Quem “não abre mão” primeiro, depois os mais curtidos. Lugares perto ficam no mesmo dia. É só uma proposta.</p>
              {proposta.dias.map((d) => (
                <section key={d.dia} className="montar-dia">
                  <h3>{diaPorExtenso(d.dia)}</h3>
                  <ul>
                    {d.itens.map((i) => (
                      <li key={i.lugarId}>
                        <span className="montar-hora">{i.hora || '—'}</span> {i.nome}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
              {proposta.sobraram.length > 0 && <p className="form-dica">Não couberam: {proposta.sobraram.join(', ')}.</p>}
              {erro && (
                <p className="form-erro" role="alert">
                  {erro}
                </p>
              )}
              <div className="form-rodape">
                <button type="button" className="botao secundario" onClick={() => setAberto(false)} disabled={salvando}>
                  Descartar
                </button>
                <button type="button" className="botao" onClick={aplicar} disabled={salvando}>
                  {salvando ? 'Pondo…' : 'Pôr na agenda'}
                </button>
              </div>
            </div>
          )}
        </Gaveta>
      )}
    </>
  )
}

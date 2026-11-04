import { useState } from 'react'
import { Bus, Car, CircleCheck, FileText, ListChecks, MapPin, Plane, Ticket, TrainFront } from '../../components/ui/icones'
import { registrarChegada, type ItemDoPlano, type Movimento } from '@together/core'
import { supabase } from '../../lib/supabase'
import { marcarVisitado } from '../lugares/api'
import BotaoIr from '../../components/ui/BotaoIr'
import Cartao from '../../components/ui/Cartao'
import './reservas.css'

// Spec 120a: as reservas do grupo no "Hoje". Os trajetos de hoje viram bilhetes
// (inspiração: boarding-pass-stack, docs/design/REFERENCIAS-PASSAPORTE.md).
const ICONE_DO_MEIO = { aviao: Plane, onibus: Bus, carro: Car, trem: TrainFront } as Record<string, typeof Plane>

export function QuemChegaESai({ movimentos, linkDoCofre }: { movimentos: Movimento[]; linkDoCofre: (trajetoId: string) => string | null }) {
  if (movimentos.length === 0) return null
  return (
    <section className="hoje-bilhetes" aria-label="Quem chega e quem sai hoje">
      <h2>
        <Plane size={18} aria-hidden="true" /> Quem chega e quem sai hoje
      </h2>
      {movimentos.map((m) => {
        const Icone = ICONE_DO_MEIO[m.meio] ?? Ticket
        const reserva = linkDoCofre(m.trajetoId) ?? m.linkReserva
        return (
          <article key={m.chave} className="bilhete">
            <div className="bilhete-topo">
              <span className="bilhete-icone">
                <Icone size={19} aria-hidden="true" />
              </span>
              <div className="bilhete-rota">
                <span className={`bilhete-rotulo ${m.tipo}`}>{m.tipo === 'chega' ? 'Chega hoje' : 'Sai hoje'}</span>
                <strong>
                  {m.de} → {m.para}
                </strong>
              </div>
              <span className="bilhete-hora">{m.hora}</span>
            </div>
            <div className="bilhete-picote" aria-hidden="true" />
            <div className="bilhete-baixo">
              <div>
                <small>{[m.saiAs ? `sai ${m.saiAs}` : null, m.chegaAs ? `chega ${m.chegaAs}` : null].filter(Boolean).join(' · ')}</small>
                <p>{m.pessoas.length ? m.pessoas.join(', ') : 'O comboio inteiro'}</p>
              </div>
              {reserva && (
                <a href={reserva} target="_blank" rel="noreferrer noopener" className="botao secundario bilhete-reserva">
                  <FileText size={15} aria-hidden="true" /> Ver reserva
                </a>
              )}
            </div>
          </article>
        )
      })}
    </section>
  )
}

// Plano do dia: os lugares do roteiro de hoje e a agenda, cada um com "Ir" e "Cheguei"
export function PlanoDoDia({ viagemId, plano, podeChegar }: { viagemId: string; plano: ItemDoPlano[]; podeChegar: boolean }) {
  const [chegamos, setChegamos] = useState<Set<string>>(() => new Set())

  // Avisa o grupo (chegadas, spec 051) e marca o lugar como visitado. O carimbo (118a) entra na 120c.
  async function cheguei(item: ItemDoPlano) {
    setChegamos((s) => new Set(s).add(item.chave))
    try {
      await registrarChegada(supabase, viagemId, item.titulo)
      if (item.lugarId) await marcarVisitado(item.lugarId, true)
    } catch (e) {
      console.error('Erro ao registrar a chegada:', e)
      setChegamos((s) => {
        const n = new Set(s)
        n.delete(item.chave)
        return n
      })
    }
  }

  return (
    <Cartao titulo="Plano do dia" icone={ListChecks}>
      {plano.length === 0 ? (
        <p className="dica">Nada no roteiro de hoje. Montem o dia em Explorar.</p>
      ) : (
        <ul className="hoje-plano">
          {plano.map((item) => {
            const chegou = item.visitado || chegamos.has(item.chave)
            return (
              <li key={item.chave}>
                <span className="hoje-plano-hora">{item.hora || '—'}</span>
                <div className="hoje-plano-corpo">
                  <strong>{item.titulo}</strong>
                  {item.detalhe && <small>{item.detalhe}</small>}
                  <div className="hoje-plano-acoes">
                    <BotaoIr alvo={item.alvo} />
                    {chegou ? (
                      <span className="hoje-plano-chegou">
                        <CircleCheck size={15} aria-hidden="true" /> Chegamos
                      </span>
                    ) : (
                      podeChegar && (
                        <button type="button" className="botao hoje-plano-cheguei" onClick={() => void cheguei(item)}>
                          <MapPin size={15} aria-hidden="true" /> Cheguei
                        </button>
                      )
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Cartao>
  )
}

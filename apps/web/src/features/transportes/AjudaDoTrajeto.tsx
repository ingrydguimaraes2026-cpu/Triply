import { useState } from 'react'
import {
  REFERENCIA_DOS_PRECOS,
  TEMPOS_ATE_O_EMBARQUE,
  diaNoFuso,
  formatarDinheiro,
  horaNoFuso,
  linkDoCaminho,
  linksDoTrecho,
  transferDividido,
  type Aeroporto,
  type HoraDeSair,
} from '@together/core'
import { Clock, Navigation, Users } from '../../components/ui/icones'
import './ajuda-do-trajeto.css'

// Spec 121 (etapa 1), espelho de apps/mobile/src/ui/AjudaDoTrajeto.tsx: "saia às X", dividir o carro,
// do aeroporto até a casa e os links do trecho sem deslocamento. A conta fica no core (como-ir.ts).
// O tempo escolhido à mão fica em temposAteOEmbarque.ts.
// 30 → "30 min", 90 → "1h30", 180 → "3 h"
function duracao(m: number) {
  if (m < 60) return `${m} min`
  return m % 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}` : `${m / 60} h`
}

// "Saia da casa às 05:35" (ou as opções de tempo, quando a tabela não sabe)
export function SaiaAs({ saida, partida, aoEscolher }: { saida: HoraDeSair | null; partida: string; aoEscolher: (minutos: number) => void }) {
  const [trocando, setTrocando] = useState(false)
  if (saida && !trocando) {
    const outroDia = diaNoFuso(saida.instante) !== diaNoFuso(partida)
    return (
      <div className="aj-faixa">
        <Clock size={16} aria-hidden="true" />
        <p>
          Saia da casa às <b>{horaNoFuso(saida.instante)}</b>
          {outroDia ? ' do dia anterior' : ''}
          <span className="aj-suave">
            {' '}
            · {duracao(saida.antecedencia)} de antecedência + {duracao(saida.ateOEmbarque)} até lá
          </span>
        </p>
        <button type="button" className="aj-mudar" onClick={() => setTrocando(true)} aria-label="Mudar o tempo até o embarque">
          Mudar
        </button>
      </div>
    )
  }
  return (
    <div className="aj-tempos">
      <p>Quanto tempo da casa até o embarque? O app calcula a hora de sair.</p>
      <div className="aj-opcoes">
        {TEMPOS_ATE_O_EMBARQUE.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              aoEscolher(m)
              setTrocando(false)
            }}
          >
            {duracao(m)}
          </button>
        ))}
      </div>
    </div>
  )
}

// "Do aeroporto até a casa": os jeitos da tabela + "Ver no mapa"
export function DoAeroporto({ aeroporto, ate, nomeDaCasa }: { aeroporto: Aeroporto; ate: string; nomeDaCasa: string | null }) {
  return (
    <div className="aj-aeroporto">
      <b>
        De {aeroporto.nome} ({aeroporto.codigo}) até {nomeDaCasa ?? 'o centro'}
      </b>
      {aeroporto.jeitos.map((x) => (
        <div key={x.nome} className="aj-jeito">
          <span>{x.nome}</span>
          <small>
            {x.minutos} min · ~{formatarDinheiro(x.preco, x.moeda)}
          </small>
        </div>
      ))}
      <small className="aj-suave">Preço aproximado ({REFERENCIA_DOS_PRECOS}). Confira antes.</small>
      <BotaoLink titulo="Ver no mapa" url={linkDoCaminho(`${aeroporto.nome} ${aeroporto.codigo}`, ate)} />
    </div>
  )
}

// "Bia chega 40 min depois: dividam o táxi (~€27,50 cada)"
export function DividirTransfer({ nomes, minutos, aeroporto, pessoas }: { nomes: string[]; minutos: number; aeroporto: Aeroporto | null; pessoas: number }) {
  const parte = transferDividido(aeroporto, pessoas)
  const quando = minutos === 0 ? 'no mesmo horário' : `${Math.abs(minutos)} min ${minutos > 0 ? 'depois' : 'antes'}`
  return (
    <div className="aj-faixa">
      <Users size={16} aria-hidden="true" />
      <p>
        <b>{nomes.join(', ')}</b> {nomes.length > 1 ? 'chegam' : 'chega'} {quando}
        {aeroporto ? ` em ${aeroporto.codigo}` : ''}. Dá pra ir junto{parte ? ` e dividir o carro: ~${formatarDinheiro(parte.preco, parte.moeda)} cada` : ''}.
      </p>
    </div>
  )
}

// Trecho do roteiro sem deslocamento: links pra descobrir como ir + criar o deslocamento
export function ComoIrNoTrecho({ de, para, data, aoAdicionar }: { de: string; para: string; data: string | null; aoAdicionar?: () => void }) {
  return (
    <div className="aj-trecho">
      <b>
        {de} → {para}
      </b>
      <small className="aj-suave">Ainda sem trajeto. Veja como dá pra ir:</small>
      <div className="aj-opcoes">
        {linksDoTrecho(de, para, data).map((l) => (
          <BotaoLink key={l.chave} titulo={l.nome} url={l.url} />
        ))}
        {aoAdicionar && (
          <button type="button" className="aj-adicionar" onClick={aoAdicionar}>
            Adicionar deslocamento
          </button>
        )}
      </div>
    </div>
  )
}

function BotaoLink({ titulo, url }: { titulo: string; url: string }) {
  return (
    <a className="aj-link" href={url} target="_blank" rel="noreferrer">
      <Navigation size={14} aria-hidden="true" /> {titulo}
    </a>
  )
}

import { useState } from 'react'
import { ExternalLink, Pencil, Plus, Route } from '../../components/ui/icones'
import { chegadasPorPessoa, linkDoCaminho, meioComCaminho, type Tables } from '@together/core'
import { supabase } from '../../lib/supabase'
import BotaoIr from '../../components/ui/BotaoIr'
import { meio, type Trajeto } from './api'
import { hora } from './avisos'
import type { Membro } from '../viagens/hooks'
import { formatarData } from '../../lib/datas'

// Spec 121a: "Chegadas e saídas". Uma linha por pessoa com o voo/ônibus de ida e de volta.
// Cada um lança o seu; quem não lançou aparece como "falta". Chegada de outra pessoa tem "Eu busco".
type Props = {
  trajetos: Trajeto[]
  membros: Membro[]
  destinos: Tables<'destinos'>[]
  meuId: string
  euSouAdm: boolean
  aoAdicionar: (tipo: 'chegada' | 'saida') => void
  aoEditar: (t: Trajeto) => void
  aoMudar: () => void
}

export default function ChegadasESaidas({ trajetos, membros, destinos, meuId, euSouAdm, aoAdicionar, aoEditar, aoMudar }: Props) {
  const pessoas = chegadasPorPessoa(trajetos, membros).sort(
    (a, b) => Number(b.id === meuId) - Number(a.id === meuId) || Number(!!b.chegada) - Number(!!a.chegada),
  )
  return (
    <section className="hosp-painel chegadas" aria-label="Chegadas e saídas">
      <header className="hosp-painel-topo">
        <div>
          <h2>Chegadas e saídas</h2>
          <p>Como cada um chega e vai embora. Cada um lança o seu: manda o print no app ou preenche aqui.</p>
        </div>
      </header>
      <ul className="chegadas-lista">
        {pessoas.map((p) => {
          const souEu = p.id === meuId
          const nome = souEu ? 'Você' : p.nome.split(' ')[0]
          return (
            <li key={p.id} className="chegadas-pessoa">
              <strong>{nome}</strong>
              {(['chegada', 'saida'] as const).map((como) => {
                const t = p[como]
                const rotulo = como === 'chegada' ? 'Chega' : 'Volta'
                if (t)
                  return (
                    <Bilhete
                      key={como}
                      rotulo={rotulo}
                      trajeto={t}
                      destinos={destinos}
                      membros={membros}
                      meuId={meuId}
                      podeMexer={euSouAdm || t.criado_por === meuId}
                      aoEditar={() => aoEditar(t)}
                      aoMudar={aoMudar}
                    />
                  )
                return souEu ? (
                  <button key={como} type="button" className="chegadas-falta" onClick={() => aoAdicionar(como)}>
                    <Plus size={14} aria-hidden="true" /> {como === 'chegada' ? 'Falta a sua chegada: adicionar' : 'Falta a sua volta: adicionar'}
                  </button>
                ) : (
                  <small key={como} className="chegadas-ainda">
                    {nome} ainda não pôs a {como === 'chegada' ? 'chegada' : 'volta'}
                  </small>
                )
              })}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function Bilhete({
  rotulo,
  trajeto: t,
  destinos,
  membros,
  meuId,
  podeMexer,
  aoEditar,
  aoMudar,
}: {
  rotulo: string
  trajeto: Trajeto
  destinos: Tables<'destinos'>[]
  membros: Membro[]
  meuId: string
  podeMexer: boolean
  aoEditar: () => void
  aoMudar: () => void
}) {
  const [ocupado, setOcupado] = useState(false)
  const m = meio(t.meio)
  const Icone = m.icone
  const nomeDe = (id: string | null) => destinos.find((d) => d.id === id)?.nome ?? null
  const de = t.estacao_partida ?? nomeDe(t.origem_id) ?? 'De fora'
  const para = t.estacao_chegada ?? nomeDe(t.destino_id) ?? 'Pra casa'
  const ehChegada = t.tipo === 'chegada'
  const euBusco = t.quem_busca_id === meuId
  const quemBusca = membros.find((x) => x.id === t.quem_busca_id)?.nome.split(' ')[0]
  const ehMeu = t.criado_por === meuId || t.passageiros.includes(meuId)

  async function buscar() {
    setOcupado(true)
    const { error } = await supabase.rpc('vou_buscar', { p_trajeto: t.id, p_buscar: !euBusco })
    setOcupado(false)
    if (error) console.error('Erro ao marcar quem busca:', error)
    else aoMudar()
  }

  return (
    <div className="chegadas-bilhete">
      <span className="chegadas-meio">
        <Icone size={16} aria-hidden="true" /> {rotulo} · {m.nome}
        {t.partida && ` · ${formatarData(t.partida.slice(0, 10))}`}
      </span>
      <span className="chegadas-rota">
        {de} {t.partida && <small>{hora(t.partida)}</small>} → {para} {t.chegada && <small>{hora(t.chegada)}</small>}
      </span>
      {t.observacao && <small className="trajeto-obs">{t.observacao}</small>}
      {ehChegada && quemBusca && <small className="chegadas-busca">{euBusco ? 'Você vai buscar' : `${quemBusca} vai buscar`}</small>}
      <span className="chegadas-acoes">
        {t.estacao_partida && <BotaoIr alvo={{ nome: t.estacao_partida, cidade: nomeDe(t.origem_id) }} rotulo="Como chegar na estação" />}
        {meioComCaminho(t.meio) && (
          <a href={linkDoCaminho(de, para)} target="_blank" rel="noreferrer noopener" className="botao-ir">
            <Route size={14} aria-hidden="true" /> Ver o caminho <ExternalLink size={12} aria-hidden="true" />
          </a>
        )}
        {ehChegada && !ehMeu && (
          <button type="button" className="botao-texto" onClick={() => void buscar()} disabled={ocupado}>
            {euBusco ? 'Não vou mais buscar' : 'Eu busco'}
          </button>
        )}
        {podeMexer && (
          <button type="button" className="botao-texto" onClick={aoEditar} aria-label="Editar transporte">
            <Pencil size={14} aria-hidden="true" />
          </button>
        )}
      </span>
    </div>
  )
}

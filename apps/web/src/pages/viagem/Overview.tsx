import { useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ArrowLeft, MoreHorizontal } from '../../components/ui/icones'
import { estadoDosPassos, montarPassos, proximoCarimbo, resumoDasContas, viagemAcontecendo, type DadosDaAbaViagem, type DestinoDoPasso } from '@together/core'
import { hojeTexto } from '../../features/destinos/datas'
import { useAbaAtiva, useViagemAtual, type Membro } from '../../features/viagens/hooks'
import { useAbaViagem } from '../../features/viagens/abaViagem'
import { CarrosselDoRoteiro, Passaporte, ProximoCarimbo, ResumoDasContas, ResumoDasPassagens, Rostos } from '../../features/viagens/SecoesDaViagem'
import CarimbosDaViagem from '../../features/carimbos/CarimbosDaViagem'
import { useCapas } from '../../features/viagens/capas'
import { diasAte, formatarPeriodo } from '../../lib/datas'
import Carregando from '../../components/ui/Carregando'
import ErroNaTela from '../../components/ui/ErroNaTela'
import './abas.css'
import './viagem-tela.css'

// Pra onde leva cada passo do passaporte (no app são telas; aqui, abas da viagem)
const LINK_DO_PASSO: Record<DestinoDoPasso, string> = {
  explorar: 'explorar',
  convidar: 'comboio',
  configuracoes: 'configuracoes',
  hospedagem: 'reservas?parte=hospedagem',
  transportes: 'reservas?parte=transporte',
  contas: 'contas',
}

// Tela da viagem: igual à aba Viagem do app (spec 117, apps/mobile/app/viagem/[id]/(abas)/index.tsx).
// Capa, comboio, próximo carimbo, passaporte, os dias montados, passagens e contas. Nada além disso:
// o resto fica em "Tudo da viagem" (/tudo) e a ordem das cidades em Cidades (/cidades).
export default function Overview() {
  const { viagem, membros, meuId } = useViagemAtual()
  const capa = useCapas([viagem.id])
  const { estado, recarregar } = useAbaViagem(viagem.id)

  // Spec 120a: num dia de viagem, abrir a viagem leva direto pro Hoje (uma vez por aba do navegador).
  // No app a aba Viagem vira o Hoje nessa fase.
  const navegar = useNavigate()
  useEffect(() => {
    if (!viagemAcontecendo([{ dataInicio: viagem.data_inicio, dataFim: viagem.data_fim }], hojeTexto(new Date()))) return
    const chave = `together:hoje-aberto:${viagem.id}`
    try {
      if (sessionStorage.getItem(chave)) return
      sessionStorage.setItem(chave, '1')
    } catch {
      return
    }
    navegar('hoje')
  }, [viagem.id, viagem.data_inicio, viagem.data_fim, navegar])

  // Link antigo de enquete ou ponto de encontro (/viagem/<id>?foco=...): agora eles moram em "Tudo da viagem"
  const [busca] = useSearchParams()
  const ativa = useAbaAtiva()
  const foco = ativa ? busca.get('foco') : null
  useEffect(() => {
    if (foco) navegar(`tudo?foco=${encodeURIComponent(foco)}`, { replace: true })
  }, [foco, navegar])

  // A tela fica guardada ao trocar de aba: ao voltar, busca de novo (votou, lançou gasto, adicionou datas)
  const primeiraVez = useRef(true)
  useEffect(() => {
    if (primeiraVez.current) {
      primeiraVez.current = false
      return
    }
    if (ativa) recarregar()
  }, [ativa, recarregar])

  const faltam = viagem.data_inicio ? diasAte(viagem.data_inicio) : null
  const linha =
    [formatarPeriodo(viagem.data_inicio, viagem.data_fim), faltam != null && faltam > 0 ? `faltam ${faltam} ${faltam === 1 ? 'dia' : 'dias'}` : null].filter(Boolean).join(' · ') ||
    'Sem data ainda'

  return (
    <div className="vg">
      <section className="vg-capa">
        <img src={capa(viagem.id, 1600)} alt="" />
        {/* Como no app: voltar (pras viagens) e "..." (Tudo da viagem) ficam em cima da capa */}
        <Link to="/viagens" className="vg-capa-botao vg-capa-voltar" aria-label="Voltar pras viagens" title="Voltar">
          <ArrowLeft size={20} aria-hidden="true" />
        </Link>
        <Link to="tudo" className="vg-capa-botao vg-capa-mais" aria-label="Tudo da viagem" title="Tudo da viagem">
          <MoreHorizontal size={20} aria-hidden="true" />
        </Link>
        <div className="vg-capa-texto">
          <p>{linha}</p>
          <h1>{viagem.nome}</h1>
        </div>
      </section>

      {estado.status === 'carregando' ? (
        <Carregando texto="Carregando a viagem…" compacto />
      ) : estado.status === 'erro' ? (
        <ErroNaTela titulo="Não deu pra carregar a viagem" aoTentar={recarregar} />
      ) : (
        <Secoes dados={estado.dados} membros={membros} meuId={meuId} moeda={viagem.moeda_principal} recarregar={recarregar} />
      )}
    </div>
  )
}

function Secoes({ dados: d, membros, meuId, moeda, recarregar }: { dados: DadosDaAbaViagem; membros: Membro[]; meuId: string; moeda: string; recarregar: () => void }) {
  const estado = estadoDosPassos(d, meuId)
  const passos = montarPassos(estado)
  const proximo = proximoCarimbo(estado)
  const contas = resumoDasContas(d.gastos, moeda)
  return (
    <div className="vg-corpo">
      <div className="vg-principal">
        <Rostos membros={membros} atividades={d.atividades} vistoEm={d.vistoEm} meuId={meuId} />

        {proximo && <ProximoCarimbo passo={proximo} link={LINK_DO_PASSO[proximo.destino]} opcoes={d.opcoes} membros={membros} meuId={meuId} moeda={moeda} aoMudar={recarregar} />}

        <Passaporte viagemId={d.viagem.id} passos={passos} />

        {/* Spec 118a: os carimbos dos lugares (apagados até a galera chegar lá) */}
        <CarimbosDaViagem />

        <section aria-label="Roteiro">
          <div className="vg-titulo">
            <h2>Roteiro</h2>
            {d.dias.length > 0 && (
              <span>
                {d.dias.length} {d.dias.length === 1 ? 'dia' : 'dias'}
              </span>
            )}
          </div>
          <CarrosselDoRoteiro dias={d.dias} />
        </section>
      </div>

      {/* No computador, passagens e contas ficam ao lado; no celular, embaixo */}
      <div className="vg-lateral">
        <section aria-label="Passagens">
          <div className="vg-titulo">
            <h2>Passagens</h2>
          </div>
          <ResumoDasPassagens passagens={d.passagens} />
        </section>
        <section aria-label="Contas">
          <div className="vg-titulo">
            <h2>Contas</h2>
          </div>
          <ResumoDasContas total={contas.total} meuSaldo={contas.saldos.get(meuId) ?? 0} moeda={moeda} />
        </section>
      </div>
    </div>
  )
}

import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { estadoDosPassos, formatarDinheiro, montarPassos, proximoCarimbo, resumoDasContas, viagemAcontecendo, type DadosDaAbaViagem, type DestinoDoPasso, type NomeDoIcone } from '@together/core'
import { hojeTexto } from '../../features/destinos/datas'
import { useAbaAtiva, useViagemAtual } from '../../features/viagens/hooks'
import { useAbaViagem } from '../../features/viagens/abaViagem'
import { Bilhete, Contagem, ProximoPasso, ResumoDasAbas } from '../../features/viagens/Embarque'
import { codigoDoLugar } from '../../features/viagens/codigoDoLugar'
import CarimbosDaViagem from '../../features/carimbos/CarimbosDaViagem'
import { useCapas } from '../../features/viagens/capas'
import { diasAte, formatarData } from '../../lib/datas'
import Esqueleto from '../../components/ui/Esqueleto'
import ErroNaTela from '../../components/ui/ErroNaTela'
import './abas.css'
import './viagem-tela.css'
import './embarque.css'

// Pra onde leva cada passo do passaporte (no app são telas; aqui, abas da viagem)
const LINK_DO_PASSO: Record<DestinoDoPasso, string> = {
  explorar: 'explorar',
  convidar: 'comboio',
  configuracoes: 'configuracoes',
  hospedagem: 'reservas?parte=hospedagem',
  transportes: 'reservas?parte=transporte',
  contas: 'contas',
}

// Aba Viagem, igual à do app (caminho B "Embarque", 10/11/2026; apps/mobile/app/viagem/[id]/(abas)/index.tsx):
// o bilhete da viagem, quantos dias faltam, UM próximo passo (com o passaporte da galera dentro)
// e o resumo das outras 4 abas com os mesmos nomes e ícones da barra.
// O cabeçalho (viagem, galera, ajustes) e a barra de abas ficam no ViagemLayout.
export default function Overview() {
  const { viagem, meuId, euSouAdm } = useViagemAtual()
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

  // Link antigo de enquete ou ponto de encontro (/viagem/<id>?foco=...): eles moram em "Tudo da viagem"
  const [busca] = useSearchParams()
  const ativa = useAbaAtiva()
  const foco = ativa ? busca.get('foco') : null
  useEffect(() => {
    if (foco) navegar(`tudo?foco=${encodeURIComponent(foco)}`, { replace: true })
  }, [foco, navegar])

  // A tela fica guardada ao trocar de aba: ao voltar, busca de novo (votou, lançou gasto, definiu datas)
  const primeiraVez = useRef(true)
  useEffect(() => {
    if (primeiraVez.current) {
      primeiraVez.current = false
      return
    }
    if (ativa) recarregar()
  }, [ativa, recarregar])

  if (estado.status === 'carregando') return <Esqueleto forma="viagem" />
  if (estado.status === 'erro') return <ErroNaTela titulo="Não deu pra carregar a viagem" aoTentar={recarregar} />
  return <Embarque dados={estado.dados} foto={capa(viagem.id, 600)} meuId={meuId} euSouAdm={euSouAdm} moeda={viagem.moeda_principal} />
}

function Embarque({ dados: d, foto, meuId, euSouAdm, moeda }: { dados: DadosDaAbaViagem; foto: string | undefined; meuId: string; euSouAdm: boolean; moeda: string }) {
  const estado = estadoDosPassos(d, meuId)
  const passos = montarPassos(estado)
  const proximo = proximoCarimbo(estado)
  const contas = resumoDasContas(d.gastos, moeda)
  const { viagem } = d
  const destinos = viagem.destinos
  const faltam = viagem.dataInicio ? diasAte(viagem.dataInicio) : null
  const noites = viagem.dataInicio && viagem.dataFim ? diasAte(viagem.dataFim) - diasAte(viagem.dataInicio) : 0
  const meuSaldo = contas.saldos.get(meuId) ?? 0
  const reservasFeitas = d.passagens.compradas.length
  const ondeFicar = d.opcoes.some((o) => o.escolhida) ? 'onde ficar escolhido' : d.opcoes.length ? 'votando onde ficar' : 'falta onde ficar'
  const resumo: { para: string; icone: NomeDoIcone; titulo: string; linha: string }[] = [
    {
      para: 'roteiro',
      icone: 'roteiro',
      titulo: 'Roteiro',
      linha: d.dias.length ? `${d.dias.length} ${d.dias.length === 1 ? 'dia' : 'dias'} com plano` : d.lugares ? `${d.lugares} ${d.lugares === 1 ? 'lugar salvo' : 'lugares salvos'}` : 'Nada planejado ainda',
    },
    { para: 'reservas', icone: 'hospedagem', titulo: 'Reservas', linha: `${reservasFeitas ? `${reservasFeitas} ${reservasFeitas === 1 ? 'passagem comprada' : 'passagens compradas'}` : 'Nenhuma passagem'}, ${ondeFicar}` },
    {
      para: 'contas',
      icone: 'contas',
      titulo: 'Contas',
      linha: !d.gastos.length ? 'Nenhum gasto ainda' : Math.abs(meuSaldo) < 0.01 ? 'Você está em dia' : meuSaldo > 0 ? `A galera te deve ${formatarDinheiro(meuSaldo, moeda)}` : `Você deve ${formatarDinheiro(-meuSaldo, moeda)}`,
    },
    { para: 'fotos', icone: 'fotos', titulo: 'Fotos', linha: d.fotos ? `${d.fotos} ${d.fotos === 1 ? 'foto' : 'fotos'} da galera` : 'Nenhuma foto ainda' },
  ]

  return (
    <div className="eb">
      <Bilhete
        foto={foto}
        de={destinos.length > 1 ? codigoDoLugar(destinos[0]) : 'IDA'}
        para={codigoDoLugar(destinos[destinos.length - 1] ?? viagem.nome)}
        data={viagem.dataInicio ? formatarData(viagem.dataInicio).toUpperCase() : 'SEM DATA'}
        noites={noites > 0 ? `${noites} ${noites === 1 ? 'NOITE' : 'NOITES'}` : ''}
        pessoas={viagem.membros.map((m) => m.nome)}
        link="roteiro"
      />
      <Contagem faltam={faltam} destino={destinos[0] ?? viagem.nome} podeDefinir={euSouAdm} />
      <ProximoPasso viagemId={viagem.id} passos={passos} proximo={proximo} link={proximo ? LINK_DO_PASSO[proximo.destino] : ''} />
      <ResumoDasAbas itens={resumo} />
      {/* Spec 118a: os carimbos dos lugares (apagados até a galera chegar lá) */}
      <div className="eb-entra" style={{ ['--i' as string]: 3 }}>
        <CarimbosDaViagem />
      </div>
    </div>
  )
}

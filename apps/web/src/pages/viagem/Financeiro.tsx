import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowLeftRight, ArrowRight, Banknote, BarChart3, CalendarClock, CheckCheck, ChevronDown, Coins, Download, Receipt, Send, Settings2, UserRound, Wallet } from '../../components/ui/icones'
import { CONGELADO, gastosEmCsv, gastosParaSplitwise, lerFraseDeGasto, nomeDoArquivoIcs } from '@together/core'
import { baixarArquivo } from '../../lib/baixar'
import MeuOrcamento from '../../features/orcamento-pessoal/MeuOrcamento'
import APagar from '../../features/previstos/APagar'
import Relatorio from '../../features/financeiro/Relatorio'
import { dinheiroNaMao, relatorio } from '@together/core'
import { useViagemAtual, type Membro } from '../../features/viagens/hooks'
import { useCarteira } from '../../features/carteira/hooks'
import { useFinanceiro, nomeDaPessoa } from '../../features/financeiro/hooks'
import { calcularAcertos, calcularSaldos, totalPorMoeda, type Acerto } from '@together/core'
import { CATEGORIAS, categoria } from '../../features/financeiro/categorias'
import { formatarDinheiro } from '@together/core'
import type { DadosDoGasto, Gasto } from '../../features/financeiro/api'
import FormGasto from '../../features/financeiro/FormGasto'
import FormOrcamento from '../../features/financeiro/FormOrcamento'
import FormCambio from '../../features/cambio/FormCambio'
import TermometroCambio from '../../features/cambio/TermometroCambio'
import Carteira from '../../features/carteira/Carteira'
import { ligarAoGasto, type Movimento } from '../../features/carteira/api'
import { cotacoesDeHoje, type CompraDeMoeda } from '../../features/cambio/api'
import { comparacaoComHoje, converter, mediasPorPar, montarTaxas } from '../../features/cambio/cotacao'
import { formatarData } from '../../lib/datas'
import { useFocoDeItem } from '../../lib/foco'
import Avatar from '../../components/ui/Avatar'
import BotaoCompartilhar from '../../components/ui/BotaoCompartilhar'
import ComentariosDoItem from '../../features/comentarios/ComentariosDoItem'
import { useContagemDeComentarios } from '../../features/comentarios/hooks'
import CabecalhoPagina from '../../components/ui/CabecalhoPagina'
import Cartao from '../../components/ui/Cartao'
import Carregando from '../../components/ui/Carregando'
import ErroNaTela from '../../components/ui/ErroNaTela'
import Gaveta from '../../components/ui/Gaveta'
import './abas.css'
import './financeiro.css'

type Janela =
  | { tipo: 'gasto'; gasto?: Gasto; movimento?: Movimento; inicial?: Partial<DadosDoGasto> }
  | { tipo: 'orcamento' }
  | { tipo: 'cambio'; compra?: CompraDeMoeda }
  | null

const cotacaoTexto = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const NOMES_DAS_MOEDAS: Record<string, string> = { EUR: 'Euro', USD: 'Dólar', GBP: 'Libra', CHF: 'Franco', ARS: 'Peso', JPY: 'Iene' }
const nomeDaMoeda = (m: string) => NOMES_DAS_MOEDAS[m] ?? m

// "€ 320,00 + R$ 150,00"
function totaisSeparados(totais: Record<string, number>, moedaPrincipal: string) {
  const moedas = Object.keys(totais).sort((a, b) => (a === moedaPrincipal ? -1 : b === moedaPrincipal ? 1 : a.localeCompare(b)))
  return moedas.map((m) => formatarDinheiro(totais[m], m)).join(' + ')
}

// Contas (specs 002, 003 e 117): no estilo da aba Contas do app.
// Em cima o meu saldo grande, no meio os gastos como conversa e embaixo a barra pra lançar ("jantar 84").
// Orçamento, câmbio, carteira e o resto ficam num painel: do lado no computador, dobrado no celular.
export default function Financeiro() {
  const { viagem, membros, meuId, euSouAdm } = useViagemAtual()
  useFocoDeItem() // destaca o gasto quando se chega por um link de compartilhar
  const comentarios = useContagemDeComentarios(viagem.id)
  const moeda = viagem.moeda_principal
  const { estado, recarregar } = useFinanceiro(viagem.id, membros)
  // Carteira de euro (spec 015): só busca quando a viagem é em euro
  const { estado: carteira, recarregar: recarregarCarteira } = useCarteira(viagem.id, meuId, moeda === 'EUR')
  const meuEuro = carteira.status === 'pronto' && carteira.carteira ? carteira.carteira.saldo_atual : null
  const [janela, setJanela] = useState<Janela>(null)
  const [filtro, setFiltro] = useState<string | null>(null) // categoria
  const [soPessoais, setSoPessoais] = useState(false)
  const [painelAberto, setPainelAberto] = useState(false) // só vale no celular: no computador o painel fica sempre aberto
  const [hoje, setHoje] = useState<Record<string, number> | null | undefined>(undefined) // undefined = carregando

  const dados = estado.status === 'pronto' ? estado.dados : null

  // Moedas que precisam de cotação (gastos em outra moeda, moedas usadas pra comprar a da viagem
  // e o real, pra mostrar "Euro hoje R$ 6,30" no saldo como no app)
  const moedasUsadas = useMemo(() => {
    if (!dados) return ''
    return [...new Set(['BRL', ...dados.gastos.map((g) => g.moeda), ...dados.compras.map((c) => c.moeda_origem)])]
      .filter((m) => m !== moeda)
      .sort()
      .join(',')
  }, [dados, moeda])

  useEffect(() => {
    if (!dados) return
    let ativo = true
    cotacoesDeHoje(moeda, moedasUsadas ? moedasUsadas.split(',') : []).then((taxas) => {
      if (ativo) setHoje(taxas)
    })
    return () => {
      ativo = false
    }
  }, [dados, moeda, moedasUsadas])

  const contas = useMemo(() => {
    if (!dados) return null
    const compras = dados.compras.map((c) => ({
      moedaOrigem: c.moeda_origem,
      moedaDestino: c.moeda_destino,
      valorOrigem: c.valorOrigem,
      valorDestino: c.valorDestino,
    }))
    const taxas = montarTaxas(compras, moeda, hoje ?? {})
    const doComboio = dados.gastos.filter((g) => !g.pessoal)
    const pessoais = dados.gastos.filter((g) => g.pessoal)

    const semCotacao = new Set<string>()
    const emMoedaDaViagem = (g: Gasto) => {
      const v = converter(g.valor, g.moeda, moeda, taxas)
      if (v === null) semCotacao.add(g.moeda)
      return v ?? 0
    }
    const gastoComboio = doComboio.reduce((s, g) => s + emMoedaDaViagem(g), 0)
    const gastoPessoal = pessoais.reduce((s, g) => s + emMoedaDaViagem(g), 0)
    // Spec 056: minha parte nos gastos do comboio (convertida pra moeda da viagem)
    const minhaParte = doComboio.reduce((s, g) => {
      const parte = g.divisoes.find((d) => d.usuarioId === meuId)?.valor ?? 0
      return s + (parte ? (converter(parte, g.moeda, moeda, taxas) ?? 0) : 0)
    }, 0)
    const porCategoria: Record<string, number> = {}
    for (const g of doComboio) porCategoria[g.categoria] = (porCategoria[g.categoria] ?? 0) + emMoedaDaViagem(g)

    const pares = mediasPorPar(compras).filter((p) => p.destino === moeda)
    const parPrincipal = pares.sort((a, b) => b.totalDestino - a.totalDestino)[0] ?? null

    const paraConta = dados.gastos.map((g) => ({ pagoPor: g.pago_por, moeda: g.moeda, valor: g.valor, pessoal: g.pessoal, divisoes: g.divisoes }))

    return {
      gastoComboio,
      gastoPessoal,
      meuGasto: minhaParte + gastoPessoal,
      porCategoria,
      semCotacao: [...semCotacao],
      parPrincipal,
      orcamentoTotal: dados.orcamentos.reduce((s, o) => s + o.meta, 0),
      acertos: calcularAcertos(paraConta),
      // Saldo de cada um na moeda da viagem (positivo = recebe), pro saldo grande do topo
      saldos: calcularSaldos(paraConta).get(moeda) ?? new Map<string, number>(),
      totaisComboio: totalPorMoeda(doComboio),
      // Spec 082: relatórios na moeda da viagem
      relatorio: relatorio(
        doComboio.map((g) => ({
          data: g.data,
          valor: emMoedaDaViagem(g),
          pago_por: g.pago_por,
          divisoes: g.divisoes.map((d) => ({ usuarioId: d.usuarioId, valor: converter(d.valor, g.moeda, moeda, taxas) ?? 0 })),
        })),
        membros.length,
      ),
    }
  }, [dados, moeda, hoje, meuId, membros.length])

  const meuDinheiro = dados ? dinheiroNaMao(dados.compras, dados.gastos, meuId) : [] // spec 083
  const nome = (id: string) => nomeDaPessoa(id, membros, dados?.exMembros ?? [], meuId)
  const fechar = () => setJanela(null)

  // Gastos filtrados e agrupados por dia, do mais antigo pro mais novo (o mais novo embaixo, como numa conversa)
  const grupos = useMemo(() => {
    if (!dados) return []
    const lista = dados.gastos.filter((g) => (soPessoais ? g.pessoal : true) && (filtro ? g.categoria === filtro : true))
    const porDia = new Map<string, Gasto[]>()
    for (const g of [...lista].reverse()) porDia.set(g.data, [...(porDia.get(g.data) ?? []), g])
    return [...porDia]
  }, [dados, filtro, soPessoais])

  // Spec 052: exportar os gastos (planilha em português ou formato do Splitwise)
  function exportar(formato: 'planilha' | 'splitwise') {
    if (!dados) return
    const pessoas = [
      ...membros.map((m) => ({ id: m.id, nome: m.nome })),
      ...dados.exMembros.map((p) => ({ id: p.id, nome: `${p.nome} (ex-membro)` })),
    ]
    // Gasto pessoal dos outros nunca chega aqui (o banco só devolve os meus)
    const base = nomeDoArquivoIcs(viagem.nome).replace(/\.ics$/, '')
    if (formato === 'planilha') {
      baixarArquivo(`${base}-gastos.csv`, gastosEmCsv(dados.gastos, pessoas, (c) => categoria(c).nome), 'text/csv;charset=utf-8')
    } else {
      baixarArquivo(`${base}-splitwise.csv`, gastosParaSplitwise(dados.gastos, pessoas), 'text/csv;charset=utf-8')
    }
  }

  // Barra de baixo (spec 117): a frase ("jantar 84") abre o formulário já preenchido, como no app
  function lancarFrase(frase: string) {
    const texto = frase.trim()
    if (!texto) return setJanela({ tipo: 'gasto' })
    const lida = lerFraseDeGasto(texto, { pessoas: membros, meuId })
    setJanela({
      tipo: 'gasto',
      inicial: {
        descricao: lida.descricao,
        ...(lida.valor ? { valor: lida.valor } : {}),
        ...(lida.moeda ? { moeda: lida.moeda } : {}),
        ...(lida.categoria ? { categoria: lida.categoria } : {}),
        ...(lida.pagoPor ? { pagoPor: lida.pagoPor } : {}),
        pessoal: lida.pessoal,
      },
    })
  }

  const exportarMenu = dados && dados.gastos.length > 0 && (
    <details className="menu-exportar">
      <summary className="botao secundario">
        <Download size={16} aria-hidden="true" /> Exportar
      </summary>
      <div>
        <button type="button" onClick={() => exportar('planilha')}>
          Planilha (Excel, Google Planilhas)
        </button>
        <button type="button" onClick={() => exportar('splitwise')}>
          Formato do Splitwise
        </button>
      </div>
    </details>
  )

  const podeDefinirOrcamento = euSouAdm || viagem.membro_edita_orcamento
  const pctOrcamento = contas && contas.orcamentoTotal ? Math.round((contas.gastoComboio / contas.orcamentoTotal) * 100) : null

  return (
    <>
      <CabecalhoPagina acima={viagem.nome} titulo="Contas" subtitulo={`Quem pagou o quê · em ${moeda}`} acao={exportarMenu || undefined} />

      {estado.status === 'carregando' && <Carregando texto="Somando as contas…" />}
      {estado.status === 'erro' && <ErroNaTela titulo="Não deu pra carregar as contas" aoTentar={recarregar} />}

      {dados && contas && (
        <div className="contas">
          {/* Um número grande: o meu saldo. Tocar mostra quem paga quem e o saldo de cada um */}
          <MeuSaldo
            saldos={contas.saldos}
            acertos={contas.acertos}
            membros={membros}
            meuId={meuId}
            moeda={moeda}
            nome={nome}
            total={contas.gastoComboio}
            cambio={moeda !== 'BRL' ? (hoje?.BRL ?? null) : null}
          />

          {/* Painel: tudo o que não é a conversa. No celular abre e fecha; no computador fica do lado */}
          <aside className={`contas-painel ${painelAberto ? 'aberto' : ''}`} aria-label="Orçamento, câmbio e carteira">
            <button type="button" className="contas-painel-alternar" aria-expanded={painelAberto} onClick={() => setPainelAberto(!painelAberto)}>
              <Wallet size={18} aria-hidden="true" />
              <span>
                <strong>Orçamento, câmbio e carteira</strong>
                <small>
                  {contas.orcamentoTotal
                    ? `${formatarDinheiro(contas.gastoComboio, moeda)} de ${formatarDinheiro(contas.orcamentoTotal, moeda)} · ${pctOrcamento}%`
                    : `Gasto do comboio ${formatarDinheiro(contas.gastoComboio, moeda)}`}
                </small>
              </span>
              <ChevronDown size={18} aria-hidden="true" className="contas-painel-seta" />
            </button>

            <div className="contas-painel-corpo">
              {/* Orçamento do comboio, com o gasto até agora e as categorias */}
              <Cartao
                titulo="Orçamento"
                icone={Wallet}
                acao={
                  podeDefinirOrcamento && (
                    <button type="button" className="botao-texto" onClick={() => setJanela({ tipo: 'orcamento' })}>
                      <Settings2 size={16} aria-hidden="true" /> Definir
                    </button>
                  )
                }
              >
                <p className="numero">
                  {formatarDinheiro(contas.gastoComboio, moeda)}
                  {contas.orcamentoTotal > 0 && <small> de {formatarDinheiro(contas.orcamentoTotal, moeda)}</small>}
                </p>
                {pctOrcamento !== null && (
                  <span className={`painel-barra ${pctOrcamento > 100 ? 'estourou' : pctOrcamento >= 80 ? 'alerta' : ''}`} role="progressbar" aria-valuenow={pctOrcamento} aria-label={`${pctOrcamento}% do orçamento`}>
                    <span style={{ width: `${Math.min(pctOrcamento, 100)}%` }} />
                  </span>
                )}
                <p className="numero-legenda">
                  {Object.keys(contas.totaisComboio).length > 1 && `${totaisSeparados(contas.totaisComboio, moeda)} · `}
                  {pctOrcamento !== null
                    ? `${pctOrcamento}% do orçamento${membros.length > 1 ? ` · ${formatarDinheiro(Math.round(contas.orcamentoTotal / membros.length), moeda)} por pessoa` : ''}`
                    : podeDefinirOrcamento
                      ? 'Defina quanto querem gastar por categoria'
                      : 'O ADM ainda não definiu o orçamento'}
                  {contas.gastoPessoal > 0 && ` · + ${formatarDinheiro(contas.gastoPessoal, moeda)} seus pessoais`}
                </p>
                {contas.semCotacao.length > 0 && <p className="numero-legenda">Sem cotação pra {contas.semCotacao.join(', ')}: esses gastos ficaram fora da soma.</p>}
                <Dobra rotulo="Por categoria">
                  <ul className="categorias">
                    {CATEGORIAS.map(({ chave, nome: nomeCat, icone: Icone }) => {
                      const gasto = contas.porCategoria[chave] ?? 0
                      const meta = dados.orcamentos.find((o) => o.categoria === chave)?.meta ?? 0
                      const pct = meta ? (gasto / meta) * 100 : 0
                      const classe = pct > 100 ? 'estourou' : pct >= 80 ? 'alerta' : ''
                      return (
                        <li key={chave} className={classe}>
                          <span className="categoria-icone">
                            <Icone size={18} aria-hidden="true" />
                          </span>
                          <span className="categoria-nome">{nomeCat}</span>
                          <span
                            className="categoria-barra"
                            role={meta ? 'progressbar' : undefined}
                            aria-valuenow={meta ? Math.round(pct) : undefined}
                            aria-label={meta ? `${nomeCat}: ${Math.round(pct)}% do orçamento` : undefined}
                          >
                            <span style={{ width: `${Math.min(pct, 100)}%` }} />
                          </span>
                          <span className="categoria-valor">
                            {formatarDinheiro(gasto, moeda)}
                            {meta > 0 && <small> de {formatarDinheiro(meta, moeda)}</small>}
                            {pct > 100 && <small className="categoria-estourou">estourou {formatarDinheiro(gasto - meta, moeda)}</small>}
                            {pct >= 80 && pct <= 100 && <small className="categoria-alerta">{Math.round(pct)}% usado</small>}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                  <p className="form-dica">Gastos pessoais não entram no orçamento do comboio.</p>
                </Dobra>
              </Cartao>

              <Cartao titulo="Meu orçamento" icone={UserRound}>
                <MeuOrcamento viagemId={viagem.id} meuId={meuId} moeda={moeda} gasto={contas.meuGasto} inicio={viagem.data_inicio} fim={viagem.data_fim} />
              </Cartao>

              <Cartao titulo="A pagar" icone={CalendarClock}>
                <APagar viagemId={viagem.id} moeda={moeda} membros={membros} meuId={meuId} euSouAdm={euSouAdm} aoLancar={recarregar} />
              </Cartao>

              {/* Spec 083: quanto de dinheiro vivo eu ainda tenho */}
              {meuDinheiro.length > 0 && (
                <Cartao titulo="Dinheiro na mão" icone={Banknote}>
                  <p className="numero">{meuDinheiro.map((d) => formatarDinheiro(d.valor, d.moeda)).join(' + ')}</p>
                  <p className="numero-legenda">Compras em espécie menos o que você pagou em dinheiro</p>
                </Cartao>
              )}

              {/* Carteira de euro por e-mail (Wise/Nomad) e conexão com o Gmail */}
              {moeda === 'EUR' && (
                <Carteira
                  viagemId={viagem.id}
                  meuId={meuId}
                  estado={carteira}
                  recarregar={recarregarCarteira}
                  aoVirarGasto={(m) => setJanela({ tipo: 'gasto', movimento: m })}
                />
              )}

              {/* Câmbio: cotação média e as compras de moeda */}
              <Cartao
                titulo="Câmbio"
                icone={Coins}
                acao={
                  <button type="button" className="botao-texto" onClick={() => setJanela({ tipo: 'cambio' })}>
                    <ArrowLeftRight size={16} aria-hidden="true" /> Registrar compra
                  </button>
                }
              >
                {contas.parPrincipal ? (
                  <>
                    <p className="numero">
                      {contas.parPrincipal.origem} {cotacaoTexto(contas.parPrincipal.media)}
                    </p>
                    <p className="numero-legenda">
                      Quanto vocês pagaram, em média, por 1 {moeda}
                      <br />
                      <Comparacao media={contas.parPrincipal.media} hoje={hoje} origem={contas.parPrincipal.origem} />
                    </p>
                  </>
                ) : (
                  <p className="numero-legenda">Comprou euro, dólar…? Registre aqui pra ver a cotação média de cada um.</p>
                )}
                {dados.compras.length > 0 && (
                  <Dobra rotulo={`Compras de moeda (${dados.compras.length})`}>
                    <ul className="carteiras">
                      {Carteiras(dados.compras).map((c) => (
                        <li key={`${c.usuario}-${c.moeda}`}>
                          <span>{nome(c.usuario)}</span>
                          <span>
                            comprou <strong>{formatarDinheiro(c.total, c.moeda)}</strong>
                            <small>
                              {' '}
                              a {cotacaoTexto(c.media)} {c.origem}
                            </small>
                          </span>
                        </li>
                      ))}
                    </ul>
                    <ul className="compras">
                      {dados.compras.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            disabled={c.usuario_id !== meuId}
                            onClick={() => setJanela({ tipo: 'cambio', compra: c })}
                            aria-label={c.usuario_id === meuId ? 'Editar compra' : undefined}
                          >
                            <span>
                              {formatarDinheiro(c.valorOrigem, c.moeda_origem)} <ArrowRight size={14} aria-hidden="true" />{' '}
                              {formatarDinheiro(c.valorDestino, c.moeda_destino)}
                            </span>
                            <small>
                              {nome(c.usuario_id)} · {formatarData(c.data)} · {cotacaoTexto(c.valorOrigem / c.valorDestino)}
                            </small>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </Dobra>
                )}
              </Cartao>

              {/* Termômetro do câmbio e boletim. congelado pelo RUMO (03/11/2026) */}
              {moeda !== 'BRL' && !CONGELADO.cambioAvancado && (
                <TermometroCambio
                  viagemId={viagem.id}
                  meuId={meuId}
                  moeda={moeda}
                  minhaMedia={(() => {
                    const minhas = dados.compras.filter((c) => c.usuario_id === meuId && c.moeda_origem === 'BRL' && c.moeda_destino === moeda)
                    const destino = minhas.reduce((s, c) => s + c.valorDestino, 0)
                    return destino ? minhas.reduce((s, c) => s + c.valorOrigem, 0) / destino : null
                  })()}
                />
              )}

              {/* Spec 082: relatórios */}
              {contas.relatorio.porDia.length > 0 && (
                <Cartao titulo="Relatórios" icone={BarChart3}>
                  <Dobra rotulo="Ver por dia e por pessoa">
                    <Relatorio relatorio={contas.relatorio} moeda={moeda} nome={nome} />
                  </Dobra>
                </Cartao>
              )}
            </div>
          </aside>

          {/* Os gastos como conversa: os meus à direita, dos outros à esquerda */}
          <section className="contas-conversa" aria-label="Gastos">
            {moeda === 'EUR' && meuEuro != null && (
              <p className="contas-euro">
                <Wallet size={15} aria-hidden="true" /> Euros na sua carteira: {formatarDinheiro(Math.round(meuEuro * 100), 'EUR')}
              </p>
            )}

            {dados.gastos.length > 0 && (
              <div className="filtros" role="group" aria-label="Filtrar gastos">
                <button
                  type="button"
                  className={!filtro && !soPessoais ? 'ativo' : undefined}
                  onClick={() => {
                    setFiltro(null)
                    setSoPessoais(false)
                  }}
                >
                  Todos
                </button>
                <button type="button" className={soPessoais ? 'ativo' : undefined} onClick={() => setSoPessoais(!soPessoais)}>
                  Só meus pessoais
                </button>
                {CATEGORIAS.map((c) => (
                  <button key={c.chave} type="button" className={filtro === c.chave ? 'ativo' : undefined} onClick={() => setFiltro(filtro === c.chave ? null : c.chave)}>
                    {c.nome}
                  </button>
                ))}
              </div>
            )}

            {dados.gastos.length === 0 ? (
              <div className="contas-vazio">
                <Receipt size={32} aria-hidden="true" />
                <h2>Lance o primeiro gasto</h2>
                <p>Escreva aí embaixo, tipo &quot;jantar 84&quot;. A Norti divide na hora.</p>
              </div>
            ) : grupos.length === 0 ? (
              <p className="form-dica">Nenhum gasto com esse filtro.</p>
            ) : (
              grupos.map(([dia, lista]) => (
                <div key={dia} className="conversa-dia">
                  <h3>
                    {formatarData(dia, true)}
                    <span> · {totaisSeparados(totalPorMoeda(lista), moeda)}</span>
                  </h3>
                  <ul>
                    {lista.map((g) => {
                      const meu = g.pago_por === meuId
                      const pagador = membros.find((m) => m.id === g.pago_por)
                      const minhaParte = g.divisoes.find((d) => d.usuarioId === meuId)?.valor
                      return (
                        <li key={g.id} data-foco={g.id} className={`bolha-linha ${meu ? 'minha' : ''}`}>
                          {!meu && <Avatar nome={pagador?.nome ?? nome(g.pago_por)} url={pagador?.avatarUrl} tamanho={28} />}
                          <div className="bolha-pilha">
                            <button type="button" className="bolha" onClick={() => setJanela({ tipo: 'gasto', gasto: g })}>
                              <strong>
                                {meu ? 'Você' : nome(g.pago_por)} pagou {formatarDinheiro(g.valor, g.moeda)} · {g.descricao}
                              </strong>
                              <small>
                                {g.pessoal ? (
                                  <span className="selo-pessoal">só você vê</span>
                                ) : (
                                  <>
                                    {categoria(g.categoria).nome} · dividido em {g.divisoes.length}
                                    {minhaParte ? ` · sua parte ${formatarDinheiro(minhaParte, g.moeda)}` : ''}
                                  </>
                                )}
                                {g.rascunho && <span className="selo-completar">completar</span>}
                              </small>
                            </button>
                            <div className="bolha-acoes">
                              {/* congelado pelo RUMO (03/11/2026): comentários soltos */}
                              {!CONGELADO.comentarios && (
                                <ComentariosDoItem alvo={{ tipo: 'gasto', id: g.id }} titulo={g.descricao} quantidade={comentarios.contagem[g.id]} aoMudar={comentarios.recarregar} />
                              )}
                              {/* Gasto pessoal só você vê: não faz sentido compartilhar */}
                              {!g.pessoal && <BotaoCompartilhar viagemId={viagem.id} item={{ tipo: 'gasto', id: g.id, titulo: g.descricao }} nomeDaViagem={viagem.nome} />}
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))
            )}

            {/* Quem paga quem, como recado do grupo no fim da conversa */}
            {contas.acertos.slice(0, 3).map((a) => (
              <p key={`${a.de}-${a.para}-${a.moeda}`} className="contas-recado">
                <CheckCheck size={14} aria-hidden="true" /> {nome(a.de)} paga {formatarDinheiro(a.valor, a.moeda)} pra {a.para === meuId ? 'você' : nome(a.para)}
              </p>
            ))}
          </section>

          <BarraDeLancar moeda={moeda} aoLancar={lancarFrase} />
        </div>
      )}

      {janela?.tipo === 'gasto' && (
        <Gaveta titulo={janela.gasto ? (janela.gasto.criado_por === meuId ? 'Editar gasto' : janela.gasto.descricao) : 'Lançar gasto'} aoFechar={fechar}>
          <FormGasto
            viagemId={viagem.id}
            moedaViagem={moeda}
            membros={membros}
            meuId={meuId}
            euSouAdm={euSouAdm}
            gasto={janela.gasto}
            inicial={
              janela.movimento
                ? {
                    descricao: janela.movimento.descricao ?? 'Compra no cartão',
                    valor: Math.round(janela.movimento.valor * 100),
                    moeda: janela.movimento.moeda,
                    categoria: 'outros',
                    data: janela.movimento.data.slice(0, 10),
                  }
                : janela.inicial
            }
            aoTerminar={async (idSalvo) => {
              // Spec 084: veio de um movimento da carteira? Liga os dois pra não lançar de novo.
              const mov = janela.movimento
              fechar()
              if (mov && idSalvo) {
                await ligarAoGasto(mov.id, idSalvo).catch((e) => console.error('Erro ao ligar o movimento ao gasto:', e))
                await recarregarCarteira()
              }
            }}
          />
        </Gaveta>
      )}
      {janela?.tipo === 'orcamento' && dados && (
        <Gaveta titulo="Orçamento por categoria" aoFechar={fechar}>
          <FormOrcamento
            viagemId={viagem.id}
            moeda={moeda}
            pessoas={membros.length}
            orcamentos={dados.orcamentos}
            aoTerminar={() => {
              fechar()
              recarregar()
            }}
          />
        </Gaveta>
      )}
      {janela?.tipo === 'cambio' && (
        <Gaveta titulo={janela.compra ? 'Editar compra de moeda' : 'Registrar compra de moeda'} aoFechar={fechar}>
          <FormCambio
            viagemId={viagem.id}
            moedaViagem={moeda}
            compra={janela.compra}
            aoTerminar={() => {
              fechar()
              recarregar()
            }}
          />
        </Gaveta>
      )}
    </>
  )
}

// Abre e fecha um pedaço do painel (categorias, compras, relatórios)
function Dobra({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <details className="painel-dobra">
      <summary>
        {rotulo}
        <ChevronDown size={16} aria-hidden="true" />
      </summary>
      <div>{children}</div>
    </details>
  )
}

// Barra fixa embaixo pra lançar: "€ 0,00 · o que foi?". A frase abre o formulário já preenchido.
function BarraDeLancar({ moeda, aoLancar }: { moeda: string; aoLancar: (frase: string) => void }) {
  const [frase, setFrase] = useState('')
  function enviar(e: FormEvent) {
    e.preventDefault()
    aoLancar(frase)
    setFrase('')
  }
  return (
    <form className="contas-barra" onSubmit={enviar}>
      <button type="button" className="contas-barra-completo" aria-label="Lançar gasto completo" title="Lançar gasto completo" onClick={() => aoLancar('')}>
        <Receipt size={20} aria-hidden="true" />
      </button>
      <input
        value={frase}
        onChange={(e) => setFrase(e.target.value)}
        placeholder={`${formatarDinheiro(0, moeda)} · o que foi?`}
        aria-label="O que foi e quanto custou"
        enterKeyHint="send"
      />
      <button type="submit" className="contas-barra-enviar" aria-label="Lançar">
        <Send size={18} aria-hidden="true" />
      </button>
    </form>
  )
}

// "Hoje está R$ 6,30: compraram 2,9% mais barato"
function Comparacao({ media, hoje, origem }: { media: number; hoje: Record<string, number> | null | undefined; origem: string }) {
  if (hoje === undefined) return <>Buscando a cotação de hoje…</>
  const deHoje = hoje?.[origem]
  if (!deHoje) return <>Cotação de hoje indisponível agora</>
  const pct = comparacaoComHoje(media, deHoje)
  const texto = Math.abs(pct) < 0.1 ? 'igual a hoje' : pct > 0 ? `${pct.toFixed(1).replace('.', ',')}% mais barato` : `${(-pct).toFixed(1).replace('.', ',')}% mais caro`
  return (
    <span className={pct >= 0 ? 'rendendo-bem' : 'rendendo-mal'}>
      Hoje está {cotacaoTexto(deHoje)}: compraram {texto}
    </span>
  )
}

// Quanto cada pessoa comprou de cada moeda, com a média dela
function Carteiras(compras: CompraDeMoeda[]) {
  const mapa = new Map<string, { usuario: string; moeda: string; origem: string; total: number; pago: number }>()
  for (const c of compras) {
    const chave = `${c.usuario_id}|${c.moeda_destino}|${c.moeda_origem}`
    const atual = mapa.get(chave) ?? { usuario: c.usuario_id, moeda: c.moeda_destino, origem: c.moeda_origem, total: 0, pago: 0 }
    atual.total += c.valorDestino
    atual.pago += c.valorOrigem
    mapa.set(chave, atual)
  }
  return [...mapa.values()].map((c) => ({ ...c, media: c.pago / c.total }))
}

// Cartão do topo, igual ao das Contas do app: quanto eu recebo ou devo na moeda da viagem.
// Tocar abre quem paga quem e o saldo de cada um. Acertos em outra moeda aparecem embaixo.
function MeuSaldo({ saldos, acertos, membros, meuId, moeda, nome, total, cambio }: {
  saldos: Map<string, number>
  acertos: Acerto[]
  membros: Membro[]
  meuId: string
  moeda: string
  nome: (id: string) => string
  total: number
  cambio: number | null
}) {
  const [aberto, setAberto] = useState(false)
  const saldo = saldos.get(meuId) ?? 0
  const outras = acertos.filter((a) => (a.de === meuId || a.para === meuId) && a.moeda !== moeda)
  const rotulo = saldo > 0 ? 'Você recebe' : saldo < 0 ? 'Você deve' : 'Tudo certo por aqui'
  const linha = cambio ? `${nomeDaMoeda(moeda)} hoje ${formatarDinheiro(Math.round(cambio * 100), 'BRL')}` : `Total do grupo ${formatarDinheiro(total, moeda)}`

  return (
    <section className={`meu-saldo ${aberto ? 'aberto' : ''}`} aria-label="Meu saldo">
      <button type="button" className="meu-saldo-botao" aria-expanded={aberto} onClick={() => setAberto(!aberto)}>
        <span className="meu-saldo-rotulo">{rotulo}</span>
        <span className="meu-saldo-valor">{formatarDinheiro(Math.abs(saldo), moeda)}</span>
        <span className="meu-saldo-linha">
          <span>{linha}</span>
          <span className="meu-saldo-ver">
            {aberto ? 'Fechar' : 'Quem paga quem'} <ArrowLeftRight size={16} aria-hidden="true" />
          </span>
        </span>
      </button>
      {outras.length > 0 && (
        <p className="meu-saldo-detalhe">
          Em outra moeda:{' '}
          {outras.map((a) => (a.para === meuId ? `${nome(a.de)} te paga ${formatarDinheiro(a.valor, a.moeda)}` : `você paga ${formatarDinheiro(a.valor, a.moeda)} pra ${nome(a.para)}`)).join(' · ')}
        </p>
      )}
      {aberto && (
        <div className="meu-saldo-acertos">
          {acertos.length ? (
            <ul>
              {acertos.map((a) => (
                <li key={`${a.de}-${a.para}-${a.moeda}`}>
                  <strong>{nome(a.de)}</strong> paga <strong>{formatarDinheiro(a.valor, a.moeda)}</strong> pra <strong>{nome(a.para)}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p>Ninguém deve nada a ninguém.</p>
          )}
          <ul className="meu-saldo-pessoas">
            {membros.map((m) => {
              const valor = saldos.get(m.id) ?? 0
              return (
                <li key={m.id}>
                  <Avatar nome={m.nome} url={m.avatarUrl} tamanho={24} />
                  <span>{nome(m.id)}</span>
                  <strong>{valor === 0 ? '—' : `${valor > 0 ? '+' : '−'} ${formatarDinheiro(Math.abs(valor), moeda)}`}</strong>
                </li>
              )
            })}
          </ul>
          <p>
            Total do grupo {formatarDinheiro(total, moeda)}
            {membros.length > 0 && ` · ${formatarDinheiro(Math.round(total / membros.length), moeda)} por pessoa`}
          </p>
        </div>
      )}
    </section>
  )
}

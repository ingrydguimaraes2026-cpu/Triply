import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Coins, Euro, HandCoins, Plus, Receipt, Settings2, Wallet } from 'lucide-react'
import { useViagemAtual } from '../../features/viagens/hooks'
import { useCarteira } from '../../features/carteira/hooks'
import { useFinanceiro, nomeDaPessoa } from '../../features/financeiro/hooks'
import { calcularAcertos, totalPorMoeda } from '@together/core'
import { CATEGORIAS, categoria } from '../../features/financeiro/categorias'
import { formatarDinheiro } from '@together/core'
import type { Gasto } from '../../features/financeiro/api'
import FormGasto from '../../features/financeiro/FormGasto'
import FormOrcamento from '../../features/financeiro/FormOrcamento'
import FormCambio from '../../features/cambio/FormCambio'
import TermometroCambio from '../../features/cambio/TermometroCambio'
import Carteira from '../../features/carteira/Carteira'
import { cotacoesDeHoje, type CompraDeMoeda } from '../../features/cambio/api'
import { comparacaoComHoje, converter, mediasPorPar, montarTaxas } from '../../features/cambio/cotacao'
import { formatarData } from '../../lib/datas'
import Avatar from '../../components/ui/Avatar'
import CabecalhoPagina from '../../components/ui/CabecalhoPagina'
import Cartao from '../../components/ui/Cartao'
import EstadoVazio from '../../components/ui/EstadoVazio'
import Gaveta from '../../components/ui/Gaveta'
import './abas.css'
import './financeiro.css'

type Janela =
  | { tipo: 'gasto'; gasto?: Gasto }
  | { tipo: 'orcamento' }
  | { tipo: 'cambio'; compra?: CompraDeMoeda }
  | null

const cotacaoTexto = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// "€ 320,00 + R$ 150,00"
function totaisSeparados(totais: Record<string, number>, moedaPrincipal: string) {
  const moedas = Object.keys(totais).sort((a, b) => (a === moedaPrincipal ? -1 : b === moedaPrincipal ? 1 : a.localeCompare(b)))
  return moedas.map((m) => formatarDinheiro(totais[m], m)).join(' + ')
}

// Financeiro (specs 002 e 003): gastos, divisão, acertos, orçamento e câmbio.
export default function Financeiro() {
  const { viagem, membros, meuId, euSouAdm } = useViagemAtual()
  const moeda = viagem.moeda_principal
  const { estado, recarregar } = useFinanceiro(viagem.id, membros)
  // Carteira de euro (spec 015): só busca quando a viagem é em euro. O saldo vai no card do topo.
  const { estado: carteira, recarregar: recarregarCarteira } = useCarteira(viagem.id, meuId, moeda === 'EUR')
  const meuEuro = carteira.status === 'pronto' && carteira.carteira ? carteira.carteira.saldo_atual : null
  const [janela, setJanela] = useState<Janela>(null)
  const [filtro, setFiltro] = useState<string | null>(null) // categoria
  const [soPessoais, setSoPessoais] = useState(false)
  const [hoje, setHoje] = useState<Record<string, number> | null | undefined>(undefined) // undefined = carregando

  const dados = estado.status === 'pronto' ? estado.dados : null

  // Moedas que precisam de cotação (gastos em outra moeda e moedas usadas pra comprar a da viagem)
  const moedasUsadas = useMemo(() => {
    if (!dados) return ''
    return [...new Set([...dados.gastos.map((g) => g.moeda), ...dados.compras.map((c) => c.moeda_origem)])]
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
    const porCategoria: Record<string, number> = {}
    for (const g of doComboio) porCategoria[g.categoria] = (porCategoria[g.categoria] ?? 0) + emMoedaDaViagem(g)

    const pares = mediasPorPar(compras).filter((p) => p.destino === moeda)
    const parPrincipal = pares.sort((a, b) => b.totalDestino - a.totalDestino)[0] ?? null

    return {
      gastoComboio,
      gastoPessoal,
      porCategoria,
      semCotacao: [...semCotacao],
      parPrincipal,
      orcamentoTotal: dados.orcamentos.reduce((s, o) => s + o.meta, 0),
      acertos: calcularAcertos(
        dados.gastos.map((g) => ({ pagoPor: g.pago_por, moeda: g.moeda, valor: g.valor, pessoal: g.pessoal, divisoes: g.divisoes })),
      ),
      totaisComboio: totalPorMoeda(doComboio),
    }
  }, [dados, moeda, hoje])

  const nome = (id: string) => nomeDaPessoa(id, membros, dados?.exMembros ?? [], meuId)
  const fechar = () => setJanela(null)

  // Lista de gastos filtrada e agrupada por dia
  const grupos = useMemo(() => {
    if (!dados) return []
    const lista = dados.gastos.filter((g) => (soPessoais ? g.pessoal : true) && (filtro ? g.categoria === filtro : true))
    const porDia = new Map<string, Gasto[]>()
    for (const g of lista) porDia.set(g.data, [...(porDia.get(g.data) ?? []), g])
    return [...porDia]
  }, [dados, filtro, soPessoais])

  const botaoLancar = (
    <button type="button" className="botao" onClick={() => setJanela({ tipo: 'gasto' })}>
      <Plus size={18} aria-hidden="true" /> Lançar gasto
    </button>
  )

  return (
    <>
      <CabecalhoPagina titulo="Financeiro" subtitulo={`Orçamento, quem pagou o quê e câmbio · em ${moeda}`} acao={botaoLancar} />

      {estado.status === 'carregando' && <p className="carregando-texto">Carregando o financeiro…</p>}
      {estado.status === 'erro' && (
        <div className="aviso-erro">
          <p>Não deu pra carregar o financeiro.</p>
          <button type="button" className="botao secundario pequeno" onClick={recarregar}>
            Tentar de novo
          </button>
        </div>
      )}

      {dados && contas && (
        <>
          {/* Os 3 números do topo */}
          <div className="numeros">
            <Cartao
              titulo="Orçamento total"
              icone={Wallet}
              acao={
                euSouAdm && (
                  <button type="button" className="botao-texto" onClick={() => setJanela({ tipo: 'orcamento' })}>
                    <Settings2 size={16} aria-hidden="true" /> Definir
                  </button>
                )
              }
            >
              <p className="numero">{contas.orcamentoTotal ? formatarDinheiro(contas.orcamentoTotal, moeda) : '—'}</p>
              <p className="numero-legenda">
                {contas.orcamentoTotal
                  ? membros.length > 1
                    ? `${formatarDinheiro(Math.round(contas.orcamentoTotal / membros.length), moeda)} por pessoa`
                    : 'Do comboio inteiro'
                  : euSouAdm
                    ? 'Defina quanto querem gastar por categoria'
                    : 'O ADM ainda não definiu'}
              </p>
            </Cartao>
            <Cartao titulo="Gasto até agora" icone={Receipt}>
              <p className="numero">{formatarDinheiro(contas.gastoComboio, moeda)}</p>
              <p className="numero-legenda">
                {Object.keys(contas.totaisComboio).length > 1 && `${totaisSeparados(contas.totaisComboio, moeda)} · `}
                {contas.orcamentoTotal > 0 && `${Math.round((contas.gastoComboio / contas.orcamentoTotal) * 100)}% do orçamento · `}
                {contas.gastoPessoal > 0 ? `+ ${formatarDinheiro(contas.gastoPessoal, moeda)} seus pessoais` : 'Gastos do comboio'}
              </p>
              {contas.semCotacao.length > 0 && (
                <p className="numero-legenda">Sem cotação pra {contas.semCotacao.join(', ')}: esses gastos ficaram fora da soma.</p>
              )}
            </Cartao>
            {moeda === 'EUR' ? (
              // Quanto de euro eu tenho (saldo da carteira, puxado dos e-mails do Wise/Nomad)
              <Cartao titulo="Meu euro" icone={Euro}>
                <p className="numero">{meuEuro != null ? formatarDinheiro(Math.round(meuEuro * 100), 'EUR') : '—'}</p>
                <p className="numero-legenda">
                  {meuEuro != null ? 'na sua conta Wise/Nomad · puxado do e-mail' : 'Conecte o Gmail no card abaixo pra puxar sozinho'}
                </p>
              </Cartao>
            ) : (
              <Cartao
                titulo="Cotação média"
                icone={Coins}
                acao={
                  <button type="button" className="botao-texto" onClick={() => setJanela({ tipo: 'cambio' })}>
                    <Plus size={16} aria-hidden="true" /> Compra
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
                  <>
                    <p className="numero">—</p>
                    <p className="numero-legenda">Registre uma compra de moeda pra ver a média</p>
                  </>
                )}
              </Cartao>
            )}
          </div>

          {/* Termômetro do câmbio: a moeda da viagem está barata ou cara em reais? */}
          {moeda !== 'BRL' && (
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

          {/* Carteira de euro por e-mail (Wise/Nomad) */}
          {moeda === 'EUR' && <Carteira viagemId={viagem.id} meuId={meuId} estado={carteira} recarregar={recarregarCarteira} />}

          {/* Orçamento por categoria */}
          <Cartao titulo="Por categoria">
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
          </Cartao>

          <div className="financeiro-grade">
            {/* Acertos: quem deve pra quem */}
            <Cartao titulo="Acertos" icone={HandCoins}>
              {contas.acertos.length === 0 ? (
                <p className="form-dica">Tudo certo: ninguém deve nada pra ninguém.</p>
              ) : (
                <ul className="acertos">
                  {contas.acertos.map((a) => (
                    <li key={`${a.de}-${a.para}-${a.moeda}`}>
                      <strong>{nome(a.de)}</strong> deve{' '}
                      <strong className="acerto-valor">{formatarDinheiro(a.valor, a.moeda)}</strong> pra <strong>{nome(a.para)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </Cartao>

            {/* Câmbio */}
            <Cartao
              titulo="Câmbio"
              icone={Coins}
              acao={
                <button type="button" className="botao-texto" onClick={() => setJanela({ tipo: 'cambio' })}>
                  <Plus size={16} aria-hidden="true" /> Registrar compra
                </button>
              }
            >
              {dados.compras.length === 0 ? (
                <p className="form-dica">Comprou euro, dólar…? Registre aqui pra ver a cotação média de cada um.</p>
              ) : (
                <>
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
                </>
              )}
            </Cartao>
          </div>

          {/* Lista de gastos */}
          <section className="gastos" aria-label="Gastos">
            <div className="filtros" role="group" aria-label="Filtrar gastos">
              <button type="button" className={!filtro && !soPessoais ? 'ativo' : undefined} onClick={() => {
                  setFiltro(null)
                  setSoPessoais(false)
                }}>
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

            {dados.gastos.length === 0 ? (
              <EstadoVazio
                icone={Receipt}
                titulo="Nenhum gasto ainda"
                texto="Lance o primeiro gasto e o app mostra quem pagou e quanto cada um deve."
                acao={botaoLancar}
              />
            ) : grupos.length === 0 ? (
              <p className="form-dica">Nenhum gasto com esse filtro.</p>
            ) : (
              grupos.map(([dia, lista]) => (
                <div key={dia} className="gastos-dia">
                  <h3>
                    {formatarData(dia, true)}
                    <span>{totaisSeparados(totalPorMoeda(lista), moeda)}</span>
                  </h3>
                  <ul>
                    {lista.map((g) => {
                      const { icone: Icone } = categoria(g.categoria)
                      const pagador = membros.find((m) => m.id === g.pago_por)
                      return (
                        <li key={g.id}>
                          <button type="button" className="gasto" onClick={() => setJanela({ tipo: 'gasto', gasto: g })}>
                            <span className="categoria-icone">
                              <Icone size={18} aria-hidden="true" />
                            </span>
                            <span className="gasto-texto">
                              <strong>{g.descricao}</strong>
                              <small>
                                {g.pessoal ? (
                                  <span className="selo-pessoal">só você vê</span>
                                ) : (
                                  <>
                                    {pagador && <Avatar nome={pagador.nome} url={pagador.avatarUrl} tamanho={18} />} {nome(g.pago_por)} pagou
                                  </>
                                )}
                                {g.rascunho && <span className="selo-completar">completar</span>}
                              </small>
                            </span>
                            <span className="gasto-valor">{formatarDinheiro(g.valor, g.moeda)}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))
            )}
          </section>
        </>
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
            aoTerminar={fechar}
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
          <FormCambio viagemId={viagem.id} moedaViagem={moeda} compra={janela.compra} aoTerminar={() => {
              fechar()
              recarregar()
            }} />
        </Gaveta>
      )}
    </>
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

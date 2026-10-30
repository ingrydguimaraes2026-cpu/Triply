import { useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import Avatar from '../../components/ui/Avatar'
import { hojeTexto } from '../destinos/datas'
import type { Membro } from '../viagens/hooks'
import { conferirDivisao, dividirIgual, dividirPorItens, dividirPorPesos, MEIOS_DE_PAGAMENTO, type Divisao } from '@together/core'
import { supabase } from '../../lib/supabase'
import { cotacoesDeHoje } from '../cambio/api'
import { apagarGasto, avisarQueGastosMudaram, mensagemDeErro, salvarGasto, type DadosDoGasto, type Gasto } from './api'
import { CATEGORIAS, categoria as acharCategoria, moedasDaViagem } from './categorias'
import { formatarDinheiro, lerValor, paraCampo } from '@together/core'
import { lembrarMoeda, ultimaMoeda } from './preferencias'

type Props = {
  viagemId: string
  moedaViagem: string
  membros: Membro[]
  meuId: string
  euSouAdm: boolean
  gasto?: Gasto // editando um gasto que já existe
  inicial?: Partial<DadosDoGasto> // começar já preenchido (ex.: vindo do lançamento rápido)
  aoTerminar: () => void
}

// Formulário completo do gasto (spec 002): valor, descrição, categoria, quem pagou e divisão.
export default function FormGasto({ viagemId, moedaViagem, membros, meuId, euSouAdm, gasto, inicial, aoTerminar }: Props) {
  const base = gasto
    ? {
        id: gasto.id,
        valor: gasto.valor,
        moeda: gasto.moeda,
        descricao: gasto.descricao,
        categoria: gasto.categoria,
        data: gasto.data,
        pagoPor: gasto.pago_por,
        pessoal: gasto.pessoal,
        divisoes: gasto.divisoes,
      }
    : inicial
  const souAutor = !gasto || gasto.criado_por === meuId
  const podeApagar = gasto && (gasto.criado_por === meuId || (euSouAdm && !gasto.pessoal))

  const idsComboio = membros.map((m) => m.id)
  const [valorTexto, setValorTexto] = useState(base?.valor ? paraCampo(base.valor) : '')
  const [moeda, setMoeda] = useState(base?.moeda ?? ultimaMoeda(moedaViagem))
  const [descricao, setDescricao] = useState(gasto?.rascunho ? '' : (base?.descricao ?? ''))
  const [cat, setCat] = useState(base?.categoria ?? 'alimentacao')
  const [data, setData] = useState(base?.data ?? hojeTexto())
  const [pessoal, setPessoal] = useState(base?.pessoal ?? false)
  const [pagoPor, setPagoPor] = useState(base?.pagoPor ?? meuId)
  const [participantes, setParticipantes] = useState<string[]>(() =>
    base?.divisoes?.length ? base.divisoes.map((d) => d.usuarioId).filter((id) => idsComboio.includes(id)) : idsComboio,
  )
  // Divisão igual a partir do que veio do banco? Se os valores não forem iguais, abre "valores diferentes"
  const [diferentesDoBanco] = useState(() => {
    if (!base?.divisoes?.length || !base.valor) return false
    const igual = dividirIgual(base.valor, base.divisoes.map((d) => d.usuarioId), base.pagoPor ?? meuId)
    return igual.some((d, i) => d.valor !== base.divisoes![i].valor)
  })
  // Spec 081: jeito de dividir. Gasto antigo com valores diferentes abre em "valores".
  const [modo, setModo] = useState<'igual' | 'valores' | 'pesos' | 'itens'>(diferentesDoBanco ? 'valores' : 'igual')
  const diferentes = modo === 'valores'
  const [pesos, setPesos] = useState<Record<string, string>>({})
  const [itens, setItens] = useState<{ descricao: string; valor: string; pessoas: string[] }[]>([{ descricao: '', valor: '', pessoas: [] }])
  const [porPessoa, setPorPessoa] = useState<Record<string, string>>(() =>
    Object.fromEntries((base?.divisoes ?? []).map((d) => [d.usuarioId, paraCampo(d.valor)])),
  )
  const [meioPagamento, setMeioPagamento] = useState<string | null>(gasto?.meio_pagamento ?? null) // spec 083
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmandoApagar, setConfirmandoApagar] = useState(false)

  const total = lerValor(valorTexto)
  const ordenados = idsComboio.filter((id) => participantes.includes(id))

  const pesoDe = (id: string) => {
    const n = Number((pesos[id] ?? '1').replace(',', '.'))
    return Number.isFinite(n) && n >= 0 ? n : 0
  }
  const porItens =
    total && modo === 'itens'
      ? dividirPorItens(
          total,
          itens.map((i) => ({ valor: lerValor(i.valor) ?? 0, pessoas: i.pessoas })),
          ordenados,
          pagoPor,
        )
      : null
  const divisoes: Divisao[] = !total
    ? []
    : modo === 'valores'
      ? ordenados.map((usuarioId) => ({ usuarioId, valor: lerValor(porPessoa[usuarioId] ?? '') ?? 0 }))
      : modo === 'pesos'
        ? dividirPorPesos(total, ordenados.map((usuarioId) => ({ usuarioId, peso: pesoDe(usuarioId) })), pagoPor)
        : modo === 'itens'
          ? (porItens?.partes ?? [])
          : dividirIgual(total, ordenados, pagoPor)

  const conferencia = total ? conferirDivisao(total, divisoes) : null

  function alternarParticipante(id: string) {
    setParticipantes((atual) => (atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id]))
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    if (!total || total <= 0) return setErro('Digite um valor maior que zero. Ex.: 12,50')
    if (!pessoal) {
      if (ordenados.length === 0) return setErro('Escolha pelo menos uma pessoa pra dividir.')
      if (!conferencia?.fecha) {
        const falta = conferencia?.falta ?? 0
        return setErro(
          falta > 0
            ? `A divisão não fecha: faltam ${formatarDinheiro(falta, moeda)}.`
            : `A divisão passou do total em ${formatarDinheiro(-falta, moeda)}.`,
        )
      }
    }
    setSalvando(true)
    try {
      const idSalvo = await salvarGasto(viagemId, {
        id: gasto?.id ?? inicial?.id,
        descricao: descricao.trim() || acharCategoria(cat).nome,
        valor: total,
        moeda,
        categoria: cat,
        data,
        pagoPor: pessoal ? meuId : pagoPor,
        pessoal,
        rascunho: false,
        divisoes,
      })
      // Spec 083: meio de pagamento e cotação do dia congelada (quem lançou grava; se falhar, o gasto já foi)
      if (souAutor && (meioPagamento || moeda !== 'BRL')) {
        const taxa = moeda === 'BRL' ? null : (await cotacoesDeHoje('BRL', [moeda]))?.[moeda]
        await supabase
          .from('gastos')
          .update({ meio_pagamento: meioPagamento, ...(taxa ? { cotacao_reais: Math.round((1 / taxa) * 1e6) / 1e6 } : {}) })
          .eq('id', idSalvo)
          .then(({ error }) => error && console.error('Erro ao gravar o meio de pagamento:', error))
      }
      lembrarMoeda(moeda)
      avisarQueGastosMudaram()
      aoTerminar()
    } catch (erro) {
      console.error('Erro ao salvar gasto:', erro)
      setErro(mensagemDeErro(erro, 'Não deu pra salvar o gasto. Tente de novo.'))
      setSalvando(false)
    }
  }

  async function apagar() {
    if (!gasto) return
    setSalvando(true)
    try {
      await apagarGasto(gasto.id)
      avisarQueGastosMudaram()
      aoTerminar()
    } catch (erro) {
      console.error('Erro ao apagar gasto:', erro)
      setErro(mensagemDeErro(erro, 'Não deu pra apagar o gasto.'))
      setSalvando(false)
    }
  }

  const blocoApagar = podeApagar && (
    <div className="form-apagar">
      {confirmandoApagar ? (
        <>
          <p className="form-aviso">Apagar “{gasto!.descricao}”? Ele some da lista e dos acertos.</p>
          <div className="form-rodape">
            <button type="button" className="botao secundario" onClick={() => setConfirmandoApagar(false)} disabled={salvando}>
              Manter
            </button>
            <button type="button" className="botao perigo" onClick={apagar} disabled={salvando}>
              Apagar gasto
            </button>
          </div>
        </>
      ) : (
        <button type="button" className="botao-texto" onClick={() => setConfirmandoApagar(true)}>
          <Trash2 size={16} aria-hidden="true" /> Apagar gasto
        </button>
      )}
    </div>
  )

  // Gasto de outra pessoa: só ver (e o ADM pode apagar)
  if (!souAutor && gasto) {
    const nome = (id: string) => membros.find((m) => m.id === id)?.nome ?? 'Ex-membro'
    return (
      <div className="form">
        <p className="numero">{formatarDinheiro(gasto.valor, gasto.moeda)}</p>
        <p className="form-dica">
          {acharCategoria(gasto.categoria).nome} · pago por {nome(gasto.pago_por)} · lançado por {nome(gasto.criado_por)}
        </p>
        <ul className="divisao-lista">
          {gasto.divisoes.map((d) => (
            <li key={d.usuarioId}>
              <span>{nome(d.usuarioId)}</span>
              <span>{formatarDinheiro(d.valor, gasto.moeda)}</span>
            </li>
          ))}
        </ul>
        <p className="form-dica">Só quem lançou pode editar.</p>
        {erro && <p className="form-erro" role="alert">{erro}</p>}
        {blocoApagar}
      </div>
    )
  }

  return (
    <form className="form" onSubmit={salvar} noValidate>
      <div className="form-campo">
        <label className="form-rotulo" htmlFor="gasto-valor">
          Valor
        </label>
        <div className="valor-grande">
          <input
            id="gasto-valor"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0,00"
            autoFocus
            value={valorTexto}
            onChange={(e) => setValorTexto(e.target.value)}
          />
          <select value={moeda} onChange={(e) => setMoeda(e.target.value)} aria-label="Moeda">
            {moedasDaViagem(moedaViagem, [moeda]).map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-campo">
        <label className="form-rotulo" htmlFor="gasto-descricao">
          Descrição
        </label>
        <input
          id="gasto-descricao"
          placeholder="Ex.: Café da manhã"
          maxLength={200}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />
      </div>

      <div className="form-campo">
        <span className="form-rotulo">Categoria</span>
        <div className="escolhas">
          {CATEGORIAS.map(({ chave, nome, icone: Icone }) => (
            <button key={chave} type="button" aria-pressed={cat === chave} onClick={() => setCat(chave)}>
              <Icone size={20} aria-hidden="true" />
              {nome}
            </button>
          ))}
        </div>
      </div>

      <div className="form-campo">
        <label className="form-rotulo" htmlFor="gasto-data">
          Data
        </label>
        <input id="gasto-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
      </div>

      <label className="interruptor">
        <span>
          <strong>Pessoal (só eu vejo)</strong>
          <small>Comprinhas e gastos que não são divididos</small>
        </span>
        <input type="checkbox" checked={pessoal} onChange={(e) => setPessoal(e.target.checked)} />
      </label>

      <div className="form-campo">
        <span className="form-rotulo">Como pagou? (opcional)</span>
        <div className="modos-divisao">
          {MEIOS_DE_PAGAMENTO.map((m) => (
            <button key={m.chave} type="button" aria-pressed={meioPagamento === m.chave} onClick={() => setMeioPagamento(meioPagamento === m.chave ? null : m.chave)}>
              {m.nome}
            </button>
          ))}
        </div>
      </div>

      {!pessoal && (
        <>
          <div className="form-campo">
            <span className="form-rotulo">Quem pagou?</span>
            <div className="pessoas" role="radiogroup" aria-label="Quem pagou">
              {membros.map((m) => (
                <button key={m.id} type="button" role="radio" aria-pressed={pagoPor === m.id} aria-checked={pagoPor === m.id} onClick={() => setPagoPor(m.id)}>
                  <Avatar nome={m.nome} url={m.avatarUrl} tamanho={32} />
                  {m.id === meuId ? 'Eu' : m.nome.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="form-campo">
            <span className="form-rotulo">Dividir com</span>
            <div className="pessoas">
              {membros.map((m) => (
                <button key={m.id} type="button" aria-pressed={participantes.includes(m.id)} onClick={() => alternarParticipante(m.id)}>
                  <Avatar nome={m.nome} url={m.avatarUrl} tamanho={32} />
                  {m.id === meuId ? 'Eu' : m.nome.split(' ')[0]}
                </button>
              ))}
            </div>
            <div className="modos-divisao" role="radiogroup" aria-label="Como dividir">
              {(
                [
                  ['igual', 'Igual'],
                  ['valores', 'Valores'],
                  ['pesos', 'Pesos'],
                  ['itens', 'Por item'],
                ] as const
              ).map(([chave, nome]) => (
                <button key={chave} type="button" role="radio" aria-checked={modo === chave} aria-pressed={modo === chave} onClick={() => setModo(chave)}>
                  {nome}
                </button>
              ))}
            </div>
            {modo === 'pesos' && <p className="form-dica">Peso 2 = casal (paga dobrado); 0,5 = criança.</p>}
          </div>

          {ordenados.length > 0 && (
            <ul className="divisao-lista">
              {ordenados.map((id) => {
                const m = membros.find((x) => x.id === id)!
                const valor = divisoes.find((d) => d.usuarioId === id)?.valor ?? 0
                return (
                  <li key={id}>
                    <span>{id === meuId ? 'Eu' : m.nome.split(' ')[0]}</span>
                    {diferentes ? (
                      <input
                        inputMode="decimal"
                        aria-label={`Quanto ${m.nome} deve`}
                        placeholder="0,00"
                        value={porPessoa[id] ?? ''}
                        onChange={(e) => setPorPessoa({ ...porPessoa, [id]: e.target.value })}
                      />
                    ) : modo === 'pesos' ? (
                      <span className="divisao-peso">
                        <input
                          inputMode="decimal"
                          aria-label={`Peso de ${m.nome}`}
                          value={pesos[id] ?? '1'}
                          onChange={(e) => setPesos({ ...pesos, [id]: e.target.value })}
                        />
                        <span>{total ? formatarDinheiro(valor, moeda) : '—'}</span>
                      </span>
                    ) : (
                      <span>{total ? formatarDinheiro(valor, moeda) : '—'}</span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
          {modo === 'itens' && (
            <div className="divisao-itens">
              {itens.map((item, i) => (
                <div key={i} className="divisao-item">
                  <input
                    aria-label="O que foi"
                    placeholder="Ex.: pizza"
                    value={item.descricao}
                    onChange={(e) => setItens(itens.map((x, j) => (j === i ? { ...x, descricao: e.target.value } : x)))}
                  />
                  <input
                    aria-label="Valor do item"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={item.valor}
                    onChange={(e) => setItens(itens.map((x, j) => (j === i ? { ...x, valor: e.target.value } : x)))}
                  />
                  <div className="divisao-item-pessoas">
                    {ordenados.map((id) => (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={item.pessoas.includes(id)}
                        onClick={() =>
                          setItens(itens.map((x, j) => (j === i ? { ...x, pessoas: x.pessoas.includes(id) ? x.pessoas.filter((p) => p !== id) : [...x.pessoas, id] } : x)))
                        }
                      >
                        {id === meuId ? 'Eu' : (membros.find((m) => m.id === id)?.nome.split(' ')[0] ?? '?')}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button type="button" className="botao-texto alinhar-inicio" onClick={() => setItens([...itens, { descricao: '', valor: '', pessoas: [] }])}>
                + Item
              </button>
              {porItens && !porItens.passou && porItens.semDono > 0 && (
                <p className="form-dica">{formatarDinheiro(porItens.semDono, moeda)} sem item marcado (serviço, couvert…): dividido igual entre todos.</p>
              )}
              {porItens?.passou && <p className="form-aviso">Os itens somam mais que o total do gasto.</p>}
            </div>
          )}
          {diferentes && conferencia && !conferencia.fecha && (
            <p className="form-aviso">
              {conferencia.falta > 0
                ? `Faltam ${formatarDinheiro(conferencia.falta, moeda)} pra fechar o total.`
                : `Passou ${formatarDinheiro(-conferencia.falta, moeda)} do total.`}
            </p>
          )}
        </>
      )}

      {erro && (
        <p className="form-erro" role="alert">
          {erro}
        </p>
      )}

      <div className="form-rodape">
        <button type="submit" className="botao" disabled={salvando}>
          {salvando ? 'Salvando…' : gasto ? 'Salvar alterações' : 'Lançar gasto'}
        </button>
      </div>
      {blocoApagar}
    </form>
  )
}

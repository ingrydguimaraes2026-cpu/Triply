import { useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import Avatar from '../../components/ui/Avatar'
import { hojeTexto } from '../destinos/datas'
import type { Membro } from '../viagens/hooks'
import { conferirDivisao, dividirIgual, type Divisao } from '@together/core'
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
  const [diferentes, setDiferentes] = useState(() => {
    if (!base?.divisoes?.length || !base.valor) return false
    const igual = dividirIgual(base.valor, base.divisoes.map((d) => d.usuarioId), base.pagoPor ?? meuId)
    return igual.some((d, i) => d.valor !== base.divisoes![i].valor)
  })
  const [porPessoa, setPorPessoa] = useState<Record<string, string>>(() =>
    Object.fromEntries((base?.divisoes ?? []).map((d) => [d.usuarioId, paraCampo(d.valor)])),
  )
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmandoApagar, setConfirmandoApagar] = useState(false)

  const total = lerValor(valorTexto)
  const ordenados = idsComboio.filter((id) => participantes.includes(id))

  const divisoes: Divisao[] = !total
    ? []
    : diferentes
      ? ordenados.map((usuarioId) => ({ usuarioId, valor: lerValor(porPessoa[usuarioId] ?? '') ?? 0 }))
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
      await salvarGasto(viagemId, {
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
            <button type="button" className="botao-texto alinhar-inicio" onClick={() => setDiferentes(!diferentes)}>
              {diferentes ? 'Dividir igual' : 'Valores diferentes'}
            </button>
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
                    ) : (
                      <span>{total ? formatarDinheiro(valor, moeda) : '—'}</span>
                    )}
                  </li>
                )
              })}
            </ul>
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

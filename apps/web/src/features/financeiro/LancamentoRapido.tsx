import { useCallback, useState, type FormEvent } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { hojeTexto } from '../destinos/datas'
import type { Membro } from '../viagens/hooks'
import { dividirIgual } from '@together/core'
import { avisarQueGastosMudaram, mensagemDeErro, salvarGasto, type DadosDoGasto } from './api'
import { CATEGORIAS, categoria as acharCategoria, moedasDaViagem } from './categorias'
import { lerFraseDeGasto, lerValor, paraCampo } from '@together/core'
import { useVoz } from './useVoz'
import './frase-gasto.css'
import { ehErroDeRede, guardarNaFila } from './fila'
import { lembrarMoeda, ultimaMoeda } from './preferencias'

type Props = {
  viagemId: string
  moedaViagem: string
  membros: Membro[]
  meuId: string
  aoTerminar: (mensagem: string) => void
  aoDetalhar: (inicial: Partial<DadosDoGasto>) => void // "mais detalhes": abre o formulário completo
}

// Lançamento rápido (spec 009): valor, categoria, salvar. O resto usa o padrão
// (eu paguei, dividido entre todos, hoje, última moeda) e o gasto fica marcado "completar".
export default function LancamentoRapido({ viagemId, moedaViagem, membros, meuId, aoTerminar, aoDetalhar }: Props) {
  const [valorTexto, setValorTexto] = useState('')
  const [moeda, setMoeda] = useState(() => ultimaMoeda(moedaViagem))
  const [cat, setCat] = useState('alimentacao')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  // Spec 093: o que veio da frase (escrita ou falada)
  const [frase, setFrase] = useState('')
  const [descricao, setDescricao] = useState('')
  const [pagoPor, setPagoPor] = useState(meuId)
  const [pessoal, setPessoal] = useState(false)

  const usarFrase = useCallback(
    (texto: string) => {
      setFrase(texto)
      const g = lerFraseDeGasto(texto, { pessoas: membros, meuId })
      if (g.valor) setValorTexto(paraCampo(g.valor))
      if (g.moeda) setMoeda(g.moeda)
      if (g.categoria) setCat(g.categoria)
      setDescricao(g.descricao)
      setPagoPor(g.pagoPor ?? meuId)
      setPessoal(g.pessoal)
    },
    [membros, meuId],
  )
  const voz = useVoz(usarFrase)

  function montar(): DadosDoGasto & { id: string } {
    const valor = lerValor(valorTexto) ?? 0
    return {
      id: crypto.randomUUID(),
      descricao: descricao || acharCategoria(cat).nome,
      valor,
      moeda,
      categoria: cat,
      data: hojeTexto(),
      // Gasto pessoal é sempre de quem lança
      pagoPor: pessoal ? meuId : pagoPor,
      pessoal,
      rascunho: true,
      divisoes: pessoal ? [{ usuarioId: meuId, valor }] : dividirIgual(valor, membros.map((m) => m.id), pagoPor),
    }
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    const valor = lerValor(valorTexto)
    if (!valor || valor <= 0) return setErro('Digite o valor. Ex.: 12,50')
    const gasto = montar()
    lembrarMoeda(moeda)
    setSalvando(true)
    setErro(null)
    try {
      await salvarGasto(viagemId, gasto)
      avisarQueGastosMudaram()
      aoTerminar('Gasto salvo. Complete os detalhes depois no Financeiro.')
    } catch (erro) {
      if (ehErroDeRede(erro)) {
        guardarNaFila(viagemId, gasto)
        aoTerminar('Sem internet: o gasto ficou guardado no celular e vai sozinho quando a conexão voltar.')
        return
      }
      console.error('Erro no lançamento rápido:', erro)
      setErro(mensagemDeErro(erro, 'Não deu pra salvar. Tente de novo.'))
      setSalvando(false)
    }
  }

  return (
    <form className="form" onSubmit={salvar} noValidate>
      {/* Spec 093: escrever ou falar o gasto */}
      <div className="frase-gasto">
        <input
          type="text"
          autoComplete="off"
          placeholder="Ou escreva: jantar 45,50 a Ingryd pagou"
          aria-label="Gasto em uma frase"
          value={frase}
          onChange={(e) => usarFrase(e.target.value)}
        />
        {voz.disponivel && (
          <button
            type="button"
            className={voz.ouvindo ? 'frase-mic ouvindo' : 'frase-mic'}
            onClick={voz.ouvindo ? voz.parar : voz.ouvir}
            aria-label={voz.ouvindo ? 'Parar de ouvir' : 'Falar o gasto'}
          >
            {voz.ouvindo ? <MicOff size={18} aria-hidden="true" /> : <Mic size={18} aria-hidden="true" />}
          </button>
        )}
      </div>
      {voz.erro && <p className="form-dica">{voz.erro}</p>}
      <div className="valor-grande">
        <input
          inputMode="decimal"
          autoComplete="off"
          placeholder="0,00"
          autoFocus
          aria-label="Valor"
          value={valorTexto}
          onChange={(e) => setValorTexto(e.target.value)}
        />
        <select value={moeda} onChange={(e) => setMoeda(e.target.value)} aria-label="Moeda">
          {moedasDaViagem(moedaViagem, [moeda]).map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className="escolhas" role="group" aria-label="Categoria">
        {CATEGORIAS.map(({ chave, nome, icone: Icone }) => (
          <button key={chave} type="button" aria-pressed={cat === chave} onClick={() => setCat(chave)}>
            <Icone size={20} aria-hidden="true" />
            {nome}
          </button>
        ))}
      </div>

      <p className="form-dica">
        {descricao && <strong>{descricao} · </strong>}
        {pessoal || pagoPor === meuId ? 'Você pagou' : `${membros.find((m) => m.id === pagoPor)?.nome.split(' ')[0] ?? 'Alguém'} pagou`} ·{' '}
        {pessoal ? 'só seu' : 'dividido entre todos'} · hoje
      </p>
      {erro && (
        <p className="form-erro" role="alert">
          {erro}
        </p>
      )}
      <div className="form-rodape">
        <button type="submit" className="botao" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
      <button
        type="button"
        className="botao-texto alinhar-inicio"
        onClick={() => {
          const { rascunho: _r, ...resto } = montar()
          aoDetalhar({ ...resto, valor: lerValor(valorTexto) ?? 0, divisoes: [] })
        }}
      >
        Mais detalhes
      </button>
    </form>
  )
}

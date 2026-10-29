import { useState, type FormEvent } from 'react'
import { hojeTexto } from '../destinos/datas'
import type { Membro } from '../viagens/hooks'
import { dividirIgual } from './acertos'
import { avisarQueGastosMudaram, mensagemDeErro, salvarGasto, type DadosDoGasto } from './api'
import { CATEGORIAS, categoria as acharCategoria, moedasDaViagem } from './categorias'
import { lerValor } from '@together/core'
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

  function montar(): DadosDoGasto & { id: string } {
    const valor = lerValor(valorTexto) ?? 0
    return {
      id: crypto.randomUUID(),
      descricao: acharCategoria(cat).nome,
      valor,
      moeda,
      categoria: cat,
      data: hojeTexto(),
      pagoPor: meuId,
      pessoal: false,
      rascunho: true,
      divisoes: dividirIgual(valor, membros.map((m) => m.id), meuId),
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

      <p className="form-dica">Você pagou · dividido entre todos · hoje</p>
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

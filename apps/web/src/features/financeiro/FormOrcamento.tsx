import { useState, type FormEvent } from 'react'
import { mensagemDeErro, salvarOrcamentos, type Orcamento } from './api'
import { CATEGORIAS } from './categorias'
import { formatarDinheiro, lerValor, paraCampo } from '@together/core'

type Props = {
  viagemId: string
  moeda: string
  pessoas: number
  orcamentos: Orcamento[]
  aoTerminar: () => void
}

// Só o ADM: quanto o comboio quer gastar em cada categoria (spec 003)
export default function FormOrcamento({ viagemId, moeda, pessoas, orcamentos, aoTerminar }: Props) {
  const [valores, setValores] = useState<Record<string, string>>(() =>
    Object.fromEntries(CATEGORIAS.map((c) => [c.chave, paraCampoOuVazio(orcamentos.find((o) => o.categoria === c.chave)?.meta)])),
  )
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const metas = Object.fromEntries(Object.entries(valores).map(([c, v]) => [c, v.trim() ? lerValor(v) : null]))
  const invalida = Object.entries(valores).find(([c, v]) => v.trim() && metas[c] === null)
  const total = Object.values(metas).reduce<number>((s, v) => s + (v ?? 0), 0)

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (invalida) return setErro('Algum valor não está certo. Use só números, ex.: 800 ou 1.200,50')
    setSalvando(true)
    setErro(null)
    try {
      await salvarOrcamentos(viagemId, moeda, metas)
      aoTerminar()
    } catch (erro) {
      console.error('Erro ao salvar orçamento:', erro)
      setErro(mensagemDeErro(erro, 'Não deu pra salvar o orçamento.'))
      setSalvando(false)
    }
  }

  return (
    <form className="form" onSubmit={salvar} noValidate>
      <p className="form-dica">Valores do comboio inteiro, em {moeda}. Deixe vazio a categoria sem meta.</p>
      {CATEGORIAS.map(({ chave, nome, icone: Icone }) => (
        <div key={chave} className="form-campo orcamento-campo">
          <label className="form-rotulo" htmlFor={`orc-${chave}`}>
            <Icone size={16} aria-hidden="true" /> {nome}
          </label>
          <input
            id={`orc-${chave}`}
            inputMode="decimal"
            placeholder="Sem meta"
            value={valores[chave]}
            onChange={(e) => setValores({ ...valores, [chave]: e.target.value })}
          />
        </div>
      ))}
      <p className="form-dica">
        Total: <strong>{formatarDinheiro(total, moeda)}</strong>
        {pessoas > 1 && total > 0 && ` · ${formatarDinheiro(Math.round(total / pessoas), moeda)} por pessoa`}
      </p>
      {erro && (
        <p className="form-erro" role="alert">
          {erro}
        </p>
      )}
      <div className="form-rodape">
        <button type="submit" className="botao" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar orçamento'}
        </button>
      </div>
    </form>
  )
}

function paraCampoOuVazio(centavos?: number) {
  return centavos ? paraCampo(centavos) : ''
}

import { useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { hojeTexto } from '../destinos/datas'
import { mensagemDeErro } from '../financeiro/api'
import { moedasDaViagem } from '../financeiro/categorias'
import { lerValor, paraCampo } from '../financeiro/dinheiro'
import { apagarCompra, salvarCompra, type CompraDeMoeda } from './api'

type Props = {
  viagemId: string
  moedaViagem: string
  compra?: CompraDeMoeda // editando
  aoTerminar: () => void
}

const cotacaoTexto = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })

// Registrar uma compra de moeda: quanto pagou e quanto recebeu (spec 003)
export default function FormCambio({ viagemId, moedaViagem, compra, aoTerminar }: Props) {
  const [origem, setOrigem] = useState(compra?.moeda_origem ?? (moedaViagem === 'BRL' ? 'USD' : 'BRL'))
  const [destino, setDestino] = useState(compra?.moeda_destino ?? moedaViagem)
  const [pagoTexto, setPagoTexto] = useState(compra ? paraCampo(compra.valorOrigem) : '')
  const [recebidoTexto, setRecebidoTexto] = useState(compra ? paraCampo(compra.valorDestino) : '')
  const [data, setData] = useState(compra?.data ?? hojeTexto())
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState(false)

  const pago = lerValor(pagoTexto)
  const recebido = lerValor(recebidoTexto)
  const cotacao = pago && recebido ? pago / recebido : null
  const moedas = moedasDaViagem(moedaViagem, [origem, destino])

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (!pago || !recebido) return setErro('Preencha quanto pagou e quanto recebeu.')
    if (origem === destino) return setErro('As duas moedas são iguais.')
    setSalvando(true)
    setErro(null)
    try {
      await salvarCompra(viagemId, { id: compra?.id, moedaOrigem: origem, moedaDestino: destino, valorOrigem: pago, valorDestino: recebido, data })
      aoTerminar()
    } catch (erro) {
      console.error('Erro ao salvar compra de moeda:', erro)
      setErro(mensagemDeErro(erro, 'Não deu pra salvar a compra.'))
      setSalvando(false)
    }
  }

  async function apagar() {
    if (!compra) return
    setSalvando(true)
    try {
      await apagarCompra(compra.id)
      aoTerminar()
    } catch (erro) {
      console.error('Erro ao apagar compra:', erro)
      setErro(mensagemDeErro(erro, 'Não deu pra apagar a compra.'))
      setSalvando(false)
    }
  }

  return (
    <form className="form" onSubmit={salvar} noValidate>
      <div className="form-linha">
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="cambio-pago">
            Quanto pagou
          </label>
          <div className="valor-grande pequeno">
            <input id="cambio-pago" inputMode="decimal" placeholder="3.060,00" autoFocus value={pagoTexto} onChange={(e) => setPagoTexto(e.target.value)} />
            <select value={origem} onChange={(e) => setOrigem(e.target.value)} aria-label="Moeda que pagou">
              {moedas.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="cambio-recebido">
            Quanto recebeu
          </label>
          <div className="valor-grande pequeno">
            <input id="cambio-recebido" inputMode="decimal" placeholder="500,00" value={recebidoTexto} onChange={(e) => setRecebidoTexto(e.target.value)} />
            <select value={destino} onChange={(e) => setDestino(e.target.value)} aria-label="Moeda que recebeu">
              {moedas.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <p className="form-dica" aria-live="polite">
        {cotacao ? (
          <>
            Cotação: <strong>{cotacaoTexto(cotacao)} {origem}</strong> por 1 {destino}
          </>
        ) : (
          'A cotação aparece aqui quando preencher os dois valores.'
        )}
      </p>

      <div className="form-campo">
        <label className="form-rotulo" htmlFor="cambio-data">
          Data da compra
        </label>
        <input id="cambio-data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
      </div>

      {erro && (
        <p className="form-erro" role="alert">
          {erro}
        </p>
      )}
      <div className="form-rodape">
        <button type="submit" className="botao" disabled={salvando}>
          {salvando ? 'Salvando…' : compra ? 'Salvar alterações' : 'Registrar compra'}
        </button>
      </div>

      {compra &&
        (confirmando ? (
          <div className="form-rodape">
            <button type="button" className="botao secundario" onClick={() => setConfirmando(false)}>
              Manter
            </button>
            <button type="button" className="botao perigo" onClick={apagar} disabled={salvando}>
              Apagar compra
            </button>
          </div>
        ) : (
          <button type="button" className="botao-texto" onClick={() => setConfirmando(true)}>
            <Trash2 size={16} aria-hidden="true" /> Apagar compra
          </button>
        ))}
    </form>
  )
}

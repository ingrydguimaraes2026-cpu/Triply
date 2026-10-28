import { useState } from 'react'
import { useNavigate } from 'react-router'
import { apagarViagem } from './api'

// Confirmação forte pra apagar a viagem: a pessoa digita o nome da viagem (specs 007 e 008).
// Depois de apagar: chama `aoApagar` (ex.: Minhas viagens tira o cartão da lista) ou, sem ele, volta pra /viagens.
export default function ApagarViagem({ id, nome, aoApagar }: { id: string; nome: string; aoApagar?: () => void }) {
  const navegar = useNavigate()
  const [digitado, setDigitado] = useState('')
  const [apagando, setApagando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const confere = digitado.trim().toLowerCase() === nome.trim().toLowerCase()

  async function apagar() {
    setApagando(true)
    setErro(null)
    try {
      await apagarViagem(id)
      if (aoApagar) aoApagar()
      else navegar('/viagens', { replace: true })
    } catch (e) {
      console.error('Erro ao apagar viagem:', e)
      setErro('Não deu pra apagar a viagem. Tente de novo.')
      setApagando(false)
    }
  }

  return (
    <div className="form">
      <p className="form-aviso">
        Isso apaga <strong>tudo</strong> da viagem pra todo o comboio: roteiro, trajetos, gastos, câmbio e fotos. Não dá pra desfazer.
      </p>
      <div className="form-campo">
        <label className="form-rotulo" htmlFor="apagar-nome">
          Pra confirmar, digite o nome da viagem: <strong>{nome}</strong>
        </label>
        <input id="apagar-nome" autoComplete="off" value={digitado} onChange={(e) => setDigitado(e.target.value)} />
      </div>
      {erro && (
        <p className="form-erro" role="alert">
          {erro}
        </p>
      )}
      <div className="form-rodape">
        <button type="button" className="botao perigo" onClick={apagar} disabled={!confere || apagando}>
          {apagando ? 'Apagando…' : 'Apagar a viagem pra sempre'}
        </button>
      </div>
    </div>
  )
}

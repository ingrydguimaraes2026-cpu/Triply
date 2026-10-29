import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { mensagemDeErro, trocarSenha } from '../features/auth/hooks'

// Aberta pelo link do e-mail de "Esqueci a senha". O link já deixa a pessoa logada.
export default function NovaSenha() {
  const navegar = useNavigate()
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function salvar(evento: FormEvent) {
    evento.preventDefault()
    setEnviando(true)
    const { error } = await trocarSenha(senha)
    setEnviando(false)
    if (error) setErro(mensagemDeErro(error))
    else navegar('/nova-viagem', { replace: true })
  }

  return (
    <main className="pagina" style={{ maxWidth: 420, paddingTop: 96 }}>
      <h1 style={{ margin: 0 }}>Crie uma senha nova</h1>
      <form onSubmit={salvar} className="cartao" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="campo">
          <label htmlFor="nova-senha">Nova senha</label>
          <input
            id="nova-senha"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          <small style={{ color: 'var(--cor-texto-suave)' }}>Pelo menos 8 caracteres.</small>
        </div>
        {erro && (
          <p role="alert" className="login-mensagem login-erro">
            {erro}
          </p>
        )}
        <button type="submit" className="botao" disabled={enviando}>
          {enviando ? 'Salvando...' : 'Salvar senha'}
        </button>
      </form>
    </main>
  )
}

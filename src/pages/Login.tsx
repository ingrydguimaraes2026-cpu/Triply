import { useState } from 'react'
import { Navigate } from 'react-router'
import { entrarComGoogle, useSessao } from '../features/auth/hooks'

// Tela de login: por enquanto só com a conta Google.
export default function Login() {
  const { sessao, carregando } = useSessao()
  const [erro, setErro] = useState<string | null>(null)

  if (carregando) return null
  if (sessao) return <Navigate to="/nova-viagem" replace />

  async function entrar() {
    setErro(null)
    const { error } = await entrarComGoogle()
    if (error) setErro('Não deu pra entrar com o Google. Tente de novo.')
  }

  return (
    <main className="pagina" style={{ maxWidth: 420, paddingTop: 96 }}>
      <h1 style={{ fontSize: 44, margin: 0 }}>Together</h1>
      <p style={{ color: 'var(--cor-texto-suave)', marginTop: 0 }}>
        Planeje a viagem com seu comboio, num lugar só.
      </p>
      <button type="button" className="botao" onClick={entrar}>
        Entrar com Google
      </button>
      {erro && (
        <p role="alert" style={{ color: 'var(--cor-pessoal)', margin: 0 }}>
          {erro}
        </p>
      )}
    </main>
  )
}

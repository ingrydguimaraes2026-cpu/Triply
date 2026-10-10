import { Link } from 'react-router'

// Tela de login. Por enquanto não confere nada: o login de verdade vem com o Supabase.
export default function Login() {
  return (
    <main className="pagina" style={{ maxWidth: 420, paddingTop: 96 }}>
      <h1 style={{ fontSize: 44, margin: 0 }}>Triply</h1>
      <p style={{ color: 'var(--cor-texto-suave)', marginTop: 0 }}>
        Planeje a viagem com seu comboio, num lugar só.
      </p>
      <form className="cartao" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="campo">
          <label htmlFor="email">E-mail</label>
          <input id="email" type="email" autoComplete="email" />
        </div>
        <div className="campo">
          <label htmlFor="senha">Senha</label>
          <input id="senha" type="password" autoComplete="current-password" />
        </div>
        <Link to="/nova-viagem" className="botao">
          Entrar
        </Link>
      </form>
    </main>
  )
}

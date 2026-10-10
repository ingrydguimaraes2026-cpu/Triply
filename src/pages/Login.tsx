import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'
import IlustracaoViagem from '../features/auth/IlustracaoViagem'
import {
  criarConta,
  enviarLinkNovaSenha,
  entrarComGoogle,
  entrarComSenha,
  mensagemDeErro,
  useSessao,
} from '../features/auth/hooks'

type Modo = 'entrar' | 'criar' | 'recuperar'

const titulos: Record<Modo, string> = {
  entrar: 'Bem-vindo de volta',
  criar: 'Crie sua conta',
  recuperar: 'Recuperar senha',
}

// Tela de login: Google em primeiro (mais rápido) e e-mail/senha como alternativa.
export default function Login() {
  const { sessao, carregando } = useSessao()
  const [modo, setModo] = useState<Modo>('entrar')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  if (carregando) return null
  if (sessao) return <Navigate to="/nova-viagem" replace />

  function trocarModo(novo: Modo) {
    setModo(novo)
    setErro(null)
    setAviso(null)
  }

  async function google() {
    setErro(null)
    const { error } = await entrarComGoogle()
    if (error) setErro('Não deu pra entrar com o Google. Tente de novo.')
  }

  async function enviar(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setAviso(null)
    setEnviando(true)

    if (modo === 'entrar') {
      const { error } = await entrarComSenha(email, senha)
      if (error) setErro(mensagemDeErro(error))
    } else if (modo === 'criar') {
      const { data, error } = await criarConta(nome, email, senha)
      if (error) setErro(mensagemDeErro(error))
      else if (!data.session) setAviso(`Quase lá! Enviamos um link de confirmação para ${email}.`)
    } else {
      const { error } = await enviarLinkNovaSenha(email)
      if (error) setErro(mensagemDeErro(error))
      else setAviso(`Se existir uma conta com ${email}, você vai receber um link pra criar uma senha nova.`)
    }

    setEnviando(false)
  }

  return (
    <div className="login">
      <aside className="login-arte">
        <p className="login-marca">Together</p>
        <IlustracaoViagem />
        <div>
          <h2 className="login-frase">Viajem juntos.</h2>
          <p className="login-subfrase">Roteiro, transportes, contas e fotos do comboio, num lugar só.</p>
        </div>
      </aside>

      <main className="login-lado-form">
        <div className="login-form">
          <h1 style={{ margin: 0 }}>{titulos[modo]}</h1>

          {modo !== 'recuperar' && (
            <>
              <button type="button" className="botao botao-google" onClick={google}>
                <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
                </svg>
                Continuar com Google
              </button>
              <div className="login-divisor">
                <span>ou com e-mail</span>
              </div>
            </>
          )}

          <form onSubmit={enviar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {modo === 'criar' && (
              <div className="campo">
                <label htmlFor="nome">Seu nome</label>
                <input id="nome" required autoComplete="name" value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
            )}

            <div className="campo">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {modo !== 'recuperar' && (
              <div className="campo">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <label htmlFor="senha">Senha</label>
                  {modo === 'entrar' && (
                    <button type="button" className="link" onClick={() => trocarModo('recuperar')}>
                      Esqueci a senha
                    </button>
                  )}
                </div>
                <div className="campo-senha">
                  <input
                    id="senha"
                    type={mostrarSenha ? 'text' : 'password'}
                    required
                    minLength={modo === 'criar' ? 8 : undefined}
                    autoComplete={modo === 'criar' ? 'new-password' : 'current-password'}
                    aria-describedby={modo === 'criar' ? 'dica-senha' : undefined}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                  <button
                    type="button"
                    className="link"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    aria-label={mostrarSenha ? 'Esconder senha' : 'Mostrar senha'}
                  >
                    {mostrarSenha ? 'Esconder' : 'Mostrar'}
                  </button>
                </div>
                {modo === 'criar' && (
                  <small id="dica-senha" style={{ color: 'var(--cor-texto-suave)' }}>
                    Pelo menos 8 caracteres.
                  </small>
                )}
              </div>
            )}

            {erro && (
              <p role="alert" className="login-mensagem login-erro">
                {erro}
              </p>
            )}
            {aviso && (
              <p role="status" className="login-mensagem login-aviso">
                {aviso}
              </p>
            )}

            <button type="submit" className="botao" disabled={enviando}>
              {enviando
                ? 'Aguarde...'
                : modo === 'entrar'
                  ? 'Entrar'
                  : modo === 'criar'
                    ? 'Criar conta'
                    : 'Enviar link'}
            </button>
          </form>

          <p style={{ margin: 0, textAlign: 'center', color: 'var(--cor-texto-suave)' }}>
            {modo === 'entrar' ? (
              <>
                Ainda não tem conta?{' '}
                <button type="button" className="link" onClick={() => trocarModo('criar')}>
                  Criar conta
                </button>
              </>
            ) : (
              <>
                {modo === 'criar' ? 'Já tem conta? ' : 'Lembrou? '}
                <button type="button" className="link" onClick={() => trocarModo('entrar')}>
                  Entrar
                </button>
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  )
}

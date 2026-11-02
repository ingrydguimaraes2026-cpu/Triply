import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import {
  criarConta,
  destinoDepoisDoLogin,
  enviarLinkNovaSenha,
  entrarComGoogle,
  entrarComSenha,
  mensagemDeErro,
  useSessao,
} from '../features/auth/hooks'
import CarrosselFotos from '../features/auth/CarrosselFotos'
import Agulha from '../components/ui/Agulha'
import '../features/auth/login.css'

type Modo = 'entrar' | 'criar' | 'recuperar'

const textos: Record<Modo, { titulo: string; sub: string; botao: string }> = {
  entrar: {
    titulo: 'Bem-vindo de volta',
    sub: 'Entre pra continuar planejando a próxima viagem.',
    botao: 'Entrar',
  },
  criar: {
    titulo: 'Crie sua conta',
    sub: 'Leva um minuto. Depois é só chamar o comboio.',
    botao: 'Criar conta',
  },
  recuperar: {
    titulo: 'Esqueceu a senha?',
    sub: 'Digite seu e-mail e mandamos um link pra criar uma senha nova.',
    botao: 'Enviar link',
  },
}

// Frases da foto do computador: mudam junto com a foto (design Plataforma, spec 113)
const FRASES = [
  { titulo: 'Planejem juntos', texto: 'Roteiro, transportes e reservas do grupo inteiro, organizados num lugar só.' },
  { titulo: 'Dividam as contas', texto: 'Cada gasto lançado na hora. O Tripwave calcula quem deve quanto, sem planilha.' },
  { titulo: 'Guardem as memórias', texto: 'As fotos de todo mundo, juntas e separadas por dia, prontas pra rever.' },
]

// Marca do Tripwave como no app: a Agulha num quadradinho claro + o nome na serifada
function Marca({ className }: { className: string }) {
  return (
    <p className={`login-marca ${className}`}>
      <span className="login-marca-agulha">
        <Agulha tamanho={44} sombra={false} />
      </span>
      Tripwave
    </p>
  )
}

// Tela de login no estilo do app (spec 112): no celular, faixa caramelo com a Agulha e uma folha
// clara com as abas Entrar | Criar conta. No computador, formulário de um lado e foto do outro.
// Google em primeiro (mais rápido) e e-mail/senha como alternativa.
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
  const [foto, setFoto] = useState(0)

  if (carregando) return null
  if (sessao) {
    const destino = destinoDepoisDoLogin()
    sessionStorage.removeItem('voltarPara')
    return <Navigate to={destino} replace />
  }

  const texto = textos[modo]

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
      <header className="login-faixa">
        <Marca className="login-marca-faixa" />
        <h2>Viajem juntos.</h2>
        <p>Roteiro, transportes, contas e fotos do comboio, num lugar só.</p>
      </header>

      <main className="login-lado">
        <Marca className="login-marca-pc" />

        <div className="login-form">
          {/* No celular o título só aparece no "esqueci a senha"; nas outras telas as abas bastam */}
          <div className={modo === 'recuperar' ? undefined : 'login-cabeca-pc'}>
            <h1 className="login-titulo">{texto.titulo}</h1>
            <p className="login-sub">{texto.sub}</p>
          </div>

          {modo !== 'recuperar' && (
            <>
              <div className="login-abas" role="tablist" aria-label="Entrar ou criar conta">
                {(['entrar', 'criar'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={modo === m}
                    className={modo === m ? 'ativa' : undefined}
                    onClick={() => trocarModo(m)}
                  >
                    {m === 'entrar' ? 'Entrar' : 'Criar conta'}
                  </button>
                ))}
              </div>

              <button type="button" className="login-google" onClick={google}>
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

          <form onSubmit={enviar} className="login-campos">
            {modo === 'criar' && (
              <div className="login-campo">
                <label htmlFor="nome">Seu nome</label>
                <User size={20} aria-hidden="true" />
                <input
                  id="nome"
                  required
                  autoComplete="name"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
            )}

            <div className="login-campo">
              <label htmlFor="email">E-mail</label>
              <Mail size={20} aria-hidden="true" className="login-campo-icone-forte" />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="voce@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {modo !== 'recuperar' && (
              <div className="login-campo">
                <label htmlFor="senha">Senha</label>
                <Lock size={20} aria-hidden="true" />
                <input
                  id="senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  required
                  minLength={modo === 'criar' ? 8 : undefined}
                  autoComplete={modo === 'criar' ? 'new-password' : 'current-password'}
                  placeholder="Sua senha"
                  value={senha}
                  aria-describedby={modo === 'criar' ? 'dica-senha' : undefined}
                  onChange={(e) => setSenha(e.target.value)}
                />
                <button
                  type="button"
                  className="login-olho"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  aria-label={mostrarSenha ? 'Esconder senha' : 'Mostrar senha'}
                  aria-pressed={mostrarSenha}
                >
                  {mostrarSenha ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                </button>
              </div>
            )}
            {modo === 'criar' && (
              <small id="dica-senha" className="login-dica">
                Mínimo de 8 caracteres.
              </small>
            )}
            {modo === 'entrar' && (
              <button type="button" className="login-esqueci" onClick={() => trocarModo('recuperar')}>
                Esqueci minha senha
              </button>
            )}

            {erro && (
              <p role="alert" className="login-msg login-msg-erro">
                {erro}
              </p>
            )}
            {aviso && (
              <p role="status" className="login-msg login-msg-aviso">
                {aviso}
              </p>
            )}

            <button type="submit" className="botao login-enviar" disabled={enviando}>
              {enviando ? 'Aguarde…' : texto.botao}
            </button>
          </form>

          {modo === 'recuperar' ? (
            <p className="login-trocar">
              Lembrou a senha?{' '}
              <button type="button" className="link" onClick={() => trocarModo('entrar')}>
                Entrar
              </button>
            </p>
          ) : (
            <p className="login-termos">Ao continuar, você concorda com os Termos de uso e a Política de privacidade.</p>
          )}
        </div>
      </main>

      <aside className="login-foto">
        <CarrosselFotos aoMudar={setFoto} />
        <div className="login-foto-texto" key={foto} aria-live="polite">
          <h2>{FRASES[foto % FRASES.length].titulo}</h2>
          <p>{FRASES[foto % FRASES.length].texto}</p>
        </div>
      </aside>
    </div>
  )
}

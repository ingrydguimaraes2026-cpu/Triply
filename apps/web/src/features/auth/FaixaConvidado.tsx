import { useState, type FormEvent } from 'react'
import Gaveta from '../../components/ui/Gaveta'
import { ligarEmail, ligarGoogle, mensagemDeErro, useSessao } from './hooks'
import '../../pages/convite.css'

// Spec 018: aparece só pra quem entrou como convidado (sem conta).
// Lembra de criar a conta, senão limpar o navegador apaga o acesso.
export default function FaixaConvidado() {
  const { ehConvidado } = useSessao()
  const [aberta, setAberta] = useState(false)
  if (!ehConvidado) return null

  return (
    <>
      <div className="faixa-convidado" role="status">
        <p>Você está como convidado. Crie sua conta pra não perder o acesso.</p>
        <button type="button" className="botao pequeno" onClick={() => setAberta(true)}>
          Criar conta
        </button>
      </div>
      {aberta && (
        <Gaveta titulo="Criar sua conta" aoFechar={() => setAberta(false)}>
          <CriarContaDoConvidado />
        </Gaveta>
      )}
    </>
  )
}

// Google ou e-mail. Os dois mantêm o mesmo usuário: nada do que a pessoa fez se perde.
export function CriarContaDoConvidado() {
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState<{ erro: boolean; texto: string } | null>(null)

  async function google() {
    setAviso(null)
    const { error } = await ligarGoogle()
    if (error) setAviso({ erro: true, texto: mensagemDeErro(error) })
  }

  async function comEmail(evento: FormEvent) {
    evento.preventDefault()
    setAviso(null)
    setEnviando(true)
    const { error } = await ligarEmail(email.trim())
    setEnviando(false)
    setAviso(
      error
        ? { erro: true, texto: mensagemDeErro(error) }
        : { erro: false, texto: 'Mandamos um link pro seu e-mail. Abra ele pra confirmar e criar sua senha.' },
    )
  }

  return (
    <form className="criar-conta" onSubmit={comEmail}>
      <p className="convite-suave">Seus gastos, votos e fotos continuam no seu nome.</p>
      <button type="button" className="botao secundario" onClick={google}>
        Continuar com Google
      </button>
      <p className="criar-conta-ou">ou com e-mail</p>
      <div className="campo">
        <label htmlFor="convidado-email">E-mail</label>
        <input id="convidado-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {aviso && (
        <p role={aviso.erro ? 'alert' : 'status'} className={aviso.erro ? 'convite-erro' : 'convite-suave'}>
          {aviso.texto}
        </p>
      )}
      <button type="submit" className="botao" disabled={enviando || !email.trim()}>
        {enviando ? 'Enviando…' : 'Mandar link de confirmação'}
      </button>
    </form>
  )
}

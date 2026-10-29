import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { CalendarDays, MapPin, Users } from 'lucide-react'
import { aceitarConvite, entrarComoConvidado, verConvite, type PreviaDoConvite } from '@together/core'
import { supabase } from '../lib/supabase'
import { useSessao } from '../features/auth/hooks'
import { formatarPeriodo } from '../lib/datas'
import Logo from '../components/ui/Logo'
import './convite.css'

type Estado = { tipo: 'carregando' } | { tipo: 'invalido' } | { tipo: 'previa'; previa: PreviaDoConvite }

// Aberta pelo link de convite (spec 018). Mostra a viagem antes de entrar.
// Sem login: a pessoa digita só o nome e entra como convidado. Com login: um toque e entra.
export default function Convite() {
  const { codigo } = useParams()
  const navegar = useNavigate()
  const { sessao, carregando } = useSessao()
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' })
  const [nome, setNome] = useState('')
  const [entrando, setEntrando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!codigo || carregando) return
    verConvite(supabase, codigo)
      .then((previa) => {
        if (!previa) return setEstado({ tipo: 'invalido' })
        // Já está no comboio: vai direto pra viagem
        if (previa.jaSouMembro) return navegar(`/viagem/${previa.viagemId}`, { replace: true })
        setEstado({ tipo: 'previa', previa })
      })
      .catch(() => setEstado({ tipo: 'invalido' }))
  }, [codigo, carregando, navegar])

  async function entrar(evento: FormEvent) {
    evento.preventDefault()
    if (!codigo) return
    setErro(null)
    setEntrando(true)
    try {
      const viagemId = sessao ? await aceitarConvite(supabase, codigo) : await entrarComoConvidado(supabase, codigo, nome.trim())
      navegar(`/viagem/${viagemId}`, { replace: true })
    } catch (e) {
      // "anonymous_provider_disabled": falta ligar o login anônimo no painel do Supabase
      const desligado = (e as { code?: string }).code === 'anonymous_provider_disabled'
      setErro(desligado ? 'Entrar sem conta está desligado agora. Toque em "Já tenho conta" pra entrar.' : 'Não deu pra entrar. Confira a internet e tente de novo.')
      setEntrando(false)
    }
  }

  // "Já tenho conta": faz login e volta pra este convite
  function jaTenhoConta() {
    sessionStorage.setItem('voltarPara', `/convite/${codigo}`)
    navegar('/login')
  }

  if (estado.tipo === 'carregando') {
    return (
      <main className="convite">
        <p className="convite-carregando" aria-busy="true">Abrindo o convite…</p>
      </main>
    )
  }

  if (estado.tipo === 'invalido') {
    return (
      <main className="convite">
        <div className="cartao convite-cartao">
          <h1>Convite inválido</h1>
          <p className="convite-suave">Esse link expirou ou não existe. Peça um novo pra quem te convidou.</p>
          <Link to="/nova-viagem" className="botao">
            Criar minha viagem
          </Link>
        </div>
      </main>
    )
  }

  const { previa } = estado
  const periodo = formatarPeriodo(previa.dataInicio, previa.dataFim)
  const quem = previa.membros.slice(0, 3).join(', ') + (previa.membros.length > 3 ? ` e mais ${previa.membros.length - 3}` : '')

  return (
    <main className="convite">
      <div className="convite-logo">
        <Logo />
      </div>
      <form className="cartao convite-cartao" onSubmit={entrar}>
        <p className="convite-rotulo">Você foi convidado pra viagem</p>
        <h1>{previa.nome}</h1>
        <ul className="convite-detalhes">
          {periodo && (
            <li>
              <CalendarDays size={18} aria-hidden="true" /> {periodo}
            </li>
          )}
          {previa.destinos.length > 0 && (
            <li>
              <MapPin size={18} aria-hidden="true" /> {previa.destinos.join(' → ')}
            </li>
          )}
          {previa.membros.length > 0 && (
            <li>
              <Users size={18} aria-hidden="true" /> {quem} já {previa.membros.length === 1 ? 'está' : 'estão'} no comboio
            </li>
          )}
        </ul>

        {!sessao && (
          <div className="campo">
            <label htmlFor="convite-nome">Como te chamam?</label>
            <input
              id="convite-nome"
              required
              maxLength={40}
              autoComplete="given-name"
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
            <small className="convite-suave">Sem e-mail e sem senha. Dá pra criar sua conta depois, sem perder nada.</small>
          </div>
        )}

        {erro && (
          <p role="alert" className="convite-erro">
            {erro}
          </p>
        )}

        <button type="submit" className="botao" disabled={entrando || (!sessao && !nome.trim())}>
          {entrando ? 'Entrando…' : 'Entrar na viagem'}
        </button>

        {!sessao && (
          <button type="button" className="convite-link" onClick={jaTenhoConta}>
            Já tenho conta
          </button>
        )}
      </form>
    </main>
  )
}

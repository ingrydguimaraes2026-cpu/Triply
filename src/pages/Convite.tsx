import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { aceitarConvite } from '../features/comboio/api'

// Aberta pelo link de convite: entra no comboio e vai pra viagem.
export default function Convite() {
  const { codigo } = useParams()
  const navegar = useNavigate()
  const [erro, setErro] = useState(false)
  const jaTentou = useRef(false)

  useEffect(() => {
    if (!codigo || jaTentou.current) return
    jaTentou.current = true
    aceitarConvite(codigo)
      .then((viagemId) => navegar(`/viagem/${viagemId}`, { replace: true }))
      .catch(() => setErro(true))
  }, [codigo, navegar])

  return (
    <main className="pagina" style={{ maxWidth: 420, paddingTop: 96, textAlign: 'center' }}>
      {erro ? (
        <>
          <h1 style={{ margin: 0 }}>Convite inválido</h1>
          <p style={{ color: 'var(--cor-texto-suave)' }}>
            Esse link expirou ou não existe. Peça um novo pra quem te convidou.
          </p>
          <Link to="/nova-viagem" className="botao">
            Criar minha viagem
          </Link>
        </>
      ) : (
        <h1 style={{ margin: 0 }}>Entrando no comboio…</h1>
      )}
    </main>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { conectarComCodigo, sincronizar } from '../features/carteira/api'
import '../features/carteira/carteira.css'

// Página pra onde o Google volta depois do consentimento (spec 015).
// Lê o `code`, manda pra Edge Function guardar o acesso e volta pro Financeiro da viagem.
export default function CarteiraConectado() {
  const [busca] = useSearchParams()
  const navegar = useNavigate()
  const [erro, setErro] = useState<string | null>(null)
  const jaRodou = useRef(false)

  const viagemId = busca.get('state')
  const voltar = viagemId ? `/viagem/${viagemId}/financeiro` : '/viagens'

  useEffect(() => {
    if (jaRodou.current) return // evita rodar 2x no modo estrito do React
    jaRodou.current = true

    const code = busca.get('code')
    const negado = busca.get('error')
    if (negado || !code || !viagemId) {
      setErro(negado === 'access_denied' ? 'Você não autorizou o acesso ao Gmail.' : 'Faltou a autorização do Google.')
      return
    }
    // Conecta, lê os e-mails na hora (puxa todo o histórico) e volta pro Financeiro.
    conectarComCodigo(code, viagemId)
      .then(() => sincronizar().catch(() => {})) // se a leitura falhar, segue: o cron tenta depois
      .then(() => navegar(voltar, { replace: true }))
      .catch((e) => setErro((e as Error).message || 'Não deu pra conectar o Gmail.'))
  }, [busca, navegar, voltar, viagemId])

  return (
    <div className="tela-centro">
      {erro ? (
        <>
          <h1>Não deu pra conectar</h1>
          <p>{erro}</p>
          <button type="button" className="botao" onClick={() => navegar(voltar, { replace: true })}>
            Voltar
          </button>
        </>
      ) : (
        <p className="carregando-texto">Conectando e lendo seus e-mails…</p>
      )}
    </div>
  )
}

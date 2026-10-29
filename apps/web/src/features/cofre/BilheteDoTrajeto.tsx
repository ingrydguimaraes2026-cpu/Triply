import { useState, type ChangeEvent } from 'react'
import { Paperclip, Ticket } from 'lucide-react'
import { ACEITAR_NO_SELETOR, enviarArquivo, problemaDoArquivo, type Arquivo } from './api'
import './cofre.css'

type Props = {
  viagemId: string
  trajetoId: string
  bilhete?: Arquivo // o arquivo do cofre ligado a este trajeto, se tiver
  aoMudar: () => void
}

// Spec 028: o bilhete do trajeto. Tem: abre. Não tem: qualquer um do comboio anexa (vai pro cofre).
export default function BilheteDoTrajeto({ viagemId, trajetoId, bilhete, aoMudar }: Props) {
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function anexar(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    e.target.value = ''
    if (!arquivo || enviando) return
    const problema = problemaDoArquivo(arquivo)
    if (problema) return setErro(problema)
    setErro(null)
    setEnviando(true)
    try {
      await enviarArquivo(viagemId, arquivo, trajetoId)
      aoMudar()
    } catch (falha) {
      console.error('Erro ao anexar bilhete:', falha)
      setErro('Não deu pra anexar. Tente de novo.')
    }
    setEnviando(false)
  }

  if (bilhete?.url) {
    return (
      <a href={bilhete.url} target="_blank" rel="noreferrer noopener" className="trajeto-link">
        <Ticket size={13} aria-hidden="true" /> Abrir bilhete
      </a>
    )
  }
  if (bilhete) return null // existe, mas o link não veio: o cofre da Overview mostra o erro

  return (
    <>
      <label className="trajeto-link bilhete-anexar">
        <Paperclip size={13} aria-hidden="true" /> {enviando ? 'Anexando…' : 'Anexar bilhete'}
        <input type="file" accept={ACEITAR_NO_SELETOR} onChange={anexar} disabled={enviando} hidden />
      </label>
      {erro && (
        <small className="form-erro" role="alert">
          {erro}
        </small>
      )}
    </>
  )
}

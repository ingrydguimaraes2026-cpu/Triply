import { useState, type ChangeEvent } from 'react'
import { Paperclip, Ticket } from '../../components/ui/icones'
import { ACEITAR_NO_SELETOR, enviarArquivo, problemaDoArquivo, type Arquivo, type LigacaoDoArquivo } from './api'
import './cofre.css'

type Props = {
  viagemId: string
  trajetoId?: string
  ligacao?: LigacaoDoArquivo // spec 120a: reserva da casa ({ hospedagem_id }) ou da agenda ({ evento_id })
  bilhete?: Arquivo // o arquivo do cofre ligado a este trajeto, se tiver
  aoMudar: () => void
}

// Spec 028: o bilhete do trajeto. Tem: abre. Não tem: qualquer um do comboio anexa (vai pro cofre).
// Spec 120a: o mesmo serve pra reserva da casa e de um item da agenda (aí o texto é "reserva").
export default function BilheteDoTrajeto({ viagemId, trajetoId, ligacao, bilhete, aoMudar }: Props) {
  const nome = trajetoId ? 'bilhete' : 'reserva'
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
      await enviarArquivo(viagemId, arquivo, trajetoId ?? ligacao ?? null)
      aoMudar()
    } catch (falha) {
      console.error(`Erro ao anexar ${nome}:`, falha)
      setErro('Não deu pra anexar. Tente de novo.')
    }
    setEnviando(false)
  }

  if (bilhete?.url) {
    return (
      <a href={bilhete.url} target="_blank" rel="noreferrer noopener" className="trajeto-link">
        <Ticket size={13} aria-hidden="true" /> Abrir {nome}
      </a>
    )
  }
  if (bilhete) return null // existe, mas o link não veio: o cofre da Overview mostra o erro

  return (
    <>
      <label className="trajeto-link bilhete-anexar">
        <Paperclip size={13} aria-hidden="true" /> {enviando ? 'Anexando…' : `Anexar ${nome}`}
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

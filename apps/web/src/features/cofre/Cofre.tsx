import { useState, type ChangeEvent } from 'react'
import { FileText, Image, Lock, Ticket, Trash2, Upload } from 'lucide-react'
import { useViagemAtual } from '../viagens/hooks'
import { ACEITAR_NO_SELETOR, apagarArquivo, enviarArquivo, problemaDoArquivo, textoDoTamanho, type Arquivo } from './api'
import { useCofre } from './hooks'
import EstadoVazio from '../../components/ui/EstadoVazio'
import './cofre.css'

// Spec 028: o cofre da viagem. Reservas, ingressos e PDFs que o comboio inteiro abre.
export default function Cofre() {
  const { viagem, membros, meuId, euSouAdm } = useViagemAtual()
  const { arquivos, erro: erroAoCarregar, recarregar } = useCofre(viagem.id)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const nomeDe = (id: string) => (id === meuId ? 'você' : (membros.find((m) => m.id === id)?.nome ?? 'ex-membro'))

  async function guardar(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    e.target.value = '' // deixa escolher o mesmo arquivo de novo
    if (!arquivo || enviando) return
    const problema = problemaDoArquivo(arquivo)
    if (problema) return setErro(problema)
    setErro(null)
    setEnviando(true)
    try {
      await enviarArquivo(viagem.id, arquivo)
      await recarregar()
    } catch (falha) {
      console.error('Erro ao guardar arquivo:', falha)
      setErro('Não deu pra guardar o arquivo. Confira a internet e tente de novo.')
    }
    setEnviando(false)
  }

  async function apagar(a: Arquivo) {
    if (!window.confirm(`Apagar "${a.nome}" do cofre? Ninguém do comboio vai conseguir abrir mais.`)) return
    setErro(null)
    try {
      await apagarArquivo(a)
      await recarregar()
    } catch (falha) {
      console.error('Erro ao apagar arquivo:', falha)
      setErro('Não deu pra apagar o arquivo.')
    }
  }

  return (
    <div className="cofre">
      {arquivos === null && !erroAoCarregar && <p className="carregando-texto">Carregando…</p>}
      {erroAoCarregar && <p className="form-erro">Não deu pra abrir o cofre agora.</p>}
      {arquivos?.length === 0 && (
        <EstadoVazio icone={Lock} titulo="Cofre vazio" texto="Guarde aqui reservas, ingressos e passagens em PDF ou foto." />
      )}
      {arquivos && arquivos.length > 0 && (
        <ul className="cofre-lista">
          {arquivos.map((a) => {
            const Icone = a.trajeto_id ? Ticket : a.tipo === 'application/pdf' ? FileText : Image
            return (
              <li key={a.id}>
                <Icone size={18} aria-hidden="true" className="cofre-icone" />
                <span className="cofre-texto">
                  {a.url ? (
                    <a href={a.url} target="_blank" rel="noreferrer noopener">
                      {a.nome}
                    </a>
                  ) : (
                    <strong>{a.nome}</strong>
                  )}
                  <small>
                    {a.trajeto_id && 'bilhete · '}
                    {textoDoTamanho(a.tamanho)} · por {nomeDe(a.enviado_por)}
                  </small>
                </span>
                {(a.enviado_por === meuId || euSouAdm) && (
                  <button type="button" className="botao-texto" onClick={() => apagar(a)} aria-label={`Apagar ${a.nome}`}>
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {erro && (
        <p className="form-erro" role="alert">
          {erro}
        </p>
      )}
      <label className={enviando ? 'cofre-enviar ocupado' : 'cofre-enviar'}>
        <Upload size={15} aria-hidden="true" />
        {enviando ? 'Guardando…' : 'Guardar arquivo'}
        <input type="file" accept={ACEITAR_NO_SELETOR} onChange={guardar} disabled={enviando} hidden />
      </label>
    </div>
  )
}

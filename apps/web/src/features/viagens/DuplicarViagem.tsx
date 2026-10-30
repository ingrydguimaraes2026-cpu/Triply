import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { CopyPlus } from 'lucide-react'
import type { Tables } from '@together/core'
import { supabase } from '../../lib/supabase'
import Gaveta from '../../components/ui/Gaveta'

// Spec 091: duplicar a viagem (roteiro, transportes, lugares, agenda, listas e tarefas).
// Gastos, hospedagens e fotos não vão. O comboio vai só se marcar.
type Props = { viagem: Tables<'viagens'>; comComboio: boolean }
export default function DuplicarViagem({ viagem, comComboio }: Props) {
  const navegar = useNavigate()
  const [aberto, setAberto] = useState(false)
  const [nome, setNome] = useState(`${viagem.nome} (cópia)`)
  const [inicio, setInicio] = useState('')
  const [trazerComboio, setTrazerComboio] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function duplicar(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return setErro('Dê um nome pra viagem nova.')
    setErro(null)
    setSalvando(true)
    const { data: nova, error } = await supabase.rpc('duplicar_viagem', { p_origem: viagem.id, p_nome: nome.trim(), p_inicio: inicio || null })
    if (error || !nova) {
      console.error('Erro ao duplicar:', error)
      setSalvando(false)
      return setErro('Não deu pra duplicar agora. Tente de novo.')
    }
    if (trazerComboio) {
      const { error: erroComboio } = await supabase.rpc('trazer_comboio', { p_nova: nova, p_origem: viagem.id })
      if (erroComboio) console.error('Viagem duplicada, mas não deu pra trazer o comboio:', erroComboio)
    }
    navegar(`/viagem/${nova}`)
  }

  return (
    <>
      <button type="button" className="botao secundario" onClick={() => setAberto(true)}>
        <CopyPlus size={18} aria-hidden="true" /> Duplicar viagem
      </button>
      {aberto && (
        <Gaveta titulo="Duplicar viagem" aoFechar={() => !salvando && setAberto(false)}>
          <form className="form" onSubmit={duplicar} noValidate>
            <p className="form-dica">Vai junto: roteiro, transportes, lugares, agenda, listas e tarefas. Não vão: gastos, hospedagens e fotos.</p>
            <div className="form-campo">
              <label className="form-rotulo" htmlFor="dup-nome">
                Nome da viagem nova
              </label>
              <input id="dup-nome" maxLength={120} value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="form-campo">
              <label className="form-rotulo" htmlFor="dup-inicio">
                Começa em (opcional)
              </label>
              <input id="dup-inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
              <p className="form-dica">Com data, todo o roteiro anda junto. Sem data, as datas ficam em branco e a agenda não vai.</p>
            </div>
            {comComboio && (
              <label className="form-check">
                <input type="checkbox" checked={trazerComboio} onChange={(e) => setTrazerComboio(e.target.checked)} /> Trazer o comboio junto
              </label>
            )}
            {erro && (
              <p className="form-erro" role="alert">
                {erro}
              </p>
            )}
            <div className="form-rodape">
              <button type="submit" className="botao" disabled={salvando}>
                {salvando ? 'Duplicando…' : 'Duplicar'}
              </button>
            </div>
          </form>
        </Gaveta>
      )}
    </>
  )
}

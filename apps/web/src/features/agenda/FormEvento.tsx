import { useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { apagarEventoDaAgenda, criarEventoDaAgenda, editarEventoDaAgenda, type EventoDaAgenda } from '@together/core'
import { supabase } from '../../lib/supabase'
import { diaPorExtenso } from './hooks'

type Props = {
  viagemId: string
  dias: string[] // dias da viagem (o evento cai num deles)
  diaInicial: string
  evento?: EventoDaAgenda // editando
  aoTerminar: () => void
}

// Criar ou editar um evento livre da agenda (spec 029): "jantar no Le Safari às 20h".
export default function FormEvento({ viagemId, dias, diaInicial, evento, aoTerminar }: Props) {
  const [titulo, setTitulo] = useState(evento?.titulo ?? '')
  const [dia, setDia] = useState(evento?.dia ?? diaInicial)
  const [hora, setHora] = useState(evento?.hora?.slice(0, 5) ?? '')
  const [local, setLocal] = useState(evento?.local ?? '')
  const [observacao, setObservacao] = useState(evento?.observacao ?? '')
  const [salvando, setSalvando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  // O dia do evento pode ter saído do período (o roteiro mudou): continua na lista pra não sumir
  const opcoes = evento && !dias.includes(evento.dia) ? [evento.dia, ...dias] : dias

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) return setErro('Dê um nome pro evento.')
    setErro(null)
    setSalvando(true)
    const dados = { dia, hora: hora || null, titulo, local, observacao }
    try {
      if (evento) await editarEventoDaAgenda(supabase, evento.id, dados)
      else await criarEventoDaAgenda(supabase, viagemId, dados)
      aoTerminar()
    } catch (falha) {
      console.error('Erro ao salvar o evento:', falha)
      setErro('Não deu pra salvar o evento. Confira a internet e tente de novo.')
      setSalvando(false)
    }
  }

  async function apagar() {
    if (!evento) return
    setSalvando(true)
    try {
      await apagarEventoDaAgenda(supabase, evento.id)
      aoTerminar()
    } catch (falha) {
      console.error('Erro ao apagar o evento:', falha)
      setErro('Não deu pra apagar o evento.')
      setSalvando(false)
    }
  }

  return (
    <form className="form" onSubmit={enviar} noValidate>
      <div className="form-campo">
        <label className="form-rotulo" htmlFor="evento-titulo">
          O que vai acontecer
        </label>
        <input
          id="evento-titulo"
          maxLength={120}
          autoComplete="off"
          placeholder="Ex.: Jantar no Le Safari"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          autoFocus
        />
      </div>
      <div className="form-linha">
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="evento-dia">
            Dia
          </label>
          <select id="evento-dia" value={dia} onChange={(e) => setDia(e.target.value)}>
            {opcoes.map((d) => (
              <option key={d} value={d}>
                {diaPorExtenso(d)}
              </option>
            ))}
          </select>
        </div>
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="evento-hora">
            Hora (opcional)
          </label>
          <input id="evento-hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
        </div>
      </div>
      <div className="form-campo">
        <label className="form-rotulo" htmlFor="evento-local">
          Onde (opcional)
        </label>
        <input
          id="evento-local"
          maxLength={200}
          autoComplete="off"
          placeholder="Ex.: Cours Saleya, 1"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
        />
      </div>
      <div className="form-campo">
        <label className="form-rotulo" htmlFor="evento-obs">
          Observação (opcional)
        </label>
        <textarea
          id="evento-obs"
          maxLength={500}
          placeholder="Ex.: reserva no nome do Victor, mesa pra 6"
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
        />
      </div>
      {erro && (
        <p className="form-erro" role="alert">
          {erro}
        </p>
      )}
      <div className="form-rodape">
        <button type="submit" className="botao" disabled={salvando}>
          {salvando ? 'Salvando…' : evento ? 'Salvar alterações' : 'Adicionar à agenda'}
        </button>
      </div>
      {evento &&
        (confirmando ? (
          <div className="form-rodape">
            <button type="button" className="botao secundario" onClick={() => setConfirmando(false)}>
              Manter
            </button>
            <button type="button" className="botao perigo" onClick={apagar} disabled={salvando}>
              Apagar evento
            </button>
          </div>
        ) : (
          <button type="button" className="botao-texto alinhar-inicio" onClick={() => setConfirmando(true)}>
            <Trash2 size={16} aria-hidden="true" /> Apagar evento
          </button>
        ))}
    </form>
  )
}

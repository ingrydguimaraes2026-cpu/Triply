import { useEffect, useState, type FormEvent } from 'react'
import { HeartPulse, IdCard } from 'lucide-react'
import { buscarMinhaFicha, salvarMinhaFicha } from '@together/core'
import { supabase } from '../../lib/supabase'

const TIPOS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const VISIBILIDADE = [
  { valor: 'adm', nome: 'Só quem organiza (ADM)' },
  { valor: 'comboio', nome: 'Todo o comboio' },
  { valor: 'ninguem', nome: 'Ninguém (só eu)' },
]
const fone = /^\+?[0-9 ()./-]{6,30}$/

// Ficha da pessoa no perfil (spec 050): vale pra todas as viagens
export default function FormFicha({ meuId }: { meuId: string }) {
  const [carregado, setCarregado] = useState(false)
  const [campos, setCampos] = useState({
    telefone: '',
    aniversario: '',
    restricoes: '',
    alergias: '',
    mobilidade: '',
    emergencia_nome: '',
    emergencia_telefone: '',
    tipo_sanguineo: '',
    remedios: '',
    saude_visivel_para: 'adm',
  })
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  useEffect(() => {
    buscarMinhaFicha(supabase)
      .then((f) => {
        if (f) {
          setCampos({
            telefone: f.telefone ?? '',
            aniversario: f.aniversario ?? '',
            restricoes: f.restricoes ?? '',
            alergias: f.alergias ?? '',
            mobilidade: f.mobilidade ?? '',
            emergencia_nome: f.emergencia_nome ?? '',
            emergencia_telefone: f.emergencia_telefone ?? '',
            tipo_sanguineo: f.tipo_sanguineo ?? '',
            remedios: f.remedios ?? '',
            saude_visivel_para: f.saude_visivel_para,
          })
        }
      })
      .catch((e) => console.error('Erro ao buscar a ficha:', e))
      .finally(() => setCarregado(true))
  }, [])

  const mudar = (campo: keyof typeof campos) => (e: { target: { value: string } }) => setCampos({ ...campos, [campo]: e.target.value })
  const ou = (v: string) => v.trim() || null

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setMensagem(null)
    if (campos.telefone.trim() && !fone.test(campos.telefone.trim())) return setMensagem({ tipo: 'erro', texto: 'O telefone só pode ter números, espaço, +, ( ) e -.' })
    if (campos.emergencia_telefone.trim() && !fone.test(campos.emergencia_telefone.trim()))
      return setMensagem({ tipo: 'erro', texto: 'O telefone de emergência só pode ter números, espaço, +, ( ) e -.' })
    setSalvando(true)
    try {
      await salvarMinhaFicha(supabase, meuId, {
        telefone: ou(campos.telefone),
        aniversario: ou(campos.aniversario),
        restricoes: ou(campos.restricoes),
        alergias: ou(campos.alergias),
        mobilidade: ou(campos.mobilidade),
        emergencia_nome: ou(campos.emergencia_nome),
        emergencia_telefone: ou(campos.emergencia_telefone),
        tipo_sanguineo: ou(campos.tipo_sanguineo),
        remedios: ou(campos.remedios),
        saude_visivel_para: campos.saude_visivel_para,
      })
      setMensagem({ tipo: 'ok', texto: 'Ficha salva.' })
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Não deu pra salvar a ficha.' })
    } finally {
      setSalvando(false)
    }
  }

  if (!carregado) return null

  return (
    <form className="cartao-ui form" onSubmit={salvar} noValidate>
      <h2 className="perfil-secao">
        <IdCard size={18} aria-hidden="true" /> Sua ficha
      </h2>
      <p className="form-dica">O comboio vê isto em todas as viagens: ajuda a escolher restaurante e a lembrar do seu aniversário.</p>
      <div className="form-linha">
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="ficha-tel">
            Telefone / WhatsApp
          </label>
          <input id="ficha-tel" inputMode="tel" maxLength={30} value={campos.telefone} onChange={mudar('telefone')} />
        </div>
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="ficha-aniversario">
            Aniversário
          </label>
          <input id="ficha-aniversario" type="date" value={campos.aniversario} onChange={mudar('aniversario')} />
        </div>
      </div>
      <div className="form-campo">
        <label className="form-rotulo" htmlFor="ficha-restricoes">
          Restrições alimentares
        </label>
        <input id="ficha-restricoes" maxLength={200} placeholder="Ex.: vegetariana, sem glúten" value={campos.restricoes} onChange={mudar('restricoes')} />
      </div>
      <div className="form-campo">
        <label className="form-rotulo" htmlFor="ficha-alergias">
          Alergias
        </label>
        <input id="ficha-alergias" maxLength={200} placeholder="Ex.: amendoim, dipirona" value={campos.alergias} onChange={mudar('alergias')} />
      </div>
      <div className="form-campo">
        <label className="form-rotulo" htmlFor="ficha-mobilidade">
          Mobilidade (opcional)
        </label>
        <input id="ficha-mobilidade" maxLength={200} placeholder="Ex.: evito escadas, uso bengala" value={campos.mobilidade} onChange={mudar('mobilidade')} />
      </div>

      <h3 className="perfil-secao">
        <HeartPulse size={16} aria-hidden="true" /> Emergência e saúde
      </h3>
      <div className="form-linha">
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="ficha-em-nome">
            Contato no Brasil
          </label>
          <input id="ficha-em-nome" maxLength={80} placeholder="Ex.: Mãe" value={campos.emergencia_nome} onChange={mudar('emergencia_nome')} />
        </div>
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="ficha-em-tel">
            Telefone dele(a)
          </label>
          <input id="ficha-em-tel" inputMode="tel" maxLength={30} value={campos.emergencia_telefone} onChange={mudar('emergencia_telefone')} />
        </div>
      </div>
      <div className="form-linha">
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="ficha-sangue">
            Tipo sanguíneo
          </label>
          <select id="ficha-sangue" value={campos.tipo_sanguineo} onChange={mudar('tipo_sanguineo')}>
            <option value="">Não sei / prefiro não dizer</option>
            {TIPOS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="ficha-quem-ve">
            Quem vê esta parte
          </label>
          <select id="ficha-quem-ve" value={campos.saude_visivel_para} onChange={mudar('saude_visivel_para')}>
            {VISIBILIDADE.map((v) => (
              <option key={v.valor} value={v.valor}>
                {v.nome}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-campo">
        <label className="form-rotulo" htmlFor="ficha-remedios">
          Remédios de uso contínuo
        </label>
        <input id="ficha-remedios" maxLength={300} value={campos.remedios} onChange={mudar('remedios')} />
      </div>

      <div className="form-rodape">
        <button type="submit" className="botao" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar ficha'}
        </button>
      </div>
      {mensagem && (
        <p role="status" className={mensagem.tipo === 'ok' ? 'form-aviso' : 'form-erro'}>
          {mensagem.texto}
        </p>
      )}
    </form>
  )
}

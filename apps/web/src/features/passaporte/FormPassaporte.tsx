import { useEffect, useState, type FormEvent } from 'react'
import { BookUser } from 'lucide-react'
import { buscarMeusDocumentos, salvarMeusDocumentos } from '@together/core'
import { supabase } from '../../lib/supabase'
import { codigoDoPais, nomeDoPais } from '../documentos/paises'

// Passaporte no perfil (spec 038): países do(s) passaporte(s) e a validade. Nunca o número.
export default function FormPassaporte({ meuId }: { meuId: string }) {
  const [carregado, setCarregado] = useState(false)
  const [nacionalidades, setNacionalidades] = useState<string[]>([])
  const [novoPais, setNovoPais] = useState('')
  const [validade, setValidade] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  useEffect(() => {
    buscarMeusDocumentos(supabase)
      .then((d) => {
        setNacionalidades(d.nacionalidades)
        setValidade(d.passaporteValidade ?? '')
      })
      .catch((e) => console.error('Erro ao buscar o passaporte:', e))
      .finally(() => setCarregado(true))
  }, [])

  function acrescentar() {
    setMensagem(null)
    const codigo = codigoDoPais(novoPais)
    if (!codigo) return setMensagem({ tipo: 'erro', texto: 'Não reconheci esse país. Ex.: Brasil, Itália, Portugal.' })
    if (nacionalidades.includes(codigo)) return setNovoPais('')
    if (nacionalidades.length >= 3) return setMensagem({ tipo: 'erro', texto: 'No máximo 3 passaportes.' })
    setNacionalidades([...nacionalidades, codigo])
    setNovoPais('')
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setMensagem(null)
    try {
      await salvarMeusDocumentos(supabase, meuId, { nacionalidades, passaporteValidade: validade || null })
      setMensagem({ tipo: 'ok', texto: 'Salvo. Só você vê esses dados; o comboio só fica sabendo se o passaporte precisa ser renovado.' })
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Não deu pra salvar o passaporte.' })
    } finally {
      setSalvando(false)
    }
  }

  if (!carregado) return null

  return (
    <form className="cartao-ui form" onSubmit={salvar} noValidate>
      <h2 className="perfil-secao">
        <BookUser size={18} aria-hidden="true" /> Passaporte
      </h2>
      <p className="form-dica">O app nunca pede o número do documento. Serve pra avisar se o passaporte vence perto da viagem.</p>

      <div className="form-campo">
        <span className="form-rotulo">Nacionalidade(s)</span>
        {nacionalidades.length > 0 && (
          <ul className="perfil-paises">
            {nacionalidades.map((c) => (
              <li key={c}>
                {nomeDoPais(c)}
                <button type="button" className="botao-texto" aria-label={`Tirar ${nomeDoPais(c)}`} onClick={() => setNacionalidades(nacionalidades.filter((x) => x !== c))}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="perfil-pais-novo">
          <input
            aria-label="País do passaporte"
            placeholder="Ex.: Brasil"
            value={novoPais}
            onChange={(e) => setNovoPais(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                acrescentar()
              }
            }}
          />
          <button type="button" className="botao secundario pequeno" onClick={acrescentar}>
            Acrescentar
          </button>
        </div>
      </div>

      <div className="form-campo">
        <label className="form-rotulo" htmlFor="perfil-validade">
          Validade do passaporte
        </label>
        <input id="perfil-validade" type="date" value={validade} onChange={(e) => setValidade(e.target.value)} />
      </div>

      <div className="form-rodape">
        <button type="submit" className="botao" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar passaporte'}
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

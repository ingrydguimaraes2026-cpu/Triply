import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Pencil, Phone, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { apagarSeguro, buscarSeguros, cobreAViagem, salvarSeguro, semSeguro, telefoneParaLigar, type SeguroViagem } from '@together/core'
import { supabase } from '../../lib/supabase'
import { mensagemDeErro } from '../financeiro/api'
import { formatarData } from '../../lib/datas'
import type { Membro } from '../viagens/hooks'

type Props = {
  viagemId: string
  meuId: string
  euSouAdm: boolean
  membros: Membro[]
  inicio: string | null
  fim: string | null
}

// Seguro viagem (spec 039), dentro da gaveta de Emergência: telefone 24 h com um toque e quem está coberto.
export default function SeguroDaViagem({ viagemId, meuId, euSouAdm, membros, inicio, fim }: Props) {
  const [seguros, setSeguros] = useState<SeguroViagem[] | null>(null)
  const [editando, setEditando] = useState<SeguroViagem | 'novo' | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(() => {
    buscarSeguros(supabase, viagemId)
      .then(setSeguros)
      .catch((e) => {
        console.error('Erro ao buscar seguros:', e)
        setErro('Não deu pra carregar o seguro agora.')
      })
  }, [viagemId])
  useEffect(recarregar, [recarregar])

  if (!seguros) return erro ? <p className="form-erro">{erro}</p> : null
  const nomeDe = (id: string) => membros.find((m) => m.id === id)?.nome ?? 'Alguém'
  const descobertos = semSeguro(seguros, membros)

  if (editando) {
    return (
      <FormSeguro
        viagemId={viagemId}
        membros={membros}
        seguro={editando === 'novo' ? undefined : editando}
        meuId={meuId}
        aoTerminar={() => {
          setEditando(null)
          recarregar()
        }}
      />
    )
  }

  return (
    <section className="emergencia-seguro" aria-label="Seguro viagem">
      <h3>
        <ShieldCheck size={18} aria-hidden="true" /> Seguro viagem
      </h3>
      {seguros.length === 0 && <p className="dica">Ninguém cadastrou o seguro ainda. Na Europa (Schengen) ele é obrigatório.</p>}
      {seguros.map((s) => {
        const cobre = cobreAViagem(s, inicio, fim)
        return (
          <div key={s.id} className="seguro">
            <div className="seguro-topo">
              <strong>{s.seguradora}</strong>
              {(s.criado_por === meuId || euSouAdm) && (
                <button type="button" className="botao-texto" aria-label="Editar seguro" onClick={() => setEditando(s)}>
                  <Pencil size={15} aria-hidden="true" />
                </button>
              )}
            </div>
            {s.telefone && (
              <a className="seguro-ligar" href={`tel:${telefoneParaLigar(s.telefone)}`}>
                <Phone size={16} aria-hidden="true" /> {s.telefone} <small>(24 h)</small>
              </a>
            )}
            <small>
              {s.apolice && <>Apólice {s.apolice} · </>}
              {s.valido_de && s.valido_ate && <>de {formatarData(s.valido_de)} a {formatarData(s.valido_ate)}</>}
              {cobre === false && <strong className="seguro-alerta"> · não cobre a viagem inteira</strong>}
            </small>
            {s.cobertura && <small>{s.cobertura}</small>}
            {s.cobertos.length > 0 && <small>Cobre: {s.cobertos.map(nomeDe).join(', ')}</small>}
          </div>
        )
      })}
      {seguros.length > 0 && descobertos.length > 0 && <p className="dica">Sem seguro cadastrado: {descobertos.map((m) => m.nome).join(', ')}.</p>}
      <button type="button" className="botao secundario pequeno" onClick={() => setEditando('novo')}>
        <Plus size={15} aria-hidden="true" /> Cadastrar seguro
      </button>
    </section>
  )
}

function FormSeguro({
  viagemId,
  membros,
  seguro,
  meuId,
  aoTerminar,
}: {
  viagemId: string
  membros: Membro[]
  seguro?: SeguroViagem
  meuId: string
  aoTerminar: () => void
}) {
  const [seguradora, setSeguradora] = useState(seguro?.seguradora ?? '')
  const [telefone, setTelefone] = useState(seguro?.telefone ?? '')
  const [apolice, setApolice] = useState(seguro?.apolice ?? '')
  const [de, setDe] = useState(seguro?.valido_de ?? '')
  const [ate, setAte] = useState(seguro?.valido_ate ?? '')
  const [cobertura, setCobertura] = useState(seguro?.cobertura ?? '')
  const [cobertos, setCobertos] = useState<string[]>(seguro?.cobertos ?? [meuId])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    if (!seguradora.trim()) return setErro('Qual a seguradora?')
    if (telefone.trim() && !/^\+?[0-9 ()./-]{6,30}$/.test(telefone.trim())) return setErro('O telefone só pode ter números, espaço, +, ( ) e -.')
    if (de && ate && ate < de) return setErro('O fim está antes do começo.')
    setSalvando(true)
    try {
      await salvarSeguro(
        supabase,
        viagemId,
        {
          seguradora: seguradora.trim(),
          telefone: telefone.trim() || null,
          apolice: apolice.trim() || null,
          valido_de: de || null,
          valido_ate: ate || null,
          cobertura: cobertura.trim() || null,
          cobertos,
        },
        seguro?.id,
      )
      aoTerminar()
    } catch (e) {
      setErro(mensagemDeErro(e, 'Não deu pra salvar o seguro.'))
      setSalvando(false)
    }
  }

  async function apagar() {
    if (!seguro) return
    setSalvando(true)
    try {
      await apagarSeguro(supabase, seguro.id)
      aoTerminar()
    } catch (e) {
      setErro(mensagemDeErro(e, 'Não deu pra apagar o seguro.'))
      setSalvando(false)
    }
  }

  return (
    <form className="form" onSubmit={salvar} noValidate>
      <h3>{seguro ? 'Editar seguro' : 'Cadastrar seguro'}</h3>
      <div className="form-campo">
        <label className="form-rotulo" htmlFor="seguro-nome">
          Seguradora
        </label>
        <input id="seguro-nome" maxLength={120} placeholder="Ex.: Assist Card" value={seguradora} onChange={(e) => setSeguradora(e.target.value)} />
      </div>
      <div className="form-linha">
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="seguro-tel">
            Telefone 24 h
          </label>
          <input id="seguro-tel" inputMode="tel" maxLength={30} placeholder="+55 11 …" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
        </div>
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="seguro-apolice">
            Nº da apólice
          </label>
          <input id="seguro-apolice" maxLength={60} value={apolice} onChange={(e) => setApolice(e.target.value)} />
        </div>
      </div>
      <div className="form-linha">
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="seguro-de">
            Válido de
          </label>
          <input id="seguro-de" type="date" value={de} onChange={(e) => setDe(e.target.value)} />
        </div>
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="seguro-ate">
            Até
          </label>
          <input id="seguro-ate" type="date" value={ate} min={de || undefined} onChange={(e) => setAte(e.target.value)} />
        </div>
      </div>
      <div className="form-campo">
        <label className="form-rotulo" htmlFor="seguro-cobertura">
          O que cobre (opcional)
        </label>
        <textarea id="seguro-cobertura" maxLength={500} placeholder="Ex.: médico até € 60 mil, bagagem, odontológico" value={cobertura} onChange={(e) => setCobertura(e.target.value)} />
      </div>
      <fieldset className="form-campo seguro-cobertos">
        <legend className="form-rotulo">Quem está coberto</legend>
        {membros.map((m) => (
          <label key={m.id}>
            <input
              type="checkbox"
              checked={cobertos.includes(m.id)}
              onChange={(e) => setCobertos(e.target.checked ? [...cobertos, m.id] : cobertos.filter((c) => c !== m.id))}
            />
            {m.nome}
          </label>
        ))}
      </fieldset>
      {erro && (
        <p className="form-erro" role="alert">
          {erro}
        </p>
      )}
      <div className="form-rodape">
        <button type="button" className="botao secundario" onClick={aoTerminar}>
          Cancelar
        </button>
        <button type="submit" className="botao" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
      {seguro && (
        <button type="button" className="botao-texto alinhar-inicio" onClick={apagar} disabled={salvando}>
          <Trash2 size={16} aria-hidden="true" /> Apagar seguro
        </button>
      )}
    </form>
  )
}

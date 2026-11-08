import { useEffect, useState, type FormEvent } from 'react'
import { MESES, buscarMinhaGalera, conferirViagemAntiga, criarViagemAntiga, procurarLugar, type LugarAchado, type PessoaDaGalera } from '@together/core'
import { supabase } from '../../lib/supabase'
import { hojeTexto } from '../destinos/datas'
import { MapPin, Search } from '../../components/ui/icones'

// "A gente já foi pra..." (spec 118f) no site: lugar, mês/ano e quem foi.
// Vira carimbo "de memória" e acende o mapa da galera. (Puxar da foto fica no app.)
export default function ViagemAntiga({ aoSalvar }: { aoSalvar: (nome: string) => void }) {
  const hoje = hojeTexto()
  const anoDeHoje = Number(hoje.slice(0, 4))
  const [texto, setTexto] = useState('')
  const [achados, setAchados] = useState<LugarAchado[]>([])
  const [lugar, setLugar] = useState<LugarAchado | null>(null)
  const [mes, setMes] = useState(0)
  const [ano, setAno] = useState(anoDeHoje - 1)
  const [galera, setGalera] = useState<PessoaDaGalera[]>([])
  const [pessoas, setPessoas] = useState<string[]>([])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    buscarMinhaGalera(supabase)
      .then(setGalera)
      .catch((e) => console.error('Erro ao buscar a galera:', e))
  }, [])

  // Busca depois que a pessoa para de digitar um instante (texto curto não mostra nada)
  const buscaValida = !lugar && texto.trim().length >= 2
  useEffect(() => {
    const t = texto.trim()
    if (lugar || t.length < 2) return
    const controle = new AbortController()
    const espera = setTimeout(() => {
      procurarLugar(t, controle.signal)
        .then(setAchados)
        .catch(() => !controle.signal.aborted && setAchados([]))
    }, 350)
    return () => {
      clearTimeout(espera)
      controle.abort()
    }
  }, [texto, lugar])

  const problema = mes ? conferirViagemAntiga(mes, ano, hoje) : null

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (!lugar || !mes || problema) return
    setErro(null)
    setSalvando(true)
    try {
      await criarViagemAntiga(supabase, { lugar, mes, ano, pessoas }, hoje)
      aoSalvar(lugar.nome)
    } catch (e) {
      console.error('Erro ao salvar a viagem antiga:', e)
      setErro('Não deu pra salvar. Confira a internet e tente de novo.')
      setSalvando(false)
    }
  }

  return (
    <form className="viagem-antiga" onSubmit={(e) => void salvar(e)}>
      <p className="dica">Conta uma viagem que já aconteceu. Ela vira um carimbo de memória e acende o mapa da galera.</p>

      <div className="campo">
        <label htmlFor="antiga-lugar">Onde</label>
        {lugar ? (
          <div className="viagem-antiga-escolhido">
            <MapPin size={18} aria-hidden="true" />
            <span>
              <strong>{lugar.nome}</strong>
              <small>{[lugar.regiao, lugar.pais].filter(Boolean).join(', ')}</small>
            </span>
            <button type="button" className="botao-texto" onClick={() => setLugar(null)}>
              Trocar
            </button>
          </div>
        ) : (
          <>
            <div className="viagem-antiga-busca">
              <Search size={18} aria-hidden="true" />
              <input id="antiga-lugar" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Cidade, praia ou país" autoComplete="off" />
            </div>
            {buscaValida && achados.length > 0 && (
              <ul className="viagem-antiga-achados">
                {achados.map((l) => (
                  <li key={`${l.nome}|${l.latitude}|${l.longitude}`}>
                    <button type="button" onClick={() => setLugar(l)}>
                      <strong>{l.nome}</strong>
                      <small>{[l.regiao, l.pais].filter(Boolean).join(', ')}</small>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <div className="viagem-antiga-quando">
        <div className="campo">
          <label htmlFor="antiga-mes">Mês</label>
          <select id="antiga-mes" value={mes} onChange={(e) => setMes(Number(e.target.value))}>
            <option value={0}>Escolha</option>
            {MESES.map((nome, i) => (
              <option key={nome} value={i + 1}>
                {nome}
              </option>
            ))}
          </select>
        </div>
        <div className="campo">
          <label htmlFor="antiga-ano">Ano</label>
          <input id="antiga-ano" type="number" inputMode="numeric" min={1950} max={anoDeHoje} value={ano} onChange={(e) => setAno(Number(e.target.value))} />
        </div>
      </div>
      {problema && <p className="form-erro">{problema}</p>}

      <fieldset className="viagem-antiga-galera">
        <legend>Quem foi</legend>
        {galera.map((p) => (
          <label key={p.id}>
            <input type="checkbox" checked={pessoas.includes(p.id)} onChange={(e) => setPessoas(e.target.checked ? [...pessoas, p.id] : pessoas.filter((x) => x !== p.id))} />
            {p.nome}
          </label>
        ))}
        <p className="dica">
          {galera.length === 0 ? 'Sua galera aparece aqui depois da primeira viagem juntos. ' : ''}
          Quem não está na lista entra pelo link de convite da viagem.
        </p>
      </fieldset>

      {erro && <p className="form-erro">{erro}</p>}
      <button type="submit" className="botao" disabled={!lugar || !mes || !!problema || salvando}>
        {salvando ? 'Salvando...' : 'Acender no mapa'}
      </button>
    </form>
  )
}

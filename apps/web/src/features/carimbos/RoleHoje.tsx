import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { TIPOS_DE_ROLE, criarRole, lugarPelaCoordenada, procurarLugar, type LugarAchado, type TipoDeRole } from '@together/core'
import { supabase } from '../../lib/supabase'
import { hojeTexto } from '../destinos/datas'
import { Locate, Search } from '../../components/ui/icones'
import './mapa-da-galera.css'

// "Rolê hoje" (spec 118f) no site, igual ao app: escolhe o tipo e o lugar (onde estou ou pela busca).
// Vira uma viagem de 1 dia, sem roteiro nem hospedagem. Se a pessoa já está lá, o carimbo cai na hora.
// A localização só serve pra achar o nome do lugar; não vai pro banco.
type Aqui = { situacao: 'parado' } | { situacao: 'olhando' } | { situacao: 'achou'; lugar: LugarAchado } | { situacao: 'nada' }

export default function RoleHoje() {
  const navegar = useNavigate()
  const [tipo, setTipo] = useState<TipoDeRole>('bate-volta')
  const [aqui, setAqui] = useState<Aqui>({ situacao: 'parado' })
  const [texto, setTexto] = useState('')
  const [achados, setAchados] = useState<LugarAchado[]>([])
  const [criando, setCriando] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  // Busca depois que a pessoa para de digitar um instante
  useEffect(() => {
    const t = texto.trim()
    if (t.length < 2) return
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
  }, [texto])

  function olharOndeEstou() {
    if (!navigator.geolocation) return setAqui({ situacao: 'nada' })
    setAqui({ situacao: 'olhando' })
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lugar = await lugarPelaCoordenada({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }).catch(() => null)
        setAqui(lugar ? { situacao: 'achou', lugar } : { situacao: 'nada' })
      },
      () => setAqui({ situacao: 'nada' }),
      { timeout: 10000 },
    )
  }

  async function criar(lugar: LugarAchado, estouAqui: boolean) {
    if (criando) return
    setErro(null)
    setCriando(lugar.nome)
    try {
      const id = await criarRole(supabase, { lugar, tipo, estouAqui }, hojeTexto())
      navegar(`/viagem/${id}`)
    } catch (e) {
      console.error('Erro ao criar o rolê:', e)
      setErro('Não deu pra criar o rolê. Confira a internet e tente de novo.')
      setCriando(null)
    }
  }

  return (
    <div className="role-hoje">
      <p className="dica">Sem roteiro, sem hospedagem. Chegou lá, o carimbo cai e acende o mapa da galera.</p>

      <div className="role-hoje-tipos" role="group" aria-label="Tipo de rolê">
        {TIPOS_DE_ROLE.map((t) => (
          <button key={t.tipo} type="button" className={tipo === t.tipo ? 'ativo' : ''} aria-pressed={tipo === t.tipo} onClick={() => setTipo(t.tipo)}>
            {t.titulo}
          </button>
        ))}
      </div>

      {aqui.situacao === 'achou' ? (
        <button type="button" className="role-hoje-aqui" onClick={() => void criar(aqui.lugar, true)} disabled={!!criando}>
          <Locate size={24} aria-hidden="true" />
          <span>
            <small>Estou aqui agora</small>
            <strong>{aqui.lugar.nome}</strong>
          </span>
        </button>
      ) : (
        <button type="button" className="role-hoje-usar" onClick={olharOndeEstou} disabled={aqui.situacao === 'olhando'}>
          <Locate size={18} aria-hidden="true" />
          {aqui.situacao === 'olhando' ? 'Vendo onde você está...' : aqui.situacao === 'nada' ? 'Não deu pra ver onde você está. Tentar de novo' : 'Usar onde estou'}
        </button>
      )}

      <div className="campo">
        <label htmlFor="role-lugar">Ou pra onde vocês vão</label>
        <div className="viagem-antiga-busca">
          <Search size={18} aria-hidden="true" />
          <input id="role-lugar" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Praia, cidade, casa de show..." autoComplete="off" />
        </div>
        {texto.trim().length >= 2 && achados.length > 0 && (
          <ul className="viagem-antiga-achados">
            {achados.map((l) => (
              <li key={`${l.nome}|${l.latitude}|${l.longitude}`}>
                <button type="button" onClick={() => void criar(l, false)} disabled={!!criando}>
                  <strong>{l.nome}</strong>
                  <small>{[l.regiao, l.pais].filter(Boolean).join(', ')}</small>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {criando && <p className="role-hoje-criando" role="status">Criando o rolê em {criando}...</p>}
      {erro && <p className="form-erro">{erro}</p>}
    </div>
  )
}

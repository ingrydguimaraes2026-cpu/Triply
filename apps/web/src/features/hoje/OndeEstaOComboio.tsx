import { useCallback, useEffect, useRef, useState } from 'react'
import { Locate, LocateOff } from 'lucide-react'
import { comboioPorPerto, textoDaDistancia, type Tables } from '@together/core'
import { supabase } from '../../lib/supabase'
import type { Membro } from '../viagens/hooks'
import Cartao from '../../components/ui/Cartao'
import BotaoIr from '../../components/ui/BotaoIr'
import './ferramentas.css'

type Posicao = Tables<'localizacoes_ao_vivo'>
const DURACOES = [1, 2, 4] // horas
const ATUALIZAR_A_CADA = 30_000 // ms: manda a posição e busca a dos outros

// Localização ao vivo temporária (spec 107): opcional, por tempo, só pro comboio.
// Atualiza enquanto o app está aberto (o navegador não deixa rodar fechado).
type Props = { viagemId: string; membros: Membro[]; meuId: string }
export default function OndeEstaOComboio({ viagemId, membros, meuId }: Props) {
  const [posicoes, setPosicoes] = useState<Posicao[]>([])
  const [minha, setMinha] = useState<{ latitude: number; longitude: number } | null>(null)
  const [ate, setAte] = useState<string | null>(null) // até quando estou compartilhando
  const [erro, setErro] = useState<string | null>(null)
  const [agora, setAgora] = useState(() => new Date())
  const ultimoEnvio = useRef(0)

  const buscar = useCallback(async () => {
    const { data } = await supabase.from('localizacoes_ao_vivo').select('*').eq('viagem_id', viagemId)
    const lista = data ?? []
    setPosicoes(lista)
    setAte(lista.find((p) => p.usuario_id === meuId)?.ate ?? null)
    setAgora(new Date())
  }, [viagemId, meuId])

  useEffect(() => {
    // Primeira busca logo, depois a cada 30 s
    const primeira = setTimeout(buscar, 0)
    const t = setInterval(buscar, ATUALIZAR_A_CADA)
    return () => {
      clearTimeout(primeira)
      clearInterval(t)
    }
  }, [buscar])

  // Enquanto compartilho: acompanha a posição e manda no máximo a cada 30 s
  const compartilhando = !!ate && Date.parse(ate) > agora.getTime()
  useEffect(() => {
    if (!compartilhando || !ate || !('geolocation' in navigator)) return
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const ponto = { latitude: p.coords.latitude, longitude: p.coords.longitude }
        setMinha(ponto)
        if (Date.now() - ultimoEnvio.current < ATUALIZAR_A_CADA) return
        ultimoEnvio.current = Date.now()
        supabase
          .from('localizacoes_ao_vivo')
          .upsert({ viagem_id: viagemId, usuario_id: meuId, ...ponto, precisao_m: Math.round(p.coords.accuracy), ate }, { onConflict: 'viagem_id,usuario_id' })
          .then(({ error }) => error && console.error('Erro ao mandar a posição:', error))
      },
      () => setErro('O celular não liberou a localização. Libere pro site nas configurações.'),
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 },
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [compartilhando, ate, viagemId, meuId])

  function comecar(horas: number) {
    setErro(null)
    if (!('geolocation' in navigator)) return setErro('Este aparelho não tem localização.')
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        const fim = new Date(Date.now() + horas * 3600_000).toISOString()
        const ponto = { latitude: p.coords.latitude, longitude: p.coords.longitude }
        const { error } = await supabase
          .from('localizacoes_ao_vivo')
          .upsert({ viagem_id: viagemId, usuario_id: meuId, ...ponto, precisao_m: Math.round(p.coords.accuracy), ate: fim }, { onConflict: 'viagem_id,usuario_id' })
        if (error) return setErro('Não deu pra compartilhar agora. Tente de novo.')
        ultimoEnvio.current = Date.now()
        setMinha(ponto)
        buscar()
      },
      () => setErro('O celular não liberou a localização. Libere pro site nas configurações.'),
      { enableHighAccuracy: true, timeout: 20000 },
    )
  }

  async function parar() {
    await supabase.from('localizacoes_ao_vivo').delete().eq('viagem_id', viagemId).eq('usuario_id', meuId)
    buscar()
  }

  const outros = comboioPorPerto(
    posicoes.filter((p) => p.usuario_id !== meuId),
    minha,
    agora,
  )
  const nome = (id: string) => membros.find((m) => m.id === id)?.nome.split(' ')[0] ?? 'Alguém'
  const restam = ate ? Math.max(0, Math.round((Date.parse(ate) - agora.getTime()) / 60000)) : 0

  return (
    <Cartao titulo="Onde está o comboio" icone={Locate}>
      {outros.length > 0 ? (
        <ul className="ao-vivo-lista">
          {outros.map((o) => (
            <li key={o.usuarioId}>
              <span>
                <strong>{nome(o.usuarioId)}</strong>
                <small>
                  {o.metros !== null ? `${textoDaDistancia(o.metros)} de você · ` : ''}
                  {o.minutosAtras === 0 ? 'agora' : `há ${o.minutosAtras} min`}
                </small>
              </span>
              <BotaoIr alvo={{ latitude: o.latitude, longitude: o.longitude, nome: nome(o.usuarioId) }} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="dica">Ninguém está compartilhando agora. Útil em show, parque ou cidade grande.</p>
      )}

      {compartilhando ? (
        <p className="ao-vivo-meu">
          Você está compartilhando ({restam >= 60 ? `${Math.floor(restam / 60)} h ${restam % 60} min` : `${restam} min`} restantes).{' '}
          <button type="button" className="botao-texto" onClick={parar}>
            <LocateOff size={14} aria-hidden="true" /> Parar
          </button>
        </p>
      ) : (
        <div className="ao-vivo-acoes">
          <span className="dica">Compartilhar a minha por:</span>
          {DURACOES.map((h) => (
            <button key={h} type="button" className="botao secundario pequeno" onClick={() => comecar(h)}>
              {h} h
            </button>
          ))}
        </div>
      )}
      <p className="dica">Só o comboio vê, e só até acabar o tempo. Atualiza com o app aberto.</p>
      {erro && (
        <p className="form-erro" role="alert">
          {erro}
        </p>
      )}
    </Cartao>
  )
}

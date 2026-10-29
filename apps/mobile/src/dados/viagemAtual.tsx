import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { listarViagensComDetalhes, type ViagemComDetalhes } from '@together/core'
import { supabase } from '../lib/supabase'
import { useSessao } from '../lib/sessao'
import { hojeIso } from '../lib/formato'

// Qual viagem as abas Roteiro, Contas e Fotos mostram. Começa na próxima viagem
// (ou na que está rolando); muda quando a pessoa abre outra na home.
type Contexto = {
  status: 'carregando' | 'erro' | 'pronto'
  viagens: ViagemComDetalhes[]
  atual: ViagemComDetalhes | null
  meuId: string
  escolher: (id: string) => void
  recarregar: () => void
}

const Ctx = createContext<Contexto | null>(null)

export function ProvedorViagemAtual({ children }: { children: ReactNode }) {
  const { sessao } = useSessao()
  const meuId = sessao?.user.id ?? ''
  const [viagens, setViagens] = useState<ViagemComDetalhes[]>([])
  const [status, setStatus] = useState<Contexto['status']>('carregando')
  const [escolhida, setEscolhida] = useState<string | null>(null)
  const [vez, setVez] = useState(0)

  useEffect(() => {
    if (!meuId) return
    let vivo = true
    listarViagensComDetalhes(supabase)
      .then((lista) => {
        if (!vivo) return
        setViagens(lista)
        setStatus('pronto')
      })
      .catch(() => vivo && setStatus('erro'))
    return () => {
      vivo = false
    }
  }, [meuId, vez])

  const atual = useMemo(() => viagens.find((v) => v.id === escolhida) ?? proximaViagem(viagens), [viagens, escolhida])
  const recarregar = useCallback(() => setVez((v) => v + 1), [])

  return (
    <Ctx.Provider value={{ status, viagens, atual, meuId, escolher: setEscolhida, recarregar }}>{children}</Ctx.Provider>
  )
}

export function useViagemAtual() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useViagemAtual fora do ProvedorViagemAtual')
  return ctx
}

// A que está rolando ou a próxima a começar; se todas já passaram, a mais recente.
export function proximaViagem(viagens: ViagemComDetalhes[]): ViagemComDetalhes | null {
  const hoje = hojeIso()
  const futuras = viagens
    .filter((v) => (v.dataFim ?? v.dataInicio ?? '9999') >= hoje)
    .sort((a, b) => (a.dataInicio ?? '9999').localeCompare(b.dataInicio ?? '9999'))
  return futuras[0] ?? viagens[0] ?? null
}

// Viagens que já acabaram (lista "Viagens passadas" da home)
export function viagensPassadas(viagens: ViagemComDetalhes[]) {
  const hoje = hojeIso()
  return viagens
    .filter((v) => v.dataFim && v.dataFim < hoje)
    .sort((a, b) => (b.dataInicio ?? '').localeCompare(a.dataInicio ?? ''))
}

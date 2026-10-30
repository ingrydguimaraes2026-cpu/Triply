import { useEffect, useRef } from 'react'

// Tempo real (spec 085): quando o banco avisa que uma tabela mudou, a moldura da viagem
// solta este evento na janela. Cada aba escuta só as tabelas que mostra.
export const EVENTO_MUDOU = 'together:mudou'

export function avisarQueMudou(tabela: string) {
  window.dispatchEvent(new CustomEvent(EVENTO_MUDOU, { detail: tabela }))
}

// Roda `fazer` quando alguma das tabelas mudar (vindo de outra pessoa, pelo Realtime).
// Ex.: useAoMudar(['trajetos'], recarregar)
export function useAoMudar(tabelas: string[], fazer: () => void) {
  // Guarda a função mais nova sem precisar refazer a escuta a cada render
  const fazerRef = useRef(fazer)
  useEffect(() => {
    fazerRef.current = fazer
  })
  const chave = tabelas.join(',')
  useEffect(() => {
    const lista = chave.split(',')
    function aoMudar(e: Event) {
      if (lista.includes((e as CustomEvent<string>).detail)) fazerRef.current()
    }
    window.addEventListener(EVENTO_MUDOU, aoMudar)
    return () => window.removeEventListener(EVENTO_MUDOU, aoMudar)
  }, [chave])
}

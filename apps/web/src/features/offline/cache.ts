// Offline de leitura (spec 034). O service worker guarda as leituras (vite.config.ts → runtimeCaching).
// Aqui: saber se está sem internet e apagar as cópias ao sair da conta (celular emprestado não mostra
// a viagem de outra pessoa).
import { useSyncExternalStore } from 'react'

export const CACHES_DO_TOGETHER = ['together-dados', 'together-arquivos', 'together-clima']

export async function apagarCopiasOffline() {
  if (!('caches' in window)) return
  await Promise.all(CACHES_DO_TOGETHER.map((nome) => caches.delete(nome).catch(() => false)))
}

function assinar(avisar: () => void) {
  window.addEventListener('online', avisar)
  window.addEventListener('offline', avisar)
  return () => {
    window.removeEventListener('online', avisar)
    window.removeEventListener('offline', avisar)
  }
}

// true quando o aparelho está sem internet
export function useSemInternet(): boolean {
  return useSyncExternalStore(
    assinar,
    () => !navigator.onLine,
    () => false,
  )
}

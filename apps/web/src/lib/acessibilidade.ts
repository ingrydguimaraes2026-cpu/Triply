import { useEffect, useState } from 'react'
import { lerPreferencias, type Preferencias } from '@together/core'

// Acessibilidade e modo simples (spec 090). Fica no aparelho (cada celular escolhe o seu).
const CHAVE = 'together:acessibilidade'
const EVENTO = 'together:acessibilidade-mudou'

export function preferenciasDoAparelho(): Preferencias {
  try {
    return lerPreferencias(localStorage.getItem(CHAVE))
  } catch {
    return lerPreferencias(null)
  }
}

// Põe as escolhas no <html> (o CSS do global.css faz o resto)
export function aplicarAcessibilidade(p: Preferencias = preferenciasDoAparelho()) {
  const html = document.documentElement
  html.dataset.fonte = p.fonte
  html.dataset.contraste = p.contraste ? 'alto' : 'normal'
  html.dataset.tema = p.escuro ? 'escuro' : 'claro' // spec 109
}

export function salvarAcessibilidade(p: Preferencias) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(p))
  } catch {
    // sem localStorage: vale só até fechar
  }
  aplicarAcessibilidade(p)
  window.dispatchEvent(new Event(EVENTO))
}

export function useAcessibilidade(): Preferencias {
  const [p, setP] = useState(preferenciasDoAparelho)
  useEffect(() => {
    const atualizar = () => setP(preferenciasDoAparelho())
    window.addEventListener(EVENTO, atualizar)
    return () => window.removeEventListener(EVENTO, atualizar)
  }, [])
  return p
}

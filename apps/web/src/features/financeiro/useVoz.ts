import { useCallback, useEffect, useRef, useState } from 'react'

// Ditado pelo microfone (spec 093), usando o reconhecimento de fala do próprio navegador
// (Chrome/Edge/Safari). Onde não existe, `disponivel` é false e o botão nem aparece.

type Resultado = { results: ArrayLike<ArrayLike<{ transcript: string }>> }
type Reconhecedor = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((e: Resultado) => void) | null
  onend: (() => void) | null
  onerror: ((e: { error: string }) => void) | null
  start: () => void
  stop: () => void
}
type Construtor = new () => Reconhecedor

function construtor(): Construtor | null {
  const w = window as unknown as { SpeechRecognition?: Construtor; webkitSpeechRecognition?: Construtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function useVoz(aoOuvir: (texto: string) => void) {
  const [ouvindo, setOuvindo] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const ref = useRef<Reconhecedor | null>(null)
  const disponivel = typeof window !== 'undefined' && construtor() !== null

  useEffect(() => () => ref.current?.stop(), [])

  const ouvir = useCallback(() => {
    const C = construtor()
    if (!C) return
    setErro(null)
    const r = new C()
    r.lang = 'pt-BR'
    r.interimResults = false
    r.maxAlternatives = 1
    r.onresult = (e) => aoOuvir(e.results[0]?.[0]?.transcript ?? '')
    r.onerror = (e) => setErro(e.error === 'not-allowed' ? 'Libere o microfone pro site nas configurações do navegador.' : 'Não deu pra ouvir. Tente de novo.')
    r.onend = () => setOuvindo(false)
    ref.current = r
    setOuvindo(true)
    r.start()
  }, [aoOuvir])

  const parar = useCallback(() => ref.current?.stop(), [])

  return { disponivel, ouvindo, erro, ouvir, parar }
}

import { useEffect, useRef, useState } from 'react'
import { buscarCidades, type Cidade } from './buscarCidades'

type Resultado = {
  texto: string // o texto que gerou esta lista
  lugares: Cidade[]
  completo: boolean // as duas fontes já responderam
}

/**
 * Busca de lugares enquanto a pessoa digita (usada na criação da viagem e no editor do roteiro).
 * - Espera a pessoa parar de digitar e cancela a busca anterior.
 * - Mantém a lista anterior na tela enquanto a nova não chega.
 * - O Enter só escolhe um lugar da busca do texto ATUAL. Se ela ainda estiver
 *   carregando, escolhe o primeiro assim que chegar.
 */
export function useBuscaDeLugares(texto: string, aoEscolher: (lugar: Cidade) => void, buscar = buscarCidades) {
  const limpo = texto.trim()
  const valida = limpo.length >= 2
  const [resultado, setResultado] = useState<Resultado>({ texto: '', lugares: [], completo: true })
  const enterPendente = useRef<string | null>(null)
  const aoEscolherRef = useRef(aoEscolher)

  useEffect(() => {
    aoEscolherRef.current = aoEscolher
  })

  useEffect(() => {
    if (!valida) return
    const controle = new AbortController()
    const timer = setTimeout(() => {
      buscar(
        limpo,
        (lugares) => {
          setResultado({ texto: limpo, lugares, completo: false })
          if (enterPendente.current === limpo && lugares[0]) {
            enterPendente.current = null
            aoEscolherRef.current(lugares[0])
          }
        },
        controle.signal,
      ).finally(() => {
        if (controle.signal.aborted) return
        setResultado((r) => (r.texto === limpo ? { ...r, completo: true } : { texto: limpo, lugares: [], completo: true }))
      })
    }, 250)
    return () => {
      clearTimeout(timer)
      controle.abort()
    }
  }, [limpo, valida, buscar])

  const atual = resultado.texto === limpo
  const buscando = valida && !(atual && resultado.completo)
  const sugestoes = valida ? resultado.lugares : []

  function escolherComEnter() {
    if (!valida) return
    if (atual && resultado.lugares[0]) {
      enterPendente.current = null
      aoEscolher(resultado.lugares[0])
    } else if (buscando) {
      enterPendente.current = limpo
    }
  }

  return { sugestoes, buscando, valida, escolherComEnter }
}

import { useCallback, useEffect, useState } from 'react'
import { buscarPosts, type Post } from './api'

type Estado = { status: 'carregando' } | { status: 'erro' } | { status: 'pronto'; posts: Post[] }

// Posts do feed da viagem. `mudarPost` atualiza um post na tela na hora (curtir, comentar), sem esperar o servidor.
export function usePosts(viagemId: string) {
  const [estado, setEstado] = useState<Estado>({ status: 'carregando' })

  const buscar = useCallback(async (): Promise<Estado> => {
    try {
      return { status: 'pronto', posts: await buscarPosts(viagemId) }
    } catch (erro) {
      console.error('Erro ao carregar o feed:', erro)
      return { status: 'erro' }
    }
  }, [viagemId])

  useEffect(() => {
    let ativo = true
    buscar().then((novo) => {
      if (ativo) setEstado(novo)
    })
    return () => {
      ativo = false
    }
  }, [buscar])

  const recarregar = useCallback(async () => setEstado(await buscar()), [buscar])

  const mudarPost = useCallback((id: string, mudar: (p: Post) => Post) => {
    setEstado((atual) => (atual.status === 'pronto' ? { ...atual, posts: atual.posts.map((p) => (p.id === id ? mudar(p) : p)) } : atual))
  }, [])

  const tirarPost = useCallback((id: string) => {
    setEstado((atual) => (atual.status === 'pronto' ? { ...atual, posts: atual.posts.filter((p) => p.id !== id) } : atual))
  }, [])

  return { estado, recarregar, mudarPost, tirarPost }
}

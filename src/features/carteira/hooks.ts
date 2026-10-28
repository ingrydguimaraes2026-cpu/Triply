import { useCallback, useEffect, useState } from 'react'
import { minhaCarteira, minhaConexao, movimentos, saldoDoComboio, type Carteira, type Conexao, type Movimento } from './api'

export type EstadoCarteira =
  | { status: 'carregando' }
  | { status: 'erro' }
  | { status: 'pronto'; conexao: Conexao | null; carteira: Carteira | null; movimentos: Movimento[]; comboio: number }

const VAZIO: EstadoCarteira = { status: 'pronto', conexao: null, carteira: null, movimentos: [], comboio: 0 }

// Carrega a conexão do Gmail, a minha carteira, os movimentos e o total do comboio.
// `ativo` = false (viagem fora do euro) não busca nada, pra não gastar requisição à toa.
export function useCarteira(viagemId: string, meuId: string, ativo = true) {
  const [estado, setEstado] = useState<EstadoCarteira>(ativo ? { status: 'carregando' } : VAZIO)

  const recarregar = useCallback(async () => {
    try {
      const [conexao, carteira, comboio] = await Promise.all([minhaConexao(), minhaCarteira(viagemId, meuId), saldoDoComboio(viagemId)])
      const movs = carteira ? await movimentos(carteira.id) : []
      setEstado({ status: 'pronto', conexao, carteira, movimentos: movs, comboio })
    } catch (e) {
      console.error('Erro ao carregar a carteira:', e)
      setEstado({ status: 'erro' })
    }
  }, [viagemId, meuId])

  useEffect(() => {
    if (!ativo) return
    setEstado({ status: 'carregando' })
    recarregar()
  }, [recarregar, ativo])

  return { estado, recarregar }
}

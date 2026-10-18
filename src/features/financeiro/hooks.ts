import { useCallback, useEffect, useState } from 'react'
import { buscarCompras, type CompraDeMoeda } from '../cambio/api'
import { buscarGastos, buscarOrcamentos, buscarPerfis, EVENTO_GASTOS, type Gasto, type Orcamento, type Perfil } from './api'
import type { Membro } from '../viagens/hooks'

export type DadosFinanceiros = {
  gastos: Gasto[]
  orcamentos: Orcamento[]
  compras: CompraDeMoeda[]
  exMembros: Perfil[] // quem saiu do comboio mas aparece em gastos
}

type Estado = { status: 'carregando' } | { status: 'erro' } | { status: 'pronto'; dados: DadosFinanceiros }

// Tudo que a aba Financeiro mostra, buscado em paralelo.
// Atualiza sozinho quando um gasto é lançado em outro lugar (botão "+", fila offline).
export function useFinanceiro(viagemId: string, membros: Membro[]) {
  const [estado, setEstado] = useState<Estado>({ status: 'carregando' })
  const idsDoComboio = membros.map((m) => m.id).join()

  const buscar = useCallback(async (): Promise<Estado> => {
    try {
      const [gastos, orcamentos, compras] = await Promise.all([
        buscarGastos(viagemId),
        buscarOrcamentos(viagemId),
        buscarCompras(viagemId),
      ])
      const noComboio = new Set(idsDoComboio.split(','))
      const fora = new Set<string>()
      for (const g of gastos) {
        for (const id of [g.pago_por, g.criado_por, ...g.divisoes.map((d) => d.usuarioId)]) if (!noComboio.has(id)) fora.add(id)
      }
      for (const c of compras) if (!noComboio.has(c.usuario_id)) fora.add(c.usuario_id)
      const exMembros = await buscarPerfis([...fora]).catch(() => [])
      return { status: 'pronto', dados: { gastos, orcamentos, compras, exMembros } }
    } catch (erro) {
      console.error('Erro ao carregar o financeiro:', erro)
      return { status: 'erro' }
    }
  }, [viagemId, idsDoComboio])

  const carregar = useCallback(async () => setEstado(await buscar()), [buscar])

  useEffect(() => {
    let ativo = true
    const aoMudar = () =>
      buscar().then((novo) => {
        if (ativo) setEstado(novo)
      })
    aoMudar()
    window.addEventListener(EVENTO_GASTOS, aoMudar)
    return () => {
      ativo = false
      window.removeEventListener(EVENTO_GASTOS, aoMudar)
    }
  }, [buscar])

  return { estado, recarregar: carregar }
}

// Nome de qualquer pessoa que aparece no financeiro (do comboio ou ex-membro)
export function nomeDaPessoa(id: string, membros: Membro[], exMembros: Perfil[], meuId?: string) {
  if (id === meuId) return 'Você'
  const m = membros.find((x) => x.id === id)
  if (m) return m.nome.split(' ')[0]
  const ex = exMembros.find((x) => x.id === id)
  return ex ? `${ex.nome.split(' ')[0]} (ex-membro)` : 'Ex-membro'
}

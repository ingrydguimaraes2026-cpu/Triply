import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { buscarCompras, cotacoesDeHoje, type CompraDeMoeda } from '../cambio/api'
import { converter, montarTaxas } from '../cambio/cotacao'
import { deBanco } from '@together/core'
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

export type ResumoFinanceiro = { gasto: number; meta: number; pessoal: number; semCotacao: boolean }

// Cartão "Orçamento" da Overview (spec 006): só os números, sem trazer a lista inteira de gastos
export function useResumoFinanceiro(viagemId: string, moeda: string) {
  const [resumo, setResumo] = useState<ResumoFinanceiro | null | 'erro'>(null)

  const buscar = useCallback(async (): Promise<ResumoFinanceiro | 'erro'> => {
    const [gastos, orcamentos, compras] = await Promise.all([
      supabase.from('gastos').select('valor, moeda, pessoal').eq('viagem_id', viagemId),
      supabase.from('orcamentos').select('valor_meta').eq('viagem_id', viagemId),
      supabase.from('compras_cambio').select('moeda_origem, moeda_destino, valor_origem, valor_destino').eq('viagem_id', viagemId),
    ])
    if (gastos.error || orcamentos.error || compras.error) return 'erro'
    const outras = [...new Set(gastos.data.map((g) => g.moeda).filter((m) => m !== moeda))]
    const hoje = outras.length ? ((await cotacoesDeHoje(moeda, outras)) ?? {}) : {}
    const taxas = montarTaxas(
      compras.data.map((c) => ({
        moedaOrigem: c.moeda_origem,
        moedaDestino: c.moeda_destino,
        valorOrigem: deBanco(c.valor_origem),
        valorDestino: deBanco(c.valor_destino),
      })),
      moeda,
      hoje,
    )
    let semCotacao = false
    const somar = (lista: typeof gastos.data) =>
      lista.reduce((s, g) => {
        const v = converter(deBanco(g.valor), g.moeda, moeda, taxas)
        if (v === null) semCotacao = true
        return s + (v ?? 0)
      }, 0)
    return {
      gasto: somar(gastos.data.filter((g) => !g.pessoal)),
      pessoal: somar(gastos.data.filter((g) => g.pessoal)),
      meta: orcamentos.data.reduce((s, o) => s + deBanco(o.valor_meta), 0),
      semCotacao,
    }
  }, [viagemId, moeda])

  useEffect(() => {
    let ativo = true
    const atualizar = () =>
      buscar().then((novo) => {
        if (ativo) setResumo(novo)
      })
    atualizar()
    window.addEventListener(EVENTO_GASTOS, atualizar)
    return () => {
      ativo = false
      window.removeEventListener(EVENTO_GASTOS, atualizar)
    }
  }, [buscar])

  return resumo
}
import { buscarAtividades, montarPassos } from '@together/core'
import { supabase } from '../../lib/supabase'
import type { ResumoDaViagem } from './api'

// Início (spec 117), igual ao app: quantos carimbos a próxima viagem já tem
// e o que o comboio fez por último ("No comboio agora").
export async function carregarResumoDoInicio(viagem: ResumoDaViagem, meuId: string) {
  const contar = (tabela: 'lugares' | 'trajetos' | 'gastos') => supabase.from(tabela).select('id', { count: 'exact', head: true }).eq('viagem_id', viagem.id)
  const [lugares, trajetos, gastos, escolhida, atividades] = await Promise.all([
    contar('lugares'),
    contar('trajetos'),
    contar('gastos'),
    supabase.from('hospedagens').select('id', { count: 'exact', head: true }).eq('viagem_id', viagem.id).eq('escolhida', true),
    buscarAtividades(supabase, viagem.id, 10).catch(() => []),
  ])
  const passos = montarPassos({
    lugares: lugares.count ?? 0,
    pessoas: viagem.membros.length,
    temDatas: !!viagem.dataInicio,
    hospedagens: escolhida.count ?? 0,
    trajetos: trajetos.count ?? 0,
    gastos: gastos.count ?? 0,
    euSouAdm: viagem.souAdm,
  })
  return {
    carimbos: passos.filter((p) => p.feito).length,
    total: passos.length,
    // Só o que os outros fizeram (o meu eu já sei)
    agora: atividades.filter((a) => a.autor && a.autor !== meuId).slice(0, 3),
  }
}

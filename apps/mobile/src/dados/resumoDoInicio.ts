import { buscarAtividades, type ViagemComDetalhes } from '@together/core'
import { supabase } from '../lib/supabase'
import { montarPassos } from '../ui/PassosDaViagem'

// Início (spec 117): quantos carimbos a próxima viagem já tem e o que o comboio fez por último.
export async function carregarResumoDoInicio(viagem: ViagemComDetalhes, meuId: string) {
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
    euSouAdm: viagem.membros.some((m) => m.id === meuId && m.papel === 'adm'),
  })
  return {
    carimbos: passos.filter((p) => p.feito).length,
    total: passos.length,
    // "No comboio agora": só o que os outros fizeram (o meu eu já sei)
    agora: atividades.filter((a) => a.autor && a.autor !== meuId).slice(0, 3),
  }
}

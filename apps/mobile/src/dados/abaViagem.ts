import {
  buscarAlertasDePassaporte,
  buscarAtividades,
  buscarGastos,
  buscarOpcoesDeHospedagem,
  buscarSeguros,
  buscarTrajetos,
  buscarViagemComDetalhes,
  buscarVistoEm,
  lerDiasDoRoteiro,
  semSeguro,
} from '@together/core'
import { supabase } from '../lib/supabase'

// Tudo que a aba Viagem (spec 117) mostra, numa ida só ao banco.
export type DiaDoCarrossel = { numero: number; titulo: string; foto: string | null; destinoId: string }

export async function carregarAbaViagem(id: string) {
  const [viagem, gastos, trajetos, lugares, opcoes, atividades, vistoEm, roteiros, alertas, seguros, fotos, visitados] = await Promise.all([
    buscarViagemComDetalhes(supabase, id),
    buscarGastos(supabase, id),
    buscarTrajetos(supabase, id),
    supabase.from('lugares').select('id', { count: 'exact', head: true }).eq('viagem_id', id),
    buscarOpcoesDeHospedagem(supabase, id),
    buscarAtividades(supabase, id, 30).catch(() => []),
    buscarVistoEm(supabase, id).catch(() => null),
    supabase.from('roteiros').select('destino_id, dias, destinos!inner (ordem)').eq('viagem_id', id),
    buscarAlertasDePassaporte(supabase, id).catch(() => []),
    buscarSeguros(supabase, id).catch(() => []),
    // Pros números das Lembranças (fase "voltou")
    supabase.from('fotos').select('id', { count: 'exact', head: true }).eq('viagem_id', id),
    supabase.from('lugares').select('id', { count: 'exact', head: true }).eq('viagem_id', id).not('visitado_em', 'is', null),
  ])
  if (!viagem) return null

  // Carrossel do roteiro: um cartão por dia montado, com a foto do 1º lugar do dia
  const porDestino = (roteiros.data ?? [])
    .map((r) => ({ destinoId: r.destino_id, ordem: (r.destinos as unknown as { ordem: number }).ordem, dias: lerDiasDoRoteiro(r.dias) }))
    .sort((a, b) => a.ordem - b.ordem)
  const ids = [...new Set(porDestino.flatMap((r) => r.dias.flatMap((d) => d.slice(0, 2))))]
  // Os dias guardam ids de `lugares`; a foto vem do catálogo do Explorar (mesmo item da Wikidata)
  const { data: doRoteiro } = ids.length ? await supabase.from('lugares').select('id, nome, wikidata').in('id', ids) : { data: [] }
  const qids = [...new Set((doRoteiro ?? []).map((l) => l.wikidata).filter((q): q is string => !!q))]
  const { data: fotosDoCatalogo } = qids.length ? await supabase.from('catalogo_lugares').select('wikidata, foto_url').in('wikidata', qids).not('foto_url', 'is', null) : { data: [] }
  const fotoDo = new Map((fotosDoCatalogo ?? []).map((f) => [f.wikidata as string, f.foto_url as string]))
  const doCatalogo = new Map((doRoteiro ?? []).map((l) => [l.id, { nome: l.nome, foto_url: (l.wikidata && fotoDo.get(l.wikidata)) || null }]))
  const dias: DiaDoCarrossel[] = []
  for (const r of porDestino)
    for (const d of r.dias) {
      const doDia = d.slice(0, 2).map((x) => doCatalogo.get(x)).filter((c): c is NonNullable<typeof c> => !!c)
      if (!doDia.length) continue
      dias.push({ numero: dias.length + 1, titulo: doDia.map((c) => c.nome).join(' e '), foto: doDia.find((c) => c.foto_url)?.foto_url ?? null, destinoId: r.destinoId })
    }

  const comProblemaNoPassaporte = new Set(alertas.map((a) => a.usuarioId)).size
  return {
    viagem,
    gastos,
    trajetos,
    lugares: lugares.count ?? 0,
    fotos: fotos.count ?? 0,
    visitados: visitados.count ?? 0,
    opcoes,
    atividades,
    vistoEm,
    dias,
    passaportesOk: viagem.membros.length - comProblemaNoPassaporte,
    semSeguro: seguros.length ? semSeguro(seguros, viagem.membros).length : null, // null = ninguém cadastrou seguro
  }
}

export type DadosDaAbaViagem = NonNullable<Awaited<ReturnType<typeof carregarAbaViagem>>>

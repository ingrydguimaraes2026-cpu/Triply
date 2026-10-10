import { supabase } from '../../lib/supabase'
import type { Cidade } from '../destinos/buscarCidades'

type NovaViagem = {
  nome: string
  dataInicio: string | null
  dataFim: string | null
  moeda: string
  destinos: Cidade[]
}

// Cria a viagem (quem cria vira ADM sozinho) e salva os destinos na ordem
export async function criarViagem(dados: NovaViagem) {
  const { data: viagem, error } = await supabase
    .from('viagens')
    .insert({
      nome: dados.nome,
      data_inicio: dados.dataInicio,
      data_fim: dados.dataFim,
      moeda_principal: dados.moeda,
    })
    .select('id')
    .single()
  if (error) throw error

  const { error: erroDestinos } = await supabase.from('destinos').insert(
    dados.destinos.map((d, ordem) => ({
      viagem_id: viagem.id,
      nome: d.nome,
      pais: d.pais,
      latitude: d.latitude,
      longitude: d.longitude,
      ordem,
    })),
  )
  if (erroDestinos) throw erroDestinos

  return viagem.id
}

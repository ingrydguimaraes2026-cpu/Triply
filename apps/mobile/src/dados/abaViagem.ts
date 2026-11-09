// A carga da aba Viagem foi pro @together/core (o site usa a mesma). Aqui só liga o cliente do app.
import { carregarAbaViagem as carregar } from '@together/core'
import { supabase } from '../lib/supabase'

export type { DadosDaAbaViagem, DiaDoCarrossel } from '@together/core'

export function carregarAbaViagem(id: string) {
  return carregar(supabase, id)
}

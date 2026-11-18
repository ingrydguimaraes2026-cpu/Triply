import { buscarDestinos, buscarOpcoesDeHospedagem, buscarTrajetos } from '@together/core'
import { supabase } from '../lib/supabase'
import { useCarregar } from './useCarregar'

// Spec 123: o que as telas de hospedagem precisam (noites, cidade e opção).
// Recarrega ao voltar pra tela (depois de pôr ou editar uma opção): o useCarregar faz isso.
export function useHospedagemDaViagem(viagemId: string | undefined) {
  return useCarregar(
    viagemId
      ? async () => {
          const [opcoes, destinos, trajetos] = await Promise.all([
            buscarOpcoesDeHospedagem(supabase, viagemId),
            buscarDestinos(supabase, viagemId),
            buscarTrajetos(supabase, viagemId, { comOpcoes: true }),
          ])
          // Chegada e volta de cada um não contam como "o grupo chega na cidade"
          const doGrupo = trajetos.filter((t) => t.tipo !== 'chegada' && t.tipo !== 'saida')
          return { opcoes, destinos, trajetos: doGrupo }
        }
      : null,
    [viagemId],
    'hospedagem',
  )
}

// Editar as cidades do roteiro no app: tirar uma cidade e mudar as datas de chegada e saída.
// Usa a mesma função do banco que o site (`salvar_roteiro`): tudo ou nada, só apaga o que a pessoa tirou.
// Ao tirar uma cidade, deslocamentos, hospedagens, lugares e fotos ficam na viagem, só perdem a ligação.
import type { ClienteTogether } from './supabase'
import type { Tables } from './database'

type Destino = Tables<'destinos'>

export type DestinoEditado = { id: string; chegada: string | null; saida: string | null }

export type LigadosAoDestino = { trajetos: number; hospedagens: number; lugares: number; fotos: number }

// O que está ligado à cidade, pra avisar antes de tirar
export async function contarLigadosAoDestino(cli: ClienteTogether, destinoId: string): Promise<LigadosAoDestino> {
  const [trajetos, hospedagens, lugares, fotos] = await Promise.all([
    cli.from('trajetos').select('id', { count: 'exact', head: true }).or(`origem_id.eq.${destinoId},destino_id.eq.${destinoId}`),
    cli.from('hospedagens').select('id', { count: 'exact', head: true }).eq('destino_id', destinoId),
    cli.from('lugares').select('id', { count: 'exact', head: true }).eq('destino_id', destinoId),
    cli.from('fotos').select('id', { count: 'exact', head: true }).eq('destino_id', destinoId),
  ])
  for (const r of [trajetos, hospedagens, lugares, fotos]) if (r.error) throw r.error
  return { trajetos: trajetos.count ?? 0, hospedagens: hospedagens.count ?? 0, lugares: lugares.count ?? 0, fotos: fotos.count ?? 0 }
}

// "2 deslocamentos, 1 opção de hospedagem e 3 fotos" (vazio se nada)
export function textoDosLigados(l: LigadosAoDestino): string {
  const partes = [
    l.trajetos && `${l.trajetos} ${l.trajetos === 1 ? 'deslocamento' : 'deslocamentos'}`,
    l.hospedagens && `${l.hospedagens} ${l.hospedagens === 1 ? 'opção de hospedagem' : 'opções de hospedagem'}`,
    l.lugares && `${l.lugares} ${l.lugares === 1 ? 'lugar' : 'lugares'}`,
    l.fotos && `${l.fotos} ${l.fotos === 1 ? 'foto' : 'fotos'}`,
  ].filter((p): p is string => !!p)
  if (partes.length <= 1) return partes.join('')
  return `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}`
}

// Erros do salvamento em linguagem simples
export function erroAoSalvarDestinos(erro: unknown): string {
  const campo = (nome: 'code' | 'message') => (typeof erro === 'object' && erro !== null && nome in erro ? String((erro as Record<string, unknown>)[nome] ?? '') : '')
  const codigo = campo('code')
  if (codigo === 'TR409') return 'O roteiro mudou em outro aparelho. Volte e abra de novo. Nada foi alterado.'
  if (codigo === 'TR422') return `${campo('message')}. Nada foi alterado.`
  if (codigo === '42501') return 'Só o ADM (ou quem ele liberou) muda o roteiro. Nada foi alterado.'
  if (/failed to fetch|network|load failed/i.test(campo('message'))) return 'Sem conexão com o servidor. Confira a internet e tente de novo.'
  return 'Não deu pra salvar o roteiro. Nada foi alterado.'
}

/**
 * Salva a lista que ficou (na ordem) com as datas novas e tira as cidades removidas.
 * `salvos` é o roteiro como estava quando a tela abriu: se mudou em outro lugar, o banco recusa (TR409).
 */
export async function salvarDestinosEditados(cli: ClienteTogether, viagemId: string, salvos: Destino[], ficam: DestinoEditado[]) {
  if (ficam.length === 0) throw new Error('O roteiro precisa ter pelo menos uma cidade')
  const mantidos = new Set(ficam.map((d) => d.id))
  const removidos = salvos.map((d) => d.id).filter((id) => !mantidos.has(id))
  const porId = new Map(salvos.map((d) => [d.id, d]))
  const { error } = await cli.rpc('salvar_roteiro', {
    p_viagem: viagemId,
    p_destinos: ficam.map((d) => {
      const s = porId.get(d.id)
      return { id: d.id, nome: s?.nome ?? '', pais: s?.pais ?? null, latitude: s?.latitude ?? null, longitude: s?.longitude ?? null, chegada: d.chegada || null, saida: d.saida || null }
    }),
    p_removidos: removidos,
  })
  if (error) throw error
}

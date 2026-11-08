import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { supabase } from './supabase'

// Avisos no celular pelo app (spec 110). O site usa Web Push; o app usa o serviço de push do Expo:
// o aparelho ganha um token ("ExponentPushToken[...]") e o servidor manda o aviso pra ele.
//   pedir       → ainda não perguntou (ou dá pra perguntar de novo)
//   ligado      → aceitou e o token está salvo
//   bloqueado   → a pessoa negou; só nos ajustes do celular
//   sem-suporte → navegador ou simulador (não recebe push do Expo)
//   sem-projeto → falta o projeto do EAS no app.json (extra.eas.projectId)
export type EstadoDosAvisos = 'pedir' | 'ligado' | 'bloqueado' | 'sem-suporte' | 'sem-projeto'

const nativo = Platform.OS === 'ios' || Platform.OS === 'android'

// Com o app aberto, o aviso aparece em cima igual
if (nativo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  })
}

function idDoProjeto(): string | undefined {
  return Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
}

export async function estadoDosAvisos(): Promise<EstadoDosAvisos> {
  if (!nativo || !Device.isDevice) return 'sem-suporte'
  const { status, canAskAgain } = await Notifications.getPermissionsAsync()
  if (status === 'granted') return idDoProjeto() ? 'ligado' : 'sem-projeto'
  return canAskAgain ? 'pedir' : 'bloqueado'
}

// Pede a permissão (se precisar) e salva o token do aparelho no banco.
// Rodar de novo não faz mal: o banco só atualiza o mesmo token.
export async function ligarAvisos(): Promise<EstadoDosAvisos> {
  if (!nativo || !Device.isDevice) return 'sem-suporte'
  if (Platform.OS === 'android') {
    // Canal com o mesmo nome que o servidor usa (channelId: 'lembretes')
    await Notifications.setNotificationChannelAsync('lembretes', { name: 'Lembretes de horário', importance: Notifications.AndroidImportance.HIGH })
  }
  let { status, canAskAgain } = await Notifications.getPermissionsAsync()
  if (status !== 'granted' && canAskAgain) ({ status, canAskAgain } = await Notifications.requestPermissionsAsync())
  if (status !== 'granted') return canAskAgain ? 'pedir' : 'bloqueado'
  const projectId = idDoProjeto()
  if (!projectId) return 'sem-projeto'
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId })
  const { error } = await supabase.rpc('registrar_push_expo', { p_token: token, p_plataforma: Platform.OS })
  if (error) throw error
  return 'ligado'
}

// Ao sair da conta: este celular para de receber os avisos dela
export async function esquecerEsteAparelho() {
  if (!nativo || !Device.isDevice) return
  const projectId = idDoProjeto()
  if (!projectId || (await Notifications.getPermissionsAsync()).status !== 'granted') return
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId })
  await supabase.from('push_expo').delete().eq('token', token)
}

// O que o servidor manda junto do aviso (supabase/functions/lembretes)
export type DadosDoAviso = { tipo?: 'trajeto' | 'ponto' | 'cancelamento' | 'match' | 'retrospectiva' | 'lembranca'; viagemId?: string; dia?: string }

// Pra onde o toque no aviso leva, dentro do app
export function telaDoAviso(dados: DadosDoAviso): string | null {
  if (!dados.viagemId) return null
  if (dados.tipo === 'match') return `/viagem/${dados.viagemId}/roteiro` // spec 117: falta você opinar
  if (dados.tipo === 'retrospectiva') return '/retrospectiva' // spec 118c: a retrospectiva está pronta
  if (dados.tipo === 'lembranca' && dados.dia) return `/lembranca?viagem=${dados.viagemId}&dia=${dados.dia}` // spec 118d: há 1 ano
  return dados.tipo === 'trajeto' ? '/transportes' : `/viagem/${dados.viagemId}`
}

import { Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSessao } from '../lib/sessao'

// Spec 018: lembra o convidado (entrou só com o nome) de criar a conta.
// Sem conta, apagar o app ou trocar de celular faz perder o acesso.
export function FaixaConvidado() {
  const { ehConvidado } = useSessao()
  const router = useRouter()
  if (!ehConvidado) return null
  return (
    <View className="mb-4 flex-row items-center gap-3 rounded-2xl bg-chip px-4 py-3">
      <Text className="flex-1 font-body text-[13px] leading-[18px] text-texto">Você está como convidado. Crie sua conta pra não perder o acesso.</Text>
      <Pressable onPress={() => router.push('/criar-conta')} className="rounded-xl bg-couro px-3 py-2 active:opacity-90">
        <Text className="font-body-bold text-[13px] text-white">Criar conta</Text>
      </Pressable>
    </View>
  )
}

import { Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Plus } from 'lucide-react-native'
import { Malinha } from './Malinha'
import { Botao } from './pecas'

// Abas que dependem de uma viagem (Roteiro, Contas, Fotos) quando a pessoa ainda não tem nenhuma
export function SemViagem({ titulo }: { titulo: string }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  return (
    <View className="flex-1 bg-fundo px-5" style={{ paddingTop: insets.top + 12 }}>
      <Text className="font-display text-[32px] leading-[36px] text-texto">{titulo}</Text>
      <View className="flex-1 items-center justify-center gap-3 px-5">
        <Malinha humor="dormindo" tamanho={130} />
        <Text className="text-center font-display text-[24px] text-texto">Nenhuma viagem ainda</Text>
        <Text className="text-center font-body text-[15px] leading-6 text-corpo">Crie a primeira viagem e tudo aparece aqui.</Text>
        <View className="mt-2 self-stretch">
          <Botao titulo="Nova viagem" icone={<Plus size={20} color="#fff" />} aoTocar={() => router.push('/nova-viagem')} />
        </View>
      </View>
    </View>
  )
}

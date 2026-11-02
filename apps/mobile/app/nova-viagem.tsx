import { Text, View } from 'react-native'
import { StatusBar } from '../src/ui/StatusBar'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X } from 'lucide-react-native'
import { useSessao } from '../src/lib/sessao'
import { Agulha } from '../src/ui/Agulha'
import { CriarViagemRapida } from '../src/ui/CriarViagemRapida'
import { Botao, BotaoRedondo } from '../src/ui/pecas'
import { cor } from '../theme'

// Nova viagem (specs 115 v2 e 116): jeito rápido, pra onde → quantos dias → deslize.
// Convidado (spec 018) cria conta antes de criar viagem: o banco também recusa
export default function NovaViagem() {
  const { ehConvidado } = useSessao()
  return ehConvidado ? <ConvidadoSemConta /> : <CriarViagemRapida primeira={false} />
}

function ConvidadoSemConta() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  return (
    <View className="flex-1 bg-fundo" style={{ paddingTop: insets.top + 8 }}>
      <StatusBar style="dark" />
      <View className="px-5">
        <BotaoRedondo aoTocar={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
          <X size={20} color={cor.texto} />
        </BotaoRedondo>
      </View>
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <Agulha tamanho={120} humor="pensando" />
        <Text className="text-center font-display text-[26px] text-texto">Crie sua conta primeiro</Text>
        <Text className="text-center font-body text-[14px] leading-5 text-corpo">Pra criar uma viagem sua, transforme o acesso de convidado numa conta. Nada do que você já fez se perde.</Text>
        <View className="self-stretch">
          <Botao titulo="Criar conta" aoTocar={() => router.replace('/criar-conta')} />
        </View>
      </View>
    </View>
  )
}

import '../global.css'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useFonts, Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces'
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans'
import { useSessao } from '../src/lib/sessao'
import { Moldura } from '../src/ui/Moldura'

// Raiz: carrega as fontes de marca (Fraunces + Plus Jakarta), faz o porteiro do login e
// enquadra o app numa largura de celular no navegador.
export default function RootLayout() {
  const { sessao, carregando } = useSessao()
  const segments = useSegments()
  const router = useRouter()
  const [fontesProntas] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  })

  useEffect(() => {
    if (carregando) return
    const naLogin = segments[0] === 'login'
    if (!sessao && !naLogin) router.replace('/login')
    else if (sessao && naLogin) router.replace('/')
  }, [sessao, carregando, segments, router])

  if (carregando || !fontesProntas) {
    return (
      <View className="flex-1 items-center justify-center bg-fundo">
        <ActivityIndicator color="#7b542f" />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <Moldura>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fff6e5' } }} />
      </Moldura>
    </SafeAreaProvider>
  )
}

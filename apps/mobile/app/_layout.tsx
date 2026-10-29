import '../global.css'
import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useSessao } from '../src/lib/sessao'
import { cor } from '../theme'

// Raiz da navegação (expo-router) + porteiro do login: sem sessão, só a tela de login;
// com sessão, as abas. O RLS do banco é a trava de verdade; isto é só a navegação.
export default function RootLayout() {
  const { sessao, carregando } = useSessao()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (carregando) return
    const naLogin = segments[0] === 'login'
    if (!sessao && !naLogin) router.replace('/login')
    else if (sessao && naLogin) router.replace('/')
  }, [sessao, carregando, segments, router])

  if (carregando) {
    return (
      <View className="flex-1 items-center justify-center bg-fundo">
        <ActivityIndicator color={cor.couro} />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  )
}

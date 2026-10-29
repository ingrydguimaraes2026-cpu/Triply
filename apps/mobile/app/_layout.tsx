import '../global.css'
import { useEffect, useState } from 'react'
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
import { Splash } from '../src/ui/Splash'
import { ProvedorViagemAtual } from '../src/dados/viagemAtual'
import { cor } from '../theme'

// Telas que quem NÃO está logado pode ver
const PUBLICAS = ['boas-vindas', 'login']

// Raiz: carrega as fontes de marca, mostra a abertura com a Malinha, faz o porteiro
// do login e enquadra o app numa largura de celular no navegador.
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
  // Segura a abertura um instante pra animação da Malinha aparecer
  const [aberturaVista, setAberturaVista] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setAberturaVista(true), 1400)
    return () => clearTimeout(t)
  }, [])

  const pronto = !carregando && fontesProntas && aberturaVista

  useEffect(() => {
    if (!pronto) return
    const publica = PUBLICAS.includes(segments[0] ?? '')
    if (!sessao && !publica) router.replace('/boas-vindas')
    else if (sessao && publica) router.replace('/')
  }, [sessao, pronto, segments, router])

  return (
    <SafeAreaProvider>
      <Moldura>
        {pronto ? (
          <ProvedorViagemAtual>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cor.fundo } }}>
              <Stack.Screen name="nova-viagem" options={{ presentation: 'modal' }} />
              <Stack.Screen name="novo-gasto" options={{ presentation: 'modal' }} />
            </Stack>
          </ProvedorViagemAtual>
        ) : (
          <Splash />
        )}
      </Moldura>
    </SafeAreaProvider>
  )
}

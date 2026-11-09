import '../global.css'
// className nos componentes animados (registra antes de qualquer tela)
import '../src/ui/movimento'
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useFonts, Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces'
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans'
import { conviteDepoisDoLogin } from '../src/lib/convite'
import { carregarRascunho, lerRascunho } from '../src/lib/rascunho'
import { useSessao } from '../src/lib/sessao'
import { Moldura } from '../src/ui/Moldura'
import { Splash } from '../src/ui/Splash'
import { ProvedorViagemAtual } from '../src/dados/viagemAtual'
import { AbrirAvisos } from '../src/ui/AbrirAvisos'
import { cor } from '../theme'

// Telas que quem NÃO está logado pode ver
const PUBLICAS = ['boas-vindas', 'login', 'convite', 'comecar']
// Telas só de quem não está logado: quem já entrou é mandado pro início
const SO_DESLOGADO = ['boas-vindas', 'login']

// Raiz: carrega as fontes de marca, mostra a abertura com a Norti, faz o porteiro
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
  // Segura a abertura um instante pra animação da Norti aparecer
  const [aberturaVista, setAberturaVista] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setAberturaVista(true), 1400)
    return () => clearTimeout(t)
  }, [])

  // Rascunho da primeira viagem (respostas antes da conta) precisa estar lido antes do porteiro
  const [rascunhoLido, setRascunhoLido] = useState(false)
  useEffect(() => {
    void carregarRascunho().then(() => setRascunhoLido(true))
  }, [])

  const pronto = !carregando && fontesProntas && aberturaVista && rascunhoLido

  useEffect(() => {
    if (!pronto) return
    const tela = segments[0] ?? ''
    // Spec 116 v2: quem não está logado começa pela conversa com a Norti
    if (!sessao && !PUBLICAS.includes(tela)) router.replace('/comecar')
    else if (sessao && SO_DESLOGADO.includes(tela)) {
      const codigo = conviteDepoisDoLogin.codigo
      conviteDepoisDoLogin.codigo = null
      // Voltou do login com a primeira viagem respondida: /comecar cria a viagem
      router.replace(codigo ? `/convite/${codigo}` : lerRascunho() ? '/comecar' : '/')
    }
  }, [sessao, pronto, segments, router])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Moldura>
          {pronto ? (
            <ProvedorViagemAtual>
              {/* Spec 110: avisos do app (no navegador não tem push do Expo) */}
              {/* Fora do /comecar: lá a sessão é de convidado-relâmpago e não deve pedir permissão de aviso */}
              {Platform.OS !== 'web' && sessao && segments[0] !== 'comecar' ? <AbrirAvisos /> : null}
              <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: cor.fundo } }}>
                <Stack.Screen name="nova-viagem" options={{ presentation: 'modal' }} />
                <Stack.Screen name="role" options={{ presentation: 'modal' }} />
                <Stack.Screen name="lembranca" options={{ presentation: 'modal' }} />
                <Stack.Screen name="caminho" />
                <Stack.Screen name="novo-deslocamento" />
                <Stack.Screen name="comparar" />
                <Stack.Screen name="viagem-antiga" options={{ presentation: 'modal' }} />
                <Stack.Screen name="nova-reserva" options={{ presentation: 'modal' }} />
                <Stack.Screen name="comecar" options={{ gestureEnabled: false, animation: 'fade' }} />
                <Stack.Screen name="chamar-galera" options={{ gestureEnabled: false, animation: 'fade' }} />
                {/* Deslize: arrastar o cartão pro lado não pode virar "voltar" (iPhone) */}
                <Stack.Screen name="explorar" options={{ gestureEnabled: false, fullScreenGestureEnabled: false }} />
                <Stack.Screen name="novo-gasto" options={{ presentation: 'modal' }} />
                <Stack.Screen name="novo-post" options={{ presentation: 'modal' }} />
                <Stack.Screen name="criar-conta" options={{ presentation: 'modal' }} />
                <Stack.Screen name="passe" options={{ presentation: 'modal' }} />
              </Stack>
            </ProvedorViagemAtual>
          ) : (
            <Splash />
          )}
        </Moldura>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { BackHandler, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View, type ScrollViewInstance, type TextInputInstance } from 'react-native'
import { StatusBar } from '../src/ui/StatusBar'
import { LinearGradient } from 'expo-linear-gradient'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Eye, EyeOff, Lock, Mail, User } from '../src/ui/icones'
import Svg, { Path } from 'react-native-svg'
import { supabase } from '../src/lib/supabase'
import { entrarComGoogle } from '../src/lib/google'
import { Norti } from '../src/ui/Norti'
import { Botao, Campo } from '../src/ui/pecas'
import { cor, sombra } from '../theme'
import { MODO_TESTE, criarContaDeTeste, entrarNaUltimaContaDeTeste } from '../src/lib/contasDeTeste'

// Login / Cadastro (tela "1d" do design): faixa caramelo com a Norti de logo e uma
// folha clara que sobe com as abas Entrar | Criar conta.
type Modo = 'entrar' | 'criar'

// Termos de uso e Política de privacidade moram no site (páginas públicas /termos e /privacidade)
const SITE = process.env.EXPO_PUBLIC_SITE_URL ?? 'https://together-viagem.vercel.app'
function abrirNoSite(caminho: string) {
  WebBrowser.openBrowserAsync(`${SITE}${caminho}`).catch((e) => console.error('Erro ao abrir a página do site:', e))
}

export default function Login() {
  const params = useLocalSearchParams<{ modo?: Modo }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [modo, setModo] = useState<Modo>(params.modo === 'criar' ? 'criar' : 'entrar')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [aviso, setAviso] = useState<{ tipo: 'erro' | 'ok'; texto: string } | null>(null)
  const [enviando, setEnviando] = useState(false)
  const campoEmail = useRef<TextInputInstance>(null)
  const campoSenha = useRef<TextInputInstance>(null)
  // Android (teste 17/11): com o teclado aberto, rola pra os campos e o botão "Entrar com e-mail"
  // ficarem à vista. Mira no fim do botão; se não couber tudo, o topo dos campos fica visível.
  const rolagem = useRef<ScrollViewInstance>(null)
  const yDaFolha = useRef(0)
  const yDosCampos = useRef(0)
  const fimDoBotao = useRef(0) // em relação à folha
  const alturaVisivel = useRef(0) // da rolagem, já encolhida pelo teclado
  const tecladoAberto = useRef(false)
  const espera = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Espera ~100 ms: o 'padding' do KeyboardAvoidingView encolhe a rolagem depois do keyboardDidShow
  const rolarAteOsCampos = useCallback(() => {
    if (Platform.OS !== 'android' || !tecladoAberto.current) return
    clearTimeout(espera.current)
    espera.current = setTimeout(() => {
      const topo = yDaFolha.current + yDosCampos.current - 16
      const fim = yDaFolha.current + fimDoBotao.current + 16
      const y = alturaVisivel.current ? Math.min(topo, fim - alturaVisivel.current) : topo
      rolagem.current?.scrollTo({ y: Math.max(0, y), animated: true })
    }, 100)
  }, [])

  useEffect(() => {
    if (Platform.OS !== 'android') return
    const abriu = Keyboard.addListener('keyboardDidShow', () => {
      tecladoAberto.current = true
      rolarAteOsCampos()
    })
    const fechou = Keyboard.addListener('keyboardDidHide', () => {
      tecladoAberto.current = false
    })
    return () => {
      abriu.remove()
      fechou.remove()
      clearTimeout(espera.current)
    }
  }, [rolarAteOsCampos])

  // Android (teste 17/11): o voltar do sistema fechava o app; agora faz o mesmo que a seta
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        router.replace('/comecar')
        return true
      })
      return () => sub.remove()
    }, [router]),
  )

  const entrar = modo === 'entrar'
  // Onda 2: o erro antigo some assim que a pessoa mexe num campo (o aviso de "ok" fica)
  const digitar = (setar: (v: string) => void) => (v: string) => {
    setar(v)
    if (aviso?.tipo === 'erro') setAviso(null)
  }

  async function continuar() {
    setAviso(null)
    if (!email.trim() || !senha || (!entrar && !nome.trim())) {
      setAviso({ tipo: 'erro', texto: entrar ? 'Preencha e-mail e senha.' : 'Preencha nome, e-mail e senha.' })
      return
    }
    setEnviando(true)
    if (entrar) {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
      if (error) setAviso({ tipo: 'erro', texto: error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : 'Não deu pra entrar. Tente de novo.' })
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha,
        options: { data: { full_name: nome.trim() } },
      })
      if (error) setAviso({ tipo: 'erro', texto: error.message.includes('Password') ? 'A senha precisa ter pelo menos 6 caracteres.' : 'Não deu pra criar a conta. Tente de novo.' })
      else if (!data.session) setAviso({ tipo: 'ok', texto: 'Conta criada! Confirme pelo link que mandamos no seu e-mail e depois entre.' })
    }
    setEnviando(false)
  }

  async function google() {
    setAviso(null)
    try {
      await entrarComGoogle()
    } catch {
      setAviso({ tipo: 'erro', texto: 'Não deu pra entrar com Google. Tente de novo ou use e-mail e senha.' })
    }
  }

  // Só em modo dev (MODO_TESTE): entra numa conta de teste sem Google nem e-mail de verdade
  async function contaDeTeste(qual: 'nova' | 'ultima') {
    setAviso(null)
    setEnviando(true)
    try {
      const conta = qual === 'nova' ? await criarContaDeTeste() : await entrarNaUltimaContaDeTeste()
      setAviso({ tipo: 'ok', texto: `Entrou como ${conta.email}` })
    } catch (e) {
      // Mensagem do Supabase vem em inglês (Android 17/11)
      const msg = e instanceof Error ? e.message : ''
      setAviso({ tipo: 'erro', texto: msg === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : msg || 'Não deu pra usar a conta de teste.' })
    }
    setEnviando(false)
  }

  async function esqueci() {
    setAviso(null)
    if (!email.trim()) {
      setAviso({ tipo: 'erro', texto: 'Escreva seu e-mail acima e toque de novo em "Esqueci minha senha".' })
      return
    }
    // O link abre a tela de nova senha do site (igual ao site); sem isso caía no Início
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${SITE}/nova-senha` })
    if (!error) return setAviso({ tipo: 'ok', texto: 'Mandamos um link pra você criar uma senha nova.' })
    // Android 17/11: a mensagem escondia o motivo. O e-mail sai pelo envio padrão do Supabase:
    // poucos envios por hora e só pra endereços liberados no projeto.
    console.error('Erro ao mandar o link de nova senha:', error)
    const limite = error.status === 429 || /rate limit/i.test(error.message)
    const naoLiberado = /not authorized/i.test(error.message)
    // Rodada 3 (reteste 17/11): o Supabase responde "Email address … is invalid" e o app dizia
    // "Confira a internet". Erro de rede (sem resposta do servidor) é o único que fala de internet.
    const invalido = /invalid/i.test(error.message) && /email/i.test(error.message)
    const semRede = error.name === 'AuthRetryableFetchError' || !error.status
    setAviso({
      tipo: 'erro',
      texto: limite
        ? 'Já mandamos links demais agora. Espere uns minutos e tente de novo.'
        : naoLiberado
          ? 'Ainda não conseguimos mandar e-mail pra esse endereço. Entre com o Google ou tente mais tarde.'
          : invalido
            ? 'Não conseguimos mandar pra esse e-mail. Confira se está escrito certo ou entre com o Google.'
            : semRede
              ? 'Não deu pra mandar o link. Confira a internet e tente de novo.'
              : 'Não deu pra mandar o link agora. Tente de novo mais tarde ou entre com o Google.',
    })
  }

  return (
    // Tudo rola junto: com o teclado aberto o topo sobe e o campo fica à vista.
    // iOS: `automaticallyAdjustKeyboardInsets` faz isso suave; Android: o KeyboardAvoidingView
    // ('padding' encolhe a rolagem acima do teclado) e a rolagem até os campos ao abrir o teclado.
    <KeyboardAvoidingView behavior={Platform.OS === 'android' ? 'padding' : undefined} className="flex-1 bg-fundo">
      <StatusBar style="light" />
      <ScrollView
        ref={rolagem}
        className="flex-1"
        onLayout={(e) => {
          // O teclado encolheu (ou cresceu) a área visível: mira de novo
          alturaVisivel.current = e.nativeEvent.layout.height
          rolarAteOsCampos()
        }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
      <LinearGradient colors={['#B97A22', '#8A5A26', '#4A2E14']} locations={[0, 0.55, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ height: 384, paddingTop: insets.top + 64, paddingHorizontal: 28 }}>
        {/* Volta pra conversa com a Norti (spec 116); as respostas ficam guardadas */}
        <Pressable accessibilityLabel="Voltar" onPress={() => router.replace('/comecar')} hitSlop={10} className="absolute left-5 h-10 w-10 items-center justify-center rounded-full bg-black/20" style={{ top: insets.top + 12 }}>
          <ArrowLeft size={20} color="#fff" />
        </Pressable>
        <View className="mb-[18px] flex-row items-center gap-2.5">
          <View className="h-[52px] w-[52px] items-center justify-center rounded-2xl bg-fundo">
            <Norti tamanho={44} sombra={false} />
          </View>
          <Text className="font-display text-[24px] text-fundo">Norti</Text>
        </View>
        <Text className="font-display text-[44px] leading-[46px] text-fundo">O mapa da sua galera.</Text>
        <Text className="mt-3 max-w-[290px] font-body text-[14px] leading-5 text-creme">Cada viagem e cada rolê viram um carimbo. Entre pra acender o seu.</Text>
      </LinearGradient>

      <View className="-mt-[30px] flex-1 rounded-t-[28px] bg-fundo" style={{ padding: 24, gap: 14 }} onLayout={(e) => (yDaFolha.current = e.nativeEvent.layout.y)}>
          {/* Primeiro minuto (16/11/2026): Google é o botão principal; e-mail e senha continuam visíveis embaixo */}
          <Pressable
            onPress={google}
            accessibilityRole="button"
            className="h-[56px] flex-row items-center justify-center gap-2.5 rounded-2xl bg-couro active:opacity-90"
            style={sombra.botao}
          >
            <View className="h-8 w-8 items-center justify-center rounded-full bg-white">
              <LogoGoogle />
            </View>
            <Text className="font-body-bold text-[16px] text-white">Continuar com Google</Text>
          </Pressable>

          <View className="flex-row items-center gap-3">
            <View className="h-px flex-1 bg-borda" />
            <Text className="font-body text-[12px] text-suave">ou com e-mail</Text>
            <View className="h-px flex-1 bg-borda" />
          </View>

          <View className="flex-row rounded-[14px] bg-areia p-1">
            {(['entrar', 'criar'] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => {
                  setModo(m)
                  setAviso(null)
                }}
                className={`h-10 flex-1 items-center justify-center rounded-[11px] ${modo === m ? 'bg-cartao' : ''}`}
                style={modo === m ? { boxShadow: '0 2px 8px rgba(74,46,20,0.1)' } : undefined}
              >
                <Text className={`font-body-bold text-[14px] ${modo === m ? 'text-texto' : 'text-suave'}`}>{m === 'entrar' ? 'Entrar' : 'Criar conta'}</Text>
              </Pressable>
            ))}
          </View>

          <View style={{ gap: 14 }} onLayout={(e) => (yDosCampos.current = e.nativeEvent.layout.y)}>
          {!entrar ? <Campo icone={<User size={20} color={cor.suave} />} placeholder="Seu nome" value={nome} onChangeText={digitar(setNome)} autoComplete="name" textContentType="name" onFocus={rolarAteOsCampos} returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => campoEmail.current?.focus()} /> : null}
          <Campo
            ref={campoEmail}
            icone={<Mail size={20} color={cor.couro} />}
            placeholder="voce@email.com"
            value={email}
            onChangeText={digitar(setEmail)}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            autoCorrect={false}
            onFocus={rolarAteOsCampos}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => campoSenha.current?.focus()}
          />
          <Campo
            ref={campoSenha}
            icone={<Lock size={20} color={cor.suave} />}
            placeholder="Sua senha"
            value={senha}
            onChangeText={digitar(setSenha)}
            secureTextEntry={!verSenha}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={entrar ? 'current-password' : 'new-password'}
            textContentType={entrar ? 'password' : 'newPassword'}
            onFocus={rolarAteOsCampos}
            returnKeyType="go"
            onSubmitEditing={continuar}
            direita={
              <Pressable onPress={() => setVerSenha((v) => !v)} hitSlop={8}>
                {verSenha ? <EyeOff size={20} color={cor.suave} /> : <Eye size={20} color={cor.suave} />}
              </Pressable>
            }
          />
          </View>
          {entrar ? (
            <Pressable onPress={esqueci} className="self-end">
              <Text className="font-body-semibold text-[13px] text-couro">Esqueci minha senha</Text>
            </Pressable>
          ) : null}

          {aviso ? (
            <Text className={`font-body-medium text-[13px] ${aviso.tipo === 'erro' ? 'text-vermelho' : 'text-verde'}`}>{aviso.texto}</Text>
          ) : null}

          <View className="mt-1" onLayout={(e) => {
              fimDoBotao.current = e.nativeEvent.layout.y + e.nativeEvent.layout.height
              // Apareceu um erro em cima do botão com o teclado aberto: rola pra ele não sumir atrás do teclado
              rolarAteOsCampos()
            }}>
            <Botao titulo={entrar ? 'Entrar com e-mail' : 'Criar conta com e-mail'} tipo="secundario" aoTocar={continuar} carregando={enviando} />
          </View>
          <Text className="px-3 text-center font-body text-[12px] leading-[18px] text-suave">
            Ao continuar, você concorda com os{' '}
            <Text className="font-body-semibold text-couro underline" onPress={() => abrirNoSite('/termos')}>
              Termos de uso
            </Text>{' '}
            e a{' '}
            <Text className="font-body-semibold text-couro underline" onPress={() => abrirNoSite('/privacidade')}>
              Política de privacidade
            </Text>
            .
          </Text>
          {MODO_TESTE ? (
            <View className="mt-2 rounded-2xl border border-dashed border-tracejado p-3" style={{ gap: 8 }}>
              <Text className="text-center font-body-semibold text-[12px] text-suave">Modo teste (não aparece na loja)</Text>
              <Botao titulo="Nova conta de teste" tipo="secundario" compacto aoTocar={() => contaDeTeste('nova')} desabilitado={enviando} />
              <Botao titulo="Voltar pra última conta de teste" tipo="secundario" compacto aoTocar={() => contaDeTeste('ultima')} desabilitado={enviando} />
            </View>
          ) : null}
      </View>
      </ScrollView>
      {/* Android (teste 17/11): ao rolar, o logo passava por baixo do relógio. Faixa da cor do topo atrás da barra de status. */}
      <View pointerEvents="none" className="absolute left-0 right-0 top-0" style={{ height: insets.top, backgroundColor: '#B97A22' }} />
    </KeyboardAvoidingView>
  )
}

function LogoGoogle() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.8h3.6c2-1.9 3.2-4.7 3.2-8.1Z" />
      <Path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.9A11 11 0 0 0 12 23Z" />
      <Path fill="#FBBC05" d="M5.8 14.1a6.6 6.6 0 0 1 0-4.2V7H2.1a11 11 0 0 0 0 10l3.7-2.9Z" />
      <Path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7l3.7 2.9c.9-2.6 3.3-4.5 6.2-4.5Z" />
    </Svg>
  )
}

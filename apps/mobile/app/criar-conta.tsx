import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Mail, X } from 'lucide-react-native'
import Svg, { Path } from 'react-native-svg'
import { ligarGoogle } from '../src/lib/google'
import { supabase } from '../src/lib/supabase'
import { Malinha } from '../src/ui/Malinha'
import { Botao, BotaoRedondo, Campo } from '../src/ui/pecas'
import { StatusBar } from '../src/ui/StatusBar'
import { cor } from '../theme'

// Spec 018: o convidado vira conta de verdade. O id não muda, então gastos,
// votos e fotos continuam no nome dele.
export default function CriarConta() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState<{ tipo: 'erro' | 'ok'; texto: string } | null>(null)
  const fechar = () => (router.canGoBack() ? router.back() : router.replace('/'))

  async function google() {
    setAviso(null)
    try {
      if ((await ligarGoogle()) === 'ok' && Platform.OS !== 'web') fechar()
    } catch (e) {
      const codigo = (e as { code?: string }).code
      setAviso({
        tipo: 'erro',
        texto:
          codigo === 'identity_already_exists'
            ? 'Esse Google já tem conta no Together. Entre com ele e abra o convite de novo.'
            : 'Não deu pra ligar o Google. Tente o e-mail.',
      })
    }
  }

  async function comEmail() {
    setAviso(null)
    setEnviando(true)
    // O link do e-mail abre o site em /nova-senha, onde a pessoa cria a senha
    const site = process.env.EXPO_PUBLIC_SITE_URL ?? 'https://together-viagem.vercel.app'
    const { error } = await supabase.auth.updateUser({ email: email.trim() }, { emailRedirectTo: `${site}/nova-senha` })
    setEnviando(false)
    setAviso(
      error
        ? { tipo: 'erro', texto: error.code === 'email_exists' ? 'Esse e-mail já tem conta. Entre com ele.' : 'Não deu pra mandar o link. Tente de novo.' }
        : { tipo: 'ok', texto: 'Mandamos um link pro seu e-mail. Abra ele pra confirmar e criar sua senha.' },
    )
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <View className="px-5" style={{ paddingTop: insets.top + 8 }}>
        <BotaoRedondo aoTocar={fechar}>
          <X size={20} color={cor.texto} />
        </BotaoRedondo>
      </View>
      <ScrollView contentContainerStyle={{ padding: 24, gap: 16, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
        <View className="items-center">
          <Malinha tamanho={100} />
        </View>
        <Text className="font-display text-[30px] leading-[34px] text-texto">Criar sua conta</Text>
        <Text className="font-body text-[14px] leading-5 text-corpo">Seus gastos, votos e fotos continuam no seu nome. Assim você não perde o acesso se trocar de celular.</Text>

        <Pressable onPress={google} className="h-[52px] flex-row items-center justify-center gap-2.5 rounded-2xl border border-borda bg-cartao">
          <LogoGoogle />
          <Text className="font-body-semibold text-[15px] text-texto">Continuar com Google</Text>
        </Pressable>

        <View className="flex-row items-center gap-3">
          <View className="h-px flex-1 bg-borda" />
          <Text className="font-body text-[12px] text-suave">ou com e-mail</Text>
          <View className="h-px flex-1 bg-borda" />
        </View>

        <Campo
          icone={<Mail size={20} color={cor.couro} />}
          placeholder="voce@email.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          onSubmitEditing={comEmail}
        />
        {aviso ? <Text className={`font-body-medium text-[13px] ${aviso.tipo === 'erro' ? 'text-vermelho' : 'text-verde'}`}>{aviso.texto}</Text> : null}
        <Botao titulo="Mandar link de confirmação" aoTocar={comEmail} carregando={enviando} desabilitado={!email.trim()} />
      </ScrollView>
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

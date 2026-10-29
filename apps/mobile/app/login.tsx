import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { StatusBar } from '../src/ui/StatusBar'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react-native'
import Svg, { Path } from 'react-native-svg'
import { supabase } from '../src/lib/supabase'
import { entrarComGoogle } from '../src/lib/google'
import { Malinha } from '../src/ui/Malinha'
import { Botao, Campo } from '../src/ui/pecas'
import { cor } from '../theme'

// Login / Cadastro (tela "1d" do design): faixa caramelo com a Malinha de logo e uma
// folha clara que sobe com as abas Entrar | Criar conta.
type Modo = 'entrar' | 'criar'

export default function Login() {
  const params = useLocalSearchParams<{ modo?: Modo }>()
  const insets = useSafeAreaInsets()
  const [modo, setModo] = useState<Modo>(params.modo === 'criar' ? 'criar' : 'entrar')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [aviso, setAviso] = useState<{ tipo: 'erro' | 'ok'; texto: string } | null>(null)
  const [enviando, setEnviando] = useState(false)

  const entrar = modo === 'entrar'

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

  async function esqueci() {
    setAviso(null)
    if (!email.trim()) {
      setAviso({ tipo: 'erro', texto: 'Escreva seu e-mail acima e toque de novo em "Esqueci minha senha".' })
      return
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
    setAviso(error ? { tipo: 'erro', texto: 'Não deu pra mandar o link. Tente de novo.' } : { tipo: 'ok', texto: 'Mandamos um link pra você criar uma senha nova.' })
  }

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="light" />
      <LinearGradient colors={['#B97A22', '#8A5A26', '#4A2E14']} locations={[0, 0.55, 1]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={{ height: 330, paddingTop: insets.top + 64, paddingHorizontal: 28 }}>
        <View className="mb-[18px] flex-row items-center gap-2.5">
          <View className="h-[52px] w-[52px] items-center justify-center rounded-2xl bg-fundo">
            <Malinha tamanho={44} sombra={false} />
          </View>
          <Text className="font-display text-[24px] text-fundo">Together</Text>
        </View>
        <Text className="font-display text-[44px] leading-[46px] text-fundo">Viajem juntos.</Text>
        <Text className="mt-3 max-w-[290px] font-body text-[14px] leading-5 text-creme">Roteiro, transportes, contas e fotos do comboio, num lugar só.</Text>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="-mt-[30px] flex-1 rounded-t-[28px] bg-fundo">
        <ScrollView contentContainerStyle={{ padding: 24, gap: 14, paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled">
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

          <Pressable
            onPress={google}
            className="h-[52px] flex-row items-center justify-center gap-2.5 rounded-2xl border border-borda bg-cartao"
          >
            <LogoGoogle />
            <Text className="font-body-semibold text-[15px] text-texto">Continuar com Google</Text>
          </Pressable>

          <View className="flex-row items-center gap-3">
            <View className="h-px flex-1 bg-borda" />
            <Text className="font-body text-[12px] text-suave">ou com e-mail</Text>
            <View className="h-px flex-1 bg-borda" />
          </View>

          {!entrar ? <Campo icone={<User size={20} color={cor.suave} />} placeholder="Seu nome" value={nome} onChangeText={setNome} autoComplete="name" /> : null}
          <Campo
            icone={<Mail size={20} color={cor.couro} />}
            placeholder="voce@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Campo
            icone={<Lock size={20} color={cor.suave} />}
            placeholder="Sua senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry={!verSenha}
            autoComplete={entrar ? 'current-password' : 'new-password'}
            onSubmitEditing={continuar}
            direita={
              <Pressable onPress={() => setVerSenha((v) => !v)} hitSlop={8}>
                {verSenha ? <EyeOff size={20} color={cor.suave} /> : <Eye size={20} color={cor.suave} />}
              </Pressable>
            }
          />
          {entrar ? (
            <Pressable onPress={esqueci} className="self-end">
              <Text className="font-body-semibold text-[13px] text-couro">Esqueci minha senha</Text>
            </Pressable>
          ) : null}

          {aviso ? (
            <Text className={`font-body-medium text-[13px] ${aviso.tipo === 'erro' ? 'text-vermelho' : 'text-verde'}`}>{aviso.texto}</Text>
          ) : null}

          <View className="mt-1">
            <Botao titulo={entrar ? 'Entrar' : 'Criar conta'} aoTocar={continuar} carregando={enviando} />
          </View>
          <Text className="px-3 text-center font-body text-[12px] leading-[18px] text-suave">
            Ao continuar, você concorda com os Termos de uso e a Política de privacidade.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
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

import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../src/lib/supabase'
import { Ganso } from '../src/comboio/Ganso'

// Login por e-mail e senha. Ao entrar, o _layout leva pras abas quando a sessão muda.
export default function Login() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [entrando, setEntrando] = useState(false)

  async function entrar() {
    setErro(null)
    setEntrando(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha })
    if (error) {
      setErro(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : 'Não deu pra entrar. Tente de novo.')
      setEntrando(false)
    }
  }

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="light" />
      <LinearGradient colors={['#8a5a28', '#b6771d', '#ff9d00']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 300 }}>
        <View className="flex-1 items-center justify-center gap-3 px-6">
          <Ganso fala="Bora organizar a viagem do comboio?" />
          <Text className="text-4xl font-extrabold text-white">Together</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView className="flex-1 px-6 pt-7" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text className="text-[13px] text-suave">E-mail</Text>
        <TextInput
          className="mt-1 rounded-2xl border border-borda bg-cartao px-4 py-3 text-base text-texto"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          placeholder="voce@email.com"
          placeholderTextColor="#b9a68a"
        />
        <Text className="mt-4 text-[13px] text-suave">Senha</Text>
        <TextInput
          className="mt-1 rounded-2xl border border-borda bg-cartao px-4 py-3 text-base text-texto"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          placeholder="sua senha"
          placeholderTextColor="#b9a68a"
        />

        {erro ? <Text className="mt-3 text-[13px] text-pessoal">{erro}</Text> : null}

        <Pressable
          className={`mt-6 items-center rounded-2xl bg-laranja py-4 ${entrando ? 'opacity-60' : ''}`}
          onPress={entrar}
          disabled={entrando}
        >
          <Text className="text-base font-bold text-texto">{entrando ? 'Entrando…' : 'Entrar'}</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </View>
  )
}

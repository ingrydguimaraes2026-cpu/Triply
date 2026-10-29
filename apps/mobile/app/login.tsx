import { useState } from 'react'
import { ImageBackground, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { LinearGradient } from 'expo-linear-gradient'
import { Lock, Mail } from 'lucide-react-native'
import { supabase } from '../src/lib/supabase'

// Foto quente de viagem no topo (por enquanto do Unsplash; depois a gente embute a nossa).
const HERO = 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=900&q=80'

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
    <View className="flex-1 bg-couro">
      <StatusBar style="light" />
      <View className="flex-1">
        <ImageBackground source={{ uri: HERO }} resizeMode="cover" style={StyleSheet.absoluteFillObject}>
          <LinearGradient
            colors={['rgba(59,39,21,0.1)', 'rgba(59,39,21,0.35)', 'rgba(59,39,21,0.92)']}
            style={StyleSheet.absoluteFillObject}
          />
        </ImageBackground>
        <View className="flex-1 justify-end px-7 pb-12">
          <Text className="font-display-bold text-[48px] leading-tight text-white">Together</Text>
          <Text className="mt-1 font-body text-[15px] text-white/90">A viagem do comboio — sem brigar por dinheiro.</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="-mt-7 rounded-t-[36px] bg-fundo px-7 pb-10 pt-8">
        <Campo icone={<Mail size={18} color="#7b542f" />} placeholder="voce@email.com" value={email} onChange={setEmail} tipo="email" />
        <View className="h-3" />
        <Campo icone={<Lock size={18} color="#7b542f" />} placeholder="sua senha" value={senha} onChange={setSenha} tipo="senha" />

        {erro ? <Text className="mt-3 font-body text-[13px] text-pessoal">{erro}</Text> : null}

        <Pressable
          className={`mt-6 items-center rounded-2xl bg-laranja py-4 ${entrando ? 'opacity-60' : ''}`}
          onPress={entrar}
          disabled={entrando}
          style={{ boxShadow: '0 8px 20px rgba(255,157,0,0.35)' } as object}
        >
          <Text className="font-body-bold text-[16px] text-texto">{entrando ? 'Entrando…' : 'Entrar'}</Text>
        </Pressable>

        <Text className="mt-5 text-center font-body text-[13px] text-suave">
          Não tem conta? <Text className="font-body-bold text-couro">Criar conta</Text>
        </Text>
      </KeyboardAvoidingView>
    </View>
  )
}

function Campo({
  icone,
  placeholder,
  value,
  onChange,
  tipo,
}: {
  icone: React.ReactNode
  placeholder: string
  value: string
  onChange: (t: string) => void
  tipo: 'email' | 'senha'
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-borda bg-cartao px-4 py-3.5">
      {icone}
      <TextInput
        className="flex-1 font-body text-[15px] text-texto"
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#c3ad8a"
        autoCapitalize="none"
        secureTextEntry={tipo === 'senha'}
        keyboardType={tipo === 'email' ? 'email-address' : 'default'}
        autoComplete={tipo === 'email' ? 'email' : 'password'}
      />
    </View>
  )
}

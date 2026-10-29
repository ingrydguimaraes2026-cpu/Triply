import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { supabase } from '../src/lib/supabase'
import { cor } from '../theme'
import { Ganso } from '../src/comboio/Ganso'

// Login por e-mail e senha. Ao entrar, o onAuthStateChange no _layout leva pras abas.
// (Login com Google no app entra depois — exige configurar o fluxo nativo de OAuth.)
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
    // Sucesso: a navegação acontece sozinha quando a sessão muda.
  }

  return (
    <KeyboardAvoidingView style={styles.tela} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar style="dark" />
      <View style={styles.topo}>
        <Ganso fala="Bora organizar a viagem do comboio?" />
        <Text style={styles.titulo}>Together</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.rotulo}>E-mail</Text>
        <TextInput
          style={styles.campo}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          placeholder="voce@email.com"
          placeholderTextColor="#b9a68a"
        />
        <Text style={styles.rotulo}>Senha</Text>
        <TextInput
          style={styles.campo}
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
          placeholder="sua senha"
          placeholderTextColor="#b9a68a"
        />

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        <Pressable style={[styles.botao, entrando && styles.botaoOff]} onPress={entrar} disabled={entrando}>
          <Text style={styles.botaoTexto}>{entrando ? 'Entrando…' : 'Entrar'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cor.fundo, padding: 24, justifyContent: 'center', gap: 28 },
  topo: { alignItems: 'center', gap: 12 },
  titulo: { fontSize: 30, fontWeight: '800', color: cor.texto },
  form: { gap: 8 },
  rotulo: { fontSize: 13, color: cor.textoSuave, marginTop: 8 },
  campo: {
    backgroundColor: cor.cartao,
    borderWidth: 1,
    borderColor: cor.borda,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: cor.texto,
  },
  erro: { color: cor.pessoal, fontSize: 13, marginTop: 6 },
  botao: {
    backgroundColor: cor.laranja,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 18,
  },
  botaoOff: { opacity: 0.6 },
  botaoTexto: { fontSize: 16, fontWeight: '700', color: cor.texto },
})

import { StyleSheet, Text, View } from 'react-native'
import { cor } from '../../theme'

// Aprofundamento do dinheiro: gastos, divisão, acertos, câmbio. Entra depois,
// reusando a lógica do @together/core e as queries via o client do core.
export default function Financeiro() {
  return (
    <View style={styles.tela}>
      <Text style={styles.titulo}>Financeiro</Text>
      <Text style={styles.texto}>Gastos, divisão e acertos do comboio. Em breve.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cor.fundo, padding: 20, paddingTop: 72, gap: 8 },
  titulo: { fontSize: 24, fontWeight: '800', color: cor.texto },
  texto: { fontSize: 15, color: cor.textoSuave },
})

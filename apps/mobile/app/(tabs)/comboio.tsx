import { StyleSheet, Text, View } from 'react-native'
import { cor } from '../../theme'
import { Ganso } from '../../src/comboio/Ganso'

// O grupo: quem está no comboio, papéis, convites. Momento humano → o personagem aparece.
export default function Comboio() {
  return (
    <View style={styles.tela}>
      <Ganso fala="Aqui fica o comboio: quem vai junto, quem convida, quem é o ADM." />
      <Text style={styles.texto}>Gestão do comboio. Em breve.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cor.fundo, padding: 20, paddingTop: 72, alignItems: 'center', gap: 16 },
  texto: { fontSize: 15, color: cor.textoSuave },
})

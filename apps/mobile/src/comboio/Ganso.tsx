import { StyleSheet, Text, View } from 'react-native'
import { cor } from '../../theme'

// O comboio em pessoa (spec 017): gansos em formação V — viajam em bando, revezam quem vai
// na frente, ninguém aguenta o vento sozinho. É a tese do rateio virada mascote.
// PLACEHOLDER: por enquanto emoji + V de pontos; o desenho final (PNG/SVG) entra depois,
// no mesmo espírito do "humaninho" da humana v2 (fonte única, sincronizada).
type Props = { fala?: string; tamanho?: 'pequeno' | 'grande' }

export function Ganso({ fala, tamanho = 'grande' }: Props) {
  const grande = tamanho === 'grande'
  return (
    <View style={styles.area}>
      <View style={styles.formacao}>
        <Text style={[styles.ganso, grande ? styles.g1 : styles.g1p]}>🪿</Text>
        <View style={styles.asa}>
          <Text style={[styles.ganso, grande ? styles.g2 : styles.g2p]}>🪿</Text>
          <Text style={[styles.ganso, grande ? styles.g2 : styles.g2p]}>🪿</Text>
        </View>
      </View>
      {fala ? (
        <View style={styles.balao}>
          <Text style={styles.falaTexto}>{fala}</Text>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  area: { alignItems: 'center', gap: 8 },
  formacao: { alignItems: 'center' },
  asa: { flexDirection: 'row', gap: 28, marginTop: -4 },
  ganso: { color: cor.couro },
  g1: { fontSize: 34 },
  g2: { fontSize: 26 },
  g1p: { fontSize: 20 },
  g2p: { fontSize: 15 },
  balao: {
    backgroundColor: cor.comboioFundo,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    maxWidth: 260,
  },
  falaTexto: { color: cor.texto, textAlign: 'center', fontSize: 14 },
})

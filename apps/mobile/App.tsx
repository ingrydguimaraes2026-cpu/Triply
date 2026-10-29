import { StatusBar } from 'expo-status-bar'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { comIOF, custoEmReais, formatarDinheiro, type Nivel } from '@together/core'
import { cor } from './theme'
import { Ganso } from './src/comboio/Ganso'

// Home da viagem — redesign "dinheiro no centro" (spec 017).
// Mobile-first: num segundo dá pra ver quanto o comboio gastou, quanto você deve e se o
// câmbio está bom. Real e euro lado a lado. Dados abaixo são de exemplo (demo da identidade);
// a fiação com o Supabase vem depois. O importante aqui: a conta vem do @together/core,
// o mesmo que a web usa.
const COMERCIAL = 6.12 // reais por 1 euro (exemplo)
const euros = (centavos: number) => formatarDinheiro(centavos, 'EUR')
const reais = (centavosEuro: number) => formatarDinheiro(custoEmReais(centavosEuro, comIOF(COMERCIAL)), 'BRL')

const gastoComboio = 128000 // €1.280,00
const euVeuDevo = -4200 // negativo = você deve
const nivelHoje: Nivel = 'barato'

const rotuloNivel: Record<Nivel, string> = {
  barato: 'Câmbio barato hoje 🙂',
  medio: 'Câmbio na média',
  caro: 'Câmbio caro hoje',
}

export default function App() {
  const devo = euVeuDevo < 0
  return (
    <View style={styles.tela}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        {/* Topo: o comboio em pessoa, discreto */}
        <View style={styles.topo}>
          <Ganso tamanho="pequeno" />
          <View>
            <Text style={styles.viagem}>Eurotrip</Text>
            <Text style={styles.subViagem}>comboio de 4 · 12 dias</Text>
          </View>
        </View>

        {/* CENTRO: quanto o comboio gastou (euro grande, real embaixo) */}
        <View style={styles.cartaoDestaque}>
          <Text style={styles.rotulo}>O comboio já gastou</Text>
          <Text style={styles.euroGrande}>{euros(gastoComboio)}</Text>
          <Text style={styles.realAbaixo}>{reais(gastoComboio)} com IOF</Text>
        </View>

        {/* Você deve / te devem */}
        <View style={styles.linhaDupla}>
          <View style={[styles.mini, devo ? styles.miniDevo : styles.miniRecebe]}>
            <Text style={styles.miniRotulo}>{devo ? 'Você deve' : 'Te devem'}</Text>
            <Text style={styles.miniValor}>{euros(Math.abs(euVeuDevo))}</Text>
            <Text style={styles.miniReal}>{reais(Math.abs(euVeuDevo))}</Text>
          </View>
          <View style={[styles.mini, styles.miniCambio]}>
            <Text style={styles.miniRotulo}>{rotuloNivel[nivelHoje]}</Text>
            <Text style={styles.miniValor}>R$ {comIOF(COMERCIAL).toFixed(2).replace('.', ',')}</Text>
            <Text style={styles.miniReal}>por € 1 (com IOF)</Text>
          </View>
        </View>

        {/* Um toque abaixo: o resto da viagem */}
        <Text style={styles.secao}>A viagem</Text>
        <View style={styles.atalhos}>
          {['Roteiro', 'Hospedagem', 'Lugares', 'Fotos'].map((t) => (
            <View key={t} style={styles.atalho}>
              <Text style={styles.atalhoTexto}>{t}</Text>
            </View>
          ))}
        </View>

        {/* Momento humano: o comboio fala (acerto) */}
        <View style={styles.acerto}>
          <Ganso fala="No fim da viagem eu fecho a conta: quem deve pra quem, sem briga." />
        </View>
      </ScrollView>

      {/* Lançar gasto: o gesto mais usado, sempre à mão */}
      <Pressable style={styles.fab} accessibilityLabel="Lançar gasto">
        <Text style={styles.fabMais}>+</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cor.fundo },
  conteudo: { padding: 20, paddingTop: 64, paddingBottom: 120, gap: 16 },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  viagem: { fontSize: 22, fontWeight: '700', color: cor.texto },
  subViagem: { fontSize: 13, color: cor.textoSuave },

  cartaoDestaque: {
    backgroundColor: cor.cartao,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: cor.borda,
  },
  rotulo: { fontSize: 14, color: cor.textoSuave },
  euroGrande: { fontSize: 44, fontWeight: '800', color: cor.texto, marginTop: 4 },
  realAbaixo: { fontSize: 15, color: cor.textoSuave, marginTop: 2 },

  linhaDupla: { flexDirection: 'row', gap: 12 },
  mini: { flex: 1, borderRadius: 16, padding: 16 },
  miniDevo: { backgroundColor: cor.pessoal },
  miniRecebe: { backgroundColor: cor.comboio },
  miniCambio: { backgroundColor: cor.comboioFundo },
  miniRotulo: { fontSize: 12, color: cor.texto, opacity: 0.9 },
  miniValor: { fontSize: 22, fontWeight: '700', color: cor.texto, marginTop: 6 },
  miniReal: { fontSize: 12, color: cor.texto, opacity: 0.8, marginTop: 2 },

  secao: { fontSize: 15, fontWeight: '700', color: cor.texto, marginTop: 4 },
  atalhos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  atalho: {
    backgroundColor: cor.cartao,
    borderWidth: 1,
    borderColor: cor.borda,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    minWidth: '47%',
  },
  atalhoTexto: { fontSize: 15, color: cor.texto, fontWeight: '600' },

  acerto: { marginTop: 10, alignItems: 'center' },

  fab: {
    position: 'absolute',
    right: 22,
    bottom: 34,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: cor.laranja,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabMais: { fontSize: 32, color: cor.texto, fontWeight: '700', marginTop: -2 },
})

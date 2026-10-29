import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { formatarDinheiro } from '@together/core'
import { cor } from '../../theme'
import { Ganso } from '../../src/comboio/Ganso'
import { useResumoViagem } from '../../src/dados/useResumoViagem'

// Home da viagem — "dinheiro no centro" (spec 017) com DADO REAL do Supabase (via @together/core).
// Mostra a viagem mais recente, meu euro e o euro do comboio. Câmbio em real lado a lado
// entra depois (precisa da cotação do dia).
const euros = (valorEmEuros: number) => formatarDinheiro(Math.round(valorEmEuros * 100), 'EUR')

export default function Home() {
  const estado = useResumoViagem()

  if (estado.status === 'carregando') {
    return (
      <View style={styles.centro}>
        <ActivityIndicator color={cor.couro} />
      </View>
    )
  }

  if (estado.status === 'erro') {
    return (
      <View style={styles.centro}>
        <Text style={styles.texto}>Não deu pra carregar sua viagem. Puxe pra atualizar ou tente mais tarde.</Text>
      </View>
    )
  }

  if (estado.status === 'vazio') {
    return (
      <View style={styles.centro}>
        <Ganso fala="Você ainda não tem viagem. Crie uma no site e ela aparece aqui." />
      </View>
    )
  }

  const { viagem, membros, meuEuro, euroComboio } = estado.dados
  const ehEuro = viagem.moeda === 'EUR'

  return (
    <View style={styles.tela}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <View style={styles.topo}>
          <Ganso tamanho="pequeno" />
          <View>
            <Text style={styles.viagem}>{viagem.nome}</Text>
            <Text style={styles.subViagem}>
              comboio de {membros} · {viagem.moeda}
            </Text>
          </View>
        </View>

        {ehEuro ? (
          <>
            <View style={styles.cartaoDestaque}>
              <Text style={styles.rotulo}>Meu euro</Text>
              <Text style={styles.euroGrande}>{euros(meuEuro)}</Text>
              <Text style={styles.realAbaixo}>na sua conta Wise/Nomad</Text>
            </View>

            <View style={styles.cartaoComboio}>
              <Text style={styles.rotulo}>Euro do comboio</Text>
              <Text style={styles.euroMedio}>{euros(euroComboio)}</Text>
            </View>
          </>
        ) : (
          <View style={styles.cartaoDestaque}>
            <Text style={styles.rotulo}>Carteira em euro</Text>
            <Text style={styles.texto}>Aparece nas viagens com moeda euro. Esta é em {viagem.moeda}.</Text>
          </View>
        )}

        <Text style={styles.secao}>A viagem</Text>
        <View style={styles.atalhos}>
          {['Roteiro', 'Hospedagem', 'Lugares', 'Fotos'].map((t) => (
            <View key={t} style={styles.atalho}>
              <Text style={styles.atalhoTexto}>{t}</Text>
            </View>
          ))}
        </View>

        <View style={styles.acerto}>
          <Ganso fala="No fim da viagem eu fecho a conta: quem deve pra quem, sem briga." />
        </View>
      </ScrollView>

      <Pressable style={styles.fab} accessibilityLabel="Lançar gasto">
        <Text style={styles.fabMais}>+</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cor.fundo },
  centro: { flex: 1, backgroundColor: cor.fundo, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12 },
  conteudo: { padding: 20, paddingTop: 64, paddingBottom: 40, gap: 16 },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  viagem: { fontSize: 22, fontWeight: '700', color: cor.texto },
  subViagem: { fontSize: 13, color: cor.textoSuave },

  cartaoDestaque: { backgroundColor: cor.cartao, borderRadius: 20, padding: 22, borderWidth: 1, borderColor: cor.borda },
  rotulo: { fontSize: 14, color: cor.textoSuave },
  euroGrande: { fontSize: 44, fontWeight: '800', color: cor.texto, marginTop: 4 },
  euroMedio: { fontSize: 28, fontWeight: '700', color: cor.texto, marginTop: 4 },
  realAbaixo: { fontSize: 15, color: cor.textoSuave, marginTop: 2 },
  cartaoComboio: { backgroundColor: cor.comboioFundo, borderRadius: 18, padding: 18 },

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
  texto: { fontSize: 15, color: cor.textoSuave, textAlign: 'center' },

  acerto: { marginTop: 10, alignItems: 'center' },

  fab: {
    position: 'absolute',
    right: 22,
    bottom: 24,
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

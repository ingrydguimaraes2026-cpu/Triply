import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { formatarDinheiro } from '@together/core'
import { Ganso } from '../../src/comboio/Ganso'
import { useResumoViagem } from '../../src/dados/useResumoViagem'

// Home da viagem — "dinheiro no centro" (spec 017), vibe viagem caloroso (Airbnb/Hopper):
// hero quente com gradiente, cantos bem arredondados, respiro. Dado real via @together/core.
const euros = (valorEmEuros: number) => formatarDinheiro(Math.round(valorEmEuros * 100), 'EUR')

export default function Home() {
  const estado = useResumoViagem()
  const insets = useSafeAreaInsets()

  if (estado.status === 'carregando') {
    return (
      <View className="flex-1 items-center justify-center bg-fundo">
        <ActivityIndicator color="#7b542f" />
      </View>
    )
  }
  if (estado.status === 'erro') {
    return (
      <View className="flex-1 items-center justify-center bg-fundo px-8">
        <Text className="text-center text-base text-suave">Não deu pra carregar sua viagem. Tente de novo em instantes.</Text>
      </View>
    )
  }
  if (estado.status === 'vazio') {
    return (
      <View className="flex-1 items-center justify-center bg-fundo px-8">
        <Ganso fala="Você ainda não tem viagem. Crie uma no site e ela aparece aqui." />
      </View>
    )
  }

  const { viagem, membros, meuEuro, euroComboio } = estado.dados
  const ehEuro = viagem.moeda === 'EUR'

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {/* Hero quente: a viagem + meu euro */}
        <LinearGradient
          colors={['#8a5a28', '#b6771d', '#ff9d00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: insets.top + 20, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}
        >
          <View className="px-6 pb-8">
            <View className="flex-row items-center gap-3">
              <Ganso tamanho="pequeno" />
              <View>
                <Text className="text-2xl font-extrabold text-white">{viagem.nome}</Text>
                <Text className="text-[13px] text-dourado">comboio de {membros} · {viagem.moeda}</Text>
              </View>
            </View>

            {ehEuro ? (
              <View className="mt-7">
                <Text className="text-[13px] font-medium uppercase tracking-wide text-dourado">Meu euro</Text>
                <Text className="mt-1 text-5xl font-extrabold text-white">{euros(meuEuro)}</Text>
                <Text className="mt-1 text-[13px] text-white/80">na sua conta Wise/Nomad</Text>
              </View>
            ) : (
              <View className="mt-7">
                <Text className="text-base text-white">Carteira em euro aparece em viagens com moeda euro ({viagem.moeda}).</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        <View className="gap-4 px-5 pt-5">
          {ehEuro && (
            <View className="flex-row items-center justify-between rounded-3xl bg-comboio-fundo px-5 py-4">
              <Text className="text-[15px] font-semibold text-texto">Euro do comboio</Text>
              <Text className="text-xl font-extrabold text-couro">{euros(euroComboio)}</Text>
            </View>
          )}

          <Text className="mt-1 text-base font-bold text-texto">A viagem</Text>
          <View className="flex-row flex-wrap gap-3">
            {[
              { t: 'Roteiro', e: '🗺️' },
              { t: 'Hospedagem', e: '🏠' },
              { t: 'Lugares', e: '📍' },
              { t: 'Fotos', e: '📷' },
            ].map(({ t, e }) => (
              <View key={t} className="min-w-[47%] flex-1 flex-row items-center gap-3 rounded-3xl border border-borda bg-cartao px-5 py-5">
                <Text className="text-2xl">{e}</Text>
                <Text className="text-[15px] font-semibold text-texto">{t}</Text>
              </View>
            ))}
          </View>

          {/* Momento humano: o comboio fala (acerto) */}
          <View className="mt-3 items-center rounded-3xl bg-comboio-fundo px-5 py-6">
            <Ganso fala="No fim da viagem eu fecho a conta: quem deve pra quem, sem briga." />
          </View>
        </View>
      </ScrollView>

      {/* Lançar gasto: o gesto mais usado, sempre à mão */}
      <Pressable
        className="absolute bottom-7 right-6 h-16 w-16 items-center justify-center rounded-full bg-laranja"
        style={{ elevation: 5, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }}
        accessibilityLabel="Lançar gasto"
      >
        <Text className="text-[32px] font-bold text-texto">+</Text>
      </Pressable>
    </View>
  )
}

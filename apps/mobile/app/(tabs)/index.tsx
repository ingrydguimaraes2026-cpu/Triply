import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Camera, Bed, MapPin, Plus, Route } from 'lucide-react-native'
import { formatarDinheiro } from '@together/core'
import { Ganso } from '../../src/comboio/Ganso'
import { useResumoViagem } from '../../src/dados/useResumoViagem'

const euros = (valorEmEuros: number) => formatarDinheiro(Math.round(valorEmEuros * 100), 'EUR')

const ATALHOS = [
  { t: 'Roteiro', Icone: Route },
  { t: 'Hospedagem', Icone: Bed },
  { t: 'Lugares', Icone: MapPin },
  { t: 'Fotos', Icone: Camera },
]

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
        <Text className="text-center font-body text-base text-suave">Não deu pra carregar sua viagem. Tente de novo em instantes.</Text>
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
        {/* Hero quente */}
        <LinearGradient
          colors={['#8a5a28', '#b6771d', '#ff9d00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1.1 }}
          style={{ paddingTop: insets.top + 22, borderBottomLeftRadius: 34, borderBottomRightRadius: 34 }}
        >
          <View className="px-6 pb-9">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="font-body text-[13px] text-dourado">sua viagem</Text>
                <Text className="font-display-bold text-[28px] text-white">{viagem.nome}</Text>
              </View>
              <Avatares n={membros} />
            </View>

            {ehEuro ? (
              <View className="mt-8">
                <Text className="font-body-medium text-[12px] uppercase tracking-widest text-dourado">Meu euro</Text>
                <Text className="mt-1 font-display-bold text-[52px] leading-none text-white">{euros(meuEuro)}</Text>
                <Text className="mt-2 font-body text-[13px] text-white/80">na sua conta Wise/Nomad</Text>
              </View>
            ) : (
              <Text className="mt-8 font-body text-base text-white">Carteira em euro aparece em viagens com moeda euro ({viagem.moeda}).</Text>
            )}
          </View>
        </LinearGradient>

        <View className="gap-4 px-5 pt-5">
          {ehEuro && (
            <View className="flex-row items-center justify-between rounded-[26px] bg-comboio-fundo px-6 py-5">
              <View>
                <Text className="font-body-medium text-[13px] text-couro">Euro do comboio</Text>
                <Text className="font-body text-[12px] text-couro/70">somando todo mundo</Text>
              </View>
              <Text className="font-display-bold text-[24px] text-couro">{euros(euroComboio)}</Text>
            </View>
          )}

          <Text className="mt-2 font-display-bold text-[19px] text-texto">A viagem</Text>
          <View className="flex-row flex-wrap gap-3">
            {ATALHOS.map(({ t, Icone }) => (
              <View key={t} className="min-w-[47%] flex-1 flex-row items-center gap-3 rounded-[22px] border border-borda bg-cartao px-5 py-5">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-comboio-fundo">
                  <Icone size={18} color="#7b542f" />
                </View>
                <Text className="font-body-semibold text-[15px] text-texto">{t}</Text>
              </View>
            ))}
          </View>

          {/* Momento humano: o comboio fala */}
          <View className="mt-3 items-center rounded-[26px] bg-comboio-fundo px-5 py-6">
            <Ganso fala="No fim da viagem eu fecho a conta: quem deve pra quem, sem briga." />
          </View>
        </View>
      </ScrollView>

      <Pressable
        className="absolute bottom-7 right-6 h-16 w-16 items-center justify-center rounded-full bg-laranja"
        style={{ boxShadow: '0 10px 24px rgba(255,157,0,0.45)' } as object}
        accessibilityLabel="Lançar gasto"
      >
        <Plus size={28} color="#3b2715" strokeWidth={2.5} />
      </Pressable>
    </View>
  )
}

// Bolinhas com iniciais fake do comboio (até ligarmos os membros de verdade).
function Avatares({ n }: { n: number }) {
  const cores = ['#ff9d00', '#b6771d', '#9a5b00', '#7b542f']
  const qtos = Math.min(n, 3)
  return (
    <View className="flex-row">
      {Array.from({ length: qtos }).map((_, i) => (
        <View
          key={i}
          className="h-9 w-9 items-center justify-center rounded-full border-2 border-white"
          style={{ backgroundColor: cores[i % cores.length], marginLeft: i === 0 ? 0 : -10 }}
        >
          <Text className="font-body-bold text-[12px] text-white">{String.fromCharCode(65 + i)}</Text>
        </View>
      ))}
      {n > 3 && (
        <View className="h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-couro" style={{ marginLeft: -10 }}>
          <Text className="font-body-bold text-[11px] text-white">+{n - 3}</Text>
        </View>
      )}
    </View>
  )
}

import { Linking, Pressable, Text, View } from 'react-native'
import { Car, Navigation } from './icones'
import { linksDeCorrida, linksDeNavegacao, type Alvo } from '@together/core'
import { cor } from '../../theme'

// Spec 040 no mobile: "Ir" abre o Google Maps com o caminho; "Corrida" abre o Uber com o destino.
// (No site tem a lista com Waze, Apple, Citymapper, Bolt...; aqui ficam os dois mais usados.)
export function BotaoIr({ alvo, corrida = true }: { alvo: Alvo; corrida?: boolean }) {
  const mapa = linksDeNavegacao(alvo)[0]
  const uber = linksDeCorrida(alvo).find((l) => l.chave === 'uber')
  return (
    <View className="flex-row gap-2">
      <Pressable onPress={() => Linking.openURL(mapa.url)} className="flex-row items-center gap-1.5 rounded-xl bg-chip px-3 py-2 active:opacity-80">
        <Navigation size={15} color={cor.couro} />
        <Text className="font-body-bold text-[13px] text-couro">Ir</Text>
      </Pressable>
      {corrida && uber ? (
        <Pressable onPress={() => Linking.openURL(uber.url)} className="flex-row items-center gap-1.5 rounded-xl bg-chip px-3 py-2 active:opacity-80">
          <Car size={15} color={cor.couro} />
          <Text className="font-body-bold text-[13px] text-couro">Corrida</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

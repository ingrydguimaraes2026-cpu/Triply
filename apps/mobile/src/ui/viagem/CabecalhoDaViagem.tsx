import { Pressable, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import type { ViagemComDetalhes } from '@together/core'
import { Icone } from '../Icone'
import { Foto } from '../Foto'
import { Avatar } from '../pecas'
import { useCapas } from '../../dados/useCapas'
import { cor, fonte, trabalho } from '../../../theme'

// Cabeçalho igual em todas as abas da viagem (caminho B, mapa aprovado pelo Victor em 10/11/2026):
// à esquerda a viagem (foto + nome, toque pra trocar de viagem), à direita os rostos da galera
// (toque abre a Galera) e os ajustes. Assim a pessoa sempre sabe em que viagem está.
export function CabecalhoDaViagem({ viagem, topo }: { viagem: ViagemComDetalhes; topo: number }) {
  const router = useRouter()
  const capa = useCapas([viagem.id])
  const foto = capa(viagem.id)
  const rostos = viagem.membros.slice(0, 4)
  const aMais = viagem.membros.length - rostos.length

  return (
    <View style={{ paddingTop: topo + 6, backgroundColor: trabalho.fundo }} className="flex-row items-center gap-2 px-3.5 pb-2">
      <Pressable
        onPress={() => router.push('/')}
        accessibilityRole="button"
        accessibilityLabel={`${viagem.nome}: trocar de viagem`}
        className="flex-shrink flex-row items-center gap-1.5 rounded-full border py-[5px] pl-[5px] pr-2.5 active:opacity-80"
        style={{ backgroundColor: trabalho.superficie, borderColor: trabalho.linha }}
      >
        {foto ? <Foto source={foto} style={{ width: 24, height: 24, borderRadius: 12 }} /> : <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: cor.chip }} />}
        <Text numberOfLines={1} style={{ fontFamily: fonte.item, fontSize: 14, letterSpacing: -0.2, color: trabalho.texto, flexShrink: 1 }}>
          {viagem.nome}
        </Text>
        <Icone nome="seta-baixo" tamanho={12} cor={trabalho.texto2} />
      </Pressable>

      <View className="flex-1" />

      <Pressable
        onPress={() => router.push('/comboio')}
        accessibilityRole="button"
        accessibilityLabel={`Galera: ${viagem.membros.length} ${viagem.membros.length === 1 ? 'pessoa' : 'pessoas'}`}
        className="flex-row items-center active:opacity-80"
        hitSlop={6}
      >
        {rostos.map((m, i) => (
          <View key={m.id} style={{ marginLeft: i ? -8 : 0 }}>
            <Avatar nome={m.nome} indice={i} tamanho={28} borda={trabalho.fundo} />
          </View>
        ))}
        {aMais > 0 ? (
          <View style={{ marginLeft: -8, width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: trabalho.fundo, backgroundColor: cor.chip }} className="items-center justify-center">
            <Text style={{ fontFamily: fonte.corpoNegrito, fontSize: 10, color: cor.couro }}>+{aMais}</Text>
          </View>
        ) : null}
      </Pressable>

      <Pressable
        onPress={() => router.push('/configuracoes')}
        accessibilityRole="button"
        accessibilityLabel="Ajustes da viagem"
        className="h-[34px] w-[34px] items-center justify-center rounded-full border active:opacity-80"
        style={{ backgroundColor: trabalho.superficie, borderColor: trabalho.linha }}
      >
        <Icone nome="ajustes" tamanho={17} cor={trabalho.texto} />
      </Pressable>
    </View>
  )
}

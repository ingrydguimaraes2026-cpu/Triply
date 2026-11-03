import { Image, Pressable, ScrollView, Text, View } from 'react-native'
import Animated from 'react-native-reanimated'
import type { Pessoa } from '@together/core'
import { Check, Compass, Wand2 } from './icones'
import { Selo } from './Selos'
import { Avatar } from './pecas'
import { useCascata } from './movimento'
import { agruparMatches, type Match } from '../dados/matches'
import { primeiroNome } from '../lib/formato'
import { cor, sombra } from '../../theme'

// Aba Matches do Roteiro (spec 117, tela C): o que o comboio quer, em 3 grupos.
type Props = {
  matches: Match[]
  membros: Pessoa[]
  meuId: string
  aoAbrirLugar: (m: Match) => void // pôr no dia / opinar: abre o Explorar daquele destino
  aoMontar: () => void
  aoDescobrir: () => void
}

export function Matches({ matches, membros, meuId, aoAbrirLugar, aoMontar, aoDescobrir }: Props) {
  const pessoas = membros.length
  const { todos, match, quase } = agruparMatches(matches, pessoas)
  const grupos = [
    { titulo: `Todo mundo quer · ${pessoas} de ${pessoas}`, lista: todos },
    { titulo: 'Deu match · 3 ou mais', lista: match },
    { titulo: 'Quase · 2 querem', lista: quase, opinar: true },
  ].filter((g) => g.lista.length)

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 18 }}>
      {pessoas < 2 ? (
        <Vazio texto="Match é coisa de grupo: chame a galera e cada um desliza do seu jeito." />
      ) : !grupos.length ? (
        <Vazio texto={'Ainda nada em comum. Quando 3 pessoas derem "quero" no mesmo lugar, ele aparece aqui.'} />
      ) : (
        grupos.map((g, i) => (
          <Grupo key={g.titulo} indice={i} titulo={g.titulo}>
            {g.lista.map((m) => (
              <Linha key={m.catalogoId} m={m} membros={membros} meuId={meuId} opinar={!!g.opinar} aoTocar={() => aoAbrirLugar(m)} />
            ))}
          </Grupo>
        ))
      )}

      {match.length + todos.length > 0 ? (
        <Pressable onPress={aoMontar} className="h-[52px] flex-row items-center justify-center gap-2 rounded-2xl bg-couro active:opacity-90" style={sombra.botao}>
          <Wand2 size={18} color="#fff" />
          <Text className="font-body-bold text-[15px] text-white">Montar os dias com os matches</Text>
        </Pressable>
      ) : null}
      <Pressable onPress={aoDescobrir} className="h-[52px] flex-row items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-tracejado active:opacity-80">
        <Compass size={18} color={cor.couro} />
        <Text className="font-body-bold text-[15px] text-couro">Descobrir mais lugares</Text>
      </Pressable>
    </ScrollView>
  )
}

function Grupo({ indice, titulo, children }: { indice: number; titulo: string; children: React.ReactNode }) {
  const entrada = useCascata(indice)
  return (
    <Animated.View style={entrada} className="gap-2.5">
      <Text className="font-body-bold text-[11px] uppercase tracking-widest text-caramelo">{titulo}</Text>
      {children}
    </Animated.View>
  )
}

function Linha({ m, membros, meuId, opinar, aoTocar }: { m: Match; membros: Pessoa[]; meuId: string; opinar: boolean; aoTocar: () => void }) {
  const quem = m.quem.map((id) => membros.findIndex((p) => p.id === id)).filter((i) => i >= 0)
  const faltam = membros.filter((p) => !m.quem.includes(p.id))
  const falta = faltam.length ? `falta ${faltam.map((p) => (p.id === meuId ? 'você' : primeiroNome(p.nome))).join(', ').replace(/, ([^,]*)$/, ' e $1')}` : 'todo mundo quer'
  return (
    <Pressable onPress={aoTocar} className="flex-row items-center gap-3 rounded-2xl bg-cartao p-2.5 active:opacity-90" style={sombra.cartao}>
      {m.foto ? <Image source={{ uri: m.foto }} className="h-16 w-16 rounded-xl bg-areia" /> : <View className="h-16 w-16 items-center justify-center rounded-xl bg-areia"><Selo nome="museu" tamanho={34} /></View>}
      <View className="min-w-0 flex-1 gap-1">
        <Text className="font-body-bold text-[15px] text-texto" numberOfLines={2}>
          {m.nome}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <View className="flex-row" style={{ paddingLeft: 6 }}>
            {quem.slice(0, 5).map((i) => (
              <View key={i} style={{ marginLeft: -6 }}>
                <Avatar nome={membros[i].nome} indice={i} tamanho={20} borda={cor.cartao} />
              </View>
            ))}
          </View>
          <Text className="flex-1 font-body text-[12px] text-suave" numberOfLines={1}>
            {falta}
          </Text>
        </View>
      </View>
      {m.noDia ? (
        <View className="flex-row items-center gap-1 rounded-full bg-verde-fundo px-2.5 py-1.5">
          <Check size={13} color={cor.verde} />
          <Text className="font-body-bold text-[12px] text-verde">No dia</Text>
        </View>
      ) : opinar ? (
        <View className="rounded-full border border-tracejado px-3 py-1.5">
          <Text className="font-body-bold text-[12px] text-couro">Opinar</Text>
        </View>
      ) : (
        <View className="rounded-full bg-couro px-3 py-1.5">
          <Text className="font-body-bold text-[12px] text-white">Pôr no dia</Text>
        </View>
      )}
    </Pressable>
  )
}

function Vazio({ texto }: { texto: string }) {
  return (
    <View className="items-center gap-2 rounded-2xl border-[1.5px] border-dashed border-tracejado px-6 py-8">
      <Selo nome="coracoes" tamanho={52} />
      <Text className="text-center font-body text-[14px] leading-5 text-corpo">{texto}</Text>
    </View>
  )
}

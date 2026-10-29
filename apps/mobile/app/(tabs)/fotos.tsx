import { useCallback, useState } from 'react'
import { Image, Pressable, ScrollView, Text, View } from 'react-native'
import { StatusBar } from '../../src/ui/StatusBar'
import { useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { buscarFotos, type FotoDaViagem, type ViagemComDetalhes } from '@together/core'
import { useCarregar } from '../../src/dados/useCarregar'
import { useViagemAtual } from '../../src/dados/viagemAtual'
import { diaCurto, diasDaViagem, paraIso, primeiroNome } from '../../src/lib/formato'
import { supabase } from '../../src/lib/supabase'
import { Malinha } from '../../src/ui/Malinha'
import { Avatar, Carregando, ErroNaTela, TituloDaTela } from '../../src/ui/pecas'
import { SemViagem } from '../../src/ui/SemViagem'

// Fotos por dia (tela "1l" do design): filtro por pessoa e grade em 2 colunas de alturas diferentes.
// Postar foto continua no site por enquanto (feed com curtidas e comentários).
const ALTURAS = [220, 160, 150, 240, 170, 200, 230, 140]

export default function Fotos() {
  const { atual, meuId } = useViagemAtual()
  if (!atual) return <SemViagem titulo="Fotos" />
  return <FotosDaViagem viagem={atual} meuId={meuId} />
}

function FotosDaViagem({ viagem, meuId }: { viagem: ViagemComDetalhes; meuId: string }) {
  const insets = useSafeAreaInsets()
  const [pessoa, setPessoa] = useState<string | null>(null)
  const carga = useCarregar(() => buscarFotos(supabase, viagem.id), [viagem.id])
  const { recarregar } = carga
  useFocusEffect(useCallback(() => recarregar(), [recarregar]))

  if (carga.status === 'carregando') return <Carregando />
  if (carga.status === 'erro') return <ErroNaTela aoTentar={carga.recarregar} />

  const todas = carga.dados
  const fotos = pessoa ? todas.filter((f) => f.enviada_por === pessoa) : todas
  const quemPostou = new Set(todas.map((f) => f.enviada_por)).size
  const grupos = agruparPorDia(fotos, viagem)
  const indice = (id: string) => Math.max(0, viagem.membros.findIndex((m) => m.id === id))
  const nome = (id: string) => (id === meuId ? 'Você' : primeiroNome(viagem.membros.find((m) => m.id === id)?.nome ?? '?'))

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 40 }}>
        <View className="px-1">
          <TituloDaTela acima={`${todas.length} ${todas.length === 1 ? 'foto' : 'fotos'} · ${quemPostou} ${quemPostou === 1 ? 'pessoa' : 'pessoas'}`} titulo="Fotos" />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 mb-1 mt-4" contentContainerStyle={{ gap: 8, paddingHorizontal: 20 }}>
          <Pressable onPress={() => setPessoa(null)} className={`h-9 justify-center rounded-xl px-3.5 ${pessoa ? 'border border-borda bg-cartao' : 'bg-couro'}`}>
            <Text className={`font-body-bold text-[13px] ${pessoa ? 'text-texto' : 'text-white'}`}>Todos</Text>
          </Pressable>
          {viagem.membros.map((m, i) => {
            const ativo = pessoa === m.id
            return (
              <Pressable key={m.id} onPress={() => setPessoa(ativo ? null : m.id)} className={`h-9 flex-row items-center gap-1.5 rounded-xl pl-1 pr-3 ${ativo ? 'bg-couro' : 'border border-borda bg-cartao'}`}>
                <Avatar nome={m.nome} indice={i} tamanho={26} />
                <Text className={`font-body-semibold text-[13px] ${ativo ? 'text-white' : 'text-texto'}`}>{nome(m.id)}</Text>
              </Pressable>
            )
          })}
        </ScrollView>

        {fotos.length === 0 ? (
          <View className="mt-16 items-center gap-3 px-6">
            <Malinha humor="dormindo" tamanho={120} />
            <Text className="font-display text-[24px] text-texto">Nenhuma foto ainda</Text>
            <Text className="text-center font-body text-[15px] leading-6 text-corpo">As fotos que o comboio postar no feed aparecem aqui, separadas por dia.</Text>
          </View>
        ) : (
          grupos.map((g) => (
            <View key={g.titulo}>
              <View className="flex-row items-baseline justify-between px-1 pb-2.5 pt-5">
                <Text className="font-display text-[20px] text-texto">{g.titulo}</Text>
                <Text className="font-body text-[13px] text-suave">
                  {g.fotos.length} {g.fotos.length === 1 ? 'foto' : 'fotos'}
                </Text>
              </View>
              <View className="flex-row gap-2">
                {[0, 1].map((col) => (
                  <View key={col} className="flex-1 gap-2">
                    {g.fotos
                      .filter((_f, i) => i % 2 === col)
                      .map((f, i) => (
                        <View key={f.id} className="overflow-hidden rounded-[14px] bg-tracejado" style={{ height: ALTURAS[(i * 2 + col) % ALTURAS.length] }}>
                          {f.url ? <Image source={{ uri: f.url }} className="h-full w-full" resizeMode="cover" /> : null}
                          <View className="absolute right-2 top-2 flex-row items-center gap-1.5 rounded-full bg-fundo/90 py-[3px] pl-[3px] pr-2">
                            <Avatar nome={viagem.membros.find((m) => m.id === f.enviada_por)?.nome ?? '?'} indice={indice(f.enviada_por)} tamanho={18} />
                            <Text className="font-body-bold text-[11px] text-texto">{nome(f.enviada_por)}</Text>
                          </View>
                        </View>
                      ))}
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

// "Dia 2 · sáb 15" quando a foto cai dentro da viagem; senão só a data
function agruparPorDia(fotos: FotoDaViagem[], viagem: ViagemComDetalhes) {
  const dias = diasDaViagem(viagem.dataInicio, viagem.dataFim).map(paraIso)
  const grupos: { titulo: string; fotos: FotoDaViagem[] }[] = []
  for (const f of fotos) {
    const data = new Date(f.criado_em)
    const n = dias.indexOf(paraIso(data))
    const titulo = n >= 0 ? `Dia ${n + 1} · ${diaCurto(data)}` : diaCurto(data)
    const g = grupos.find((x) => x.titulo === titulo)
    if (g) g.fotos.push(f)
    else grupos.push({ titulo, fotos: [f] })
  }
  return grupos
}

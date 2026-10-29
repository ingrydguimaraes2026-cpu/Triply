import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { StatusBar } from '../src/ui/StatusBar'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Bus, Car, Footprints, Plane, Route, Ship, TrainFront, type LucideIcon } from 'lucide-react-native'
import { buscarDestinos, buscarTrajetos, type Destino, type Trajeto } from '@together/core'
import { useCarregar } from '../src/dados/useCarregar'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { diaCurto, hora } from '../src/lib/formato'
import { supabase } from '../src/lib/supabase'
import { Malinha } from '../src/ui/Malinha'
import { BotaoRedondo, Cartao, Carregando, ErroNaTela, IconeQuadrado } from '../src/ui/pecas'
import { cor } from '../theme'

// Transportes (tela "1i" do design): os trajetos do comboio como cartões de "passagem",
// separados em Ida (primeira metade da viagem) e Volta.
const MEIOS: Record<string, { nome: string; Icone: LucideIcon }> = {
  aviao: { nome: 'Voo', Icone: Plane },
  carro: { nome: 'Carro', Icone: Car },
  onibus: { nome: 'Ônibus', Icone: Bus },
  trem: { nome: 'Trem', Icone: TrainFront },
  barco: { nome: 'Barco', Icone: Ship },
  a_pe: { nome: 'A pé', Icone: Footprints },
  outro: { nome: 'Trajeto', Icone: Route },
}

export default function Transportes() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { atual: viagem } = useViagemAtual()
  const [aba, setAba] = useState<'todos' | 'ida' | 'volta'>('todos')
  const carga = useCarregar(viagem ? () => Promise.all([buscarTrajetos(supabase, viagem.id), buscarDestinos(supabase, viagem.id)]) : null, [viagem?.id])

  if (!viagem) return null
  if (carga.status === 'carregando') return <Carregando />
  if (carga.status === 'erro') return <ErroNaTela aoTentar={carga.recarregar} />
  const [trajetos, destinos] = carga.dados
  const destino = destinos[0]?.nome ?? viagem.nome

  // Ida = trajetos antes do meio da viagem; Volta = depois
  const meio = viagem.dataInicio && viagem.dataFim ? (new Date(viagem.dataInicio).getTime() + new Date(viagem.dataFim).getTime()) / 2 : null
  const ehIda = (t: Trajeto) => !meio || !t.partida || new Date(t.partida).getTime() <= meio
  const lista = aba === 'todos' ? trajetos : trajetos.filter((t) => (aba === 'ida' ? ehIda(t) : !ehIda(t)))

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 40, gap: 12 }}>
        <BotaoRedondo aoTocar={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
          <ArrowLeft size={20} color={cor.texto} />
        </BotaoRedondo>
        <View>
          <Text className="font-display text-[32px] text-texto">Transportes</Text>
          <Text className="mt-0.5 font-body text-[14px] text-suave">Como o comboio chega em {destino}</Text>
        </View>
        {meio ? (
          <View className="my-1 flex-row gap-2">
            {(['todos', 'ida', 'volta'] as const).map((a) => (
              <Pressable key={a} onPress={() => setAba(a)} className={`rounded-xl px-4 py-2.5 ${aba === a ? 'bg-couro' : 'border border-borda bg-cartao'}`}>
                <Text className={`font-body-bold text-[13px] ${aba === a ? 'text-white' : 'text-texto'}`}>{a === 'todos' ? 'Todos' : a === 'ida' ? 'Ida' : 'Volta'}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {lista.length === 0 ? (
          <View className="mt-10 items-center gap-3 px-6">
            <Malinha humor="dormindo" tamanho={120} />
            <Text className="font-display text-[24px] text-texto">Nenhum trajeto ainda</Text>
            <Text className="text-center font-body text-[15px] leading-6 text-corpo">Voos, carros e trens que o comboio cadastrar aparecem aqui.</Text>
          </View>
        ) : (
          lista.map((t) => <Passagem key={t.id} trajeto={t} destinos={destinos} />)
        )}
      </ScrollView>
    </View>
  )
}

function Passagem({ trajeto: t, destinos }: { trajeto: Trajeto; destinos: Destino[] }) {
  const { nome, Icone } = MEIOS[t.meio] ?? MEIOS.outro
  const origem = destinos.find((d) => d.id === t.origem_id)?.nome ?? 'Origem'
  const chegada = destinos.find((d) => d.id === t.destino_id)?.nome ?? 'Destino'
  const duracao = t.partida && t.chegada ? Math.round((new Date(t.chegada).getTime() - new Date(t.partida).getTime()) / 60000) : null
  const subtitulo = [t.partida ? diaCurto(new Date(t.partida)) : null, duracao && duracao > 0 ? `${Math.floor(duracao / 60)}h${String(duracao % 60).padStart(2, '0')}` : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <Cartao className="gap-4 p-5">
      <View className="flex-row items-center gap-2.5">
        <IconeQuadrado tamanho={36}>
          <Icone size={19} color={cor.couro} />
        </IconeQuadrado>
        <View className="flex-1">
          <Text className="font-body-bold text-[14px] text-texto">{t.observacao || nome}</Text>
          {subtitulo ? <Text className="font-body text-[12.5px] text-suave">{subtitulo}</Text> : null}
        </View>
        {t.link_reserva ? (
          <View className="rounded-lg bg-verde-fundo px-2.5 py-1">
            <Text className="font-body-bold text-[12px] text-verde">Reservado</Text>
          </View>
        ) : null}
        {t.bate_e_volta ? (
          <View className="rounded-lg bg-chip px-2.5 py-1">
            <Text className="font-body-bold text-[12px] text-couro">Bate e volta</Text>
          </View>
        ) : null}
      </View>
      <View className="flex-row items-center gap-3">
        <View className="max-w-[38%]">
          <Text className="font-display text-[22px] text-texto" numberOfLines={1}>
            {origem}
          </Text>
          <Text className="font-body text-[12.5px] text-suave">{hora(t.partida)}</Text>
        </View>
        <View className="flex-1 flex-row items-center gap-1.5">
          <View className="flex-1 border-t-[1.5px] border-dashed border-tracejado" />
          <Icone size={18} color={cor.caramelo} />
          <View className="flex-1 border-t-[1.5px] border-dashed border-tracejado" />
        </View>
        <View className="max-w-[38%] items-end">
          <Text className="font-display text-[22px] text-texto" numberOfLines={1}>
            {chegada}
          </Text>
          <Text className="font-body text-[12.5px] text-suave">{hora(t.chegada)}</Text>
        </View>
      </View>
    </Cartao>
  )
}

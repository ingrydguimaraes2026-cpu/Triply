import { useState } from 'react'
import { Linking, Pressable, Text, View } from 'react-native'
import { Bus, Car, CircleCheck, FileText, MapPin, Plane, Ticket, TrainFront } from './icones'
import type { ItemDoPlano, Movimento } from '@together/core'
import { BotaoIr } from './BotaoIr'
import { abrirDoCofre } from './Cofre'
import { cor, sombra } from '../../theme'

// Spec 120a: as reservas do grupo no "Hoje" com cara de bilhete (inspiração: boarding-pass-stack,
// docs/design/REFERENCIAS-PASSAPORTE.md). Picote tracejado com dois recortes redondos nas pontas.
const ICONE_DO_MEIO = { aviao: Plane, onibus: Bus, carro: Car, trem: TrainFront } as Record<string, typeof Plane>

export function BilheteDoTrajeto({ m, caminhoNoCofre }: { m: Movimento; caminhoNoCofre: string | null }) {
  const Icone = ICONE_DO_MEIO[m.meio] ?? Ticket
  const chega = m.tipo === 'chega'
  const temReserva = !!caminhoNoCofre || !!m.linkReserva
  const [abrindo, setAbrindo] = useState(false)

  async function verReserva() {
    if (caminhoNoCofre) {
      setAbrindo(true)
      const abriu = await abrirDoCofre(caminhoNoCofre)
      setAbrindo(false)
      if (abriu) return
    }
    if (m.linkReserva) Linking.openURL(m.linkReserva)
  }

  return (
    <View className="overflow-hidden rounded-2xl bg-cartao" style={sombra.cartao}>
      <View className="flex-row items-center gap-3 px-4 pb-3 pt-4">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-chip">
          <Icone size={19} color={cor.couro} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className={`font-body-bold text-[11px] uppercase tracking-wider ${chega ? 'text-caramelo' : 'text-suave'}`}>{chega ? 'Chega hoje' : 'Sai hoje'}</Text>
          <Text className="font-body-bold text-[15px] text-texto" numberOfLines={1}>
            {m.de} → {m.para}
          </Text>
        </View>
        <Text className="font-display text-[26px] text-texto">{m.hora}</Text>
      </View>

      {/* Picote do bilhete */}
      <View className="h-4 flex-row items-center">
        <View className="-ml-2 h-4 w-4 rounded-full bg-fundo" />
        <View className="mx-1 flex-1 border-t border-dashed border-tracejado" />
        <View className="-mr-2 h-4 w-4 rounded-full bg-fundo" />
      </View>

      <View className="flex-row items-center gap-3 px-4 pb-4 pt-2">
        <View className="min-w-0 flex-1">
          <Text className="font-body text-[12px] text-suave">
            {[m.saiAs ? `sai ${m.saiAs}` : null, m.chegaAs ? `chega ${m.chegaAs}` : null].filter(Boolean).join(' · ')}
          </Text>
          <Text className="font-body-semibold text-[13px] text-corpo" numberOfLines={2}>
            {m.pessoas.length ? m.pessoas.join(', ') : 'O comboio inteiro'}
          </Text>
        </View>
        {temReserva ? (
          <Pressable onPress={verReserva} className="flex-row items-center gap-1.5 rounded-xl bg-chip px-3 py-2 active:opacity-80" accessibilityLabel="Ver a reserva">
            <FileText size={15} color={cor.couro} />
            <Text className="font-body-bold text-[13px] text-couro">{abrindo ? 'Abrindo…' : 'Ver reserva'}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

// Um lugar ou compromisso do plano do dia, com "Ir" e "Cheguei"
export function ItemDoPlanoDoDia({ item, chegou, aoChegar, podeChegar }: { item: ItemDoPlano; chegou: boolean; aoChegar: () => void; podeChegar: boolean }) {
  return (
    <View className="gap-2 border-t border-linha pt-3">
      <View className="flex-row gap-3">
        <Text className="w-12 font-body-semibold text-[13px] text-suave">{item.hora || '—'}</Text>
        <View className="min-w-0 flex-1">
          <Text className="font-body-bold text-[15px] text-texto">{item.titulo}</Text>
          {item.detalhe ? <Text className="font-body text-[12px] text-suave">{item.detalhe}</Text> : null}
        </View>
      </View>
      <View className="ml-[60px] flex-row flex-wrap items-center gap-2">
        <BotaoIr alvo={item.alvo} corrida={false} />
        {chegou ? (
          <View className="flex-row items-center gap-1.5 px-1 py-2">
            <CircleCheck size={15} color={cor.verde} />
            <Text className="font-body-bold text-[13px] text-verde">Chegamos</Text>
          </View>
        ) : podeChegar ? (
          <Pressable onPress={aoChegar} className="flex-row items-center gap-1.5 rounded-xl bg-couro px-3 py-2 active:opacity-80" accessibilityLabel={`Cheguei em ${item.titulo}`}>
            <MapPin size={15} color="#FFFFFF" />
            <Text className="font-body-bold text-[13px] text-white">Cheguei</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

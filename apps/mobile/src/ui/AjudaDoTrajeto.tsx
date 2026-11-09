import { useEffect, useState } from 'react'
import { Linking, Pressable, Text, View } from 'react-native'
import {
  REFERENCIA_DOS_PRECOS,
  TEMPOS_ATE_O_EMBARQUE,
  formatarDinheiro,
  horaNoFuso,
  diaNoFuso,
  linkDoCaminho,
  linksDoTrecho,
  transferDividido,
  type Aeroporto,
  type HoraDeSair,
} from '@together/core'
import { lerGuardado, guardar } from '../lib/guardado'
import { Clock, Navigation, Users } from './icones'
import { cor } from '../../theme'

// Spec 121 (etapa 1): os pedaços que fazem o Transportes e o "Hoje" ajudarem.
// O tempo até o embarque que a pessoa escolhe fica só no aparelho (sem banco na 1ª versão).
const CHAVE = 'tempos_ate_embarque'

// 30 → "30 min", 90 → "1h30", 180 → "3 h"
function duracao(m: number) {
  if (m < 60) return `${m} min`
  return m % 60 ? `${Math.floor(m / 60)}h${String(m % 60).padStart(2, '0')}` : `${m / 60} h`
}

export function useTemposAteOEmbarque() {
  const [tempos, setTempos] = useState<Record<string, number>>({})
  useEffect(() => {
    void lerGuardado<Record<string, number>>(CHAVE).then((t) => t && setTempos(t))
  }, [])
  function escolher(trajetoId: string, minutos: number) {
    const novo = { ...tempos, [trajetoId]: minutos }
    setTempos(novo)
    void guardar(CHAVE, novo)
  }
  return { tempos, escolher }
}

// "Saia da casa às 05:35" (ou as opções de tempo, quando a tabela não sabe)
export function SaiaAs({ saida, partida, aoEscolher }: { saida: HoraDeSair | null; partida: string; aoEscolher: (minutos: number) => void }) {
  const [trocando, setTrocando] = useState(false)
  if (saida && !trocando) {
    const outroDia = diaNoFuso(saida.instante) !== diaNoFuso(partida)
    return (
      <View className="flex-row items-center gap-2 rounded-xl bg-chip px-3 py-2.5">
        <Clock size={16} color={cor.couro} />
        <Text className="min-w-0 flex-1 font-body text-[13px] text-corpo">
          Saia da casa às <Text className="font-body-bold text-texto">{horaNoFuso(saida.instante)}</Text>
          {outroDia ? ' do dia anterior' : ''}
          <Text className="text-suave">
            {' '}
            · {duracao(saida.antecedencia)} de antecedência + {duracao(saida.ateOEmbarque)} até lá
          </Text>
        </Text>
        <Pressable onPress={() => setTrocando(true)} hitSlop={8} accessibilityLabel="Mudar o tempo até o embarque">
          <Text className="font-body-bold text-[12px] text-couro">Mudar</Text>
        </Pressable>
      </View>
    )
  }
  return (
    <View className="gap-2">
      <Text className="font-body text-[13px] text-corpo">Quanto tempo da casa até o embarque? O app calcula a hora de sair.</Text>
      <View className="flex-row flex-wrap gap-2">
        {TEMPOS_ATE_O_EMBARQUE.map((m) => (
          <Pressable
            key={m}
            onPress={() => {
              aoEscolher(m)
              setTrocando(false)
            }}
            className="rounded-xl border border-borda bg-cartao px-3 py-2 active:opacity-80"
          >
            <Text className="font-body-bold text-[13px] text-texto">{duracao(m)}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

// "Do aeroporto até a casa": os jeitos da tabela + "Ver no mapa"
export function DoAeroporto({ aeroporto, ate, nomeDaCasa }: { aeroporto: Aeroporto; ate: string; nomeDaCasa: string | null }) {
  return (
    <View className="gap-2 rounded-xl border border-borda px-3 py-3">
      <Text className="font-body-bold text-[13px] text-texto">
        De {aeroporto.nome} ({aeroporto.codigo}) até {nomeDaCasa ?? 'o centro'}
      </Text>
      {aeroporto.jeitos.map((x) => (
        <View key={x.nome} className="flex-row items-center justify-between gap-3">
          <Text className="min-w-0 flex-1 font-body text-[13px] text-corpo">{x.nome}</Text>
          <Text className="font-body text-[12.5px] text-suave">
            {x.minutos} min · ~{formatarDinheiro(x.preco, x.moeda)}
          </Text>
        </View>
      ))}
      <Text className="font-body text-[11px] text-suave">Preço aproximado ({REFERENCIA_DOS_PRECOS}). Confira antes.</Text>
      <BotaoLink titulo="Ver no mapa" url={linkDoCaminho(`${aeroporto.nome} ${aeroporto.codigo}`, ate)} />
    </View>
  )
}

// "Bia chega 40 min depois: dividam o táxi (~€27,50 cada)"
export function DividirTransfer({ nomes, minutos, aeroporto, pessoas }: { nomes: string[]; minutos: number; aeroporto: Aeroporto | null; pessoas: number }) {
  const parte = transferDividido(aeroporto, pessoas)
  const quando = minutos === 0 ? 'no mesmo horário' : `${Math.abs(minutos)} min ${minutos > 0 ? 'depois' : 'antes'}`
  return (
    <View className="flex-row items-center gap-2 rounded-xl bg-chip px-3 py-2.5">
      <Users size={16} color={cor.couro} />
      <Text className="min-w-0 flex-1 font-body text-[13px] text-corpo">
        <Text className="font-body-bold text-texto">{nomes.join(', ')}</Text> {nomes.length > 1 ? 'chegam' : 'chega'} {quando}
        {aeroporto ? ` em ${aeroporto.codigo}` : ''}. Dá pra ir junto{parte ? ` e dividir o carro: ~${formatarDinheiro(parte.preco, parte.moeda)} cada` : ''}.
      </Text>
    </View>
  )
}

// Trecho do roteiro sem trajeto: botões pra descobrir como ir
export function ComoIrNoTrecho({ de, para, data }: { de: string; para: string; data: string | null }) {
  return (
    <View className="gap-2.5 rounded-2xl border border-dashed border-tracejado px-4 py-3.5">
      <Text className="font-body-bold text-[14px] text-texto">
        {de} → {para}
      </Text>
      <Text className="font-body text-[12.5px] text-suave">Ainda sem trajeto. Veja como dá pra ir:</Text>
      <View className="flex-row flex-wrap gap-2">
        {linksDoTrecho(de, para, data).map((l) => (
          <BotaoLink key={l.chave} titulo={l.nome} url={l.url} />
        ))}
      </View>
    </View>
  )
}

function BotaoLink({ titulo, url }: { titulo: string; url: string }) {
  return (
    <Pressable onPress={() => Linking.openURL(url)} className="flex-row items-center gap-1.5 self-start rounded-xl bg-chip px-3 py-2 active:opacity-80">
      <Navigation size={14} color={cor.couro} />
      <Text className="font-body-bold text-[13px] text-couro">{titulo}</Text>
    </Pressable>
  )
}

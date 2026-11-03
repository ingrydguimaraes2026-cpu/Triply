import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated'
import { Selo } from '../Selos'
import type { Passo } from '../PassosDaViagem'
import { guardar, lerGuardado } from '../../lib/guardado'
import { duracao, mola, tum, useReducedMotion } from '../movimento'

// Passaporte do comboio (spec 117): os 6 selos, apagados até serem conquistados.
// Selo conquistado desde a última visita cai girando no lugar, com um "tum".
// `aoCarimbar` avisa a tela do primeiro selo novo (pra comemoração da Norti).
export function Passaporte({ viagemId, passos, aoCarimbar }: { viagemId: string; passos: Passo[]; aoCarimbar?: (p: Passo) => void }) {
  const chave = `tripwave.carimbos.${viagemId}`
  const feitos = passos.filter((p) => p.feito).map((p) => p.chave)
  const [vistos, setVistos] = useState<string[] | null>(null)

  useEffect(() => {
    let vivo = true
    void lerGuardado<string[]>(chave).then((lista) => {
      if (!vivo) return
      // Primeira vez nesta viagem: o que já estava feito não comemora (só cai na tela)
      setVistos(lista ?? [])
      const novos = feitos.filter((c) => !(lista ?? []).includes(c))
      if (novos.length) {
        void guardar(chave, feitos)
        const novo = passos.find((p) => p.chave === novos[0])
        if (lista && novo) aoCarimbar?.(novo)
      }
    })
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, feitos.join(',')])

  const novos = vistos ? feitos.filter((c) => !vistos.includes(c)) : []

  return (
    <View>
      <View className="mb-3 flex-row items-baseline justify-between">
        <Text className="font-display text-[20px] text-texto">Passaporte do comboio</Text>
        <Text className="font-body-bold text-[13px] text-caramelo">
          {feitos.length} de {passos.length}
        </Text>
      </View>
      <View className="flex-row justify-between rounded-2xl border-[1.5px] border-dashed border-tracejado bg-cartao px-2 py-3.5">
        {passos.map((p, i) => (
          <Carimbo key={p.chave} passo={p} pronto={vistos !== null} novo={novos.includes(p.chave)} ordem={novos.indexOf(p.chave)} inclinacao={i % 2 ? 5 : -6} />
        ))}
      </View>
    </View>
  )
}

function Carimbo({ passo, pronto, novo, ordem, inclinacao }: { passo: Passo; pronto: boolean; novo: boolean; ordem: number; inclinacao: number }) {
  const reduzir = useReducedMotion()
  // 0 = no ar (grande e girado), 1 = carimbado
  const p = useSharedValue(0)

  useEffect(() => {
    if (!pronto) return
    if (!novo) {
      p.value = 1
      return
    }
    const atraso = 350 + ordem * 260
    p.value = reduzir ? withDelay(atraso, withTiming(1, { duration: duracao.media })) : withDelay(atraso, withSpring(1, mola.firme))
    const t = setTimeout(() => tum(), atraso + 120)
    return () => clearTimeout(t)
  }, [pronto, novo, ordem, reduzir, p])

  const estilo = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.value),
    transform: reduzir
      ? [{ rotate: `${inclinacao}deg` }]
      : [{ scale: 1 + (1 - p.value) * 1.4 }, { rotate: `${inclinacao - (1 - p.value) * 30}deg` }],
  }))

  return (
    <View className="flex-1 items-center gap-1" accessibilityLabel={`${passo.rotulo}: ${passo.feito ? 'conquistado' : 'falta'}`}>
      <View className="h-11 w-11 items-center justify-center">
        {passo.feito ? (
          <Animated.View style={estilo}>
            <Selo nome={passo.selo} tamanho={40} />
          </Animated.View>
        ) : (
          <View style={{ opacity: 0.28, transform: [{ rotate: `${inclinacao}deg` }] }}>
            <Selo nome={passo.selo} tamanho={40} />
          </View>
        )}
      </View>
      <Text className={`font-body-semibold text-[10px] ${passo.feito ? 'text-texto' : 'text-apagado'}`}>{passo.rotulo}</Text>
    </View>
  )
}

import { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated'
import { Selo } from '../Selos'
import type { Passo } from '../PassosDaViagem'
import { guardar, lerGuardado } from '../../lib/guardado'
import { mola, tum, useReducedMotion } from '../movimento'
import { cor, fonte, rotulo, sombra, trabalho } from '../../../theme'

// Aba Viagem (caminho B, regra "um próximo passo só"): a faixa do próximo passo no pé e o
// passaporte da galera no meio da tela, separados (antes eram um cartão só).

const BOTAO: Record<Passo['chave'], string> = {
  roteiro: 'Descobrir',
  galera: 'Chamar',
  datas: 'Definir',
  hospedagem: 'Ver opções',
  transporte: 'Adicionar',
  gastos: 'Lançar',
}

// Faixa do próximo passo (referência: Wanderlog, 10/11): fica fixa no pé da aba Viagem, logo acima
// da barra, sempre no mesmo lugar. Uma coisa só pra fazer agora, escura pra se destacar do creme.
export function FaixaDoProximoPasso({ proximo, aoAbrir, baixo }: { proximo: Passo | null; aoAbrir: () => void; baixo: number }) {
  if (!proximo) return null
  return (
    <Pressable
      onPress={aoAbrir}
      accessibilityRole="button"
      accessibilityLabel={`Próximo passo: ${proximo.titulo}`}
      className="absolute flex-row items-center gap-2.5 rounded-[20px] py-2.5 pl-3 pr-2.5 active:opacity-90"
      style={[{ left: 10, right: 10, bottom: baixo, backgroundColor: cor.escuro }, sombra.cartao]}
    >
      <View style={{ transform: [{ rotate: '-8deg' }] }}>
        <Selo nome={proximo.selo} tamanho={34} tom="escuro" />
      </View>
      <View className="flex-1">
        <Text style={[rotulo, { fontSize: 9.5, color: cor.dourado }]}>Próximo passo</Text>
        <Text numberOfLines={1} style={{ fontFamily: fonte.titulo, fontSize: 15, letterSpacing: -0.25, color: cor.creme, marginTop: 1 }}>
          {proximo.titulo}
        </Text>
        <Text numberOfLines={1} style={{ fontFamily: fonte.corpoMedio, fontSize: 11.5, color: 'rgba(245,233,214,0.7)', marginTop: 1 }}>
          {proximo.sub}
        </Text>
      </View>
      <View className="h-9 items-center justify-center rounded-full px-3.5" style={{ backgroundColor: cor.dourado }}>
        <Text style={{ fontFamily: fonte.item, fontSize: 13, color: cor.texto }}>{BOTAO[proximo.chave]}</Text>
      </View>
    </Pressable>
  )
}

// Passaporte da galera (spec 118): os selos dos passos, os feitos acesos e os que faltam apagados,
// com o contador (referências: Antigone "1/112", been "3/195"). Resolveu um passo: o selo cai e a tela comemora.
export function PassaporteDaGalera({ viagemId, passos, aoCarimbar }: { viagemId: string; passos: Passo[]; aoCarimbar?: (p: Passo) => void }) {
  const novos = useSelosNovos(viagemId, passos, aoCarimbar)
  const feitos = passos.filter((p) => p.feito).length
  return (
    <View
      className="mx-3.5 rounded-[20px] border px-3.5 py-3"
      style={[{ backgroundColor: cor.areia, borderColor: trabalho.linha }]}
      accessibilityLabel={`Passaporte da galera: ${feitos} de ${passos.length} carimbos`}
    >
      <View className="flex-row items-baseline justify-between">
        <Text style={[rotulo, { color: cor.caramelo }]}>Passaporte da galera</Text>
        <Text style={{ fontFamily: fonte.titulo, fontSize: 15, letterSpacing: -0.3, color: trabalho.texto }}>
          {feitos}/{passos.length}
        </Text>
      </View>
      <View className="mt-2.5 flex-row flex-wrap gap-2">
        {passos.map((p, i) => (
          <SeloPequeno key={p.chave} passo={p} novo={novos.includes(p.chave)} ordem={novos.indexOf(p.chave)} inclinacao={i % 2 ? 5 : -6} />
        ))}
      </View>
    </View>
  )
}

// Quais selos foram conquistados desde a última visita (guardado no aparelho).
// Na primeira vez nesta viagem nada comemora: o que já estava feito só aparece aceso.
function useSelosNovos(viagemId: string, passos: Passo[], aoCarimbar?: (p: Passo) => void) {
  const chave = `tripwave.carimbos.${viagemId}`
  const feitos = passos.filter((p) => p.feito).map((p) => p.chave)
  const [vistos, setVistos] = useState<string[] | null>(null)
  useEffect(() => {
    let vivo = true
    void lerGuardado<string[]>(chave).then((lista) => {
      if (!vivo) return
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
  return vistos ? feitos.filter((c) => !vistos.includes(c)) : []
}

function SeloPequeno({ passo, novo, ordem, inclinacao }: { passo: Passo; novo: boolean; ordem: number; inclinacao: number }) {
  const reduzir = useReducedMotion()
  const p = useSharedValue(novo && !reduzir ? 0 : 1)
  useEffect(() => {
    if (!novo || reduzir) return
    const atraso = 450 + ordem * 260
    p.value = withDelay(atraso, withSpring(1, mola.firme))
    const t = setTimeout(() => tum(), atraso + 120)
    return () => clearTimeout(t)
  }, [novo, ordem, reduzir, p])
  const estilo = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.value),
    transform: [{ scale: 1 + (1 - p.value) * 1.6 }, { rotate: `${inclinacao - (1 - p.value) * 30}deg` }],
  }))
  if (!passo.feito)
    return (
      <View style={{ opacity: 0.25, transform: [{ rotate: `${inclinacao}deg` }] }}>
        <Selo nome={passo.selo} tamanho={34} />
      </View>
    )
  return (
    <Animated.View style={estilo}>
      <Selo nome={passo.selo} tamanho={34} />
    </Animated.View>
  )
}

import { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated'
import { Selo } from '../Selos'
import type { Passo } from '../PassosDaViagem'
import { guardar, lerGuardado } from '../../lib/guardado'
import { mola, tum, useReducedMotion } from '../movimento'
import { cor, fonte, rotulo, sombra, trabalho } from '../../../theme'

// "Próximo passo" (caminho B, regra "um próximo passo só"): junta o antigo Próximo carimbo
// e o Passaporte num cartão só. Em cima, a única coisa pra fazer agora; embaixo, os selos
// do passaporte da galera (os feitos acesos). Resolveu um passo: o selo cai e a tela comemora.
type Props = {
  viagemId: string
  passos: Passo[]
  proximo: Passo | null
  aoAbrir: () => void
  aoCarimbar?: (p: Passo) => void
}

const BOTAO: Record<Passo['chave'], string> = {
  roteiro: 'Descobrir',
  galera: 'Chamar',
  datas: 'Definir',
  hospedagem: 'Ver opções',
  transporte: 'Adicionar',
  gastos: 'Lançar',
}

export function ProximoPasso({ viagemId, passos, proximo, aoAbrir, aoCarimbar }: Props) {
  const novos = useSelosNovos(viagemId, passos, aoCarimbar)
  const feitos = passos.filter((p) => p.feito).length

  return (
    <View className="mx-3.5 rounded-[20px] border" style={[{ backgroundColor: trabalho.superficie, borderColor: trabalho.linha }, sombra.cartao]}>
      {proximo ? (
        <Pressable onPress={aoAbrir} accessibilityRole="button" accessibilityLabel={`Próximo passo: ${proximo.titulo}`} className="flex-row items-center gap-3 p-3.5 active:opacity-80">
          <View style={{ transform: [{ rotate: '-8deg' }] }}>
            <Selo nome={proximo.selo} tamanho={44} />
          </View>
          <View className="flex-1">
            <Text style={[rotulo, { color: cor.caramelo }]}>Próximo passo</Text>
            <Text style={{ fontFamily: fonte.titulo, fontSize: 18, lineHeight: 20, letterSpacing: -0.4, color: trabalho.texto, marginTop: 3 }}>{proximo.titulo}</Text>
            <Text style={{ fontFamily: fonte.corpo, fontSize: 12.5, color: trabalho.texto2, marginTop: 3 }}>{proximo.sub}</Text>
          </View>
          <View className="h-[38px] items-center justify-center rounded-full px-3.5" style={{ backgroundColor: trabalho.acento }}>
            <Text style={{ fontFamily: fonte.item, fontSize: 13, color: trabalho.acentoTexto }}>{BOTAO[proximo.chave]}</Text>
          </View>
        </Pressable>
      ) : (
        <View className="p-3.5">
          <Text style={[rotulo, { color: cor.caramelo }]}>Tudo pronto</Text>
          <Text style={{ fontFamily: fonte.titulo, fontSize: 18, letterSpacing: -0.4, color: trabalho.texto, marginTop: 3 }}>Passaporte completo. Boa viagem!</Text>
        </View>
      )}

      {/* Passaporte da galera, dentro do mesmo cartão */}
      <View className="flex-row items-center gap-2 border-t px-3.5 py-2.5" style={{ borderColor: trabalho.linha }} accessibilityLabel={`Passaporte da galera: ${feitos} de ${passos.length}`}>
        <View className="flex-1 flex-row gap-1.5">
          {passos.map((p, i) => (
            <SeloPequeno key={p.chave} passo={p} novo={novos.includes(p.chave)} ordem={novos.indexOf(p.chave)} inclinacao={i % 2 ? 5 : -6} />
          ))}
        </View>
        <Text style={{ fontFamily: fonte.corpoForte, fontSize: 11.5, color: trabalho.texto2 }}>
          Passaporte {feitos} de {passos.length}
        </Text>
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
        <Selo nome={passo.selo} tamanho={24} />
      </View>
    )
  return (
    <Animated.View style={estilo}>
      <Selo nome={passo.selo} tamanho={24} />
    </Animated.View>
  )
}

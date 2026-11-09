import { useState } from 'react'
import { Image, Pressable, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { formatarDinheiro, votarNaHospedagem, type Opcao, type Pessoa } from '@together/core'
import { Check, ChevronRight, Megaphone } from '../icones'
import { Selo } from '../Selos'
import type { Passo } from '../PassosDaViagem'
import { mola, tum, useNumeroAnimado, useReducedMotion } from '../movimento'
import { supabase } from '../../lib/supabase'
import { compartilharTexto, linkDaViagem } from '../../lib/compartilhar'
import { primeiroNome } from '../../lib/formato'
import { cor, sombra } from '../../../theme'

// "Próximo carimbo" (spec 117): a decisão aberta mais importante, grande, em destaque.
// Onde dormir com 2 ou mais opções vira um duelo de fotos com votos e "Cutucar" quem falta.
type Props = {
  passo: Passo
  viagem: { id: string; nome: string; moeda: string; membros: Pessoa[] }
  opcoes: Opcao[]
  meuId: string
  aoAbrir: () => void
  aoMudar: () => void
}

export function ProximoCarimbo({ passo, viagem, opcoes, meuId, aoAbrir, aoMudar }: Props) {
  const emDuelo = passo.chave === 'hospedagem' ? duelo(opcoes) : null
  return (
    <View className="rounded-3xl border-[1.5px] bg-cartao p-4" style={[{ borderColor: cor.dourado }, sombra.cartao]}>
      <Pressable onPress={aoAbrir} className="flex-row items-start justify-between active:opacity-80">
        <View className="flex-1">
          <Text className="font-body-bold text-[11px] uppercase tracking-widest text-caramelo">Próximo carimbo</Text>
          <Text className="mt-1 font-display text-[22px] leading-[26px] text-texto">{passo.titulo}</Text>
          {!emDuelo ? <Text className="mt-1 font-body text-[14px] text-corpo">{passo.sub}</Text> : null}
        </View>
        <View style={{ transform: [{ rotate: '-8deg' }] }}>
          <Selo nome={passo.selo} tamanho={48} />
        </View>
      </Pressable>
      {emDuelo ? (
        <Duelo opcoes={emDuelo} viagem={viagem} meuId={meuId} aoMudar={aoMudar} />
      ) : (
        <Pressable onPress={aoAbrir} className="mt-4 h-12 flex-row items-center justify-center gap-1.5 rounded-2xl bg-couro active:opacity-90" style={sombra.botao}>
          <Text className="font-body-bold text-[15px] text-white">{textoDoBotao(passo)}</Text>
          <ChevronRight size={18} color="#fff" />
        </Pressable>
      )}
    </View>
  )
}

function textoDoBotao(p: Passo) {
  const textos: Record<Passo['chave'], string> = {
    roteiro: 'Começar a deslizar',
    galera: 'Chamar a galera',
    datas: 'Definir as datas',
    hospedagem: 'Juntar opções',
    transporte: 'Lançar como chegar',
    gastos: 'Lançar o primeiro gasto',
  }
  return textos[p.chave]
}

// As 2 opções mais votadas do mesmo destino, se ninguém escolheu ainda
function duelo(opcoes: Opcao[]): [Opcao, Opcao] | null {
  const abertas = opcoes.filter((o) => !opcoes.some((x) => x.escolhida && x.destinoId === o.destinoId))
  const destino = abertas[0]?.destinoId
  const doDestino = abertas.filter((o) => o.destinoId === destino).sort((a, b) => b.votos.length - a.votos.length)
  return doDestino.length >= 2 ? [doDestino[0], doDestino[1]] : null
}

function Duelo({ opcoes, viagem, meuId, aoMudar }: { opcoes: [Opcao, Opcao]; viagem: Props['viagem']; meuId: string; aoMudar: () => void }) {
  // Voto otimista: a barra anda na hora, o banco confirma depois
  const [meusVotos, setMeusVotos] = useState(() => Object.fromEntries(opcoes.map((o) => [o.id, o.votos.includes(meuId)])))
  const [cutucou, setCutucou] = useState(false)
  const votos = opcoes.map((o) => o.votos.filter((v) => v !== meuId).length + (meusVotos[o.id] ? 1 : 0))
  const maior = Math.max(1, ...votos)
  const votaram = new Set(opcoes.flatMap((o) => o.votos.filter((v) => v !== meuId)))
  if (Object.values(meusVotos).some(Boolean)) votaram.add(meuId)
  const faltam = viagem.membros.filter((m) => !votaram.has(m.id))

  async function votar(o: Opcao) {
    const sim = !meusVotos[o.id]
    tum()
    setMeusVotos((a) => ({ ...a, [o.id]: sim }))
    try {
      await votarNaHospedagem(supabase, o.id, meuId, sim)
      aoMudar()
    } catch {
      setMeusVotos((a) => ({ ...a, [o.id]: !sim }))
    }
  }

  async function cutucar() {
    const nomes = faltam.filter((m) => m.id !== meuId).map((m) => primeiroNome(m.nome))
    const texto = `${nomes.length ? nomes.join(' e ') + ', falta' : 'Falta'} você votar onde a gente dorme em ${viagem.nome}! ${linkDaViagem(viagem.id)}`
    if (await compartilharTexto(texto)) setCutucou(true)
  }

  return (
    <View className="mt-3 gap-3">
      <View className="flex-row gap-2.5">
        {opcoes.map((o, i) => (
          <LadoDoDuelo key={o.id} opcao={o} votos={votos[i]} fracao={votos[i] / maior} votei={!!meusVotos[o.id]} moeda={viagem.moeda} aoVotar={() => votar(o)} />
        ))}
      </View>
      <View className="flex-row items-center justify-between gap-2">
        <Text className="flex-1 font-body text-[13px] text-suave" numberOfLines={1}>
          {faltam.length === 0 ? 'Todo mundo votou' : `faltam ${faltam.map((m) => (m.id === meuId ? 'você' : primeiroNome(m.nome))).join(', ').replace(/, ([^,]*)$/, ' e $1')}`}
        </Text>
        {faltam.some((m) => m.id !== meuId) ? (
          <Pressable onPress={cutucar} className="h-9 flex-row items-center gap-1.5 rounded-full border border-tracejado px-3.5 active:opacity-80">
            {cutucou ? <Check size={16} color={cor.verde} /> : <Megaphone size={16} color={cor.couro} />}
            <Text className="font-body-bold text-[13px] text-couro">{cutucou ? 'Cutucado' : 'Cutucar'}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

function LadoDoDuelo({ opcao, votos, fracao, votei, moeda, aoVotar }: { opcao: Opcao; votos: number; fracao: number; votei: boolean; moeda: string; aoVotar: () => void }) {
  const reduzir = useReducedMotion()
  const mostrado = Math.round(useNumeroAnimado(votos, 400))
  // A barra cresce com mola quando o voto muda (só aparece, se reduzir movimento)
  const barra = useAnimatedStyle(() => ({ transform: [{ scaleX: reduzir ? fracao : withSpring(fracao, mola.padrao) }] }))
  return (
    <Pressable
      onPress={aoVotar}
      className={`flex-1 overflow-hidden rounded-2xl border-[1.5px] active:opacity-90 ${votei ? 'border-caramelo' : 'border-linha'}`}
      accessibilityLabel={`Votar em ${opcao.nome}`}
      accessibilityState={{ selected: votei }}
    >
      {opcao.fotoUrl ? <Image source={{ uri: opcao.fotoUrl }} className="h-24 w-full bg-areia" /> : <View className="h-24 w-full items-center justify-center bg-areia"><Selo nome="barraca" tamanho={40} /></View>}
      <View className="gap-1 p-2.5">
        <Text className="font-body-bold text-[13px] text-texto" numberOfLines={1}>
          {opcao.nome}
        </Text>
        {opcao.precoTotal != null ? <Text className="font-body text-[11px] text-suave">{formatarDinheiro(opcao.precoTotal, opcao.moeda || moeda)} no total</Text> : null}
        <View className="mt-1 h-1.5 overflow-hidden rounded-full bg-areia">
          <Animated.View className="h-full w-full rounded-full bg-caramelo" style={[{ transformOrigin: 'left' }, barra]} />
        </View>
        <Text className="font-body-semibold text-[11px] text-suave">
          {mostrado} {mostrado === 1 ? 'voto' : 'votos'}
          {votei ? ' · seu voto' : ''}
        </Text>
      </View>
    </Pressable>
  )
}

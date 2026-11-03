import type { ReactNode } from 'react'
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { formatarDinheiro, type Atividade, type Pessoa } from '@together/core'
import { ArrowLeft, ChevronRight, FileCheck, MoreHorizontal, Plus, ShieldCheck, Share2 } from '../icones'
import { Selo } from '../Selos'
import { Avatar, BotaoRedondo } from '../pecas'
import { useCascata, useNumeroAnimado } from '../movimento'
import { primeiroNome } from '../../lib/formato'
import type { DiaDoCarrossel } from '../../dados/abaViagem'
import { cor, sombra } from '../../../theme'

// Peças da aba Viagem (spec 117, tela 2 do desenho definitivo)

export const ALTURA_DA_CAPA = 300

// Seção que entra em cascata (cada uma 40 ms depois da anterior)
export function Secao({ indice, titulo, direita, children }: { indice: number; titulo?: string; direita?: ReactNode; children: ReactNode }) {
  const entrada = useCascata(indice)
  return (
    <Animated.View style={entrada}>
      {titulo ? (
        <View className="mb-3 flex-row items-baseline justify-between">
          <Text className="font-display text-[20px] text-texto">{titulo}</Text>
          {direita}
        </View>
      ) : null}
      {children}
    </Animated.View>
  )
}

// Capa com parallax: a foto anda mais devagar que a tela e cresce se puxar pra baixo
export function Capa({ foto, nome, linha, rolagem }: { foto: { uri: string } | undefined; nome: string; linha: string; rolagem: SharedValue<number> }) {
  const estiloDaFoto = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(rolagem.value, [-200, 0, ALTURA_DA_CAPA], [-100, 0, ALTURA_DA_CAPA * 0.45]) },
      { scale: interpolate(rolagem.value, [-200, 0], [1.6, 1], 'clamp') },
    ],
  }))
  const estiloDoTitulo = useAnimatedStyle(() => ({ opacity: interpolate(rolagem.value, [0, ALTURA_DA_CAPA * 0.6], [1, 0], 'clamp') }))
  return (
    <View style={{ height: ALTURA_DA_CAPA }} className="overflow-hidden bg-couro">
      <Animated.View style={[StyleSheet.absoluteFill, estiloDaFoto]}>
        <ImageBackground source={foto} resizeMode="cover" style={StyleSheet.absoluteFill}>
          <LinearGradient colors={['rgba(74,46,20,0.35)', 'rgba(74,46,20,0)', 'rgba(74,46,20,0.85)']} locations={[0, 0.35, 1]} style={StyleSheet.absoluteFill} />
        </ImageBackground>
      </Animated.View>
      <Animated.View className="absolute bottom-6 left-5 right-5" style={estiloDoTitulo}>
        <Text className="font-body-bold text-[12px] uppercase tracking-wider text-creme">{linha}</Text>
        <Text className="mt-1 font-display text-[40px] leading-[42px] text-white" numberOfLines={2}>
          {nome}
        </Text>
      </Animated.View>
    </View>
  )
}

// Cabeçalho fixo: botões sempre à mão; o nome e o fundo creme aparecem quando a capa sai da tela
export function Cabecalho({ nome, rolagem, aoVoltar, aoCompartilhar, aoMais }: { nome: string; rolagem: SharedValue<number>; aoVoltar: () => void; aoCompartilhar: () => void; aoMais: () => void }) {
  const insets = useSafeAreaInsets()
  const fundo = useAnimatedStyle(() => ({ opacity: interpolate(rolagem.value, [ALTURA_DA_CAPA * 0.55, ALTURA_DA_CAPA * 0.8], [0, 1], 'clamp') }))
  const titulo = useAnimatedStyle(() => ({
    opacity: interpolate(rolagem.value, [ALTURA_DA_CAPA * 0.65, ALTURA_DA_CAPA * 0.85], [0, 1], 'clamp'),
    transform: [{ translateY: interpolate(rolagem.value, [ALTURA_DA_CAPA * 0.65, ALTURA_DA_CAPA * 0.85], [8, 0], 'clamp') }],
  }))
  return (
    <View className="absolute left-0 right-0 top-0" style={{ paddingTop: insets.top + 6 }} pointerEvents="box-none">
      <Animated.View className="absolute inset-0 border-b border-linha bg-fundo" style={fundo} />
      <View className="flex-row items-center gap-3 px-4 pb-2">
        <BotaoRedondo claro aoTocar={aoVoltar}>
          <ArrowLeft size={20} color={cor.texto} />
        </BotaoRedondo>
        <Animated.Text style={titulo} className="flex-1 font-display text-[20px] text-texto" numberOfLines={1}>
          {nome}
        </Animated.Text>
        <BotaoRedondo claro aoTocar={aoCompartilhar}>
          <Share2 size={20} color={cor.texto} />
        </BotaoRedondo>
        {/* "Tudo da viagem": o que saiu da tela principal continua a 2 toques */}
        <BotaoRedondo claro aoTocar={aoMais}>
          <MoreHorizontal size={20} color={cor.texto} />
        </BotaoRedondo>
      </View>
    </View>
  )
}

// Rostos do comboio como stories: anel dourado = fez algo que você ainda não viu
export function Rostos({ membros, atividades, vistoEm, meuId, aoTocar, aoConvidar }: { membros: Pessoa[]; atividades: Atividade[]; vistoEm: string | null; meuId: string; aoTocar: () => void; aoConvidar: () => void }) {
  const comNovidade = new Set(atividades.filter((a) => a.autor && a.autor !== meuId && (!vistoEm || a.criado_em > vistoEm)).map((a) => a.autor))
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingHorizontal: 20 }} style={{ marginHorizontal: -20 }}>
      {membros.map((m, i) => (
        <Pressable key={m.id} onPress={aoTocar} className="items-center gap-1 active:opacity-80" accessibilityLabel={`Ver ${m.nome} no comboio`}>
          <View className="rounded-full p-[3px]" style={{ borderWidth: 2.5, borderColor: comNovidade.has(m.id) ? cor.dourado : 'transparent' }}>
            <Avatar nome={m.nome} indice={i} tamanho={52} />
          </View>
          <Text className="font-body-medium text-[12px] text-corpo" numberOfLines={1}>
            {m.id === meuId ? 'Você' : primeiroNome(m.nome)}
          </Text>
        </Pressable>
      ))}
      <Pressable onPress={aoConvidar} className="items-center gap-1 active:opacity-80" accessibilityLabel="Convidar pro comboio">
        <View className="h-[63px] w-[63px] items-center justify-center rounded-full border-[1.5px] border-dashed border-tracejado">
          <Plus size={22} color={cor.couro} />
        </View>
        <Text className="font-body-medium text-[12px] text-corpo">Convidar</Text>
      </Pressable>
    </ScrollView>
  )
}

// Carrossel dos dias com foto. Sem roteiro montado: um cartão que chama pro deslize.
export function CarrosselDoRoteiro({ dias, aoAbrir, aoMontar }: { dias: DiaDoCarrossel[]; aoAbrir: () => void; aoMontar: () => void }) {
  if (!dias.length) {
    return (
      <Pressable onPress={aoMontar} className="flex-row items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-tracejado p-4 active:opacity-80">
        <Selo nome="mapa" tamanho={40} />
        <View className="flex-1">
          <Text className="font-body-bold text-[15px] text-texto">Ainda sem dias</Text>
          <Text className="font-body text-[13px] text-suave">Deslize os lugares e o app monta</Text>
        </View>
        <ChevronRight size={18} color={cor.apagado} />
      </Pressable>
    )
  }
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 20 }} style={{ marginHorizontal: -20 }}>
      {dias.map((d) => (
        <Pressable key={d.numero} onPress={aoAbrir} className="w-[150px] active:opacity-90">
          {d.foto ? <Image source={{ uri: d.foto }} className="h-[110px] w-[150px] rounded-2xl bg-areia" /> : <View className="h-[110px] w-[150px] items-center justify-center rounded-2xl bg-areia"><Selo nome="caminho" tamanho={40} /></View>}
          <Text className="mt-2 font-body-bold text-[11px] uppercase tracking-wider text-suave">Dia {d.numero}</Text>
          <Text className="font-body-semibold text-[14px] text-texto" numberOfLines={2}>
            {d.titulo}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  )
}

// Contas em uma linha: gasto do grupo e o meu saldo (os números correm até o valor)
export function ResumoDasContas({ total, meuSaldo, moeda, aoAbrir }: { total: number; meuSaldo: number; moeda: string; aoAbrir: () => void }) {
  const t = useNumeroAnimado(total)
  const s = useNumeroAnimado(Math.abs(meuSaldo))
  return (
    <Pressable onPress={aoAbrir} className="flex-row rounded-2xl bg-cartao p-4 active:opacity-90" style={sombra.cartao}>
      <View className="flex-1">
        <Text className="font-body text-[12px] text-suave">Gasto do grupo</Text>
        <Text className="mt-0.5 font-display text-[24px] text-texto">{formatarDinheiro(Math.round(t), moeda)}</Text>
      </View>
      <View className="flex-1 items-end">
        <Text className="font-body text-[12px] text-suave">{meuSaldo > 0 ? 'Você recebe' : meuSaldo < 0 ? 'Você deve' : 'Seu saldo'}</Text>
        <Text className={`mt-0.5 font-display text-[24px] ${meuSaldo > 0 ? 'text-verde' : meuSaldo < 0 ? 'text-vermelho' : 'text-texto'}`}>{formatarDinheiro(Math.round(s), moeda)}</Text>
      </View>
    </Pressable>
  )
}

// Antes de embarcar: passaportes, seguro e o resto da papelada
export function AntesDeEmbarcar({ pessoas, passaportesOk, semSeguro, aoDocumentos }: { pessoas: number; passaportesOk: number; semSeguro: number | null; aoDocumentos: () => void }) {
  const linhas = [
    { Icone: FileCheck, texto: 'Passaportes e vistos', direita: `${passaportesOk} de ${pessoas}`, ok: passaportesOk >= pessoas },
    { Icone: ShieldCheck, texto: 'Seguro viagem', direita: semSeguro == null ? 'cadastrar' : semSeguro === 0 ? 'todos' : `faltam ${semSeguro}`, ok: semSeguro === 0 },
  ]
  return (
    <View className="rounded-2xl bg-cartao px-4" style={sombra.cartao}>
      {linhas.map(({ Icone, texto, direita, ok }, i) => (
        <Pressable key={texto} onPress={aoDocumentos} className={`h-14 flex-row items-center gap-3 active:opacity-80 ${i ? 'border-t border-linha' : ''}`}>
          <Icone size={20} color={cor.couro} />
          <Text className="flex-1 font-body-medium text-[14px] text-texto">{texto}</Text>
          <Text className={`font-body-bold text-[13px] ${ok ? 'text-verde' : 'text-caramelo'}`}>{direita}</Text>
        </Pressable>
      ))}
    </View>
  )
}

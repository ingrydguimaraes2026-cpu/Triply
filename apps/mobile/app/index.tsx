import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { FotoDeFundo } from '../src/ui/Foto'
import { StatusBar } from '../src/ui/StatusBar'
import { LinearGradient } from 'expo-linear-gradient'
import { Redirect, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronRight, History, Locate, Plus, Ticket } from '../src/ui/icones'
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated'
import { buscarMapaDaGalera, lembrancasDeHoje, textoDaLembranca, viagemAcontecendo, type ViagemComDetalhes } from '@together/core'
import { Icone } from '../src/ui/Icone'
import { Selo } from '../src/ui/Selos'
import { MapaDaGalera } from '../src/ui/MapaDaGalera'
import { carregarResumoDoInicio } from '../src/dados/resumoDoInicio'
import { useCarregar } from '../src/dados/useCarregar'
import { mola, useReducedMotion } from '../src/ui/movimento'
import { proximaViagem, useViagemAtual, viagensPassadas } from '../src/dados/viagemAtual'
import { diasAte, hojeIso, periodo, primeiroNome } from '../src/lib/formato'
import { useSessao } from '../src/lib/sessao'
import { supabase } from '../src/lib/supabase'
import { FaixaConvidado } from '../src/ui/FaixaConvidado'
import { useCapas } from '../src/dados/useCapas'
import { Norti } from '../src/ui/Norti'
import { puxarPraAtualizar } from '../src/ui/Puxar'
import { Avatar, Botao, Campo, Carregando, ErroNaTela, PilhaDeAvatares } from '../src/ui/pecas'
import { cor, fonte, titulo, trabalho } from '../theme'

// Spec 120a: num dia de viagem o app abre direto no "Hoje" (a aba Viagem vira o Hoje).
// Só uma vez por abertura do app: voltar pro Início não puxa de novo.
let jaAbriuNaViagem = false

// Início (spec 117, tela 1): sem barra de abas. Próxima viagem com os carimbos,
// o que o comboio fez agora e Nova viagem. O Perfil abre pelo avatar.
export default function MinhasViagens() {
  const { status, viagens, meuId, escolher, recarregar } = useViagemAtual()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { ehConvidado } = useSessao()
  // Puxar pra atualizar: busca as viagens de novo e remonta o cartão e o mapa (que carregam sozinhos)
  const [vezDoInicio, setVezDoInicio] = useState(0)
  const [puxando, setPuxando] = useState(false)
  useEffect(() => setPuxando(false), [viagens, status])
  const atualizar = () => {
    setPuxando(true)
    recarregar()
    setVezDoInicio((v) => v + 1)
  }

  useEffect(() => {
    if (status !== 'pronto' || jaAbriuNaViagem) return
    jaAbriuNaViagem = true
    const agora = viagemAcontecendo(viagens, hojeIso())
    if (!agora) return
    escolher(agora.id)
    router.push(`/viagem/${agora.id}`)
  }, [status, viagens])

  if (status === 'carregando') return <Carregando texto="Arrumando a mala…" />
  if (status === 'erro') return <ErroNaTela aoTentar={recarregar} />

  const eu = viagens.flatMap((v) => v.membros).find((m) => m.id === meuId)
  const ola = eu ? `Olá, ${primeiroNome(eu.nome)}` : 'Olá'
  const hora = new Date().getHours()
  const saudacao = hora < 5 || hora >= 18 ? 'Boa noite' : hora < 12 ? 'Bom dia' : 'Boa tarde'
  const destaque = proximaViagem(viagens)
  const passadas = viagensPassadas(viagens).filter((v) => v.id !== destaque?.id)
  const outras = viagens.filter((v) => v.id !== destaque?.id && !passadas.includes(v))

  const abrir = (v: ViagemComDetalhes) => {
    escolher(v.id)
    router.push(`/viagem/${v.id}`)
  }

  // Spec 116: conta sem nenhuma viagem vai direto montar a primeira (em vez da home vazia)
  if (viagens.length === 0 && !ehConvidado) return <Redirect href="/comecar" />
  if (!destaque) return <Vazio ola={ola} aoCriar={() => router.push('/nova-viagem')} aoEntrar={recarregar} />

  // Caminho B "Embarque" (aprovado pelo Victor em 10/11/2026): fora de uma viagem só existe
  // "Suas viagens", as viagens como bilhetes numa carteira. A próxima fica na frente, inteira;
  // as outras e as antigas (carimbadas) ficam atrás, só com a pontinha aparecendo. Um toque abre.
  // De trás pra frente: antigas (a mais velha no fundo), as outras (a mais longe primeiro) e a próxima na frente
  const pilha = [...[...passadas].reverse(), ...[...outras].reverse(), destaque]

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView refreshControl={puxarPraAtualizar({ atualizando: puxando, recarregar: atualizar })} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }}>
        <View className="flex-row items-center justify-between px-[18px]">
          {/* O Perfil abre pela sua foto */}
          <Pressable onPress={() => router.push('/perfil')} accessibilityRole="button" accessibilityLabel="Abrir o seu perfil" className="active:opacity-80">
            <Avatar nome={eu?.nome ?? 'Eu'} indice={5} tamanho={36} />
          </Pressable>
          {!ehConvidado ? (
            <Pressable
              onPress={() => router.push('/nova-viagem')}
              accessibilityRole="button"
              className="flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 active:opacity-80"
              style={{ backgroundColor: trabalho.superficie, borderColor: trabalho.linha }}
            >
              <Icone nome="mais" tamanho={14} cor={trabalho.texto} />
              <Text style={{ fontFamily: fonte.corpoForte, fontSize: 13, color: trabalho.texto }}>Nova viagem</Text>
            </Pressable>
          ) : null}
        </View>

        <Text style={[titulo(36), { color: trabalho.texto, marginTop: 16, paddingHorizontal: 18 }]}>Suas viagens</Text>
        <Text style={{ fontFamily: fonte.corpoMedio, fontSize: 14, color: trabalho.texto2, marginTop: 6, paddingHorizontal: 18 }}>
          {saudacao}, {eu ? primeiroNome(eu.nome) : 'tudo bem'}. Toque numa viagem pra abrir.
        </Text>

        <View className="px-[18px]">
          <FaixaConvidado />
        </View>

        <Carteira key={vezDoInicio} pilha={pilha} meuId={meuId} aoAbrir={abrir} />

        {/* Atalhos e o mapa da galera ficam embaixo da carteira: o principal é abrir a viagem */}
        {!ehConvidado ? (
          <View className="px-5">
            <AtalhosDoPassaporte />
            <View className="mt-6">
              <MapaDoInicio key={vezDoInicio} meuId={meuId} />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  )
}

// ---------- Carteira de bilhetes ----------
const PONTA = 62 // quanto aparece de cada bilhete de trás
const ALTURA_DA_FOTO = 150

function Carteira({ pilha, meuId, aoAbrir }: { pilha: ViagemComDetalhes[]; meuId: string; aoAbrir: (v: ViagemComDetalhes) => void }) {
  const capa = useCapas(pilha.map((v) => v.id))
  const frente = pilha[pilha.length - 1]
  const carga = useCarregar(() => carregarResumoDoInicio(frente, meuId), [frente.id, meuId])
  const resumo = carga.status === 'pronto' ? carga.dados : null
  const altura = (pilha.length - 1) * PONTA + ALTURA_DA_FOTO + 62
  return (
    <View style={{ height: altura, marginTop: 18, marginHorizontal: 18, marginBottom: 8 }}>
      {pilha.map((v, i) => (
        <BilheteDaCarteira
          key={v.id}
          viagem={v}
          foto={capa(v.id, 700)}
          topo={i * PONTA}
          ordem={i}
          naFrente={i === pilha.length - 1}
          resumo={i === pilha.length - 1 ? resumo : null}
          aoAbrir={() => aoAbrir(v)}
        />
      ))}
    </View>
  )
}

// "em 23 dias", "amanhã", "agora", "Sem data"; null = já passou (ganha o carimbo)
function etiquetaDoBilhete(v: ViagemComDetalhes) {
  if (v.dataFim && diasAte(v.dataFim) < 0) return null
  if (!v.dataInicio) return 'Sem data'
  const faltam = diasAte(v.dataInicio)
  if (faltam > 1) return `em ${faltam} dias`
  if (faltam === 1) return 'amanhã'
  return 'agora'
}

type PropsDoBilhete = {
  viagem: ViagemComDetalhes
  foto: { uri: string } | undefined
  topo: number
  ordem: number
  naFrente: boolean
  resumo: { carimbos: number; total: number; proximo: string | null } | null
  aoAbrir: () => void
}

function BilheteDaCarteira({ viagem, foto, topo, ordem, naFrente, resumo, aoAbrir }: PropsDoBilhete) {
  const reduzir = useReducedMotion()
  const p = useSharedValue(reduzir ? 1 : 0)
  // Os bilhetes sobem um depois do outro, com mola, quando a tela abre
  useEffect(() => {
    if (reduzir) return
    p.value = withDelay(150 + ordem * 90, withSpring(1, mola.entrar))
  }, [reduzir, ordem, p])
  const entrada = useAnimatedStyle(() => ({ opacity: Math.min(1, p.value * 1.5), transform: [{ translateY: (1 - p.value) * 120 }] }))
  const etiqueta = etiquetaDoBilhete(viagem)
  const antiga = etiqueta === null
  return (
    <Animated.View style={[{ position: 'absolute', left: 0, right: 0, top: topo, zIndex: ordem }, entrada]}>
      <Pressable
        onPress={aoAbrir}
        accessibilityRole="button"
        accessibilityLabel={`Abrir ${viagem.nome}${etiqueta ? `, ${etiqueta}` : ', viagem que já passou'}`}
        className="overflow-hidden rounded-[22px] active:opacity-95"
        style={{ backgroundColor: cor.creme, boxShadow: '0 -8px 24px rgba(74,46,20,0.18)' }}
      >
        <FotoDeFundo source={foto} style={{ height: ALTURA_DA_FOTO, backgroundColor: cor.couro, opacity: antiga ? 0.7 : 1 }}>
          <LinearGradient colors={['rgba(42,27,13,0.65)', 'rgba(42,27,13,0)']} locations={[0, 0.45]} style={StyleSheet.absoluteFill} />
          <Text numberOfLines={naFrente ? 2 : 1} style={[titulo(24), { position: 'absolute', left: 14, top: 14, right: 110, color: cor.creme }]}>
            {viagem.nome}
          </Text>
          {etiqueta ? (
            <View className="absolute right-3 top-3 rounded-full px-2.5 py-1" style={{ backgroundColor: cor.dourado }}>
              <Text style={{ fontFamily: fonte.corpoNegrito, fontSize: 11, color: cor.texto }}>{etiqueta}</Text>
            </View>
          ) : (
            <View className="absolute right-3 top-1.5" style={{ transform: [{ rotate: '-12deg' }] }}>
              <Selo nome="feito" tamanho={54} tom="escuro" />
            </View>
          )}
        </FotoDeFundo>
        {naFrente ? (
          <View className="flex-row items-center justify-between gap-2 px-3.5 pb-3 pt-2.5">
            <View className="min-w-0 flex-1">
              <Text style={{ fontFamily: fonte.corpoForte, fontSize: 11.5, letterSpacing: 0.4, color: cor.suave }}>{periodo(viagem.dataInicio, viagem.dataFim).toUpperCase()}</Text>
              <Text numberOfLines={1} style={{ fontFamily: fonte.titulo, fontSize: 15, letterSpacing: -0.2, color: cor.texto, marginTop: 1 }}>
                {resumo ? (resumo.proximo ? `Próximo: ${resumo.proximo}` : 'Tudo pronto pra viagem') : ' '}
              </Text>
            </View>
            <PilhaDeAvatares nomes={viagem.membros.map((m) => m.nome)} tamanho={26} borda={cor.creme} max={4} />
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  )
}

// Mapa da galera (spec 118b): carrega sozinho, pra não atrasar o resto do Início
function MapaDoInicio({ meuId }: { meuId: string }) {
  const router = useRouter()
  const carga = useCarregar(() => buscarMapaDaGalera(supabase), [meuId])
  if (carga.status !== 'pronto' || !carga.dados) return null
  const [lembranca] = lembrancasDeHoje(carga.dados.carimbos, carga.dados.viagens, hojeIso())
  return (
    <View className="mb-5 gap-3">
      {lembranca ? (
        <Pressable
          onPress={() => router.push(`/lembranca?viagem=${lembranca.viagemId}&dia=${lembranca.data}`)}
          accessibilityRole="button"
          className="flex-row items-center gap-3 rounded-2xl bg-couro px-4 py-3.5 active:opacity-90"
        >
          <History size={22} color={cor.dourado} />
          <View className="flex-1">
            <Text className="font-body-bold text-[11px] uppercase tracking-widest text-dourado">Neste dia</Text>
            <Text className="font-body-bold text-[15px] text-creme" numberOfLines={2}>
              {textoDaLembranca(lembranca).titulo}
            </Text>
          </View>
          <ChevronRight size={20} color={cor.creme} />
        </Pressable>
      ) : null}
      <MapaDaGalera dados={carga.dados} meuId={meuId} aoAntigas={() => router.push('/viagem-antiga')} />
    </View>
  )
}

// Estado vazio: Norti dormindo esperando a primeira viagem
function Vazio({ ola, aoCriar, aoEntrar }: { ola: string; aoCriar: () => void; aoEntrar: () => void }) {
  const insets = useSafeAreaInsets()
  const [comCodigo, setComCodigo] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [entrando, setEntrando] = useState(false)

  async function entrarComCodigo() {
    // Aceita o código puro ou o link inteiro (…/v/<código> ou o antigo …/convite/<código>)
    const limpo = codigo.trim().split('/').filter(Boolean).pop() ?? ''
    if (!limpo) return
    setErro(null)
    setEntrando(true)
    const { error } = await supabase.rpc('aceitar_convite', { p_codigo: limpo })
    setEntrando(false)
    if (error) setErro('Esse convite não vale mais ou está errado. Peça um novo link.')
    else aoEntrar()
  }

  return (
    <View className="flex-1 bg-fundo px-5" style={{ paddingTop: insets.top + 12, paddingBottom: 24 }}>
      <StatusBar style="dark" />
      <Text className="font-body-medium text-[14px] text-suave">{ola}</Text>
      <Text className="font-display text-[32px] leading-[36px] text-texto">Minhas viagens</Text>
      <View className="mt-6 flex-1 items-center justify-center gap-3 rounded-3xl border-[1.5px] border-dashed border-tracejado px-7 py-8">
        <Norti humor="dormindo" tamanho={140} />
        <Text className="text-center font-display text-[28px] leading-[31px] text-texto">A primeira viagem do grupo começa aqui</Text>
        <Text className="text-center font-body text-[15px] leading-6 text-corpo">Crie a viagem, convide a turma e montem o roteiro juntos.</Text>
        <View className="mt-3 self-stretch">
          <Botao titulo="Nova viagem" icone={<Plus size={20} color="#fff" />} aoTocar={aoCriar} />
        </View>
        <View className="self-stretch">
          <AtalhosDoPassaporte />
        </View>
        {comCodigo ? (
          <View className="gap-2 self-stretch">
            <Campo icone={<Ticket size={20} color={cor.suave} />} placeholder="Código ou link do convite" value={codigo} onChangeText={setCodigo} autoCapitalize="none" onSubmitEditing={entrarComCodigo} />
            {erro ? <Text className="font-body-medium text-[13px] text-vermelho">{erro}</Text> : null}
            <Botao titulo="Entrar na viagem" tipo="secundario" aoTocar={entrarComCodigo} carregando={entrando} />
          </View>
        ) : (
          <Pressable onPress={() => setComCodigo(true)} className="h-11 justify-center">
            <Text className="font-body-semibold text-[14px] text-couro">Entrar com código de convite</Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

// Spec 118f: "rolê hoje" (2 toques) e "a gente já foi pra..." (viagem antiga), lado a lado
function AtalhosDoPassaporte() {
  const router = useRouter()
  return (
    <View className="mt-3 flex-row gap-3">
      <Pressable onPress={() => router.push('/role')} accessibilityRole="button" className="min-h-[52px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-areia px-3 active:opacity-80">
        <Locate size={18} color={cor.couro} />
        <Text className="font-body-bold text-[14px] text-couro">Rolê hoje</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/viagem-antiga')} accessibilityRole="button" className="min-h-[52px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-areia px-3 active:opacity-80">
        <History size={18} color={cor.couro} />
        <Text className="font-body-bold text-[14px] text-couro" numberOfLines={1}>Já fomos pra...</Text>
      </Pressable>
    </View>
  )
}

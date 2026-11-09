import { useEffect, useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Location from 'expo-location'
import { TIPOS_DE_ROLE, criarRole, lugarPelaCoordenada, type LugarAchado, type TipoDeRole } from '@together/core'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { useSessao } from '../src/lib/sessao'
import { hojeIso } from '../src/lib/formato'
import { supabase } from '../src/lib/supabase'
import { BuscaDeLugar } from '../src/ui/BuscaDeLugar'
import { Locate, X } from '../src/ui/icones'
import { StatusBar } from '../src/ui/StatusBar'
import { BotaoRedondo } from '../src/ui/pecas'
import { cor } from '../theme'

// "Rolê hoje" (spec 118f): toque 1 no Início, toque 2 em "Estou em <lugar>" (ou num lugar da busca).
// Vira uma viagem de 1 dia, sem roteiro nem hospedagem. Se a pessoa já está lá, o carimbo cai na hora.
// A localização só é usada aqui no aparelho pra achar o nome do lugar; não vai pro banco.
type Aqui = { situacao: 'olhando' } | { situacao: 'sem-permissao' } | { situacao: 'achou'; lugar: LugarAchado } | { situacao: 'nada' }

export default function Role() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { ehConvidado } = useSessao()
  const { escolher, recarregar } = useViagemAtual()
  const [tipo, setTipo] = useState<TipoDeRole>('bate-volta')
  const [aqui, setAqui] = useState<Aqui>({ situacao: 'olhando' })
  const [criando, setCriando] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  async function olharOndeEstou(pedir: boolean) {
    setAqui({ situacao: 'olhando' })
    try {
      const permissao = pedir ? await Location.requestForegroundPermissionsAsync() : await Location.getForegroundPermissionsAsync()
      if (!permissao.granted) return setAqui({ situacao: 'sem-permissao' })
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      const lugar = await lugarPelaCoordenada({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
      setAqui(lugar ? { situacao: 'achou', lugar } : { situacao: 'nada' })
    } catch (e) {
      console.error('Erro ao ver onde a pessoa está:', e)
      setAqui({ situacao: 'nada' })
    }
  }

  useEffect(() => {
    void olharOndeEstou(false)
  }, [])

  async function criar(lugar: LugarAchado, estouAqui: boolean) {
    if (criando) return
    setErro(null)
    setCriando(lugar.nome)
    try {
      const id = await criarRole(supabase, { lugar, tipo, estouAqui }, hojeIso())
      escolher(id)
      recarregar()
      router.replace(`/viagem/${id}`)
    } catch (e) {
      console.error('Erro ao criar o rolê:', e)
      setErro('Não deu pra criar o rolê. Confira a internet e tente de novo.')
      setCriando(null)
    }
  }

  const fechar = () => (router.canGoBack() ? router.back() : router.replace('/'))

  if (ehConvidado)
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-fundo px-8">
        <Text className="text-center font-display text-[24px] text-texto">Crie sua conta primeiro</Text>
        <Text className="text-center font-body text-[14px] text-corpo">Rolê é coisa de quem tem conta. Nada do que você já fez se perde.</Text>
        <Pressable onPress={() => router.replace('/criar-conta')} className="h-12 justify-center">
          <Text className="font-body-bold text-[15px] text-couro">Criar conta</Text>
        </Pressable>
      </View>
    )

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-fundo" style={{ paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <View className="px-5 pt-2">
        <BotaoRedondo aoTocar={fechar} rotulo="Fechar">
          <X size={20} color={cor.texto} />
        </BotaoRedondo>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: insets.bottom + 32, gap: 16 }}>
        <View>
          <Text className="font-display text-[34px] leading-[38px] text-texto">Rolê hoje</Text>
          <Text className="mt-2 font-body text-[15px] leading-[22px] text-corpo">Sem roteiro, sem hospedagem. Chegou lá, o carimbo cai e acende o mapa da galera.</Text>
        </View>

        <View className="flex-row gap-2">
          {TIPOS_DE_ROLE.map((t) => (
            <Pressable
              key={t.tipo}
              onPress={() => setTipo(t.tipo)}
              accessibilityRole="button"
              accessibilityState={{ selected: tipo === t.tipo }}
              className={`min-h-[40px] justify-center rounded-full border-[1.5px] px-4 ${tipo === t.tipo ? 'border-couro bg-couro' : 'border-borda bg-cartao'}`}
            >
              <Text className={`font-body-semibold text-[14px] ${tipo === t.tipo ? 'text-white' : 'text-texto'}`}>{t.titulo}</Text>
            </Pressable>
          ))}
        </View>

        <OndeEstou aqui={aqui} criando={criando} aoCriar={(l) => void criar(l, true)} aoPedir={() => void olharOndeEstou(true)} />

        <View className="gap-2">
          <Text className="font-body-bold text-[13px] uppercase tracking-[1.2px] text-suave">Ou pra onde vocês vão</Text>
          <BuscaDeLugar aoEscolher={(l) => void criar(l, false)} placeholder="Praia, cidade, casa de show..." />
        </View>

        {criando ? (
          <View className="flex-row items-center justify-center gap-2">
            <ActivityIndicator color={cor.couro} />
            <Text className="font-body-semibold text-[14px] text-corpo">Criando o rolê em {criando}...</Text>
          </View>
        ) : null}
        {erro ? <Text className="text-center font-body-medium text-[13px] text-vermelho">{erro}</Text> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function OndeEstou({ aqui, criando, aoCriar, aoPedir }: { aqui: Aqui; criando: string | null; aoCriar: (l: LugarAchado) => void; aoPedir: () => void }) {
  if (aqui.situacao === 'achou')
    return (
      <Pressable
        onPress={() => aoCriar(aqui.lugar)}
        disabled={!!criando}
        accessibilityRole="button"
        className="min-h-[64px] flex-row items-center gap-3 rounded-3xl bg-couro px-5 py-4 active:opacity-90"
      >
        <Locate size={24} color={cor.creme} />
        <View className="min-w-0 flex-1">
          <Text className="font-body-medium text-[13px] text-dourado">Estou aqui agora</Text>
          <Text className="font-display text-[22px] text-creme" numberOfLines={1}>{aqui.lugar.nome}</Text>
        </View>
      </Pressable>
    )
  if (aqui.situacao === 'olhando')
    return (
      <View className="min-h-[64px] flex-row items-center gap-3 rounded-3xl bg-areia px-5">
        <ActivityIndicator color={cor.couro} />
        <Text className="font-body-semibold text-[14px] text-corpo">Vendo onde você está...</Text>
      </View>
    )
  if (aqui.situacao === 'sem-permissao')
    return (
      <View className="gap-2 rounded-3xl bg-areia px-5 py-4">
        <Text className="font-body text-[14px] leading-5 text-corpo">Com a localização, o rolê sai em um toque e o carimbo cai na hora. Ela só é usada no seu celular.</Text>
        <Pressable onPress={aoPedir} accessibilityRole="button" className="min-h-[40px] flex-row items-center gap-2 self-start">
          <Locate size={18} color={cor.couro} />
          <Text className="font-body-bold text-[14px] text-couro">Usar onde estou</Text>
        </Pressable>
      </View>
    )
  return null
}

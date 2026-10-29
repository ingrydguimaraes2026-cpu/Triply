import { useState } from 'react'
import { Image, ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from '../../src/ui/StatusBar'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowRight, ChevronRight, Clock, Plus, Ticket } from 'lucide-react-native'
import type { ViagemComDetalhes } from '@together/core'
import { proximaViagem, useViagemAtual, viagensPassadas } from '../../src/dados/viagemAtual'
import { diasAte, mesEAno, periodo, primeiroNome } from '../../src/lib/formato'
import { useSessao } from '../../src/lib/sessao'
import { supabase } from '../../src/lib/supabase'
import { FaixaConvidado } from '../../src/ui/FaixaConvidado'
import { capaDaViagem } from '../../src/ui/fotos'
import { Malinha } from '../../src/ui/Malinha'
import { Botao, Campo, Carregando, ErroNaTela, PilhaDeAvatares } from '../../src/ui/pecas'
import { cor, sombra } from '../../theme'

// Home · Minhas viagens (telas "1e" e "1f" do design)
export default function MinhasViagens() {
  const { status, viagens, meuId, escolher, recarregar } = useViagemAtual()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { ehConvidado } = useSessao()

  if (status === 'carregando') return <Carregando texto="Arrumando a mala…" />
  if (status === 'erro') return <ErroNaTela aoTentar={recarregar} />

  const eu = viagens.flatMap((v) => v.membros).find((m) => m.id === meuId)
  const ola = eu ? `Olá, ${primeiroNome(eu.nome)}` : 'Olá'
  const destaque = proximaViagem(viagens)
  const passadas = viagensPassadas(viagens).filter((v) => v.id !== destaque?.id)
  const outras = viagens.filter((v) => v.id !== destaque?.id && !passadas.includes(v))

  const abrir = (v: ViagemComDetalhes) => {
    escolher(v.id)
    router.push(`/viagem/${v.id}`)
  }

  if (!destaque) return <Vazio ola={ola} aoCriar={() => router.push('/nova-viagem')} aoEntrar={recarregar} />

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 40 }}>
        <View className="mb-5 flex-row items-end justify-between gap-2">
          <View className="min-w-0 flex-1">
            <Text className="font-body-medium text-[14px] text-suave">{ola}</Text>
            <Text className="font-display text-[26px] leading-[30px] text-texto" numberOfLines={1}>Minhas viagens</Text>
          </View>
          {/* Convidado cria conta antes de criar viagem (spec 018) */}
          {!ehConvidado ? <Botao compacto titulo="Nova viagem" icone={<Plus size={18} color="#fff" />} aoTocar={() => router.push('/nova-viagem')} /> : null}
        </View>

        <FaixaConvidado />

        <CartaoDestaque viagem={destaque} aoAbrir={() => abrir(destaque)} />

        {outras.length ? <Lista titulo="Próximas" viagens={outras} aoAbrir={abrir} /> : null}
        {passadas.length ? <Lista titulo="Viagens passadas" viagens={passadas} aoAbrir={abrir} /> : null}
      </ScrollView>
    </View>
  )
}

function CartaoDestaque({ viagem, aoAbrir }: { viagem: ViagemComDetalhes; aoAbrir: () => void }) {
  const faltam = viagem.dataInicio ? diasAte(viagem.dataInicio) : null
  const etiqueta =
    faltam == null ? 'Sem data ainda' : faltam > 1 ? `Faltam ${faltam} dias` : faltam === 1 ? 'É amanhã!' : (viagem.dataFim && diasAte(viagem.dataFim) >= 0) ? 'Acontecendo agora' : 'Já foi'
  const linhaDeCima = [viagem.destinos.length > 1 ? `${viagem.destinos.length} destinos` : viagem.destinos[0], periodo(viagem.dataInicio, viagem.dataFim)]
    .filter(Boolean)
    .join(' · ')

  return (
    <Pressable onPress={aoAbrir} className="h-[470px] overflow-hidden rounded-3xl bg-couro active:opacity-95" style={sombra.hero}>
      <ImageBackground source={{ uri: capaDaViagem(viagem.id) }} resizeMode="cover" style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['rgba(185,122,34,0)', 'rgba(185,122,34,0.55)', '#4A2E14']}
          locations={[0.38, 0.62, 1]}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>
      <View className="absolute left-4 top-4 flex-row items-center gap-1.5 rounded-full bg-fundo px-3 py-2">
        <Clock size={16} color={cor.caramelo} />
        <Text className="font-body-bold text-[13px] text-texto">{etiqueta}</Text>
      </View>
      <View className="absolute bottom-6 left-6 right-6">
        <Text className="font-body-semibold text-[13px] uppercase tracking-wider text-creme">{linhaDeCima}</Text>
        <Text className="mb-[18px] mt-2 font-display text-[40px] leading-[42px] text-white">{viagem.nome}</Text>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2.5">
            <PilhaDeAvatares nomes={viagem.membros.map((m) => m.nome)} borda="#5A3818" />
            <Text className="font-body-semibold text-[13px] text-creme">
              {viagem.membros.length} {viagem.membros.length === 1 ? 'viajante' : 'viajantes'}
            </Text>
          </View>
          <View className="h-11 w-11 items-center justify-center rounded-full bg-fundo">
            <ArrowRight size={20} color={cor.escuro} />
          </View>
        </View>
      </View>
    </Pressable>
  )
}

function Lista({ titulo, viagens, aoAbrir }: { titulo: string; viagens: ViagemComDetalhes[]; aoAbrir: (v: ViagemComDetalhes) => void }) {
  return (
    <>
      <Text className="mb-3 mt-8 font-display text-[22px] text-texto">{titulo}</Text>
      <View className="gap-2.5">
        {viagens.map((v) => (
          <Pressable key={v.id} onPress={() => aoAbrir(v)} className="flex-row items-center gap-3.5 rounded-2xl bg-cartao p-3 active:opacity-90" style={sombra.cartao}>
            <Image source={{ uri: capaDaViagem(v.id, 200) }} className="h-16 w-16 rounded-xl bg-tracejado" />
            <View className="min-w-0 flex-1">
              <Text className="font-display text-[18px] text-texto" numberOfLines={1}>
                {v.nome}
              </Text>
              <Text className="mt-0.5 font-body text-[13px] text-suave">
                {mesEAno(v.dataInicio) || 'Sem data'} · {v.membros.length} {v.membros.length === 1 ? 'pessoa' : 'pessoas'}
              </Text>
            </View>
            <ChevronRight size={20} color={cor.suave} />
          </Pressable>
        ))}
      </View>
    </>
  )
}

// Estado vazio: Malinha dormindo esperando a primeira viagem
function Vazio({ ola, aoCriar, aoEntrar }: { ola: string; aoCriar: () => void; aoEntrar: () => void }) {
  const insets = useSafeAreaInsets()
  const [comCodigo, setComCodigo] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [entrando, setEntrando] = useState(false)

  async function entrarComCodigo() {
    // Aceita o código puro ou o link inteiro (…/convite/<código>)
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
        <Malinha humor="dormindo" tamanho={140} />
        <Text className="text-center font-display text-[28px] leading-[31px] text-texto">A primeira viagem do grupo começa aqui</Text>
        <Text className="text-center font-body text-[15px] leading-6 text-corpo">Crie a viagem, convide a turma e montem o roteiro juntos.</Text>
        <View className="mt-3 self-stretch">
          <Botao titulo="Nova viagem" icone={<Plus size={20} color="#fff" />} aoTocar={aoCriar} />
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

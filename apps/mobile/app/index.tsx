import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Foto, FotoDeFundo } from '../src/ui/Foto'
import { StatusBar } from '../src/ui/StatusBar'
import { LinearGradient } from 'expo-linear-gradient'
import { Redirect, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronRight, Clock, Plus, Ticket } from '../src/ui/icones'
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { descreverAtividade, viagemAcontecendo, type ViagemComDetalhes } from '@together/core'
import { carregarResumoDoInicio } from '../src/dados/resumoDoInicio'
import { useCarregar } from '../src/dados/useCarregar'
import { mola, useReducedMotion } from '../src/ui/movimento'
import { proximaViagem, useViagemAtual, viagensPassadas } from '../src/dados/viagemAtual'
import { diasAte, hojeIso, mesEAno, periodo, primeiroNome } from '../src/lib/formato'
import { useSessao } from '../src/lib/sessao'
import { supabase } from '../src/lib/supabase'
import { FaixaConvidado } from '../src/ui/FaixaConvidado'
import { useCapas } from '../src/dados/useCapas'
import { Norti } from '../src/ui/Norti'
import { Avatar, Botao, Campo, Carregando, ErroNaTela, PilhaDeAvatares } from '../src/ui/pecas'
import { cor, sombra } from '../theme'

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

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 40 }}>
        <View className="mb-5 flex-row items-end justify-between gap-2">
          <View className="min-w-0 flex-1">
            <Text className="font-body-medium text-[14px] text-suave">{saudacao},</Text>
            <Text className="font-display text-[26px] leading-[30px] text-texto" numberOfLines={1}>{eu ? primeiroNome(eu.nome) : 'Minhas viagens'}</Text>
          </View>
          {/* Spec 117: o Perfil abre pelo avatar (saiu da barra de abas) */}
          <Pressable onPress={() => router.push('/perfil')} accessibilityLabel="Abrir o perfil" className="active:opacity-80">
            <Avatar nome={eu?.nome ?? 'Eu'} indice={5} tamanho={40} />
          </Pressable>
        </View>

        <FaixaConvidado />

        <Destaque viagem={destaque} meuId={meuId} aoAbrir={() => abrir(destaque)} />

        {outras.length ? <Lista titulo="Próximas" viagens={outras} aoAbrir={abrir} /> : null}
        {passadas.length ? <Lista titulo="Viagens passadas" viagens={passadas} aoAbrir={abrir} /> : null}

        {/* Convidado cria conta antes de criar viagem (spec 018) */}
        {!ehConvidado ? (
          <Pressable onPress={() => router.push('/nova-viagem')} className="mt-8 h-14 flex-row items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-tracejado active:opacity-80">
            <Plus size={20} color={cor.couro} />
            <Text className="font-body-bold text-[15px] text-couro">Nova viagem</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  )
}

// Cartão da próxima viagem + "No comboio agora" (spec 117, tela 1)
function Destaque({ viagem, meuId, aoAbrir }: { viagem: ViagemComDetalhes; meuId: string; aoAbrir: () => void }) {
  const carga = useCarregar(() => carregarResumoDoInicio(viagem, meuId), [viagem.id, meuId])
  const resumo = carga.status === 'pronto' ? carga.dados : null
  const nome = (id: string | null) => primeiroNome(viagem.membros.find((m) => m.id === id)?.nome ?? 'Alguém')
  const indice = (id: string | null) => Math.max(0, viagem.membros.findIndex((m) => m.id === id))
  return (
    <>
      <CartaoDestaque viagem={viagem} carimbos={resumo ? { feitos: resumo.carimbos, total: resumo.total } : null} aoAbrir={aoAbrir} />
      {resumo?.agora.length ? (
        <>
          <Text className="mb-2 mt-7 font-display text-[20px] text-texto">No comboio agora</Text>
          {resumo.agora.map((a) => {
            const d = descreverAtividade(a)
            return (
              <Pressable key={a.id} onPress={aoAbrir} className="min-h-[48px] flex-row items-center gap-3 border-b border-linha py-2 active:opacity-80">
                <Avatar nome={nome(a.autor)} indice={indice(a.autor)} tamanho={30} />
                <Text className="flex-1 font-body text-[14px] text-corpo" numberOfLines={1}>
                  <Text className="font-body-semibold text-texto">{nome(a.autor)}</Text> {d.verbo}
                  {d.titulo ? ` ${d.titulo}` : ''}
                </Text>
                <Text className="font-body text-[12px] text-suave">{haQuanto(a.criado_em)}</Text>
              </Pressable>
            )
          })}
        </>
      ) : null}
    </>
  )
}

// "2 min", "1 h", "3 d"
function haQuanto(iso: string) {
  const min = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  return min < 60 ? `${min} min` : min < 1440 ? `${Math.round(min / 60)} h` : `${Math.round(min / 1440)} d`
}

function CartaoDestaque({ viagem, carimbos, aoAbrir }: { viagem: ViagemComDetalhes; carimbos: { feitos: number; total: number } | null; aoAbrir: () => void }) {
  const capa = useCapas([viagem.id])
  const faltam = viagem.dataInicio ? diasAte(viagem.dataInicio) : null
  const etiqueta =
    faltam == null ? 'Sem data ainda' : faltam > 1 ? `Faltam ${faltam} dias` : faltam === 1 ? 'É amanhã!' : (viagem.dataFim && diasAte(viagem.dataFim) >= 0) ? 'Acontecendo agora' : 'Já foi'
  const linhaDeCima = [viagem.destinos.length > 1 ? `${viagem.destinos.length} destinos` : viagem.destinos[0], periodo(viagem.dataInicio, viagem.dataFim)]
    .filter(Boolean)
    .join(' · ')

  return (
    <Pressable onPress={aoAbrir} className="h-[400px] overflow-hidden rounded-3xl bg-couro active:opacity-95" style={sombra.hero}>
      <FotoDeFundo source={capa(viagem.id)} style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['rgba(185,122,34,0)', 'rgba(185,122,34,0.55)', '#4A2E14']}
          locations={[0.38, 0.62, 1]}
          style={StyleSheet.absoluteFill}
        />
      </FotoDeFundo>
      <View className="absolute left-4 top-4 flex-row items-center gap-1.5 rounded-full bg-fundo px-3 py-2">
        <Clock size={16} color={cor.caramelo} />
        <Text className="font-body-bold text-[13px] text-texto">{etiqueta}</Text>
      </View>
      <View className="absolute bottom-6 left-6 right-6">
        <Text className="font-body-semibold text-[13px] uppercase tracking-wider text-creme">{linhaDeCima}</Text>
        <Text className="mb-[18px] mt-2 font-display text-[40px] leading-[42px] text-white">{viagem.nome}</Text>
        <View className="flex-row items-center justify-between">
          <Text className="font-body-semibold text-[13px] text-creme">
            {carimbos ? `${carimbos.feitos} de ${carimbos.total} carimbos` : `${viagem.membros.length} ${viagem.membros.length === 1 ? 'viajante' : 'viajantes'}`}
          </Text>
          <PilhaDeAvatares nomes={viagem.membros.map((m) => m.nome)} tamanho={28} borda="#5A3818" />
        </View>
        {/* Barra de carimbos do passaporte (spec 117) */}
        <View className="mt-2.5 h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: 'rgba(245,233,214,0.25)' }}>
          <BarraQueEnche fracao={carimbos ? carimbos.feitos / carimbos.total : 0} />
        </View>
      </View>
    </Pressable>
  )
}

function BarraQueEnche({ fracao }: { fracao: number }) {
  const reduzir = useReducedMotion()
  const estilo = useAnimatedStyle(() => ({ transform: [{ scaleX: reduzir ? fracao : withSpring(fracao, mola.solta) }] }))
  return <Animated.View className="h-full w-full rounded-full" style={[{ backgroundColor: cor.dourado, transformOrigin: 'left' }, estilo]} />
}

function Lista({ titulo, viagens, aoAbrir }: { titulo: string; viagens: ViagemComDetalhes[]; aoAbrir: (v: ViagemComDetalhes) => void }) {
  const capa = useCapas(viagens.map((v) => v.id))
  return (
    <>
      <Text className="mb-3 mt-8 font-display text-[22px] text-texto">{titulo}</Text>
      <View className="gap-2.5">
        {viagens.map((v) => (
          <Pressable key={v.id} onPress={() => aoAbrir(v)} className="flex-row items-center gap-3.5 rounded-2xl bg-cartao p-3 active:opacity-90" style={sombra.cartao}>
            <Foto source={capa(v.id, 200)} className="h-16 w-16 rounded-xl bg-tracejado" />
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

// Estado vazio: Norti dormindo esperando a primeira viagem
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
        <Norti humor="dormindo" tamanho={140} />
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

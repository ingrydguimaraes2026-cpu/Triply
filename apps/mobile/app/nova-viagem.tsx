import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { StatusBar } from '../src/ui/StatusBar'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Calendar, Check, ChevronLeft, ChevronRight, Link, MapPin, Search, X } from 'lucide-react-native'
import { criarViagem } from '@together/core'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { compartilharLink, gerarLinkDeConvite } from '../src/lib/convite'
import { nomeDoMes, paraIso } from '../src/lib/formato'
import { useSessao } from '../src/lib/sessao'
import { supabase } from '../src/lib/supabase'
import { Malinha } from '../src/ui/Malinha'
import { Botao, BotaoRedondo, Campo, RotuloDeSecao } from '../src/ui/pecas'
import { cor } from '../theme'

// Criar viagem (tela "1m" do design): 3 etapas (pra onde, quando, moeda + convite)
// e a tela de comemoração com a Malinha pulando.
const SUGESTOES = [
  ['Chapada Diamantina', 'Bahia · trilhas e cachoeiras'],
  ['Jericoacoara', 'Ceará · praia e dunas'],
  ['Serra Gaúcha', 'Rio Grande do Sul · vinícolas'],
  ['Bonito', 'Mato Grosso do Sul · flutuação'],
]
const MOEDAS = [
  ['BRL', 'Real'],
  ['EUR', 'Euro'],
  ['USD', 'Dólar'],
]
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

// Convidado (spec 018) cria conta antes de criar viagem: o banco também recusa
export default function NovaViagem() {
  const { ehConvidado } = useSessao()
  return ehConvidado ? <ConvidadoSemConta /> : <CriarViagem />
}

function ConvidadoSemConta() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  return (
    <View className="flex-1 bg-fundo" style={{ paddingTop: insets.top + 8 }}>
      <StatusBar style="dark" />
      <View className="px-5">
        <BotaoRedondo aoTocar={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
          <X size={20} color={cor.texto} />
        </BotaoRedondo>
      </View>
      <View className="flex-1 items-center justify-center gap-4 px-8">
        <Malinha tamanho={120} humor="pensando" />
        <Text className="text-center font-display text-[26px] text-texto">Crie sua conta primeiro</Text>
        <Text className="text-center font-body text-[14px] leading-5 text-corpo">Pra criar uma viagem sua, transforme o acesso de convidado numa conta. Nada do que você já fez se perde.</Text>
        <View className="self-stretch">
          <Botao titulo="Criar conta" aoTocar={() => router.replace('/criar-conta')} />
        </View>
      </View>
    </View>
  )
}

function CriarViagem() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { recarregar, escolher } = useViagemAtual()
  const [etapa, setEtapa] = useState(0)
  const [destino, setDestino] = useState('')
  const [ida, setIda] = useState<Date | null>(null)
  const [volta, setVolta] = useState<Date | null>(null)
  const [mes, setMes] = useState(() => {
    const h = new Date()
    return new Date(h.getFullYear(), h.getMonth(), 1)
  })
  const [moeda, setMoeda] = useState('BRL')
  const [criando, setCriando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [criada, setCriada] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const valido = [destino.trim().length > 1, !!(ida && volta), true][etapa]
  const noites = ida && volta ? Math.round((volta.getTime() - ida.getTime()) / 86_400_000) : 0
  const fmt = (d: Date) => `${d.getDate()} de ${MESES_CURTOS[d.getMonth()]}`
  const rotuloDoPeriodo = ida
    ? volta
      ? `${fmt(ida)} a ${fmt(volta)} · ${noites} ${noites === 1 ? 'noite' : 'noites'}`
      : `Ida em ${fmt(ida)} · escolha a volta`
    : 'Escolha a data de ida'

  const fechar = () => (router.canGoBack() ? router.back() : router.replace('/'))

  async function avancar() {
    if (!valido) return
    if (etapa < 2) return setEtapa(etapa + 1)
    setErro(null)
    setCriando(true)
    try {
      const id = await criarViagem(supabase, {
        nome: destino.trim(),
        dataInicio: ida ? paraIso(ida) : null,
        dataFim: volta ? paraIso(volta) : null,
        moeda,
        destinos: [{ nome: destino.trim(), pais: null, latitude: null, longitude: null }],
      })
      escolher(id)
      recarregar()
      setCriada(id)
    } catch {
      setErro('Não deu pra criar a viagem. Confira a internet e tente de novo.')
    }
    setCriando(false)
  }

  function tocarDia(d: Date) {
    if (!ida || volta) {
      setIda(d)
      setVolta(null)
    } else if (d < ida) {
      setVolta(ida)
      setIda(d)
    } else setVolta(d)
  }

  async function convidar() {
    if (!criada) return
    try {
      const link = await gerarLinkDeConvite(criada)
      const r = await compartilharLink(link, destino.trim())
      setAviso(r === 'copiado' ? 'Link copiado! Mande pra turma.' : null)
    } catch {
      setAviso('Não deu pra gerar o link agora. Tente pela tela da viagem.')
    }
  }

  // Comemoração
  if (criada) {
    return (
      <LinearGradient colors={['#B97A22', '#8A5A26', '#4A2E14']} locations={[0, 0.55, 1]} style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24, paddingBottom: insets.bottom + 40, gap: 14 }}>
        <StatusBar style="light" />
        <View className="-ml-1.5">
          <Malinha humor="feliz" tamanho={130} />
        </View>
        <Text className="font-body-semibold text-[13px] uppercase tracking-wider text-creme">{rotuloDoPeriodo}</Text>
        <Text className="font-display text-[44px] leading-[46px] text-fundo">{destino.trim()}</Text>
        <Text className="font-body text-[15px] leading-[22px] text-creme">Viagem criada! Mande o link de convite pra turma e montem o roteiro juntos.</Text>
        {aviso ? <Text className="font-body-semibold text-[13px] text-dourado">{aviso}</Text> : null}
        <View className="mt-4 gap-2.5">
          <Botao titulo="Mandar convite" tipo="claro" icone={<Link size={18} color={cor.escuro} />} aoTocar={convidar} />
          <Pressable onPress={() => router.replace(`/viagem/${criada}`)} className="h-12 items-center justify-center">
            <Text className="font-body-bold text-[15px] text-fundo">Ver viagem</Text>
          </Pressable>
        </View>
      </LinearGradient>
    )
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-fundo" style={{ paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <View className="flex-row items-center justify-between px-5 pt-2">
        <BotaoRedondo aoTocar={() => (etapa === 0 ? fechar() : setEtapa(etapa - 1))}>
          {etapa === 0 ? <X size={20} color={cor.texto} /> : <ArrowLeft size={20} color={cor.texto} />}
        </BotaoRedondo>
        <Text className="font-body-semibold text-[14px] text-suave">Etapa {etapa + 1} de 3</Text>
        <View className="w-11" />
      </View>
      <View className="flex-row gap-1.5 px-5 pt-4">
        {[0, 1, 2].map((i) => (
          <View key={i} className={`h-1 flex-1 rounded-sm ${i <= etapa ? 'bg-couro' : 'bg-[#E3D2B8]'}`} />
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 28, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        {etapa === 0 ? (
          <>
            <Text className="font-display text-[32px] leading-[36px] text-texto">Pra onde vocês vão?</Text>
            <Text className="mb-5 mt-2 font-body text-[15px] text-corpo">Cidade, região ou parque.</Text>
            <Campo icone={<Search size={20} color={cor.couro} />} placeholder="Buscar destino" value={destino} onChangeText={setDestino} autoFocus />
            <View className="mt-6">
              <RotuloDeSecao>Sugestões</RotuloDeSecao>
            </View>
            {SUGESTOES.map(([t, s]) => {
              const ativo = destino === t
              return (
                <Pressable key={t} onPress={() => setDestino(t)} className="flex-row items-center gap-3 border-b border-[#EFE3D0] py-3">
                  <View className={`h-10 w-10 items-center justify-center rounded-xl ${ativo ? 'bg-couro' : 'bg-chip'}`}>
                    <MapPin size={20} color={ativo ? '#fff' : cor.couro} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-body-bold text-[15px] text-texto">{t}</Text>
                    <Text className="font-body text-[13px] text-suave">{s}</Text>
                  </View>
                  {ativo ? <Check size={20} color={cor.couro} /> : null}
                </Pressable>
              )
            })}
          </>
        ) : null}

        {etapa === 1 ? (
          <>
            <Text className="font-display text-[32px] leading-[36px] text-texto">Quando?</Text>
            <Text className="mb-5 mt-2 font-body text-[15px] text-corpo">Toque na ida e depois na volta.</Text>
            <Calendario mes={mes} setMes={setMes} ida={ida} volta={volta} aoTocar={tocarDia} />
            <View className="mt-4 flex-row items-center gap-3 rounded-2xl bg-areia p-4">
              <Calendar size={22} color={cor.couro} />
              <Text className="font-body-bold text-[15px] text-texto">{rotuloDoPeriodo}</Text>
            </View>
          </>
        ) : null}

        {etapa === 2 ? (
          <>
            <Text className="font-display text-[32px] leading-[36px] text-texto">Quase lá!</Text>
            <Text className="mb-5 mt-2 font-body text-[15px] text-corpo">Em que moeda vocês vão gastar mais?</Text>
            <View className="flex-row gap-2">
              {MOEDAS.map(([m, n]) => (
                <Pressable key={m} onPress={() => setMoeda(m)} className={`flex-1 items-center rounded-2xl border py-4 ${moeda === m ? 'border-couro bg-couro' : 'border-borda bg-cartao'}`}>
                  <Text className={`font-display text-[20px] ${moeda === m ? 'text-white' : 'text-texto'}`}>{m}</Text>
                  <Text className={`font-body text-[13px] ${moeda === m ? 'text-white/85' : 'text-suave'}`}>{n}</Text>
                </Pressable>
              ))}
            </View>
            <View className="mt-6 flex-row items-center gap-3 rounded-2xl border border-dashed border-tracejado bg-cartao p-4">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-chip">
                <Link size={20} color={cor.couro} />
              </View>
              <View className="flex-1">
                <Text className="font-body-bold text-[14px] text-texto">Link de convite</Text>
                <Text className="font-body text-[13px] text-suave">Fica pronto assim que a viagem for criada.</Text>
              </View>
            </View>
            {erro ? <Text className="mt-4 font-body-medium text-[13px] text-vermelho">{erro}</Text> : null}
          </>
        ) : null}
      </ScrollView>

      <View className="px-5 pt-3" style={{ paddingBottom: insets.bottom + 24 }}>
        <Botao titulo={etapa === 2 ? 'Criar viagem' : 'Continuar'} aoTocar={avancar} desabilitado={!valido} carregando={criando} />
      </View>
    </KeyboardAvoidingView>
  )
}

function Calendario({ mes, setMes, ida, volta, aoTocar }: { mes: Date; setMes: (d: Date) => void; ida: Date | null; volta: Date | null; aoTocar: (d: Date) => void }) {
  const primeiroDia = mes.getDay()
  const diasNoMes = new Date(mes.getFullYear(), mes.getMonth() + 1, 0).getDate()
  const celulas: (Date | null)[] = [...Array(primeiroDia).fill(null), ...Array.from({ length: diasNoMes }, (_, i) => new Date(mes.getFullYear(), mes.getMonth(), i + 1))]
  const mesmo = (a: Date | null, b: Date) => !!a && a.getTime() === b.getTime()
  const mudar = (delta: number) => setMes(new Date(mes.getFullYear(), mes.getMonth() + delta, 1))
  // Dias que já passaram ficam apagados: não dá pra viajar pra trás
  const agora = new Date()
  const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate())

  return (
    <View className="rounded-2xl bg-cartao px-4 py-5" style={{ boxShadow: '0 4px 14px rgba(74,46,20,0.06)' }}>
      <View className="flex-row items-center justify-between px-1 pb-3.5">
        <Text className="font-display text-[18px] text-texto">{nomeDoMes(mes.getMonth(), mes.getFullYear())}</Text>
        <View className="flex-row gap-4">
          <Pressable onPress={() => mudar(-1)} hitSlop={8}>
            <ChevronLeft size={20} color={cor.suave} />
          </Pressable>
          <Pressable onPress={() => mudar(1)} hitSlop={8}>
            <ChevronRight size={20} color={cor.suave} />
          </Pressable>
        </View>
      </View>
      <View className="mb-1.5 flex-row">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((l, i) => (
          <Text key={i} className="flex-1 text-center font-body-semibold text-[12px] text-suave">
            {l}
          </Text>
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {celulas.map((d, i) => {
          if (!d) return <View key={i} style={{ width: `${100 / 7}%`, height: 42 }} />
          const ponta = mesmo(ida, d) || mesmo(volta, d)
          const dentro = !!(ida && volta && d > ida && d < volta)
          const faixa = !!(ida && volta && (dentro || (mesmo(ida, d) && volta.getTime() !== ida.getTime()) || mesmo(volta, d)))
          const passou = d < hoje
          return (
            <Pressable
              key={i}
              onPress={() => aoTocar(d)}
              disabled={passou}
              className="items-center justify-center"
              style={{
                width: `${100 / 7}%`,
                height: 42,
                marginVertical: 2,
                backgroundColor: faixa ? '#F1E2CB' : 'transparent',
                borderTopLeftRadius: mesmo(ida, d) ? 12 : 0,
                borderBottomLeftRadius: mesmo(ida, d) ? 12 : 0,
                borderTopRightRadius: mesmo(volta, d) ? 12 : 0,
                borderBottomRightRadius: mesmo(volta, d) ? 12 : 0,
              }}
            >
              <View className={`h-[38px] w-[38px] items-center justify-center rounded-xl ${ponta ? 'bg-couro' : ''}`}>
                <Text className={`text-[14px] ${ponta ? 'font-body-bold text-white' : passou ? 'font-body text-tracejado' : 'font-body-medium text-texto'}`}>{d.getDate()}</Text>
              </View>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

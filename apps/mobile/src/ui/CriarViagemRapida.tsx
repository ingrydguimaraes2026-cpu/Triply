import { useMemo, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Calendar, MapPin, Minus, Plus, Search, Ticket, X } from './icones'
import { CIDADES_DA_PRE_CARGA, NOME_EM_PORTUGUES, aceitarConvite, criarViagem, moedaDoPais, semAcento, type CidadeDaLista } from '@together/core'
import { useViagemAtual } from '../dados/viagemAtual'
import { paraIso } from '../lib/formato'
import { supabase } from '../lib/supabase'
import { Norti } from './Norti'
import { Calendario } from './Calendario'
import { StatusBar } from './StatusBar'
import { Botao, BotaoRedondo, Campo } from './pecas'
import { cor } from '../../theme'

// Jeito rápido de criar viagem (specs 115 v2 e 116): uma pergunta por tela.
// 1. Pra onde? → 2. Quantos dias? → cria a viagem e abre o deslize do Explorar.
// `primeira`: conta nova sem viagem (sem botão de fechar, com "Tenho um convite").

type Escolhido = { nome: string; pais: string | null }

const SUGESTOES: { nome: string; pais: string; frase: string; cores: [string, string] }[] = [
  { nome: 'Rio de Janeiro', pais: 'BR', frase: 'Praia, morro e samba', cores: ['#B97A22', '#7B542F'] },
  { nome: 'Jericoacoara', pais: 'BR', frase: 'Dunas e pôr do sol', cores: ['#E3A04A', '#B97A22'] },
  { nome: 'Gramado', pais: 'BR', frase: 'Serra e chocolate', cores: ['#7B542F', '#4A2E14'] },
  { nome: 'Lisboa', pais: 'PT', frase: 'Ladeiras e pastéis', cores: ['#A8703F', '#6B7A3A'] },
  { nome: 'Paris', pais: 'FR', frase: 'Museus e cafés', cores: ['#8E6A3E', '#4A2E14'] },
  { nome: 'Buenos Aires', pais: 'AR', frase: 'Tango e parrilla', cores: ['#B5553A', '#7B542F'] },
]
const DIAS_RAPIDOS = [2, 3, 4, 5, 7, 10]
const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export function CriarViagemRapida({ primeira }: { primeira: boolean }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { recarregar, escolher } = useViagemAtual()
  const [etapa, setEtapa] = useState<0 | 1>(0)
  const [busca, setBusca] = useState('')
  const [destino, setDestino] = useState<Escolhido | null>(null)
  const [dias, setDias] = useState(4)
  const [comDatas, setComDatas] = useState(false)
  const [ida, setIda] = useState<Date | null>(null)
  const [volta, setVolta] = useState<Date | null>(null)
  const [mes, setMes] = useState(() => {
    const h = new Date()
    return new Date(h.getFullYear(), h.getMonth(), 1)
  })
  const [criando, setCriando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Busca na lista de cidades que o Explorar já conhece; dá pra usar o que foi digitado também
  const achadas = useMemo(() => {
    const t = semAcento(busca.trim())
    if (t.length < 2) return []
    return CIDADES_DA_PRE_CARGA.filter((c) => semAcento(c.nome).includes(t)).slice(0, 6)
  }, [busca])

  // Com datas, os dias saem do calendário
  const diasDasDatas = ida && volta ? Math.round((volta.getTime() - ida.getTime()) / 86_400_000) + 1 : null
  const diasFinais = comDatas && diasDasDatas ? diasDasDatas : dias
  const fmt = (d: Date) => `${d.getDate()} de ${MESES_CURTOS[d.getMonth()]}`

  const fechar = () => (router.canGoBack() ? router.back() : router.replace('/'))

  function escolherCidade(c: CidadeDaLista | { nome: string; pais: string | null }) {
    setDestino({ nome: c.nome, pais: c.pais })
    setEtapa(1)
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

  async function criar() {
    if (!destino) return
    setErro(null)
    setCriando(true)
    try {
      const datas = comDatas && ida && volta
      const id = await criarViagem(supabase, {
        nome: destino.nome,
        dataInicio: datas ? paraIso(ida) : null,
        dataFim: datas ? paraIso(volta) : null,
        moeda: destino.pais ? moedaDoPais(destino.pais) : 'BRL',
        destinos: [
          {
            nome: destino.nome,
            pais: destino.pais ? (NOME_EM_PORTUGUES[destino.pais] ?? null) : null,
            latitude: null,
            longitude: null,
            dias: diasFinais,
          },
        ],
      })
      escolher(id)
      recarregar()
      // Direto pro deslize; no fim do roteiro, "Continuar" leva pro convite e pra viagem
      router.replace({ pathname: '/explorar', params: { viagem: id, guiado: '1' } })
    } catch {
      setErro('Não deu pra criar a viagem. Confira a internet e tente de novo.')
      setCriando(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-fundo" style={{ paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <View className="flex-row items-center justify-between px-5 pt-2">
        {etapa === 1 ? (
          <BotaoRedondo aoTocar={() => setEtapa(0)}>
            <ArrowLeft size={20} color={cor.texto} />
          </BotaoRedondo>
        ) : primeira ? (
          <View className="h-11 w-11" />
        ) : (
          <BotaoRedondo aoTocar={fechar}>
            <X size={20} color={cor.texto} />
          </BotaoRedondo>
        )}
        <View className="flex-row gap-1.5">
          {[0, 1, 2].map((i) => (
            <View key={i} className={`h-1.5 rounded-full ${i === etapa ? 'w-6 bg-couro' : i < etapa ? 'w-1.5 bg-couro' : 'w-1.5 bg-[#E3D2B8]'}`} />
          ))}
        </View>
        <View className="w-11" />
      </View>

      {etapa === 0 ? (
        <EtapaDestino
          primeira={primeira}
          busca={busca}
          setBusca={setBusca}
          achadas={achadas}
          aoEscolher={escolherCidade}
          aoEntrarNoConvite={(id) => {
            escolher(id)
            recarregar()
            router.replace({ pathname: '/explorar', params: { viagem: id, guiado: '1' } })
          }}
        />
      ) : (
        <>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 }}>
            <Text className="font-body-bold text-[12px] uppercase tracking-[1.4px] text-suave">{destino?.nome}</Text>
            <Text className="mt-1 font-display text-[34px] leading-[38px] text-texto">Quantos dias?</Text>
            <Text className="mt-2 font-body text-[15px] leading-[22px] text-corpo">Não precisa saber as datas agora. Com os dias, o app já monta o roteiro.</Text>

            {!comDatas ? (
              <>
                <View className="mt-8 flex-row items-center justify-center gap-6">
                  <BotaoRedondo aoTocar={() => setDias(Math.max(1, dias - 1))}>
                    <Minus size={22} color={cor.texto} />
                  </BotaoRedondo>
                  <View className="w-32 items-center">
                    <Text className="font-display text-[72px] leading-[78px] text-texto">{dias}</Text>
                    <Text className="font-body-semibold text-[14px] text-suave">{dias === 1 ? 'dia' : 'dias'}</Text>
                  </View>
                  <BotaoRedondo aoTocar={() => setDias(Math.min(30, dias + 1))}>
                    <Plus size={22} color={cor.texto} />
                  </BotaoRedondo>
                </View>
                <View className="mt-7 flex-row flex-wrap justify-center gap-2">
                  {DIAS_RAPIDOS.map((n) => (
                    <Pressable
                      key={n}
                      onPress={() => setDias(n)}
                      className={`min-h-[40px] justify-center rounded-full border-[1.5px] px-4 ${dias === n ? 'border-couro bg-couro' : 'border-borda bg-cartao'}`}
                    >
                      <Text className={`font-body-semibold text-[14px] ${dias === n ? 'text-white' : 'text-texto'}`}>{n} dias</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : (
              <View className="mt-5">
                <Calendario mes={mes} setMes={setMes} ida={ida} volta={volta} aoTocar={tocarDia} />
                <View className="mt-3 flex-row items-center gap-3 rounded-2xl bg-areia p-4">
                  <Calendar size={22} color={cor.couro} />
                  <Text className="flex-1 font-body-bold text-[15px] text-texto">
                    {ida ? (volta ? `${fmt(ida)} a ${fmt(volta)} · ${diasDasDatas} dias` : `Ida em ${fmt(ida)} · toque na volta`) : 'Toque na ida e depois na volta'}
                  </Text>
                </View>
              </View>
            )}

            <Pressable onPress={() => setComDatas(!comDatas)} className="mt-6 min-h-[44px] flex-row items-center justify-center gap-2">
              <Calendar size={18} color={cor.couro} />
              <Text className="font-body-bold text-[15px] text-couro">{comDatas ? 'Ainda não sei as datas' : 'Já sei as datas'}</Text>
            </Pressable>
            {erro ? <Text className="mt-3 text-center font-body-medium text-[13px] text-vermelho">{erro}</Text> : null}
          </ScrollView>
          <View className="px-6 pt-3" style={{ paddingBottom: insets.bottom + 20 }}>
            <Botao titulo="Escolher os lugares" aoTocar={criar} carregando={criando} desabilitado={comDatas && !diasDasDatas} />
            <Text className="mt-2 text-center font-body text-[13px] text-suave">Próximo: deslize os lugares de {destino?.nome} e o roteiro se monta.</Text>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  )
}

function EtapaDestino({
  primeira,
  busca,
  setBusca,
  achadas,
  aoEscolher,
  aoEntrarNoConvite,
}: {
  primeira: boolean
  busca: string
  setBusca: (t: string) => void
  achadas: CidadeDaLista[]
  aoEscolher: (c: { nome: string; pais: string | null }) => void
  aoEntrarNoConvite: (viagemId: string) => void
}) {
  const [comCodigo, setComCodigo] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [entrando, setEntrando] = useState(false)
  const digitado = busca.trim()

  async function entrarComCodigo() {
    // Aceita o código puro ou o link inteiro (…/convite/<código>)
    const limpo = codigo.trim().split('/').filter(Boolean).pop() ?? ''
    if (!limpo) return
    setErro(null)
    setEntrando(true)
    try {
      aoEntrarNoConvite(await aceitarConvite(supabase, limpo))
    } catch {
      setErro('Esse convite não vale mais ou está errado. Peça um novo link.')
      setEntrando(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      {primeira ? (
        <View className="mb-2 flex-row items-end gap-3">
          <View className="-ml-2">
            <Norti humor="feliz" tamanho={84} sombra={false} />
          </View>
          <View className="mb-3 flex-1 rounded-2xl rounded-bl-sm bg-cartao px-4 py-3" style={{ boxShadow: '0 4px 14px rgba(74,46,20,0.08)' }}>
            <Text className="font-body-semibold text-[14px] leading-5 text-texto">Oi! Vamos montar a primeira viagem. Leva 1 minuto.</Text>
          </View>
        </View>
      ) : null}
      <Text className="font-display text-[34px] leading-[38px] text-texto">Pra onde vocês vão?</Text>
      <Text className="mb-5 mt-2 font-body text-[15px] text-corpo">Uma cidade pra começar. As outras entram depois.</Text>
      <Campo icone={<Search size={20} color={cor.couro} />} placeholder="Buscar cidade" value={busca} onChangeText={setBusca} autoCorrect={false} returnKeyType="next" onSubmitEditing={() => digitado.length > 1 && aoEscolher({ nome: digitado, pais: null })} />

      {digitado.length > 1 ? (
        <View className="mt-3">
          {achadas.map((c) => (
            <Linha key={`${c.nome}-${c.pais}`} titulo={c.nome} sub={NOME_EM_PORTUGUES[c.pais] ?? c.pais} aoTocar={() => aoEscolher(c)} />
          ))}
          {!achadas.some((c) => semAcento(c.nome) === semAcento(digitado)) ? (
            <Linha titulo={`Usar “${digitado}”`} sub="Vale qualquer cidade, região ou parque" aoTocar={() => aoEscolher({ nome: digitado, pais: null })} />
          ) : null}
        </View>
      ) : (
        <>
          <Text className="mb-3 mt-7 font-body-bold text-[12px] uppercase tracking-[1.4px] text-suave">Mais escolhidos</Text>
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {SUGESTOES.map((s) => (
              <Pressable key={s.nome} onPress={() => aoEscolher(s)} className="active:opacity-90" style={{ width: '48.3%' }}>
                <LinearGradient colors={s.cores} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 112, borderRadius: 20, padding: 14, justifyContent: 'flex-end' }}>
                  <Text className="font-display text-[20px] leading-[23px] text-white">{s.nome}</Text>
                  <Text className="mt-0.5 font-body text-[12px] text-creme">{s.frase}</Text>
                </LinearGradient>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {primeira ? (
        <View className="mt-8 gap-2">
          {comCodigo ? (
            <>
              <Campo icone={<Ticket size={20} color={cor.suave} />} placeholder="Código ou link do convite" value={codigo} onChangeText={setCodigo} autoCapitalize="none" onSubmitEditing={entrarComCodigo} />
              {erro ? <Text className="font-body-medium text-[13px] text-vermelho">{erro}</Text> : null}
              <Botao titulo="Entrar na viagem" tipo="secundario" aoTocar={entrarComCodigo} carregando={entrando} />
            </>
          ) : (
            <Pressable onPress={() => setComCodigo(true)} className="min-h-[44px] flex-row items-center justify-center gap-2">
              <Ticket size={18} color={cor.couro} />
              <Text className="font-body-bold text-[15px] text-couro">Recebi um convite de viagem</Text>
            </Pressable>
          )}
        </View>
      ) : null}
    </ScrollView>
  )
}

function Linha({ titulo, sub, aoTocar }: { titulo: string; sub: string; aoTocar: () => void }) {
  return (
    <Pressable onPress={aoTocar} className="min-h-[56px] flex-row items-center gap-3 border-b border-[#EFE3D0] py-3 active:opacity-80">
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-chip">
        <MapPin size={20} color={cor.couro} />
      </View>
      <View className="flex-1">
        <Text className="font-body-bold text-[15px] text-texto">{titulo}</Text>
        <Text className="font-body text-[13px] text-suave">{sub}</Text>
      </View>
    </Pressable>
  )
}

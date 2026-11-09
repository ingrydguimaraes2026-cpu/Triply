import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Check, Pencil, Plus } from '../src/ui/icones'
import { buscarTrajetos, diaNoFuso, duracaoCurta, FOLGA_MINIMA, horaNoFuso, nomeDoMeio, type Tables } from '@together/core'
import { useCarregar } from '../src/dados/useCarregar'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { diaLongo, lerData } from '../src/lib/formato'
import { supabase } from '../src/lib/supabase'
import { StatusBar } from '../src/ui/StatusBar'
import { Botao, BotaoRedondo, Carregando, ErroNaTela } from '../src/ui/pecas'
import { cor } from '../theme'

// Spec 122c: comparar as opções de um deslocamento lado a lado (folga, último do dia, trocas,
// de quanto em quanto tempo passa, preço) e escolher com 1 toque.
// Rota: /comparar?grupo=<grupo_opcoes>

type Trajeto = Tables<'trajetos'>
const SIMBOLO: Record<string, string> = { EUR: '€', BRL: 'R$', USD: 'US$' }

async function carregar(viagemId: string, grupo: string) {
  const todos = (await buscarTrajetos(supabase, viagemId, { comOpcoes: true })) as Trajeto[]
  const opcoes = todos.filter((t) => t.grupo_opcoes === grupo).sort((a, b) => (a.partida ?? '9').localeCompare(b.partida ?? '9'))
  return { todos, opcoes }
}

// Folga de cada opção: do deslocamento anterior no mesmo dia (fora do grupo) até a saída da opção
function folgaDa(opcao: Trajeto, todos: Trajeto[]): { minutos: number; de: string } | null {
  if (!opcao.partida) return null
  const dia = diaNoFuso(opcao.partida)
  const anteriores = todos.filter((t) => t.grupo_opcoes !== opcao.grupo_opcoes && t.chegada && t.partida && diaNoFuso(t.partida) === dia && t.chegada <= opcao.partida!)
  const anterior = anteriores.sort((a, b) => b.chegada!.localeCompare(a.chegada!))[0]
  if (!anterior) return null
  return { minutos: Math.round((new Date(opcao.partida).getTime() - new Date(anterior.chegada!).getTime()) / 60000), de: anterior.de_texto ?? '' }
}

export default function Comparar() {
  const { atual: viagem } = useViagemAtual()
  const { grupo } = useLocalSearchParams<{ grupo: string }>()
  const carga = useCarregar(viagem && grupo ? () => carregar(viagem.id, grupo) : null, [viagem?.id, grupo])
  if (!viagem || !grupo) return <ErroNaTela aoTentar={() => {}} />
  if (carga.status === 'carregando') return <Carregando />
  if (carga.status === 'erro') return <ErroNaTela aoTentar={carga.recarregar} />
  return <Tela {...carga.dados} grupo={grupo} aoMudar={carga.recarregar} />
}

function Tela({ todos, opcoes, grupo, aoMudar }: { todos: Trajeto[]; opcoes: Trajeto[]; grupo: string; aoMudar: () => void }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [salvando, setSalvando] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/'))

  if (!opcoes.length) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-fundo px-8">
        <Text className="text-center font-body text-[15px] text-corpo">Essas opções não existem mais.</Text>
        <Botao titulo="Voltar" aoTocar={voltar} compacto />
      </View>
    )
  }

  const base = opcoes[0]
  const dia = base.partida ? diaNoFuso(base.partida) : null
  const folgas = opcoes.map((o) => folgaDa(o, todos))
  const duracoes = opcoes.map((o) => (o.partida && o.chegada ? Math.round((new Date(o.chegada).getTime() - new Date(o.partida).getTime()) / 60000) : null))
  // Selos: só quando dá pra comparar (2 ou mais com o dado)
  const melhor = (valores: (number | null)[], maior: boolean) => {
    const com = valores.map((v, i) => ({ v, i })).filter((x) => x.v != null) as { v: number; i: number }[]
    if (com.length < 2) return -1
    return com.sort((a, b) => (maior ? b.v - a.v : a.v - b.v))[0].i
  }
  const maisFolga = melhor(folgas.map((f) => f?.minutos ?? null), true)
  const maisBarato = melhor(opcoes.map((o) => (o.preco != null ? Number(o.preco) : null)), false)
  const maisRapido = melhor(duracoes, false)
  const escolhida = opcoes.length > 1 && opcoes.some((o) => o.escolhida) && opcoes.some((o) => !o.escolhida) ? opcoes.find((o) => o.escolhida) : undefined

  async function escolher(o: Trajeto) {
    setSalvando(o.id)
    setErro(null)
    const a = await supabase.from('trajetos').update({ escolhida: false }).eq('grupo_opcoes', grupo)
    const b = a.error ? a : await supabase.from('trajetos').update({ escolhida: true, situacao: o.situacao === 'sugestao' ? 'decidido' : o.situacao }).eq('id', o.id)
    setSalvando(null)
    if (b.error) return setErro(b.error.code === '42501' ? 'Escolher só o ADM (ou quem ele liberou).' : 'Não deu pra escolher. Tente de novo.')
    aoMudar()
  }

  const q = encodeURIComponent
  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: insets.bottom + 40, gap: 12 }}>
        <View className="flex-row items-center justify-between">
          <BotaoRedondo aoTocar={voltar}>
            <ArrowLeft size={20} color={cor.texto} />
          </BotaoRedondo>
          {dia ? <Text className="font-body-medium text-[13px] text-suave">{diaLongo(lerData(dia))}</Text> : null}
        </View>
        <Text className="font-display text-[26px] leading-[30px] text-texto">{`${base.de_texto ?? 'Origem'} → ${base.para_texto ?? 'Destino'}`}</Text>
        <Text className="font-body text-[13px] text-suave">
          {escolhida ? 'Opção escolhida marcada. Dá pra trocar quando quiser.' : `${opcoes.length} ${opcoes.length === 1 ? 'opção' : 'opções'} · toque em "Ficar com esta" pra decidir`}
        </Text>

        {opcoes.map((o, i) => {
          const folga = folgas[i]
          const curta = folga != null && folga.minutos < FOLGA_MINIMA
          const eEscolhida = escolhida?.id === o.id
          const selos = [i === maisFolga ? 'Mais folga' : null, i === maisRapido ? 'Mais rápido' : null, i === maisBarato ? 'Mais barato' : null].filter(Boolean) as string[]
          return (
            <View key={o.id} className="gap-2.5 rounded-2xl bg-cartao p-3.5" style={{ borderWidth: eEscolhida ? 2 : 1.5, borderColor: eEscolhida ? cor.verde : cor.borda }}>
              {selos.length || eEscolhida ? (
                <View className="flex-row flex-wrap gap-1.5">
                  {eEscolhida ? <Selo texto="Escolhida" /> : null}
                  {selos.map((s) => (
                    <Selo key={s} texto={s} />
                  ))}
                </View>
              ) : null}
              <View className="flex-row items-center justify-between gap-2">
                <View className="min-w-0 flex-1">
                  <Text className="font-body-bold text-[15px] text-texto">{o.meio === 'metro' ? 'Metrô' : nomeDoMeio(o.meio)}</Text>
                  {o.observacao ? (
                    <Text className="font-body text-[12px] text-suave" numberOfLines={1}>
                      {o.observacao}
                    </Text>
                  ) : null}
                </View>
                {o.preco != null ? (
                  <Text className="font-body-bold text-[16px] text-texto">{`${SIMBOLO[o.moeda ?? ''] ?? o.moeda ?? ''} ${Number(o.preco).toLocaleString('pt-BR')}`}</Text>
                ) : null}
              </View>
              <View className="flex-row items-center gap-2">
                <Text className="font-body-bold text-[17px] text-texto">{o.partida ? horaNoFuso(o.partida) : '--:--'}</Text>
                <View className="h-[2px] flex-1 bg-borda" />
                {duracoes[i] != null ? <Text className="font-body-semibold text-[11px] text-suave">{duracaoCurta(duracoes[i]!)}</Text> : null}
                <View className="h-[2px] flex-1 bg-borda" />
                <Text className="font-body-bold text-[17px] text-texto">{o.chegada ? horaNoFuso(o.chegada) : '--:--'}</Text>
              </View>
              <View className="flex-row flex-wrap gap-1.5">
                {folga ? (
                  <Fato
                    ruim={curta}
                    bom={!curta}
                    titulo={folga.minutos < 0 ? 'Horários se cruzam' : `${duracaoCurta(folga.minutos)} de folga`}
                    texto={folga.de ? `depois de chegar de ${folga.de}` : 'depois do anterior'}
                  />
                ) : null}
                <Fato ruim={o.ultimo_do_dia} titulo={o.ultimo_do_dia ? 'Último do dia' : 'Tem outros depois'} texto={o.ultimo_do_dia ? 'perdeu, fica sem' : 'tem plano B'} />
                {o.trocas != null ? <Fato titulo={o.trocas === 0 ? 'Direto' : `${o.trocas} ${o.trocas === 1 ? 'troca' : 'trocas'}`} texto="" /> : null}
                {o.frequencia_min ? <Fato titulo={o.frequencia_min % 60 === 0 ? `A cada ${o.frequencia_min / 60}h` : `A cada ${o.frequencia_min} min`} texto="passa" /> : null}
                {o.chegada && o.partida && diaNoFuso(o.chegada) !== diaNoFuso(o.partida) ? <Fato titulo="Chega no dia seguinte" texto="madrugada" /> : null}
              </View>
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Botao
                    titulo={eEscolhida ? 'Escolhida' : 'Ficar com esta'}
                    icone={<Check size={16} color={eEscolhida ? cor.couro : '#fff'} />}
                    tipo={eEscolhida ? 'secundario' : 'primario'}
                    aoTocar={() => void escolher(o)}
                    carregando={salvando === o.id}
                    desabilitado={eEscolhida || !!salvando}
                    compacto
                  />
                </View>
                <Pressable
                  onPress={() => router.push(`/novo-deslocamento?trajeto=${o.id}` as never)}
                  accessibilityLabel="Editar opção"
                  className="h-11 w-11 items-center justify-center rounded-xl border border-borda bg-cartao active:opacity-80"
                >
                  <Pencil size={16} color={cor.couro} />
                </Pressable>
              </View>
            </View>
          )
        })}

        {erro ? <Text className="font-body text-[13px] text-vermelho">{erro}</Text> : null}
        <Pressable
          onPress={() => router.push(`/novo-deslocamento?dia=${dia ?? ''}&grupo=${grupo}&de=${q(base.de_texto ?? '')}&para=${q(base.para_texto ?? '')}` as never)}
          className="flex-row items-center justify-center gap-2 rounded-2xl border border-dashed border-borda py-3.5 active:opacity-80"
        >
          <Plus size={17} color={cor.couro} />
          <Text className="font-body-bold text-[14px] text-couro">Outra opção</Text>
        </Pressable>
      </ScrollView>
    </View>
  )
}

function Selo({ texto }: { texto: string }) {
  return (
    <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: '#EEF0DF' }}>
      <Text className="font-body-bold text-[11px]" style={{ color: '#5E6B2E' }}>
        {texto}
      </Text>
    </View>
  )
}

function Fato({ titulo, texto, ruim, bom }: { titulo: string; texto: string; ruim?: boolean; bom?: boolean }) {
  const fundo = ruim ? cor.vermelhoFundo : bom ? '#EEF0DF' : cor.fundo
  const corTexto = ruim ? cor.vermelho : bom ? '#5E6B2E' : cor.texto
  return (
    <View className="rounded-xl px-2.5 py-1.5" style={{ backgroundColor: fundo, minWidth: '47%', flexGrow: 1 }}>
      <Text className="font-body-bold text-[12.5px]" style={{ color: corTexto }}>
        {titulo}
      </Text>
      {texto ? (
        <Text className="font-body text-[11px]" style={{ color: ruim || bom ? corTexto : cor.suave }}>
          {texto}
        </Text>
      ) : null}
    </View>
  )
}

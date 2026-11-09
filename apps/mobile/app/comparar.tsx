import { useCallback, useRef, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Check, Pencil, Plus } from '../src/ui/icones'
import { buscarTrajetos, compararOpcoes, diaNoFuso, duracaoCurta, escolherOpcaoDoDeslocamento, horaNoFuso, nomeDoMeio, type Tables } from '@together/core'
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
  const { data: v } = await supabase.from('viagens').select('membro_edita_transportes').eq('id', viagemId).maybeSingle()
  return { todos, opcoes, membroEdita: !!v?.membro_edita_transportes }
}

export default function Comparar() {
  const { atual: viagem } = useViagemAtual()
  const { grupo } = useLocalSearchParams<{ grupo: string }>()
  const carga = useCarregar(viagem && grupo ? () => carregar(viagem.id, grupo) : null, [viagem?.id, grupo])
  // Voltou de editar uma opção: busca de novo
  const primeiraVez = useRef(true)
  const { recarregar } = carga
  useFocusEffect(
    useCallback(() => {
      if (primeiraVez.current) primeiraVez.current = false
      else recarregar()
    }, [recarregar]),
  )
  if (!viagem || !grupo) return <ErroNaTela aoTentar={() => {}} />
  if (carga.status === 'carregando') return <Carregando />
  if (carga.status === 'erro') return <ErroNaTela aoTentar={carga.recarregar} />
  return <Tela {...carga.dados} grupo={grupo} aoMudar={carga.recarregar} />
}

function Tela({ todos, opcoes, grupo, aoMudar, membroEdita }: { todos: Trajeto[]; opcoes: Trajeto[]; grupo: string; aoMudar: () => void; membroEdita: boolean }) {
  const router = useRouter()
  const { atual, meuId } = useViagemAtual()
  // Escolher a opção é decidir: só o ADM ou quem ele liberou. Membro vê e sugere outra.
  const podeDecidir = membroEdita || !!atual?.membros.some((m) => m.id === meuId && m.papel === 'adm')
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
  // Folga, duração, selos e a escolhida: lógica no @together/core (o site usa a mesma)
  const linhas = compararOpcoes(opcoes, todos)
  const folgas = linhas.map((l) => l.folga)
  const duracoes = linhas.map((l) => l.duracao)
  const escolhida = linhas.find((l) => l.escolhida)?.opcao

  async function escolher(o: Trajeto) {
    setSalvando(o.id)
    setErro(null)
    try {
      await escolherOpcaoDoDeslocamento(supabase, grupo, o)
    } catch (e) {
      setSalvando(null)
      return setErro((e as { code?: string }).code === '42501' ? 'Só o ADM escolhe (ou quem ele liberou).' : 'Não deu pra escolher. Tente de novo.')
    }
    setSalvando(null)
    aoMudar()
  }

  const q = encodeURIComponent
  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: insets.bottom + 40, gap: 12 }}>
        <View className="flex-row items-center justify-between">
          <BotaoRedondo aoTocar={voltar} rotulo="Voltar">
            <ArrowLeft size={20} color={cor.texto} />
          </BotaoRedondo>
          {dia ? <Text className="font-body-medium text-[13px] text-suave">{diaLongo(lerData(dia))}</Text> : null}
        </View>
        <Text className="font-display text-[26px] leading-[30px] text-texto">{`${base.de_texto ?? 'Origem'} → ${base.para_texto ?? 'Destino'}`}</Text>
        <Text className="font-body text-[13px] text-suave">
          {escolhida ? 'Opção escolhida marcada. Dá pra trocar quando quiser.' : `${opcoes.length} ${opcoes.length === 1 ? 'opção' : 'opções'} · ${podeDecidir ? 'toque em "Ficar com esta" pra decidir' : 'quem escolhe é o ADM'}`}
        </Text>

        {opcoes.map((o, i) => {
          const folga = folgas[i]
          const curta = linhas[i].folgaCurta
          const eEscolhida = escolhida?.id === o.id
          const selos = linhas[i].selos
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
                  {podeDecidir || eEscolhida ? (
                  <Botao
                    titulo={eEscolhida ? 'Escolhida' : 'Ficar com esta'}
                    icone={<Check size={16} color={eEscolhida ? cor.couro : '#fff'} />}
                    tipo={eEscolhida ? 'secundario' : 'primario'}
                    aoTocar={() => void escolher(o)}
                    carregando={salvando === o.id}
                    desabilitado={eEscolhida || !!salvando || !podeDecidir}
                    compacto
                  />
                  ) : null}
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

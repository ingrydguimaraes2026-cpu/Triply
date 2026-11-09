import { useEffect, useMemo, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ActivityIndicator } from 'react-native'
import { ArrowLeft, ArrowLeftRight, Bus, Car, ChevronDown, ChevronLeft, ChevronRight, Footprints, Plus, Ship, TrainFront, Trash2, type LucideIcon } from '../src/ui/icones'
import {
  acharLugar,
  buscarDestinos,
  buscarJeitosDeIr,
  buscarLugares,
  buscarTrajetos,
  diaNoFuso,
  duracaoCurta,
  frequenciaEstimada,
  horaNoFuso,
  livreNoDia,
  MEIOS_DE_TRANSPORTE,
  naoDaTempo,
  type Destino,
  type JeitoDeIr,
  type Lugar,
  type MeioDoJeito,
  type Saida,
  type Tables,
} from '@together/core'
import { useCarregar } from '../src/dados/useCarregar'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { diaLongo, lerData, paraIso } from '../src/lib/formato'
import { supabase } from '../src/lib/supabase'
import { StatusBar } from '../src/ui/StatusBar'
import { normalizarHora } from '../src/ui/FormEvento'
import { Botao, BotaoRedondo, Campo, Carregando, ErroNaTela } from '../src/ui/pecas'
import { cor } from '../theme'

// Spec 122a: novo deslocamento (ou editar um). De e para em texto livre: qualquer lugar pra qualquer
// lugar ("Varenna → Bellagio"), com sugestões dos destinos e lugares da viagem.
// Rota: /novo-deslocamento?dia=AAAA-MM-DD[&trajeto=<id>][&grupo=<id>&de=&para=]
// Spec 122c/122e: dois passos. 1) De, para e dia: as opções aparecem sozinhas, por meio (trem, ônibus,
// carro, táxi, a pé), com as saídas exatas. 2) Tocou numa, ela vem preenchida: à vista só preço e "Já comprei";
// meio, horários, trocas, situação e observação ficam em "Mais detalhes". "Guardar como opção" junta opções (/comparar).

type Trajeto = Tables<'trajetos'>
type Ponto = { nome: string; latitude: number | null; longitude: number | null }

const MEIOS = MEIOS_DE_TRANSPORTE.filter((m) => m.chave !== 'carona').flatMap((m) => (m.chave === 'onibus' ? [m, { chave: 'metro', nome: 'Metrô' }] : [m]))
const SITUACOES = [
  { chave: 'sugestao', nome: 'Pra decidir' },
  { chave: 'decidido', nome: 'Decidido' },
  { chave: 'reservado', nome: 'Reservado' },
  { chave: 'comprado', nome: 'Comprado' },
]
const TROCAS = [
  { valor: null, nome: 'Não sei' },
  { valor: 0, nome: 'Direto' },
  { valor: 1, nome: '1 troca' },
  { valor: 2, nome: '2 trocas' },
  { valor: 3, nome: '3 ou mais' },
]
const NOME_DO_JEITO: Record<MeioDoJeito, string> = { trem: 'Trem', onibus: 'Ônibus', barco: 'Barco', metro: 'Metrô', carro: 'Carro', taxi: 'Táxi', a_pe: 'A pé' }
const ICONE_DO_JEITO: Record<MeioDoJeito, LucideIcon> = { trem: TrainFront, onibus: Bus, barco: Ship, metro: TrainFront, carro: Car, taxi: Car, a_pe: Footprints }
const SIMBOLO: Record<string, string> = { EUR: '€', BRL: 'R$', USD: 'US$' }

// Id novo pras opções do mesmo deslocamento (não precisa ser criptográfico)
function idNovo() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

async function carregar(viagemId: string, trajetoId: string | undefined) {
  const [destinos, lugares, trajetos] = await Promise.all([buscarDestinos(supabase, viagemId), buscarLugares(supabase, viagemId), buscarTrajetos(supabase, viagemId, { comOpcoes: true })])
  const trajeto = trajetoId ? ((trajetos as Trajeto[]).find((t) => t.id === trajetoId) ?? null) : null
  // Spec 122: membro sugere; decidir e comprar é do ADM ou de quem ele liberou
  const { data: v } = await supabase.from('viagens').select('membro_edita_transportes').eq('id', viagemId).maybeSingle()
  return { destinos, lugares, trajetos: trajetos as Trajeto[], trajeto, membroEdita: !!v?.membro_edita_transportes }
}

export default function NovoDeslocamento() {
  const { atual: viagem } = useViagemAtual()
  const params = useLocalSearchParams<{ dia?: string; trajeto?: string; grupo?: string; de?: string; para?: string }>()
  const carga = useCarregar(viagem ? () => carregar(viagem.id, params.trajeto) : null, [viagem?.id, params.trajeto])
  if (!viagem) return <ErroNaTela aoTentar={() => {}} />
  if (carga.status === 'carregando') return <Carregando />
  if (carga.status === 'erro') return <ErroNaTela aoTentar={carga.recarregar} />
  return <Formulario {...carga.dados} viagemId={viagem.id} moeda={viagem.moeda} diaInicial={params.dia} grupo={params.grupo} deInicial={params.de} paraInicial={params.para} />
}

function Formulario({
  destinos,
  lugares,
  trajeto,
  viagemId,
  moeda,
  diaInicial,
  trajetos,
  grupo,
  deInicial,
  paraInicial,
  membroEdita,
}: {
  destinos: Destino[]
  lugares: Lugar[]
  trajeto: Trajeto | null
  trajetos: Trajeto[]
  viagemId: string
  moeda: string
  diaInicial?: string
  grupo?: string
  deInicial?: string
  paraInicial?: string
  membroEdita: boolean
}) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { meuId, atual } = useViagemAtual()
  const euSouAdm = !!atual?.membros.some((m) => m.id === meuId && m.papel === 'adm')
  const nomeDoDestino = (id: string | null) => destinos.find((d) => d.id === id)?.nome ?? ''

  const [dia, setDia] = useState(trajeto?.partida ? diaNoFuso(trajeto.partida) : (diaInicial ?? atual?.dataInicio ??diaNoFuso(new Date().toISOString())))
  // Dois passos: 1) de, para e dia → as opções aparecem sozinhas; 2) a escolhida, pronta pra editar.
  // Editando um que já existe, abre direto no passo 2.
  const [etapa, setEtapa] = useState<'buscar' | 'detalhes'>(trajeto ? 'detalhes' : 'buscar')
  const [maisDetalhes, setMaisDetalhes] = useState(false)
  const [escolhido, setEscolhido] = useState<string | null>(null) // "Trem · 6:10 → 9:30 · direto"
  const [de, setDe] = useState<Ponto>({ nome: trajeto?.de_texto ?? (nomeDoDestino(trajeto?.origem_id ?? null) || deInicial || ''), latitude: trajeto?.de_lat ?? null, longitude: trajeto?.de_lon ?? null })
  const [para, setPara] = useState<Ponto>({ nome: trajeto?.para_texto ?? (nomeDoDestino(trajeto?.destino_id ?? null) || paraInicial || ''), latitude: trajeto?.para_lat ?? null, longitude: trajeto?.para_lon ?? null })
  const [focado, setFocado] = useState<'de' | 'para' | null>(null)
  const [meio, setMeio] = useState(trajeto?.meio ?? 'trem')
  const [saida, setSaida] = useState(trajeto?.partida ? horaNoFuso(trajeto.partida) : '')
  const [chegada, setChegada] = useState(trajeto?.chegada ? horaNoFuso(trajeto.chegada) : '')
  const [situacao, setSituacao] = useState(trajeto?.situacao ?? 'sugestao')
  const [trocas, setTrocas] = useState<number | null>(trajeto?.trocas ?? null)
  const [preco, setPreco] = useState(trajeto?.preco != null ? String(trajeto.preco).replace('.', ',') : '')
  const [ultimo, setUltimo] = useState(trajeto?.ultimo_do_dia ?? false)
  const [observacao, setObservacao] = useState(trajeto?.observacao ?? '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const podeDecidir = euSouAdm || membroEdita
  // Membro mexe só na sugestão que ele mesmo pôs
  const podeMexer = !trajeto || podeDecidir || (trajeto.criado_por === meuId && (trajeto.situacao ?? 'sugestao') === 'sugestao')
  const podeApagar = !!trajeto && (euSouAdm || membroEdita || trajeto.criado_por === meuId)
  const [frequencia, setFrequencia] = useState<number | null>(trajeto?.frequencia_min ?? null)
  const grupoAtual = grupo ?? trajeto?.grupo_opcoes ?? null

  // Spec 122c: jeitos de ir
  const [jeitos, setJeitos] = useState<JeitoDeIr[] | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [aberto, setAberto] = useState<MeioDoJeito | null>(null)
  const [semJeito, setSemJeito] = useState<string | null>(null)
  const buscaAtual = useRef(0) // só a última busca vale (digitou de novo no meio de uma busca)
  // A que horas o grupo fica livre: a última chegada de outro deslocamento nesse dia
  const livre = useMemo(() => livreNoDia(trajetos, dia, trajeto?.id ?? null, grupoAtual), [trajetos, trajeto?.id, dia, grupoAtual])
  // Ponto de referência pra achar lugar digitado: o destino do dia (ou o primeiro com coordenada)
  const referencia = useMemo(() => {
    const d = destinos.find((x) => x.chegada && x.chegada <= dia && (x.saida ?? x.chegada) >= dia && x.latitude != null) ?? destinos.find((x) => x.latitude != null)
    return d && d.latitude != null && d.longitude != null ? { latitude: d.latitude, longitude: d.longitude } : null
  }, [destinos, dia])

  // Sugestões: destinos e lugares da viagem (com coordenadas quando tiver)
  const pontos = useMemo<Ponto[]>(() => {
    const todos = [
      ...destinos.map((d) => ({ nome: d.nome, latitude: d.latitude, longitude: d.longitude })),
      ...lugares.map((l) => ({ nome: l.nome, latitude: l.latitude ?? null, longitude: l.longitude ?? null })),
    ]
    const vistos = new Set<string>()
    return todos.filter((p) => !vistos.has(p.nome.toLowerCase()) && vistos.add(p.nome.toLowerCase()))
  }, [destinos, lugares])
  const texto = focado === 'de' ? de.nome : focado === 'para' ? para.nome : ''
  const sugestoes = focado
    ? pontos.filter((p) => p.nome.toLowerCase() !== texto.trim().toLowerCase() && p.nome.toLowerCase().includes(texto.trim().toLowerCase())).slice(0, 6)
    : []

  // Chegada antes da saída = chega no dia seguinte (ônibus noturno)
  const hSaida = normalizarHora(saida)
  const hChegada = normalizarHora(chegada)
  const diaSeguinte = !!hSaida && !!hChegada && hChegada < hSaida
  // Sem hora escolhida (carro, à mão): vale a hora em que o grupo fica livre no dia, ou 9h
  const horaPadrao = livre ? horaNoFuso(livre.quando) : '09:00'

  function horario(hora: string, maisUmDia = false) {
    const d = new Date(`${dia}T${hora}:00`)
    if (maisUmDia) d.setDate(d.getDate() + 1)
    return d.toISOString()
  }

  async function acharJeitos() {
    if (!de.nome.trim() || !para.nome.trim()) return setErro('Diga de onde e pra onde.')
    const minha = ++buscaAtual.current
    setErro(null)
    setSemJeito(null)
    setBuscando(true)
    setAberto(null)
    try {
      const ponto = async (p: Ponto, setP: (p: Ponto) => void) => {
        if (p.latitude != null && p.longitude != null) return { latitude: p.latitude, longitude: p.longitude }
        // Nome igual a um destino ou lugar da viagem: usa a coordenada que já temos (o mapa do mundo erra "Veneza")
        const daViagem = pontos.find((x) => x.nome.trim().toLowerCase() === p.nome.trim().toLowerCase() && x.latitude != null && x.longitude != null)
        if (daViagem) {
          setP(daViagem)
          return { latitude: daViagem.latitude!, longitude: daViagem.longitude! }
        }
        const achado = await acharLugar(p.nome, referencia)
        if (achado) setP({ nome: p.nome, latitude: achado.latitude, longitude: achado.longitude })
        return achado
      }
      const [a, b] = await Promise.all([ponto(de, setDe), ponto(para, setPara)])
      if (!a || !b) return setSemJeito('Não achamos esses lugares no mapa. Confira os nomes ou cadastre à mão.')
      // Busca a partir de meia hora antes de o grupo ficar livre (sem nada antes no dia, desde as 6h30)
      const base = livre ? livre.quando : horario('07:00')
      const quando = new Date(new Date(base).getTime() - 30 * 60000).toISOString()
      const lista = await buscarJeitosDeIr(a, b, quando, moeda)
      if (minha !== buscaAtual.current) return
      setJeitos(lista)
      if (!lista.length) setSemJeito('Não achamos jeitos de ir entre esses lugares. Cadastre à mão.')
      else if (!lista.some((j) => j.saidas.length)) setSemJeito('Sem horários de trem ou ônibus nesse trecho (balsa e ônibus local às vezes não aparecem). Cadastre à mão se for o caso.')
    } catch {
      setSemJeito('Não deu pra buscar agora. Confira a internet ou cadastre à mão.')
    } finally {
      if (minha === buscaAtual.current) setBuscando(false)
    }
  }

  // As opções aparecem sozinhas quando de, para e dia estão preenchidos (sem botão, sem pedir hora)
  // Mudou de, para ou dia: as opções se atualizam sozinhas (espera a pessoa parar de digitar)
  const chaveDaBusca = etapa === 'buscar' && de.nome.trim().length > 1 && para.nome.trim().length > 1 ? `${de.nome.trim()}|${para.nome.trim()}|${dia}` : null
  useEffect(() => {
    if (!chaveDaBusca) return
    const t = setTimeout(() => void acharJeitos(), 900)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveDaBusca])

  // Mexeu em de, para ou dia depois de escolher: volta pras opções (que já se atualizam)
  function reabrirOpcoes() {
    if (etapa === 'buscar') return
    setEtapa('buscar')
    setEscolhido(null)
    setErro(null)
  }
  function mudarDe(p: Ponto) {
    setDe(p)
    reabrirOpcoes()
  }
  function mudarPara(p: Ponto) {
    setPara(p)
    reabrirOpcoes()
  }
  function mudarDia(passo: number) {
    const d = lerData(dia)
    d.setDate(d.getDate() + passo)
    setDia(paraIso(d))
    reabrirOpcoes()
  }

  // Tocar numa saída preenche tudo e vai pro passo 2
  function usarSaida(s: Saida, jeito: JeitoDeIr) {
    setEscolhido(`${NOME_DO_JEITO[s.meio]} · ${horaNoFuso(s.sai)} → ${horaNoFuso(s.chega)}${diaNoFuso(s.chega) !== diaNoFuso(s.sai) ? ' (+1 dia)' : ''} · ${s.trocas === 0 ? 'direto' : s.trocas === 1 ? '1 troca' : `${s.trocas} trocas`}`)
    setEtapa('detalhes')
    setMeio(s.meio === 'metro' ? 'metro' : s.meio)
    setSaida(horaNoFuso(s.sai))
    setChegada(horaNoFuso(s.chega))
    setTrocas(Math.min(s.trocas, 3))
    setFrequencia(jeito.frequenciaMin ?? frequenciaEstimada(jeito.saidas))
    setUltimo(false)
    const nota = [s.linhas.slice(0, 2).join(' + '), s.trocaEm.length ? `troca em ${s.trocaEm.join(', ')}` : ''].filter(Boolean).join(' · ')
    setObservacao(nota.slice(0, 200))
  }
  function usarRota(jeito: JeitoDeIr) {
    setEscolhido(`${NOME_DO_JEITO[jeito.meio]} · ${duracaoCurta(jeito.minutos)}${jeito.preco ? ' · preço estimado' : ''}`)
    setEtapa('detalhes')
    // Carro, táxi e a pé não têm horário fixo: a pessoa diz que horas sai
    setMeio(jeito.meio === 'a_pe' ? 'a_pe' : 'carro')
    setTrocas(0)
    const sai = hSaida || horaPadrao
    setSaida(sai)
    setChegada(horaNoFuso(new Date(new Date(horario(sai)).getTime() + jeito.minutos * 60000).toISOString()))
    if (jeito.preco) setPreco(String(jeito.preco.valor))
    setObservacao(jeito.meio === 'taxi' ? 'Táxi' : jeito.meio === 'carro' && jeito.km != null ? `${String(jeito.km).replace('.', ',')} km` : '')
  }

  async function salvarComoOpcao() {
    // Opções do mesmo deslocamento dividem o `grupo_opcoes`; nenhuma escolhida = "comparando"
    const g = grupoAtual ?? idNovo()
    if (trajeto) {
      // Editando: este vira a 1ª opção e abre uma opção nova, em branco, com o mesmo de/para
      if (!trajeto.grupo_opcoes) {
        const { error } = await supabase.from('trajetos').update({ grupo_opcoes: g, escolhida: false }).eq('id', trajeto.id)
        if (error) return setErro('Não deu pra guardar. Tente de novo.')
      }
      const q = encodeURIComponent
      return router.replace(`/novo-deslocamento?dia=${dia}&grupo=${g}&de=${q(de.nome)}&para=${q(para.nome)}` as never)
    }
    await salvar({ grupo_opcoes: g, escolhida: false, situacao: 'sugestao' }, false, g)
  }

  async function salvar(extra: Partial<Trajeto> = {}, novaMesmoEditando = false, irPraComparar?: string) {
    if (!de.nome.trim() || !para.nome.trim()) return setErro('Diga de onde e pra onde.')
    const valor = preco.trim() ? Number(preco.replace(/\./g, '').replace(',', '.')) : null
    if (valor != null && (Number.isNaN(valor) || valor < 0)) return setErro('Preço inválido. Ex.: 29,90')
    setErro(null)
    setSalvando(true)
    const dados = {
      de_texto: de.nome.trim(),
      para_texto: para.nome.trim(),
      de_lat: de.latitude,
      de_lon: de.longitude,
      para_lat: para.latitude,
      para_lon: para.longitude,
      meio,
      partida: horario(hSaida || horaPadrao),
      chegada: hChegada && hSaida ? horario(hChegada, diaSeguinte) : null,
      situacao,
      trocas,
      preco: valor,
      moeda: valor != null ? (trajeto?.moeda ?? moeda) : null,
      ultimo_do_dia: ultimo,
      observacao: observacao.trim() || null,
      frequencia_min: frequencia,
      ...(grupo && !trajeto ? { grupo_opcoes: grupo, escolhida: false } : {}),
      ...extra,
    }
    const { error } =
      trajeto && !novaMesmoEditando
      ? await supabase.from('trajetos').update(dados).eq('id', trajeto.id)
      : await supabase.from('trajetos').insert({ ...dados, viagem_id: viagemId, tipo: 'trecho' })
    setSalvando(false)
    if (error) {
      console.error('Erro ao salvar o deslocamento:', error)
      return setErro(
        error.code === '42501' ? 'Não deu: decidir e comprar é com o ADM. Você pode deixar como sugestão.' : 'Não deu pra salvar. Confira a internet e tente de novo.',
      )
    }
    const g = irPraComparar ?? grupo
    if (g) return router.replace(`/comparar?grupo=${g}` as never)
    voltar()
  }

  async function apagar() {
    if (!trajeto) return
    setSalvando(true)
    const { error } = await supabase.from('trajetos').delete().eq('id', trajeto.id)
    setSalvando(false)
    if (error) return setErro('Não deu pra apagar. Tente de novo.')
    voltar()
  }

  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/'))
  const trocar = () => {
    setDe(para)
    setPara(de)
    reabrirOpcoes()
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: insets.bottom + 40, gap: 12 }}>
        <View className="flex-row items-center justify-between">
          <BotaoRedondo aoTocar={voltar} rotulo="Voltar">
            <ArrowLeft size={20} color={cor.texto} />
          </BotaoRedondo>
        </View>
        <Text className="font-display text-[28px] leading-[32px] text-texto">{trajeto ? 'Deslocamento' : grupo ? 'Outra opção' : 'Novo deslocamento'}</Text>

        {/* Passo 1: de onde, pra onde, que dia */}
        <View className="gap-2">
          <Campo
            value={de.nome}
            onChangeText={(v) => mudarDe({ nome: v, latitude: null, longitude: null })}
            onFocus={() => setFocado('de')}
            onBlur={() => setTimeout(() => setFocado(null), 200)}
            placeholder="De onde? (cidade, estação, lugar)"
            direita={
              <Pressable onPress={trocar} accessibilityLabel="Trocar de e para" hitSlop={8}>
                <ArrowLeftRight size={18} color={cor.couro} />
              </Pressable>
            }
          />
          {focado === 'de' ? <Sugestoes lista={sugestoes} aoEscolher={(p) => mudarDe(p)} /> : null}
          <Campo
            value={para.nome}
            onChangeText={(v) => mudarPara({ nome: v, latitude: null, longitude: null })}
            onFocus={() => setFocado('para')}
            onBlur={() => setTimeout(() => setFocado(null), 200)}
            placeholder="Pra onde?"
          />
          {focado === 'para' ? <Sugestoes lista={sugestoes} aoEscolher={(p) => mudarPara(p)} /> : null}
          <View className="flex-row items-center justify-between rounded-2xl border border-borda bg-cartao px-2 py-1.5">
            <Pressable onPress={() => mudarDia(-1)} accessibilityLabel="Dia anterior" hitSlop={8} className="p-2 active:opacity-70">
              <ChevronLeft size={18} color={cor.couro} />
            </Pressable>
            <Text className="font-body-bold text-[14px] text-texto">{diaLongo(lerData(dia))}</Text>
            <Pressable onPress={() => mudarDia(1)} accessibilityLabel="Próximo dia" hitSlop={8} className="p-2 active:opacity-70">
              <ChevronRight size={18} color={cor.couro} />
            </Pressable>
          </View>
        </View>

        {etapa === 'buscar' ? (
          <>
            {/* As opções aparecem sozinhas, por meio (trem, ônibus, carro…), com os horários */}
            {buscando ? (
              <View className="flex-row items-center gap-2 py-2">
                <ActivityIndicator color={cor.couro} />
                <Text className="font-body text-[14px] text-suave">Procurando o que tem…</Text>
              </View>
            ) : null}
            {!buscando && jeitos?.length && livre ? (
              <Text className="font-body text-[13px] text-suave">{`Vocês ficam livres às ${horaNoFuso(livre.quando)}${livre.de ? ` (chegam de ${livre.de})` : ''}.`}</Text>
            ) : null}
            {!buscando
              ? jeitos?.map((j) => (
                  <CartaoDoJeito
                    key={j.meio}
                    jeito={j}
                    aberto={aberto === j.meio}
                    livreDesde={livre?.quando ?? null}
                    aoTocar={() => (j.saidas.length ? setAberto(aberto === j.meio ? null : j.meio) : usarRota(j))}
                    aoEscolher={(s) => usarSaida(s, j)}
                    horaEscolhida={saida}
                  />
                ))
              : null}
            {semJeito && !buscando ? <Text className="rounded-2xl bg-areia p-3 font-body text-[13px] leading-5 text-corpo">{semJeito}</Text> : null}
            {erro ? <Text className="font-body text-[13px] text-vermelho">{erro}</Text> : null}
            {de.nome.trim() && para.nome.trim() && !buscando ? (
              <Pressable
                onPress={() => {
                  setEscolhido(null)
                  setEtapa('detalhes')
                  setMaisDetalhes(true)
                }}
                className="flex-row items-center gap-3 rounded-2xl border border-dashed border-borda px-3 py-3 active:opacity-80"
              >
                <Plus size={18} color={cor.couro} />
                <View className="flex-1">
                  <Text className="font-body-bold text-[14px] text-texto">Não achei, vou digitar</Text>
                  <Text className="font-body text-[12px] text-suave">Balsa, avião ou o que não apareceu</Text>
                </View>
              </Pressable>
            ) : null}
          </>
        ) : (
          <>
            {/* Passo 2: a escolhida, já preenchida. Só o essencial à vista; o resto em "Mais detalhes". */}
            {escolhido || trajeto ? (
              <View className="flex-row items-center gap-3 rounded-2xl border-[1.5px] border-couro bg-cartao px-4 py-3">
                <View className="min-w-0 flex-1">
                  <Text className="font-body-bold text-[15px] text-texto">
                    {escolhido ?? `${MEIOS.find((m) => m.chave === meio)?.nome ?? 'Deslocamento'}${hSaida ? ` · ${hSaida}` : ''}${hChegada ? ` → ${hChegada}` : ''}`}
                  </Text>
                  {observacao ? (
                    <Text className="font-body text-[12.5px] text-suave" numberOfLines={2}>
                      {observacao}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  onPress={() => {
                    setEtapa('buscar')
                    setErro(null)
                  }}
                  hitSlop={8}
                  className="active:opacity-70"
                >
                  <Text className="font-body-bold text-[13px] text-couro">Trocar</Text>
                </Pressable>
              </View>
            ) : null}

            <View className="gap-2">
              <Rotulo texto={`Preço do grupo todo (${trajeto?.moeda ?? moeda})`} />
              <Campo value={preco} onChangeText={setPreco} placeholder="Opcional" keyboardType="decimal-pad" />
            </View>

            {!podeDecidir ? (
              <Text className="rounded-2xl bg-areia p-3 font-body text-[13px] leading-5 text-corpo">
                {podeMexer ? 'Vai como sugestão pro grupo. Quem decide e compra é o ADM.' : 'Só quem adicionou essa sugestão ou o ADM mexe nela.'}
              </Text>
            ) : null}

            {podeDecidir ? (
            <View className="flex-row items-center justify-between rounded-2xl border border-borda bg-cartao px-4 py-3">
              <View className="min-w-0 flex-1 pr-3">
                <Text className="font-body-bold text-[14px] text-texto">Já comprei</Text>
                <Text className="font-body text-[12.5px] text-suave">Fica nas Passagens como garantido.</Text>
              </View>
              <Switch
                value={situacao === 'comprado'}
                onValueChange={(v) => setSituacao(v ? 'comprado' : trajeto?.situacao && trajeto.situacao !== 'comprado' ? trajeto.situacao : 'sugestao')}
                trackColor={{ true: cor.couro, false: cor.borda }}
              />
            </View>
            ) : null}

            <Pressable onPress={() => setMaisDetalhes(!maisDetalhes)} accessibilityRole="button" className="flex-row items-center justify-between py-1 active:opacity-70">
              <Text className="font-body-bold text-[14px] text-couro">Mais detalhes</Text>
              <View style={{ transform: [{ rotate: maisDetalhes ? '180deg' : '0deg' }] }}>
                <ChevronDown size={18} color={cor.couro} />
              </View>
            </Pressable>

            {maisDetalhes ? (
              <View className="gap-3">
                <Rotulo texto="Transporte" />
                <Chips opcoes={MEIOS.map((m) => ({ chave: m.chave, nome: m.nome }))} valor={meio} aoMudar={setMeio} />

                <Rotulo texto="Trocas" />
                <Chips opcoes={TROCAS.map((t) => ({ chave: String(t.valor), nome: t.nome }))} valor={String(trocas)} aoMudar={(v) => setTrocas(v === 'null' ? null : Number(v))} />

                {podeDecidir ? (
                  <>
                    <Rotulo texto="Situação" />
                    <Chips opcoes={SITUACOES} valor={situacao} aoMudar={setSituacao} />
                  </>
                ) : null}

              </View>
            ) : null}

            {erro ? <Text className="font-body text-[13px] text-vermelho">{erro}</Text> : null}
            {podeMexer ? <Botao titulo={trajeto ? 'Salvar' : grupo ? 'Adicionar como opção' : podeDecidir ? 'Adicionar ao dia' : 'Sugerir pro grupo'} aoTocar={() => void salvar()} carregando={salvando} /> : null}
            {!grupo && podeMexer ? (
              <Botao titulo={trajeto ? 'Adicionar outra opção pra comparar' : 'Guardar como opção pra comparar'} tipo="secundario" aoTocar={() => void salvarComoOpcao()} desabilitado={salvando} />
            ) : null}
            {grupoAtual && trajeto ? (
              <Pressable onPress={() => router.push(`/comparar?grupo=${grupoAtual}` as never)} className="items-center py-1">
                <Text className="font-body-bold text-[14px] text-couro">Ver as opções lado a lado</Text>
              </Pressable>
            ) : null}
            {podeApagar ? (
              <Pressable onPress={() => void apagar()} disabled={salvando} accessibilityRole="button" className="flex-row items-center justify-center gap-1.5 py-2 active:opacity-70">
                <Trash2 size={15} color={cor.vermelho} />
                <Text className="font-body-bold text-[14px] text-vermelho">Apagar deslocamento</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

// Spec 122c: um cartão por meio. Trem/ônibus/barco/metrô abrem as saídas; carro, táxi e a pé preenchem direto.
function CartaoDoJeito({
  jeito,
  aberto,
  livreDesde,
  aoTocar,
  aoEscolher,
  horaEscolhida,
}: {
  jeito: JeitoDeIr
  aberto: boolean
  livreDesde: string | null
  aoTocar: () => void
  aoEscolher: (s: Saida) => void
  horaEscolhida: string
}) {
  const Icone = ICONE_DO_JEITO[jeito.meio]
  const partes = [duracaoCurta(jeito.minutos)]
  if (jeito.trocas != null) partes.push(jeito.trocas === 0 ? 'direto' : jeito.trocas === 1 ? '1 troca' : `${jeito.trocas} trocas`)
  if (jeito.frequenciaMin) partes.push(jeito.frequenciaMin >= 60 && jeito.frequenciaMin % 60 === 0 ? `a cada ${jeito.frequenciaMin / 60}h` : `a cada ${jeito.frequenciaMin} min`)
  if (jeito.km != null && !jeito.saidas.length) partes.push(`${String(jeito.km).replace('.', ',')} km`)
  // Mostra a partir da última que não dá tempo (pra contexto) e no máximo 6
  const primeiraQueDa = jeito.saidas.findIndex((s) => !naoDaTempo(s, livreDesde))
  const inicio = Math.max(0, (primeiraQueDa < 0 ? jeito.saidas.length : primeiraQueDa) - 1)
  const saidas = jeito.saidas.slice(inicio, inicio + 6)
  return (
    <View className="rounded-2xl border bg-cartao px-3 py-2.5" style={{ borderColor: aberto ? cor.couro : cor.borda, borderWidth: aberto ? 1.5 : 1 }}>
      <Pressable onPress={aoTocar} accessibilityRole="button" accessibilityLabel={`${NOME_DO_JEITO[jeito.meio]}: ${partes.join(', ')}`} className="flex-row items-center gap-3 active:opacity-80">
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-chip">
          <Icone size={19} color={cor.couro} />
        </View>
        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-center gap-1.5">
            <Text className="font-body-bold text-[14px] text-texto">{NOME_DO_JEITO[jeito.meio]}</Text>
            {jeito.selos.includes('mais-rapido') ? <Selo texto="Mais rápido" /> : null}
            {jeito.selos.includes('mais-barato') ? <Selo texto="Mais barato" /> : null}
          </View>
          <Text className="font-body text-[12px] text-suave">{partes.join(' · ')}</Text>
        </View>
        {jeito.preco ? (
          <View className="items-end">
            <Text className="font-body-bold text-[15px] text-texto">{`${SIMBOLO[jeito.preco.moeda] ?? jeito.preco.moeda} ${jeito.preco.valor}`}</Text>
            <Text className="font-body text-[10.5px] text-suave">estimativa</Text>
          </View>
        ) : jeito.saidas.length ? (
          <Text className="font-body-bold text-[12px] text-couro">{aberto ? 'fechar' : 'horários'}</Text>
        ) : null}
      </Pressable>
      {aberto
        ? saidas.map((s) => {
            const tarde = naoDaTempo(s, livreDesde)
            const escolhida = horaEscolhida === horaNoFuso(s.sai)
            return (
              <Pressable
                key={`${s.sai}${s.chega}`}
                onPress={() => aoEscolher(s)}
                accessibilityRole="button"
                className="mt-1.5 flex-row items-center gap-3 rounded-xl px-3 py-2 active:opacity-80"
                style={{ backgroundColor: cor.fundo, borderWidth: escolhida ? 1.5 : 0, borderColor: cor.couro, opacity: tarde ? 0.65 : 1 }}
              >
                <Text className="w-12 font-body-bold text-[15px] text-texto">{horaNoFuso(s.sai)}</Text>
                <View className="min-w-0 flex-1">
                  <Text className="font-body-bold text-[13px] text-texto">{`Chega ${horaNoFuso(s.chega)}${diaNoFuso(s.chega) !== diaNoFuso(s.sai) ? ' (+1 dia)' : ''}`}</Text>
                  <Text className="font-body text-[11.5px] text-suave" numberOfLines={1}>
                    {s.trocas === 0 ? 'Direto' : `${s.trocas} ${s.trocas === 1 ? 'troca' : 'trocas'}${s.trocaEm[0] ? ` · ${s.trocaEm[0]}` : ''}`}
                  </Text>
                </View>
                {tarde ? (
                  <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: cor.vermelhoFundo }}>
                    <Text className="font-body-bold text-[10.5px]" style={{ color: cor.vermelho }}>
                      Não dá tempo
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            )
          })
        : null}
    </View>
  )
}

function Selo({ texto }: { texto: string }) {
  return (
    <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: '#EEF0DF' }}>
      <Text className="font-body-bold text-[10.5px]" style={{ color: '#5E6B2E' }}>
        {texto}
      </Text>
    </View>
  )
}

function Rotulo({ texto }: { texto: string }) {
  return <Text className="font-body-bold text-[12px] uppercase tracking-widest text-caramelo">{texto}</Text>
}

function Chips({ opcoes, valor, aoMudar }: { opcoes: { chave: string; nome: string }[]; valor: string; aoMudar: (v: string) => void }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {opcoes.map((o) => (
        <Pressable
          key={o.chave}
          onPress={() => aoMudar(o.chave)}
          accessibilityRole="button"
          accessibilityState={{ selected: valor === o.chave }}
          className={`min-h-[38px] justify-center rounded-full border-[1.5px] px-3.5 ${valor === o.chave ? 'border-couro bg-couro' : 'border-borda bg-cartao'}`}
        >
          <Text className={`font-body-semibold text-[13px] ${valor === o.chave ? 'text-white' : 'text-texto'}`}>{o.nome}</Text>
        </Pressable>
      ))}
    </View>
  )
}

function Sugestoes({ lista, aoEscolher }: { lista: Ponto[]; aoEscolher: (p: Ponto) => void }) {
  if (!lista.length) return null
  return (
    <View className="flex-row flex-wrap gap-2">
      {lista.map((p) => (
        <Pressable key={p.nome} onPress={() => aoEscolher(p)} className="rounded-full bg-chip px-3 py-1.5 active:opacity-80">
          <Text className="font-body-semibold text-[13px] text-couro">{p.nome}</Text>
        </Pressable>
      ))}
    </View>
  )
}

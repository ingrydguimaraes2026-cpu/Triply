import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native'
import Reanimated, { useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSpring } from 'react-native-reanimated'
import { StatusBar } from '../../../../src/ui/StatusBar'
import { useFocusEffect, useRouter, type Href } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AlertTriangle, Bed, Bus, CalendarDays, Car, Clock, Luggage, Footprints, MapPin, Mountain, Pencil, Plane, Route, Ship, TrainFront, Utensils, type LucideIcon } from '../../../../src/ui/icones'
import { Icone } from '../../../../src/ui/Icone'
import { Selo } from '../../../../src/ui/Selos'
import { FotoDeFundo } from '../../../../src/ui/Foto'
import {
  buscarClima,
  buscarDestinos,
  avisosDoDia,
  buscarEventosDaAgenda,
  buscarLugares,
  indiceDoDia,
  lerDiasDoRoteiro,
  buscarOpcoesDeHospedagem,
  linkDoGuardaVolumes,
  type AvisoDoDia,
  type CasaDoDia,
  buscarTrajetos,
  interpretarTempo,
  montarAgendaDoDia,
  nomeDaSituacaoDoDeslocamento,
  type Destino,
  type SituacaoDoDeslocamento,
  type EventoDaAgenda,
  type Lugar,
  type PrevisaoDia,
  type Trajeto,
  type ViagemComDetalhes,
} from '@together/core'
import { useCarregar } from '../../../../src/dados/useCarregar'
import { puxarPraAtualizar } from '../../../../src/ui/Puxar'
import { useViagemAtual } from '../../../../src/dados/viagemAtual'
import { diaCurto, diaLongo, diasDaViagem, paraIso } from '../../../../src/lib/formato'
import { supabase } from '../../../../src/lib/supabase'
import { ErroNaTela, PilhaDeAvatares } from '../../../../src/ui/pecas'
import { EsqueletoDaAba } from '../../../../src/ui/viagem/Esqueleto'
import { SemViagem } from '../../../../src/ui/SemViagem'
import { buscarMatches, type Match } from '../../../../src/dados/matches'
import { FormEvento } from '../../../../src/ui/FormEvento'
import { mola } from '../../../../src/ui/movimento'
import { cor, fonte, momento, rotulo, titulo, trabalho } from '../../../../theme'

// Roteiro no caminho B "Embarque" (10/11/2026). Régua: docs/design/direcao-redesenho/embarque.html,
// tela "Roteiro": título grande, os dias em chips, a linha do tempo do dia em cartões, as ideias
// da galera (o que o grupo quer) com fotos, e um botão só pra adicionar, acima da barra.
// Saiu o mapa ilustrado com a folha que arrastava: a pessoa se perdia entre os dois.
const ICONE_DO_MEIO: Record<string, LucideIcon> = { aviao: Plane, carro: Car, carona: Car, onibus: Bus, metro: TrainFront, trem: TrainFront, barco: Ship, a_pe: Footprints }
const ICONE_DO_LUGAR: Record<string, LucideIcon> = { passeio: Mountain, comida: Utensils }
const HORA = 40 // largura da coluna da hora

export default function Roteiro() {
  const { atual } = useViagemAtual()
  if (!atual) return <SemViagem titulo="Roteiro" />
  return <RoteiroDaViagem viagem={atual} />
}

type Item = {
  chave: string
  hora: string
  Icone: LucideIcon
  titulo: string
  detalhe: string
  evento?: EventoDaAgenda
  desl?: { trajetoId: string; situacao: SituacaoDoDeslocamento; opcoes: number; meio: string; grupo: string | null }
}

function RoteiroDaViagem({ viagem }: { viagem: ViagemComDetalhes }) {
  const carga = useCarregar(
    () =>
      Promise.all([
        buscarDestinos(supabase, viagem.id),
        buscarLugares(supabase, viagem.id),
        buscarTrajetos(supabase, viagem.id, { comOpcoes: true }),
        buscarEventosDaAgenda(supabase, viagem.id),
        // Spec 122b: as casas escolhidas (check-in e check-out) pros avisos. Sem elas, o dia funciona igual.
        buscarOpcoesDeHospedagem(supabase, viagem.id)
          .then((ops) => ops.filter((o) => o.escolhida))
          .catch(() => []),
        // Os dias montados no Explorar ("Paris em 3 dias"): o mesmo que o resumo da aba Viagem e o Hoje usam
        supabase
          .from('roteiros')
          .select('destino_id, dias')
          .eq('viagem_id', viagem.id)
          .then(({ data, error }) => {
            if (error) throw error
            return (data ?? []).map((r) => ({ destinoId: r.destino_id, dias: lerDiasDoRoteiro(r.dias) }))
          })
          .then(
            (r) => r,
            () => [], // sem os dias montados, o dia funciona igual (todos os lugares da cidade)
          ),
        // Ideias da galera (spec 117). Antes da migration do match (ou sem internet), fica vazio.
        buscarMatches(viagem.id).catch(() => []),
      ]),
    [viagem.id],
    'aba-roteiro',
  )
  useFocusEffect(useCallback(() => carga.recarregar(), [carga.recarregar]))
  if (carga.status === 'carregando') return <EsqueletoDaAba forma="roteiro" />
  if (carga.status === 'erro') return <ErroNaTela aoTentar={carga.recarregar} />
  const [destinos, lugares, trajetos, eventos, casas, roteiros, matches] = carga.dados
  return <Tela viagem={viagem} destinos={destinos} lugares={lugares} trajetos={trajetos} eventos={eventos} casas={casas} roteiros={roteiros} matches={matches} aoMudar={carga.recarregar} atualizando={carga.atualizando} />
}

type PropsDaTela = {
  viagem: ViagemComDetalhes
  destinos: Destino[]
  lugares: Lugar[]
  trajetos: Trajeto[]
  eventos: EventoDaAgenda[]
  casas: CasaDoDia[]
  roteiros: RoteiroMontado[]
  matches: Match[]
  aoMudar: () => void
  atualizando: boolean
}

function Tela({ viagem, destinos, lugares, trajetos, eventos, casas, roteiros, matches, aoMudar, atualizando }: PropsDaTela) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { meuId } = useViagemAtual()
  const euSouAdm = viagem.membros.some((m) => m.id === meuId && m.papel === 'adm')
  // Formulário aberto: novo evento (sem `evento`) ou editando um
  const [form, setForm] = useState<{ evento?: EventoDaAgenda } | null>(null)
  const [menu, setMenu] = useState(false)

  const dias = useMemo(() => diasDaViagem(viagem.dataInicio, viagem.dataFim), [viagem.dataInicio, viagem.dataFim])
  const semDatas = dias.length === 0
  // Durante a viagem, abre no dia de hoje; antes, no primeiro dia
  const [diaEscolhido, setDiaEscolhido] = useState(() => Math.max(0, dias.findIndex((d) => paraIso(d) === paraIso(new Date()))))
  const dia = semDatas ? new Date() : dias[Math.min(diaEscolhido, dias.length - 1)]
  const itens = useMemo(() => (semDatas ? [] : montarDia(paraIso(dia), destinos, lugares, trajetos, eventos, roteiros)), [semDatas, dia, destinos, lugares, trajetos, eventos, roteiros])
  // "7 dias · 4 com plano"
  const comPlano = useMemo(() => dias.filter((d) => montarDia(paraIso(d), destinos, lugares, trajetos, eventos, roteiros).length > 0).length, [dias, destinos, lugares, trajetos, eventos, roteiros])
  const onde = destinoDoDia(paraIso(dia), destinos)
  const agenda = useMemo(() => (semDatas ? [] : montarAgendaDoDia(paraIso(dia), { destinos, trajetos, eventos })), [semDatas, dia, destinos, trajetos, eventos])
  // Spec 122b: avisos entre os passos (folga, check-in, malas)
  const avisos = useMemo(() => avisosDoDia(paraIso(dia), agenda, casas), [dia, agenda, casas])
  const avisosDepoisDe = (chave: string) => avisos.filter((a) => a.depoisDe === chave).map((a) => <AvisoNoDia key={a.chave} aviso={a} />)
  const diasMontados = useMemo(() => (semDatas ? diasDosRoteiros(destinos, lugares, roteiros) : []), [semDatas, destinos, lugares, roteiros])
  const novoDeslocamento = (extra = '') => router.push(`/novo-deslocamento?dia=${paraIso(dia)}${extra}` as Href)
  // Ideias da galera: o que alguém do grupo quer e ainda não entrou num dia, o mais querido primeiro
  const ideias = matches.filter((m) => m.querem > 0 && !m.noDia)
  const nomeDe = (id: string) => viagem.membros.find((m) => m.id === id)?.nome ?? 'Alguém'

  // Clima do destino do dia (roadmap #8). Sem coordenadas/datas → sem clima.
  const [clima, setClima] = useState<Record<string, PrevisaoDia>>({})
  useEffect(() => {
    if (!onde?.chegada || onde.latitude == null || onde.longitude == null) {
      setClima({})
      return
    }
    let vivo = true
    buscarClima(onde.latitude, onde.longitude, onde.chegada, onde.saida ?? onde.chegada, paraIso(new Date()))
      .then((dias) => vivo && setClima(Object.fromEntries(dias.map((p) => [p.data, p]))))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [onde?.id, onde?.chegada, onde?.saida, onde?.latitude, onde?.longitude])
  const previsaoDoDia = clima[paraIso(dia)]
  const tempo = previsaoDoDia ? interpretarTempo(previsaoDoDia.codigo) : null

  return (
    <View className="flex-1" style={{ backgroundColor: trabalho.fundo }}>
      <StatusBar style="dark" />
      <ScrollView refreshControl={puxarPraAtualizar({ atualizando, recarregar: aoMudar })} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
        <Entra ordem={0}>
          <View className="flex-row items-end justify-between" style={{ paddingHorizontal: 18, paddingTop: 6, paddingBottom: 12 }}>
            <View>
              <Text style={[rotulo, { color: trabalho.texto2 }]}>{semDatas ? 'Sem datas ainda' : `${dias.length} ${dias.length === 1 ? 'dia' : 'dias'} · ${comPlano} com plano`}</Text>
              <Text style={[titulo(32), { color: trabalho.texto, marginTop: 6 }]}>Roteiro</Text>
            </View>
            {/* As cidades da viagem e a ordem delas */}
            <Pressable onPress={() => router.push('/cidades' as Href)} accessibilityRole="button" className="mb-1 flex-row items-center gap-1.5 rounded-full border px-3 py-1.5 active:opacity-80" style={{ backgroundColor: trabalho.superficie, borderColor: trabalho.linha }}>
              <MapPin size={14} color={trabalho.texto} />
              <Text style={{ fontFamily: fonte.corpoForte, fontSize: 13, color: trabalho.texto }}>Cidades</Text>
            </Pressable>
          </View>
        </Entra>

        {semDatas ? (
          <Entra ordem={1}>
            <View className="mx-[14px] items-center gap-3 rounded-[20px] border p-5" style={{ backgroundColor: trabalho.superficie, borderColor: trabalho.linha }}>
              <CalendarDays size={26} color={trabalho.texto} />
              <Text className="text-center" style={{ fontFamily: fonte.corpo, fontSize: 14, lineHeight: 20, color: trabalho.texto }}>
                Com as datas, cada dia mostra os deslocamentos, os eventos e onde vocês dormem.
              </Text>
              {euSouAdm ? (
                <Pressable onPress={() => router.push('/configuracoes' as Href)} accessibilityRole="button" className="h-11 flex-row items-center gap-1.5 rounded-full px-5 active:opacity-80" style={{ backgroundColor: trabalho.acento }}>
                  <Text style={{ fontFamily: fonte.item, fontSize: 14, color: trabalho.acentoTexto }}>Definir as datas</Text>
                </Pressable>
              ) : (
                <Text className="text-center" style={{ fontFamily: fonte.corpo, fontSize: 13, color: trabalho.texto2 }}>
                  Quem organiza define as datas.
                </Text>
              )}
            </View>
            {diasMontados.length ? (
              <View className="mt-5 gap-2 px-[14px]">
                <Text style={[rotulo, { color: trabalho.texto2, marginLeft: 4 }]}>Dias montados no Explorar</Text>
                {diasMontados.map((d) => (
                  <View key={d.numero} className="rounded-[20px] border p-3.5" style={{ backgroundColor: trabalho.superficie, borderColor: trabalho.linha }}>
                    <Text style={{ fontFamily: fonte.item, fontSize: 14, color: trabalho.texto }}>
                      Dia {d.numero} · {d.cidade}
                    </Text>
                    {d.lugares.map((nome, i) => (
                      <Text key={i} style={{ fontFamily: fonte.corpo, fontSize: 13, color: trabalho.texto2, marginTop: 4 }}>
                        {nome}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>
            ) : null}
          </Entra>
        ) : (
          <>
            <Entra ordem={1}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 18, paddingBottom: 4 }}>
                {dias.map((d, i) => {
                  const ativo = i === diaEscolhido
                  const [semana, numero] = diaCurto(d).split(' ')
                  return (
                    <Pressable
                      key={i}
                      onPress={() => setDiaEscolhido(i)}
                      accessibilityRole="button"
                      accessibilityLabel={`Dia ${i + 1}, ${diaLongo(d)}`}
                      accessibilityState={{ selected: ativo }}
                      className="items-center justify-center gap-0.5 rounded-2xl border active:opacity-80"
                      style={{ width: 48, height: 60, backgroundColor: ativo ? trabalho.acento : trabalho.superficie, borderColor: ativo ? 'transparent' : trabalho.linha }}
                    >
                      <Text style={{ fontFamily: fonte.corpoForte, fontSize: 10, color: ativo ? trabalho.acentoTexto : trabalho.texto2 }}>{semana.toUpperCase()}</Text>
                      <Text style={{ fontFamily: fonte.titulo, fontSize: 18, color: ativo ? trabalho.acentoTexto : trabalho.texto }}>{numero}</Text>
                    </Pressable>
                  )
                })}
              </ScrollView>
            </Entra>

            {/* Onde a galera está nesse dia e o tempo */}
            <Entra ordem={2}>
              <View className="flex-row items-center gap-1.5" style={{ paddingHorizontal: 18, marginTop: 12 }}>
                <Text style={{ fontFamily: fonte.item, fontSize: 15, color: trabalho.texto }}>{diaLongo(dia)}</Text>
                <Text style={{ fontFamily: fonte.corpo, fontSize: 13, color: trabalho.texto2 }} numberOfLines={1} className="flex-1">
                  {onde ? ` · ${onde.nome}` : ''}
                  {tempo && previsaoDoDia?.tempMax != null ? ` · ${Math.round(previsaoDoDia.tempMax)}°` : ''}
                </Text>
                {tempo ? <Icone nome={tempo.icone} tamanho={18} cor={trabalho.texto2} /> : null}
              </View>

              <View style={{ marginHorizontal: 14, marginTop: 8 }}>
                {itens.length === 0 ? (
                  <View className="items-center gap-1 rounded-[20px] border p-5" style={{ backgroundColor: trabalho.superficie, borderColor: trabalho.linha }}>
                    <Text style={{ fontFamily: fonte.item, fontSize: 15, color: trabalho.texto }}>Dia livre por enquanto</Text>
                    <Text className="text-center" style={{ fontFamily: fonte.corpo, fontSize: 13, lineHeight: 18, color: trabalho.texto2 }}>
                      Toque em "Adicionar" pra marcar um passeio ou uma ida pra outro lugar.
                    </Text>
                  </View>
                ) : (
                  itens.map((it) => (
                    <View key={it.chave}>
                      <Parada item={it} editavel={!!it.evento && (it.evento.criado_por === meuId || euSouAdm)} aoEditar={() => setForm({ evento: it.evento })} aoDeslocamento={novoDeslocamento} />
                      {avisosDepoisDe(it.chave)}
                    </View>
                  ))
                )}
              </View>
            </Entra>
          </>
        )}

        {/* Ideias da galera (spec 117): o que o grupo quer fazer */}
        <Entra ordem={3}>
          <View className="flex-row items-baseline justify-between" style={{ marginHorizontal: 18, marginTop: 22, marginBottom: 10 }}>
            <Text style={[rotulo, { color: trabalho.texto2 }]}>Ideias da galera</Text>
            <Pressable onPress={() => router.push('/explorar')} accessibilityRole="link" hitSlop={8}>
              <Text style={{ fontFamily: fonte.corpoForte, fontSize: 12.5, color: trabalho.acento }}>Descobrir lugares</Text>
            </Pressable>
          </View>
          {ideias.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingHorizontal: 18, paddingBottom: 4 }}>
              {ideias.map((m) => (
                <Pressable key={m.catalogoId} onPress={() => router.push(`/explorar?destino=${m.destinoId}` as Href)} accessibilityRole="button" accessibilityLabel={`${m.nome}, ${querem(m, viagem.membros.length)}`} style={{ width: 132 }} className="active:opacity-90">
                  <FotoDeFundo source={m.foto ? { uri: m.foto } : undefined} style={{ height: 150, borderRadius: 18, overflow: 'hidden', backgroundColor: trabalho.superficie2 }}>
                    {!m.foto ? (
                      <View className="flex-1 items-center justify-center">
                        <Selo nome="museu" tamanho={44} />
                      </View>
                    ) : null}
                    <View style={{ position: 'absolute', left: 8, bottom: 8 }}>
                      <PilhaDeAvatares nomes={m.quem.map(nomeDe)} tamanho={24} borda={momento.texto} max={4} />
                    </View>
                  </FotoDeFundo>
                  <Text numberOfLines={2} style={{ fontFamily: fonte.item, fontSize: 13.5, letterSpacing: -0.1, color: trabalho.texto, marginTop: 6 }}>
                    {m.nome}
                  </Text>
                  <Text style={{ fontFamily: fonte.corpo, fontSize: 11.5, color: trabalho.texto2 }}>{querem(m, viagem.membros.length)}</Text>
                </Pressable>
              ))}
            </ScrollView>
          ) : (
            <Pressable onPress={() => router.push('/explorar')} accessibilityRole="button" className="flex-row items-center gap-3 rounded-[20px] border p-3.5 active:opacity-80" style={{ marginHorizontal: 14, backgroundColor: trabalho.superficie, borderColor: trabalho.linha }}>
              <Selo nome="museu" tamanho={40} />
              <View className="min-w-0 flex-1">
                <Text style={{ fontFamily: fonte.item, fontSize: 14, color: trabalho.texto }}>Ninguém escolheu lugar ainda</Text>
                <Text style={{ fontFamily: fonte.corpo, fontSize: 12.5, color: trabalho.texto2, marginTop: 1 }}>Veja os lugares de cada cidade e diga o que você quer.</Text>
              </View>
            </Pressable>
          )}
        </Entra>
      </ScrollView>

      {/* Um botão só pra adicionar, acima da barra de vidro */}
      {!semDatas ? (
        <>
          {menu ? <Pressable onPress={() => setMenu(false)} accessibilityLabel="Fechar" style={StyleSheet.absoluteFill} /> : null}
          <View className="absolute items-end gap-2" style={{ right: 16, bottom: insets.bottom + 4 }}>
            {menu ? (
              <View className="overflow-hidden rounded-[20px] border" style={{ backgroundColor: trabalho.superficie, borderColor: trabalho.linha, boxShadow: '0 10px 24px rgba(74,46,20,0.18)' }}>
                <OpcaoDoMenu Icone={CalendarDays} texto="Passeio ou evento" sub={diaLongo(dia)} aoTocar={() => (setMenu(false), setForm({}))} />
                <View style={{ height: 1, backgroundColor: trabalho.linha }} />
                <OpcaoDoMenu Icone={Route} texto="Ida pra outro lugar" sub="Voo, ônibus, carro..." aoTocar={() => (setMenu(false), novoDeslocamento())} />
              </View>
            ) : null}
            <Pressable
              onPress={() => setMenu((m) => !m)}
              accessibilityRole="button"
              accessibilityLabel={menu ? 'Fechar o menu de adicionar' : 'Adicionar no dia'}
              className="h-[50px] flex-row items-center gap-1.5 rounded-full pl-3.5 pr-[18px] active:opacity-90"
              style={{ backgroundColor: trabalho.acento, boxShadow: '0 10px 24px rgba(0,0,0,0.3)' }}
            >
              <Icone nome={menu ? 'fechar' : 'mais'} tamanho={20} cor={trabalho.acentoTexto} />
              <Text style={{ fontFamily: fonte.item, fontSize: 14.5, color: trabalho.acentoTexto }}>{menu ? 'Fechar' : 'Adicionar'}</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      {form ? (
        <FormEvento
          viagemId={viagem.id}
          dia={paraIso(dia)}
          evento={form.evento}
          aoFechar={() => setForm(null)}
          aoSalvar={() => {
            setForm(null)
            aoMudar()
          }}
        />
      ) : null}
    </View>
  )
}

// "Todo mundo quer", "2 querem", "Só você quer"... (contagem simples, sem o nome)
function querem(m: Match, pessoas: number) {
  if (pessoas >= 2 && m.querem >= pessoas) return 'Todo mundo quer'
  return m.querem === 1 ? '1 quer' : `${m.querem} querem`
}

function OpcaoDoMenu({ Icone: Ic, texto, sub, aoTocar }: { Icone: LucideIcon; texto: string; sub: string; aoTocar: () => void }) {
  return (
    <Pressable onPress={aoTocar} accessibilityRole="button" className="flex-row items-center gap-3 px-3.5 py-3 active:opacity-80" style={{ minWidth: 220 }}>
      <View className="h-[34px] w-[34px] items-center justify-center rounded-xl" style={{ backgroundColor: trabalho.superficie2 }}>
        <Ic size={17} color={trabalho.texto} />
      </View>
      <View>
        <Text style={{ fontFamily: fonte.item, fontSize: 14, color: trabalho.texto }}>{texto}</Text>
        <Text style={{ fontFamily: fonte.corpo, fontSize: 12, color: trabalho.texto2 }}>{sub}</Text>
      </View>
    </Pressable>
  )
}

// Uma parada do dia: a hora na esquerda e o cartão. Deslocamento abre a comparação ou a edição;
// evento abre a edição (só pra quem criou ou quem organiza).
function Parada({ item: it, editavel, aoEditar, aoDeslocamento }: { item: Item; editavel: boolean; aoEditar: () => void; aoDeslocamento: (extra?: string) => void }) {
  const router = useRouter()
  const d = it.desl
  const pendente = d ? d.situacao === 'comparando' || d.situacao === 'sugestao' : false
  const aoTocar = d ? () => (d.grupo && d.opcoes > 1 ? router.push(`/comparar?grupo=${d.grupo}` as Href) : aoDeslocamento(`&trajeto=${d.trajetoId}`)) : editavel ? aoEditar : undefined
  const etiqueta = d ? (d.situacao === 'comparando' ? `Comparando ${d.opcoes} opções` : nomeDaSituacaoDoDeslocamento(d.situacao)) : it.evento ? 'Evento' : null
  return (
    <View className="flex-row items-center gap-3 py-1.5">
      <Text style={{ width: HORA, textAlign: 'right', fontFamily: fonte.corpoNegrito, fontSize: 11.5, color: trabalho.texto2 }}>{it.hora}</Text>
      <Pressable
        onPress={aoTocar}
        disabled={!aoTocar}
        accessibilityLabel={aoTocar ? `Abrir ${it.titulo}` : undefined}
        className="min-w-0 flex-1 flex-row items-center gap-2.5 rounded-[20px] border px-3 py-2.5 active:opacity-80"
        style={{ backgroundColor: trabalho.superficie, borderColor: pendente ? cor.dourado : trabalho.linha, boxShadow: '0 2px 10px rgba(74,46,20,0.06)' }}
      >
        <View className="h-[38px] w-[38px] items-center justify-center rounded-xl" style={{ backgroundColor: trabalho.superficie2 }}>
          <it.Icone size={18} color={trabalho.texto} />
        </View>
        <View className="min-w-0 flex-1">
          <Text numberOfLines={2} style={{ fontFamily: fonte.item, fontSize: 14, letterSpacing: -0.1, color: trabalho.texto }}>
            {it.titulo}
          </Text>
          {etiqueta || it.detalhe ? (
            <Text numberOfLines={2} style={{ fontFamily: fonte.corpo, fontSize: 11.5, color: trabalho.texto2, marginTop: 1 }}>
              {etiqueta ? <Text style={{ fontFamily: fonte.corpoNegrito, color: '#A0701E' }}>{etiqueta}</Text> : null}
              {etiqueta && it.detalhe ? ' · ' : ''}
              {it.detalhe}
            </Text>
          ) : null}
        </View>
        {d && (d.meio === 'trem' || d.meio === 'onibus') ? (
          <Pressable onPress={() => router.push(`/caminho?trajeto=${d.trajetoId}` as Href)} hitSlop={8} accessibilityRole="link">
            <Text style={{ fontFamily: fonte.corpoForte, fontSize: 12, color: trabalho.acento }}>Paradas</Text>
          </Pressable>
        ) : editavel ? (
          <Pencil size={15} color={trabalho.texto2} />
        ) : null}
      </Pressable>
    </View>
  )
}

// Cascata de entrada: cada bloco sobe um pouco depois do outro
function Entra({ ordem, children }: { ordem: number; children: ReactNode }) {
  const reduzir = useReducedMotion()
  const p = useSharedValue(reduzir ? 1 : 0)
  useEffect(() => {
    if (!reduzir) p.value = withDelay(ordem * 70, withSpring(1, mola.entrar))
  }, [reduzir, ordem, p])
  const estilo = useAnimatedStyle(() => ({ opacity: Math.min(1, p.value * 1.4), transform: [{ translateY: (1 - p.value) * 18 }] }))
  return <Reanimated.View style={estilo}>{children}</Reanimated.View>
}

// Spec 122b: aviso entre os passos do dia (folga, check-in, malas), com a ação quando tem
function AvisoNoDia({ aviso }: { aviso: AvisoDoDia }) {
  const acao = aviso.acao
  async function agir() {
    if (!acao) return
    if (acao.tipo === 'guarda-volumes') return void Linking.openURL(linkDoGuardaVolumes(acao.lugar))
    // Contato com cara de telefone vai pro WhatsApp; senão, o "compartilhar" do celular
    const fone = (acao.contato ?? '').replace(/[^\d]/g, '')
    if (fone.length >= 8) return void Linking.openURL(`https://wa.me/${fone}?text=${encodeURIComponent(acao.texto)}`)
    await Share.share({ message: acao.texto }).catch(() => undefined)
  }
  const linha = <View style={{ width: HORA }} />
  if (aviso.nivel === 'folga') {
    return (
      <View className="flex-row gap-3">
        {linha}
        <View className="flex-1 flex-row items-center gap-1.5 pb-2">
          <Clock size={13} color={cor.suave} />
          <Text className="font-body text-[12px] text-suave">{aviso.titulo}</Text>
        </View>
      </View>
    )
  }
  const ruim = aviso.nivel === 'ruim'
  const corTexto = ruim ? cor.vermelho : '#7A4E0C'
  return (
    <View className="flex-row gap-3">
      {linha}
      <View className="mb-2.5 min-w-0 flex-1 flex-row gap-2 rounded-2xl p-3" style={{ backgroundColor: ruim ? cor.vermelhoFundo : '#FBEBD2' }}>
        {ruim ? <AlertTriangle size={16} color={corTexto} /> : <Luggage size={16} color={corTexto} />}
        <View className="min-w-0 flex-1 gap-0.5">
          <Text className="font-body-bold text-[13px]" style={{ color: corTexto }}>
            {aviso.titulo}
          </Text>
          <Text className="font-body text-[12.5px] leading-[17px]" style={{ color: corTexto }}>
            {aviso.texto}
          </Text>
          {acao ? (
            <Pressable onPress={() => void agir()} accessibilityRole="button" className="mt-1.5 self-start rounded-xl bg-cartao px-3 py-1.5 active:opacity-80">
              <Text className="font-body-bold text-[12px] text-couro">{acao.tipo === 'guarda-volumes' ? 'Achar guarda-volumes' : 'Mandar mensagem pro anfitrião'}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  )
}

// Onde o comboio está nesse dia (o destino cujo período inclui o dia)
function destinoDoDia(dia: string, destinos: Destino[]) {
  return destinos.find((d) => d.chegada && d.chegada <= dia && (d.saida ?? d.chegada) >= dia)
}

// Linha do tempo do dia (spec 029, igual à web): saídas, trajetos e eventos por hora, chegadas.
// No fim, os lugares do destino (ideias do que fazer, sem hora).
type RoteiroMontado = { destinoId: string; dias: string[][] }

// Viagem sem datas: os dias montados no Explorar, na ordem do roteiro, numerados como no resumo da aba Viagem
function diasDosRoteiros(destinos: Destino[], lugares: Lugar[], roteiros: RoteiroMontado[]) {
  const nomeDo = new Map(lugares.map((l) => [l.id, l.nome]))
  const saida: { numero: number; cidade: string; lugares: string[] }[] = []
  for (const d of destinos) {
    for (const ids of roteiros.find((r) => r.destinoId === d.id)?.dias ?? []) {
      const nomes = ids.map((id) => nomeDo.get(id)).filter((n): n is string => !!n)
      if (nomes.length) saida.push({ numero: saida.length + 1, cidade: d.nome, lugares: nomes })
    }
  }
  return saida
}

function montarDia(dia: string, destinos: Destino[], lugares: Lugar[], trajetos: Trajeto[], eventos: EventoDaAgenda[], roteiros: RoteiroMontado[]): Item[] {
  const itens: Item[] = montarAgendaDoDia(dia, { destinos, trajetos, eventos }).map((i) => {
    if (i.tipo === 'trajeto')
      return {
        chave: i.chave,
        hora: i.hora,
        Icone: ICONE_DO_MEIO[i.meio] ?? Route,
        titulo: i.titulo,
        detalhe: i.detalhe,
        desl: { trajetoId: i.trajetoId, situacao: i.situacao, opcoes: i.opcoes, meio: i.meio, grupo: i.grupo },
      }
    if (i.tipo === 'evento') return { chave: i.chave, hora: i.hora, Icone: CalendarDays, titulo: i.titulo, detalhe: i.detalhe, evento: i.evento }
    return { chave: i.chave, hora: '', Icone: i.tipo === 'chegada' ? Bed : MapPin, titulo: i.titulo, detalhe: i.detalhe }
  })
  const onde = destinoDoDia(dia, destinos)
  if (onde) {
    // Com os dias montados no Explorar: só os lugares deste dia (igual ao Hoje).
    // Sem roteiro montado na cidade: todos os lugares dela, como ideias.
    const montado = roteiros.find((r) => r.destinoId === onde.id)
    const doDia = montado && onde.chegada ? montado.dias[indiceDoDia(onde.chegada, dia)] ?? [] : null
    const daCidade = doDia
      ? doDia.map((id) => lugares.find((x) => x.id === id)).filter((x): x is Lugar => !!x)
      : lugares.filter((x) => x.destino_id === onde.id)
    for (const l of daCidade) {
      itens.push({ chave: 'l' + l.id, hora: '', Icone: ICONE_DO_LUGAR[l.tipo] ?? MapPin, titulo: l.nome, detalhe: [l.horario, l.observacao].filter(Boolean).join(' · ') })
    }
  }
  return itens
}

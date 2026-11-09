import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Linking, PanResponder, Pressable, ScrollView, Share, Text, View } from 'react-native'
import { StatusBar } from '../../../../src/ui/StatusBar'
import { useFocusEffect, useRouter, type Href } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Ellipse, Path, Polyline, Rect } from 'react-native-svg'
import { AlertTriangle, Bed, Bus, CalendarDays, Car, Clock, Luggage, Footprints, MapPin, Mountain, Pencil, Plane, Plus, Route, Ship, TrainFront, Utensils, type LucideIcon } from '../../../../src/ui/icones'
import { Icone } from '../../../../src/ui/Icone'
import {
  buscarClima,
  buscarDestinos,
  avisosDoDia,
  buscarEventosDaAgenda,
  buscarLugares,
  buscarOpcoesDeHospedagem,
  linkDoGuardaVolumes,
  type AvisoDoDia,
  type CasaDoDia,
  buscarTrajetos,
  interpretarTempo,
  montarAgendaDoDia,
  nomeDaSituacaoDoDeslocamento,
  resumoDoDia,
  type Destino,
  type SituacaoDoDeslocamento,
  type EventoDaAgenda,
  type Lugar,
  type PrevisaoDia,
  type Trajeto,
  type ViagemComDetalhes,
} from '@together/core'
import { useCarregar } from '../../../../src/dados/useCarregar'
import { useViagemAtual } from '../../../../src/dados/viagemAtual'
import { diaCurto, diaLongo, diasDaViagem, paraIso } from '../../../../src/lib/formato'
import { supabase } from '../../../../src/lib/supabase'
import { Carregando, ErroNaTela, IconeQuadrado } from '../../../../src/ui/pecas'
import { SemViagem } from '../../../../src/ui/SemViagem'
import { Matches } from '../../../../src/ui/Matches'
import { buscarMatches, ehMatch, quemFazMatch } from '../../../../src/dados/matches'
import { FormEvento } from '../../../../src/ui/FormEvento'
import { useTamanhoDaTela } from '../../../../src/ui/Moldura'
import { cor } from '../../../../theme'

// Roteiro (tela "1h" do design): mapa ilustrado com os destinos numerados e uma
// folha que sobe por cima (arraste a alça) com a linha do tempo de cada dia.
const ICONE_DO_MEIO: Record<string, LucideIcon> = { aviao: Plane, carro: Car, carona: Car, onibus: Bus, metro: TrainFront, trem: TrainFront, barco: Ship, a_pe: Footprints }
// Spec 122a: cor da situação do deslocamento (fundo, texto)
const COR_DA_SITUACAO: Record<SituacaoDoDeslocamento, [string, string]> = {
  comprado: ['#EEF0DF', '#5E6B2E'],
  reservado: ['#F6EAD7', '#7B542F'],
  decidido: ['#F6EAD7', '#7B542F'],
  sugestao: ['#FBEBD2', '#8A5A10'],
  comparando: ['#FBEBD2', '#8A5A10'],
}
const ICONE_DO_LUGAR: Record<string, LucideIcon> = { passeio: Mountain, comida: Utensils }

// Spec 117: a aba abre em Matches (o que o comboio quer); tocar num dia mostra o mapa e o dia.
export default function Roteiro() {
  const { atual } = useViagemAtual()
  const [dia, setDia] = useState<number | null>(null) // null = Matches
  if (!atual) return <SemViagem titulo="Roteiro" />
  if (dia === null) return <AbaMatches viagem={atual} aoDia={setDia} />
  return <RoteiroDaViagem viagem={atual} diaInicial={dia} aoMatches={() => setDia(null)} />
}

function AbaMatches({ viagem, aoDia }: { viagem: ViagemComDetalhes; aoDia: (i: number) => void }) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { meuId } = useViagemAtual()
  // Antes da migration do match (ou sem internet) a lista fica vazia, sem quebrar a aba
  const carga = useCarregar(() => buscarMatches(viagem.id).catch(() => []), [viagem.id])
  useFocusEffect(useCallback(() => carga.recarregar(), [carga.recarregar]))
  const matches = carga.status === 'pronto' ? carga.dados : []
  const novos = matches.filter((m) => ehMatch(m.querem, viagem.membros.length) && !m.noDia).length
  const dias = diasDaViagem(viagem.dataInicio, viagem.dataFim)
  const principal = matches.find((m) => ehMatch(m.querem, viagem.membros.length))?.destinoId

  return (
    <View className="flex-1 bg-fundo" style={{ paddingTop: insets.top + 8 }}>
      <StatusBar style="dark" />
      <Text className="px-5 font-display text-[32px] leading-[36px] text-texto">Roteiro</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingVertical: 12 }} style={{ flexGrow: 0 }}>
        <View className="h-10 flex-row items-center gap-1.5 rounded-full bg-couro px-4">
          <Text className="font-body-bold text-[14px] text-white">Matches</Text>
          {novos ? (
            <View className="h-5 min-w-5 items-center justify-center rounded-full bg-dourado px-1">
              <Text className="font-body-bold text-[11px] text-escuro">{novos}</Text>
            </View>
          ) : null}
        </View>
        {(dias.length ? dias : [new Date()]).map((d, i) => (
          <Pressable key={i} onPress={() => aoDia(i)} className="h-10 justify-center rounded-full border border-borda bg-cartao px-4 active:opacity-80">
            <Text className="font-body-bold text-[14px] text-texto">Dia {i + 1}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text className="mb-3 px-5 font-body text-[13px] text-suave">{`O que ${quemFazMatch(viagem.membros.length)} vira match e entra no dia.`}</Text>
      {carga.status === 'carregando' ? (
        <View className="gap-2.5 px-5">
          {[0, 1, 2].map((i) => (
            <View key={i} className="h-[84px] rounded-2xl bg-areia" />
          ))}
        </View>
      ) : (
        <Matches
          matches={matches}
          membros={viagem.membros}
          meuId={meuId}
          aoAbrirLugar={(m) => router.push(`/explorar?destino=${m.destinoId}` as Href)}
          aoMontar={() => router.push((principal ? `/explorar?destino=${principal}&roteiro=1` : '/explorar') as Href)}
          aoDescobrir={() => router.push('/explorar')}
        />
      )}
    </View>
  )
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

function RoteiroDaViagem({ viagem, diaInicial, aoMatches }: { viagem: ViagemComDetalhes; diaInicial: number; aoMatches: () => void }) {
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
      ]),
    [viagem.id],
  )
  if (carga.status === 'carregando') return <Carregando />
  if (carga.status === 'erro') return <ErroNaTela aoTentar={carga.recarregar} />
  const [destinos, lugares, trajetos, eventos, casas] = carga.dados
  return <Tela viagem={viagem} destinos={destinos} lugares={lugares} trajetos={trajetos} eventos={eventos} casas={casas} aoMudar={carga.recarregar} diaInicial={diaInicial} aoMatches={aoMatches} />
}

function Tela({
  viagem,
  destinos,
  lugares,
  trajetos,
  eventos,
  aoMudar,
  diaInicial,
  aoMatches,
  casas,
}: {
  casas: CasaDoDia[]
  diaInicial: number
  aoMatches: () => void
  viagem: ViagemComDetalhes
  destinos: Destino[]
  lugares: Lugar[]
  trajetos: Trajeto[]
  eventos: EventoDaAgenda[]
  aoMudar: () => void
}) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { meuId } = useViagemAtual()
  const euSouAdm = viagem.membros.some((m) => m.id === meuId && m.papel === 'adm')
  // Formulário aberto: novo evento (sem `evento`) ou editando um
  const [form, setForm] = useState<{ evento?: EventoDaAgenda } | null>(null)
  const { width, height } = useTamanhoDaTela()
  const largura = width
  const alturaDoMapa = Math.round(height * 0.66)

  const dias = useMemo(() => {
    const d = diasDaViagem(viagem.dataInicio, viagem.dataFim)
    return d.length ? d : [new Date()]
  }, [viagem.dataInicio, viagem.dataFim])
  const [diaEscolhido, setDiaEscolhido] = useState(diaInicial)
  const dia = dias[Math.min(diaEscolhido, dias.length - 1)]
  const itens = useMemo(() => montarDia(paraIso(dia), destinos, lugares, trajetos, eventos), [dia, destinos, lugares, trajetos, eventos])
  const pinos = useMemo(() => posicionarPinos(destinos, largura, insets.top + 80, Math.round(height * 0.38) - 36), [destinos, largura, insets.top, height])
  const onde = destinoDoDia(paraIso(dia), destinos)
  const agenda = useMemo(() => montarAgendaDoDia(paraIso(dia), { destinos, trajetos, eventos }), [dia, destinos, trajetos, eventos])
  const resumo = useMemo(() => resumoDoDia(agenda), [agenda])
  // Spec 122b: avisos entre os passos (folga, check-in, malas)
  const avisos = useMemo(() => avisosDoDia(paraIso(dia), agenda, casas), [dia, agenda, casas])
  const avisosDepoisDe = (chave: string) => avisos.filter((a) => a.depoisDe === chave).map((a) => <AvisoNoDia key={a.chave} aviso={a} />)
  const novoDeslocamento = (extra = '') => router.push(`/novo-deslocamento?dia=${paraIso(dia)}${extra}` as Href)

  // Clima do destino de hoje (roadmap #8): busca a previsão do destino inteiro e
  // guarda por data; o chip mostra a do dia escolhido. Sem coordenadas/datas → sem chip.
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

  // Folha arrastável com 3 paradas: alta, média, baixa
  const paradas = [insets.top + 90, Math.round(height * 0.38), Math.round(height * 0.66)]
  const topo = useRef(new Animated.Value(paradas[1])).current
  const atualTopo = useRef(paradas[1])
  const arraste = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 4,
      onPanResponderMove: (_e, g) => topo.setValue(Math.max(paradas[0], Math.min(paradas[2], atualTopo.current + g.dy))),
      onPanResponderRelease: (_e, g) => {
        const solto = atualTopo.current + g.dy
        const alvo = paradas.reduce((a, b) => (Math.abs(b - solto) < Math.abs(a - solto) ? b : a))
        atualTopo.current = alvo
        Animated.spring(topo, { toValue: alvo, useNativeDriver: false, friction: 9 }).start()
      },
    }),
  ).current

  return (
    <View className="flex-1" style={{ backgroundColor: '#EADBC2' }}>
      <StatusBar style="dark" />
      <MapaIlustrado largura={largura} altura={alturaDoMapa} pinos={pinos} destaque={onde ? destinos.indexOf(onde) : -1} />

      <View className="absolute left-5 right-5 items-center" style={{ top: insets.top + 8 }}>
        <View className="h-10 justify-center rounded-full bg-fundo px-4" style={{ boxShadow: '0 4px 12px rgba(74,46,20,0.15)' }}>
          <Text className="font-body-bold text-[14px] text-texto" numberOfLines={1}>
            Roteiro · {viagem.nome}
          </Text>
        </View>
      </View>

      <Animated.View
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: topo, backgroundColor: cor.fundo, borderTopLeftRadius: 28, borderTopRightRadius: 28, boxShadow: '0 -10px 30px rgba(74,46,20,0.15)' }}
      >
        <View {...arraste.panHandlers} className="items-center pb-1.5 pt-2.5" style={{ cursor: 'grab' } as object}>
          <View className="h-[5px] w-10 rounded-full bg-tracejado" />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 }} style={{ flexGrow: 0 }}>
          {/* Spec 117: volta pros Matches do comboio */}
          <Pressable onPress={aoMatches} className="items-center justify-center rounded-xl border border-borda bg-cartao px-3.5 py-2">
            <Text className="font-body-bold text-[13px] text-texto">Matches</Text>
            <Text className="font-body text-[11px] text-texto/85">do grupo</Text>
          </Pressable>
          {dias.map((d, i) => {
            const ativo = i === diaEscolhido
            return (
              <Pressable key={i} onPress={() => setDiaEscolhido(i)} className={`items-center rounded-xl border px-3.5 py-2 ${ativo ? 'border-couro bg-couro' : 'border-borda bg-cartao'}`}>
                <Text className={`font-body-bold text-[13px] ${ativo ? 'text-white' : 'text-texto'}`}>Dia {i + 1}</Text>
                <Text className={`font-body text-[11px] ${ativo ? 'text-white/85' : 'text-texto/85'}`}>{diaCurto(d)}</Text>
              </Pressable>
            )
          })}
        </ScrollView>
        <View className="flex-row items-center justify-between gap-3 px-5 pb-2 pt-3.5">
          <View className="min-w-0 flex-1">
            <Text className="font-display text-[22px] text-texto">{diaLongo(dia)}</Text>
            <Text className="font-body text-[13px] text-suave">{onde ? onde.nome : `${itens.length} paradas`}</Text>
          </View>
          {/* Spec 029: evento livre do comboio · Spec 122a: deslocamento de qualquer lugar pra qualquer lugar */}
          <View className="flex-row gap-2">
            <Pressable onPress={() => setForm({})} accessibilityLabel="Novo evento" className="h-10 flex-row items-center gap-1 rounded-xl border border-borda bg-cartao px-3 active:opacity-80">
              <Plus size={16} color={cor.couro} />
              <Text className="font-body-bold text-[13px] text-couro">Evento</Text>
            </Pressable>
            <Pressable onPress={() => novoDeslocamento()} accessibilityLabel="Novo deslocamento" className="h-10 flex-row items-center gap-1 rounded-xl bg-couro px-3 active:opacity-80">
              <Route size={16} color="#fff" />
              <Text className="font-body-bold text-[13px] text-white">Ir</Text>
            </Pressable>
          </View>
        </View>
        {resumo.comprados + resumo.prontos + resumo.pendentes > 0 ? (
          <View className="flex-row flex-wrap gap-1.5 px-5 pb-2">
            {resumo.comprados ? <Pilula fundo="#EEF0DF" cor="#5E6B2E" texto={`${resumo.comprados} ${resumo.comprados === 1 ? 'comprado' : 'comprados'}`} /> : null}
            {resumo.prontos ? <Pilula fundo="#F6EAD7" cor="#7B542F" texto={`${resumo.prontos} ${resumo.prontos === 1 ? 'decidido' : 'decididos'}`} /> : null}
            {resumo.pendentes ? <Pilula fundo="#FBEBD2" cor="#8A5A10" texto={`${resumo.pendentes} pra decidir`} /> : null}
          </View>
        ) : null}
        {previsaoDoDia ? (
          <View className="flex-row items-center gap-1.5 px-5 pb-1">
            <Icone nome={interpretarTempo(previsaoDoDia.codigo).icone} tamanho={20} cor={cor.couro} />
            <Text className="font-body-medium text-[13px] text-corpo">
              {interpretarTempo(previsaoDoDia.codigo).rotulo}
              {previsaoDoDia.tempMax != null ? ` · ${Math.round(previsaoDoDia.tempMax)}°` : ''}
              {previsaoDoDia.tempMin != null ? ` / ${Math.round(previsaoDoDia.tempMin)}°` : ''}
              {previsaoDoDia.tipo === 'estimativa' ? ' · estimativa' : ''}
            </Text>
          </View>
        ) : null}
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 120 }}>
          {itens.length === 0 ? (
            <Text className="mt-4 text-center font-body text-[14px] leading-5 text-corpo">
              Nada marcado pra esse dia ainda.{'\n'}Toque em "Ir" pra adicionar um deslocamento ou em "Evento".
            </Text>
          ) : (
            itens.map((it, i) => {
              // Lápis só nos eventos que eu criei (o ADM mexe em todos)
              const editavel = !!it.evento && (it.evento.criado_por === meuId || euSouAdm)
              const trilho = (
                <View className="w-3.5 items-center">
                  <View className="h-5 w-0.5" style={{ backgroundColor: i === 0 ? 'transparent' : '#E3D2B8' }} />
                  <View className="h-2.5 w-2.5 rounded-full border-2 border-fundo bg-couro" style={{ boxShadow: '0 0 0 1.5px #7B542F' }} />
                  <View className="w-0.5 flex-1" style={{ backgroundColor: i === itens.length - 1 ? 'transparent' : '#E3D2B8' }} />
                </View>
              )
              // Spec 122a: deslocamento é cartão (meio, de → para, detalhe, situação); o resto é linha leve
              if (it.desl) {
                const d = it.desl
                const [fundo, corTexto] = COR_DA_SITUACAO[d.situacao] ?? COR_DA_SITUACAO.sugestao
                const pendente = d.situacao === 'comparando' || d.situacao === 'sugestao'
                return (
                  <View key={it.chave}>
                    <View className="flex-row gap-3">
                      <Text className="w-[52px] pt-4 font-display text-[17px] text-texto">{it.hora}</Text>
                      {trilho}
                    <Pressable
                      onPress={() => (d.grupo && d.opcoes > 1 ? router.push(`/comparar?grupo=${d.grupo}` as Href) : novoDeslocamento(`&trajeto=${d.trajetoId}`))}
                      accessibilityLabel={`Abrir ${it.titulo}`}
                      className="mb-2.5 min-w-0 flex-1 gap-2.5 rounded-2xl border bg-cartao p-3 active:opacity-80"
                      style={{ borderColor: pendente ? cor.dourado : cor.borda }}
                    >
                      <View className="flex-row items-center gap-2.5">
                        <IconeQuadrado tamanho={34}>
                          <it.Icone size={18} color={cor.couro} />
                        </IconeQuadrado>
                        <View className="min-w-0 flex-1">
                          <Text className="font-body-bold text-[14px] text-texto">{it.titulo}</Text>
                          <Text className="mt-0.5 font-body text-[12px] leading-4 text-suave">{it.detalhe}</Text>
                        </View>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <Pilula fundo={fundo} cor={corTexto} texto={d.situacao === 'comparando' ? `Comparando · ${d.opcoes} opções` : nomeDaSituacaoDoDeslocamento(d.situacao)} />
                        {d.meio === 'trem' || d.meio === 'onibus' ? (
                          <Pressable onPress={() => router.push(`/caminho?trajeto=${d.trajetoId}` as Href)} hitSlop={8} className="ml-auto flex-row items-center gap-1">
                            <MapPin size={13} color={cor.couro} />
                            <Text className="font-body-bold text-[12px] text-couro">Paradas</Text>
                          </Pressable>
                        ) : null}
                      </View>
                    </Pressable>
                    </View>
                    {avisosDepoisDe(it.chave)}
                  </View>
                )
              }
              return (
                <View key={it.chave}>
                  <View className="flex-row gap-3">
                    <Text className="w-[52px] pt-4 font-display text-[17px] text-texto">{it.hora}</Text>
                    {trilho}
                  <Pressable
                    onPress={editavel ? () => setForm({ evento: it.evento }) : undefined}
                    disabled={!editavel}
                    accessibilityLabel={editavel ? `Editar ${it.titulo}` : undefined}
                    className="mb-1 min-w-0 flex-1 flex-row items-center gap-3 px-1 py-3 active:opacity-80"
                  >
                    <it.Icone size={18} color={cor.caramelo} />
                    <View className="min-w-0 flex-1">
                      <Text className="font-body-bold text-[14px] text-texto">{it.titulo}</Text>
                      {it.detalhe ? <Text className="mt-0.5 font-body text-[12.5px] text-suave">{it.detalhe}</Text> : null}
                    </View>
                    {editavel ? <Pencil size={15} color={cor.suave} /> : null}
                  </Pressable>
                  </View>
                  {avisosDepoisDe(it.chave)}
                </View>
              )
            })
          )}
        </ScrollView>
      </Animated.View>
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
  const linha = (
    <>
      <View className="w-[52px]" />
      <View className="w-3.5 items-center">
        <View className="w-0.5 flex-1" style={{ backgroundColor: '#E3D2B8' }} />
      </View>
    </>
  )
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

function Pilula({ fundo, cor: corTexto, texto }: { fundo: string; cor: string; texto: string }) {
  return (
    <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: fundo }}>
      <Text className="font-body-bold text-[11.5px]" style={{ color: corTexto }}>
        {texto}
      </Text>
    </View>
  )
}

// Onde o comboio está nesse dia (o destino cujo período inclui o dia)
function destinoDoDia(dia: string, destinos: Destino[]) {
  return destinos.find((d) => d.chegada && d.chegada <= dia && (d.saida ?? d.chegada) >= dia)
}

// Linha do tempo do dia (spec 029, igual à web): saídas, trajetos e eventos por hora, chegadas.
// No fim, os lugares do destino (ideias do que fazer, sem hora).
function montarDia(dia: string, destinos: Destino[], lugares: Lugar[], trajetos: Trajeto[], eventos: EventoDaAgenda[]): Item[] {
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
    for (const l of lugares.filter((x) => x.destino_id === onde.id)) {
      itens.push({ chave: 'l' + l.id, hora: '', Icone: ICONE_DO_LUGAR[l.tipo] ?? MapPin, titulo: l.nome, detalhe: [l.horario, l.observacao].filter(Boolean).join(' · ') })
    }
  }
  return itens
}

// O mapa é ilustrado (não é geográfico): os destinos ficam espalhados numa curva, na ordem
// do roteiro, entre o título e a folha. Com coordenadas reais, destinos perto uns dos
// outros (ex.: 5 cidades na Itália + 1 no Brasil) ficariam empilhados.
function posicionarPinos(destinos: Destino[], largura: number, topo: number, base: number) {
  const area = { x0: 44, x1: largura - 44, y0: topo, y1: base }
  return destinos.map((_d, i) => {
    const t = destinos.length <= 1 ? 0.5 : i / (destinos.length - 1)
    return { x: area.x0 + t * (area.x1 - area.x0), y: area.y0 + (area.y1 - area.y0) * (0.5 + 0.45 * Math.sin(t * Math.PI * 2)) }
  })
}

function MapaIlustrado({ largura, altura, pinos, destaque }: { largura: number; altura: number; pinos: { x: number; y: number }[]; destaque: number }) {
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, width: largura, height: altura }}>
      <Svg width={largura} height={altura} viewBox="0 0 393 560" preserveAspectRatio="none">
        <Rect width={393} height={560} fill="#EADBC2" />
        <Path d="M-20 120 C60 80 120 140 200 100 S340 60 420 110 L420 -10 L-20 -10Z" fill="#E1CDAE" />
        <Path d="M-20 300 C40 260 110 330 170 290 S300 250 420 300 L420 380 C320 340 220 400 120 360 S20 360 -20 380Z" fill="#E4D2B5" />
        <Ellipse cx={300} cy={170} rx={70} ry={40} fill="#DCC6A3" />
        <Ellipse cx={90} cy={220} rx={50} ry={28} fill="#DFCBAA" />
        <Path d="M-10 250 C60 240 90 200 150 210 S250 260 300 230 S380 160 410 170" fill="none" stroke="#C9B79A" strokeWidth={7} strokeLinecap="round" />
        <Path d="M40 -10 C60 80 30 160 70 260 S120 420 100 560" fill="none" stroke="#F6EEDF" strokeWidth={5} />
        <Path d="M-10 160 L130 170 L240 120 L410 140" fill="none" stroke="#F6EEDF" strokeWidth={4} />
        <Path d="M200 -10 L215 185 L250 560" fill="none" stroke="#F6EEDF" strokeWidth={3} />
      </Svg>
      {pinos.length > 1 ? (
        <Svg width={largura} height={altura} style={{ position: 'absolute' }}>
          <Polyline points={pinos.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#7B542F" strokeWidth={2.5} strokeDasharray="6 6" strokeLinecap="round" />
        </Svg>
      ) : null}
      {pinos.map((p, i) => (
        <View
          key={i}
          className="absolute h-[30px] w-[30px] items-center justify-center border-2 border-fundo"
          style={{
            left: p.x - 15,
            top: p.y - 15,
            borderRadius: 15,
            borderBottomLeftRadius: 4,
            transform: [{ rotate: '-45deg' }],
            backgroundColor: i === destaque ? cor.caramelo : cor.couro,
            boxShadow: '0 4px 10px rgba(74,46,20,0.3)',
          }}
        >
          <Text className="font-body-bold text-[12px] text-white" style={{ transform: [{ rotate: '45deg' }] }}>
            {i + 1}
          </Text>
        </View>
      ))}
    </View>
  )
}

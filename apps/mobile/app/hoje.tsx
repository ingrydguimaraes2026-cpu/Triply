import { useEffect, useState } from 'react'
import { Linking, Pressable, ScrollView, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter, type Href } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, MoreHorizontal, BedDouble, CalendarDays, Clock, KeyRound, ListChecks, Luggage, MapPin, Phone, Plane, Sun, TrainFront, Wifi } from '../src/ui/icones'
import {
  aeroportosDoVoo,
  agoraEProximo,
  antecedenciaDoEmbarque,
  chegadasPerto,
  horaDeSair,
  arquivoDeCada,
  buscarDestinos,
  buscarEventosDaAgenda,
  buscarPontosDeEncontro,
  destinoDoDia,
  diaDePassagem,
  diaNoFuso,
  faltaPara,
  horaNoFuso,
  linksDeGuardaVolumes,
  linkUltimoTrem,
  lerDiasDoRoteiro,
  montarAgendaDoDia,
  planoDoDia,
  quemChegaESaiHoje,
  registrarChegada,
  voltaPraBase,
  type Tables,
} from '@together/core'
import { useCarregar } from '../src/dados/useCarregar'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { Clima } from '../src/ui/Clima'
import { PontoDeEncontro } from '../src/ui/PontoDeEncontro'
import { supabase } from '../src/lib/supabase'
import { useSessao } from '../src/lib/sessao'
import { BilheteDoTrajeto, ItemDoPlanoDoDia, VerReserva } from '../src/ui/BilheteDoDia'
import { DividirTransfer, DoAeroporto, SaiaAs, useTemposAteOEmbarque } from '../src/ui/AjudaDoTrajeto'
import { diaLongo, hojeIso, lerData } from '../src/lib/formato'
import { StatusBar } from '../src/ui/StatusBar'
import { BotaoIr } from '../src/ui/BotaoIr'
import { Bloco, FerramentasDoDia } from '../src/ui/FerramentasDoDia'
import { BotaoRedondo, Cartao, Carregando, ErroNaTela } from '../src/ui/pecas'
import { cor } from '../theme'

// Tela Hoje (spec 058 no mobile, + 060, 062, 080 e 120a): o dia do grupo numa rolagem só.
// Ordem da 120a: agora/próximo → onde dormimos → quem chega e sai → plano do dia. Depois o resto.
async function buscarTudo(viagemId: string) {
  const [destinos, trajetos, eventos, pontos, hospedagens, guarda, roteiros, arquivos] = await Promise.all([
    buscarDestinos(supabase, viagemId),
    // Com os passageiros (spec 067), pra dizer quem chega
    supabase.from('trajetos').select('*, trajeto_passageiros (usuario_id)').eq('viagem_id', viagemId).order('partida', { ascending: true, nullsFirst: false }),
    buscarEventosDaAgenda(supabase, viagemId),
    buscarPontosDeEncontro(supabase, viagemId),
    supabase
      .from('hospedagens')
      .select('id, nome, endereco, destino_id, hora_checkin, hora_checkout, checkin, checkout, guarda_malas, guarda_malas_obs, como_chegar, codigo_porta, wifi_rede, wifi_senha, contato_anfitriao')
      .eq('viagem_id', viagemId)
      .eq('escolhida', true),
    supabase.from('lugares').select('id, nome, destino_id, link, horario').eq('viagem_id', viagemId).eq('tipo', 'guarda_volumes'),
    supabase.from('roteiros').select('destino_id, dias').eq('viagem_id', viagemId),
    supabase.from('arquivos_viagem').select('id, caminho, trajeto_id, hospedagem_id, evento_id, criado_em').eq('viagem_id', viagemId),
  ])
  for (const r of [trajetos, hospedagens, guarda, roteiros, arquivos]) if (r.error) throw r.error
  const dosRoteiros = (roteiros.data ?? []).map((r) => ({ destino_id: r.destino_id, dias: lerDiasDoRoteiro(r.dias) }))
  const ids = [...new Set(dosRoteiros.flatMap((r) => r.dias.flat()))]
  const lugares = ids.length
    ? await supabase.from('lugares').select('id, nome, endereco, latitude, longitude, visitado_em').in('id', ids)
    : { data: [], error: null }
  if (lugares.error) throw lugares.error
  return {
    destinos,
    trajetos: (trajetos.data ?? []).map(({ trajeto_passageiros, ...t }) => ({ ...t, passageiros: (trajeto_passageiros ?? []).map((p) => p.usuario_id) })),
    eventos,
    pontos,
    hospedagens: hospedagens.data ?? [],
    guarda: guarda.data ?? [],
    roteiros: dosRoteiros,
    lugares: (lugares.data ?? []) as Pick<Tables<'lugares'>, 'id' | 'nome' | 'endereco' | 'latitude' | 'longitude' | 'visitado_em'>[],
    arquivos: {
      trajeto: arquivoDeCada(arquivos.data ?? [], 'trajeto_id'),
      hospedagem: arquivoDeCada(arquivos.data ?? [], 'hospedagem_id'),
      evento: arquivoDeCada(arquivos.data ?? [], 'evento_id'),
    },
  }
}

function horaDe(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// Tela solta (aberta pelo "Tudo da viagem" ou por aviso). Na viagem, a aba Viagem mostra o mesmo conteúdo (spec 117).
export default function TelaDoHoje() {
  return <Hoje />
}

export function Hoje({ naAba = false }: { naAba?: boolean }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { atual: viagem, meuId } = useViagemAtual()
  // Convidado pelo link vê o plano do dia, mas não o endereço, o código nem as reservas (spec 120a)
  const { ehConvidado } = useSessao()
  const [chegamos, setChegamos] = useState<Set<string>>(() => new Set())
  // Só em desenvolvimento: /hoje?dia=2027-06-07T10:00 simula outro dia (pra testar fora da viagem)
  const { dia: simulado } = useLocalSearchParams<{ dia?: string }>()
  const carga = useCarregar(viagem ? () => buscarTudo(viagem.id) : null, [viagem?.id])
  const { tempos, escolher } = useTemposAteOEmbarque()
  // O relógio anda a cada minuto (o "próximo" e o "em 20 min" se atualizam sozinhos)
  const relogio = () => (__DEV__ && simulado ? new Date(simulado) : new Date())
  const [agora, setAgora] = useState(relogio)
  useEffect(() => {
    const t = setInterval(() => setAgora(relogio()), 60_000)
    return () => clearInterval(t)
  }, [simulado])

  if (!viagem) return null
  if (carga.status === 'carregando') return <Carregando />
  if (carga.status === 'erro') return <ErroNaTela aoTentar={carga.recarregar} />
  const { destinos, trajetos, eventos, pontos, hospedagens, guarda, roteiros, lugares, arquivos } = carga.dados

  const hoje = __DEV__ && simulado ? simulado.slice(0, 10) : hojeIso()
  const horaAtual = horaDe(agora)
  const onde = destinoDoDia(hoje, destinos)
  const itens = montarAgendaDoDia(hoje, { destinos, trajetos, eventos })
  const { agora: itemAgora, proximo } = agoraEProximo(itens, horaAtual)
  const passagem = diaDePassagem(hoje, onde, trajetos, destinos, diaNoFuso, horaNoFuso)
  const bateEVolta = voltaPraBase(hoje, trajetos, diaNoFuso)
  const dormimos = onde ? hospedagens.find((h) => h.destino_id === onde.id) : undefined
  const guardaDaqui = onde ? guarda.filter((g) => g.destino_id === onde.id) : []
  const encontros = pontos.filter((p) => p.quando && diaNoFuso(p.quando) === hoje)
  const nomeDo = (id: string | null) => destinos.find((d) => d.id === id)?.nome ?? '?'
  const membros = viagem.membros.map((m) => ({ id: m.id, nome: m.nome }))
  const movimentos = quemChegaESaiHoje(hoje, trajetos, destinos, membros, diaNoFuso, horaNoFuso)
  const plano = planoDoDia(hoje, { destinos, eventos, roteiros, lugares })

  // "Cheguei" (spec 120a): avisa o grupo (chegadas, spec 051) e marca o lugar como visitado.
  // O carimbo do lugar (118a) entra na 120c.
  async function cheguei(item: (typeof plano)[number]) {
    if (!viagem) return
    setChegamos((s) => new Set(s).add(item.chave))
    try {
      await registrarChegada(supabase, viagem.id, item.titulo)
      if (item.lugarId) await supabase.rpc('marcar_visitado', { p_lugar: item.lugarId, p_visitado: true })
    } catch {
      setChegamos((s) => {
        const n = new Set(s)
        n.delete(item.chave)
        return n
      })
    }
  }

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: insets.bottom + 40, gap: 12 }}>
        <View className="flex-row justify-between">
          <BotaoRedondo aoTocar={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
            <ArrowLeft size={20} color={cor.texto} />
          </BotaoRedondo>
          {/* Na aba Viagem, o "Tudo da viagem" continua a 1 toque */}
          {naAba ? (
            <BotaoRedondo aoTocar={() => router.push('/tudo-da-viagem')}>
              <MoreHorizontal size={20} color={cor.texto} />
            </BotaoRedondo>
          ) : null}
        </View>
        <View>
          <Text className="font-display text-[32px] text-texto">{onde ? `Hoje em ${onde.nome}` : 'Hoje'}</Text>
          <Text className="mt-0.5 font-body text-[14px] text-suave">{diaLongo(lerData(hoje))}</Text>
        </View>

        {!onde ? (
          <Cartao className="flex-row items-center gap-3 p-4">
            <Sun size={20} color={cor.caramelo} />
            <Text className="flex-1 font-body text-[14px] leading-5 text-corpo">
              Hoje não é dia de viagem no roteiro. Esta tela ganha vida nos dias da viagem.
            </Text>
          </Cartao>
        ) : (
          <Cartao className="gap-3 p-4">
            {itemAgora ? <ItemDoDia rotulo="Agora" destaque hora={itemAgora.hora} titulo={itemAgora.titulo} detalhe={itemAgora.detalhe} /> : null}
            {proximo ? (
              <ItemDoDia rotulo={`Próximo · ${faltaPara(proximo.hora, horaAtual)}`} hora={proximo.hora} titulo={proximo.titulo} detalhe={proximo.detalhe} />
            ) : (
              <Text className="font-body text-[14px] text-suave">{itens.length ? 'Nada mais com hora marcada hoje.' : 'Nada marcado pra hoje.'}</Text>
            )}
            <Pressable onPress={() => router.navigate(`/viagem/${viagem.id}/roteiro` as Href)} className="flex-row items-center gap-1.5 border-t border-linha pt-3 active:opacity-80">
              <CalendarDays size={15} color={cor.couro} />
              <Text className="font-body-bold text-[13px] text-couro">Ver o dia inteiro no Roteiro</Text>
            </Pressable>
          </Cartao>
        )}

        {/* Spec 120a: convidado pelo link não vê endereço nem código */}
        {onde && !ehConvidado ? (
          <Bloco Icone={BedDouble} titulo="Onde dormimos hoje">
            {dormimos ? (
              <>
                <Text className="font-body-bold text-[15px] text-texto">{dormimos.nome}</Text>
                {dormimos.endereco ? <Text className="font-body text-[13px] text-suave">{dormimos.endereco}</Text> : null}
                {dormimos.hora_checkin || dormimos.hora_checkout ? (
                  <Text className="font-body text-[13px] text-suave">
                    {[
                      dormimos.hora_checkin ? `Check-in ${dormimos.checkin === hoje ? 'hoje ' : ''}a partir das ${dormimos.hora_checkin.slice(0, 5)}` : null,
                      dormimos.hora_checkout ? `check-out ${dormimos.checkout === hoje ? 'hoje ' : ''}até ${dormimos.hora_checkout.slice(0, 5)}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                ) : null}
                {/* Spec 062: no dia da chegada, como chegar do aeroporto/estação */}
                {dormimos.como_chegar && onde.chegada === hoje ? (
                  <Text className="font-body text-[13px] leading-5 text-corpo">
                    <Text className="font-body-bold">Como chegar:</Text> {dormimos.como_chegar}
                  </Text>
                ) : null}
                {dormimos.contato_anfitriao ? (
                  <View className="flex-row items-center gap-1.5">
                    <Phone size={14} color={cor.couro} />
                    <Text selectable className="min-w-0 flex-1 font-body text-[13px] text-corpo">
                      Anfitrião: <Text className="font-body-bold text-texto">{dormimos.contato_anfitriao}</Text>
                    </Text>
                  </View>
                ) : null}
                {dormimos.codigo_porta ? (
                  <View className="flex-row items-center gap-1.5">
                    <KeyRound size={14} color={cor.couro} />
                    <Text selectable className="font-body text-[13px] text-corpo">
                      Código de acesso: <Text className="font-body-bold text-texto">{dormimos.codigo_porta}</Text>
                    </Text>
                  </View>
                ) : null}
                {dormimos.wifi_rede ? (
                  <View className="flex-row items-center gap-1.5">
                    <Wifi size={14} color={cor.couro} />
                    <Text selectable className="min-w-0 flex-1 font-body text-[13px] text-corpo">
                      {dormimos.wifi_rede}
                      {dormimos.wifi_senha ? <Text className="font-body-bold text-texto"> · {dormimos.wifi_senha}</Text> : null}
                    </Text>
                  </View>
                ) : null}
                <View className="flex-row flex-wrap gap-2">
                  {dormimos.endereco ? <BotaoIr alvo={{ nome: dormimos.nome, endereco: dormimos.endereco }} /> : null}
                  <VerReserva caminho={arquivos.hospedagem.get(dormimos.id)?.caminho ?? null} />
                </View>
              </>
            ) : (
              <Text className="font-body text-[14px] leading-5 text-corpo">Nenhuma hospedagem escolhida em {onde.nome}. O ADM escolhe em Hospedagem.</Text>
            )}
          </Bloco>
        ) : null}

        {/* Spec 120a: quem chega e quem sai hoje, como bilhetes */}
        {movimentos.length > 0 && !ehConvidado ? (
          <View className="gap-2">
            <View className="flex-row items-center gap-2 px-1">
              <Plane size={16} color={cor.couro} />
              <Text className="font-body-bold text-[15px] text-texto">Quem chega e quem sai hoje</Text>
            </View>
            {movimentos.map((m) => {
              const t = trajetos.find((x) => x.id === m.trajetoId)
              const chegaEm = t && m.tipo === 'chega' ? aeroportosDoVoo(t, destinos).chegada : null
              const perto = t && m.tipo === 'chega' ? chegadasPerto(t, trajetos, destinos)[0] : undefined
              const casa = t ? hospedagens.find((h) => h.destino_id === t.destino_id) : undefined
              return (
                <BilheteDoTrajeto key={m.chave} m={m} caminhoNoCofre={arquivos.trajeto.get(m.trajetoId)?.caminho ?? null}>
                  {t?.partida && m.tipo === 'sai' && antecedenciaDoEmbarque(t.meio, true) !== null ? (
                    <SaiaAs saida={horaDeSair(t, destinos, tempos[t.id] ?? null)} partida={t.partida} aoEscolher={(x) => escolher(t.id, x)} />
                  ) : null}
                  {t && perto ? (
                    <DividirTransfer
                      nomes={perto.pessoas.map((id) => membros.find((p) => p.id === id)?.nome.split(' ')[0] ?? 'Alguém')}
                      minutos={perto.minutos}
                      aeroporto={chegaEm}
                      pessoas={t.passageiros.length + perto.pessoas.length}
                    />
                  ) : null}
                  {/* Sem o "como chegar" escrito no guia da casa (062), a tabela ajuda */}
                  {chegaEm && !casa?.como_chegar ? (
                    <DoAeroporto aeroporto={chegaEm} nomeDaCasa={casa?.nome ?? null} ate={casa?.endereco || m.para} />
                  ) : null}
                </BilheteDoTrajeto>
              )
            })}
          </View>
        ) : null}

        {/* Spec 120a: plano do dia (roteiro + agenda), cada um com "Ir" e "Cheguei" */}
        {onde ? (
          <Bloco Icone={ListChecks} titulo="Plano do dia">
            {plano.length ? (
              plano.map((item) => (
                <ItemDoPlanoDoDia
                  caminhoNoCofre={item.eventoId ? (arquivos.evento.get(item.eventoId)?.caminho ?? null) : null}
                  key={item.chave}
                  item={item}
                  chegou={item.visitado || chegamos.has(item.chave)}
                  podeChegar={!ehConvidado}
                  aoChegar={() => void cheguei(item)}
                />
              ))
            ) : (
              <Text className="font-body text-[14px] leading-5 text-corpo">Nada no roteiro de hoje. Montem o dia na tela Roteiro.</Text>
            )}
          </Bloco>
        ) : null}

        {/* Spec 080: bate-e-volta hoje → hora da volta pra base */}
        {bateEVolta ? (
          <Bloco Icone={TrainFront} titulo="Volta pra base">
            {bateEVolta.volta?.partida ? (
              <Text className="font-body text-[14px] leading-5 text-corpo">
                Volta de {nomeDo(bateEVolta.ida.destino_id)} pra {nomeDo(bateEVolta.ida.origem_id)} às{' '}
                <Text className="font-body-bold text-texto">{horaNoFuso(bateEVolta.volta.partida)}</Text>. Não percam!
              </Text>
            ) : (
              <Text className="font-body text-[14px] leading-5 text-corpo">
                Bate-e-volta pra {nomeDo(bateEVolta.ida.destino_id)} sem volta marcada. Confira o último trem.
              </Text>
            )}
            <Link titulo="Último trem de hoje" url={linkUltimoTrem(nomeDo(bateEVolta.ida.destino_id), nomeDo(bateEVolta.ida.origem_id))} />
          </Bloco>
        ) : null}

        {/* Spec 060: dia de passagem ou de trocar de cidade → malas e hora de sair */}
        {passagem && onde ? (
          <Bloco Icone={Luggage} titulo={passagem.tipo === 'passagem' ? 'Dia de passagem' : 'Dia de trocar de cidade'}>
            {passagem.saida ? (
              <Text className="font-body text-[14px] leading-5 text-corpo">
                Saída <Text className="font-body-bold text-texto">{passagem.saida.hora}</Text> pra {passagem.saida.para}. Malas prontas antes do check-out.
              </Text>
            ) : (
              <Text className="font-body text-[14px] leading-5 text-corpo">Hoje vocês saem de {onde.nome}. Malas prontas antes do check-out.</Text>
            )}
            {dormimos?.guarda_malas === 'sim' ? (
              <Text className="font-body text-[13px] text-suave">
                {dormimos.nome} guarda as malas{dormimos.guarda_malas_obs ? ` (${dormimos.guarda_malas_obs})` : ''}.
              </Text>
            ) : null}
            {guardaDaqui.map((g) => (
              <Link key={g.id} titulo={[g.nome, g.horario].filter(Boolean).join(' · ')} url={g.link || linksDeGuardaVolumes(onde.nome)[0].url} />
            ))}
            {guardaDaqui.length === 0 && dormimos?.guarda_malas !== 'sim'
              ? linksDeGuardaVolumes(onde.nome).map((l) => <Link key={l.nome} titulo={`Guarda-volumes: ${l.nome}`} url={l.url} />)
              : null}
          </Bloco>
        ) : null}

        {encontros.length > 0 ? (
          <Bloco Icone={MapPin} titulo="Encontro hoje">
            {encontros.map((p) => (
              <View key={p.id} className="gap-2">
                <Text className="font-body text-[14px] text-corpo">
                  <Text className="font-body-bold text-texto">{horaNoFuso(p.quando!)}</Text> {p.local}
                </Text>
                <BotaoIr alvo={{ nome: p.local, latitude: p.latitude, longitude: p.longitude }} />
              </View>
            ))}
          </Bloco>
        ) : null}

        {/* Spec 059: as ferramentas valem até fora da viagem (o destino é o de hoje ou o primeiro) */}
        <FerramentasDoDia destino={onde ?? destinos[0] ?? null} moedaViagem={viagem.moeda} enderecoHospedagem={dormimos?.endereco ?? null} />

        {/* Na aba Viagem (spec 117): clima e ponto de encontro do comboio ficam aqui também */}
        {naAba ? (
          <>
            <Clima viagemId={viagem.id} />
            <PontoDeEncontro viagemId={viagem.id} meuId={meuId} euSouAdm={viagem.membros.some((m) => m.id === meuId && m.papel === 'adm')} />
          </>
        ) : null}
      </ScrollView>
    </View>
  )
}

function ItemDoDia({ rotulo, destaque, hora, titulo, detalhe }: { rotulo: string; destaque?: boolean; hora: string; titulo: string; detalhe: string }) {
  return (
    <View className="gap-0.5">
      <View className="flex-row items-center gap-1.5">
        {destaque ? null : <Clock size={13} color={cor.suave} />}
        <Text className={`font-body-bold text-[12px] uppercase tracking-wider ${destaque ? 'text-caramelo' : 'text-suave'}`}>{rotulo}</Text>
      </View>
      <Text className="font-body-bold text-[16px] text-texto">
        {hora} · {titulo}
      </Text>
      {detalhe ? <Text className="font-body text-[13px] text-suave">{detalhe}</Text> : null}
    </View>
  )
}

function Link({ titulo, url }: { titulo: string; url: string }) {
  return (
    <Pressable onPress={() => Linking.openURL(url)} className="active:opacity-80">
      <Text className="font-body-bold text-[13px] text-couro underline">{titulo}</Text>
    </Pressable>
  )
}

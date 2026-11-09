import { useCallback, useRef, useState } from 'react'
import { Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { StatusBar } from '../src/ui/StatusBar'
import { useFocusEffect, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AlertTriangle, ArrowLeft, Bus, Car, ChevronRight, Footprints, Plane, Plus, Route, Ship, TrainFront, Trash2, type LucideIcon } from '../src/ui/icones'
import {
  arquivoDeCada,
  buscarDestinos,
  buscarOpcoesDeHospedagem,
  formatarDinheiro,
  meioComCaminho,
  meioComMotorista,
  nomeDaSituacao,
  nomeDaSituacaoDoDeslocamento,
  nomeDoMeio,
  passagensDaViagem,
  type CasaDoDia,
  type Destino,
  type ItemDaPassagem,
  type Trajeto,
} from '@together/core'
import { useCarregar } from '../src/dados/useCarregar'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { diaCurto, hora, lerData, primeiroNome } from '../src/lib/formato'
import { supabase } from '../src/lib/supabase'
import { Norti } from '../src/ui/Norti'
import { BotaoIr } from '../src/ui/BotaoIr'
import { VerReserva } from '../src/ui/BilheteDoDia'
import { BotaoRedondo, Cartao, Carregando, ErroNaTela, IconeQuadrado } from '../src/ui/pecas'
import { cor } from '../theme'
import { puxarPraAtualizar } from '../src/ui/Puxar'

// Passagens (spec 122d, no lugar de Transportes): o que falta decidir, o que falta comprar e o que já foi
// comprado, os avisos sérios da viagem toda e quanto custa o transporte. Tocar num item abre a comparação
// (quando tem opções) ou o deslocamento. A chegada e a volta de cada um (lançadas pela reserva) ficam no fim.
const ICONE_DO_MEIO: Record<string, LucideIcon> = { aviao: Plane, carro: Car, carona: Car, onibus: Bus, metro: TrainFront, trem: TrainFront, barco: Ship, a_pe: Footprints }

type TrajetoComGente = Trajeto & { passageiros: string[] }
type Membro = { id: string; nome: string; papel: string }

async function carregar(viagemId: string) {
  const [trajetos, destinos, arquivos, casas] = await Promise.all([
    supabase.from('trajetos').select('*, trajeto_passageiros (usuario_id)').eq('viagem_id', viagemId).order('partida', { ascending: true, nullsFirst: false }),
    buscarDestinos(supabase, viagemId),
    supabase.from('arquivos_viagem').select('id, caminho, trajeto_id, hospedagem_id, evento_id, criado_em').eq('viagem_id', viagemId).not('trajeto_id', 'is', null),
    // As casas escolhidas entram nos avisos (check-in). Sem elas, a tela funciona igual.
    buscarOpcoesDeHospedagem(supabase, viagemId)
      .then((ops) => ops.filter((o) => o.escolhida) as CasaDoDia[])
      .catch(() => [] as CasaDoDia[]),
  ])
  if (trajetos.error) throw trajetos.error
  const lista: TrajetoComGente[] = (trajetos.data ?? []).map(({ trajeto_passageiros, ...t }) => ({ ...t, passageiros: (trajeto_passageiros ?? []).map((p) => p.usuario_id) }))
  return { trajetos: lista, destinos, casas, cofre: arquivoDeCada(arquivos.data ?? [], 'trajeto_id') }
}

export default function Transportes() {
  return <TelaDePassagens />
}

// Spec 122d: a mesma tela entra na aba Reservas (naAba: sem voltar, sem título, sem a margem de cima)
export function TelaDePassagens({ naAba = false }: { naAba?: boolean }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { atual: viagem, meuId } = useViagemAtual()
  const carga = useCarregar(viagem ? () => carregar(viagem.id) : null, [viagem?.id])
  // Voltou do Novo deslocamento ou do Comparar: busca de novo pra mostrar o que mudou
  const primeiraVez = useRef(true)
  const { recarregar } = carga
  useFocusEffect(
    useCallback(() => {
      if (primeiraVez.current) primeiraVez.current = false
      else recarregar()
    }, [recarregar]),
  )

  if (!viagem) return null
  if (carga.status === 'carregando') return <Carregando />
  if (carga.status === 'erro') return <ErroNaTela aoTentar={carga.recarregar} />
  const { trajetos, destinos, casas, cofre } = carga.dados
  const membros: Membro[] = viagem.membros.map((m) => ({ id: m.id, nome: m.nome, papel: m.papel }))
  const euSouAdm = membros.some((m) => m.id === meuId && m.papel === 'adm')
  // Chegada e volta de cada um (lançadas pela reserva) ficam no fim, com o cartão completo
  const pessoais = trajetos.filter((t) => t.tipo === 'chegada' || t.tipo === 'saida')
  const doGrupo = trajetos.filter((t) => t.tipo !== 'chegada' && t.tipo !== 'saida')
  const p = passagensDaViagem(doGrupo, destinos, casas)
  const nada = trajetos.length === 0
  const ctx = { destinos, membros, meuId, euSouAdm, cofre, aoMudar: carga.recarregar }
  const abrir = (i: ItemDaPassagem) => router.push(i.grupo && i.opcoes > 1 ? `/comparar?grupo=${i.grupo}` : `/novo-deslocamento?trajeto=${i.id}${i.dia ? `&dia=${i.dia}` : ''}`)
  const moedas = Object.keys(p.total)

  return (
    <View className="flex-1 bg-fundo">
      {naAba ? null : <StatusBar style="dark" />}
      <ScrollView refreshControl={puxarPraAtualizar(carga)} contentContainerStyle={{ paddingTop: naAba ? 8 : insets.top + 8, paddingHorizontal: 20, paddingBottom: (naAba ? 0 : insets.bottom) + 100, gap: 12 }}>
        {naAba ? null : (
        <>
        <BotaoRedondo aoTocar={() => (router.canGoBack() ? router.back() : router.replace('/'))} rotulo="Voltar">
          <ArrowLeft size={20} color={cor.texto} />
        </BotaoRedondo>
        <View>
          <Text className="font-display text-[32px] leading-[36px] text-texto">Passagens</Text>
          <Text className="mt-1 font-body text-[14px] text-suave">O que falta decidir, o que falta comprar e o que já está garantido.</Text>
        </View>
        </>
        )}

        {nada ? (
          <View className="mt-4 items-center gap-3 px-4">
            <Norti humor="dormindo" tamanho={110} />
            <Text className="text-center font-display text-[22px] text-texto">Nenhum deslocamento ainda</Text>
            <Text className="text-center font-body text-[15px] leading-6 text-corpo">Toque em "Novo deslocamento", diga de onde e pra onde e veja as opções.</Text>
          </View>
        ) : (
          <View className="flex-row gap-2">
            <Contador numero={p.decidir.length} rotulo="pra decidir" fundo="#FBEBD2" corTexto="#8A5A10" />
            <Contador numero={p.comprar.length} rotulo="pra comprar" fundo="#F6EAD7" corTexto="#7B542F" />
            <Contador numero={p.compradas.length} rotulo={p.compradas.length === 1 ? 'comprada' : 'compradas'} fundo="#EEF0DF" corTexto="#5E6B2E" />
          </View>
        )}

        {p.avisos.length ? (
          <Cartao className="gap-2.5 p-4">
            <View className="flex-row items-center gap-2">
              <AlertTriangle size={17} color="#A23B2A" />
              <Text className="font-body-bold text-[14px] text-texto">{p.avisos.length === 1 ? '1 coisa pra olhar' : `${p.avisos.length} coisas pra olhar`}</Text>
            </View>
            {p.avisos.map((a) => (
              <Pressable
                key={`${a.dia}-${a.chave}`}
                onPress={() => (a.trajetoId ? router.push(`/novo-deslocamento?trajeto=${a.trajetoId}&dia=${a.dia}`) : undefined)}
                accessibilityRole="button"
                className="border-t border-borda pt-2.5 active:opacity-80"
              >
                <Text className="font-body-bold text-[13.5px] text-texto">
                  {diaCurto(lerData(a.dia))} · {a.titulo}
                </Text>
                <Text className="font-body text-[12.5px] leading-5 text-suave">{a.texto}</Text>
              </Pressable>
            ))}
          </Cartao>
        ) : null}

        <Lista titulo="Pra decidir" itens={p.decidir} aoAbrir={abrir} />
        <Lista titulo="Pra comprar" itens={p.comprar} aoAbrir={abrir} />
        <Lista titulo="Compradas" itens={p.compradas} aoAbrir={abrir} />

        {moedas.length ? (
          <Cartao className="gap-1 p-4">
            <Text className="font-body-bold text-[12px] uppercase tracking-widest text-caramelo">Transporte da viagem</Text>
            {moedas.map((m) => (
              <View key={m} className="flex-row items-baseline justify-between">
                <Text className="font-display text-[22px] text-texto">{formatarDinheiro(Math.round(p.total[m] * 100), m)}</Text>
                <Text className="font-body text-[13px] text-suave">{formatarDinheiro(Math.round((p.pago[m] ?? 0) * 100), m)} já pago</Text>
              </View>
            ))}
            <Text className="font-body text-[12px] text-suave">Soma do preço de cada deslocamento (a opção escolhida). Não entra nos gastos sozinho.</Text>
          </Cartao>
        ) : null}

        {pessoais.length ? <Text className="mt-2 font-body-bold text-[12px] uppercase tracking-widest text-caramelo">Chegada e volta de cada um</Text> : null}
        {pessoais.map((tr) => (
          <Passagem key={tr.id} trajeto={tr} ctx={ctx} />
        ))}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 px-5" style={{ paddingBottom: (naAba ? 0 : insets.bottom) + 12 }}>
        <Pressable onPress={() => router.push('/novo-deslocamento')} accessibilityRole="button" className="min-h-[54px] flex-row items-center justify-center gap-2 rounded-full bg-couro active:opacity-90">
          <Plus size={18} color={cor.creme} />
          <Text className="font-body-bold text-[15px] text-creme">Novo deslocamento</Text>
        </Pressable>
      </View>
    </View>
  )
}

function Contador({ numero, rotulo, fundo, corTexto }: { numero: number; rotulo: string; fundo: string; corTexto: string }) {
  return (
    <View className="flex-1 items-center rounded-2xl py-3" style={{ backgroundColor: fundo }}>
      <Text className="font-display text-[26px]" style={{ color: corTexto }}>
        {numero}
      </Text>
      <Text className="font-body-bold text-[12px]" style={{ color: corTexto }}>
        {rotulo}
      </Text>
    </View>
  )
}

function Lista({ titulo, itens, aoAbrir }: { titulo: string; itens: ItemDaPassagem[]; aoAbrir: (i: ItemDaPassagem) => void }) {
  if (!itens.length) return null
  return (
    <View className="gap-2">
      <Text className="mt-2 font-body-bold text-[12px] uppercase tracking-widest text-caramelo">{titulo}</Text>
      {itens.map((i) => {
        const Icone = ICONE_DO_MEIO[i.meio] ?? Route
        const linha = [
          i.dia ? diaCurto(lerData(i.dia)) : 'Sem data',
          i.hora,
          i.situacao === 'comparando' ? `${i.opcoes} opções` : nomeDoMeio(i.meio),
          i.situacao === 'reservado' ? nomeDaSituacaoDoDeslocamento(i.situacao) : null,
          i.naHora ? 'compra na hora' : null,
        ]
          .filter(Boolean)
          .join(' · ')
        return (
          <Pressable key={i.id} onPress={() => aoAbrir(i)} accessibilityRole="button" className="active:opacity-80">
            <Cartao className="flex-row items-center gap-3 p-3.5">
              <IconeQuadrado tamanho={36}>
                <Icone size={19} color={cor.couro} />
              </IconeQuadrado>
              <View className="flex-1">
                <Text className="font-body-bold text-[14.5px] text-texto" numberOfLines={1}>
                  {i.titulo}
                </Text>
                <Text className="font-body text-[12.5px] text-suave" numberOfLines={1}>
                  {linha}
                </Text>
              </View>
              {i.preco != null && i.moeda ? <Text className="font-body-bold text-[14px] text-texto">{formatarDinheiro(Math.round(i.preco * 100), i.moeda)}</Text> : null}
              <ChevronRight size={16} color={cor.suave} />
            </Cartao>
          </Pressable>
        )
      })}
    </View>
  )
}

type Ctx = {
  destinos: Destino[]
  membros: Membro[]
  meuId: string
  euSouAdm: boolean
  cofre: Map<string, { caminho: string }>
  aoMudar: () => void
}

function Passagem({ trajeto: t, ctx, compacto = false, rotulo }: { trajeto: TrajetoComGente; ctx: Ctx; compacto?: boolean; rotulo?: string }) {
  const router = useRouter()
  const [ocupado, setOcupado] = useState(false)
  const Icone = ICONE_DO_MEIO[t.meio] ?? Route
  const nomeDe = (id: string | null) => ctx.destinos.find((d) => d.id === id)?.nome ?? null
  const origem = t.estacao_partida ?? nomeDe(t.origem_id) ?? 'De fora'
  const destino = t.estacao_chegada ?? nomeDe(t.destino_id) ?? 'Pra casa'
  const nomeDo = (id: string | null) => ctx.membros.find((m) => m.id === id)?.nome ?? null
  const podeMexer = ctx.euSouAdm || t.criado_por === ctx.meuId
  const ehChegada = t.tipo === 'chegada'
  const euBusco = t.quem_busca_id === ctx.meuId
  const quemBusca = nomeDo(t.quem_busca_id)
  const gente = t.passageiros.length ? t.passageiros.map((id) => primeiroNome(nomeDo(id) ?? '')).filter(Boolean) : []
  const detalhe = [
    rotulo,
    t.partida ? diaCurto(new Date(t.partida)) : null,
    t.observacao,
    t.situacao !== 'sugestao' ? nomeDaSituacao(t.situacao) : null,
  ]
    .filter(Boolean)
    .join(' · ')
  const estacao = t.estacao_partida ? { nome: t.estacao_partida, cidade: nomeDe(t.origem_id) } : null

  async function buscar() {
    setOcupado(true)
    const { error } = await supabase.rpc('vou_buscar', { p_trajeto: t.id, p_buscar: !euBusco })
    setOcupado(false)
    if (error) return Alert.alert('Não deu', 'Confira a internet e tente de novo.')
    ctx.aoMudar()
  }

  function apagar() {
    Alert.alert('Apagar este transporte?', 'Some pra todo mundo do comboio.', [
      { text: 'Manter', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('trajetos').delete().eq('id', t.id)
          if (error) return Alert.alert('Não deu pra apagar', 'Só quem lançou ou o ADM apaga.')
          ctx.aoMudar()
        },
      },
    ])
  }

  const corpo = (
    <>
      <View className="flex-row items-center gap-2.5">
        <IconeQuadrado tamanho={compacto ? 32 : 36}>
          <Icone size={compacto ? 17 : 19} color={cor.couro} />
        </IconeQuadrado>
        <View className="flex-1">
          <Text className="font-body-bold text-[14px] text-texto" numberOfLines={1}>
            {nomeDoMeio(t.meio)}
            {t.bate_e_volta ? ' · bate e volta' : ''}
          </Text>
          {detalhe ? (
            <Text className="font-body text-[12.5px] text-suave" numberOfLines={2}>
              {detalhe}
            </Text>
          ) : null}
        </View>
        {podeMexer ? (
          <Pressable onPress={apagar} hitSlop={10} accessibilityRole="button" accessibilityLabel="Apagar transporte" className="p-1">
            <Trash2 size={16} color={cor.suave} />
          </Pressable>
        ) : null}
      </View>
      <View className="flex-row items-center gap-3">
        <View className="max-w-[40%]">
          <Text className={`font-display text-texto ${compacto ? 'text-[17px]' : 'text-[20px]'}`} numberOfLines={1}>
            {origem}
          </Text>
          <Text className="font-body text-[12.5px] text-suave">{t.partida ? hora(t.partida) : '—'}</Text>
        </View>
        <View className="flex-1 flex-row items-center gap-1.5">
          <View className="flex-1 border-t-[1.5px] border-dashed border-tracejado" />
          <Icone size={16} color={cor.caramelo} />
          <View className="flex-1 border-t-[1.5px] border-dashed border-tracejado" />
        </View>
        <View className="max-w-[40%] items-end">
          <Text className={`font-display text-texto ${compacto ? 'text-[17px]' : 'text-[20px]'}`} numberOfLines={1}>
            {destino}
          </Text>
          <Text className="font-body text-[12.5px] text-suave">{t.chegada ? hora(t.chegada) : '—'}</Text>
        </View>
      </View>
      {gente.length && !compacto ? <Text className="font-body text-[12.5px] text-suave">Vão: {gente.join(', ')}</Text> : null}
      {meioComMotorista(t.meio) && (t.motorista_id || t.lugares_livres != null) ? (
        <Text className="font-body text-[12.5px] text-suave">
          {[t.motorista_id ? `Dirige: ${primeiroNome(nomeDo(t.motorista_id) ?? '')}` : null, t.lugares_livres != null ? `${t.lugares_livres} ${t.lugares_livres === 1 ? 'lugar sobrando' : 'lugares sobrando'}` : null].filter(Boolean).join(' · ')}
        </Text>
      ) : null}
      {ehChegada && quemBusca && !euBusco ? <Text className="font-body-medium text-[12.5px] text-verde">{primeiroNome(quemBusca)} vai buscar</Text> : null}
      <View className="flex-row flex-wrap gap-2">
        {ctx.cofre.get(t.id) || t.link_reserva ? <VerReserva caminho={ctx.cofre.get(t.id)?.caminho ?? null} link={t.link_reserva} /> : null}
        {estacao ? <BotaoIr alvo={estacao} corrida rotulo="Como chegar na estação" /> : null}
        {meioComCaminho(t.meio) ? (
          <Pressable onPress={() => router.push(`/caminho?trajeto=${t.id}`)} accessibilityRole="button" className="flex-row items-center gap-1.5 rounded-xl bg-chip px-3 py-2 active:opacity-80">
            <Route size={15} color={cor.couro} />
            <Text className="font-body-bold text-[13px] text-couro">Ver o caminho</Text>
          </Pressable>
        ) : null}
        {ehChegada && t.criado_por !== ctx.meuId && !t.passageiros.includes(ctx.meuId) ? (
          <Pressable onPress={() => void buscar()} disabled={ocupado} accessibilityRole="button" className={`rounded-xl px-3 py-2 active:opacity-80 ${euBusco ? 'bg-verde-fundo' : 'bg-chip'}`}>
            <Text className={`font-body-bold text-[13px] ${euBusco ? 'text-verde' : 'text-couro'}`}>{euBusco ? 'Você vai buscar' : 'Eu busco'}</Text>
          </Pressable>
        ) : null}
      </View>
    </>
  )

  if (compacto) return <View className="gap-2.5 border-t border-borda pt-3">{corpo}</View>
  return <Cartao className="gap-3 p-4">{corpo}</Cartao>
}

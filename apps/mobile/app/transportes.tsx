import { useState } from 'react'
import { Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { StatusBar } from '../src/ui/StatusBar'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Bus, Car, Footprints, Plane, Plus, Route, Ship, TrainFront, Trash2, type LucideIcon } from '../src/ui/icones'
import {
  arquivoDeCada,
  buscarDestinos,
  chegadasPorPessoa,
  meioComCaminho,
  meioComMotorista,
  nomeDaSituacao,
  nomeDoMeio,
  trechosDoGrupo,
  type Destino,
  type Trajeto,
} from '@together/core'
import { useCarregar } from '../src/dados/useCarregar'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { diaCurto, hora, primeiroNome } from '../src/lib/formato'
import { supabase } from '../src/lib/supabase'
import { Norti } from '../src/ui/Norti'
import { BotaoIr } from '../src/ui/BotaoIr'
import { VerReserva } from '../src/ui/BilheteDoDia'
import { BotaoRedondo, Cartao, Carregando, ErroNaTela, IconeQuadrado } from '../src/ui/pecas'
import { cor } from '../theme'

// Transporte v2 (spec 121a): "Chegadas e saídas" (uma linha por pessoa: cada um lança o seu)
// e "Entre cidades" (os trechos do grupo, na ordem do roteiro). Em cada trajeto: estações,
// "ver reserva", "Como chegar na estação" e, em trem/ônibus, "Ver o caminho" (121c).
const ICONE_DO_MEIO: Record<string, LucideIcon> = { aviao: Plane, carro: Car, carona: Car, onibus: Bus, trem: TrainFront, barco: Ship, a_pe: Footprints }

type TrajetoComGente = Trajeto & { passageiros: string[] }
type Membro = { id: string; nome: string; papel: string }

async function carregar(viagemId: string) {
  const [trajetos, destinos, arquivos] = await Promise.all([
    supabase.from('trajetos').select('*, trajeto_passageiros (usuario_id)').eq('viagem_id', viagemId).order('partida', { ascending: true, nullsFirst: false }),
    buscarDestinos(supabase, viagemId),
    supabase.from('arquivos_viagem').select('id, caminho, trajeto_id, hospedagem_id, evento_id, criado_em').eq('viagem_id', viagemId).not('trajeto_id', 'is', null),
  ])
  if (trajetos.error) throw trajetos.error
  const lista: TrajetoComGente[] = (trajetos.data ?? []).map(({ trajeto_passageiros, ...t }) => ({ ...t, passageiros: (trajeto_passageiros ?? []).map((p) => p.usuario_id) }))
  return { trajetos: lista, destinos, cofre: arquivoDeCada(arquivos.data ?? [], 'trajeto_id') }
}

export default function Transportes() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { atual: viagem, meuId } = useViagemAtual()
  const carga = useCarregar(viagem ? () => carregar(viagem.id) : null, [viagem?.id])

  if (!viagem) return null
  if (carga.status === 'carregando') return <Carregando />
  if (carga.status === 'erro') return <ErroNaTela aoTentar={carga.recarregar} />
  const { trajetos, destinos, cofre } = carga.dados
  const membros: Membro[] = viagem.membros.map((m) => ({ id: m.id, nome: m.nome, papel: m.papel }))
  const euSouAdm = membros.some((m) => m.id === meuId && m.papel === 'adm')
  const pessoas = chegadasPorPessoa(trajetos, membros)
  // Eu primeiro, depois quem já lançou, depois o resto
  pessoas.sort((a, b) => Number(b.id === meuId) - Number(a.id === meuId) || Number(!!b.chegada) - Number(!!a.chegada))
  const { trechos, outros } = trechosDoGrupo(trajetos, destinos)
  const nada = trajetos.length === 0
  const ctx = { destinos, membros, meuId, euSouAdm, cofre, aoMudar: carga.recarregar }
  const adicionar = (como?: 'chegada' | 'saida') => router.push(`/nova-reserva?voltar=transportes${como ? `&como=${como}` : ''}`)

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: insets.bottom + 100, gap: 12 }}>
        <BotaoRedondo aoTocar={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
          <ArrowLeft size={20} color={cor.texto} />
        </BotaoRedondo>
        <View>
          <Text className="font-display text-[32px] leading-[36px] text-texto">Como a galera se move</Text>
          <Text className="mt-1 font-body text-[14px] text-suave">Quem chega quando, como vocês vão de uma cidade pra outra e como chegar em cada lugar.</Text>
        </View>

        {nada ? (
          <View className="mt-4 items-center gap-3 px-4">
            <Norti humor="dormindo" tamanho={110} />
            <Text className="text-center font-display text-[22px] text-texto">Ninguém pôs o transporte ainda</Text>
            <Text className="text-center font-body text-[15px] leading-6 text-corpo">Manda o print do seu voo ou ônibus que a Norti preenche.</Text>
          </View>
        ) : null}

        <Text className="mt-2 font-body-bold text-[12px] uppercase tracking-widest text-caramelo">Chegadas e saídas</Text>
        {pessoas.map((p) => (
          <LinhaDaPessoa key={p.id} pessoa={p} souEu={p.id === meuId} ctx={ctx} aoAdicionar={adicionar} />
        ))}

        {trechos.length > 0 || outros.length > 0 ? <Text className="mt-4 font-body-bold text-[12px] uppercase tracking-widest text-caramelo">Entre cidades</Text> : null}
        {trechos.map((t) => (
          <View key={t.chave} className="gap-2">
            <Text className="font-body-bold text-[15px] text-texto">
              {t.de.nome} → {t.para.nome}
            </Text>
            {t.trajetos.length ? (
              t.trajetos.map((tr) => <Passagem key={tr.id} trajeto={tr} ctx={ctx} />)
            ) : (
              <Cartao className="flex-row items-center gap-3 p-4">
                <Route size={18} color={cor.suave} />
                <Text className="flex-1 font-body text-[14px] text-suave">Como vocês vão?</Text>
                {euSouAdm ? (
                  <Pressable onPress={() => adicionar()} accessibilityRole="button" className="rounded-xl bg-chip px-3 py-2 active:opacity-80">
                    <Text className="font-body-bold text-[13px] text-couro">Adicionar</Text>
                  </Pressable>
                ) : null}
              </Cartao>
            )}
          </View>
        ))}
        {outros.map((tr) => (
          <Passagem key={tr.id} trajeto={tr} ctx={ctx} />
        ))}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 px-5" style={{ paddingBottom: insets.bottom + 12 }}>
        <Pressable onPress={() => adicionar()} accessibilityRole="button" className="min-h-[54px] flex-row items-center justify-center gap-2 rounded-full bg-couro active:opacity-90">
          <Plus size={18} color={cor.creme} />
          <Text className="font-body-bold text-[15px] text-creme">Adicionar transporte</Text>
        </Pressable>
      </View>
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

function LinhaDaPessoa({
  pessoa,
  souEu,
  ctx,
  aoAdicionar,
}: {
  pessoa: { id: string; nome: string; chegada: TrajetoComGente | null; saida: TrajetoComGente | null }
  souEu: boolean
  ctx: Ctx
  aoAdicionar: (como: 'chegada' | 'saida') => void
}) {
  const nome = souEu ? 'Você' : primeiroNome(pessoa.nome)
  return (
    <Cartao className="gap-3 p-4">
      <Text className="font-body-bold text-[15px] text-texto">{nome}</Text>
      {(['chegada', 'saida'] as const).map((como) => {
        const t = pessoa[como]
        if (t) return <Passagem key={como} trajeto={t} ctx={ctx} compacto rotulo={como === 'chegada' ? 'Chega' : 'Volta'} />
        if (souEu)
          return (
            <Pressable key={como} onPress={() => aoAdicionar(como)} accessibilityRole="button" className="min-h-[44px] flex-row items-center gap-2 rounded-xl border border-dashed border-tracejado px-3 active:opacity-80">
              <Plus size={16} color={cor.couro} />
              <Text className="font-body-bold text-[14px] text-couro">{como === 'chegada' ? 'Falta a sua chegada: adicionar' : 'Falta a sua volta: adicionar'}</Text>
            </Pressable>
          )
        return (
          <Text key={como} className="font-body text-[13px] text-suave">
            {como === 'chegada' ? `${nome} ainda não pôs a chegada` : `${nome} ainda não pôs a volta`}
          </Text>
        )
      })}
    </Cartao>
  )
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
          {[t.motorista_id ? `Dirige: ${primeiroNome(nomeDo(t.motorista_id) ?? '')}` : null, t.lugares_livres != null ? `${t.lugares_livres} lugar(es) sobrando` : null].filter(Boolean).join(' · ')}
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

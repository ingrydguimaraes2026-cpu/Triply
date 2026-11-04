import { useState } from 'react'
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { StatusBar } from '../src/ui/StatusBar'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Bus, Car, Footprints, Plane, Route, Ship, TrainFront, type LucideIcon } from '../src/ui/icones'
import { aeroportosDoVoo, antecedenciaDoEmbarque, apagarTrajeto, buscarDestinos, chegadasPerto, horaDeSair, trechosSemTrajeto, type Destino, type Trajeto } from '@together/core'
import { ComoIrNoTrecho, DividirTransfer, DoAeroporto, SaiaAs, useTemposAteOEmbarque } from '../src/ui/AjudaDoTrajeto'
import { useCarregar } from '../src/dados/useCarregar'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { diaCurto, hora } from '../src/lib/formato'
import { supabase } from '../src/lib/supabase'
import { Norti } from '../src/ui/Norti'
import { Botao, BotaoRedondo, Cartao, Carregando, ErroNaTela, IconeQuadrado } from '../src/ui/pecas'
import { NovoTrajeto } from '../src/ui/NovoTrajeto'
import { cor } from '../theme'

// Transportes (tela "1i" do design): os trajetos do comboio como cartões de "passagem",
// separados em Ida (primeira metade da viagem) e Volta.
const MEIOS: Record<string, { nome: string; Icone: LucideIcon }> = {
  aviao: { nome: 'Voo', Icone: Plane },
  carro: { nome: 'Carro', Icone: Car },
  onibus: { nome: 'Ônibus', Icone: Bus },
  trem: { nome: 'Trem', Icone: TrainFront },
  barco: { nome: 'Barco', Icone: Ship },
  a_pe: { nome: 'A pé', Icone: Footprints },
  outro: { nome: 'Trajeto', Icone: Route },
}

export default function Transportes() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { atual: viagem } = useViagemAtual()
  const [aba, setAba] = useState<'todos' | 'ida' | 'volta'>('todos')
  const [novo, setNovo] = useState(false)
  const carga = useCarregar(viagem ? () => buscarTudo(viagem.id) : null, [viagem?.id])
  const { tempos, escolher } = useTemposAteOEmbarque()

  if (!viagem) return null
  if (carga.status === 'carregando') return <Carregando />
  if (carga.status === 'erro') return <ErroNaTela aoTentar={carga.recarregar} />
  const { trajetos, destinos, casas } = carga.dados
  const membros = viagem.membros
  const faltam = trechosSemTrajeto(destinos, trajetos)
  const destino = destinos[0]?.nome ?? viagem.nome

  // Ida = trajetos antes do meio da viagem; Volta = depois
  const meio = viagem.dataInicio && viagem.dataFim ? (new Date(viagem.dataInicio).getTime() + new Date(viagem.dataFim).getTime()) / 2 : null
  const ehIda = (t: Trajeto) => !meio || !t.partida || new Date(t.partida).getTime() <= meio
  // Apagar: confirma antes (no navegador o Alert com botões não funciona)
  function apagar(t: Trajeto) {
    const fazer = () =>
      apagarTrajeto(supabase, t.id)
        .then(carga.recarregar)
        .catch(() => Alert.alert('Não deu pra apagar', 'Só o ADM (ou quem ele liberar) apaga trajetos.'))
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.('Apagar este trajeto?')) void fazer()
    } else Alert.alert('Apagar este trajeto?', undefined, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Apagar', style: 'destructive', onPress: () => void fazer() }])
  }

  const lista = aba === 'todos' ? trajetos : trajetos.filter((t) => (aba === 'ida' ? ehIda(t) : !ehIda(t)))

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 40, gap: 12 }}>
        <BotaoRedondo aoTocar={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
          <ArrowLeft size={20} color={cor.texto} />
        </BotaoRedondo>
        <View>
          <Text className="font-display text-[32px] text-texto">Transportes</Text>
          <Text className="mt-0.5 font-body text-[14px] text-suave">Como o comboio chega em {destino}</Text>
        </View>
        {meio ? (
          <View className="my-1 flex-row gap-2">
            {(['todos', 'ida', 'volta'] as const).map((a) => (
              <Pressable key={a} onPress={() => setAba(a)} className={`rounded-xl px-4 py-2.5 ${aba === a ? 'bg-couro' : 'border border-borda bg-cartao'}`}>
                <Text className={`font-body-bold text-[13px] ${aba === a ? 'text-white' : 'text-texto'}`}>{a === 'todos' ? 'Todos' : a === 'ida' ? 'Ida' : 'Volta'}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {lista.length === 0 ? (
          <View className="mt-10 items-center gap-3 px-6">
            <Norti humor="dormindo" tamanho={120} />
            <Text className="font-display text-[24px] text-texto">Nenhum trajeto ainda</Text>
            <Text className="text-center font-body text-[15px] leading-6 text-corpo">Cadastre o voo, o ônibus ou o carro de cada um. Todo mundo vê aqui e no "Hoje".</Text>
          </View>
        ) : (
          lista.map((t) => {
            const casa = casas.find((c) => c.destino_id === t.destino_id) ?? null
            const chegaEm = aeroportosDoVoo(t, destinos).chegada
            const perto = chegadasPerto(t, trajetos, destinos)
            const nomeDe = (ids: string[]) => ids.map((id) => membros.find((m) => m.id === id)?.nome.split(' ')[0] ?? 'Alguém')
            return (
              <Passagem key={t.id} trajeto={t} destinos={destinos} aoApagar={() => apagar(t)}>
                {t.partida && antecedenciaDoEmbarque(t.meio, true) !== null ? <SaiaAs saida={horaDeSair(t, destinos, tempos[t.id] ?? null)} partida={t.partida} aoEscolher={(m) => escolher(t.id, m)} /> : null}
                {perto[0] ? (
                  <DividirTransfer
                    nomes={nomeDe(perto[0].pessoas)}
                    minutos={perto[0].minutos}
                    aeroporto={chegaEm}
                    pessoas={t.passageiros.length + perto[0].pessoas.length}
                  />
                ) : null}
                {chegaEm ? (
                  <DoAeroporto
                    aeroporto={chegaEm}
                    nomeDaCasa={casa?.nome ?? null}
                    ate={casa?.endereco || destinos.find((d) => d.id === t.destino_id)?.nome || chegaEm.cidades[0]}
                  />
                ) : null}
              </Passagem>
            )
          })
        )}
        {/* Spec 121 (T4): trechos do roteiro ainda sem trajeto, com links pra descobrir como ir */}
        {aba === 'todos'
          ? faltam.map(({ de, para }) => <ComoIrNoTrecho key={`${de.id}-${para.id}`} de={de.nome} para={para.nome} data={de.saida ?? null} />)
          : null}
        <View className="mt-2">
          <Botao titulo="Adicionar trajeto" tipo={lista.length ? 'secundario' : 'primario'} aoTocar={() => setNovo(true)} />
        </View>
        {lista.length ? <Text className="text-center font-body text-[12px] text-suave">Segure um trajeto pra apagar.</Text> : null}
      </ScrollView>
      {novo ? (
        <NovoTrajeto
          visivel
          viagemId={viagem.id}
          moeda={viagem.moeda}
          dataInicio={viagem.dataInicio}
          dataFim={viagem.dataFim}
          destinos={destinos}
          aoFechar={() => setNovo(false)}
          aoSalvar={carga.recarregar}
        />
      ) : null}
    </View>
  )
}

// Trajetos com quem vai em cada um (spec 067) e a casa escolhida de cada destino (pra "do aeroporto até a casa")
async function buscarTudo(viagemId: string) {
  const [trajetos, destinos, casas] = await Promise.all([
    supabase.from('trajetos').select('*, trajeto_passageiros (usuario_id)').eq('viagem_id', viagemId).order('partida', { ascending: true, nullsFirst: false }),
    buscarDestinos(supabase, viagemId),
    supabase.from('hospedagens').select('destino_id, nome, endereco').eq('viagem_id', viagemId).eq('escolhida', true),
  ])
  if (trajetos.error) throw trajetos.error
  return {
    trajetos: (trajetos.data ?? []).map(({ trajeto_passageiros, ...t }) => ({ ...t, passageiros: (trajeto_passageiros ?? []).map((p) => p.usuario_id) })),
    destinos,
    casas: casas.data ?? [],
  }
}

function Passagem({ trajeto: t, destinos, aoApagar, children }: { trajeto: Trajeto; destinos: Destino[]; aoApagar: () => void; children?: React.ReactNode }) {
  const { nome, Icone } = MEIOS[t.meio] ?? MEIOS.outro
  const origem = destinos.find((d) => d.id === t.origem_id)?.nome ?? 'Casa'
  const chegada = destinos.find((d) => d.id === t.destino_id)?.nome ?? 'Casa'
  const duracao = t.partida && t.chegada ? Math.round((new Date(t.chegada).getTime() - new Date(t.partida).getTime()) / 60000) : null
  const subtitulo = [t.partida ? diaCurto(new Date(t.partida)) : null, duracao && duracao > 0 ? `${Math.floor(duracao / 60)}h${String(duracao % 60).padStart(2, '0')}` : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <Pressable onLongPress={aoApagar} delayLongPress={450} accessibilityHint="Segure pra apagar">
    <Cartao className="gap-4 p-5">
      <View className="flex-row items-center gap-2.5">
        <IconeQuadrado tamanho={36}>
          <Icone size={19} color={cor.couro} />
        </IconeQuadrado>
        <View className="flex-1">
          <Text className="font-body-bold text-[14px] text-texto">{t.observacao || nome}</Text>
          {subtitulo ? <Text className="font-body text-[12.5px] text-suave">{subtitulo}</Text> : null}
        </View>
        {t.link_reserva ? (
          <View className="rounded-lg bg-verde-fundo px-2.5 py-1">
            <Text className="font-body-bold text-[12px] text-verde">Reservado</Text>
          </View>
        ) : null}
        {t.bate_e_volta ? (
          <View className="rounded-lg bg-chip px-2.5 py-1">
            <Text className="font-body-bold text-[12px] text-couro">Bate e volta</Text>
          </View>
        ) : null}
      </View>
      <View className="flex-row items-center gap-3">
        <View className="max-w-[38%]">
          <Text className="font-display text-[22px] text-texto" numberOfLines={1}>
            {origem}
          </Text>
          <Text className="font-body text-[12.5px] text-suave">{hora(t.partida)}</Text>
        </View>
        <View className="flex-1 flex-row items-center gap-1.5">
          <View className="flex-1 border-t-[1.5px] border-dashed border-tracejado" />
          <Icone size={18} color={cor.caramelo} />
          <View className="flex-1 border-t-[1.5px] border-dashed border-tracejado" />
        </View>
        <View className="max-w-[38%] items-end">
          <Text className="font-display text-[22px] text-texto" numberOfLines={1}>
            {chegada}
          </Text>
          <Text className="font-body text-[12.5px] text-suave">{hora(t.chegada)}</Text>
        </View>
      </View>
      {children}
    </Cartao>
    </Pressable>
  )
}

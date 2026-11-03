import { useState } from 'react'
import { Linking, Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AlertTriangle, ArrowLeft, Check, ChevronDown, ExternalLink, FileCheck, Info } from '../src/ui/icones'
import {
  buscarDestinos,
  buscarExigencias,
  buscarMeusPassaportes,
  buscarStatusDosDocumentos,
  marcarStatusDoDocumento,
  montarChecklist,
  nomeDoPais,
  prazoVencido,
  progresso,
  textoDoPrazo,
  type ExigenciaAutomatica,
  type ItemChecklist,
  type Status,
  type StatusDoComboio,
} from '@together/core'
import { useCarregar } from '../src/dados/useCarregar'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { hojeIso } from '../src/lib/formato'
import { supabase } from '../src/lib/supabase'
import { StatusBar } from '../src/ui/StatusBar'
import { Avatar, BotaoRedondo, Cartao, Carregando, ErroNaTela, RotuloDeSecao } from '../src/ui/pecas'
import { cor } from '../theme'

// Documentos de entrada (spec 010 no mobile + exigências automáticas da 111): o que cada um precisa
// pra entrar nos países do roteiro. Cada pessoa marca "resolvido" ou "não preciso"; o comboio vê quem já resolveu.

export default function Documentos() {
  const { atual, meuId } = useViagemAtual()
  const carga = useCarregar(
    atual
      ? async () => {
          const [destinos, status, passaportes] = await Promise.all([
            buscarDestinos(supabase, atual.id),
            buscarStatusDosDocumentos(supabase, atual.id),
            buscarMeusPassaportes(supabase, meuId).catch((): string[] => ['BR']),
          ])
          const viagem = { data_inicio: atual.dataInicio, data_fim: atual.dataFim }
          // Primeiro sem as automáticas, só pra saber quais países não têm regra à mão
          const semRegra = montarChecklist(viagem, destinos).semRegra
          const automaticas = new Map<string, ExigenciaAutomatica>()
          if (semRegra.length) {
            try {
              const { porDestino, fontes } = await buscarExigencias(supabase, semRegra, passaportes)
              for (const [p, e] of porDestino) automaticas.set(p, { ...e, dadosDe: fontes.find((f) => f.fonte === e.fonte)?.dadosDe ?? null })
            } catch (erro) {
              console.error('Erro ao buscar exigências automáticas:', erro) // segue com o link do Itamaraty
            }
          }
          return { checklist: montarChecklist(viagem, destinos, automaticas), status }
        }
      : null,
    [atual?.id, meuId],
  )

  if (!atual) return null
  if (carga.status === 'carregando') return <Carregando />
  if (carga.status === 'erro') return <ErroNaTela aoTentar={carga.recarregar} />
  return <Tela key={atual.id} {...carga.dados} viagemId={atual.id} membros={atual.membros} />
}

function Tela({
  checklist,
  status,
  viagemId,
  membros,
}: {
  checklist: ReturnType<typeof montarChecklist>
  status: StatusDoComboio[]
  viagemId: string
  membros: { id: string; nome: string }[]
}) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { meuId } = useViagemAtual()
  const [lista, setLista] = useState(status) // cópia local: muda na hora ao marcar
  const [aberto, setAberto] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const hoje = hojeIso()

  const meus: Record<string, Status> = {}
  for (const s of lista) if (s.usuario_id === meuId) meus[s.item] = s.status
  const { feitas, total } = progresso(checklist.itens, meus)
  const tarefas = checklist.itens.filter((i) => i.tipo === 'tarefa')
  const avisos = checklist.itens.filter((i) => i.tipo === 'aviso')

  // Muda na tela na hora; se o banco recusar, volta como estava
  async function mudar(item: string, novo: Status) {
    setErro(null)
    const status = (meus[item] ?? 'pendente') === novo ? 'pendente' : novo // tocar de novo desmarca
    const antes = lista
    setLista([...lista.filter((s) => !(s.usuario_id === meuId && s.item === item)), { usuario_id: meuId, item, status }])
    try {
      await marcarStatusDoDocumento(supabase, viagemId, meuId, item, status)
    } catch {
      setLista(antes)
      setErro('Não deu pra salvar. Confira a internet e tente de novo.')
    }
  }

  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/'))

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: insets.bottom + 40, gap: 12 }}>
        <BotaoRedondo aoTocar={voltar}>
          <ArrowLeft size={20} color={cor.texto} />
        </BotaoRedondo>
        <View className="flex-row items-end justify-between gap-3">
          <View className="flex-1">
            <Text className="font-display text-[32px] text-texto">Documentos</Text>
            {checklist.paises.length > 0 ? (
              <Text className="mt-0.5 font-body text-[14px] text-suave">Pra entrar em {checklist.paises.map(nomeDoPais).join(', ')}</Text>
            ) : null}
          </View>
          {total > 0 ? (
            <Text className="font-body-bold text-[15px] text-couro">
              {feitas}/{total}
            </Text>
          ) : null}
        </View>

        {checklist.paises.length === 0 ? (
          <Cartao className="items-center gap-2 p-6">
            <FileCheck size={30} color={cor.suave} />
            <Text className="text-center font-body text-[14px] leading-5 text-corpo">
              Viagem nacional: basta um documento com foto (RG, CIN ou CNH). Com um destino fora do Brasil, o checklist aparece aqui.
            </Text>
          </Cartao>
        ) : (
          <>
            <View className="h-2 overflow-hidden rounded-full bg-areia">
              <View className="h-2 rounded-full bg-couro" style={{ width: `${total ? (feitas / total) * 100 : 0}%` }} />
            </View>
            {erro ? <Text className="font-body-medium text-[13px] text-vermelho">{erro}</Text> : null}

            <Cartao className="px-4">
              {tarefas.map((item, i) => (
                <LinhaDoItem
                  key={item.chave}
                  item={item}
                  primeiro={i === 0}
                  meu={meus[item.chave] ?? 'pendente'}
                  atrasado={(meus[item.chave] ?? 'pendente') === 'pendente' && prazoVencido(item, hoje)}
                  aberto={aberto === item.chave}
                  quem={membros.filter((m) => lista.some((s) => s.usuario_id === m.id && s.item === item.chave && s.status === 'resolvido'))}
                  aoAbrir={() => setAberto(aberto === item.chave ? null : item.chave)}
                  aoMarcar={(s) => mudar(item.chave, s)}
                />
              ))}
            </Cartao>

            {avisos.length > 0 ? (
              <>
                <View className="mt-2 flex-row items-center gap-1.5">
                  <Info size={14} color={cor.suave} />
                  <RotuloDeSecao>Bom saber</RotuloDeSecao>
                </View>
                {avisos.map((a) => (
                  <Text key={a.chave} className="font-body text-[13px] leading-5 text-corpo">
                    <Text className="font-body-bold text-texto">{a.titulo}. </Text>
                    {a.texto}
                  </Text>
                ))}
              </>
            ) : null}

            <Text className="mt-2 text-center font-body text-[12.5px] leading-5 text-suave">
              As regras mudam: confira sempre na fonte oficial antes de viajar.
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  )
}

function LinhaDoItem({
  item,
  primeiro,
  meu,
  atrasado,
  aberto,
  quem,
  aoAbrir,
  aoMarcar,
}: {
  item: ItemChecklist
  primeiro: boolean
  meu: Status
  atrasado: boolean
  aberto: boolean
  quem: { id: string; nome: string }[]
  aoAbrir: () => void
  aoMarcar: (s: Status) => void
}) {
  const prazo = textoDoPrazo(item)
  return (
    <View className={primeiro ? '' : 'border-t border-linha'}>
      <View className="flex-row items-center gap-3 py-3">
        <Pressable
          onPress={() => aoMarcar('resolvido')}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: meu === 'resolvido' }}
          accessibilityLabel={`${item.titulo}: resolvido`}
          hitSlop={6}
          className={`h-7 w-7 items-center justify-center rounded-lg border-2 ${meu === 'resolvido' ? 'border-couro bg-couro' : 'border-borda bg-cartao'}`}
        >
          {meu === 'resolvido' ? <Check size={16} color="#fff" /> : meu === 'nao_preciso' ? <Text className="font-body-bold text-suave">–</Text> : null}
        </Pressable>
        <Pressable onPress={aoAbrir} accessibilityLabel={`Detalhes de ${item.titulo}`} className="min-w-0 flex-1 flex-row items-center gap-2 active:opacity-80">
          <View className="min-w-0 flex-1">
            <Text className={`font-body-bold text-[15px] ${meu !== 'pendente' ? 'text-suave' : 'text-texto'}`}>{item.titulo}</Text>
            <View className="flex-row items-center gap-1">
              {atrasado ? <AlertTriangle size={12} color={cor.vermelho} /> : null}
              <Text className={`font-body text-[12.5px] ${atrasado ? 'text-vermelho' : 'text-suave'}`}>
                {meu === 'nao_preciso' ? 'Você não precisa' : meu === 'resolvido' ? 'Resolvido' : (prazo ?? '')}
                {atrasado ? ' (passou)' : ''}
                {item.aConfirmar ? ' · a confirmar' : ''}
                {item.automatico ? ' · automático' : ''}
              </Text>
            </View>
          </View>
          {quem.length > 0 ? (
            <View className="flex-row">
              {quem.slice(0, 3).map((m, i) => (
                <View key={m.id} style={{ marginLeft: i ? -6 : 0 }}>
                  <Avatar nome={m.nome} indice={i} tamanho={22} />
                </View>
              ))}
            </View>
          ) : null}
          <ChevronDown size={16} color={cor.suave} style={{ transform: [{ rotate: aberto ? '180deg' : '0deg' }] }} />
        </Pressable>
      </View>
      {aberto ? (
        <View className="gap-2.5 pb-3 pl-10">
          <Text selectable className="font-body text-[13.5px] leading-5 text-corpo">
            {item.texto}
          </Text>
          <View className="flex-row flex-wrap items-center justify-between gap-2">
            <Pressable onPress={() => Linking.openURL(item.fonte.url)} className="flex-row items-center gap-1 active:opacity-80">
              <Text className="font-body-semibold text-[13px] text-couro">{item.fonte.nome}</Text>
              <ExternalLink size={12} color={cor.couro} />
            </Pressable>
            <Pressable onPress={() => aoMarcar('nao_preciso')} hitSlop={6} className="active:opacity-80">
              <Text className="font-body-bold text-[13px] text-suave">{meu === 'nao_preciso' ? 'Preciso, sim' : 'Não preciso'}</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  )
}

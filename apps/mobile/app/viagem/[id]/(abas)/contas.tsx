import { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View, type ScrollViewInstance } from 'react-native'
import { StatusBar } from '../../../../src/ui/StatusBar'
import { useFocusEffect, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeftRight, CheckCheck, MessageCircle, Receipt, Send, Wallet } from '../../../../src/ui/icones'
import { buscarGastos, CONGELADO, contarComentariosDaViagem, cotacoesDeHoje, formatarDinheiro, saldoDaCarteira, saldoEuroDoComboio, type ViagemComDetalhes } from '@together/core'
import { resumoDasContas } from '../../../../src/dados/contas'
import { useCarregar } from '../../../../src/dados/useCarregar'
import { useViagemAtual } from '../../../../src/dados/viagemAtual'
import { diaCurto, hojeIso, lerData, primeiroNome } from '../../../../src/lib/formato'
import { supabase } from '../../../../src/lib/supabase'
import { Norti } from '../../../../src/ui/Norti'
import { Avatar, Carregando, ErroNaTela } from '../../../../src/ui/pecas'
import { useNumeroAnimado } from '../../../../src/ui/movimento'
import { SemViagem } from '../../../../src/ui/SemViagem'
import { ComentariosDoItem } from '../../../../src/ui/ComentariosDoItem'
import { cor, sombra } from '../../../../theme'

// Contas (spec 117, tela 5): um número grande (meu saldo), o câmbio de hoje numa linha,
// os gastos como conversa e a barra fixa embaixo pra lançar.
export default function Contas() {
  const { atual, meuId } = useViagemAtual()
  if (!atual) return <SemViagem titulo="Contas" />
  return <ContasDaViagem viagem={atual} meuId={meuId} />
}

function ContasDaViagem({ viagem, meuId }: { viagem: ViagemComDetalhes; meuId: string }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [verAcertos, setVerAcertos] = useState(false)
  const [aberto, setAberto] = useState<string | null>(null) // gasto com os comentários abertos (spec 025)
  const [comentarios, setComentarios] = useState<Record<string, number>>({})
  const [frase, setFrase] = useState('')
  const rolagem = useRef<ScrollViewInstance>(null)
  // Câmbio de hoje numa linha (quanto vale 1 da moeda da viagem em reais)
  const [cambio, setCambio] = useState<number | null>(null)
  useEffect(() => {
    if (viagem.moeda === 'BRL') return
    let vivo = true
    void cotacoesDeHoje(viagem.moeda, ['BRL']).then((t) => vivo && setCambio(t?.BRL ?? null))
    return () => {
      vivo = false
    }
  }, [viagem.moeda])
  useEffect(() => {
    let vivo = true
    contarComentariosDaViagem(supabase, viagem.id)
      .then((c) => vivo && setComentarios(c))
      .catch(() => {})
    return () => {
      vivo = false
    }
  }, [viagem.id])
  const euro = viagem.moeda === 'EUR'

  const carga = useCarregar(async () => {
    const [gastos, meuEuro, euroDoComboio] = await Promise.all([
      buscarGastos(supabase, viagem.id),
      euro ? saldoDaCarteira(supabase, viagem.id, meuId) : Promise.resolve(0),
      euro ? saldoEuroDoComboio(supabase, viagem.id) : Promise.resolve(0),
    ])
    return { gastos, meuEuro, euroDoComboio }
  }, [viagem.id, meuId])

  // Volta da tela de lançar gasto → recarrega
  const { recarregar } = carga
  useFocusEffect(useCallback(() => recarregar(), [recarregar]))

  if (carga.status === 'carregando') return <Carregando />
  if (carga.status === 'erro') return <ErroNaTela aoTentar={carga.recarregar} />

  const { gastos, meuEuro, euroDoComboio } = carga.dados
  const contas = resumoDasContas(gastos, viagem.moeda)
  const dinheiro = (c: number) => formatarDinheiro(c, viagem.moeda)
  const nome = (id: string) => (id === meuId ? 'Você' : primeiroNome(viagem.membros.find((m) => m.id === id)?.nome ?? 'Ex-membro'))
  const indice = (id: string) => Math.max(0, viagem.membros.findIndex((m) => m.id === id))
  const adicionar = () => router.push({ pathname: '/novo-gasto', params: { viagem: viagem.id } })

  const meuSaldo = contas.saldos.get(meuId) ?? 0

  // Barra de baixo: a frase vai pro novo-gasto, que já abre preenchido
  function lancar() {
    const texto = frase.trim()
    router.push({ pathname: '/novo-gasto', params: texto ? { viagem: viagem.id, frase: texto } : { viagem: viagem.id } })
    setFrase('')
  }

  // Estado vazio: saldo zerado e "Lance o primeiro gasto" (a barra de baixo já lança)
  const vazio = contas.quantidade === 0
  const conversa = [...gastos.filter((g) => !g.rascunho)].reverse() // a mais nova embaixo, como num chat
  const porPessoa = viagem.membros.map((m) => ({ id: m.id, valor: contas.saldos.get(m.id) ?? 0 }))

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView
        ref={rolagem}
        onContentSizeChange={() => rolagem.current?.scrollToEnd({ animated: false })}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 96, gap: 12 }}
      >
        {/* Um número grande: o meu saldo. Tocar mostra quem paga quem e o saldo de cada um */}
        <Pressable onPress={() => setVerAcertos((v) => !v)} className="rounded-3xl bg-couro p-5 active:opacity-95" style={sombra.hero}>
          <Text className="font-body-bold text-[11px] uppercase tracking-widest text-creme">
            {meuSaldo > 0 ? 'Você recebe' : meuSaldo < 0 ? 'Você deve' : 'Tudo certo por aqui'}
          </Text>
          <SaldoAnimado valor={Math.abs(meuSaldo)} moeda={viagem.moeda} />
          <View className="mt-1 flex-row items-center justify-between">
            <Text className="flex-1 font-body text-[13px] text-creme" numberOfLines={1}>
              {cambio ? `${nomeDaMoeda(viagem.moeda)} hoje ${formatarDinheiro(Math.round(cambio * 100), 'BRL')}` : `Total do grupo ${dinheiro(contas.total)}`}
            </Text>
            <ArrowLeftRight size={16} color={cor.creme} />
          </View>
          {verAcertos ? (
            <View className="mt-4 gap-2.5 border-t border-white/15 pt-4">
              {contas.acertos.length ? (
                contas.acertos.map((a, i) => (
                  <Text key={i} className="font-body text-[14px] text-white">
                    <Text className="font-body-bold">{nome(a.de)}</Text> paga <Text className="font-body-bold">{dinheiro(a.valor)}</Text> pra <Text className="font-body-bold">{nome(a.para)}</Text>
                  </Text>
                ))
              ) : (
                <Text className="font-body text-[14px] text-white">Ninguém deve nada a ninguém.</Text>
              )}
              {porPessoa.map((p) => (
                <View key={p.id} className="flex-row items-center gap-2.5">
                  <Avatar nome={viagem.membros[indice(p.id)].nome} indice={indice(p.id)} tamanho={24} />
                  <Text className="flex-1 font-body-semibold text-[13px] text-creme">{nome(p.id)}</Text>
                  <Text className="font-body-bold text-[13px] text-white">{p.valor === 0 ? '—' : `${p.valor > 0 ? '+' : '−'} ${dinheiro(Math.abs(p.valor))}`}</Text>
                </View>
              ))}
              <Text className="font-body text-[12px] text-creme">
                Total do grupo {dinheiro(contas.total)}
                {viagem.membros.length ? ` · ${dinheiro(Math.round(contas.total / viagem.membros.length))} por pessoa` : ''}
              </Text>
            </View>
          ) : null}
        </Pressable>

        {euro ? (
          <View className="flex-row items-center gap-2 self-center rounded-full bg-areia px-3.5 py-2">
            <Wallet size={15} color={cor.couro} />
            <Text className="font-body-semibold text-[12px] text-corpo">
              Euro do comboio {formatarDinheiro(Math.round(euroDoComboio * 100), 'EUR')} · meu {formatarDinheiro(Math.round(meuEuro * 100), 'EUR')}
            </Text>
          </View>
        ) : null}

        {vazio ? (
          <View className="items-center gap-2 py-10">
            <Norti humor="dormindo" tamanho={110} />
            <Text className="font-display text-[24px] text-texto">Lance o primeiro gasto</Text>
            <Text className="text-center font-body text-[14px] leading-5 text-corpo">Escreva aí embaixo, tipo &quot;jantar 84&quot;. A Norti divide na hora.</Text>
          </View>
        ) : null}

        {conversa.map((e, i) => {
          const meu = e.pago_por === meuId
          const anterior = conversa[i - 1]
          const novoDia = !anterior || anterior.data !== e.data
          const pessoas = e.divisoes.length
          return (
            <View key={e.id} className="gap-1.5">
              {novoDia ? <Text className="mt-2 self-center font-body-bold text-[11px] uppercase tracking-widest text-suave">{tituloDoDia(e.data)}</Text> : null}
              <View className={`flex-row items-end gap-2 ${meu ? 'justify-end' : ''}`}>
                {!meu ? <Avatar nome={viagem.membros[indice(e.pago_por)]?.nome ?? '?'} indice={indice(e.pago_por)} tamanho={28} /> : null}
                <Pressable
                  onPress={() => setAberto(aberto === e.id ? null : e.id)}
                  accessibilityLabel={CONGELADO.comentarios ? e.descricao : `Comentários de ${e.descricao}`}
                  className={`max-w-[78%] rounded-[20px] px-4 py-3 active:opacity-90 ${meu ? 'rounded-br-md bg-couro' : 'rounded-bl-md bg-cartao'}`}
                  style={meu ? undefined : sombra.cartao}
                >
                  <Text className={`font-body-bold text-[14px] ${meu ? 'text-white' : 'text-texto'}`}>
                    {meu ? 'Você' : nome(e.pago_por)} pagou {formatarDinheiro(e.valor, e.moeda)} · {e.descricao}
                  </Text>
                  <Text className={`mt-0.5 font-body text-[12px] ${meu ? 'text-creme' : 'text-suave'}`}>
                    {e.pessoal ? 'só seu' : pessoas ? `dividido em ${pessoas} · ${formatarDinheiro(Math.round(e.valor / pessoas), e.moeda)} cada` : ''}
                  </Text>
                  {/* comentários soltos congelados pelo RUMO (03/11/2026) */}
                  {comentarios[e.id] && !CONGELADO.comentarios ? (
                    <View className={`absolute -bottom-2.5 ${meu ? 'left-3' : 'right-3'} flex-row items-center gap-1 rounded-full border border-linha bg-cartao px-2 py-0.5`}>
                      <MessageCircle size={11} color={cor.caramelo} />
                      <Text className="font-body-bold text-[11px] text-texto">{comentarios[e.id]}</Text>
                    </View>
                  ) : null}
                </Pressable>
              </View>
              {/* Spec 025: comentários do gasto. Congelado pelo RUMO (03/11/2026) */}
              {aberto === e.id && !CONGELADO.comentarios ? (
                <View className="mt-2 rounded-2xl bg-cartao px-3" style={sombra.cartao}>
                  <ComentariosDoItem
                    viagemId={viagem.id}
                    alvo={{ tipo: 'gasto', id: e.id }}
                    membros={viagem.membros}
                    meuId={meuId}
                    euSouAdm={viagem.membros.some((m) => m.id === meuId && m.papel === 'adm')}
                    aoMudar={(total) => setComentarios((atual) => ({ ...atual, [e.id]: total }))}
                  />
                </View>
              ) : null}
            </View>
          )
        })}

        {/* Quem paga quem, como recado do grupo no fim da conversa */}
        {contas.acertos.slice(0, 3).map((a, i) => (
          <View key={`acerto-${i}`} className="flex-row items-center gap-1.5 self-center rounded-full bg-verde-fundo px-3.5 py-2">
            <CheckCheck size={14} color={cor.verde} />
            <Text className="font-body-semibold text-[12px] text-verde">
              {nome(a.de)} paga {dinheiro(a.valor)} pra {a.para === meuId ? 'você' : nome(a.para)}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Barra fixa pra lançar: "€ 0,00 · o que foi?" (abre o novo-gasto já preenchido) */}
      <View className="absolute bottom-0 left-0 right-0 flex-row items-center gap-2 border-t border-linha px-3 py-2.5" style={{ backgroundColor: 'rgba(251,243,230,0.97)' }}>
        <Pressable onPress={adicionar} accessibilityLabel="Lançar gasto completo" className="h-11 w-11 items-center justify-center rounded-full bg-chip active:opacity-80">
          <Receipt size={20} color={cor.couro} />
        </Pressable>
        <TextInput
          value={frase}
          onChangeText={setFrase}
          onSubmitEditing={lancar}
          placeholder={`${dinheiro(0)} · o que foi?`}
          placeholderTextColor={cor.suave}
          returnKeyType="send"
          className="h-11 flex-1 rounded-full border border-borda bg-cartao px-4 font-body text-[15px] text-texto"
          style={{ outlineStyle: 'none' } as object}
        />
        <Pressable onPress={lancar} accessibilityLabel="Lançar" className="h-11 w-11 items-center justify-center rounded-full bg-caramelo active:opacity-80">
          <Send size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  )
}

const NOMES_DAS_MOEDAS: Record<string, string> = { EUR: 'Euro', USD: 'Dólar', GBP: 'Libra', CHF: 'Franco', ARS: 'Peso', JPY: 'Iene' }
const nomeDaMoeda = (m: string) => NOMES_DAS_MOEDAS[m] ?? m

function tituloDoDia(data: string) {
  return data === hojeIso() ? `Hoje · ${diaCurto(lerData(data))}` : diaCurto(lerData(data))
}

// O saldo corre até o valor novo quando muda (spec 117: número animado)
function SaldoAnimado({ valor, moeda }: { valor: number; moeda: string }) {
  const mostrado = useNumeroAnimado(valor)
  return <Text className="mt-1 font-display text-[44px] leading-[48px] text-white">{formatarDinheiro(Math.round(mostrado), moeda)}</Text>
}

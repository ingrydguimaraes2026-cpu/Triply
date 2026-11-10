import { useCallback, useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { StatusBar } from '../../../../src/ui/StatusBar'
import { useFocusEffect, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeftRight, Bed, Car, MessageCircle, Receipt, Send, ShoppingBag, Ticket, Utensils, Wallet, type LucideIcon } from '../../../../src/ui/icones'
import { buscarGastos, CONGELADO, contarComentariosDaViagem, cotacoesDeHoje, formatarDinheiro, saldoDaCarteira, saldoEuroDoComboio, type GastoDaViagem, type ViagemComDetalhes } from '@together/core'
import { resumoDasContas } from '../../../../src/dados/contas'
import { useCarregar } from '../../../../src/dados/useCarregar'
import { useViagemAtual } from '../../../../src/dados/viagemAtual'
import { diaCurto, hojeIso, lerData, primeiroNome } from '../../../../src/lib/formato'
import { supabase } from '../../../../src/lib/supabase'
import { Norti } from '../../../../src/ui/Norti'
import { Avatar, ErroNaTela } from '../../../../src/ui/pecas'
import { EsqueletoDaAba } from '../../../../src/ui/viagem/Esqueleto'
import { useNumeroAnimado } from '../../../../src/ui/movimento'
import { SemViagem } from '../../../../src/ui/SemViagem'
import { ComentariosDoItem } from '../../../../src/ui/ComentariosDoItem'
import { Icone } from '../../../../src/ui/Icone'
import { Entra } from '../../../../src/ui/Entra'
import { cor, fonte, rotulo, titulo, trabalho } from '../../../../theme'
import { puxarPraAtualizar } from '../../../../src/ui/Puxar'

// Contas no caminho B "Embarque" (10/11/2026). Régua: docs/design/direcao-redesenho/embarque.html,
// tela "Contas": título grande, o meu saldo num cartão creme com o número grande, "Quem deve quem",
// os gastos em lista (o mais novo em cima, separados por dia) e um botão só, "Lançar gasto", acima da barra.
// O lançamento rápido por frase ("jantar 84") continua, como campo no topo dos gastos.
const ICONE_DA_CATEGORIA: Record<string, LucideIcon> = {
  hospedagem: Bed,
  transporte: Car,
  alimentacao: Utensils,
  passeios: Ticket,
  comprinhas: ShoppingBag,
}

const cartao = { backgroundColor: trabalho.superficie, borderColor: trabalho.linha, borderWidth: 1, borderRadius: 20, boxShadow: '0 6px 18px rgba(74,46,20,0.08)' } as const

export default function Contas() {
  const { atual, meuId } = useViagemAtual()
  if (!atual) return <SemViagem titulo="Contas" />
  return <ContasDaViagem viagem={atual} meuId={meuId} />
}

function ContasDaViagem({ viagem, meuId }: { viagem: ViagemComDetalhes; meuId: string }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [verSaldos, setVerSaldos] = useState(false)
  const [aberto, setAberto] = useState<string | null>(null) // gasto com os comentários abertos (spec 025)
  const [comentarios, setComentarios] = useState<Record<string, number>>({})
  const [frase, setFrase] = useState('')
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
  }, [viagem.id, meuId], 'aba-contas')

  // Volta da tela de lançar gasto → recarrega
  const { recarregar } = carga
  useFocusEffect(useCallback(() => recarregar(), [recarregar]))

  if (carga.status === 'carregando') return <EsqueletoDaAba forma="contas" />
  if (carga.status === 'erro') return <ErroNaTela aoTentar={carga.recarregar} />

  const { gastos, meuEuro, euroDoComboio } = carga.dados
  const contas = resumoDasContas(gastos, viagem.moeda)
  const dinheiro = (c: number) => formatarDinheiro(c, viagem.moeda)
  const nome = (id: string) => (id === meuId ? 'Você' : primeiroNome(viagem.membros.find((m) => m.id === id)?.nome ?? 'Ex-membro'))
  const nomeCompleto = (id: string) => viagem.membros.find((m) => m.id === id)?.nome ?? '?'
  const indice = (id: string) => Math.max(0, viagem.membros.findIndex((m) => m.id === id))
  const adicionar = () => router.push({ pathname: '/novo-gasto', params: { viagem: viagem.id } })

  const meuSaldo = contas.saldos.get(meuId) ?? 0
  const devoPra = contas.acertos.filter((a) => a.de === meuId)
  const recebeDe = contas.acertos.filter((a) => a.para === meuId)
  const tituloDoSaldo =
    meuSaldo < 0
      ? devoPra.length === 1
        ? `Você deve pra ${nome(devoPra[0].para)}`
        : 'Você deve'
      : meuSaldo > 0
        ? recebeDe.length === 1
          ? `${nome(recebeDe[0].de)} te deve`
          : 'Você recebe'
        : 'Tudo certo por aqui'

  // Lançar rápido: a frase vai pro novo-gasto, que já abre preenchido
  function lancar() {
    const texto = frase.trim()
    router.push({ pathname: '/novo-gasto', params: texto ? { viagem: viagem.id, frase: texto } : { viagem: viagem.id } })
    setFrase('')
  }

  const vazio = contas.quantidade === 0
  const lista = gastos.filter((g) => !g.rascunho) // o mais novo em cima
  const dias = agruparPorDia(lista)
  const porPessoa = viagem.membros.map((m) => ({ id: m.id, valor: contas.saldos.get(m.id) ?? 0 }))

  return (
    <View className="flex-1" style={{ backgroundColor: trabalho.fundo }}>
      <StatusBar style="dark" />
      <ScrollView refreshControl={puxarPraAtualizar(carga)} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }} keyboardShouldPersistTaps="handled">
        <Entra ordem={0}>
          <View style={{ paddingHorizontal: 18, paddingTop: 6, paddingBottom: 12 }}>
            <Text style={[rotulo, { color: trabalho.texto2 }]}>
              {vazio ? 'Nenhum gasto ainda' : `${contas.quantidade} ${contas.quantidade === 1 ? 'gasto' : 'gastos'} · Total ${dinheiro(contas.total)}`}
            </Text>
            <Text style={[titulo(32), { color: trabalho.texto, marginTop: 6 }]}>Contas</Text>
          </View>
        </Entra>

        {/* O meu saldo: um número grande */}
        <Entra ordem={1}>
          <View style={[cartao, { marginHorizontal: 14, marginTop: 2, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 16 }]}>
            <Text style={[rotulo, { color: trabalho.texto2 }]}>{tituloDoSaldo}</Text>
            <SaldoAnimado valor={Math.abs(meuSaldo)} moeda={viagem.moeda} />
            <View className="mt-2 flex-row items-center gap-1.5">
              <ArrowLeftRight size={14} color={trabalho.texto2} />
              <Text className="flex-1" numberOfLines={1} style={{ fontFamily: fonte.corpo, fontSize: 13, color: trabalho.texto2 }}>
                {cambio ? `${nomeDaMoeda(viagem.moeda)} hoje ${formatarDinheiro(Math.round(cambio * 100), 'BRL')}` : `Total do grupo ${dinheiro(contas.total)}`}
                {viagem.membros.length && !vazio ? ` · ${dinheiro(Math.round(contas.total / viagem.membros.length))} por pessoa` : ''}
              </Text>
            </View>
            {euro ? (
              <View className="mt-3 flex-row items-center gap-2 rounded-full px-3 py-2" style={{ backgroundColor: trabalho.superficie2 }}>
                <Wallet size={15} color={trabalho.texto} />
                <Text className="flex-1" style={{ fontFamily: fonte.corpoForte, fontSize: 12, color: trabalho.texto }}>
                  Euros na carteira: galera {formatarDinheiro(Math.round(euroDoComboio * 100), 'EUR')} · você {formatarDinheiro(Math.round(meuEuro * 100), 'EUR')}
                </Text>
              </View>
            ) : null}
          </View>
        </Entra>

        {/* Quem deve quem */}
        {!vazio ? (
          <Entra ordem={2}>
            <View className="flex-row items-baseline justify-between" style={{ marginHorizontal: 18, marginTop: 22, marginBottom: 10 }}>
              <Text style={[rotulo, { color: trabalho.texto2 }]}>Quem deve quem</Text>
              <Pressable onPress={() => setVerSaldos((v) => !v)} accessibilityRole="button" hitSlop={8}>
                <Text style={{ fontFamily: fonte.corpoForte, fontSize: 12.5, color: trabalho.acento }}>{verSaldos ? 'Esconder saldos' : 'Saldo de cada um'}</Text>
              </Pressable>
            </View>
            <View style={[cartao, { marginHorizontal: 14 }]}>
              {contas.acertos.length ? (
                contas.acertos.map((a, i) => (
                  <View key={i} className="flex-row items-center gap-2 px-3.5 py-3" style={i ? { borderTopWidth: 1, borderTopColor: trabalho.linha } : undefined}>
                    <Avatar nome={nomeCompleto(a.de)} indice={indice(a.de)} tamanho={26} />
                    <Text style={{ fontFamily: fonte.item, fontSize: 14, color: trabalho.texto }}>{nome(a.de)}</Text>
                    <Text style={{ fontFamily: fonte.corpo, fontSize: 13.5, color: trabalho.texto2 }}>deve pra</Text>
                    <Avatar nome={nomeCompleto(a.para)} indice={indice(a.para)} tamanho={26} />
                    <Text className="min-w-0 flex-1" numberOfLines={1} style={{ fontFamily: fonte.item, fontSize: 14, color: trabalho.texto }}>
                      {a.para === meuId ? 'você' : nome(a.para)}
                    </Text>
                    <Text style={{ fontFamily: fonte.titulo, fontSize: 15, color: trabalho.texto }}>{dinheiro(a.valor)}</Text>
                  </View>
                ))
              ) : (
                <Text className="px-3.5 py-3.5" style={{ fontFamily: fonte.corpo, fontSize: 14, color: trabalho.texto }}>
                  Ninguém deve nada a ninguém.
                </Text>
              )}
              {verSaldos
                ? porPessoa.map((p) => (
                    <View key={p.id} className="flex-row items-center gap-2.5 px-3.5 py-2.5" style={{ borderTopWidth: 1, borderTopColor: trabalho.linha, backgroundColor: trabalho.superficie2 }}>
                      <Avatar nome={nomeCompleto(p.id)} indice={indice(p.id)} tamanho={24} />
                      <Text className="flex-1" style={{ fontFamily: fonte.corpoForte, fontSize: 13, color: trabalho.texto }}>{nome(p.id)}</Text>
                      <Text style={{ fontFamily: fonte.item, fontSize: 13.5, color: p.valor > 0 ? cor.verde : trabalho.texto }}>
                        {p.valor === 0 ? '—' : `${p.valor > 0 ? '+' : '−'} ${dinheiro(Math.abs(p.valor))}`}
                      </Text>
                    </View>
                  ))
                : null}
            </View>
          </Entra>
        ) : null}

        {/* Gastos */}
        <Entra ordem={3}>
          <View className="flex-row items-baseline justify-between" style={{ marginHorizontal: 18, marginTop: 22, marginBottom: 10 }}>
            <Text style={[rotulo, { color: trabalho.texto2 }]}>Gastos</Text>
          </View>
          {/* Lançar rápido por frase (spec 117): "jantar 84" abre o gasto já preenchido */}
          <View className="flex-row items-center gap-2" style={{ marginHorizontal: 14, marginBottom: 10 }}>
            <View className="h-12 flex-1 flex-row items-center gap-2 rounded-[18px] border pl-3.5 pr-1.5" style={{ backgroundColor: trabalho.superficie, borderColor: trabalho.linha }}>
              <Receipt size={18} color={trabalho.texto2} />
              <TextInput
                value={frase}
                onChangeText={setFrase}
                onSubmitEditing={lancar}
                placeholder={`Escreva rápido: jantar ${dinheiro(8400).replace(/[^\d,.]/g, '')}`}
                placeholderTextColor={trabalho.texto2}
                returnKeyType="send"
                accessibilityLabel="Lançar rápido, tipo jantar 84"
                className="h-full min-w-0 flex-1"
                style={{ fontFamily: fonte.corpo, fontSize: 15, color: trabalho.texto, outlineStyle: 'none' } as object}
              />
              {frase.trim() ? (
                <Pressable onPress={lancar} accessibilityLabel="Lançar" className="h-9 w-9 items-center justify-center rounded-full active:opacity-80" style={{ backgroundColor: trabalho.superficie2 }}>
                  <Send size={16} color={trabalho.texto} />
                </Pressable>
              ) : null}
            </View>
          </View>

          {vazio ? (
            <View className="items-center gap-2 px-6 py-8">
              <Norti humor="dormindo" tamanho={100} />
              <Text style={[titulo(22), { color: trabalho.texto }]}>Lance o primeiro gasto</Text>
              <Text className="text-center" style={{ fontFamily: fonte.corpo, fontSize: 14, lineHeight: 20, color: trabalho.texto2 }}>
                Toque em &quot;Lançar gasto&quot; ou escreva aí em cima, tipo &quot;jantar 84&quot;. A Norti divide na hora.
              </Text>
            </View>
          ) : null}

          {dias.map((d) => (
            <View key={d.data}>
              <Text style={[rotulo, { color: trabalho.texto2, marginHorizontal: 18, marginTop: 6, marginBottom: 8, fontSize: 10 }]}>{tituloDoDia(d.data)}</Text>
              <View style={[cartao, { marginHorizontal: 14, marginBottom: 10, overflow: 'hidden' }]}>
                {d.gastos.map((e, i) => {
                  const pessoas = e.divisoes.length
                  const IconeDaCategoria = ICONE_DA_CATEGORIA[e.categoria] ?? Receipt
                  const quantos = comentarios[e.id] && !CONGELADO.comentarios ? comentarios[e.id] : 0
                  return (
                    <View key={e.id} style={i ? { borderTopWidth: 1, borderTopColor: trabalho.linha } : undefined}>
                      <Pressable
                        onPress={() => setAberto(aberto === e.id ? null : e.id)}
                        disabled={CONGELADO.comentarios}
                        accessibilityLabel={CONGELADO.comentarios ? e.descricao : `Comentários de ${e.descricao}`}
                        className="flex-row items-center gap-3 px-3.5 py-3 active:opacity-80"
                      >
                        <View className="h-[38px] w-[38px] items-center justify-center rounded-xl" style={{ backgroundColor: trabalho.superficie2 }}>
                          <IconeDaCategoria size={19} color={trabalho.texto} />
                        </View>
                        <View className="min-w-0 flex-1">
                          <Text numberOfLines={1} style={{ fontFamily: fonte.item, fontSize: 14.5, letterSpacing: -0.15, color: trabalho.texto }}>
                            {e.descricao}
                          </Text>
                          <Text numberOfLines={1} style={{ fontFamily: fonte.corpo, fontSize: 12.5, color: trabalho.texto2, marginTop: 1 }}>
                            {nome(e.pago_por)} pagou · {e.pessoal ? 'só seu' : pessoas ? `${pessoas} ${pessoas === 1 ? 'pessoa' : 'pessoas'}` : 'sem divisão'}
                          </Text>
                        </View>
                        <View className="items-end">
                          <Text style={{ fontFamily: fonte.titulo, fontSize: 15, color: trabalho.texto }}>{formatarDinheiro(e.valor, e.moeda)}</Text>
                          {quantos ? (
                            <View className="mt-0.5 flex-row items-center gap-1">
                              <MessageCircle size={11} color={cor.caramelo} />
                              <Text style={{ fontFamily: fonte.corpoNegrito, fontSize: 11, color: trabalho.texto2 }}>{quantos}</Text>
                            </View>
                          ) : null}
                        </View>
                      </Pressable>
                      {/* Spec 025: comentários do gasto. Congelado pelo RUMO (03/11/2026) */}
                      {aberto === e.id && !CONGELADO.comentarios ? (
                        <View className="px-3" style={{ borderTopWidth: 1, borderTopColor: trabalho.linha, backgroundColor: trabalho.superficie2 }}>
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
              </View>
            </View>
          ))}
        </Entra>
      </ScrollView>

      {/* Um botão só, acima da barra de vidro (o insets.bottom já conta a altura dela) */}
      <View className="absolute" style={{ right: 16, bottom: insets.bottom + 4 }}>
        <Pressable
          onPress={adicionar}
          accessibilityRole="button"
          accessibilityLabel="Lançar gasto"
          className="h-[50px] flex-row items-center gap-1.5 rounded-full pl-3.5 pr-[18px] active:opacity-90"
          style={{ backgroundColor: trabalho.acento, boxShadow: '0 10px 24px rgba(0,0,0,0.3)' }}
        >
          <Icone nome="mais" tamanho={20} cor={trabalho.acentoTexto} />
          <Text style={{ fontFamily: fonte.item, fontSize: 14.5, color: trabalho.acentoTexto }}>Lançar gasto</Text>
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

// A lista já vem do mais novo pro mais velho; aqui só junta por dia
function agruparPorDia(gastos: GastoDaViagem[]) {
  const dias: { data: string; gastos: GastoDaViagem[] }[] = []
  for (const g of gastos) {
    const ultimo = dias[dias.length - 1]
    if (ultimo && ultimo.data === g.data) ultimo.gastos.push(g)
    else dias.push({ data: g.data, gastos: [g] })
  }
  return dias
}

// O saldo corre até o valor novo quando muda (spec 117: número animado)
function SaldoAnimado({ valor, moeda }: { valor: number; moeda: string }) {
  const mostrado = useNumeroAnimado(valor)
  return <Text style={[titulo(46, 0.045), { color: trabalho.texto, marginTop: 8, fontVariant: ['tabular-nums'] }]}>{formatarDinheiro(Math.round(mostrado), moeda)}</Text>
}

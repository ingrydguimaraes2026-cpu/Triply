import { useCallback, useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { StatusBar } from '../../src/ui/StatusBar'
import { useFocusEffect, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeftRight, Bed, Car, MessageCircle, Plus, Receipt, ShoppingBag, Ticket, Utensils, Wallet } from 'lucide-react-native'
import { buscarGastos, contarComentariosDaViagem, formatarDinheiro, saldoDaCarteira, saldoEuroDoComboio, type GastoDaViagem, type ViagemComDetalhes } from '@together/core'
import { resumoDasContas } from '../../src/dados/contas'
import { useCarregar } from '../../src/dados/useCarregar'
import { useViagemAtual } from '../../src/dados/viagemAtual'
import { diaCurto, hojeIso, lerData, primeiroNome } from '../../src/lib/formato'
import { supabase } from '../../src/lib/supabase'
import { Malinha } from '../../src/ui/Malinha'
import { Avatar, Botao, Cartao, Carregando, ErroNaTela, IconeQuadrado, RotuloDeSecao, TituloDaTela } from '../../src/ui/pecas'
import { SemViagem } from '../../src/ui/SemViagem'
import { ComentariosDoItem } from '../../src/ui/ComentariosDoItem'
import { cor, sombra } from '../../theme'

// Contas do grupo (telas "1j" e "1k" do design): meu saldo, saldo de cada um, gastos por dia.
const ICONE_DA_CATEGORIA: Record<string, typeof Bed> = {
  hospedagem: Bed,
  transporte: Car,
  alimentacao: Utensils,
  passeios: Ticket,
  comprinhas: ShoppingBag,
  outros: Receipt,
}

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
  const devemPraMim = contas.acertos.filter((a) => a.para === meuId)
  const euDevo = contas.acertos.filter((a) => a.de === meuId)
  const saldo =
    meuSaldo > 0
      ? { rotulo: 'Você recebe', fundo: 'bg-verde-fundo', texto: 'text-verde', sub: 'de ' + devemPraMim.map((a) => `${nome(a.de)} (${dinheiro(a.valor)})`).join(' e ') }
      : meuSaldo < 0
        ? { rotulo: 'Você deve', fundo: 'bg-vermelho-fundo', texto: 'text-vermelho', sub: 'para ' + euDevo.map((a) => `${nome(a.para)} (${dinheiro(a.valor)})`).join(' e ') }
        : { rotulo: 'Tudo certo por aqui', fundo: 'bg-areia', texto: 'text-corpo', sub: 'Ninguém deve nada a ninguém.' }

  const cabecalho = (
    <TituloDaTela acima={viagem.nome} titulo="Contas" />
  )

  // Estado vazio (tela "1k")
  if (contas.quantidade === 0) {
    return (
      <View className="flex-1 gap-4 bg-fundo px-5" style={{ paddingTop: insets.top + 8, paddingBottom: 24 }}>
        <StatusBar style="dark" />
        {cabecalho}
        <View className="gap-1 rounded-[20px] bg-areia p-6">
          <Text className="font-body-semibold text-[14px] text-corpo">Tudo certo por aqui</Text>
          <Text className="font-display text-[46px] leading-[48px] text-texto">{dinheiro(0)}</Text>
          <Text className="font-body text-[13px] text-corpo">Ninguém deve nada a ninguém.</Text>
        </View>
        <View className="flex-1 items-center justify-center gap-3 px-5">
          <Malinha humor="dormindo" tamanho={130} />
          <Text className="mt-1.5 font-display text-[26px] text-texto">Nenhum gasto ainda</Text>
          <Text className="text-center font-body text-[15px] leading-6 text-corpo">Lance o primeiro gasto e o Together divide entre o grupo na hora.</Text>
        </View>
        <Botao titulo="Adicionar gasto" icone={<Plus size={20} color="#fff" />} aoTocar={adicionar} />
      </View>
    )
  }

  const maiorSaldo = Math.max(1, ...[...contas.saldos.values()].map(Math.abs))
  const porPessoa = viagem.membros.map((m) => ({ id: m.id, valor: contas.saldos.get(m.id) ?? 0 }))
  const grupos = agruparPorDia(gastos.filter((g) => !g.rascunho))

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 110, gap: 16 }}>
        {cabecalho}

        <View className={`gap-1 rounded-[20px] p-6 ${saldo.fundo}`}>
          <Text className={`font-body-semibold text-[14px] ${saldo.texto}`}>{saldo.rotulo}</Text>
          <Text className={`font-display text-[46px] leading-[48px] ${meuSaldo === 0 ? 'text-texto' : saldo.texto}`}>{dinheiro(Math.abs(meuSaldo))}</Text>
          <Text className="mt-0.5 font-body text-[13px] text-corpo">{saldo.sub}</Text>
          {contas.acertos.length ? (
            <Pressable onPress={() => setVerAcertos((v) => !v)} className="mt-4 h-11 flex-row items-center justify-center gap-1.5 rounded-[14px] bg-cartao active:opacity-90">
              <ArrowLeftRight size={18} color={cor.texto} />
              <Text className="font-body-bold text-[14px] text-texto">{verAcertos ? 'Esconder acertos' : 'Acertar contas'}</Text>
            </Pressable>
          ) : null}
          {verAcertos ? (
            <View className="mt-3 gap-2">
              {contas.acertos.map((a, i) => (
                <Text key={i} className="font-body text-[14px] text-texto">
                  <Text className="font-body-bold">{nome(a.de)}</Text> paga <Text className="font-body-bold">{dinheiro(a.valor)}</Text> pra <Text className="font-body-bold">{nome(a.para)}</Text>
                </Text>
              ))}
            </View>
          ) : null}
          <View className="mt-3.5 flex-row justify-between border-t border-escuro/10 pt-3.5">
            <Text className="font-body text-[13px] text-corpo">
              Total do grupo <Text className="font-body-bold text-texto">{dinheiro(contas.total)}</Text>
            </Text>
            {viagem.membros.length ? <Text className="font-body text-[13px] text-corpo">{dinheiro(Math.round(contas.total / viagem.membros.length))} por pessoa</Text> : null}
          </View>
        </View>

        {euro ? (
          <Cartao className="flex-row items-center gap-3 p-4">
            <IconeQuadrado>
              <Wallet size={20} color={cor.couro} />
            </IconeQuadrado>
            <View className="flex-1">
              <Text className="font-body-bold text-[14px] text-texto">Euro do comboio</Text>
              <Text className="font-body text-[12.5px] text-suave">Meu euro: {formatarDinheiro(Math.round(meuEuro * 100), 'EUR')}</Text>
            </View>
            <Text className="font-display text-[20px] text-texto">{formatarDinheiro(Math.round(euroDoComboio * 100), 'EUR')}</Text>
          </Cartao>
        ) : null}

        <Cartao className="p-5">
          <Text className="mb-3.5 font-body-bold text-[15px] text-texto">Saldo por pessoa</Text>
          <View className="gap-3">
            {porPessoa.map((p) => {
              const largura = (Math.abs(p.valor) / maiorSaldo) * 50
              const positivo = p.valor >= 0
              return (
                <View key={p.id} className="flex-row items-center gap-2.5">
                  <Avatar nome={viagem.membros[indice(p.id)].nome} indice={indice(p.id)} tamanho={30} />
                  <Text className="w-[52px] font-body-semibold text-[13px] text-texto" numberOfLines={1}>
                    {nome(p.id)}
                  </Text>
                  <View className="h-2 flex-1 rounded bg-[#F3E9DA]">
                    <View className="absolute -bottom-[3px] -top-[3px] left-1/2 w-px bg-tracejado" />
                    <View
                      className="absolute bottom-0 top-0 rounded"
                      style={{ left: `${positivo ? 50 : 50 - largura}%`, width: `${largura}%`, backgroundColor: positivo ? cor.verde : cor.vermelho }}
                    />
                  </View>
                  <Text className="w-[78px] text-right font-body-bold text-[13px]" style={{ color: p.valor === 0 ? cor.suave : positivo ? cor.verde : cor.vermelho }}>
                    {p.valor === 0 ? '—' : `${positivo ? '+' : '−'} ${dinheiro(Math.abs(p.valor))}`}
                  </Text>
                </View>
              )
            })}
          </View>
        </Cartao>

        {grupos.map((g) => (
          <View key={g.titulo}>
            <RotuloDeSecao>{g.titulo}</RotuloDeSecao>
            <Cartao className="px-4 py-1">
              {g.itens.map((e, i) => {
                const Icone = ICONE_DA_CATEGORIA[e.categoria] ?? Receipt
                const pessoas = e.divisoes.length
                return (
                  <View key={e.id} className={i < g.itens.length - 1 ? 'border-b border-linha' : ''}>
                  <Pressable onPress={() => setAberto(aberto === e.id ? null : e.id)} className="flex-row items-center gap-3 py-3 active:opacity-80" accessibilityLabel={`Comentários de ${e.descricao}`}>
                    <View>
                      <IconeQuadrado>
                        <Icone size={20} color={cor.couro} />
                      </IconeQuadrado>
                      <View className="absolute -bottom-[5px] -right-[5px] rounded-full border-2 border-cartao">
                        <Avatar nome={viagem.membros.find((m) => m.id === e.pago_por)?.nome ?? '?'} indice={indice(e.pago_por)} tamanho={18} />
                      </View>
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text className="font-body-bold text-[14px] text-texto" numberOfLines={1}>
                        {e.descricao}
                      </Text>
                      <Text className="mt-0.5 font-body text-[12.5px] text-suave">
                        {e.pago_por === meuId ? 'Você pagou' : `${nome(e.pago_por)} pagou`}
                        {e.pessoal ? ' · só seu' : pessoas ? ` · dividido por ${pessoas}` : ''}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="font-body-bold text-[14px] text-texto">{formatarDinheiro(e.valor, e.moeda)}</Text>
                      {comentarios[e.id] ? (
                        <View className="mt-0.5 flex-row items-center gap-1">
                          <MessageCircle size={12} color={cor.suave} />
                          <Text className="font-body text-[12px] text-suave">{comentarios[e.id]}</Text>
                        </View>
                      ) : null}
                    </View>
                  </Pressable>
                  {/* Spec 025: comentários do gasto */}
                  {aberto === e.id ? (
                    <ComentariosDoItem
                      viagemId={viagem.id}
                      alvo={{ tipo: 'gasto', id: e.id }}
                      membros={viagem.membros}
                      meuId={meuId}
                      euSouAdm={viagem.membros.some((m) => m.id === meuId && m.papel === 'adm')}
                      aoMudar={(total) => setComentarios((atual) => ({ ...atual, [e.id]: total }))}
                    />
                  ) : null}
                  </View>
                )
              })}
            </Cartao>
          </View>
        ))}
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 px-5 pb-3 pt-4" style={{ backgroundColor: 'rgba(251,243,230,0.94)' }}>
        <View style={sombra.botao} className="rounded-2xl">
          <Botao titulo="Adicionar gasto" icone={<Plus size={20} color="#fff" />} aoTocar={adicionar} />
        </View>
      </View>
    </View>
  )
}

// Gastos agrupados por dia: "Hoje · sáb 15", "sex 14"...
function agruparPorDia(gastos: GastoDaViagem[]) {
  const hoje = hojeIso()
  const grupos: { titulo: string; itens: GastoDaViagem[] }[] = []
  for (const g of gastos) {
    const titulo = g.data === hoje ? `Hoje · ${diaCurto(lerData(g.data))}` : diaCurto(lerData(g.data))
    const grupo = grupos.find((x) => x.titulo === titulo)
    if (grupo) grupo.itens.push(g)
    else grupos.push({ titulo, itens: [g] })
  }
  return grupos
}

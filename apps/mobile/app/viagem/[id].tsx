import { useState } from 'react'
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from '../../src/ui/StatusBar'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter, type Href } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Car, Image as ImageIcon, Plus, ReceiptText, Route, Share2 } from 'lucide-react-native'
import { buscarGastos, buscarTrajetos, buscarViagemComDetalhes, formatarDinheiro } from '@together/core'
import { resumoDasContas } from '../../src/dados/contas'
import { useCarregar } from '../../src/dados/useCarregar'
import { useViagemAtual } from '../../src/dados/viagemAtual'
import { compartilharLink, gerarLinkDeConvite } from '../../src/lib/convite'
import { periodo } from '../../src/lib/formato'
import { supabase } from '../../src/lib/supabase'
import { capaDaViagem } from '../../src/ui/fotos'
import { Avisos } from '../../src/ui/Avisos'
import { Tarefas } from '../../src/ui/Tarefas'
import { Enquetes } from '../../src/ui/Enquetes'
import { PontoDeEncontro } from '../../src/ui/PontoDeEncontro'
import { AgendaDeHoje } from '../../src/ui/AgendaDeHoje'
import { Clima } from '../../src/ui/Clima'
import { Novidades } from '../../src/ui/Novidades'
import { GuiaDaCasa } from '../../src/ui/GuiaDaCasa'
import { Cofre } from '../../src/ui/Cofre'
import { BotaoRedondo, Cartao, Carregando, ErroNaTela, IconeQuadrado, PilhaDeAvatares } from '../../src/ui/pecas'
import { cor } from '../../theme'

// Detalhe da viagem (tela "1g" do design): capa, comboio, atalhos e resumo dos gastos.
export default function DetalheDaViagem() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { meuId, escolher } = useViagemAtual()
  const [convite, setConvite] = useState<string | null>(null)

  const carga = useCarregar(async () => {
    const [viagem, gastos, trajetos, fotos] = await Promise.all([
      buscarViagemComDetalhes(supabase, id),
      buscarGastos(supabase, id),
      buscarTrajetos(supabase, id),
      supabase.from('fotos').select('id', { count: 'exact', head: true }).eq('viagem_id', id),
    ])
    return { viagem, gastos, trajetos, fotos: fotos.count ?? 0 }
  }, [id])

  if (carga.status === 'carregando') return <Carregando />
  if (carga.status === 'erro' || !carga.dados.viagem) return <ErroNaTela aoTentar={carga.recarregar} />
  const { viagem, gastos, trajetos, fotos } = carga.dados
  const contas = resumoDasContas(gastos, viagem.moeda)
  const meuSaldo = contas.saldos.get(meuId) ?? 0
  const euSouAdm = viagem.membros.some((m) => m.id === meuId && m.papel === 'adm')

  // Os atalhos abrem as abas já nesta viagem
  const ir = (rota: Href) => {
    escolher(viagem.id)
    router.push(rota)
  }

  const atalhos = [
    { Icone: Route, t: 'Roteiro', s: `${viagem.destinos.length} ${viagem.destinos.length === 1 ? 'destino' : 'destinos'}`, rota: '/roteiro' as Href },
    { Icone: Car, t: 'Transporte', s: trajetos.length ? `${trajetos.length} ${trajetos.length === 1 ? 'trajeto' : 'trajetos'}` : 'Nada ainda', rota: '/transportes' as Href },
    { Icone: ReceiptText, t: 'Contas', s: `${contas.quantidade} ${contas.quantidade === 1 ? 'gasto' : 'gastos'}`, rota: '/contas' as Href },
    { Icone: ImageIcon, t: 'Fotos', s: `${fotos} ${fotos === 1 ? 'foto' : 'fotos'}`, rota: '/fotos' as Href },
  ]

  async function convidar() {
    try {
      const link = await gerarLinkDeConvite(viagem!.id)
      const r = await compartilharLink(link, viagem!.nome)
      setConvite(r === 'copiado' ? 'Link copiado! Mande pra turma.' : null)
    } catch {
      setConvite('Só o ADM da viagem pode gerar convite.')
    }
  }

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
        <View className="h-[350px] bg-couro">
          <ImageBackground source={{ uri: capaDaViagem(viagem.id) }} resizeMode="cover" style={StyleSheet.absoluteFill}>
            <LinearGradient
              colors={['rgba(74,46,20,0.35)', 'rgba(74,46,20,0)', 'rgba(185,122,34,0.4)', '#4A2E14']}
              locations={[0, 0.3, 0.6, 1]}
              style={StyleSheet.absoluteFill}
            />
          </ImageBackground>
          <View className="absolute bottom-7 left-6 right-6">
            <Text className="font-body-semibold text-[13px] uppercase tracking-wider text-creme">
              {[periodo(viagem.dataInicio, viagem.dataFim), viagem.destinos[0]].filter(Boolean).join(' · ')}
            </Text>
            <Text className="mt-2 font-display text-[38px] leading-[40px] text-white">{viagem.nome}</Text>
          </View>
          {/* Botões sobre a capa: rolam junto com ela, então não cobrem os cartões brancos */}
          <View className="absolute left-5 right-5 flex-row justify-between" style={{ top: insets.top + 8 }}>
            <BotaoRedondo claro aoTocar={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
              <ArrowLeft size={20} color={cor.texto} />
            </BotaoRedondo>
            <BotaoRedondo claro aoTocar={convidar}>
              <Share2 size={20} color={cor.texto} />
            </BotaoRedondo>
          </View>
        </View>

        <View className="gap-4 px-5 pt-5">
          <View className="flex-row items-center justify-between">
            <PilhaDeAvatares nomes={viagem.membros.map((m) => m.nome)} tamanho={36} />
            <Pressable onPress={convidar} className="h-10 flex-row items-center gap-1.5 rounded-xl border border-tracejado px-3.5 active:opacity-80">
              <Plus size={18} color={cor.couro} />
              <Text className="font-body-semibold text-[14px] text-couro">Convidar</Text>
            </Pressable>
          </View>
          {convite ? <Text className="font-body-medium text-[13px] text-verde">{convite}</Text> : null}

          {/* Spec 019: recados do ADM fixados no topo da viagem */}
          <Avisos viagemId={viagem.id} euSouAdm={euSouAdm} />

          {/* Spec 031: o que mudou desde a última vez */}
          <Novidades viagemId={viagem.id} meuId={meuId} membros={viagem.membros} />

          <View className="flex-row flex-wrap gap-2.5">
            {atalhos.map(({ Icone, t, s, rota }) => (
              <Pressable key={t} onPress={() => ir(rota)} className="gap-3 rounded-2xl bg-cartao p-4 active:opacity-90" style={{ width: '48.5%', boxShadow: '0 4px 14px rgba(74,46,20,0.06)' }}>
                <IconeQuadrado>
                  <Icone size={22} color={cor.couro} />
                </IconeQuadrado>
                <View>
                  <Text className="font-body-bold text-[15px] text-texto">{t}</Text>
                  <Text className="mt-0.5 font-body text-[13px] text-suave">{s}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={() => ir('/contas')}>
            <Cartao className="p-6">
              <View className="flex-row items-baseline justify-between">
                <Text className="font-body-semibold text-[13px] text-suave">Gastos do grupo</Text>
                {meuSaldo !== 0 ? (
                  <Text className={`font-body-bold text-[13px] ${meuSaldo > 0 ? 'text-verde' : 'text-vermelho'}`}>
                    {meuSaldo > 0 ? 'Você recebe' : 'Você deve'} {formatarDinheiro(Math.abs(meuSaldo), viagem.moeda)}
                  </Text>
                ) : null}
              </View>
              <Text className="mb-4 mt-1.5 font-display text-[32px] text-texto">{formatarDinheiro(contas.total, viagem.moeda)}</Text>
              {contas.total > 0 ? (
                <>
                  <View className="h-2.5 flex-row gap-0.5 overflow-hidden rounded-[5px]">
                    {contas.porCategoria.map((c) => (
                      <View key={c.chave} style={{ flex: c.valor, backgroundColor: c.cor }} />
                    ))}
                  </View>
                  <View className="mt-3.5 flex-row flex-wrap gap-y-2">
                    {contas.porCategoria.map((c) => (
                      <View key={c.chave} className="w-1/2 flex-row items-center gap-2">
                        <View className="h-2 w-2 rounded-sm" style={{ backgroundColor: c.cor }} />
                        <Text className="font-body text-[13px] text-corpo">{c.nome}</Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : (
                <Text className="font-body text-[13px] text-corpo">Nenhum gasto lançado ainda.</Text>
              )}
            </Cartao>
          </Pressable>

          {/* Spec 029 e 022: agenda do dia e tempo (paridade com o site) */}
          <AgendaDeHoje viagemId={viagem.id} inicio={viagem.dataInicio} fim={viagem.dataFim} />
          <Clima viagemId={viagem.id} />
          {/* Spec 026: guia da casa de onde dormimos */}
          <GuiaDaCasa viagemId={viagem.id} />
          {/* Spec 028: cofre (reservas, ingressos, bilhetes) */}
          <Cofre viagemId={viagem.id} />

          {/* Spec 020: tarefas com responsável */}
          <Tarefas viagemId={viagem.id} membros={viagem.membros} meuId={meuId} euSouAdm={euSouAdm} />

          {/* Spec 021: enquetes rápidas */}
          <Enquetes viagemId={viagem.id} meuId={meuId} euSouAdm={euSouAdm} />

          {/* Roadmap #7: ponto de encontro */}
          <PontoDeEncontro viagemId={viagem.id} meuId={meuId} euSouAdm={euSouAdm} />
        </View>
      </ScrollView>
    </View>
  )
}

import { useRef, useState, type ComponentRef, type ReactNode } from 'react'
import { Image, Platform, Pressable, ScrollView, Share, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Sharing from 'expo-sharing'
import { captureRef } from 'react-native-view-shot'
import { ArrowLeft, FileText, RotateCcw, Share2, Sparkles, Users } from '../src/ui/icones'
import {
  buscarCarimbos,
  buscarDestinos,
  buscarGastos,
  buscarPostsDaViagem,
  carimbosDaCapa,
  cartoesDaRetrospectiva,
  codigoDoPais,
  estatisticasDoViajante,
  fonteDoNomeNoCarimbo,
  formatarDinheiro,
  legendaDaRetrospectiva,
  melhoresPosts,
  molduraDaViagem,
  nomeDoPais,
  retrospectivaPronta,
  trajetoDaViagem,
  type CartaoDaRetrospectiva,
  type Moldura,
  type PontoDoTrajeto,
  type PostDaViagem,
} from '@together/core'
import { useCarregar } from '../src/dados/useCarregar'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { resumoDasContas } from '../src/dados/contas'
import { hojeIso } from '../src/lib/formato'
import { supabase } from '../src/lib/supabase'
import { StatusBar } from '../src/ui/StatusBar'
import { Icone } from '../src/ui/Icone'
import { MapaPercorrido } from '../src/ui/viagem/MapaPercorrido'
import { Botao, BotaoRedondo, Cartao, Carregando, ErroNaTela } from '../src/ui/pecas'
import { cor } from '../theme'

// Retrospectiva (specs 105 e 118c no mobile): monta sozinha quando a viagem acaba.
// Moldura pela data (Réveillon, Carnaval, São João, feriadão), capa com o mapa percorrido e os
// carimbos, cartões com os números, as 3 fotos mais curtidas, legenda pronta (dá pra trocar),
// caderno em PDF e "Bora a próxima?" (nova viagem com a mesma galera, spec 055).
// Cada cartão vira imagem (foto da tela do cartão) e abre o "compartilhar" pro Instagram/WhatsApp.

type Capa = { moldura: Moldura; pontos: PontoDoTrajeto[]; carimbos: { nome: string; data: string; memoria: boolean }[]; resumo: string }

export default function Retrospectiva() {
  const { atual } = useViagemAtual()
  const carga = useCarregar(
    atual
      ? async () => {
          const [destinos, gastos, posts, lugares, carimbos] = await Promise.all([
            buscarDestinos(supabase, atual.id),
            buscarGastos(supabase, atual.id),
            buscarPostsDaViagem(supabase, atual.id),
            supabase.from('lugares').select('id', { count: 'exact', head: true }).eq('viagem_id', atual.id).not('visitado_em', 'is', null),
            buscarCarimbos(supabase, atual.id),
          ])
          const comCodigo = destinos.map((d) => ({ ...d, codigo: codigoDoPais(d.pais) }))
          const e = estatisticasDoViajante([{ id: atual.id, nome: atual.nome, data_inicio: atual.dataInicio, data_fim: atual.dataFim }], comCodigo, hojeIso())
          const gasto = resumoDasContas(gastos, atual.moeda).total // só o que é do grupo
          const cidades = [...new Set(destinos.map((d) => d.nome))]
          const daCapa = carimbosDaCapa(carimbos)
          const cartoes = cartoesDaRetrospectiva({
            nome: atual.nome,
            dias: e.dias,
            km: e.km,
            cidades,
            paises: e.paises.map(nomeDoPais),
            gastoTotal: gasto,
            dinheiro: (c) => formatarDinheiro(c, atual.moeda),
            pessoas: atual.membros.length,
            posts: posts.length,
            fotos: posts.reduce((s, p) => s + p.fotos.length, 0),
            curtidas: posts.reduce((s, p) => s + p.curtidas.length, 0),
            lugaresVisitados: lugares.count ?? 0,
            carimbados: daCapa.map((c) => c.nome),
          })
          const moldura = molduraDaViagem(atual.dataInicio, atual.dataFim)
          const legenda = legendaDaRetrospectiva({ nome: atual.nome, lugares: cidades, moldura, dias: e.dias, pessoas: atual.membros.length, carimbados: daCapa.length })
          const pessoas = atual.membros.length
          const capa: Capa = {
            moldura,
            pontos: trajetoDaViagem(destinos),
            carimbos: daCapa,
            resumo: [e.dias > 0 ? `${e.dias} ${e.dias === 1 ? 'dia' : 'dias'}` : null, pessoas > 1 ? `${pessoas} pessoas` : null].filter(Boolean).join(' · '),
          }
          return { cartoes, melhores: melhoresPosts(posts, 3), capa, legenda }
        }
      : null,
    [atual?.id],
  )

  if (!atual) return null
  if (carga.status === 'carregando') return <Carregando />
  if (carga.status === 'erro') return <ErroNaTela aoTentar={carga.recarregar} />
  return <Tela viagemId={atual.id} nome={atual.nome} pronta={retrospectivaPronta(atual.dataFim, hojeIso())} {...carga.dados} />
}

function Tela({
  viagemId,
  nome,
  pronta,
  cartoes,
  melhores,
  capa,
  legenda: sugerida,
}: {
  viagemId: string
  nome: string
  pronta: boolean
  cartoes: CartaoDaRetrospectiva[]
  melhores: PostDaViagem[]
  capa: Capa
  legenda: string
}) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [legenda, setLegenda] = useState(sugerida)
  const { moldura } = capa
  const temCapa = capa.pontos.length > 0 || capa.carimbos.length > 0

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: insets.bottom + 40, gap: 14 }}>
        <View className="flex-row items-center justify-between">
          <BotaoRedondo aoTocar={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
            <ArrowLeft size={20} color={cor.texto} />
          </BotaoRedondo>
          <Pressable
            onPress={() => router.push('/pdf-da-viagem')}
            className="flex-row items-center gap-1.5 rounded-full border border-borda bg-white px-3.5 py-2"
            accessibilityRole="button"
          >
            <FileText size={15} color={cor.couro} />
            <Text className="font-body-bold text-[13px] text-couro">Caderno em PDF</Text>
          </Pressable>
        </View>
        <View>
          <Text className="font-display text-[32px] text-texto">Retrospectiva</Text>
          {moldura.titulo ? (
            <View className="mt-1 flex-row items-center gap-1.5 self-start rounded-full px-3 py-1" style={{ backgroundColor: moldura.fundo }}>
              <Icone nome={moldura.icone} tamanho={14} cor={moldura.texto} />
              <Text className="font-body-bold text-[12px]" style={{ color: moldura.texto }}>
                {moldura.titulo}
              </Text>
            </View>
          ) : null}
          <Text className="mt-1.5 font-body text-[14px] leading-5 text-suave">
            {pronta ? 'A viagem acabou e a retrospectiva ficou pronta. Toque em "Postar" pra mandar pro story.' : 'Fica pronta sozinha quando a viagem acabar. Já dá pra ver como está ficando.'}
          </Text>
        </View>

        {temCapa ? (
          <Postavel titulo="capa">
            <View className="flex-1 justify-between p-7" style={{ backgroundColor: moldura.fundo }}>
              <View>
                <Text className="font-body-bold text-[13px] uppercase tracking-widest" style={{ color: moldura.destaque }}>
                  {moldura.titulo ?? 'Retrospectiva'}
                </Text>
                <Text className="mt-1 font-display text-[36px] leading-[40px]" style={{ color: moldura.texto }} numberOfLines={2}>
                  {nome}
                </Text>
                {capa.resumo ? (
                  <Text className="mt-1 font-body text-[15px]" style={{ color: moldura.texto }}>
                    {capa.resumo}
                  </Text>
                ) : null}
              </View>
              <MapaPercorrido pontos={capa.pontos} fundo={cor.escuro} destaque={moldura.destaque} texto={moldura.texto} />
              <View className="flex-row flex-wrap justify-center gap-2.5">
                {capa.carimbos.slice(0, 6).map((c, i) => (
                  <View
                    key={`${c.nome}-${i}`}
                    className="h-[76px] w-[76px] items-center justify-center rounded-full p-1.5"
                    style={{ borderWidth: 2.5, borderStyle: c.memoria ? 'dashed' : 'solid', borderColor: moldura.destaque, transform: [{ rotate: i % 2 ? '5deg' : '-6deg' }] }}
                  >
                    <Text className="text-center font-body-bold uppercase" style={{ color: moldura.texto, fontSize: fonteDoNomeNoCarimbo(c.nome, 60, 10) }} numberOfLines={2}>
                      {c.nome}
                    </Text>
                    <Text className="mt-0.5 font-body-bold text-[8px] uppercase" style={{ color: moldura.destaque }}>
                      {c.data}
                    </Text>
                  </View>
                ))}
              </View>
              <Text className="font-body-bold text-[12px] uppercase tracking-widest" style={{ color: moldura.destaque }}>
                feito com Norti
              </Text>
            </View>
          </Postavel>
        ) : null}

        {cartoes.length === 0 ? (
          <Cartao className="p-4">
            <Text className="font-body text-[14px] leading-5 text-suave">Ainda não tem números pra mostrar. Volte quando a viagem começar.</Text>
          </Cartao>
        ) : (
          cartoes.map((c) => (
            <Postavel key={c.chave} titulo={c.titulo}>
              <View className="flex-1 justify-between p-7" style={{ backgroundColor: moldura.fundo }}>
                <Text className="font-body-bold text-[13px] uppercase tracking-widest" style={{ color: moldura.destaque }}>
                  {moldura.titulo ? `${moldura.titulo} · ${nome}` : nome}
                </Text>
                <View>
                  <Text className="font-display text-[84px] leading-[92px]" style={{ color: '#FFFFFF' }} adjustsFontSizeToFit numberOfLines={1}>
                    {c.numero}
                  </Text>
                  <Text className="font-display text-[30px]" style={{ color: moldura.texto }}>
                    {c.titulo}
                  </Text>
                  <Text className="mt-3 font-body text-[16px] leading-6" style={{ color: moldura.texto, opacity: 0.85 }}>
                    {c.legenda}
                  </Text>
                </View>
                <Text className="font-body-bold text-[12px] uppercase tracking-widest" style={{ color: moldura.destaque }}>
                  Norti
                </Text>
              </View>
            </Postavel>
          ))
        )}

        {melhores.length > 0 ? (
          <View className="gap-2 rounded-3xl p-5" style={{ backgroundColor: moldura.fundo }}>
            <View className="flex-row items-center gap-1.5">
              <Sparkles size={14} color={moldura.texto} />
              <Text className="font-body-bold text-[12px] uppercase tracking-widest" style={{ color: moldura.texto }}>
                As mais curtidas
              </Text>
            </View>
            <View className="flex-row gap-2">
              {melhores.map((p) =>
                p.fotos[0]?.url ? <Image key={p.id} source={{ uri: p.fotos[0].url }} className="aspect-square flex-1 rounded-xl" accessibilityLabel={p.legenda ?? 'Foto'} /> : null,
              )}
            </View>
          </View>
        ) : null}

        <Cartao className="gap-2 p-4">
          <Text className="font-body-bold text-[15px] text-texto">Legenda pronta</Text>
          <Text className="font-body text-[13px] leading-5 text-suave">Dá pra trocar o que quiser antes de postar.</Text>
          <TextInput
            value={legenda}
            onChangeText={setLegenda}
            multiline
            maxLength={600}
            className="min-h-[96px] rounded-2xl border border-borda bg-fundo p-3 font-body text-[15px] leading-6 text-texto"
            style={{ textAlignVertical: 'top' }}
            accessibilityLabel="Legenda da retrospectiva"
          />
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Botao titulo="Mandar legenda" compacto icone={<Share2 size={16} color="#FFFFFF" />} aoTocar={() => Share.share({ message: legenda }).catch(() => {})} />
            </View>
            {legenda !== sugerida ? (
              <Botao titulo="Voltar à sugerida" tipo="secundario" compacto icone={<RotateCcw size={16} color={cor.couro} />} aoTocar={() => setLegenda(sugerida)} />
            ) : null}
          </View>
        </Cartao>

        <Cartao className="gap-2 p-4">
          <View className="flex-row items-center gap-2">
            <Users size={18} color={cor.couro} />
            <Text className="font-display text-[22px] text-texto">Bora a próxima?</Text>
          </View>
          <Text className="font-body text-[14px] leading-5 text-corpo">Uma viagem nova com a mesma galera: todo mundo já entra, sem convite.</Text>
          <Botao titulo="Criar a próxima viagem" aoTocar={() => router.push({ pathname: '/nova-viagem', params: { comboio: viagemId } })} />
        </Cartao>
      </ScrollView>
    </View>
  )
}

// Um cartão 9:16: o que está dentro da View com ref vira a imagem (o botão fica fora)
function Postavel({ titulo, children }: { titulo: string; children: ReactNode }) {
  const ref = useRef<ComponentRef<typeof View>>(null)
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState(false)
  const podePostar = Platform.OS !== 'web' // no navegador o view-shot não funciona; o site tem o próprio "Baixar"

  async function postar() {
    setGerando(true)
    setErro(false)
    try {
      const uri = await captureRef(ref, { format: 'png', quality: 1, width: 1080, height: 1920 })
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png' })
    } catch (e) {
      console.error('Erro ao gerar a imagem do cartão:', e)
      setErro(true)
    }
    setGerando(false)
  }

  return (
    <View className="gap-2">
      <View ref={ref} collapsable={false} style={{ aspectRatio: 9 / 16, borderRadius: 28, overflow: 'hidden' }}>
        {children}
      </View>
      {podePostar ? (
        <Pressable
          onPress={postar}
          disabled={gerando}
          className="flex-row items-center justify-center gap-2 rounded-full border border-borda bg-white py-3"
          accessibilityRole="button"
          accessibilityLabel={`Postar o cartão ${titulo}`}
        >
          <Share2 size={16} color={cor.couro} />
          <Text className="font-body-bold text-[14px] text-couro">{gerando ? 'Gerando…' : 'Postar'}</Text>
        </Pressable>
      ) : null}
      {erro ? <Text className="font-body-medium text-[13px] text-vermelho">Não deu pra gerar a imagem. Tente de novo.</Text> : null}
    </View>
  )
}

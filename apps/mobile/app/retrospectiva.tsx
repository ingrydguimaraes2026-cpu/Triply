import { useRef, useState, type ComponentRef } from 'react'
import { Image, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { Foto } from '../src/ui/Foto'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Sharing from 'expo-sharing'
import { captureRef } from 'react-native-view-shot'
import { ArrowLeft, FileText, Share2, Sparkles } from '../src/ui/icones'
import {
  buscarDestinos,
  buscarGastos,
  buscarPostsDaViagem,
  cartoesDaRetrospectiva,
  codigoDoPais,
  estatisticasDoViajante,
  formatarDinheiro,
  melhoresPosts,
  nomeDoPais,
  type CartaoDaRetrospectiva,
  type PostDaViagem,
} from '@together/core'
import { useCarregar } from '../src/dados/useCarregar'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { resumoDasContas } from '../src/dados/contas'
import { hojeIso } from '../src/lib/formato'
import { supabase } from '../src/lib/supabase'
import { StatusBar } from '../src/ui/StatusBar'
import { BotaoRedondo, Cartao, Carregando, ErroNaTela } from '../src/ui/pecas'
import { cor } from '../theme'

// Retrospectiva (spec 105 no mobile): a viagem em números, em cartões "estilo story".
// Cada cartão vira imagem (foto da tela do cartão) e abre o "compartilhar" pro Instagram/WhatsApp.

export default function Retrospectiva() {
  const { atual } = useViagemAtual()
  const carga = useCarregar(
    atual
      ? async () => {
          const [destinos, gastos, posts, lugares] = await Promise.all([
            buscarDestinos(supabase, atual.id),
            buscarGastos(supabase, atual.id),
            buscarPostsDaViagem(supabase, atual.id),
            supabase.from('lugares').select('id', { count: 'exact', head: true }).eq('viagem_id', atual.id).not('visitado_em', 'is', null),
          ])
          const comCodigo = destinos.map((d) => ({ ...d, codigo: codigoDoPais(d.pais) }))
          const e = estatisticasDoViajante([{ id: atual.id, nome: atual.nome, data_inicio: atual.dataInicio, data_fim: atual.dataFim }], comCodigo, hojeIso())
          const gasto = resumoDasContas(gastos, atual.moeda).total
          const cartoes = cartoesDaRetrospectiva({
            nome: atual.nome,
            dias: e.dias,
            km: e.km,
            cidades: [...new Set(comCodigo.filter((d) => d.codigo !== 'BR').map((d) => d.nome))],
            paises: e.paises.map(nomeDoPais),
            gastoTotal: gasto,
            dinheiro: (c) => formatarDinheiro(c, atual.moeda),
            pessoas: atual.membros.length,
            posts: posts.length,
            fotos: posts.reduce((s, p) => s + p.fotos.length, 0),
            curtidas: posts.reduce((s, p) => s + p.curtidas.length, 0),
            lugaresVisitados: lugares.count ?? 0,
          })
          return { cartoes, melhores: melhoresPosts(posts, 3) }
        }
      : null,
    [atual?.id],
  )

  if (!atual) return null
  if (carga.status === 'carregando') return <Carregando />
  if (carga.status === 'erro') return <ErroNaTela aoTentar={carga.recarregar} />
  return <Tela nome={atual.nome} {...carga.dados} />
}

function Tela({ nome, cartoes, melhores }: { nome: string; cartoes: CartaoDaRetrospectiva[]; melhores: PostDaViagem[] }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
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
            <Text className="font-body-bold text-[13px] text-couro">Livro da viagem</Text>
          </Pressable>
        </View>
        <View>
          <Text className="font-display text-[32px] text-texto">Retrospectiva</Text>
          <Text className="mt-0.5 font-body text-[14px] text-suave">A viagem em números. Toque em "Postar" pra mandar pro story.</Text>
        </View>

        {cartoes.length === 0 ? (
          <Cartao className="p-4">
            <Text className="font-body text-[14px] leading-5 text-suave">Ainda não tem números pra mostrar. Volte quando a viagem começar.</Text>
          </Cartao>
        ) : (
          cartoes.map((c) => <CartaoStory key={c.chave} cartao={c} nome={nome} />)
        )}

        {melhores.length > 0 ? (
          <View className="gap-2 rounded-3xl bg-couro p-5">
            <View className="flex-row items-center gap-1.5">
              <Sparkles size={14} color="#F3E3C7" />
              <Text className="font-body-bold text-[12px] uppercase tracking-widest text-[#F3E3C7]">As mais curtidas</Text>
            </View>
            <View className="flex-row gap-2">
              {melhores.map((p) =>
                p.fotos[0]?.url ? <Image key={p.id} source={{ uri: p.fotos[0].url }} className="aspect-square flex-1 rounded-xl" accessibilityLabel={p.legenda ?? 'Foto'} /> : null,
              )}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  )
}

// Um cartão: o que está dentro da View com ref vira a imagem (o botão fica fora)
function CartaoStory({ cartao, nome }: { cartao: CartaoDaRetrospectiva; nome: string }) {
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
        <View className="flex-1 justify-between bg-couro p-7">
          <Text className="font-body-bold text-[13px] uppercase tracking-widest text-[#DDB97E]">{nome}</Text>
          <View>
            <Text className="font-display text-[84px] leading-[92px] text-white" adjustsFontSizeToFit numberOfLines={1}>
              {cartao.numero}
            </Text>
            <Text className="font-display text-[30px] text-[#F3E3C7]">{cartao.titulo}</Text>
            <Text className="mt-3 font-body text-[16px] leading-6 text-[#E3D2B8]">{cartao.legenda}</Text>
          </View>
          <Text className="font-body-bold text-[12px] uppercase tracking-widest text-[#B97A22]">Tripwave</Text>
        </View>
      </View>
      {podePostar ? (
        <Pressable
          onPress={postar}
          disabled={gerando}
          className="flex-row items-center justify-center gap-2 rounded-full border border-borda bg-white py-3"
          accessibilityRole="button"
          accessibilityLabel={`Postar o cartão ${cartao.titulo}`}
        >
          <Share2 size={16} color={cor.couro} />
          <Text className="font-body-bold text-[14px] text-couro">{gerando ? 'Gerando…' : 'Postar'}</Text>
        </Pressable>
      ) : null}
      {erro ? <Text className="font-body-medium text-[13px] text-vermelho">Não deu pra gerar a imagem. Tente de novo.</Text> : null}
    </View>
  )
}

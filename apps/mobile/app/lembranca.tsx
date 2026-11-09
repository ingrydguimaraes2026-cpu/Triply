import { useRef, useState, type ComponentRef, type ReactNode } from 'react'
import { Image, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Sharing from 'expo-sharing'
import { captureRef } from 'react-native-view-shot'
import { buscarLembranca, dataDaArte, fotosDaLembranca, iconeDoTipo, textoDaLembranca, type DadosDaLembranca } from '@together/core'
import { ArrowLeft, Share2 } from '../src/ui/icones'
import { useCarregar } from '../src/dados/useCarregar'
import { hojeIso, paraIso } from '../src/lib/formato'
import { supabase } from '../src/lib/supabase'
import { StatusBar } from '../src/ui/StatusBar'
import { Icone } from '../src/ui/Icone'
import { BotaoRedondo, Carregando, ErroNaTela, PilhaDeAvatares } from '../src/ui/pecas'
import { cor } from '../theme'

// Lembrança (spec 118d): abre pelo aviso "Há 1 ano vocês estavam em..." ou pelo cartão "Neste dia"
// do Início. Mostra o carimbo daquele dia, as fotos postadas nele, quem estava e o "Postar" (9:16).
// Rota: /lembranca?viagem=<id>&dia=AAAA-MM-DD

export default function TelaDaLembranca() {
  const { viagem, dia } = useLocalSearchParams<{ viagem: string; dia: string }>()
  const valido = !!viagem && /^\d{4}-\d{2}-\d{2}$/.test(dia ?? '')
  const carga = useCarregar(valido ? () => buscarLembranca(supabase, viagem, dia, hojeIso()) : null, [viagem, dia])
  if (!valido) return <ErroNaTela aoTentar={() => {}} />
  if (carga.status === 'carregando') return <Carregando />
  if (carga.status === 'erro') return <ErroNaTela aoTentar={carga.recarregar} />
  return <Tela dia={dia} {...carga.dados} />
}

function Tela({ dia, nome, lembranca, carimbos, posts, pessoas }: DadosDaLembranca & { dia: string }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const texto = lembranca ? textoDaLembranca(lembranca, pessoas.length <= 1) : { titulo: nome, detalhe: dataDaArte(dia) }
  const fotos = fotosDaLembranca(posts, dia, (iso) => paraIso(new Date(iso))).filter((p) => p.fotos[0]?.url)
  const capa = fotos[0]?.fotos[0]?.url ?? null
  const principal = carimbos[0] ?? null

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: insets.bottom + 40, gap: 16 }}>
        <View className="flex-row items-center">
          <BotaoRedondo aoTocar={() => (router.canGoBack() ? router.back() : router.replace('/'))} rotulo="Voltar">
            <ArrowLeft size={20} color={cor.texto} />
          </BotaoRedondo>
        </View>

        <View>
          <Text className="font-body-bold text-[12px] uppercase tracking-widest text-caramelo">Neste dia</Text>
          <Text className="font-display text-[28px] leading-[32px] text-texto">{texto.titulo}</Text>
          <Text className="mt-1 font-body-medium text-[14px] text-suave">
            {texto.detalhe} · {nome}
          </Text>
        </View>

        <Postavel titulo={texto.titulo}>
          <View className="flex-1 bg-couro">
            {capa ? <Image source={{ uri: capa }} style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.45 }} /> : null}
            <View className="flex-1 items-center justify-between px-6 py-10">
              <Text className="font-body-bold text-[12px] uppercase tracking-widest text-creme" numberOfLines={1}>
                {nome}
              </Text>
              {principal ? (
                <View style={{ transform: [{ rotate: '-6deg' }] }}>
                  <View style={{ width: 190, height: 190, borderRadius: 95, borderWidth: 7, borderColor: cor.dourado, borderStyle: principal.como === 'memoria' ? 'dashed' : 'solid', padding: 8 }}>
                    <View style={{ flex: 1, borderRadius: 90, borderWidth: 2, borderColor: cor.dourado, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }}>
                      <Icone nome={iconeDoTipo(principal.tipo)} tamanho={36} cor={cor.dourado} />
                      <Text className="text-center font-display text-[22px] text-creme" numberOfLines={2} adjustsFontSizeToFit>
                        {principal.nome}
                      </Text>
                      <Text className="font-body-bold text-[12px] uppercase text-dourado">{dataDaArte(principal.data)}</Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View />
              )}
              <View className="items-center gap-2">
                <Text className="text-center font-display text-[24px] leading-[28px] text-creme">{texto.titulo}</Text>
                <Text className="font-body-bold text-[11px] uppercase tracking-widest text-dourado">Norti</Text>
              </View>
            </View>
          </View>
        </Postavel>

        {pessoas.length > 0 ? (
          <View className="gap-2">
            <Text className="font-body-bold text-[15px] text-texto">Quem estava</Text>
            <View className="flex-row items-center gap-3">
              <PilhaDeAvatares nomes={pessoas} />
              <Text className="flex-1 font-body-medium text-[13px] text-suave" numberOfLines={2}>
                {pessoas.join(', ')}
              </Text>
            </View>
          </View>
        ) : null}

        {fotos.length > 0 ? (
          <View className="gap-2">
            <Text className="font-body-bold text-[15px] text-texto">{fotos.some((p) => paraIso(new Date(p.criado_em)) === dia) ? 'Fotos daquele dia' : 'Fotos mais curtidas da viagem'}</Text>
            <View className="flex-row flex-wrap gap-2">
              {fotos.slice(0, 9).map((p) => (
                <Image key={p.id} source={{ uri: p.fotos[0].url ?? undefined }} style={{ width: '31.5%', aspectRatio: 1, borderRadius: 12 }} accessibilityLabel={p.legenda ?? 'Foto'} />
              ))}
            </View>
          </View>
        ) : (
          <Text className="font-body-medium text-[14px] text-suave">Ninguém postou foto nesse dia. Fica o carimbo de lembrança.</Text>
        )}
      </ScrollView>
    </View>
  )
}

// Cartão 9:16 que vira PNG 1080×1920 e abre o compartilhar do celular (igual à retrospectiva)
function Postavel({ titulo, children }: { titulo: string; children: ReactNode }) {
  const ref = useRef<ComponentRef<typeof View>>(null)
  const [gerando, setGerando] = useState(false)
  const [erro, setErro] = useState(false)
  const podePostar = Platform.OS !== 'web'

  async function postar() {
    setGerando(true)
    setErro(false)
    try {
      const uri = await captureRef(ref, { format: 'png', quality: 1, width: 1080, height: 1920 })
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png' })
    } catch (e) {
      console.error('Erro ao gerar a imagem da lembrança:', e)
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
          className="flex-row items-center justify-center gap-2 rounded-full bg-couro py-3.5"
          accessibilityRole="button"
          accessibilityLabel={`Postar a lembrança: ${titulo}`}
        >
          <Share2 size={16} color={cor.creme} />
          <Text className="font-body-bold text-[15px] text-creme">{gerando ? 'Gerando…' : 'Postar'}</Text>
        </Pressable>
      ) : null}
      {erro ? <Text className="font-body-medium text-[13px] text-vermelho">Não deu pra gerar a imagem. Tente de novo.</Text> : null}
    </View>
  )
}

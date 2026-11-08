import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react'
import { Alert, Modal, Platform, Pressable, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated'
import * as Location from 'expo-location'
import * as Sharing from 'expo-sharing'
import { captureRef } from 'react-native-view-shot'
import {
  apagarCarimbo,
  buscarCarimbos,
  buscarDestinos,
  carimbosDaViagem,
  carimbosPelaLocalizacao,
  dataDaArte,
  dentroDaViagem,
  iconeDoTipo,
  liberarCarimbo,
  textoDoComo,
  tipoDoLugar,
  type Carimbo,
  type ComoLiberou,
  type DestinoDoCarimbo,
  type ViagemComDetalhes,
} from '@together/core'
import { supabase } from '../../lib/supabase'
import { useSessao } from '../../lib/sessao'
import { hojeIso } from '../../lib/formato'
import { Icone } from '../Icone'
import { Comemoracao } from '../Comemoracao'
import { duracao, mola, tum, useReducedMotion } from '../movimento'
import { cor } from '../../../theme'

// Carimbos da viagem (spec 118a): um por destino, apagado até alguém do grupo provar que esteve lá.
// Prova: localização (só com o app aberto, nas datas), foto com GPS ou "Cheguei" (120c).
// Sem prova: "a gente esteve aqui" (traço de memória). A localização não sai do celular.
export function CarimbosDaViagem({ viagem, meuId }: { viagem: ViagemComDetalhes; meuId: string }) {
  const { ehConvidado } = useSessao()
  const [destinos, setDestinos] = useState<DestinoDoCarimbo[]>([])
  const [carimbos, setCarimbos] = useState<Carimbo[] | null>(null)
  const [aberto, setAberto] = useState<string | null>(null)
  const [novos, setNovos] = useState<Set<string>>(new Set())
  const [comemorar, setComemorar] = useState<Carimbo | null>(null)
  const [postando, setPostando] = useState<Carimbo | null>(null)
  const [procurando, setProcurando] = useState(false)
  const [recado, setRecado] = useState<string | null>(null)
  const datas = { data_inicio: viagem.dataInicio, data_fim: viagem.dataFim }
  const naViagem = dentroDaViagem(hojeIso(), datas)
  const podeLiberar = !ehConvidado
  const euSouAdm = viagem.membros.some((m) => m.id === meuId && m.papel === 'adm')

  useEffect(() => {
    let vivo = true
    Promise.all([buscarDestinos(supabase, viagem.id), buscarCarimbos(supabase, viagem.id)])
      .then(([d, c]) => {
        if (!vivo) return
        setDestinos(d)
        setCarimbos(c)
      })
      .catch((e) => console.error('Erro ao buscar carimbos:', e))
    return () => {
      vivo = false
    }
  }, [viagem.id])

  const liberar = useCallback(
    async (destino: DestinoDoCarimbo, como: ComoLiberou) => {
      const novo = await liberarCarimbo(supabase, viagem.id, destino, como, { data_inicio: viagem.dataInicio, data_fim: viagem.dataFim }, hojeIso())
      if (novo) {
        setCarimbos((atual) => [...(atual ?? []), novo])
        setNovos((s) => new Set(s).add(destino.id))
        setComemorar(novo)
      } else setCarimbos(await buscarCarimbos(supabase, viagem.id)) // alguém liberou antes
    },
    [viagem.id, viagem.dataInicio, viagem.dataFim],
  )

  // Pela localização: compara no celular e só manda "estive aqui"
  const procurar = useCallback(
    async (pedir: boolean) => {
      if (!carimbos) return
      const permissao = pedir ? await Location.requestForegroundPermissionsAsync() : await Location.getForegroundPermissionsAsync()
      if (permissao.status !== 'granted') {
        if (pedir) setRecado('Sem a localização. Dá pra carimbar postando uma foto de lá.')
        return
      }
      setProcurando(true)
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
        const ponto = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
        const perto = carimbosPelaLocalizacao(destinos, carimbos, ponto, hojeIso(), { data_inicio: viagem.dataInicio, data_fim: viagem.dataFim })
        for (const d of perto) await liberar(d, 'localizacao')
        if (!perto.length && pedir) setRecado('Nenhum destino da viagem a até 15 km daqui.')
      } catch (e) {
        console.error('Erro ao carimbar pela localização:', e)
        if (pedir) setRecado('Não deu pra carimbar agora. Tente de novo.')
      }
      setProcurando(false)
    },
    [carimbos, destinos, viagem.dataInicio, viagem.dataFim, liberar],
  )

  // Na viagem, com a permissão já dada: confere sozinho ao abrir (sem perguntar)
  const carregou = carimbos !== null
  useEffect(() => {
    if (carregou && naViagem && podeLiberar && Platform.OS !== 'web') void procurar(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregou, naViagem, podeLiberar])

  if (!carimbos || !destinos.length) return null
  const lista = carimbosDaViagem(destinos, carimbos)
  const acesos = lista.filter((x) => x.carimbo).length
  const item = lista.find((x) => x.destino.id === aberto) ?? null
  const nomeDe = (id: string) => (id === meuId ? 'você' : (viagem.membros.find((m) => m.id === id)?.nome ?? 'alguém do comboio'))

  function apagar(c: Carimbo) {
    Alert.alert('Apagar carimbo?', `O carimbo de ${c.nome} volta a ficar apagado. Dá pra liberar de novo depois.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: () =>
          void apagarCarimbo(supabase, c.id)
            .then(() => {
              setCarimbos((atual) => (atual ?? []).filter((x) => x.id !== c.id))
              setAberto(null)
            })
            .catch((e) => console.error('Erro ao apagar carimbo:', e)),
      },
    ])
  }

  return (
    <View>
      <View className="mb-3 flex-row items-baseline justify-between">
        <Text className="font-display text-[20px] text-texto">Carimbos</Text>
        <Text className="font-body-bold text-[13px] text-caramelo">
          {acesos} de {lista.length}
        </Text>
      </View>

      <View className="flex-row flex-wrap justify-center gap-3 rounded-2xl border-[1.5px] border-dashed border-tracejado bg-chip px-2 py-3.5">
        {lista.map(({ destino, carimbo }, i) => (
          <Pressable
            key={destino.id}
            onPress={() => setAberto(aberto === destino.id ? null : destino.id)}
            accessibilityRole="button"
            accessibilityLabel={`${destino.nome}: ${carimbo ? `carimbado ${textoDoComo(carimbo.como)}` : 'ainda não carimbado'}`}
          >
            <ArteDoCarimbo nome={destino.nome} carimbo={carimbo} giro={i % 2 ? 5 : -6} novo={novos.has(destino.id)} />
          </Pressable>
        ))}
      </View>

      {recado ? <Text className="mt-2 font-body-semibold text-[13px] text-verde">{recado}</Text> : null}

      {item ? (
        <View className="mt-3 gap-2.5 rounded-2xl bg-cartao p-4">
          {item.carimbo ? (
            <>
              <Text className="font-body text-[14px] leading-5 text-corpo">
                <Text className="font-body-bold text-texto">{item.carimbo.nome}</Text>, {dataDaArte(item.carimbo.data)}. Liberado {textoDoComo(item.carimbo.como)} por{' '}
                {nomeDe(item.carimbo.liberado_por)}.
              </Text>
              <Text className="font-body text-[13px] text-suave">Com {viagem.membros.map((m) => m.nome.split(' ')[0]).join(', ')}.</Text>
              <View className="flex-row flex-wrap items-center gap-3">
                {podeLiberar && Platform.OS !== 'web' ? <Botao titulo="Postar carimbo" principal aoTocar={() => setPostando(item.carimbo)} /> : null}
                {euSouAdm ? <Botao titulo="Apagar" aoTocar={() => apagar(item.carimbo!)} /> : null}
              </View>
            </>
          ) : podeLiberar ? (
            <>
              <Text className="font-body text-[14px] leading-5 text-corpo">
                O carimbo de {item.destino.nome} cai sozinho quando alguém do comboio estiver lá ou postar uma foto de lá.
              </Text>
              <View className="flex-row flex-wrap items-center gap-3">
                {naViagem && Platform.OS !== 'web' ? <Botao titulo={procurando ? 'Procurando...' : 'Estou aqui'} principal aoTocar={() => void procurar(true)} /> : null}
                <Botao
                  titulo="A gente esteve aqui"
                  aoTocar={() =>
                    void liberar(item.destino, 'memoria').catch((e) => {
                      console.error('Erro ao carimbar de memória:', e)
                      setRecado('Não deu pra carimbar agora. Tente de novo.')
                    })
                  }
                />
              </View>
            </>
          ) : (
            <Text className="font-body text-[14px] text-suave">Ainda não carimbado.</Text>
          )}
        </View>
      ) : null}

      {/* Carimbo novo: a Norti comemora e oferece postar */}
      <Comemoracao
        visivel={!!comemorar}
        acima={`Carimbo ${acesos} de ${lista.length}`}
        titulo={comemorar ? `${comemorar.nome} carimbado!` : ''}
        desenho={comemorar ? <ArteDoCarimbo nome={comemorar.nome} carimbo={comemorar} giro={-6} novo={false} grande /> : null}
        texto={comemorar?.como === 'memoria' ? 'A gente esteve aqui.' : 'A galera esteve aqui.'}
        botoes={[
          ...(Platform.OS !== 'web' ? [{ titulo: 'Postar carimbo', principal: true, aoTocar: () => (setPostando(comemorar), setComemorar(null)) }] : []),
          { titulo: 'Continuar', aoTocar: () => setComemorar(null) },
        ]}
        aoFechar={() => setComemorar(null)}
      />

      <PostarCarimbo carimbo={postando} nomeDaViagem={viagem.nome} aoFechar={() => setPostando(null)} />
    </View>
  )
}

// A arte: aro duplo, girado, ícone do tipo, nome e data. Apagado = tracejado e transparente.
function ArteDoCarimbo({ nome, carimbo, giro, novo, grande = false }: { nome: string; carimbo: Carimbo | null; giro: number; novo: boolean; grande?: boolean }) {
  const reduzir = useReducedMotion()
  const p = useSharedValue(novo ? 0 : 1)
  useEffect(() => {
    if (!novo) return
    p.value = reduzir ? withTiming(1, { duration: duracao.media }) : withSpring(1, mola.firme)
    const t = setTimeout(() => tum(), 120)
    return () => clearTimeout(t)
  }, [novo, reduzir, p])
  const estilo = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.value),
    transform: reduzir ? [{ rotate: `${giro}deg` }] : [{ scale: 1 + (1 - p.value) * 1.2 }, { rotate: `${giro - (1 - p.value) * 30}deg` }],
  }))
  const lado = grande ? 150 : 92
  const tinta = carimbo ? cor.couro : cor.suave
  const traco = carimbo ? (carimbo.como === 'memoria' ? 'dotted' : 'solid') : 'dashed'
  return (
    <Animated.View style={[{ width: lado, height: lado, opacity: carimbo ? 1 : 0.35 }, estilo]}>
      <View
        style={{ flex: 1, borderRadius: lado / 2, borderWidth: grande ? 6 : 4, borderColor: tinta, borderStyle: traco, padding: grande ? 6 : 4 }}
      >
        <View
          style={{ flex: 1, borderRadius: lado / 2, borderWidth: carimbo ? 1.5 : 0, borderColor: tinta, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}
        >
          <Icone nome={iconeDoTipo(carimbo?.tipo ?? tipoDoLugar(nome))} tamanho={grande ? 30 : 20} cor={tinta} />
          <Text numberOfLines={2} className="text-center font-display" style={{ color: tinta, fontSize: grande ? 17 : 12, lineHeight: grande ? 20 : 14 }}>
            {nome}
          </Text>
          {carimbo ? (
            <Text className="font-body-bold uppercase text-caramelo" style={{ fontSize: grande ? 11 : 8.5 }}>
              {dataDaArte(carimbo.data)}
            </Text>
          ) : null}
        </View>
      </View>
    </Animated.View>
  )
}

// "Postar carimbo": cartão 9:16 que vira PNG 1080×1920 e abre o compartilhar do celular
function PostarCarimbo({ carimbo, nomeDaViagem, aoFechar }: { carimbo: Carimbo | null; nomeDaViagem: string; aoFechar: () => void }) {
  const ref = useRef<ComponentRef<typeof View>>(null)
  const [gerando, setGerando] = useState(false)

  async function compartilhar() {
    setGerando(true)
    try {
      const uri = await captureRef(ref, { format: 'png', quality: 1, width: 1080, height: 1920 })
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'image/png', UTI: 'public.png' })
    } catch (e) {
      console.error('Erro ao gerar a imagem do carimbo:', e)
    }
    setGerando(false)
  }

  return (
    <Modal visible={!!carimbo} transparent animationType="fade" onRequestClose={aoFechar}>
      <View className="flex-1 items-center justify-center gap-4 bg-black/70 px-8">
        {carimbo ? (
          <View ref={ref} collapsable={false} style={{ width: '100%', aspectRatio: 9 / 16, borderRadius: 24, overflow: 'hidden' }}>
            <View className="flex-1 items-center justify-between bg-couro px-6 py-10">
              <Text className="font-body-bold text-[12px] uppercase tracking-widest text-creme" numberOfLines={1}>
                {nomeDaViagem}
              </Text>
              <View style={{ transform: [{ rotate: '-6deg' }] }}>
                <View style={{ width: 210, height: 210, borderRadius: 105, borderWidth: 7, borderColor: cor.dourado, borderStyle: carimbo.como === 'memoria' ? 'dashed' : 'solid', padding: 8 }}>
                  <View style={{ flex: 1, borderRadius: 100, borderWidth: 2, borderColor: cor.dourado, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }}>
                    <Icone nome={iconeDoTipo(carimbo.tipo)} tamanho={40} cor={cor.dourado} />
                    <Text className="text-center font-display text-[24px] text-creme" numberOfLines={2} adjustsFontSizeToFit>
                      {carimbo.nome}
                    </Text>
                    <Text className="font-body-bold text-[12px] uppercase text-dourado">{dataDaArte(carimbo.data)}</Text>
                  </View>
                </View>
              </View>
              <View className="items-center gap-3">
                <Text className="font-body-medium text-[15px] text-creme">{carimbo.como === 'memoria' ? 'A gente esteve aqui.' : 'Carimbado pela galera.'}</Text>
                <Text className="font-body-bold text-[11px] uppercase tracking-widest text-dourado">Feito com Norti</Text>
              </View>
            </View>
          </View>
        ) : null}
        <View className="w-full gap-2.5">
          <Botao titulo={gerando ? 'Gerando...' : 'Compartilhar'} principal claro aoTocar={() => void compartilhar()} />
          <Botao titulo="Fechar" claro aoTocar={aoFechar} />
        </View>
      </View>
    </Modal>
  )
}

function Botao({ titulo, aoTocar, principal = false, claro = false }: { titulo: string; aoTocar: () => void; principal?: boolean; claro?: boolean }) {
  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      className={`items-center rounded-full px-4 py-2.5 active:opacity-80 ${principal ? 'bg-couro' : claro ? 'bg-white/15' : 'bg-areia'}`}
    >
      <Text className={`font-body-bold text-[14px] ${principal || claro ? 'text-white' : 'text-couro'}`}>{titulo}</Text>
    </Pressable>
  )
}

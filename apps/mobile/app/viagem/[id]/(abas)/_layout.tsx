import { useEffect, useRef } from 'react'
import { Platform, Pressable, Text, View } from 'react-native'
import { Tabs, useLocalSearchParams, usePathname, useRouter, type Href } from 'expo-router'
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import type { NomeDoIcone } from '@together/core'
import { Icone } from '../../../../src/ui/Icone'
import { useViagemAtual } from '../../../../src/dados/viagemAtual'
import { Carregando, ErroNaTela } from '../../../../src/ui/pecas'
import { SemViagem } from '../../../../src/ui/SemViagem'
import { CabecalhoDaViagem } from '../../../../src/ui/viagem/CabecalhoDaViagem'
import { mola, useReducedMotion } from '../../../../src/ui/movimento'
import { cor, fonte, trabalho } from '../../../../theme'

// Dentro de uma viagem (caminho B "Embarque", mapa aprovado pelo Victor em 10/11/2026):
// sempre as mesmas 5 abas (Viagem · Roteiro · Reservas · Contas · Fotos), com ícone + nome,
// numa barra de vidro que flutua embaixo, e o mesmo cabeçalho em cima (viagem, galera, ajustes).
// Os nomes das abas são os únicos nomes: a aba Viagem resume as outras 4 com os mesmos ícones.
// A viagem do endereço vira a "viagem atual" que as abas leem com useViagemAtual().
export const ABAS_DA_VIAGEM: { nome: string; fim: string; rotulo: string; icone: NomeDoIcone }[] = [
  { nome: 'index', fim: '', rotulo: 'Viagem', icone: 'viagens' },
  { nome: 'roteiro', fim: '/roteiro', rotulo: 'Roteiro', icone: 'roteiro' },
  { nome: 'reservas', fim: '/reservas', rotulo: 'Reservas', icone: 'hospedagem' },
  { nome: 'contas', fim: '/contas', rotulo: 'Contas', icone: 'contas' },
  { nome: 'fotos', fim: '/fotos', rotulo: 'Fotos', icone: 'fotos' },
]

// Altura da barra de vidro + folga: as abas somam isso no "fim da tela" pra nada ficar escondido atrás dela
const ALTURA_DA_BARRA = 58
const FOLGA_DA_BARRA = 12

export default function AbasDaViagem() {
  const insets = useSafeAreaInsets()
  const { id: idDaRota } = useLocalSearchParams<{ id: string }>()
  const { atual, viagens, status, escolher, recarregar } = useViagemAtual()
  // No navegador o id da rota pode sumir ao voltar de outra tela: aí vale a viagem atual
  const id = idDaRota || atual?.id || ''
  const existe = viagens.some((v) => v.id === id)

  useEffect(() => {
    if (id) escolher(id)
  }, [id, escolher])

  // Viagem criada ou aceita agora pode não estar na lista ainda: busca a lista de novo, uma vez
  const listaAoPedir = useRef<typeof viagens | null>(null)
  useEffect(() => {
    if (status === 'pronto' && !existe && !listaAoPedir.current) {
      listaAoPedir.current = viagens
      recarregar()
    }
  }, [status, existe, viagens, recarregar])

  if (status === 'erro') return <ErroNaTela aoTentar={recarregar} />
  if (atual?.id !== id) {
    const jaBuscouDeNovo = listaAoPedir.current && listaAoPedir.current !== viagens
    return jaBuscouDeNovo && !existe ? <SemViagem titulo="Viagem" /> : <Carregando />
  }

  const viagem = viagens.find((v) => v.id === id) ?? atual
  return (
    <View className="flex-1" style={{ backgroundColor: trabalho.fundo }}>
      <CabecalhoDaViagem viagem={viagem} topo={insets.top} />
      {/* As abas não precisam mais da folga de cima (o cabeçalho já cuidou) e ganham folga
          embaixo pra barra de vidro: cada tela continua usando insets como antes */}
      <SafeAreaInsetsContext.Provider value={{ ...insets, top: 0, bottom: Math.max(insets.bottom, FOLGA_DA_BARRA) + ALTURA_DA_BARRA + 8 }}>
        <Tabs screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: trabalho.fundo }, tabBarStyle: { position: 'absolute' } }} tabBar={() => <BarraDeVidro id={id} baixo={insets.bottom} />}>
          {ABAS_DA_VIAGEM.map((a) => (
            <Tabs.Screen key={a.nome} name={a.nome} />
          ))}
        </Tabs>
      </SafeAreaInsetsContext.Provider>
    </View>
  )
}

// Barra de vidro (a do embarque.html): flutua acima do conteúdo, a aba ativa fica em couro.
// Trocar de aba só troca o conteúdo; o ícone da aba ativa sobe um tiquinho com mola.
function BarraDeVidro({ id, baixo }: { id: string; baixo: number }) {
  const router = useRouter()
  const caminho = usePathname()
  const base = `/viagem/${id}`
  // Telas de dentro do Roteiro (ex.: Explorar) continuam acendendo o Roteiro
  const ativa = ABAS_DA_VIAGEM.find((a) => a.fim && caminho.startsWith(base + a.fim))?.nome ?? 'index'
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 10, right: 10, bottom: Math.max(baixo, FOLGA_DA_BARRA) }}
    >
      <View
        accessibilityRole="tablist"
        className="flex-row items-center justify-around rounded-[24px] border"
        style={[
          { height: ALTURA_DA_BARRA, backgroundColor: trabalho.vidro, borderColor: trabalho.linha, boxShadow: '0 10px 30px rgba(74,46,20,0.14)' },
          // No navegador dá pra borrar o que passa atrás (vidro de verdade); no celular fica o creme translúcido
          Platform.OS === 'web' ? ({ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as object) : { backgroundColor: 'rgba(255,253,248,0.95)' },
        ]}
      >
        {ABAS_DA_VIAGEM.map((a) => (
          <ItemDaBarra key={a.nome} rotulo={a.rotulo} icone={a.icone} ativa={ativa === a.nome} aoTocar={() => router.navigate((base + a.fim) as Href)} />
        ))}
      </View>
    </View>
  )
}

function ItemDaBarra({ rotulo, icone, ativa, aoTocar }: { rotulo: string; icone: NomeDoIcone; ativa: boolean; aoTocar: () => void }) {
  const reduzir = useReducedMotion()
  const subida = useSharedValue(ativa ? 1 : 0)
  useEffect(() => {
    subida.value = reduzir ? (ativa ? 1 : 0) : withSpring(ativa ? 1 : 0, mola.entrar)
  }, [ativa, reduzir, subida])
  const estilo = useAnimatedStyle(() => ({ transform: [{ translateY: -subida.value * 1.5 }, { scale: 1 + subida.value * 0.06 }] }))
  const tom = ativa ? cor.couro : trabalho.texto
  return (
    <Pressable
      onPress={() => !ativa && aoTocar()}
      className="min-w-[56px] items-center gap-0.5 rounded-[14px] px-1.5 py-1.5"
      accessibilityRole="tab"
      accessibilityLabel={rotulo}
      accessibilityState={{ selected: ativa }}
      style={{ opacity: ativa ? 1 : 0.72 }}
    >
      <Animated.View style={estilo}>
        <Icone nome={icone} tamanho={22} cor={tom} duo={ativa ? cor.dourado : undefined} />
      </Animated.View>
      <Text style={{ fontFamily: ativa ? fonte.corpoNegrito : fonte.corpoForte, fontSize: 10.5, color: tom }}>{rotulo}</Text>
    </Pressable>
  )
}

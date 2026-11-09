import { useEffect, useRef } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Tabs, useLocalSearchParams, usePathname, useRouter, type Href } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Camera, Luggage, Map, Ticket, Wallet } from '../../../../src/ui/icones'
import { useViagemAtual } from '../../../../src/dados/viagemAtual'
import { Carregando, ErroNaTela } from '../../../../src/ui/pecas'
import { SemViagem } from '../../../../src/ui/SemViagem'
import { cor } from '../../../../theme'

// Dentro de uma viagem (spec 117): Viagem · Roteiro · Reservas · Contas · Fotos.
// Reservas (spec 122d, Victor 08/11): transporte e hospedagem juntos, sempre a um toque.
// A viagem do endereço vira a "viagem atual" que as abas leem com useViagemAtual().
const ABAS = [
  { nome: 'index', fim: '', rotulo: 'Viagem', Icone: Luggage },
  { nome: 'roteiro', fim: '/roteiro', rotulo: 'Roteiro', Icone: Map },
  { nome: 'reservas', fim: '/reservas', rotulo: 'Reservas', Icone: Ticket },
  { nome: 'contas', fim: '/contas', rotulo: 'Contas', Icone: Wallet },
  { nome: 'fotos', fim: '/fotos', rotulo: 'Fotos', Icone: Camera },
] as const

export default function AbasDaViagem() {
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

  return (
    <Tabs screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: cor.fundo } }} tabBar={() => <BarraDaViagem id={id} />}>
      {ABAS.map((a) => (
        <Tabs.Screen key={a.nome} name={a.nome} />
      ))}
    </Tabs>
  )
}

// Barra própria (a do desenho): a aba ativa vem do endereço atual
function BarraDaViagem({ id }: { id: string }) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const caminho = usePathname()
  const base = `/viagem/${id}`
  return (
    <View
      className="flex-row border-t border-linha px-1.5 pt-2"
      style={{ backgroundColor: 'rgba(255,253,248,0.96)', paddingBottom: Math.max(insets.bottom, 12) }}
    >
      {ABAS.map(({ fim, rotulo, Icone }) => {
        const ativa = caminho === base + fim
        return (
          <Pressable
            key={rotulo}
            onPress={() => !ativa && router.navigate((base + fim) as Href)}
            className="flex-1 items-center gap-1 pt-0.5"
            accessibilityRole="tab"
            accessibilityState={{ selected: ativa }}
          >
            <Icone size={24} color={ativa ? cor.couro : cor.apagado} strokeWidth={ativa ? 2 : 1.6} />
            <Text className={`text-[11px] ${ativa ? 'font-body-bold text-couro' : 'font-body-medium text-apagado'}`}>{rotulo}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

import { Tabs, usePathname, useRouter, type Href } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { BriefcaseBusiness, CircleUserRound, Image as ImageIcon, Map, ReceiptText } from 'lucide-react-native'
import { cor } from '../../theme'

// Abas do design: Viagens · Roteiro · Contas · Fotos · Perfil.
// Roteiro, Contas e Fotos mostram a "viagem atual" (escolhida na home).
const ABAS: { rota: Href; caminho: string; rotulo: string; Icone: typeof Map }[] = [
  { rota: '/', caminho: '/', rotulo: 'Viagens', Icone: BriefcaseBusiness },
  { rota: '/roteiro', caminho: '/roteiro', rotulo: 'Roteiro', Icone: Map },
  { rota: '/contas', caminho: '/contas', rotulo: 'Contas', Icone: ReceiptText },
  { rota: '/fotos', caminho: '/fotos', rotulo: 'Fotos', Icone: ImageIcon },
  { rota: '/perfil', caminho: '/perfil', rotulo: 'Perfil', Icone: CircleUserRound },
]

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: cor.fundo } }} tabBar={() => <BarraDeAbas />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="roteiro" />
      <Tabs.Screen name="contas" />
      <Tabs.Screen name="fotos" />
      <Tabs.Screen name="perfil" />
    </Tabs>
  )
}

// Barra própria (a do design): a aba ativa vem do endereço atual da tela
function BarraDeAbas() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const caminho = usePathname()
  return (
    <View
      className="flex-row border-t border-linha px-1.5 pt-2"
      style={{ backgroundColor: 'rgba(255,253,248,0.96)', paddingBottom: Math.max(insets.bottom, 12) }}
    >
      {ABAS.map(({ rota, caminho: c, rotulo, Icone }) => {
        const ativa = caminho === c
        return (
          <Pressable
            key={c}
            onPress={() => !ativa && router.navigate(rota)}
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

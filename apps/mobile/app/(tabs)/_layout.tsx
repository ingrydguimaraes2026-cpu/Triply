import { Tabs } from 'expo-router'
import { Text } from 'react-native'
import { cor } from '../../theme'

// Abas do app. Dinheiro no centro: "Viagem" (home) já abre no resumo de grana;
// "Financeiro" aprofunda; "Comboio" é o grupo.
const icone = (emoji: string) => () => <Text style={{ fontSize: 20 }}>{emoji}</Text>

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cor.couro,
        tabBarInactiveTintColor: '#b9a68a',
        tabBarStyle: { backgroundColor: cor.cartao, borderTopColor: cor.borda },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Viagem', tabBarIcon: icone('🧭') }} />
      <Tabs.Screen name="financeiro" options={{ title: 'Financeiro', tabBarIcon: icone('💶') }} />
      <Tabs.Screen name="comboio" options={{ title: 'Comboio', tabBarIcon: icone('🪿') }} />
    </Tabs>
  )
}

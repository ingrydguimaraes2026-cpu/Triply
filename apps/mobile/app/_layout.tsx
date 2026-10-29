import { Stack } from 'expo-router'
import { SafeAreaProvider } from 'react-native-safe-area-context'

// Raiz da navegação (expo-router): por enquanto só o grupo de abas, sem cabeçalho.
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  )
}

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

/**
 * Moldura geral do app.
 * - (tabs): as 4 abas da barra inferior
 * - (auth): telas de login
 * - viagem/[id]: as telas de uma viagem específica
 */
export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ title: 'Entrar', presentation: 'modal' }} />
        <Stack.Screen name="viagem/[id]" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}

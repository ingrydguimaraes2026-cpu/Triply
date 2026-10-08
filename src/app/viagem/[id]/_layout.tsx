import { Stack } from 'expo-router';

/** Telas de uma viagem. Cada uma ganha um cabeçalho com botão de voltar. */
export default function ViagemLayout() {
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="index" options={{ title: 'Viagem' }} />
      <Stack.Screen name="roteiro" options={{ title: 'Roteiro' }} />
      <Stack.Screen name="orcamento" options={{ title: 'Orçamento' }} />
      <Stack.Screen name="checklists" options={{ title: 'Checklists' }} />
      <Stack.Screen name="calendario" options={{ title: 'Calendário' }} />
      <Stack.Screen name="memorias" options={{ title: 'Memórias' }} />
    </Stack>
  );
}

import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Spacing } from '@/theme/theme';

type ScreenPlaceholderProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

/**
 * Tela provisória: mostra o título e o que a tela vai ter no futuro.
 * Cada módulo substitui este componente quando for implementado.
 */
export function ScreenPlaceholder({ title, description, children }: ScreenPlaceholderProps) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">{title}</ThemedText>
          <ThemedText themeColor="textSecondary">{description}</ThemedText>
          {children}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
});

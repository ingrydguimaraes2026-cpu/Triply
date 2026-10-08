import { Link, type Href } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ui/themed-text';
import { ThemedView } from '@/components/ui/themed-view';
import { Spacing } from '@/theme/theme';

type NavCardProps = {
  href: Href;
  title: string;
  subtitle?: string;
};

/** Cartão que leva para outra tela ao ser tocado. */
export function NavCard({ href, title, subtitle }: NavCardProps) {
  return (
    <Link href={href} asChild>
      <Pressable style={({ pressed }) => pressed && styles.pressed}>
        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="smallBold">{title}</ThemedText>
          {subtitle ? (
            <ThemedText type="small" themeColor="textSecondary">
              {subtitle}
            </ThemedText>
          ) : null}
        </ThemedView>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.7,
  },
});

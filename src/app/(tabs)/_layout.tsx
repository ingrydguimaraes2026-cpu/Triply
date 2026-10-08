import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/theme/theme';

/**
 * Barra de abas inferior. Usa os ícones nativos de cada sistema:
 * `sf` = SF Symbols no iPhone, `md` = Material Symbols no Android.
 */
export default function TabsLayout() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.primary } }}
      iconColor={{ selected: colors.primary }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Início</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="viagens">
        <NativeTabs.Trigger.Label>Viagens</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'airplane', selected: 'airplane' }}
          md="flight"
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="favoritos">
        <NativeTabs.Trigger.Label>Favoritos</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'heart', selected: 'heart.fill' }} md="favorite" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="perfil">
        <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
          md="person"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

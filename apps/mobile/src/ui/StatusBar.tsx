import { useEffect } from 'react'
import { Platform } from 'react-native'
import { StatusBar as StatusBarExpo, type StatusBarProps } from 'expo-status-bar'
import { avisarEstiloDaBarra } from './Moldura'

// Mesmo <StatusBar> do Expo, mas no navegador também pinta a barra 9:41 do iPhone
// desenhado (clara sobre foto/caramelo, escura sobre fundo claro).
export function StatusBar(props: StatusBarProps) {
  useEffect(() => {
    if (Platform.OS === 'web') avisarEstiloDaBarra(props.style === 'light' ? 'clara' : 'escura')
  }, [props.style])
  return <StatusBarExpo {...props} />
}

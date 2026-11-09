import type { ReactNode } from 'react'
import { StyleSheet, View, type ImageSourcePropType, type StyleProp, type ViewStyle } from 'react-native'
import { Image, type ImageProps } from 'expo-image'
import { cssInterop } from 'nativewind'

// Fotos da internet com cache no aparelho (expo-image): não baixa de novo a cada tela
// e aparece com um fade curto. Use no lugar do Image/ImageBackground do React Native.

cssInterop(Image, { className: 'style' })

export function Foto(props: ImageProps & { className?: string }) {
  return <Image cachePolicy="memory-disk" transition={150} contentFit="cover" {...props} />
}

// Igual ao ImageBackground: a foto preenche e os filhos ficam por cima
export function FotoDeFundo({ source, style, children }: { source?: ImageProps['source'] | ImageSourcePropType; style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  return (
    <View style={style}>
      <Image source={source as ImageProps['source']} style={StyleSheet.absoluteFill} cachePolicy="memory-disk" transition={150} contentFit="cover" />
      {children}
    </View>
  )
}

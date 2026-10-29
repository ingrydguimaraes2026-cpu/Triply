import type { ReactNode } from 'react'
import { Platform, View } from 'react-native'

// Só no navegador: centraliza o app numa coluna de largura de celular, pra não esticar
// (parecia formulário web). No celular de verdade, passa direto.
export function Moldura({ children }: { children: ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>
  return (
    <View className="flex-1 items-center" style={{ backgroundColor: '#e7d8bd' }}>
      <View
        className="h-full w-full max-w-[440px] flex-1 overflow-hidden bg-fundo"
        style={{ boxShadow: '0 20px 60px rgba(59,39,21,0.25)' } as object}
      >
        {children}
      </View>
    </View>
  )
}

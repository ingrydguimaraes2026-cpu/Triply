import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { Platform, Text, View, useWindowDimensions } from 'react-native'
import { SafeAreaInsetsContext } from 'react-native-safe-area-context'
import Svg, { Path, Rect } from 'react-native-svg'

// Só no navegador: mostra o app dentro de um iPhone 15 desenhado (igual ao Claude Design:
// 393×852, cantos de 52px, borda preta, Dynamic Island, barra 9:41 e risquinho de baixo).
// No celular de verdade, passa direto.
const LARGURA = 393
const ALTURA = 852
const BORDA = 10
// Áreas "seguras" do iPhone: a barra de status em cima e o risquinho embaixo
const INSETS = { top: 54, bottom: 34, left: 0, right: 0 }

// Tamanho da tela do app (no web = a tela do iPhone desenhado, não a janela)
const TamanhoCtx = createContext<{ width: number; height: number } | null>(null)
export function useTamanhoDaTela() {
  const janela = useWindowDimensions()
  return useContext(TamanhoCtx) ?? janela
}

// Cor da barra 9:41: cada tela avisa pelo nosso <StatusBar> (src/ui/StatusBar.tsx)
type Estilo = 'clara' | 'escura'
const ouvintes = new Set<(e: Estilo) => void>()
let ultimoEstilo: Estilo = 'escura'
export function avisarEstiloDaBarra(e: Estilo) {
  ultimoEstilo = e
  ouvintes.forEach((f) => f(e))
}

export function Moldura({ children }: { children: ReactNode }) {
  const janela = useWindowDimensions()
  const [estilo, setEstilo] = useState<Estilo>(ultimoEstilo)
  useEffect(() => {
    ouvintes.add(setEstilo)
    return () => {
      ouvintes.delete(setEstilo)
    }
  }, [])
  if (Platform.OS !== 'web') return <>{children}</>

  // Janela pequena (ex.: abrindo no celular pelo navegador): sem moldura, ocupa tudo
  if (janela.width < 500) return <>{children}</>

  // Encolhe o iPhone se a janela for mais baixa que ele
  const escala = Math.min(1, (janela.height - 48) / (ALTURA + BORDA * 2))

  return (
    <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#EFE5D4' }}>
      <View
        style={{
          width: LARGURA,
          height: ALTURA,
          borderRadius: 52,
          overflow: 'hidden',
          backgroundColor: '#FBF3E6',
          transform: [{ scale: escala }],
          boxShadow: `0 0 0 ${BORDA}px #1E140B, 0 30px 60px rgba(74,46,20,0.28)`,
        }}
      >
        <TamanhoCtx.Provider value={{ width: LARGURA, height: ALTURA }}>
          <SafeAreaInsetsContext.Provider value={INSETS}>{children}</SafeAreaInsetsContext.Provider>
        </TamanhoCtx.Provider>
        <BarraDeStatus cor={estilo === 'clara' ? '#fff' : '#3B2715'} />
        {/* Dynamic Island */}
        <View pointerEvents="none" style={{ position: 'absolute', top: 11, left: LARGURA / 2 - 62, width: 124, height: 36, borderRadius: 20, backgroundColor: '#000' }} />
        {/* risquinho de voltar pra home */}
        <View
          pointerEvents="none"
          style={{ position: 'absolute', bottom: 8, left: LARGURA / 2 - 67, width: 134, height: 5, borderRadius: 3, backgroundColor: estilo === 'clara' ? '#FBF3E6' : '#3B2715' }}
        />
      </View>
    </View>
  )
}

// 9:41, sinal, wi-fi e bateria
function BarraDeStatus({ cor }: { cor: string }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 44,
        paddingRight: 30,

      } as object}
    >
      <Text style={{ color: cor, fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16 }}>9:41</Text>
      <Svg width={70} height={13} viewBox="0 0 70 13" fill={cor}>
        <Rect x={0} y={8} width={3} height={4} rx={1} />
        <Rect x={5} y={5.5} width={3} height={6.5} rx={1} />
        <Rect x={10} y={3} width={3} height={9} rx={1} />
        <Rect x={15} y={0.5} width={3} height={11.5} rx={1} />
        <Path d="M29.5 3.4a9 9 0 0 1 12 0l-1.4 1.5a7 7 0 0 0-9.2 0Zm2.4 2.6a5.5 5.5 0 0 1 7.2 0l-1.4 1.5a3.5 3.5 0 0 0-4.4 0Zm2.4 2.6a2 2 0 0 1 2.4 0L35.5 10Z" />
        <Rect x={46.5} y={0.5} width={21} height={11} rx={3.5} fill="none" stroke={cor} opacity={0.4} />
        <Rect x={48.5} y={2.5} width={16} height={7} rx={2} />
        <Path d="M69 4.5v3a1.6 1.6 0 0 0 0-3Z" opacity={0.4} />
      </Svg>
    </View>
  )
}

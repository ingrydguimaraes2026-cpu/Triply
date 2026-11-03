import { memo, useMemo, type ComponentType } from 'react'
import { Platform, type StyleProp, type ViewStyle } from 'react-native'
import { SvgXml } from 'react-native-svg'
import { svgDoIcone, svgDoSelo, type NomeDoIcone, type NomeDoSelo } from '@together/core'
import { cor as paleta } from '../../theme'

// Ícones do Tripwave (docs/design/ICONES.md). Ex.: <Icone nome="lugar" tamanho={20} cor={cor.couro} />
// `cheio`: versão preenchida (coração curtido, estrela). `duo`: troca a cor da camada de fundo.
export type PropsDoIcone = {
  tamanho?: number
  cor?: string
  duo?: string
  cheio?: boolean
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
  // Mesmos nomes do pacote antigo, pra a troca não quebrar nenhuma tela
  size?: number
  color?: string
  fill?: string
  strokeWidth?: number
}

function desenhar(nome: NomeDoIcone, p: PropsDoIcone) {
  const tamanho = p.tamanho ?? p.size ?? 24
  const corDoTraco = p.cor ?? p.color ?? paleta.texto
  // fill antigo: "none"/"transparent" = vazio; uma cor = cheio naquela cor
  const cheio = p.cheio ?? (!!p.fill && p.fill !== 'none' && p.fill !== 'transparent')
  const xml = useMemo(
    () => svgDoIcone(nome, { cor: cheio && p.fill ? p.fill : corDoTraco, duo: p.duo, cheio }),
    [nome, corDoTraco, p.duo, p.fill, cheio],
  )
  return (
    <SvgXml
      xml={xml}
      width={tamanho}
      height={tamanho}
      style={p.style}
      {...rotulo(p.accessibilityLabel)}
    />
  )
}

// No web o SVG vai direto pro navegador: `accessible` vira atributo inválido (aviso vermelho no modo dev)
function rotulo(texto?: string): object {
  if (!texto) return {}
  return Platform.OS === 'web' ? { role: 'img', 'aria-label': texto } : { accessible: true, accessibilityLabel: texto }
}

export const Icone = memo(function Icone({ nome, ...p }: PropsDoIcone & { nome: NomeDoIcone }) {
  return desenhar(nome, p)
})

// Componente com nome fixo (usado pelos apelidos em ./icones)
export type ComponenteDeIcone = ComponentType<PropsDoIcone>
export function criarIcone(nome: NomeDoIcone): ComponenteDeIcone {
  const C = memo((p: PropsDoIcone) => desenhar(nome, p))
  C.displayName = `Icone(${nome})`
  return C
}

// Selo: ilustração nossa (onboarding, passos, categorias). `tom="escuro"` em cima de fundo marrom.
export const Selo = memo(function Selo({ nome, tamanho = 36, tom = 'claro' }: { nome: NomeDoSelo; tamanho?: number; tom?: 'claro' | 'escuro' }) {
  const xml = useMemo(() => svgDoSelo(nome, tom), [nome, tom])
  return <SvgXml xml={xml} width={tamanho} height={tamanho} />
})
export type { NomeDoIcone, NomeDoSelo }

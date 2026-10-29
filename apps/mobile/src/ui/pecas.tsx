import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, Text, TextInput, View, type TextInputProps } from 'react-native'
import { coresDePessoa, cor, sombra } from '../../theme'
import { iniciais } from '../lib/formato'
import { Malinha } from './Malinha'

// Peças visuais do redesign (folha de componentes "1n" do design). Reaproveite antes de criar outra.

type BotaoProps = {
  titulo: string
  aoTocar?: () => void
  icone?: ReactNode
  tipo?: 'primario' | 'secundario' | 'claro'
  desabilitado?: boolean
  carregando?: boolean
  compacto?: boolean
}

export function Botao({ titulo, aoTocar, icone, tipo = 'primario', desabilitado, carregando, compacto }: BotaoProps) {
  const apagado = desabilitado || carregando
  const fundo = apagado ? 'bg-borda' : tipo === 'primario' ? 'bg-couro' : tipo === 'claro' ? 'bg-fundo' : 'bg-cartao border border-tracejado'
  const texto = apagado ? 'text-[#9A8268]' : tipo === 'primario' ? 'text-white' : tipo === 'claro' ? 'text-escuro' : 'text-couro'
  return (
    <Pressable
      onPress={aoTocar}
      disabled={apagado}
      className={`flex-row items-center justify-center gap-2 ${compacto ? 'h-11 rounded-[14px] px-4' : 'h-14 rounded-2xl'} ${fundo} active:opacity-90`}
      style={tipo === 'primario' && !apagado ? sombra.botao : undefined}
    >
      {carregando ? <ActivityIndicator color={cor.couro} /> : icone}
      <Text className={`font-body-bold ${compacto ? 'text-[14px]' : 'text-[16px]'} ${texto}`}>{titulo}</Text>
    </Pressable>
  )
}

// Botão redondo de 44px (voltar, compartilhar, mais...)
export function BotaoRedondo({ children, aoTocar, claro }: { children: ReactNode; aoTocar?: () => void; claro?: boolean }) {
  return (
    <Pressable
      onPress={aoTocar}
      className={`h-11 w-11 items-center justify-center rounded-full ${claro ? 'bg-fundo/90' : 'bg-cartao'} active:opacity-80`}
      style={claro ? undefined : { boxShadow: '0 4px 12px rgba(74,46,20,0.08)' }}
    >
      {children}
    </Pressable>
  )
}

export function Cartao({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <View className={`rounded-2xl bg-cartao ${className}`} style={sombra.cartao}>
      {children}
    </View>
  )
}

// Quadradinho bege com ícone (atalhos, itens de lista)
export function IconeQuadrado({ children, tamanho = 40 }: { children: ReactNode; tamanho?: number }) {
  return (
    <View className="items-center justify-center bg-chip" style={{ width: tamanho, height: tamanho, borderRadius: tamanho * 0.3 }}>
      {children}
    </View>
  )
}

export function Avatar({ nome, indice, tamanho = 32, borda }: { nome: string; indice: number; tamanho?: number; borda?: string }) {
  return (
    <View
      className="items-center justify-center rounded-full"
      style={{
        width: tamanho,
        height: tamanho,
        backgroundColor: coresDePessoa[indice % coresDePessoa.length],
        borderWidth: borda ? 2 : 0,
        borderColor: borda,
      }}
    >
      <Text className="font-body-bold text-white" style={{ fontSize: tamanho * 0.34 }}>
        {iniciais(nome)}
      </Text>
    </View>
  )
}

// Bolinhas sobrepostas do comboio
export function PilhaDeAvatares({ nomes, tamanho = 32, borda = cor.fundo, max = 6 }: { nomes: string[]; tamanho?: number; borda?: string; max?: number }) {
  return (
    <View className="flex-row" style={{ paddingLeft: 10 }}>
      {nomes.slice(0, max).map((n, i) => (
        <View key={i} style={{ marginLeft: -10 }}>
          <Avatar nome={n} indice={i} tamanho={tamanho} borda={borda} />
        </View>
      ))}
    </View>
  )
}

// Campo de texto com ícone; fica com borda couro quando focado
export function Campo({ icone, direita, ...props }: TextInputProps & { icone?: ReactNode; direita?: ReactNode }) {
  return (
    <View className="h-[52px] flex-row items-center gap-2.5 rounded-2xl border border-borda bg-cartao px-4">
      {icone}
      <TextInput placeholderTextColor={cor.suave} className="flex-1 font-body text-[15px] text-texto" style={{ outlineStyle: 'none' } as object} {...props} />
      {direita}
    </View>
  )
}

// Título grande de tela ("Minhas viagens", "Contas"...) com linha de cima opcional
export function TituloDaTela({ acima, titulo, direita }: { acima?: string; titulo: string; direita?: ReactNode }) {
  return (
    <View className="flex-row items-end justify-between">
      <View className="flex-1">
        {acima ? <Text className="font-body-medium text-[14px] text-suave">{acima}</Text> : null}
        <Text className="font-display text-[32px] leading-[36px] text-texto">{titulo}</Text>
      </View>
      {direita}
    </View>
  )
}

export function RotuloDeSecao({ children }: { children: ReactNode }) {
  return <Text className="mb-2.5 mt-1 font-body-bold text-[12px] uppercase tracking-widest text-suave">{children}</Text>
}

// Tela de "carregando" com a Malinha pensando
export function Carregando({ texto = 'Carregando…' }: { texto?: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-fundo">
      <Malinha humor="pensando" tamanho={96} />
      <Text className="font-body-medium text-[14px] text-suave">{texto}</Text>
    </View>
  )
}

// Erro amigável com botão de tentar de novo
export function ErroNaTela({ aoTentar }: { aoTentar: () => void }) {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-fundo px-8">
      <Malinha humor="pensando" tamanho={96} />
      <Text className="text-center font-display text-[22px] text-texto">Não deu pra carregar</Text>
      <Text className="text-center font-body text-[14px] text-corpo">Confira a internet e tente de novo.</Text>
      <View className="mt-2 self-stretch">
        <Botao titulo="Tentar de novo" aoTocar={aoTentar} tipo="secundario" />
      </View>
    </View>
  )
}

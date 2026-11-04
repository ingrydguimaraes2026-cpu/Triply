import type { ReactNode } from 'react'
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { CONGELADO, formatarDinheiro } from '@together/core'
import { Camera, CheckCheck, ChevronRight, FileText, Lock, Printer, Sparkles, TriangleAlert } from '../icones'
import { Passaporte } from './Passaporte'
import { Secao } from './Secoes'
import type { Passo } from '../PassosDaViagem'
import { useNumeroAnimado } from '../movimento'
import { cor, sombra } from '../../../theme'

// Lembranças (spec 117, tela 9): a aba Viagem depois da última data.
// Junta a retrospectiva e o PDF: números da viagem, passaporte, contas e o que dá pra guardar.
type Props = {
  viagem: { id: string; nome: string; moeda: string }
  foto: { uri: string } | undefined
  numeros: { dias: number; fotos: number; lugares: number; gasto: number }
  passos: Passo[]
  contasEmDia: boolean
  ir: (rota: string) => void
  aoExtra: (origem: 'livro_impresso' | 'video') => void
}

export function Lembrancas({ viagem, foto, numeros, passos, contasEmDia, ir, aoExtra }: Props) {
  return (
    <View>
      <View className="h-[330px] overflow-hidden bg-couro">
        <ImageBackground source={foto} resizeMode="cover" style={StyleSheet.absoluteFill}>
          <LinearGradient colors={['rgba(74,46,20,0.2)', 'rgba(74,46,20,0)', 'rgba(74,46,20,0.9)']} locations={[0, 0.35, 1]} style={StyleSheet.absoluteFill} />
        </ImageBackground>
        <View className="absolute bottom-[58px] left-5 right-5">
          <Text className="font-body-bold text-[12px] uppercase tracking-widest text-creme">Vocês voltaram</Text>
          <Text className="mt-1 font-display text-[34px] leading-[38px] text-white">{viagem.nome}, do jeito do comboio</Text>
        </View>
      </View>

      <View className="-mt-9 gap-6 px-5">
        <Secao indice={0}>
          <View className="flex-row rounded-2xl bg-cartao py-3.5" style={sombra.cartao}>
            <Numero valor={numeros.dias} rotulo="dias" />
            <Numero valor={numeros.fotos} rotulo="fotos" />
            <Numero valor={numeros.lugares} rotulo="lugares" />
            <Numero valor={numeros.gasto} rotulo="no total" dinheiro={viagem.moeda} />
          </View>
        </Secao>

        <Secao indice={1}>
          <Passaporte viagemId={viagem.id} passos={passos} />
        </Secao>

        <Secao indice={2}>
          <Pressable onPress={() => ir('contas')} className={`flex-row items-center justify-center gap-2 rounded-full py-2.5 active:opacity-80 ${contasEmDia ? 'bg-verde-fundo' : 'bg-vermelho-fundo'}`}>
            {contasEmDia ? <CheckCheck size={16} color={cor.verde} /> : <TriangleAlert size={16} color={cor.vermelho} />}
            <Text className={`font-body-bold text-[13px] ${contasEmDia ? 'text-verde' : 'text-vermelho'}`}>{contasEmDia ? 'Contas em dia, ninguém deve ninguém' : 'Ainda tem conta pra acertar'}</Text>
          </Pressable>
        </Secao>

        <Secao indice={3} titulo="Pra guardar">
          <View className="rounded-2xl bg-cartao px-4" style={sombra.cartao}>
            <Linha Icone={Sparkles} titulo="Retrospectiva" sub="A viagem em cartões pro story" aoTocar={() => ir('retrospectiva')} />
            <Linha Icone={FileText} titulo="Livro da viagem em PDF" sub="Roteiro, fotos e contas" aoTocar={() => ir('pdf-da-viagem')} borda />
            {/* Extras do Passe. Congelado pelo RUMO (03/11/2026) */}
            {CONGELADO.passe ? null : (
              <>
                <Linha Icone={Printer} titulo="Livro impresso do comboio" sub="As fotos e o roteiro, em casa" aoTocar={() => aoExtra('livro_impresso')} borda trancado />
                <Linha Icone={Camera} titulo="Vídeo da viagem" sub="Um minuto com o melhor de tudo" aoTocar={() => aoExtra('video')} borda trancado />
              </>
            )}
          </View>
        </Secao>
      </View>
    </View>
  )
}

function Numero({ valor, rotulo, dinheiro }: { valor: number; rotulo: string; dinheiro?: string }) {
  const v = Math.round(useNumeroAnimado(valor, 900))
  return (
    <View className="flex-1 items-center">
      <Text className="font-display text-[20px] text-texto" numberOfLines={1} adjustsFontSizeToFit>
        {dinheiro ? formatarDinheiro(v, dinheiro).replace(/,\d\d$/, '') : v}
      </Text>
      <Text className="font-body text-[11px] text-suave">{rotulo}</Text>
    </View>
  )
}

function Linha({ Icone, titulo, sub, aoTocar, borda, trancado }: { Icone: typeof Sparkles; titulo: string; sub: string; aoTocar: () => void; borda?: boolean; trancado?: boolean }): ReactNode {
  return (
    <Pressable onPress={aoTocar} className={`min-h-[62px] flex-row items-center gap-3 py-2 active:opacity-80 ${borda ? 'border-t border-linha' : ''}`}>
      <Icone size={22} color={cor.couro} />
      <View className="flex-1">
        <Text className="font-body-bold text-[15px] text-texto">{titulo}</Text>
        <Text className="font-body text-[12px] text-suave">{sub}</Text>
      </View>
      {trancado ? <Lock size={16} color={cor.caramelo} accessibilityLabel="Extra do Passe da viagem" /> : <ChevronRight size={18} color={cor.apagado} />}
    </Pressable>
  )
}

import { Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter, type Href } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from '../src/ui/StatusBar'
import { ArrowLeft, BedDouble, Car, ChevronRight, Compass, FileCheck, FileText, Lock, Mail, Map, MapPin, ReceiptText, Settings, Sparkles, Sun, Users } from '../src/ui/icones'
import { CONGELADO } from '@together/core'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { Avisos } from '../src/ui/Avisos'
import { Novidades } from '../src/ui/Novidades'
import { Tarefas } from '../src/ui/Tarefas'
import { Enquetes } from '../src/ui/Enquetes'
import { PontoDeEncontro } from '../src/ui/PontoDeEncontro'
import { AgendaDeHoje } from '../src/ui/AgendaDeHoje'
import { Clima } from '../src/ui/Clima'
import { GuiaDaCasa } from '../src/ui/GuiaDaCasa'
import { Cofre } from '../src/ui/Cofre'
import { BotaoRedondo, IconeQuadrado, RotuloDeSecao, TituloDaTela } from '../src/ui/pecas'
import { SemViagem } from '../src/ui/SemViagem'
import { cor, sombra } from '../theme'

// "Tudo da viagem" (spec 117): o que saiu da tela principal continua aqui, a 2 toques
// (botão "..." da capa). Nada foi apagado: atalhos de antes + recados, tarefas e enquetes.
export default function TudoDaViagem() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { atual: viagem, meuId } = useViagemAtual()
  if (!viagem) return <SemViagem titulo="Tudo da viagem" />
  const euSouAdm = viagem.membros.some((m) => m.id === meuId && m.papel === 'adm')

  const atalhos = [
    { Icone: Compass, t: 'Explorar', s: 'Deslize e monte o roteiro', rota: '/explorar' },
    { Icone: Sun, t: 'Hoje', s: 'Agora e próximo', rota: '/hoje' },
    { Icone: MapPin, t: 'Lugares', s: 'Ideias salvas', rota: '/lugares' },
    { Icone: BedDouble, t: 'Hospedagem', s: 'Opções e votos', rota: '/hospedagem' },
    { Icone: Car, t: 'Passagens', s: 'O que falta decidir e comprar', rota: '/transportes' },
    { Icone: Users, t: 'Comboio', s: 'Quem vai e papéis', rota: '/comboio' },
    // ❄ congelado pelo RUMO (03/11/2026): documentos de entrada
    ...(CONGELADO.documentos ? [] : [{ Icone: FileCheck, t: 'Documentos', s: 'Visto e passaporte', rota: '/documentos' }]),
    { Icone: Sparkles, t: 'Retrospectiva', s: 'A viagem em números', rota: '/retrospectiva' },
    { Icone: FileText, t: 'PDF', s: 'Roteiro e livro', rota: '/pdf-da-viagem' },
    ...(euSouAdm ? [{ Icone: Settings, t: 'Configurações', s: 'Nome, datas, moeda', rota: '/configuracoes' }] : []),
  ]

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: insets.bottom + 40, gap: 16 }}>
        <View className="flex-row">
          <BotaoRedondo aoTocar={() => (router.canGoBack() ? router.back() : router.replace(`/viagem/${viagem.id}` as Href))}>
            <ArrowLeft size={20} color={cor.texto} />
          </BotaoRedondo>
        </View>
        <TituloDaTela acima={viagem.nome} titulo="Tudo da viagem" />

        <View className="rounded-2xl bg-cartao px-4" style={sombra.cartao}>
          {atalhos.map(({ Icone, t, s, rota }, i) => (
            <Pressable key={t} onPress={() => router.push(rota as Href)} className={`min-h-[60px] flex-row items-center gap-3 py-2 active:opacity-80 ${i ? 'border-t border-linha' : ''}`}>
              <IconeQuadrado tamanho={36}>
                <Icone size={20} color={cor.couro} />
              </IconeQuadrado>
              <View className="flex-1">
                <Text className="font-body-bold text-[15px] text-texto">{t}</Text>
                <Text className="font-body text-[12px] text-suave">{s}</Text>
              </View>
              <ChevronRight size={18} color={cor.apagado} />
            </Pressable>
          ))}
        </View>

        {/* Spec 117: extras do Passe da viagem (cadeado abre a tela do Passe). ❄ congelado pelo RUMO (03/11/2026) */}
        {CONGELADO.passe ? null : (
          <>
            <RotuloDeSecao>Extras do Passe</RotuloDeSecao>
            <View className="rounded-2xl bg-cartao px-4" style={sombra.cartao}>
              {[
                { Icone: ReceiptText, t: 'Scan de recibo', s: 'Foto do recibo e já divide', de: 'scan_recibo' },
                { Icone: Map, t: 'Mapa sem internet', s: 'Roteiro e mapa offline', de: 'mapa_offline' },
                { Icone: Mail, t: 'Reservas do e-mail', s: 'Voos e hotéis lidos sozinhos', de: 'reservas_email' },
              ].map(({ Icone, t, s, de }, i) => (
                <Pressable key={de} onPress={() => router.push(`/passe?de=${de}` as Href)} className={`min-h-[60px] flex-row items-center gap-3 py-2 active:opacity-80 ${i ? 'border-t border-linha' : ''}`}>
                  <IconeQuadrado tamanho={36}>
                    <Icone size={20} color={cor.couro} />
                  </IconeQuadrado>
                  <View className="flex-1">
                    <Text className="font-body-bold text-[15px] text-texto">{t}</Text>
                    <Text className="font-body text-[12px] text-suave">{s}</Text>
                  </View>
                  <Lock size={16} color={cor.caramelo} />
                </Pressable>
              ))}
            </View>
          </>
        )}

        <RotuloDeSecao>Do comboio</RotuloDeSecao>
        {/* Spec 019, 031, 020, 021 e roadmap #7 */}
        <Avisos viagemId={viagem.id} euSouAdm={euSouAdm} />
        {/* ❄ congelado pelo RUMO (03/11/2026): central de novidades */}
        {CONGELADO.notificacoes ? null : <Novidades viagemId={viagem.id} meuId={meuId} membros={viagem.membros} />}
        <Tarefas viagemId={viagem.id} membros={viagem.membros} meuId={meuId} euSouAdm={euSouAdm} />
        <Enquetes viagemId={viagem.id} meuId={meuId} euSouAdm={euSouAdm} />
        <PontoDeEncontro viagemId={viagem.id} meuId={meuId} euSouAdm={euSouAdm} />
        {/* Spec 029, 022, 026 e 028 */}
        <AgendaDeHoje viagemId={viagem.id} inicio={viagem.dataInicio} fim={viagem.dataFim} />
        <Clima viagemId={viagem.id} />
        {/* ❄ congelado pelo RUMO (03/11/2026): guia da casa */}
        {CONGELADO.guiaDaCasa ? null : <GuiaDaCasa viagemId={viagem.id} />}
        <Cofre viagemId={viagem.id} />
      </ScrollView>
    </View>
  )
}

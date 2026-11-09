import { useEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { formatarDinheiro } from '@together/core'
import { StatusBar } from '../src/ui/StatusBar'
import { BookOpen, Camera, Clock, Crown, Mail, Map, Printer, ReceiptText, X } from '../src/ui/icones'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { supabase } from '../src/lib/supabase'
import { Avatar, BotaoRedondo } from '../src/ui/pecas'
import { tum } from '../src/ui/movimento'
import { cor, sombra } from '../theme'

// Passe da viagem (spec 117, tela 8): "um paga, o comboio todo ganha".
// Abre quando a pessoa toca num extra com cadeado. AINDA NÃO COBRA (a compra é a spec 118):
// o botão mostra "Em breve" e grava o interesse em `interesse_no_passe`, pra medir.
export type OrigemDoPasse = 'scan_recibo' | 'mapa_offline' | 'reservas_email' | 'livro_pdf' | 'livro_impresso' | 'video' | 'album' | 'outro'
const ORIGENS: OrigemDoPasse[] = ['scan_recibo', 'mapa_offline', 'reservas_email', 'livro_pdf', 'livro_impresso', 'video', 'album', 'outro']

const PRECO_DO_PASSE = 3990 // centavos, uma vez por viagem
const PRECO_DO_ANUAL = 9990

const EXTRAS = [
  { Icone: ReceiptText, texto: 'Leitura de recibo: foto e já divide' },
  { Icone: Map, texto: 'Mapa e roteiro sem internet' },
  { Icone: Mail, texto: 'Reservas lidas do e-mail' },
  { Icone: Camera, texto: 'Álbum sem limite e vídeo da viagem' },
  { Icone: Printer, texto: 'Livro impresso do comboio' },
]

export default function Passe() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { de } = useLocalSearchParams<{ de?: string }>()
  const origem: OrigemDoPasse = ORIGENS.includes(de as OrigemDoPasse) ? (de as OrigemDoPasse) : 'outro'
  const { atual: viagem } = useViagemAtual()
  const [plano, setPlano] = useState<'passe' | 'anual'>('passe')
  const [quis, setQuis] = useState(false)

  // Abriu a tela: conta como "viu" (uma vez por abertura; a trava evita contar 2 vezes no modo dev)
  const contado = useRef('')
  useEffect(() => {
    if (!viagem || contado.current === viagem.id + origem) return
    contado.current = viagem.id + origem
    void registrar(viagem.id, origem, 'viu')
  }, [viagem?.id, origem])

  if (!viagem) return null
  const pessoas = Math.max(1, viagem.membros.length)
  const fechar = () => (router.canGoBack() ? router.back() : router.replace(`/viagem/${viagem.id}`))

  function liberar() {
    tum()
    setQuis(true)
    void registrar(viagem!.id, origem, 'quis')
  }

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: insets.bottom + 32, gap: 16 }}>
        <View className="flex-row justify-end">
          <BotaoRedondo aoTocar={fechar}>
            <X size={20} color={cor.texto} />
          </BotaoRedondo>
        </View>

        {/* O comboio todo, de coroa: todo mundo ganha */}
        <View className="flex-row justify-center gap-1.5">
          {viagem.membros.slice(0, 6).map((m, i) => (
            <View key={m.id} className="items-center">
              <Crown size={16} color={cor.dourado} fill={cor.dourado} />
              <Avatar nome={m.nome} indice={i} tamanho={42} borda={cor.dourado} />
            </View>
          ))}
        </View>
        <Text className="text-center font-display text-[30px] leading-[34px] text-texto">Um paga, o comboio todo ganha</Text>

        <View className="gap-3">
          {EXTRAS.map(({ Icone, texto }) => (
            <View key={texto} className="flex-row items-center gap-3">
              <Icone size={20} color={cor.caramelo} />
              <Text className="flex-1 font-body-medium text-[14px] text-texto">{texto}</Text>
            </View>
          ))}
        </View>

        <Plano
          ativo={plano === 'passe'}
          titulo={`Passe ${viagem.nome}`}
          preco={formatarDinheiro(PRECO_DO_PASSE, 'BRL')}
          sub={`uma vez · ${formatarDinheiro(Math.round(PRECO_DO_PASSE / pessoas), 'BRL')} por pessoa no Pix`}
          aoTocar={() => setPlano('passe')}
        />
        <Plano ativo={plano === 'anual'} titulo="Norti+ anual" preco={formatarDinheiro(PRECO_DO_ANUAL, 'BRL')} sub="todas as viagens · 7 dias grátis" aoTocar={() => setPlano('anual')} />

        {quis ? (
          <View className="items-center gap-1 rounded-2xl bg-areia px-4 py-4">
            <View className="flex-row items-center gap-1.5">
              <Clock size={16} color={cor.couro} />
              <Text className="font-body-bold text-[15px] text-texto">Em breve</Text>
            </View>
            <Text className="text-center font-body text-[13px] text-corpo">O Passe ainda não está à venda. Guardamos seu interesse e avisamos quando abrir.</Text>
          </View>
        ) : (
          <Pressable onPress={liberar} className="h-14 items-center justify-center rounded-2xl bg-couro active:opacity-90" style={sombra.botao}>
            <Text className="font-body-bold text-[16px] text-white">Liberar e dividir no comboio</Text>
          </Pressable>
        )}

        <View className="flex-row items-center justify-center gap-1.5">
          <BookOpen size={14} color={cor.suave} />
          <Text className="text-center font-body text-[12px] text-suave">Gastos, divisão, votos, fotos e match seguem grátis.</Text>
        </View>
      </ScrollView>
    </View>
  )
}

function Plano({ ativo, titulo, preco, sub, aoTocar }: { ativo: boolean; titulo: string; preco: string; sub: string; aoTocar: () => void }) {
  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="radio"
      accessibilityState={{ checked: ativo }}
      className={`flex-row items-center justify-between rounded-2xl border-[1.5px] bg-cartao p-4 active:opacity-90 ${ativo ? 'border-caramelo' : 'border-borda'}`}
    >
      <View className="flex-1">
        <Text className="font-body-bold text-[15px] text-texto">{titulo}</Text>
        <Text className="mt-0.5 font-body text-[12px] text-suave">{sub}</Text>
      </View>
      <Text className="font-display text-[20px] text-texto">{preco}</Text>
    </Pressable>
  )
}

// Sem a tabela no banco (ou sem internet), só não grava: a tela segue igual
async function registrar(viagemId: string, origem: OrigemDoPasse, acao: 'viu' | 'quis') {
  const { error } = await supabase.from('interesse_no_passe').insert({ viagem_id: viagemId, origem, acao })
  if (error) console.warn('Interesse no Passe não gravado:', error.message)
}

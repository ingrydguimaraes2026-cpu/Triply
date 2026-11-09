import { useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import {
  TIPOS_DE_RESERVA,
  buscarDestinos,
  destinosDaReserva,
  tipoProvavel,
  dataDoCampo,
  dataParaCampo,
  ligacaoNoCofre,
  lerReserva,
  normalizarRascunho,
  oQueFalta,
  ondeVaiAReserva,
  paraBase64,
  rascunhoVazio,
  salvarReserva,
  type RascunhoDeReserva,
  type TipoDoTrajeto,
} from '@together/core'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { useCarregar } from '../src/dados/useCarregar'
import { useSessao } from '../src/lib/sessao'
import { guardarNoCofre } from '../src/lib/cofre'
import { hojeIso } from '../src/lib/formato'
import { supabase } from '../src/lib/supabase'
import { FileText, Image as IconeImagem, ScrollText, X } from '../src/ui/icones'
import { StatusBar } from '../src/ui/StatusBar'
import { Botao, BotaoRedondo, Campo } from '../src/ui/pecas'
import { cor } from '../theme'

// Adicionar reserva (spec 120b): print, PDF ou texto colado → "lendo..." → rascunho pra conferir → confirmar.
// O rascunho vira trajeto, casa ou item da agenda, e o arquivo vai pro cofre amarrado nele.
type Arquivo = { bytes: Uint8Array; tipo: string; nome: string }
type Etapa = 'escolher' | 'colar' | 'lendo' | 'conferir'

// Spec 121a: transporte é a chegada/saída da pessoa (ela mesma lança) ou um trecho do grupo (ADM)
const TIPOS_DO_TRAJETO: { tipo: TipoDoTrajeto; titulo: string }[] = [
  { tipo: 'chegada', titulo: 'Minha chegada' },
  { tipo: 'saida', titulo: 'Minha volta' },
  { tipo: 'trecho', titulo: 'Trecho do grupo' },
]

const ONDE_VAI = { trajeto: 'Vai pros transportes e pro "Hoje" de quem chega.', hospedagem: 'Vai pra Hospedagem e pro "Onde dormimos".', agenda: 'Vai pra agenda do dia.' }

export default function NovaReserva() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { ehConvidado } = useSessao()
  const { atual: viagem, meuId } = useViagemAtual()
  // ?como=chegada|saida: veio do "Adicionar meu transporte"; ?voltar=transportes: volta pra lá ao salvar
  const params = useLocalSearchParams<{ como?: string; voltar?: string }>()
  const [tipoTrajeto, setTipoTrajeto] = useState<TipoDoTrajeto | null>(params.como === 'chegada' || params.como === 'saida' ? params.como : null)
  const destinos = useCarregar(viagem ? () => buscarDestinos(supabase, viagem.id) : null, [viagem?.id])
  const [etapa, setEtapa] = useState<Etapa>('escolher')
  const [texto, setTexto] = useState('')
  const [arquivo, setArquivo] = useState<Arquivo | null>(null)
  const [r, setR] = useState<RascunhoDeReserva>(rascunhoVazio)
  const [campos, setCampos] = useState({ data: '', dataFim: '' })
  const [aviso, setAviso] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const fechar = () => (router.canGoBack() ? router.back() : router.replace('/'))
  const hoje = hojeIso()

  async function ler(entrada: { texto: string } | { arquivo: string; tipo: string }) {
    setEtapa('lendo')
    setErro(null)
    const { rascunho, lidoPelaIa } = await lerReserva(supabase, entrada, hoje)
    setR(rascunho)
    setCampos({ data: dataParaCampo(rascunho.data), dataFim: dataParaCampo(rascunho.dataFim) })
    const leuAlgo = !!(rascunho.tipo || rascunho.data || rascunho.codigo)
    // Spec 120b: leitura que falha abre o formulário com o que deu pra ler, sem perder o arquivo
    const falhou = !leuAlgo || ('arquivo' in entrada && !lidoPelaIa)
    setAviso(falhou ? 'Não consegui ler tudo. Preencha o que faltar; o arquivo vai junto pro cofre.' : null)
    setEtapa('conferir')
  }

  async function mandarPrint() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permissao.granted) return setErro('Sem acesso às fotos. Libere nas configurações do celular.')
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: true, quality: 0.7 })
    const a = res.canceled ? null : res.assets[0]
    if (!a?.base64) return
    const tipo = a.mimeType && ['image/jpeg', 'image/png', 'image/webp'].includes(a.mimeType) ? a.mimeType : 'image/jpeg'
    const bytes = new Uint8Array(await (await fetch(a.uri)).arrayBuffer())
    setArquivo({ bytes, tipo, nome: a.fileName ?? 'Reserva' })
    await ler({ arquivo: a.base64, tipo })
  }

  async function mandarPdf() {
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true })
    const a = res.canceled ? null : res.assets[0]
    if (!a) return
    if ((a.size ?? 0) > 10 * 1024 * 1024) return setErro('PDF muito grande: o limite é 10 MB.')
    const bytes = new Uint8Array(await (await fetch(a.uri)).arrayBuffer())
    setArquivo({ bytes, tipo: 'application/pdf', nome: a.name })
    await ler({ arquivo: paraBase64(bytes), tipo: 'application/pdf' })
  }

  const mudar = (campo: keyof RascunhoDeReserva, valor: string | null) => setR((atual) => ({ ...atual, [campo]: valor || null }))

  // O tipo do transporte: o que a pessoa marcou ou o provável (de fora pra cá = chegada)
  const tipoDoTrajeto: TipoDoTrajeto | null =
    r.tipo && ondeVaiAReserva(r.tipo) === 'trajeto' ? (tipoTrajeto ?? tipoProvavel(destinosDaReserva(r, destinos.status === 'pronto' ? (destinos.dados ?? []) : []))) : null

  async function confirmar() {
    if (!viagem || destinos.status !== 'pronto') return
    const final = normalizarRascunho({ ...r, data: dataDoCampo(campos.data), dataFim: dataDoCampo(campos.dataFim) })
    const falta = oQueFalta(final)
    if (falta.length) return setErro(`Falta ${falta.join(' e ')}.`)
    setErro(null)
    setSalvando(true)
    try {
      const euSouAdm = viagem.membros.some((m) => m.id === meuId && m.papel === 'adm')
      const salva = await salvarReserva(supabase, viagem.id, final, {
        destinos: destinos.dados ?? [],
        membros: viagem.membros.map((m) => ({ id: m.id, nome: m.nome })),
        euSouAdm,
        tipoDoTrajeto: tipoDoTrajeto ?? undefined,
      })
      if (arquivo) await guardarNoCofre(viagem.id, arquivo, ligacaoNoCofre(salva)).catch((e) => console.error('Reserva salva, mas o arquivo não foi pro cofre:', e))
      router.replace(params.voltar === 'transportes' ? '/transportes' : '/hoje')
    } catch (e) {
      console.error('Erro ao salvar a reserva:', e)
      setErro(e instanceof Error && e.message.startsWith('Trecho do grupo') ? e.message : 'Não deu pra salvar. Confira a internet e tente de novo.')
      setSalvando(false)
    }
  }

  if (ehConvidado || !viagem)
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-fundo px-8">
        <Text className="text-center font-display text-[24px] text-texto">Reserva é pra quem tem conta</Text>
        <Pressable onPress={fechar} className="h-12 justify-center">
          <Text className="font-body-bold text-[15px] text-couro">Voltar</Text>
        </Pressable>
      </View>
    )

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-fundo" style={{ paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <View className="px-5 pt-2">
        <BotaoRedondo aoTocar={fechar}>
          <X size={20} color={cor.texto} />
        </BotaoRedondo>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: insets.bottom + 32, gap: 16 }}>
        <View>
          <Text className="font-display text-[32px] leading-[36px] text-texto">{etapa === 'conferir' ? 'Confira a reserva' : 'Adicionar reserva'}</Text>
          <Text className="mt-2 font-body text-[15px] leading-[22px] text-corpo">
            {etapa === 'conferir' ? 'Arrume o que estiver errado e confirme. Aparece no "Hoje" de todo mundo.' : 'Mande o print, o PDF ou cole o texto do e-mail. A Norti preenche o resto.'}
          </Text>
        </View>

        {etapa === 'escolher' ? (
          <View className="gap-3">
            <Jeito titulo="Mandar print" detalhe="Foto da tela do app ou do e-mail" Icone={IconeImagem} aoTocar={() => void mandarPrint()} />
            {Platform.OS !== 'web' ? <Jeito titulo="Mandar PDF" detalhe="Bilhete, voucher ou confirmação" Icone={FileText} aoTocar={() => void mandarPdf()} /> : null}
            <Jeito titulo="Colar o texto" detalhe="Copie o e-mail da reserva e cole aqui" Icone={ScrollText} aoTocar={() => setEtapa('colar')} />
          </View>
        ) : null}

        {etapa === 'colar' ? (
          <View className="gap-3">
            <TextInput
              value={texto}
              onChangeText={setTexto}
              multiline
              autoFocus
              placeholder="Cole aqui o texto da reserva"
              placeholderTextColor={cor.suave}
              textAlignVertical="top"
              className="min-h-[180px] rounded-2xl border-[1.5px] border-borda bg-cartao p-4 font-body text-[15px] text-texto"
            />
            <Botao titulo="Ler a reserva" aoTocar={() => void ler({ texto })} desabilitado={texto.trim().length < 10} />
          </View>
        ) : null}

        {etapa === 'lendo' ? (
          <View className="gap-3">
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color={cor.couro} />
              <Text className="font-body-semibold text-[15px] text-corpo">Lendo a reserva...</Text>
            </View>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} className="h-12 rounded-2xl bg-areia" style={{ opacity: 1 - i * 0.18 }} />
            ))}
          </View>
        ) : null}

        {etapa === 'conferir' ? (
          <View className="gap-3">
            {aviso ? <Text className="rounded-2xl bg-areia p-3 font-body text-[14px] leading-5 text-corpo">{aviso}</Text> : null}
            <View className="flex-row flex-wrap gap-2">
              {TIPOS_DE_RESERVA.map((t) => (
                <Pressable
                  key={t.tipo}
                  onPress={() => setR({ ...r, tipo: t.tipo })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: r.tipo === t.tipo }}
                  className={`min-h-[38px] justify-center rounded-full border-[1.5px] px-3.5 ${r.tipo === t.tipo ? 'border-couro bg-couro' : 'border-borda bg-cartao'}`}
                >
                  <Text className={`font-body-semibold text-[13px] ${r.tipo === t.tipo ? 'text-white' : 'text-texto'}`}>{t.titulo}</Text>
                </Pressable>
              ))}
            </View>
            {r.tipo ? <Text className="font-body text-[13px] text-suave">{ONDE_VAI[ondeVaiAReserva(r.tipo)]}</Text> : null}
            {tipoDoTrajeto ? (
              <View className="flex-row flex-wrap gap-2">
                {TIPOS_DO_TRAJETO.map((t) => (
                  <Pressable
                    key={t.tipo}
                    onPress={() => setTipoTrajeto(t.tipo)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: tipoDoTrajeto === t.tipo }}
                    className={`min-h-[38px] justify-center rounded-full border-[1.5px] px-3.5 ${tipoDoTrajeto === t.tipo ? 'border-caramelo bg-areia' : 'border-borda bg-cartao'}`}
                  >
                    <Text className={`font-body-semibold text-[13px] ${tipoDoTrajeto === t.tipo ? 'text-couro' : 'text-texto'}`}>{t.titulo}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <Rotulo texto={r.tipo === 'voo' ? 'Número do voo' : r.tipo === 'casa' ? 'Nome da casa ou hotel' : 'Nome'} />
            <Campo value={r.titulo ?? ''} onChangeText={(v) => mudar('titulo', v)} placeholder="Opcional" />

            {r.tipo && ondeVaiAReserva(r.tipo) === 'trajeto' ? (
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Rotulo texto="De" />
                  <Campo value={r.origem ?? ''} onChangeText={(v) => mudar('origem', v)} placeholder="Cidade" />
                </View>
                <View className="flex-1">
                  <Rotulo texto="Para" />
                  <Campo value={r.destino ?? ''} onChangeText={(v) => mudar('destino', v)} placeholder="Cidade" />
                </View>
              </View>
            ) : null}

            <View className="flex-row gap-2">
              <View className="flex-[3]">
                <Rotulo texto={r.tipo === 'casa' ? 'Check-in' : r.tipo && ondeVaiAReserva(r.tipo) === 'trajeto' ? 'Saída' : 'Dia'} />
                <Campo value={campos.data} onChangeText={(v) => setCampos({ ...campos, data: v })} placeholder="DD/MM/AAAA" keyboardType="numbers-and-punctuation" />
              </View>
              <View className="flex-[2]">
                <Rotulo texto="Hora" />
                <Campo value={r.hora ?? ''} onChangeText={(v) => mudar('hora', v)} placeholder="HH:MM" keyboardType="numbers-and-punctuation" />
              </View>
            </View>

            {r.tipo && ondeVaiAReserva(r.tipo) !== 'agenda' ? (
              <View className="flex-row gap-2">
                <View className="flex-[3]">
                  <Rotulo texto={r.tipo === 'casa' ? 'Check-out' : 'Chegada'} />
                  <Campo value={campos.dataFim} onChangeText={(v) => setCampos({ ...campos, dataFim: v })} placeholder="DD/MM/AAAA" keyboardType="numbers-and-punctuation" />
                </View>
                <View className="flex-[2]">
                  <Rotulo texto="Hora" />
                  <Campo value={r.horaFim ?? ''} onChangeText={(v) => mudar('horaFim', v)} placeholder="HH:MM" keyboardType="numbers-and-punctuation" />
                </View>
              </View>
            ) : null}

            {r.tipo !== 'voo' ? (
              <>
                <Rotulo texto="Endereço" />
                <Campo value={r.endereco ?? ''} onChangeText={(v) => mudar('endereco', v)} placeholder="Opcional" />
              </>
            ) : null}
            <Rotulo texto="Código da reserva" />
            <Campo value={r.codigo ?? ''} onChangeText={(v) => mudar('codigo', v)} placeholder="Opcional" autoCapitalize="characters" />
            {arquivo ? <Text className="font-body text-[13px] text-suave">O {arquivo.tipo === 'application/pdf' ? 'PDF' : 'print'} vai pro cofre, no "ver reserva".</Text> : null}
          </View>
        ) : null}

        {erro ? <Text className="text-center font-body-medium text-[13px] text-vermelho">{erro}</Text> : null}
        {etapa === 'conferir' ? <Botao titulo="Confirmar" aoTocar={() => void confirmar()} carregando={salvando} desabilitado={destinos.status !== 'pronto'} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function Jeito({ titulo, detalhe, Icone, aoTocar }: { titulo: string; detalhe: string; Icone: typeof FileText; aoTocar: () => void }) {
  return (
    <Pressable onPress={aoTocar} accessibilityRole="button" className="min-h-[68px] flex-row items-center gap-4 rounded-3xl bg-cartao px-5 py-3 active:opacity-80">
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-areia">
        <Icone size={22} color={cor.couro} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-body-bold text-[16px] text-texto">{titulo}</Text>
        <Text className="font-body text-[13px] text-suave">{detalhe}</Text>
      </View>
    </Pressable>
  )
}

function Rotulo({ texto }: { texto: string }) {
  return <Text className="-mb-1 font-body-bold text-[12px] uppercase tracking-[1px] text-suave">{texto}</Text>
}

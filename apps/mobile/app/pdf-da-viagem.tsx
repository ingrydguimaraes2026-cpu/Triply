import { useState } from 'react'
import { Platform, ScrollView, Switch, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import { ArrowLeft, BookOpen, FileText } from '../src/ui/icones'
import {
  buscarCarimbos,
  buscarDestinos,
  buscarEventosDaAgenda,
  buscarFichasDoComboio,
  buscarOpcoesDeHospedagem,
  buscarPostsDaViagem,
  buscarTrajetos,
  carimbosDaCapa,
  diaNoFuso,
  htmlDoLivro,
  htmlDoResumo,
  montarHospedagem,
  paginasDoLivro,
  roteiroDiaADia,
  type FichaNoComboio,
  type ViagemComDetalhes,
} from '@together/core'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { diaLongo, lerData, periodo, primeiroNome } from '../src/lib/formato'
import { supabase } from '../src/lib/supabase'
import { StatusBar } from '../src/ui/StatusBar'
import { Botao, BotaoRedondo, Cartao } from '../src/ui/pecas'
import { cor } from '../theme'

// PDF da viagem (specs 088 e 106 no mobile). No site são telas com "Imprimir → Salvar como PDF";
// no celular o app monta o PDF e abre o "compartilhar" (WhatsApp, e-mail, Arquivos).

const MEIOS: Record<string, string> = { aviao: 'Voo', trem: 'Trem', onibus: 'Ônibus', carro: 'Carro', barco: 'Barco', a_pe: 'A pé' }
const FOTOS_POR_DIA = 6

// "06/06 14:30"
const dataEHora = (iso: string | null) => {
  if (!iso) return '—'
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`
}
// "2027-06-06" → "06/06"
const dataCurta = (iso: string) => {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}
const hoje = () => new Date().toLocaleDateString('pt-BR')
const tituloDoDia = (dia: string, onde?: string | null) => `${diaLongo(lerData(dia))}${onde ? ` · ${onde}` : ''}`

async function montarResumo(viagem: ViagemComDetalhes, comSegredos: boolean) {
  const [destinos, trajetos, eventos, opcoes, fichas] = await Promise.all([
    buscarDestinos(supabase, viagem.id),
    buscarTrajetos(supabase, viagem.id),
    buscarEventosDaAgenda(supabase, viagem.id),
    buscarOpcoesDeHospedagem(supabase, viagem.id),
    buscarFichasDoComboio(supabase, viagem.id).catch((): FichaNoComboio[] => []),
  ])
  const nomeDe = (id: string | null) => destinos.find((d) => d.id === id)?.nome ?? '?'
  const escolhidas = montarHospedagem(destinos, opcoes).filter((h) => h.escolhida)
  return htmlDoResumo({
    nome: viagem.nome,
    periodo: periodo(viagem.dataInicio, viagem.dataFim),
    rota: destinos.map((d) => d.nome).join(' → '),
    dias: roteiroDiaADia(viagem.dataInicio, viagem.dataFim, { destinos, trajetos, eventos }).map((d) => ({
      titulo: diaLongo(lerData(d.dia)),
      onde: d.onde?.nome ?? null,
      itens: d.itens.map((i) => ({ hora: i.hora, titulo: i.titulo, detalhe: i.detalhe })),
    })),
    trajetos: trajetos.map((t) => ({
      trecho: `${nomeDe(t.origem_id)} → ${nomeDe(t.destino_id)}`,
      meio: MEIOS[t.meio] ?? t.meio,
      partida: dataEHora(t.partida),
      chegada: dataEHora(t.chegada),
      obs: t.observacao ?? '',
    })),
    hospedagens: escolhidas.map(({ destino, escolhida }) => {
      const h = escolhida!
      const horarios = [
        h.checkin ? `Check-in ${dataCurta(h.checkin)}${h.horaCheckin ? ` a partir das ${h.horaCheckin}` : ''}` : '',
        h.checkout ? `Check-out ${dataCurta(h.checkout)}${h.horaCheckout ? ` até ${h.horaCheckout}` : ''}` : '',
      ]
        .filter(Boolean)
        .join(' · ')
      return {
        destino: destino.nome,
        nome: h.nome,
        horarios,
        endereco: h.guia?.endereco ?? null,
        comoChegar: h.guia?.comoChegar ?? null,
        // Wi-Fi e código da porta só se a pessoa pedir (o PDF costuma ir pra família)
        wifi: comSegredos && h.guia?.wifiRede ? `${h.guia.wifiRede}${h.guia.wifiSenha ? ` · senha ${h.guia.wifiSenha}` : ''}` : null,
        codigoPorta: comSegredos ? (h.guia?.codigoPorta ?? null) : null,
      }
    }),
    comboio: viagem.membros.map((m) => {
      const f = fichas.find((x) => x.usuario_id === m.id)
      return {
        nome: m.nome,
        telefone: f?.telefone ?? '—',
        emergencia: f?.emergencia_nome ? `${f.emergencia_nome}${f.emergencia_telefone ? ` · ${f.emergencia_telefone}` : ''}` : '—',
      }
    }),
    geradoEm: hoje(),
  })
}

async function montarLivro(viagem: ViagemComDetalhes) {
  const [destinos, trajetos, eventos, posts, diario, carimbos] = await Promise.all([
    buscarDestinos(supabase, viagem.id),
    buscarTrajetos(supabase, viagem.id),
    buscarEventosDaAgenda(supabase, viagem.id),
    buscarPostsDaViagem(supabase, viagem.id),
    // O livro é do grupo: texto "só eu" do diário não entra
    supabase
      .from('diario')
      .select('*')
      .eq('viagem_id', viagem.id)
      .eq('visibilidade', 'comboio')
      .order('criado_em')
      .then(({ data, error }) => {
        if (error) throw error
        return data ?? []
      }),
    buscarCarimbos(supabase, viagem.id).catch(() => []), // spec 118c: carimbos na capa
  ])
  const agenda = roteiroDiaADia(viagem.dataInicio, viagem.dataFim, { destinos, trajetos, eventos }).flatMap((d) =>
    d.itens.map((i) => ({ dia: d.dia, hora: i.hora, titulo: i.titulo })),
  )
  // Mais curtidas primeiro em cada dia
  const fotos = [...posts]
    .sort((a, b) => b.curtidas.length - a.curtidas.length)
    .flatMap((p) => p.fotos.filter((f) => f.url).map((f, i) => ({ dia: diaNoFuso(p.criado_em), url: f.url!, legenda: i === 0 ? p.legenda : null })))
  const nome = (id: string) => primeiroNome(viagem.membros.find((m) => m.id === id)?.nome ?? 'Alguém')
  const ondeNoDia = (dia: string) => destinos.filter((d) => d.chegada && d.chegada <= dia && (d.saida ?? d.chegada) >= dia).pop()?.nome
  return htmlDoLivro({
    nome: viagem.nome,
    periodo: periodo(viagem.dataInicio, viagem.dataFim),
    rota: destinos.map((d) => d.nome).join(' → '),
    comboio: viagem.membros.map((m) => primeiroNome(m.nome)).join(' · '),
    carimbos: carimbosDaCapa(carimbos),
    paginas: paginasDoLivro(agenda, diario, fotos).map((p) => ({
      titulo: tituloDoDia(p.dia, ondeNoDia(p.dia)),
      agenda: p.agenda,
      diario: p.diario.map((d) => ({ texto: d.texto, autor: nome(d.autor) })),
      fotos: p.fotos.slice(0, FOTOS_POR_DIA),
    })),
    geradoEm: hoje(),
  })
}

// HTML → PDF → "compartilhar". No navegador (teste na web), abre o imprimir.
async function entregarPdf(html: string, titulo: string) {
  if (Platform.OS === 'web') return Print.printAsync({ html })
  const { uri } = await Print.printToFileAsync({ html })
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: titulo })
}

export default function PdfDaViagem() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { atual } = useViagemAtual()
  const [gerando, setGerando] = useState<'resumo' | 'livro' | null>(null)
  const [comSegredos, setComSegredos] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  if (!atual) return null

  async function gerar(tipo: 'resumo' | 'livro') {
    setGerando(tipo)
    setErro(null)
    try {
      const html = tipo === 'resumo' ? await montarResumo(atual!, comSegredos) : await montarLivro(atual!)
      await entregarPdf(html, tipo === 'resumo' ? `Roteiro de ${atual!.nome}` : `Livro de ${atual!.nome}`)
    } catch (e) {
      console.error('Erro ao gerar o PDF:', e)
      setErro('Não deu pra gerar o PDF. Confira a internet e tente de novo.')
    }
    setGerando(null)
  }

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: insets.bottom + 40, gap: 12 }}>
        <BotaoRedondo aoTocar={() => (router.canGoBack() ? router.back() : router.replace('/'))} rotulo="Voltar">
          <ArrowLeft size={20} color={cor.texto} />
        </BotaoRedondo>
        <View>
          <Text className="font-display text-[32px] text-texto">PDF da viagem</Text>
          <Text className="mt-0.5 font-body text-[14px] text-suave">Pra imprimir, guardar no celular ou mandar pra família.</Text>
        </View>

        <Cartao className="gap-3 p-4">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-chip">
              <FileText size={20} color={cor.couro} />
            </View>
            <View className="flex-1">
              <Text className="font-body-bold text-[16px] text-texto">Roteiro pra imprimir</Text>
              <Text className="font-body text-[13px] leading-5 text-suave">Dia a dia, transportes, hospedagens e telefones do comboio.</Text>
            </View>
          </View>
          <View className="flex-row items-center justify-between gap-3">
            <Text className="flex-1 font-body text-[13.5px] text-corpo">Incluir Wi-Fi e código da porta</Text>
            <Switch value={comSegredos} onValueChange={setComSegredos} trackColor={{ true: cor.couro, false: '#E3D2B8' }} accessibilityLabel="Incluir Wi-Fi e código da porta" />
          </View>
          <Botao titulo="Gerar PDF do roteiro" carregando={gerando === 'resumo'} desabilitado={gerando !== null} aoTocar={() => gerar('resumo')} />
        </Cartao>

        <Cartao className="gap-3 p-4">
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-chip">
              <BookOpen size={20} color={cor.couro} />
            </View>
            <View className="flex-1">
              <Text className="font-body-bold text-[16px] text-texto">Livro da viagem</Text>
              <Text className="font-body text-[13px] leading-5 text-suave">Uma página por dia com a agenda, o diário do comboio e as fotos mais curtidas.</Text>
            </View>
          </View>
          <Botao titulo="Gerar livro" tipo="secundario" carregando={gerando === 'livro'} desabilitado={gerando !== null} aoTocar={() => gerar('livro')} />
        </Cartao>

        {erro ? <Text className="font-body-medium text-[13px] text-vermelho">{erro}</Text> : null}
        <Text className="text-center font-body text-[12.5px] leading-5 text-suave">O PDF sai com o que está no app agora. Mudou algo? É só gerar de novo.</Text>
      </ScrollView>
    </View>
  )
}

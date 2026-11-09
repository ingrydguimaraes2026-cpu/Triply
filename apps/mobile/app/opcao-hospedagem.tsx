import { useEffect, useRef, useState } from 'react'
import { Alert, Image, Platform, Pressable, ScrollView, Switch, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, ChevronDown, ChevronRight, Footprints, Trash2 } from '../src/ui/icones'
import {
  acharLugar,
  adicionarOpcaoDeHospedagem,
  apagarOpcaoDeHospedagem,
  atualizarOpcaoDeHospedagem,
  contasDaOpcao,
  formatarDinheiro,
  linkValido,
  minutosAPe,
  noitesDaViagem,
  sugerirNome,
  textoAPe,
  textoDasNoites,
  type DadosDaOpcao,
} from '@together/core'
import { useHospedagemDaViagem } from '../src/dados/hospedagemDaViagem'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { supabase } from '../src/lib/supabase'
import { StatusBar } from '../src/ui/StatusBar'
import { Botao, BotaoRedondo, Campo, Carregando, ErroNaTela } from '../src/ui/pecas'
import { cor } from '../theme'

// Spec 123: pôr (ou editar) uma opção de hospedagem numa cidade. Cola o link: o app pega nome e foto.
// À vista só o que muda a conta: preço, endereço (distância da chegada) e check-in até (aviso).
// O resto fica em "Mais detalhes". Rota: /opcao-hospedagem?destino=<id>[&opcao=<id>]

// "480" ou "1.250,90" → centavos (null se vazio; NaN se errado)
const centavos = (texto: string) => {
  if (!texto.trim()) return null
  const n = Number(texto.trim().replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : NaN
}
const textoDoPreco = (c: number | null) => (c === null ? '' : (c / 100).toFixed(2).replace('.', ',').replace(/,00$/, ''))
// "2330" ou "23:30" → "23:30"; vazio → null; errado → NaN (string 'x')
const lerHora = (texto: string): string | null | 'x' => {
  const t = texto.trim()
  if (!t) return null
  const m = /^(\d{1,2}):?(\d{2})?$/.exec(t)
  if (!m || Number(m[1]) > 23 || Number(m[2] ?? 0) > 59) return 'x'
  return `${m[1].padStart(2, '0')}:${m[2] ?? '00'}`
}
// "2/6" ou "02/06/2027" → "2027-06-02" (ano da viagem se faltar)
const lerData = (texto: string, ano: string): string | null | 'x' => {
  const t = texto.trim()
  if (!t) return null
  const m = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/.exec(t)
  if (!m) return 'x'
  return `${m[3] ?? ano}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
}
const textoDaData = (iso: string | null | undefined) => (iso ? `${Number(iso.slice(8, 10))}/${iso.slice(5, 7)}` : '')

export default function OpcaoDeHospedagem() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { destino: destinoId, opcao: opcaoId } = useLocalSearchParams<{ destino: string; opcao?: string }>()
  const { atual: viagem, meuId } = useViagemAtual()
  const carga = useHospedagemDaViagem(viagem?.id)

  const [link, setLink] = useState('')
  const [nome, setNome] = useState('')
  const [foto, setFoto] = useState<string | null>(null)
  const [preco, setPreco] = useState('')
  const [moeda, setMoeda] = useState(viagem?.moeda ?? 'EUR')
  const [endereco, setEndereco] = useState('')
  const [limite, setLimite] = useState('')
  const [selfCheckin, setSelfCheckin] = useState(false)
  const [maisDetalhes, setMaisDetalhes] = useState(false)
  const [horaCheckin, setHoraCheckin] = useState('')
  const [horaCheckout, setHoraCheckout] = useState('')
  const [cancelamento, setCancelamento] = useState('')
  const [contato, setContato] = useState('')
  const [observacao, setObservacao] = useState('')
  const [lendoLink, setLendoLink] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [ponto, setPonto] = useState<{ lat: number; lon: number; endereco: string } | null>(null)
  const preenchido = useRef(false)

  const dados = carga.status === 'pronto' ? carga.dados : null
  const existente = dados && opcaoId ? dados.opcoes.find((o) => o.id === opcaoId) ?? null : null

  // Editando: preenche uma vez com o que já está salvo
  useEffect(() => {
    if (!existente || preenchido.current) return
    preenchido.current = true
    setLink(existente.link ?? '')
    setNome(existente.nome)
    setFoto(existente.fotoUrl ?? null)
    setPreco(textoDoPreco(existente.precoTotal))
    setMoeda(existente.moeda)
    setEndereco(existente.guia?.endereco ?? '')
    setLimite(existente.horaCheckinLimite ?? '')
    setSelfCheckin(!!existente.selfCheckin)
    setHoraCheckin(existente.horaCheckin ?? '')
    setHoraCheckout(existente.horaCheckout ?? '')
    setCancelamento(textoDaData(existente.cancelamentoGratisAte))
    setContato(existente.contatoAnfitriao ?? '')
    setObservacao(existente.observacao ?? '')
    if (existente.lat != null && existente.lon != null && existente.guia?.endereco) setPonto({ lat: existente.lat, lon: existente.lon, endereco: existente.guia.endereco })
    if (existente.horaCheckin || existente.horaCheckout || existente.cancelamentoGratisAte || existente.contatoAnfitriao || existente.observacao) setMaisDetalhes(true)
  }, [existente])

  if (!viagem) return null
  if (carga.status === 'carregando') return <Carregando />
  if (carga.status === 'erro') return <ErroNaTela aoTentar={carga.recarregar} />
  const pessoas = Math.max(1, viagem.membros.length)
  const euSouAdm = viagem.membros.some((m) => m.id === meuId && m.papel === 'adm')
  const cidade = noitesDaViagem(carga.dados.destinos, carga.dados.opcoes, carga.dados.trajetos, pessoas).cidades.find((c) => c.destino.id === destinoId)
  const destino = cidade?.destino ?? carga.dados.destinos.find((d) => d.id === destinoId)
  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/'))
  if (!destino || (opcaoId && !existente)) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-fundo px-8">
        <Text className="text-center font-body text-[15px] text-corpo">{opcaoId ? 'Essa opção não existe mais.' : 'Esse destino não existe mais.'}</Text>
        <Botao titulo="Voltar" aoTocar={voltar} />
      </View>
    )
  }
  const podeMexer = !existente || euSouAdm || existente.criadoPor === meuId
  const chegada = cidade?.chegada ?? null
  const valor = centavos(preco)
  const contas = typeof valor === 'number' && !Number.isNaN(valor) ? contasDaOpcao(valor, pessoas, cidade?.noites ?? null) : null
  const minutos = ponto && ponto.endereco === endereco.trim() && chegada?.lat != null && chegada?.lon != null ? minutosAPe(ponto, { lat: chegada.lat, lon: chegada.lon }) : null

  // Spec 072: puxa título e foto do link no servidor (se o site deixar)
  function trocarLink(texto: string) {
    setLink(texto)
    const limpo = texto.trim()
    if (!linkValido(limpo) || limpo === existente?.link) return
    if (!nome.trim()) setNome(sugerirNome(limpo) ?? '')
    setLendoLink(true)
    supabase.functions
      .invoke('previa-link', { body: { url: limpo } })
      .then(({ data }) => {
        const previa = data as { titulo?: string | null; imagem?: string | null } | null
        if (previa?.imagem) setFoto(previa.imagem)
        if (previa?.titulo) setNome((atual) => (atual.trim() && atual !== sugerirNome(limpo) ? atual : previa.titulo!.slice(0, 120)))
      })
      .catch(() => {})
      .finally(() => setLendoLink(false))
  }

  // Endereço → ponto no mapa (perto de onde o grupo chega), pra distância a pé
  async function acharEndereco(): Promise<{ lat: number; lon: number } | null> {
    const texto = endereco.trim()
    if (!texto) return null
    if (ponto && ponto.endereco === texto) return ponto
    const perto = chegada?.lat != null && chegada?.lon != null ? { latitude: chegada.lat, longitude: chegada.lon } : null
    const achado = await acharLugar(texto.toLowerCase().includes(destino!.nome.toLowerCase()) ? texto : `${texto}, ${destino!.nome}`, perto)
    if (!achado) return null
    const novo = { lat: achado.latitude, lon: achado.longitude, endereco: texto }
    setPonto(novo)
    return novo
  }

  async function salvar() {
    setErro(null)
    const linkLimpo = link.trim()
    if (linkLimpo && !linkValido(linkLimpo)) return setErro('O link precisa começar com https://')
    const nomeFinal = nome.trim()
    if (!nomeFinal) return setErro('Dê um nome pra opção (ex.: "Studio perto da estação").')
    if (Number.isNaN(valor)) return setErro('Preço inválido. Ex.: 190 ou 1.250,90')
    const [lim, hIn, hOut] = [lerHora(limite), lerHora(horaCheckin), lerHora(horaCheckout)]
    if (lim === 'x' || hIn === 'x' || hOut === 'x') return setErro('Hora inválida. Ex.: 23:30')
    const cancela = lerData(cancelamento, (destino!.chegada ?? viagem!.dataInicio ?? '2027').slice(0, 4))
    if (cancela === 'x') return setErro('Data do cancelamento inválida. Ex.: 2/6')
    setSalvando(true)
    const lugar = await acharEndereco().catch(() => null)
    const dadosDaOpcao: DadosDaOpcao = {
      destinoId: destino!.id,
      nome: nomeFinal,
      link: linkLimpo || null,
      precoTotal: valor,
      moeda: moeda.trim().toUpperCase() || viagem!.moeda,
      checkin: existente?.checkin ?? destino!.chegada,
      checkout: existente?.checkout ?? destino!.saida,
      horaCheckin: hIn,
      horaCheckout: hOut,
      horaCheckinLimite: selfCheckin ? null : lim,
      selfCheckin,
      endereco: endereco.trim() || null,
      lat: lugar?.lat ?? null,
      lon: lugar?.lon ?? null,
      contatoAnfitriao: contato,
      observacao: observacao || null,
      cancelamentoGratisAte: cancela,
      guardaMalas: existente?.guardaMalas ?? null,
      guardaMalasObs: existente?.guardaMalasObs ?? null,
      etiquetas: existente?.etiquetas ?? [],
      nota: existente?.nota ?? null,
      fotoUrl: foto,
    }
    try {
      if (existente) await atualizarOpcaoDeHospedagem(supabase, existente.id, dadosDaOpcao)
      else await adicionarOpcaoDeHospedagem(supabase, viagem!.id, dadosDaOpcao)
      voltar()
    } catch {
      setErro('Não deu pra salvar agora. Tente de novo.')
      setSalvando(false)
    }
  }

  function apagar() {
    const sim = async () => {
      try {
        await apagarOpcaoDeHospedagem(supabase, existente!.id)
        voltar()
      } catch {
        setErro('Não deu pra apagar. Só quem pôs a opção ou o ADM apaga.')
      }
    }
    if (Platform.OS === 'web') {
      if (window.confirm(`Apagar "${existente!.nome}"?`)) sim()
    } else Alert.alert('Apagar opção?', existente!.nome, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Apagar', style: 'destructive', onPress: sim }])
  }

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: insets.bottom + 40, gap: 10 }} keyboardShouldPersistTaps="handled">
        <BotaoRedondo aoTocar={voltar}>
          <ArrowLeft size={20} color={cor.texto} />
        </BotaoRedondo>
        <View>
          <Text className="font-display text-[30px] leading-[34px] text-texto">{existente ? 'Editar opção' : `Opção em ${destino.nome}`}</Text>
          <Text className="mt-1 font-body text-[13.5px] text-suave">
            {cidade ? textoDasNoites(cidade) : destino.nome} · {pessoas} {pessoas === 1 ? 'pessoa' : 'pessoas'}
          </Text>
        </View>

        <Campo placeholder="Link (Airbnb, Booking, hotel...)" value={link} onChangeText={trocarLink} autoCapitalize="none" keyboardType="url" editable={podeMexer} />
        {lendoLink ? <Text className="font-body text-[12.5px] text-suave">Lendo o link…</Text> : null}
        {foto ? (
          <View className="flex-row items-center gap-2.5 rounded-2xl p-2" style={{ backgroundColor: cor.verdeFundo }}>
            <Image source={{ uri: foto }} className="h-10 w-10 rounded-xl bg-areia" />
            <Text className="flex-1 font-body text-[12.5px] text-verde">Foto lida do link</Text>
          </View>
        ) : null}
        <Campo placeholder="Nome (ex.: Studio Cannaregio)" value={nome} onChangeText={setNome} editable={podeMexer} />

        <View className="flex-row gap-2.5">
          <View className="flex-1">
            <Campo placeholder="Preço total (todas as noites)" value={preco} onChangeText={setPreco} keyboardType="decimal-pad" editable={podeMexer} />
          </View>
          <View className="w-[86px]">
            <Campo placeholder="Moeda" value={moeda} onChangeText={setMoeda} autoCapitalize="characters" maxLength={3} editable={podeMexer} />
          </View>
        </View>
        {contas?.porPessoa != null && pessoas > 1 ? (
          <Text className="-mt-1 px-1 font-body text-[12.5px] text-suave">
            {formatarDinheiro(contas.porPessoa, moeda.toUpperCase() || viagem.moeda)} por pessoa
            {contas.porNoite != null ? ` · ${formatarDinheiro(contas.porNoite, moeda.toUpperCase() || viagem.moeda)} por noite` : ''}
          </Text>
        ) : null}

        <Campo placeholder="Endereço (rua e número)" value={endereco} onChangeText={setEndereco} onBlur={() => void acharEndereco()} editable={podeMexer} />
        {minutos !== null ? (
          <View className="flex-row items-center gap-2 rounded-xl px-2.5 py-2" style={{ backgroundColor: minutos <= 15 ? cor.verdeFundo : cor.fundo }}>
            <Footprints size={15} color={minutos <= 15 ? cor.verde : cor.suave} />
            <Text className="flex-1 font-body-semibold text-[12.5px]" style={{ color: minutos <= 15 ? cor.verde : cor.suave }}>
              {textoAPe(minutos)} de {chegada?.lugar}, onde vocês chegam
            </Text>
          </View>
        ) : !chegada?.lat && endereco.trim() ? (
          <Text className="px-1 font-body text-[12px] text-suave">Ponha o deslocamento de chegada no dia pra ver a distância.</Text>
        ) : null}

        <View className="flex-row items-center justify-between rounded-2xl border border-borda bg-cartao px-4 py-3">
          <View className="min-w-0 flex-1 pr-3">
            <Text className="font-body-bold text-[14px] text-texto">Self check-in</Text>
            <Text className="font-body text-[12.5px] text-suave">Entra a qualquer hora (cofre, código)</Text>
          </View>
          <Switch value={selfCheckin} onValueChange={setSelfCheckin} disabled={!podeMexer} trackColor={{ true: cor.couro, false: cor.borda }} />
        </View>
        {selfCheckin ? null : (
          <Campo placeholder={`Check-in até que horas? (ex.: 23:00)${chegada?.hora ? ` · chegam ${chegada.hora}` : ''}`} value={limite} onChangeText={setLimite} editable={podeMexer} />
        )}

        <Pressable onPress={() => setMaisDetalhes((v) => !v)} className="mt-1 flex-row items-center justify-between rounded-2xl border border-dashed border-tracejado px-4 py-3 active:opacity-80">
          <Text className="font-body-bold text-[14px] text-couro">Mais detalhes</Text>
          <View className="flex-row items-center gap-1.5">
            {maisDetalhes ? null : <Text className="font-body text-[12px] text-suave">horários, anfitrião</Text>}
            {maisDetalhes ? <ChevronDown size={16} color={cor.couro} /> : <ChevronRight size={16} color={cor.couro} />}
          </View>
        </Pressable>
        {maisDetalhes ? (
          <View className="gap-2.5">
            <View className="flex-row gap-2.5">
              <View className="flex-1">
                <Campo placeholder="Check-in a partir de" value={horaCheckin} onChangeText={setHoraCheckin} editable={podeMexer} />
              </View>
              <View className="flex-1">
                <Campo placeholder="Check-out até" value={horaCheckout} onChangeText={setHoraCheckout} editable={podeMexer} />
              </View>
            </View>
            <Campo placeholder="Cancela grátis até (ex.: 2/6)" value={cancelamento} onChangeText={setCancelamento} editable={podeMexer} />
            <Campo placeholder="Contato do anfitrião (telefone ou nome)" value={contato} onChangeText={setContato} editable={podeMexer} />
            <Campo placeholder="Observação" value={observacao} onChangeText={setObservacao} editable={podeMexer} />
          </View>
        ) : null}

        {erro ? <Text className="font-body-medium text-[13px] text-vermelho">{erro}</Text> : null}
        {podeMexer ? (
          <>
            <Botao titulo={existente ? 'Salvar' : 'Pôr como opção'} carregando={salvando} aoTocar={salvar} />
            {euSouAdm ? null : <Text className="text-center font-body text-[12.5px] text-suave">O grupo vota. Quem escolhe e reserva é o ADM.</Text>}
            {existente ? (
              <Pressable onPress={apagar} className="mt-1 flex-row items-center justify-center gap-1.5 py-2 active:opacity-80">
                <Trash2 size={15} color={cor.vermelho} />
                <Text className="font-body-bold text-[13.5px] text-vermelho">Apagar opção</Text>
              </Pressable>
            ) : null}
          </>
        ) : (
          <Text className="text-center font-body text-[12.5px] text-suave">Só quem pôs essa opção ou o ADM mexe nela.</Text>
        )}
      </ScrollView>
    </View>
  )
}

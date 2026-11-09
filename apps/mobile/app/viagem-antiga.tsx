import { useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import {
  MESES,
  buscarMinhaGalera,
  conferirViagemAntiga,
  criarViagemAntiga,
  lugarPelaCoordenada,
  mesEAnoDoExif,
  pontoDoExif,
  type LugarAchado,
} from '@together/core'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { useCarregar } from '../src/dados/useCarregar'
import { useSessao } from '../src/lib/sessao'
import { convidarProComboio } from '../src/lib/convite'
import { hojeIso } from '../src/lib/formato'
import { supabase } from '../src/lib/supabase'
import { BuscaDeLugar } from '../src/ui/BuscaDeLugar'
import { Camera, Check, MapPin, Minus, Plus, X } from '../src/ui/icones'
import { Norti } from '../src/ui/Norti'
import { StatusBar } from '../src/ui/StatusBar'
import { Avatar, Botao, BotaoRedondo } from '../src/ui/pecas'
import { cor } from '../theme'

// "A gente já foi pra..." (spec 118f): lugar, mês/ano e quem foi. Vira carimbo "de memória"
// e acende o mapa da galera. Com uma foto antiga com GPS e data, o lugar e o mês vêm sozinhos.
export default function ViagemAntiga() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { ehConvidado } = useSessao()
  const { recarregar } = useViagemAtual()
  const hoje = hojeIso()
  const anoDeHoje = Number(hoje.slice(0, 4))
  const [lugar, setLugar] = useState<LugarAchado | null>(null)
  const [mes, setMes] = useState<number | null>(null)
  const [ano, setAno] = useState(anoDeHoje - 1)
  const [pessoas, setPessoas] = useState<string[]>([])
  const [lendoFoto, setLendoFoto] = useState(false)
  const [avisoDaFoto, setAvisoDaFoto] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [feita, setFeita] = useState<{ viagemId: string; nome: string; chamados: number } | null>(null)
  const galera = useCarregar(() => buscarMinhaGalera(supabase), [])

  const fechar = () => (router.canGoBack() ? router.back() : router.replace('/'))

  async function puxarDaFoto() {
    setAvisoDaFoto(null)
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permissao.granted) return setAvisoDaFoto('Sem acesso às fotos. Libere nas configurações do celular.')
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], exif: true, quality: 0.2 })
    if (res.canceled || !res.assets[0]) return
    setLendoFoto(true)
    const exif = res.assets[0].exif
    const quando = mesEAnoDoExif(exif)
    const ponto = pontoDoExif(exif)
    if (quando) {
      setMes(quando.mes)
      setAno(quando.ano)
    }
    const achado = ponto ? await lugarPelaCoordenada(ponto).catch(() => null) : null
    if (achado) setLugar(achado)
    setLendoFoto(false)
    if (!achado && !quando) setAvisoDaFoto('Essa foto não tem o lugar nem a data guardados. Escolha o lugar na busca.')
    else if (!achado) setAvisoDaFoto('A foto trouxe o mês, mas não o lugar. Escolha o lugar na busca.')
    else if (!quando) setAvisoDaFoto('A foto trouxe o lugar, mas não a data. Escolha o mês.')
  }

  async function salvar() {
    if (!lugar || !mes) return
    const problema = conferirViagemAntiga(mes, ano, hoje)
    if (problema) return setErro(problema)
    setErro(null)
    setSalvando(true)
    try {
      const r = await criarViagemAntiga(supabase, { lugar, mes, ano, pessoas }, hoje)
      recarregar()
      setFeita({ viagemId: r.viagemId, nome: lugar.nome, chamados: r.chamados })
    } catch (e) {
      console.error('Erro ao salvar a viagem antiga:', e)
      setErro('Não deu pra salvar. Confira a internet e tente de novo.')
    }
    setSalvando(false)
  }

  function maisUma() {
    setFeita(null)
    setLugar(null)
    setMes(null)
    setPessoas([])
    setAvisoDaFoto(null)
  }

  if (ehConvidado)
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-fundo px-8">
        <Text className="text-center font-display text-[24px] text-texto">Crie sua conta primeiro</Text>
        <Pressable onPress={() => router.replace('/criar-conta')} className="h-12 justify-center">
          <Text className="font-body-bold text-[15px] text-couro">Criar conta</Text>
        </Pressable>
      </View>
    )

  if (feita) return <Feita feita={feita} aoMaisUma={maisUma} aoVerMapa={() => router.replace('/')} topo={insets.top} />

  const problemaDaData = mes ? conferirViagemAntiga(mes, ano, hoje) : null

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-fundo" style={{ paddingTop: insets.top }}>
      <StatusBar style="dark" />
      <View className="px-5 pt-2">
        <BotaoRedondo aoTocar={fechar} rotulo="Fechar">
          <X size={20} color={cor.texto} />
        </BotaoRedondo>
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: insets.bottom + 32, gap: 22 }}>
        <View>
          <Text className="font-display text-[34px] leading-[38px] text-texto">A gente já foi pra...</Text>
          <Text className="mt-2 font-body text-[15px] leading-[22px] text-corpo">Conte uma viagem que já aconteceu. Ela vira um carimbo de memória e acende o mapa da galera.</Text>
        </View>

        {/* 1. Onde */}
        <View className="gap-2">
          <Text className="font-body-bold text-[13px] uppercase tracking-[1.2px] text-suave">Onde</Text>
          {lugar ? (
            <View className="min-h-[56px] flex-row items-center gap-3 rounded-2xl bg-areia px-4 py-2.5">
              <MapPin size={20} color={cor.couro} />
              <View className="min-w-0 flex-1">
                <Text className="font-body-bold text-[16px] text-texto" numberOfLines={1}>{lugar.nome}</Text>
                <Text className="font-body text-[12px] text-suave" numberOfLines={1}>{[lugar.regiao, lugar.pais].filter(Boolean).join(', ')}</Text>
              </View>
              <Pressable onPress={() => setLugar(null)} accessibilityRole="button" className="min-h-[40px] justify-center px-1">
                <Text className="font-body-bold text-[14px] text-couro">Trocar</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <BuscaDeLugar aoEscolher={setLugar} />
              {Platform.OS !== 'web' ? (
                <Pressable onPress={() => void puxarDaFoto()} disabled={lendoFoto} accessibilityRole="button" className="min-h-[44px] flex-row items-center gap-2 self-start">
                  {lendoFoto ? <ActivityIndicator color={cor.couro} /> : <Camera size={18} color={cor.couro} />}
                  <Text className="font-body-bold text-[14px] text-couro">Puxar de uma foto antiga</Text>
                </Pressable>
              ) : null}
            </>
          )}
          {avisoDaFoto ? <Text className="font-body text-[13px] leading-5 text-corpo">{avisoDaFoto}</Text> : null}
        </View>

        {/* 2. Quando */}
        <View className="gap-3">
          <Text className="font-body-bold text-[13px] uppercase tracking-[1.2px] text-suave">Quando</Text>
          <View className="flex-row items-center justify-center gap-6">
            <BotaoRedondo aoTocar={() => setAno(Math.max(1950, ano - 1))} rotulo="Ano anterior">
              <Minus size={20} color={cor.texto} />
            </BotaoRedondo>
            <Text className="w-24 text-center font-display text-[36px] text-texto">{ano}</Text>
            <BotaoRedondo aoTocar={() => setAno(Math.min(anoDeHoje, ano + 1))} rotulo="Próximo ano">
              <Plus size={20} color={cor.texto} />
            </BotaoRedondo>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {MESES.map((nome, i) => (
              <Pressable
                key={nome}
                onPress={() => setMes(i + 1)}
                accessibilityRole="button"
                accessibilityLabel={nome}
                accessibilityState={{ selected: mes === i + 1 }}
                style={{ width: '22.5%' }}
                className={`min-h-[40px] items-center justify-center rounded-full border-[1.5px] ${mes === i + 1 ? 'border-couro bg-couro' : 'border-borda bg-cartao'}`}
              >
                <Text className={`font-body-semibold text-[14px] ${mes === i + 1 ? 'text-white' : 'text-texto'}`}>{nome.slice(0, 3)}</Text>
              </Pressable>
            ))}
          </View>
          {problemaDaData ? <Text className="font-body-medium text-[13px] text-vermelho">{problemaDaData}</Text> : null}
        </View>

        {/* 3. Quem foi */}
        <View className="gap-2">
          <Text className="font-body-bold text-[13px] uppercase tracking-[1.2px] text-suave">Quem foi</Text>
          {galera.status === 'carregando' ? <ActivityIndicator color={cor.couro} /> : null}
          {galera.status === 'pronto' && galera.dados?.length
            ? galera.dados.map((p, i) => {
                const marcada = pessoas.includes(p.id)
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setPessoas(marcada ? pessoas.filter((x) => x !== p.id) : [...pessoas, p.id])}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: marcada }}
                    className="min-h-[52px] flex-row items-center gap-3 border-b border-linha py-2 active:opacity-80"
                  >
                    <Avatar nome={p.nome} indice={i} tamanho={34} />
                    <Text className="flex-1 font-body-semibold text-[15px] text-texto" numberOfLines={1}>{p.nome}</Text>
                    <View className={`h-7 w-7 items-center justify-center rounded-full border-[1.5px] ${marcada ? 'border-couro bg-couro' : 'border-borda'}`}>
                      {marcada ? <Check size={16} color="#fff" /> : null}
                    </View>
                  </Pressable>
                )
              })
            : null}
          <Text className="font-body text-[13px] leading-5 text-suave">
            {galera.status === 'pronto' && !galera.dados?.length ? 'Sua galera aparece aqui depois da primeira viagem juntos. ' : ''}
            Quem não está na lista entra pelo link, logo depois de salvar.
          </Text>
        </View>

        {erro ? <Text className="text-center font-body-medium text-[13px] text-vermelho">{erro}</Text> : null}
        <Botao titulo="Acender no mapa" aoTocar={() => void salvar()} desabilitado={!lugar || !mes || !!problemaDaData} carregando={salvando} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function Feita({ feita, aoMaisUma, aoVerMapa, topo }: { feita: { viagemId: string; nome: string; chamados: number }; aoMaisUma: () => void; aoVerMapa: () => void; topo: number }) {
  const [convite, setConvite] = useState<{ texto: string; erro: boolean } | null>(null)
  const [chamando, setChamando] = useState(false)
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-fundo px-8" style={{ paddingTop: topo }}>
      <StatusBar style="dark" />
      <Norti humor="feliz" tamanho={130} />
      <Text className="text-center font-display text-[30px] leading-[34px] text-texto">{feita.nome} acendeu no mapa</Text>
      <Text className="text-center font-body text-[15px] leading-[22px] text-corpo">
        Carimbo de memória guardado
        {feita.chamados ? ` e ${feita.chamados} ${feita.chamados === 1 ? 'pessoa da galera entrou' : 'pessoas da galera entraram'}` : ''}.
      </Text>
      <View className="mt-3 gap-2.5 self-stretch">
        <Botao titulo="Ver o mapa da galera" aoTocar={aoVerMapa} />
        <Botao
          titulo="Chamar mais gente pelo link"
          tipo="secundario"
          carregando={chamando}
          aoTocar={async () => {
            setChamando(true)
            setConvite(await convidarProComboio(feita.viagemId, feita.nome))
            setChamando(false)
          }}
        />
        {convite ? <Text className={`text-center font-body-medium text-[13px] ${convite.erro ? 'text-vermelho' : 'text-corpo'}`}>{convite.texto}</Text> : null}
        <Pressable onPress={aoMaisUma} accessibilityRole="button" className="h-11 items-center justify-center">
          <Text className="font-body-bold text-[15px] text-couro">Contar mais uma</Text>
        </Pressable>
      </View>
    </View>
  )
}

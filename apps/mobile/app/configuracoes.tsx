import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Calendar, Settings } from '../src/ui/icones'
import { buscarConfiguracoesDaViagem, buscarViagemComDetalhes, editarViagem, moedasDaViagem, type ConfiguracoesDaViagem } from '@together/core'
import { useCarregar } from '../src/dados/useCarregar'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { lerData, paraIso, periodo } from '../src/lib/formato'
import { supabase } from '../src/lib/supabase'
import { Calendario } from '../src/ui/Calendario'
import { StatusBar } from '../src/ui/StatusBar'
import { Botao, BotaoRedondo, Campo, Cartao, Carregando, ErroNaTela, RotuloDeSecao } from '../src/ui/pecas'
import { cor } from '../theme'

// Configurações da viagem (spec 008 no mobile): nome, datas, moeda e o que o comboio pode editar (spec 078).
// Só o ADM mexe aqui (o banco também confere). Apagar a viagem continua no site.

const PERMISSOES = [
  { campo: 'membro_edita_roteiro', nome: 'Roteiro', explica: 'Destinos, ordem e datas' },
  { campo: 'membro_edita_transportes', nome: 'Transportes', explica: 'Criar e editar trajetos' },
  { campo: 'membro_edita_orcamento', nome: 'Orçamento', explica: 'Quanto gastar por categoria' },
] as const

export default function Configuracoes() {
  const { atual, meuId } = useViagemAtual()
  const carga = useCarregar(
    atual
      ? async () => {
          const [config, viagem] = await Promise.all([buscarConfiguracoesDaViagem(supabase, atual.id), buscarViagemComDetalhes(supabase, atual.id)])
          const euSouAdm = !!viagem?.membros.some((m) => m.id === meuId && m.papel === 'adm')
          return { config, euSouAdm }
        }
      : null,
    [atual?.id, meuId],
  )

  if (!atual) return null
  if (carga.status === 'carregando') return <Carregando />
  if (carga.status === 'erro' || !carga.dados.config) return <ErroNaTela aoTentar={carga.recarregar} />
  // key: se a viagem mudar, o formulário começa de novo com os dados dela
  return <Tela key={carga.dados.config.id} config={carga.dados.config} euSouAdm={carga.dados.euSouAdm} />
}

function Tela({ config, euSouAdm }: { config: ConfiguracoesDaViagem; euSouAdm: boolean }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { recarregar } = useViagemAtual()
  const [salvo, setSalvo] = useState(config) // o que está no banco agora
  const [nome, setNome] = useState(config.nome)
  const [ida, setIda] = useState<Date | null>(config.data_inicio ? lerData(config.data_inicio) : null)
  const [volta, setVolta] = useState<Date | null>(config.data_fim ? lerData(config.data_fim) : null)
  const [mes, setMes] = useState(() => {
    const base = ida ?? new Date()
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })
  const [moeda, setMoeda] = useState(config.moeda_principal)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<{ texto: string; erro: boolean } | null>(null)
  const [erroPermissao, setErroPermissao] = useState<string | null>(null)

  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/'))

  if (!euSouAdm) {
    return (
      <View className="flex-1 bg-fundo" style={{ paddingTop: insets.top + 8 }}>
        <StatusBar style="dark" />
        <View className="px-5">
          <BotaoRedondo aoTocar={voltar}>
            <ArrowLeft size={20} color={cor.texto} />
          </BotaoRedondo>
        </View>
        <View className="flex-1 items-center justify-center gap-3 px-8">
          <Settings size={36} color={cor.suave} />
          <Text className="text-center font-display text-[24px] text-texto">Só quem organiza a viagem mexe aqui</Text>
          <Text className="text-center font-body text-[14px] leading-5 text-corpo">Peça pro ADM do comboio mudar o nome, as datas ou a moeda.</Text>
        </View>
      </View>
    )
  }

  function tocarDia(d: Date) {
    setMensagem(null)
    if (!ida || volta) {
      setIda(d)
      setVolta(null)
    } else if (d < ida) {
      setVolta(ida)
      setIda(d)
    } else setVolta(d)
  }

  async function salvar() {
    if (!nome.trim()) return setMensagem({ erro: true, texto: 'A viagem precisa de um nome.' })
    setSalvando(true)
    setMensagem(null)
    try {
      const nova = await editarViagem(supabase, config.id, {
        nome: nome.trim(),
        data_inicio: ida ? paraIso(ida) : null,
        data_fim: volta ? paraIso(volta) : null, // só a ida: fica sem volta, igual ao site
        moeda_principal: moeda,
      })
      setSalvo(nova)
      recarregar() // o nome e as datas novas aparecem nas outras telas
      setMensagem({ erro: false, texto: 'Salvo.' })
    } catch (e) {
      console.error('Erro ao salvar viagem:', e)
      setMensagem({ erro: true, texto: 'Não deu pra salvar. Tente de novo.' })
    }
    setSalvando(false)
  }

  async function mudarPermissao(campo: (typeof PERMISSOES)[number]['campo'], ligado: boolean) {
    setErroPermissao(null)
    setSalvo({ ...salvo, [campo]: ligado }) // muda na hora; volta se o banco recusar
    try {
      setSalvo(await editarViagem(supabase, config.id, { [campo]: ligado }))
    } catch {
      setSalvo(salvo)
      setErroPermissao('Não deu pra salvar.')
    }
  }

  const periodoEscolhido = ida ? (volta ? periodo(paraIso(ida), paraIso(volta)) : `Ida ${periodo(paraIso(ida), null)} · sem volta`) : 'Sem datas ainda'

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: insets.bottom + 40, gap: 12 }} keyboardShouldPersistTaps="handled">
        <BotaoRedondo aoTocar={voltar}>
          <ArrowLeft size={20} color={cor.texto} />
        </BotaoRedondo>
        <View>
          <Text className="font-display text-[32px] text-texto">Configurações</Text>
          <Text className="mt-0.5 font-body text-[14px] text-suave">Nome, datas e moeda da viagem. Só o ADM vê esta tela.</Text>
        </View>

        <RotuloDeSecao>Nome da viagem</RotuloDeSecao>
        <Campo value={nome} onChangeText={setNome} maxLength={120} accessibilityLabel="Nome da viagem" />

        <RotuloDeSecao>Datas</RotuloDeSecao>
        <Calendario mes={mes} setMes={setMes} ida={ida} volta={volta} aoTocar={tocarDia} liberarPassado />
        <View className="flex-row items-center gap-3 rounded-2xl bg-areia p-4">
          <Calendar size={22} color={cor.couro} />
          <Text className="flex-1 font-body-bold text-[15px] text-texto">{periodoEscolhido}</Text>
          {ida ? (
            <Pressable
              onPress={() => {
                setIda(null)
                setVolta(null)
              }}
              hitSlop={8}
            >
              <Text className="font-body-bold text-[13px] text-couro">Limpar</Text>
            </Pressable>
          ) : null}
        </View>

        <RotuloDeSecao>Moeda principal dos gastos</RotuloDeSecao>
        <View className="flex-row flex-wrap gap-2">
          {moedasDaViagem(salvo.moeda_principal).map((m) => (
            <Pressable
              key={m}
              onPress={() => setMoeda(m)}
              accessibilityState={{ selected: moeda === m }}
              className={`rounded-xl border px-3.5 py-2 ${moeda === m ? 'border-couro bg-couro' : 'border-borda bg-cartao'}`}
            >
              <Text className={`font-body-bold text-[14px] ${moeda === m ? 'text-white' : 'text-texto'}`}>{m}</Text>
            </Pressable>
          ))}
        </View>
        {moeda !== salvo.moeda_principal ? (
          <Text className="font-body text-[13px] leading-5 text-suave">
            Os gastos já lançados continuam na moeda em que foram lançados. Muda só a moeda dos totais e do orçamento.
          </Text>
        ) : null}

        {mensagem ? <Text className={`font-body-medium text-[13px] ${mensagem.erro ? 'text-vermelho' : 'text-verde'}`}>{mensagem.texto}</Text> : null}
        <Botao titulo="Salvar" carregando={salvando} aoTocar={salvar} />

        {/* Spec 078: o que o comboio também pode editar */}
        <View className="mt-4">
          <RotuloDeSecao>O que o comboio pode editar</RotuloDeSecao>
        </View>
        <Text className="font-body text-[13px] leading-5 text-suave">Desligado = só quem é ADM edita. Ver e comentar continua liberado pra todo mundo.</Text>
        <Cartao className="px-4">
          {PERMISSOES.map((p, i) => (
            <View key={p.campo} className={`flex-row items-center gap-3 py-3 ${i > 0 ? 'border-t border-linha' : ''}`}>
              <View className="flex-1">
                <Text className="font-body-bold text-[15px] text-texto">{p.nome}</Text>
                <Text className="font-body text-[12.5px] text-suave">{p.explica}</Text>
              </View>
              <Switch
                value={salvo[p.campo]}
                onValueChange={(v) => mudarPermissao(p.campo, v)}
                trackColor={{ true: cor.couro, false: '#E3D2B8' }}
                accessibilityLabel={`Comboio pode editar ${p.nome}`}
              />
            </View>
          ))}
        </Cartao>
        {erroPermissao ? <Text className="font-body-medium text-[13px] text-vermelho">{erroPermissao}</Text> : null}

        <Text className="mt-4 text-center font-body text-[13px] leading-5 text-suave">Pra apagar a viagem, use o site.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

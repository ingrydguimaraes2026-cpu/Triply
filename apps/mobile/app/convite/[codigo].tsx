import { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CalendarDays, MapPin, User, Users } from 'lucide-react-native'
import { aceitarConvite, entrarComoConvidado, verConvite, type PreviaDoConvite } from '@together/core'
import { useViagemAtual } from '../../src/dados/viagemAtual'
import { conviteDepoisDoLogin } from '../../src/lib/convite'
import { periodo } from '../../src/lib/formato'
import { useSessao } from '../../src/lib/sessao'
import { supabase } from '../../src/lib/supabase'
import { Malinha } from '../../src/ui/Malinha'
import { Botao, Campo, Carregando } from '../../src/ui/pecas'
import { StatusBar } from '../../src/ui/StatusBar'
import { cor } from '../../theme'

type Estado = { tipo: 'carregando' } | { tipo: 'invalido' } | { tipo: 'previa'; previa: PreviaDoConvite }

// Convite (spec 018): mostra a viagem antes de entrar. Sem login, entra só com o nome.
export default function Convite() {
  const { codigo } = useLocalSearchParams<{ codigo: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { sessao, carregando } = useSessao()
  const { escolher, recarregar } = useViagemAtual()
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' })
  const [nome, setNome] = useState('')
  const [entrando, setEntrando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const abrirViagem = (id: string) => {
    escolher(id)
    recarregar()
    router.replace('/')
  }

  useEffect(() => {
    if (!codigo || carregando) return
    verConvite(supabase, codigo)
      .then((previa) => {
        if (!previa) return setEstado({ tipo: 'invalido' })
        setEstado({ tipo: 'previa', previa })
      })
      .catch(() => setEstado({ tipo: 'invalido' }))
  }, [codigo, carregando])

  async function entrar() {
    if (!codigo) return
    setErro(null)
    setEntrando(true)
    try {
      const id = sessao ? await aceitarConvite(supabase, codigo) : await entrarComoConvidado(supabase, codigo, nome.trim())
      abrirViagem(id)
    } catch (e) {
      // "anonymous_provider_disabled": falta ligar o login anônimo no painel do Supabase
      const desligado = (e as { code?: string }).code === 'anonymous_provider_disabled'
      setErro(desligado ? 'Entrar sem conta está desligado agora. Toque em "Já tenho conta" pra entrar.' : 'Não deu pra entrar. Confira a internet e tente de novo.')
      setEntrando(false)
    }
  }

  if (estado.tipo === 'carregando') return <Carregando texto="Abrindo o convite…" />

  if (estado.tipo === 'invalido') {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-fundo px-8">
        <StatusBar style="dark" />
        <Malinha tamanho={120} humor="pensando" />
        <Text className="text-center font-display text-[26px] text-texto">Convite inválido</Text>
        <Text className="text-center font-body text-[14px] leading-5 text-corpo">Esse link expirou ou não existe. Peça um novo pra quem te convidou.</Text>
        <View className="self-stretch">
          <Botao titulo="Voltar pro início" aoTocar={() => router.replace('/')} />
        </View>
      </View>
    )
  }

  const { previa } = estado
  const quando = previa.dataInicio ? periodo(previa.dataInicio, previa.dataFim) : null
  const quem = previa.membros.slice(0, 3).join(', ') + (previa.membros.length > 3 ? ` e mais ${previa.membros.length - 3}` : '')

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 32, paddingHorizontal: 24, paddingBottom: insets.bottom + 24, gap: 18 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center">
          <Malinha tamanho={110} humor="feliz" />
        </View>
        <View className="gap-2">
          <Text className="font-body-bold text-[12px] uppercase tracking-wider text-caramelo">Você foi convidado pra viagem</Text>
          <Text className="font-display text-[34px] leading-[38px] text-texto">{previa.nome}</Text>
        </View>

        <View className="gap-2.5">
          {quando ? <Linha Icone={CalendarDays} texto={quando} /> : null}
          {previa.destinos.length > 0 ? <Linha Icone={MapPin} texto={previa.destinos.join(' → ')} /> : null}
          {previa.membros.length > 0 ? (
            <Linha Icone={Users} texto={`${quem} já ${previa.membros.length === 1 ? 'está' : 'estão'} no comboio`} />
          ) : null}
        </View>

        {previa.jaSouMembro ? (
          <Botao titulo="Abrir a viagem" aoTocar={() => abrirViagem(previa.viagemId)} />
        ) : (
          <>
            {!sessao ? (
              <View className="gap-2">
                <Text className="font-body-bold text-[14px] text-texto">Como te chamam?</Text>
                <Campo
                  icone={<User size={20} color={cor.suave} />}
                  placeholder="Seu nome"
                  value={nome}
                  onChangeText={setNome}
                  maxLength={40}
                  autoComplete="given-name"
                  onSubmitEditing={entrar}
                />
                <Text className="font-body text-[12px] leading-[18px] text-suave">Sem e-mail e sem senha. Dá pra criar sua conta depois, sem perder nada.</Text>
              </View>
            ) : null}

            {erro ? <Text className="font-body-medium text-[13px] text-vermelho">{erro}</Text> : null}

            <Botao titulo="Entrar na viagem" aoTocar={entrar} carregando={entrando} desabilitado={!sessao && !nome.trim()} />

            {!sessao ? (
              <Pressable
                onPress={() => {
                  // Depois do login, volta pra este convite
                  conviteDepoisDoLogin.codigo = codigo ?? null
                  router.push('/login')
                }}
                className="items-center py-2"
              >
                <Text className="font-body-semibold text-[14px] text-couro">Já tenho conta</Text>
              </Pressable>
            ) : null}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function Linha({ Icone, texto }: { Icone: typeof Users; texto: string }) {
  return (
    <View className="flex-row items-start gap-2.5">
      <Icone size={18} color={cor.couro} />
      <Text className="flex-1 font-body text-[14px] leading-5 text-corpo">{texto}</Text>
    </View>
  )
}

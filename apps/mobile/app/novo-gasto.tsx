import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Check, X } from 'lucide-react-native'
import { dividirIgual, formatarDinheiro, lerValor, salvarGasto } from '@together/core'
import { CATEGORIAS } from '../src/dados/contas'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { hojeIso, primeiroNome } from '../src/lib/formato'
import { supabase } from '../src/lib/supabase'
import { novoId } from '../src/lib/id'
import { Avatar, Botao, BotaoRedondo, Campo, RotuloDeSecao } from '../src/ui/pecas'
import { cor } from '../theme'

// Lançar gasto (botão "Adicionar gasto" das Contas). Divide igual entre quem a pessoa marcar.
// Moeda = a principal da viagem (outras moedas e divisão personalizada seguem no site por enquanto).
export default function NovoGasto() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { atual: viagem, meuId } = useViagemAtual()
  const [descricao, setDescricao] = useState('')
  const [valorTexto, setValorTexto] = useState('')
  const [categoria, setCategoria] = useState('alimentacao')
  // A viagem pode chegar depois da tela abrir: enquanto a pessoa não mexer, vale "eu" e "todo mundo"
  const [pagoPorEscolhido, setPagoPor] = useState<string | null>(null)
  const [entreEscolhido, setEntre] = useState<string[] | null>(null)
  const [pessoal, setPessoal] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  if (!viagem) return null
  const pagoPor = pagoPorEscolhido ?? meuId
  const entre = entreEscolhido ?? viagem.membros.map((m) => m.id)
  const valor = lerValor(valorTexto)
  const pronto = descricao.trim().length > 0 && valor != null && valor > 0 && (pessoal || entre.length > 0)
  const fechar = () => (router.canGoBack() ? router.back() : router.replace('/contas'))

  async function salvar() {
    if (!pronto || valor == null || !viagem) return
    setErro(null)
    setSalvando(true)
    try {
      await salvarGasto(supabase, viagem.id, {
        id: novoId(),
        descricao: descricao.trim(),
        valor,
        moeda: viagem.moeda,
        categoria,
        data: hojeIso(),
        pagoPor: pessoal ? meuId : pagoPor,
        pessoal,
        divisoes: pessoal ? [] : dividirIgual(valor, entre, pagoPor),
      })
      fechar()
    } catch {
      setErro('Não deu pra salvar o gasto. Confira a internet e tente de novo.')
      setSalvando(false)
    }
  }

  const alternar = (id: string) => setEntre(entre.includes(id) ? entre.filter((x) => x !== id) : [...entre, id])
  const nome = (id: string, n: string) => (id === meuId ? 'Você' : primeiroNome(n))

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-fundo">
      <View className="flex-row items-center justify-between px-5" style={{ paddingTop: insets.top + 8 }}>
        <BotaoRedondo aoTocar={fechar}>
          <X size={20} color={cor.texto} />
        </BotaoRedondo>
        <Text className="font-body-semibold text-[14px] text-suave">{viagem.nome}</Text>
        <View className="w-11" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }} keyboardShouldPersistTaps="handled">
        <Text className="font-display text-[32px] leading-[36px] text-texto">Novo gasto</Text>

        <View className="items-center rounded-[20px] bg-areia py-6">
          <Text className="font-body-semibold text-[13px] text-corpo">Quanto foi?</Text>
          <TextInput
            value={valorTexto}
            onChangeText={setValorTexto}
            placeholder="0,00"
            placeholderTextColor={cor.tracejado}
            keyboardType="decimal-pad"
            autoFocus
            className="mt-1 text-center font-display text-[46px] text-texto"
            style={{ outlineStyle: 'none', minWidth: 200 } as object}
          />
          <Text className="font-body text-[13px] text-suave">{valor ? formatarDinheiro(valor, viagem.moeda) : viagem.moeda}</Text>
        </View>

        <Campo placeholder="O que foi? (ex.: Jantar no Lampião)" value={descricao} onChangeText={setDescricao} />

        <RotuloDeSecao>Categoria</RotuloDeSecao>
        <View className="-mt-2 flex-row flex-wrap gap-2">
          {CATEGORIAS.map((c) => (
            <Chip key={c.chave} ativo={categoria === c.chave} aoTocar={() => setCategoria(c.chave)}>
              {c.nome}
            </Chip>
          ))}
        </View>

        <Pressable onPress={() => setPessoal((p) => !p)} className="flex-row items-center gap-3 py-1">
          <Caixinha marcada={pessoal} />
          <View className="flex-1">
            <Text className="font-body-bold text-[15px] text-texto">Gasto só meu</Text>
            <Text className="font-body text-[13px] text-suave">Não divide e só você vê.</Text>
          </View>
        </Pressable>

        {!pessoal ? (
          <>
            <RotuloDeSecao>Quem pagou</RotuloDeSecao>
            <View className="-mt-2 flex-row flex-wrap gap-2">
              {viagem.membros.map((m, i) => (
                <Chip key={m.id} ativo={pagoPor === m.id} aoTocar={() => setPagoPor(m.id)} avatar={<Avatar nome={m.nome} indice={i} tamanho={24} />}>
                  {nome(m.id, m.nome)}
                </Chip>
              ))}
            </View>

            <RotuloDeSecao>Dividir igual entre</RotuloDeSecao>
            <View className="-mt-1">
              {viagem.membros.map((m, i) => (
                <Pressable key={m.id} onPress={() => alternar(m.id)} className="flex-row items-center gap-3 py-2.5">
                  <Avatar nome={m.nome} indice={i} tamanho={40} />
                  <Text className="flex-1 font-body-bold text-[15px] text-texto">{nome(m.id, m.nome)}</Text>
                  {valor && entre.includes(m.id) ? (
                    <Text className="font-body text-[13px] text-suave">
                      {formatarDinheiro(dividirIgual(valor, entre, pagoPor).find((d) => d.usuarioId === m.id)?.valor ?? 0, viagem.moeda)}
                    </Text>
                  ) : null}
                  <Caixinha marcada={entre.includes(m.id)} />
                </Pressable>
              ))}
            </View>
          </>
        ) : null}

        {erro ? <Text className="font-body-medium text-[13px] text-vermelho">{erro}</Text> : null}
      </ScrollView>

      <View className="px-5 pt-3" style={{ paddingBottom: insets.bottom + 16 }}>
        <Botao titulo="Salvar gasto" aoTocar={salvar} desabilitado={!pronto} carregando={salvando} />
      </View>
    </KeyboardAvoidingView>
  )
}

function Chip({ ativo, aoTocar, avatar, children }: { ativo: boolean; aoTocar: () => void; avatar?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Pressable
      onPress={aoTocar}
      className={`h-9 flex-row items-center gap-1.5 rounded-xl border ${avatar ? 'pl-1 pr-3' : 'px-3.5'} ${ativo ? 'border-couro bg-couro' : 'border-borda bg-cartao'}`}
    >
      {avatar}
      <Text className={`font-body-semibold text-[13px] ${ativo ? 'text-white' : 'text-texto'}`}>{children}</Text>
    </Pressable>
  )
}

function Caixinha({ marcada }: { marcada: boolean }) {
  return (
    <View className={`h-[26px] w-[26px] items-center justify-center rounded-lg border-[1.5px] ${marcada ? 'border-couro bg-couro' : 'border-tracejado bg-cartao'}`}>
      {marcada ? <Check size={16} color="#fff" strokeWidth={2.4} /> : null}
    </View>
  )
}

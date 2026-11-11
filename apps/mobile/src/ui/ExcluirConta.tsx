import { useState } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { ChevronRight, Trash2, X } from './icones'
import { supabase } from '../lib/supabase'
import { Botao, Campo, Cartao, IconeQuadrado } from './pecas'
import { cor } from '../../theme'

// Excluir minha conta dentro do app (spec 089; a App Store e o Google Play exigem).
// Usa a mesma função `excluir-conta` do site (supabase/functions/excluir-conta) e pede pra
// escrever EXCLUIR antes, igual ao site (apps/web/src/features/privacidade/MinhaPrivacidade.tsx).

const O_QUE_ACONTECE = [
  'Você sai de todas as viagens. Se for o único ADM, o ADM passa pra quem entrou primeiro.',
  'Viagem em que só você está é apagada.',
  'Ficha, documentos, mala, orçamento pessoal, carteira e gastos pessoais são apagados.',
  'Gastos divididos, fotos e posts continuam pro grupo, com o nome "Conta excluída", pra não bagunçar as contas de ninguém.',
  'Não dá pra desfazer. Se quiser seus dados antes, baixe no Perfil do site.',
]

// A função devolve { erro } com uma frase pensada pra pessoa ler (ex.: só sobram convidados).
// Quando a resposta não é 2xx, o Supabase guarda essa resposta em `error.context`.
async function mensagemDoErro(erro: unknown): Promise<string | null> {
  const resposta = (erro as { context?: { json?: () => Promise<{ erro?: string }> } } | null)?.context
  if (!resposta?.json) return null
  const corpo = await resposta.json().catch(() => null)
  return corpo?.erro ?? null
}

export function ExcluirConta({ usuarioId }: { usuarioId: string }) {
  const router = useRouter()
  const [aberta, setAberta] = useState(false)
  const [confirmacao, setConfirmacao] = useState('')
  const [trabalhando, setTrabalhando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const confirmou = confirmacao.trim().toUpperCase() === 'EXCLUIR'

  function fechar() {
    if (trabalhando) return
    setAberta(false)
    setConfirmacao('')
    setErro(null)
  }

  async function excluir() {
    if (!confirmou || trabalhando) return
    setErro(null)
    setTrabalhando(true)
    // Os avisos do app (push_expo) não saem na função do banco: apaga os desta conta antes
    const { error: erroAvisos } = await supabase.from('push_expo').delete().eq('usuario_id', usuarioId)
    if (erroAvisos) console.error('Erro ao apagar os avisos do celular:', erroAvisos)

    const { data, error } = await supabase.functions.invoke('excluir-conta', { body: { confirmar: 'EXCLUIR' } })
    if (error || data?.erro) {
      console.error('Erro ao excluir a conta:', error ?? data?.erro)
      setErro((await mensagemDoErro(error)) ?? data?.erro ?? 'Não deu pra excluir a conta agora. Tente de novo.')
      setTrabalhando(false)
      return
    }
    // A conta já não existe no servidor: só limpa a sessão guardada no aparelho
    await supabase.auth.signOut({ scope: 'local' }).catch((e) => console.error('Erro ao limpar a sessão:', e))
    router.replace('/comecar')
  }

  return (
    <>
      <Pressable onPress={() => setAberta(true)} accessibilityRole="button" className="active:opacity-90">
        <Cartao className="flex-row items-center gap-3 p-4">
          <IconeQuadrado>
            <Trash2 size={20} color={cor.vermelho} />
          </IconeQuadrado>
          <Text className="flex-1 font-body-bold text-[15px] text-vermelho">Excluir minha conta</Text>
          <ChevronRight size={20} color={cor.suave} />
        </Cartao>
      </Pressable>

      {aberta ? (
        <Modal visible transparent animationType="slide" onRequestClose={fechar}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-end bg-black/30">
            <Pressable className="flex-1" onPress={fechar} accessibilityLabel="Fechar" />
            <View className="max-h-[90%] rounded-t-[28px] bg-fundo">
              <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, gap: 12 }} keyboardShouldPersistTaps="handled">
                <View className="flex-row items-center justify-between">
                  <Text className="font-display text-[22px] text-texto">Excluir minha conta</Text>
                  <Pressable onPress={fechar} accessibilityLabel="Fechar" className="h-10 w-10 items-center justify-center rounded-full bg-cartao active:opacity-80">
                    <X size={20} color={cor.texto} />
                  </Pressable>
                </View>

                <Text className="font-body-semibold text-[14px] text-texto">O que acontece:</Text>
                <View className="gap-2">
                  {O_QUE_ACONTECE.map((item) => (
                    <View key={item} className="flex-row gap-2.5">
                      <View className="mt-[7px] h-1.5 w-1.5 rounded-full bg-couro" />
                      <Text className="flex-1 font-body text-[14px] leading-[20px] text-corpo">{item}</Text>
                    </View>
                  ))}
                </View>

                <View className="gap-2.5 rounded-2xl bg-vermelho-fundo p-3.5">
                  <Text className="font-body-semibold text-[14px] text-texto">Pra confirmar, escreva EXCLUIR</Text>
                  <Campo
                    value={confirmacao}
                    onChangeText={setConfirmacao}
                    placeholder="EXCLUIR"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    autoComplete="off"
                    accessibilityLabel="Escreva EXCLUIR pra confirmar"
                    onSubmitEditing={excluir}
                  />
                  {erro ? <Text className="font-body-medium text-[13px] text-vermelho">{erro}</Text> : null}
                  <View className="flex-row gap-2.5">
                    <View className="flex-1">
                      <Botao compacto tipo="secundario" titulo="Manter conta" aoTocar={fechar} desabilitado={trabalhando} />
                    </View>
                    <View className="flex-1">
                      <Botao compacto titulo={trabalhando ? 'Excluindo…' : 'Excluir de vez'} aoTocar={excluir} desabilitado={!confirmou} carregando={trabalhando} />
                    </View>
                  </View>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      ) : null}
    </>
  )
}

import { useEffect, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { Send, Trash2 } from 'lucide-react-native'
import { apagarComentarioDoItem, buscarComentariosDoItem, comentarNoItem, type AlvoDoComentario, type ComentarioDeItem, type Pessoa } from '@together/core'
import { supabase } from '../lib/supabase'
import { primeiroNome } from '../lib/formato'
import { cor } from '../../theme'

// Spec 025 no mobile: conversa curta num gasto (ou lugar/hospedagem). Quem escreveu ou o ADM apaga.
type Props = { viagemId: string; alvo: AlvoDoComentario; membros: Pessoa[]; meuId: string; euSouAdm: boolean; aoMudar?: (total: number) => void }
export function ComentariosDoItem({ viagemId, alvo, membros, meuId, euSouAdm, aoMudar }: Props) {
  const [lista, setLista] = useState<ComentarioDeItem[] | null>(null)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    let vivo = true
    buscarComentariosDoItem(supabase, { tipo: alvo.tipo, id: alvo.id })
      .then((l) => vivo && setLista(l))
      .catch(() => vivo && setLista([]))
    return () => {
      vivo = false
    }
  }, [alvo.tipo, alvo.id])

  const nome = (id: string) => (id === meuId ? 'Você' : primeiroNome(membros.find((m) => m.id === id)?.nome ?? 'Alguém'))

  async function enviar() {
    const limpo = texto.trim()
    if (!limpo || enviando) return
    setEnviando(true)
    try {
      const novo = await comentarNoItem(supabase, viagemId, alvo, limpo)
      const nova = [...(lista ?? []), novo]
      setLista(nova)
      aoMudar?.(nova.length)
      setTexto('')
    } catch (erro) {
      console.error('Erro ao comentar:', erro)
    } finally {
      setEnviando(false)
    }
  }

  async function apagar(id: string) {
    try {
      await apagarComentarioDoItem(supabase, id)
      const nova = (lista ?? []).filter((c) => c.id !== id)
      setLista(nova)
      aoMudar?.(nova.length)
    } catch (erro) {
      console.error('Erro ao apagar comentário:', erro)
    }
  }

  return (
    <View className="gap-2 pb-3">
      {(lista ?? []).map((c) => (
        <View key={c.id} className="flex-row items-start gap-2 rounded-xl bg-areia px-3 py-2">
          <Text className="min-w-0 flex-1 font-body text-[13px] leading-5 text-texto">
            <Text className="font-body-semibold">{nome(c.autor)}</Text> {c.texto}
          </Text>
          {c.autor === meuId || euSouAdm ? (
            <Pressable onPress={() => apagar(c.id)} hitSlop={8} accessibilityLabel="Apagar comentário">
              <Trash2 size={14} color={cor.suave} />
            </Pressable>
          ) : null}
        </View>
      ))}
      <View className="flex-row items-center gap-2 rounded-xl border border-borda px-3 py-1.5">
        <TextInput
          value={texto}
          onChangeText={(t) => setTexto(t.slice(0, 500))}
          placeholder="Comentar…"
          placeholderTextColor={cor.suave}
          className="min-w-0 flex-1 font-body text-[13px] text-texto"
          style={{ outlineStyle: 'none' } as object}
          onSubmitEditing={enviar}
        />
        <Pressable onPress={enviar} hitSlop={8} disabled={enviando || !texto.trim()} accessibilityLabel="Enviar comentário">
          <Send size={16} color={texto.trim() ? cor.couro : cor.tracejado} />
        </Pressable>
      </View>
    </View>
  )
}

import { useEffect, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { Check, Megaphone, Plus, Trash2, X } from 'lucide-react-native'
import { apagarAviso, buscarAvisos, criarAviso, type Aviso } from '@together/core'
import { supabase } from '../lib/supabase'
import { cor } from '../../theme'

// Spec 019: recados do ADM fixados no topo da viagem. Todo o comboio lê;
// só o ADM cria e apaga (a edição mais fininha fica no site).
export function Avisos({ viagemId, euSouAdm }: { viagemId: string; euSouAdm: boolean }) {
  const [avisos, setAvisos] = useState<Aviso[] | null>(null)
  const [compondo, setCompondo] = useState(false)
  const [texto, setTexto] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    let vivo = true
    buscarAvisos(supabase, viagemId)
      .then((lista) => vivo && setAvisos(lista))
      .catch(() => vivo && setAvisos([]))
    return () => {
      vivo = false
    }
  }, [viagemId])

  if (avisos === null) return null
  if (avisos.length === 0 && !euSouAdm) return null

  async function salvar() {
    const limpo = texto.trim()
    if (!limpo || salvando) return
    setSalvando(true)
    try {
      const novo = await criarAviso(supabase, viagemId, limpo)
      setAvisos((atual) => [novo, ...(atual ?? [])])
      setTexto('')
      setCompondo(false)
    } catch (erro) {
      console.error('Erro ao salvar o aviso:', erro)
    } finally {
      setSalvando(false)
    }
  }

  async function remover(id: string) {
    try {
      await apagarAviso(supabase, id)
      setAvisos((atual) => (atual ?? []).filter((a) => a.id !== id))
    } catch (erro) {
      console.error('Erro ao apagar o aviso:', erro)
    }
  }

  return (
    <View className="gap-2">
      {avisos.map((a) => (
        <View key={a.id} className="flex-row items-start gap-2.5 rounded-2xl border border-borda px-3.5 py-3" style={{ backgroundColor: '#FFF4E1' }}>
          <Megaphone size={18} color={cor.caramelo} style={{ marginTop: 1 }} />
          <Text className="min-w-0 flex-1 font-body text-[14px] leading-5 text-texto">{a.texto}</Text>
          {euSouAdm ? (
            <Pressable onPress={() => remover(a.id)} hitSlop={8} accessibilityLabel="Apagar aviso">
              <Trash2 size={16} color={cor.suave} />
            </Pressable>
          ) : null}
        </View>
      ))}

      {euSouAdm && compondo ? (
        <View className="flex-row items-center gap-2 rounded-2xl border border-borda px-3.5 py-2" style={{ backgroundColor: '#FFF4E1' }}>
          <Megaphone size={18} color={cor.caramelo} />
          <TextInput
            value={texto}
            onChangeText={(t) => setTexto(t.slice(0, 280))}
            placeholder="Ex.: Passaporte na mão amanhã!"
            placeholderTextColor={cor.suave}
            className="min-w-0 flex-1 font-body text-[14px] text-texto"
            style={{ outlineStyle: 'none' } as object}
            autoFocus
            onSubmitEditing={salvar}
          />
          <Pressable onPress={salvar} hitSlop={8} disabled={salvando || !texto.trim()} accessibilityLabel="Salvar aviso">
            <Check size={18} color={texto.trim() ? cor.couro : cor.tracejado} />
          </Pressable>
          <Pressable onPress={() => { setCompondo(false); setTexto('') }} hitSlop={8} accessibilityLabel="Cancelar">
            <X size={18} color={cor.suave} />
          </Pressable>
        </View>
      ) : euSouAdm ? (
        <Pressable onPress={() => setCompondo(true)} className="flex-row items-center gap-1.5 self-start rounded-full border border-dashed border-tracejado px-3 py-1.5 active:opacity-80">
          <Plus size={15} color={cor.couro} />
          <Text className="font-body-semibold text-[13px] text-couro">{avisos.length ? 'Novo aviso' : 'Fixar um aviso pro comboio'}</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

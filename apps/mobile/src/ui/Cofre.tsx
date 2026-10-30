import { useEffect, useState } from 'react'
import { Linking, Pressable, Text, View } from 'react-native'
import { FileText, Lock } from 'lucide-react-native'
import type { Tables } from '@together/core'
import { supabase } from '../lib/supabase'
import { cor } from '../../theme'

type Arquivo = Tables<'arquivos_viagem'>

// Spec 028 no mobile: abrir as reservas, ingressos e bilhetes guardados no cofre.
// Só leitura (guardar arquivo novo continua no site). O link vale 1 hora (bucket privado).
export function Cofre({ viagemId }: { viagemId: string }) {
  const [arquivos, setArquivos] = useState<Arquivo[] | null>(null)
  const [abrindo, setAbrindo] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    supabase
      .from('arquivos_viagem')
      .select('*')
      .eq('viagem_id', viagemId)
      .order('criado_em', { ascending: false })
      .then(({ data }) => vivo && setArquivos(data ?? []))
    return () => {
      vivo = false
    }
  }, [viagemId])

  if (!arquivos || arquivos.length === 0) return null

  async function abrir(a: Arquivo) {
    setAbrindo(a.id)
    const { data } = await supabase.storage.from('cofre').createSignedUrl(a.caminho, 60 * 60)
    setAbrindo(null)
    if (data?.signedUrl) Linking.openURL(data.signedUrl)
  }

  return (
    <View className="gap-1 rounded-2xl bg-cartao p-4" style={{ boxShadow: '0 4px 14px rgba(74,46,20,0.06)' }}>
      <View className="mb-1 flex-row items-center gap-2">
        <Lock size={18} color={cor.couro} />
        <Text className="font-body-bold text-[15px] text-texto">Cofre</Text>
      </View>
      {arquivos.slice(0, 8).map((a) => (
        <Pressable key={a.id} onPress={() => abrir(a)} className="flex-row items-center gap-2.5 border-t border-linha py-2 active:opacity-80" accessibilityLabel={`Abrir ${a.nome}`}>
          <FileText size={16} color={cor.suave} />
          <Text className="min-w-0 flex-1 font-body-medium text-[14px] text-texto" numberOfLines={1}>
            {a.nome}
          </Text>
          <Text className="font-body text-[12px] text-suave">{abrindo === a.id ? 'Abrindo…' : 'Abrir'}</Text>
        </Pressable>
      ))}
    </View>
  )
}

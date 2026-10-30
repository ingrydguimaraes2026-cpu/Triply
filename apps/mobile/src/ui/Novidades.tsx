import { useEffect, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Bell } from 'lucide-react-native'
import { buscarAtividades, buscarVistoEm, contarNovas, descreverAtividade, marcarAtividadesComoVistas, type Atividade, type Pessoa } from '@together/core'
import { supabase } from '../lib/supabase'
import { primeiroNome } from '../lib/formato'
import { cor } from '../../theme'

// Spec 031 no mobile: o que mudou na viagem desde a última vez (o "sino" do site).
// Mostra as 5 últimas novidades de outras pessoas e "Marcar como visto".
export function Novidades({ viagemId, meuId, membros }: { viagemId: string; meuId: string; membros: Pessoa[] }) {
  const [atividades, setAtividades] = useState<Atividade[] | null>(null)
  const [vistoEm, setVistoEm] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    Promise.all([buscarAtividades(supabase, viagemId, 30), buscarVistoEm(supabase, viagemId)])
      .then(([lista, visto]) => {
        if (!vivo) return
        setAtividades(lista)
        setVistoEm(visto)
      })
      .catch(() => vivo && setAtividades([]))
    return () => {
      vivo = false
    }
  }, [viagemId])

  if (!atividades) return null
  const novas = atividades.filter((a) => a.autor !== meuId && (!vistoEm || a.criado_em > vistoEm))
  if (contarNovas(atividades, vistoEm, meuId) === 0) return null
  const nome = (id: string | null) => primeiroNome(membros.find((m) => m.id === id)?.nome ?? 'Alguém')

  async function marcarVisto() {
    const agora = new Date().toISOString()
    setVistoEm(agora)
    await marcarAtividadesComoVistas(supabase, viagemId, agora).catch(() => {})
  }

  return (
    <View className="gap-2 rounded-2xl border border-borda bg-cartao p-4">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Bell size={18} color={cor.caramelo} />
          <Text className="font-body-bold text-[15px] text-texto">
            {novas.length === 1 ? '1 novidade' : `${novas.length} novidades`}
          </Text>
        </View>
        <Pressable onPress={marcarVisto} hitSlop={8} accessibilityLabel="Marcar como visto">
          <Text className="font-body-semibold text-[13px] text-couro">Marcar como visto</Text>
        </Pressable>
      </View>
      {novas.slice(0, 5).map((a) => {
        const d = descreverAtividade(a)
        return (
          <Text key={a.id} className="font-body text-[14px] leading-5 text-corpo">
            <Text className="font-body-semibold text-texto">{nome(a.autor)}</Text> {d.verbo}
            {d.titulo ? ` «${d.titulo}»` : ''}
          </Text>
        )
      })}
    </View>
  )
}

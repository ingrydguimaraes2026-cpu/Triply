import { useEffect, useState } from 'react'
import { Linking, Pressable, Text, TextInput, View } from 'react-native'
import { MapPin, Plus, Share2, Trash2 } from 'lucide-react-native'
import { apagarPontoDeEncontro, buscarPontosDeEncontro, criarPontoDeEncontro, linkDoMapa, type PontoDeEncontro as Ponto } from '@together/core'
import { supabase } from '../lib/supabase'
import { compartilharItem } from '../lib/compartilhar'
import { diaCurto, hora } from '../lib/formato'
import { Cartao } from './pecas'
import { cor } from '../../theme'

// Roadmap #7: ponto de encontro — onde e que horas o comboio se encontra, com link pro mapa.
// Todo o comboio vê e cria; quem criou ou o ADM apaga. O horário é definido no site por enquanto.
export function PontoDeEncontro({ viagemId, meuId, euSouAdm }: { viagemId: string; meuId: string; euSouAdm: boolean }) {
  const [pontos, setPontos] = useState<Ponto[] | null>(null)
  const [local, setLocal] = useState('')
  const [observacao, setObservacao] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    let vivo = true
    buscarPontosDeEncontro(supabase, viagemId)
      .then((lista) => vivo && setPontos(lista))
      .catch(() => vivo && setPontos([]))
    return () => {
      vivo = false
    }
  }, [viagemId])

  if (pontos === null) return null

  const podeApagar = (p: Ponto) => p.criado_por === meuId || euSouAdm

  async function adicionar() {
    const limpo = local.trim()
    if (!limpo || salvando) return
    setSalvando(true)
    try {
      const novo = await criarPontoDeEncontro(supabase, viagemId, { local: limpo, observacao: observacao || null })
      setPontos((atual) => ordenar([...(atual ?? []), novo]))
      setLocal('')
      setObservacao('')
    } catch (erro) {
      console.error('Erro ao criar o ponto de encontro:', erro)
    } finally {
      setSalvando(false)
    }
  }

  async function remover(p: Ponto) {
    if (!podeApagar(p)) return
    const antes = pontos
    setPontos((atual) => (atual ?? []).filter((x) => x.id !== p.id))
    try {
      await apagarPontoDeEncontro(supabase, p.id)
    } catch {
      setPontos(antes)
    }
  }

  return (
    <Cartao className="p-5">
      <View className="mb-3 flex-row items-center gap-2">
        <MapPin size={18} color={cor.couro} />
        <Text className="font-body-bold text-[15px] text-texto">Ponto de encontro</Text>
      </View>

      {pontos.length === 0 ? (
        <Text className="font-body text-[13px] leading-5 text-corpo">Combine onde e que horas se encontrar (ex.: "portão 3 da estação, 9h").</Text>
      ) : (
        <View className="gap-1">
          {pontos.map((p) => (
            <View key={p.id} className="flex-row items-start gap-2.5 py-1.5">
              <View className="min-w-0 flex-1">
                <Pressable onPress={() => Linking.openURL(linkDoMapa(p))} className="flex-row items-center gap-1.5">
                  <MapPin size={14} color={cor.couro} />
                  <Text className="min-w-0 flex-1 font-body-bold text-[14px] text-couro">{p.local}</Text>
                </Pressable>
                {p.quando ? <Text className="mt-0.5 font-body text-[12px] text-texto">{diaCurto(new Date(p.quando))} · {hora(p.quando)}</Text> : null}
                {p.observacao ? <Text className="mt-0.5 font-body text-[12px] text-suave">{p.observacao}</Text> : null}
              </View>
              <Pressable
                onPress={() => compartilharItem(viagemId, { tipo: 'ponto', id: p.id, titulo: p.local }).catch(() => {})}
                hitSlop={8}
                accessibilityLabel="Compartilhar ponto de encontro"
              >
                <Share2 size={15} color={cor.suave} />
              </Pressable>
              {podeApagar(p) ? (
                <Pressable onPress={() => remover(p)} hitSlop={8} accessibilityLabel="Apagar ponto de encontro">
                  <Trash2 size={15} color={cor.suave} />
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      )}

      <View className="mt-3 border-t border-borda pt-3 gap-2">
        <TextInput
          value={local}
          onChangeText={(x) => setLocal(x.slice(0, 200))}
          placeholder="Onde? (ex.: portão 3 da estação)"
          placeholderTextColor={cor.suave}
          className="h-10 rounded-xl border border-borda px-3 font-body text-[14px] text-texto"
          style={{ outlineStyle: 'none' } as object}
        />
        <View className="flex-row items-center gap-2">
          <TextInput
            value={observacao}
            onChangeText={(x) => setObservacao(x.slice(0, 280))}
            placeholder="Observação (opcional)"
            placeholderTextColor={cor.suave}
            className="h-10 min-w-0 flex-1 rounded-xl border border-borda px-3 font-body text-[14px] text-texto"
            style={{ outlineStyle: 'none' } as object}
            onSubmitEditing={adicionar}
          />
          <Pressable
            onPress={adicionar}
            disabled={salvando || !local.trim()}
            className="h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: local.trim() ? cor.couro : cor.borda }}
            accessibilityLabel="Adicionar ponto de encontro"
          >
            <Plus size={18} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Cartao>
  )
}

// Por horário combinado (sem horário no fim), depois por criação
function ordenar(lista: Ponto[]): Ponto[] {
  return [...lista].sort((a, b) => {
    if ((a.quando ?? '') !== (b.quando ?? '')) return (a.quando ?? '9999').localeCompare(b.quando ?? '9999')
    return a.criado_em.localeCompare(b.criado_em)
  })
}

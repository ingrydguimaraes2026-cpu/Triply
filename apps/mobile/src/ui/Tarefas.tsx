import { useEffect, useMemo, useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { Check, ListChecks, Plus, Trash2 } from 'lucide-react-native'
import {
  alternarTarefa,
  apagarTarefa,
  buscarTarefas,
  criarTarefa,
  editarTarefa,
  type Tarefa,
} from '@together/core'
import { supabase } from '../lib/supabase'
import { diaCurto } from '../lib/formato'
import { Cartao } from './pecas'
import { cor } from '../../theme'

type Pessoa = { id: string; nome: string }

// Spec 020: checklist da viagem com responsável ("quem compra o seguro?").
// Todo o comboio vê e cria; quem criou, o responsável ou o ADM marcam e editam.
// O prazo só é editado no site por enquanto; aqui ele aparece se já estiver definido.
export function Tarefas({ viagemId, membros, meuId, euSouAdm }: { viagemId: string; membros: Pessoa[]; meuId: string; euSouAdm: boolean }) {
  const [tarefas, setTarefas] = useState<Tarefa[] | null>(null)
  const [titulo, setTitulo] = useState('')
  const [responsavel, setResponsavel] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    let vivo = true
    buscarTarefas(supabase, viagemId)
      .then((lista) => vivo && setTarefas(lista))
      .catch(() => vivo && setTarefas([]))
    return () => {
      vivo = false
    }
  }, [viagemId])

  const nomePorId = useMemo(() => new Map(membros.map((m) => [m.id, m.nome])), [membros])
  const hoje = new Date().toISOString().slice(0, 10)

  if (tarefas === null) return null

  const podeMexer = (t: Tarefa) => t.criado_por === meuId || t.responsavel_id === meuId || euSouAdm
  const podeApagar = (t: Tarefa) => t.criado_por === meuId || euSouAdm

  async function adicionar() {
    const limpo = titulo.trim()
    if (!limpo || salvando) return
    setSalvando(true)
    try {
      const nova = await criarTarefa(supabase, viagemId, { titulo: limpo, responsavelId: responsavel || null })
      setTarefas((atual) => ordenar([...(atual ?? []), nova]))
      setTitulo('')
      setResponsavel('')
    } catch (erro) {
      console.error('Erro ao criar a tarefa:', erro)
    } finally {
      setSalvando(false)
    }
  }

  async function alternar(t: Tarefa) {
    if (!podeMexer(t)) return
    const feita = !t.feita
    setTarefas((atual) => ordenar((atual ?? []).map((x) => (x.id === t.id ? { ...x, feita } : x))))
    try {
      await alternarTarefa(supabase, t.id, feita)
    } catch {
      setTarefas((atual) => ordenar((atual ?? []).map((x) => (x.id === t.id ? { ...x, feita: !feita } : x))))
    }
  }

  async function remover(t: Tarefa) {
    if (!podeApagar(t)) return
    const antes = tarefas
    setTarefas((atual) => (atual ?? []).filter((x) => x.id !== t.id))
    try {
      await apagarTarefa(supabase, t.id)
    } catch {
      setTarefas(antes)
    }
  }

  async function trocarResponsavel(t: Tarefa, id: string) {
    if (!podeMexer(t)) return
    const responsavelId = (t.responsavel_id === id ? null : id) as string | null
    setTarefas((atual) => (atual ?? []).map((x) => (x.id === t.id ? { ...x, responsavel_id: responsavelId } : x)))
    try {
      await editarTarefa(supabase, t.id, { responsavelId })
    } catch (erro) {
      console.error('Erro ao trocar o responsável:', erro)
    }
  }

  return (
    <Cartao className="p-5">
      <View className="mb-3 flex-row items-center gap-2">
        <ListChecks size={18} color={cor.couro} />
        <Text className="font-body-bold text-[15px] text-texto">Tarefas</Text>
      </View>

      {tarefas.length === 0 ? (
        <Text className="font-body text-[13px] leading-5 text-corpo">Nada na lista ainda. Anote quem fica com o quê (seguro, van, ingressos…).</Text>
      ) : (
        <View className="gap-1">
          {tarefas.map((t) => {
            const atrasada = !t.feita && t.prazo && t.prazo < hoje
            return (
              <View key={t.id} className="flex-row items-start gap-2.5 py-1.5">
                <Pressable
                  onPress={() => alternar(t)}
                  disabled={!podeMexer(t)}
                  hitSlop={8}
                  accessibilityLabel={t.feita ? 'Desmarcar tarefa' : 'Marcar como feita'}
                  className="mt-0.5 h-5 w-5 items-center justify-center rounded-md border-[1.5px]"
                  style={{ borderColor: t.feita ? cor.couro : cor.tracejado, backgroundColor: t.feita ? cor.couro : 'transparent' }}
                >
                  {t.feita ? <Check size={13} color="#fff" /> : null}
                </Pressable>
                <View className="min-w-0 flex-1">
                  <Text className={`font-body text-[14px] ${t.feita ? 'text-suave line-through' : 'text-texto'}`}>{t.titulo}</Text>
                  <Text className="mt-0.5 font-body text-[12px] text-suave">
                    {t.responsavel_id ? nomePorId.get(t.responsavel_id) ?? 'Alguém' : 'Sem responsável'}
                    {t.prazo ? ` · ${atrasada ? 'atrasada ' : ''}${diaCurto(new Date(t.prazo))}` : ''}
                  </Text>
                </View>
                {podeApagar(t) ? (
                  <Pressable onPress={() => remover(t)} hitSlop={8} accessibilityLabel="Apagar tarefa">
                    <Trash2 size={15} color={cor.suave} />
                  </Pressable>
                ) : null}
              </View>
            )
          })}
        </View>
      )}

      {/* Quem adiciona escolhe o responsável tocando numa bolinha */}
      <View className="mt-3 border-t border-borda pt-3">
        <View className="flex-row items-center gap-2">
          <TextInput
            value={titulo}
            onChangeText={(x) => setTitulo(x.slice(0, 200))}
            placeholder="Nova tarefa"
            placeholderTextColor={cor.suave}
            className="h-10 min-w-0 flex-1 rounded-xl border border-borda px-3 font-body text-[14px] text-texto"
            style={{ outlineStyle: 'none' } as object}
            onSubmitEditing={adicionar}
          />
          <Pressable
            onPress={adicionar}
            disabled={salvando || !titulo.trim()}
            className="h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: titulo.trim() ? cor.couro : cor.borda }}
            accessibilityLabel="Adicionar tarefa"
          >
            <Plus size={18} color="#fff" />
          </Pressable>
        </View>
        {membros.length > 1 ? (
          <View className="mt-2 flex-row flex-wrap gap-1.5">
            <Chip ativo={responsavel === ''} rotulo="Ninguém" aoTocar={() => setResponsavel('')} />
            {membros.map((m) => (
              <Chip key={m.id} ativo={responsavel === m.id} rotulo={m.nome.split(' ')[0]} aoTocar={() => setResponsavel(m.id)} />
            ))}
          </View>
        ) : null}
      </View>
    </Cartao>
  )
}

function Chip({ ativo, rotulo, aoTocar }: { ativo: boolean; rotulo: string; aoTocar: () => void }) {
  return (
    <Pressable
      onPress={aoTocar}
      className={`rounded-full border px-3 py-1 ${ativo ? 'border-couro bg-couro' : 'border-borda bg-cartao'}`}
    >
      <Text className={`font-body-medium text-[12px] ${ativo ? 'text-white' : 'text-suave'}`}>{rotulo}</Text>
    </Pressable>
  )
}

function ordenar(lista: Tarefa[]): Tarefa[] {
  return [...lista].sort((a, b) => {
    if (a.feita !== b.feita) return a.feita ? 1 : -1
    if ((a.prazo ?? '') !== (b.prazo ?? '')) return (a.prazo ?? '9999').localeCompare(b.prazo ?? '9999')
    return a.criado_em.localeCompare(b.criado_em)
  })
}

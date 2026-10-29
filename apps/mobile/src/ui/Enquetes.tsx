import { useEffect, useState } from 'react'
import { Pressable, Switch, Text, TextInput, View } from 'react-native'
import { BarChart3, Check, Lock, Plus, Share2, Trash2, Unlock, X } from 'lucide-react-native'
import {
  apagarEnquete,
  buscarEnquetes,
  criarEnquete,
  fecharEnquete,
  votarEnquete,
  type Enquete,
} from '@together/core'
import { supabase } from '../lib/supabase'
import { compartilharItem } from '../lib/compartilhar'
import { Cartao } from './pecas'
import { cor } from '../../theme'

// Spec 021: enquetes rápidas pra decidir em grupo. Todo o comboio cria e vota;
// quem criou ou o ADM fecha e apaga.
export function Enquetes({ viagemId, meuId, euSouAdm }: { viagemId: string; meuId: string; euSouAdm: boolean }) {
  const [enquetes, setEnquetes] = useState<Enquete[] | null>(null)
  const [criando, setCriando] = useState(false)

  useEffect(() => {
    let vivo = true
    buscarEnquetes(supabase, viagemId)
      .then((lista) => vivo && setEnquetes(lista))
      .catch(() => vivo && setEnquetes([]))
    return () => {
      vivo = false
    }
  }, [viagemId])

  async function recarregar() {
    try {
      setEnquetes(await buscarEnquetes(supabase, viagemId))
    } catch {
      /* mantém o que tem */
    }
  }

  if (enquetes === null) return null

  async function votar(e: Enquete, opcaoId: string, jaVotei: boolean) {
    if (e.fechada) return
    const marcar = !jaVotei
    setEnquetes((atual) =>
      (atual ?? []).map((x) => {
        if (x.id !== e.id) return x
        return {
          ...x,
          opcoes: x.opcoes.map((o) => {
            if (o.id === opcaoId) {
              const semMim = o.votos.filter((v) => v !== meuId)
              return { ...o, votos: marcar ? [...semMim, meuId] : semMim }
            }
            if (!x.multipla && marcar) return { ...o, votos: o.votos.filter((v) => v !== meuId) }
            return o
          }),
        }
      }),
    )
    try {
      await votarEnquete(supabase, opcaoId, marcar)
    } catch {
      recarregar()
    }
  }

  async function fechar(e: Enquete) {
    setEnquetes((atual) => (atual ?? []).map((x) => (x.id === e.id ? { ...x, fechada: !e.fechada } : x)))
    try {
      await fecharEnquete(supabase, e.id, !e.fechada)
    } catch {
      recarregar()
    }
  }

  async function remover(e: Enquete) {
    const antes = enquetes
    setEnquetes((atual) => (atual ?? []).filter((x) => x.id !== e.id))
    try {
      await apagarEnquete(supabase, e.id)
    } catch {
      setEnquetes(antes)
    }
  }

  return (
    <Cartao className="p-5">
      <View className="mb-3 flex-row items-center gap-2">
        <BarChart3 size={18} color={cor.couro} />
        <Text className="font-body-bold text-[15px] text-texto">Enquetes</Text>
      </View>

      {enquetes.length === 0 && !criando ? (
        <Text className="font-body text-[13px] leading-5 text-corpo">Nenhuma enquete ainda. Crie uma pra decidir junto (que dia, qual restaurante…).</Text>
      ) : (
        <View className="gap-4">
          {enquetes.map((e) => {
            const total = new Set(e.opcoes.flatMap((o) => o.votos)).size
            const souDono = e.criadoPor === meuId || euSouAdm
            const maxVotos = Math.max(1, ...e.opcoes.map((o) => o.votos.length))
            return (
              <View key={e.id} style={{ opacity: e.fechada ? 0.75 : 1 }}>
                <View className="mb-2 flex-row items-start justify-between gap-2">
                  <Text className="min-w-0 flex-1 font-body-semibold text-[15px] leading-5 text-texto">{e.pergunta}</Text>
                  <View className="flex-row gap-1">
                    <Pressable
                      onPress={() => compartilharItem(viagemId, { tipo: 'enquete', id: e.id, titulo: e.pergunta }).catch(() => {})}
                      hitSlop={6}
                      accessibilityLabel="Compartilhar enquete"
                    >
                      <Share2 size={16} color={cor.suave} />
                    </Pressable>
                    {souDono ? (
                      <>
                        <Pressable onPress={() => fechar(e)} hitSlop={6} accessibilityLabel={e.fechada ? 'Reabrir' : 'Fechar'}>
                          {e.fechada ? <Unlock size={16} color={cor.suave} /> : <Lock size={16} color={cor.suave} />}
                        </Pressable>
                        <Pressable onPress={() => remover(e)} hitSlop={6} accessibilityLabel="Apagar enquete">
                          <Trash2 size={16} color={cor.suave} />
                        </Pressable>
                      </>
                    ) : null}
                  </View>
                </View>
                <View className="gap-1.5">
                  {e.opcoes.map((o) => {
                    const jaVotei = o.votos.includes(meuId)
                    const n = o.votos.length
                    return (
                      <Pressable
                        key={o.id}
                        onPress={() => votar(e, o.id, jaVotei)}
                        disabled={e.fechada}
                        className="relative flex-row items-center gap-2 overflow-hidden rounded-xl border px-3 py-2.5"
                        style={{ borderColor: jaVotei ? cor.couro : cor.borda }}
                      >
                        <View
                          className="absolute inset-y-0 left-0"
                          style={{ width: `${(n / maxVotos) * 100}%`, backgroundColor: jaVotei ? 'rgba(123,84,47,0.16)' : 'rgba(185,122,34,0.12)' }}
                        />
                        <View
                          className="h-[18px] w-[18px] items-center justify-center rounded-full border-[1.5px]"
                          style={{ borderColor: jaVotei ? cor.couro : cor.tracejado, backgroundColor: jaVotei ? cor.couro : 'transparent' }}
                        >
                          {jaVotei ? <Check size={12} color="#fff" /> : null}
                        </View>
                        <Text className="min-w-0 flex-1 font-body text-[14px] text-texto">{o.texto}</Text>
                        <Text className="font-body-bold text-[13px] text-suave">{n}</Text>
                      </Pressable>
                    )
                  })}
                </View>
                <Text className="mt-1.5 font-body text-[12px] text-suave">
                  {total === 0 ? 'Ninguém votou ainda' : `${total} ${total === 1 ? 'pessoa votou' : 'pessoas votaram'}`}
                  {e.multipla ? ' · várias' : ''}
                  {e.fechada ? ' · fechada' : ''}
                </Text>
              </View>
            )
          })}
        </View>
      )}

      <View className="mt-3">
        {criando ? (
          <FormNova
            aoCriar={async (dados) => {
              await criarEnquete(supabase, viagemId, dados)
              await recarregar()
              setCriando(false)
            }}
            aoCancelar={() => setCriando(false)}
          />
        ) : (
          <Pressable onPress={() => setCriando(true)} className="flex-row items-center gap-1.5 self-start rounded-full border border-dashed border-tracejado px-3 py-1.5 active:opacity-80">
            <Plus size={15} color={cor.couro} />
            <Text className="font-body-semibold text-[13px] text-couro">Nova enquete</Text>
          </Pressable>
        )}
      </View>
    </Cartao>
  )
}

function FormNova({
  aoCriar,
  aoCancelar,
}: {
  aoCriar: (dados: { pergunta: string; multipla: boolean; opcoes: string[] }) => Promise<void>
  aoCancelar: () => void
}) {
  const [pergunta, setPergunta] = useState('')
  const [opcoes, setOpcoes] = useState(['', ''])
  const [multipla, setMultipla] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const validas = opcoes.map((o) => o.trim()).filter(Boolean)
  const pode = pergunta.trim().length > 0 && validas.length >= 2 && !salvando

  async function enviar() {
    if (!pode) return
    setSalvando(true)
    try {
      await aoCriar({ pergunta: pergunta.trim(), multipla, opcoes: validas })
    } catch {
      setSalvando(false)
    }
  }

  const campo = 'h-10 rounded-xl border border-borda px-3 font-body text-[14px] text-texto'
  return (
    <View className="gap-2 rounded-2xl border border-borda p-3" style={{ backgroundColor: '#FFFDF8' }}>
      <TextInput
        value={pergunta}
        onChangeText={(t) => setPergunta(t.slice(0, 200))}
        placeholder="A pergunta (ex.: que dia a gente vai?)"
        placeholderTextColor={cor.suave}
        className={campo}
        style={{ outlineStyle: 'none' } as object}
        autoFocus
      />
      {opcoes.map((o, i) => (
        <View key={i} className="flex-row items-center gap-2">
          <TextInput
            value={o}
            onChangeText={(t) => setOpcoes((a) => a.map((x, idx) => (idx === i ? t.slice(0, 120) : x)))}
            placeholder={`Opção ${i + 1}`}
            placeholderTextColor={cor.suave}
            className={`${campo} flex-1`}
            style={{ outlineStyle: 'none' } as object}
          />
          {opcoes.length > 2 ? (
            <Pressable onPress={() => setOpcoes((a) => a.filter((_, idx) => idx !== i))} hitSlop={6} accessibilityLabel="Remover opção">
              <X size={16} color={cor.suave} />
            </Pressable>
          ) : null}
        </View>
      ))}
      {opcoes.length < 10 ? (
        <Pressable onPress={() => setOpcoes((a) => [...a, ''])} className="flex-row items-center gap-1.5 self-start py-1">
          <Plus size={14} color={cor.couro} />
          <Text className="font-body-semibold text-[13px] text-couro">Opção</Text>
        </Pressable>
      ) : null}
      <View className="flex-row items-center justify-between py-1">
        <Text className="font-body text-[13px] text-corpo">Pode marcar várias</Text>
        <Switch value={multipla} onValueChange={setMultipla} trackColor={{ true: cor.couro, false: cor.tracejado }} />
      </View>
      <View className="flex-row gap-2">
        <Pressable
          onPress={enviar}
          disabled={!pode}
          className="h-11 flex-1 items-center justify-center rounded-xl"
          style={{ backgroundColor: pode ? cor.couro : cor.borda }}
        >
          <Text className="font-body-bold text-[14px] text-white">Criar enquete</Text>
        </Pressable>
        <Pressable onPress={aoCancelar} className="h-11 items-center justify-center rounded-xl border border-borda px-4">
          <Text className="font-body-medium text-[14px] text-suave">Cancelar</Text>
        </Pressable>
      </View>
    </View>
  )
}

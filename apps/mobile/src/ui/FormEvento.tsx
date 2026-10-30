import { useState } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, Text, View } from 'react-native'
import { X } from 'lucide-react-native'
import { apagarEventoDaAgenda, criarEventoDaAgenda, editarEventoDaAgenda, type EventoDaAgenda } from '@together/core'
import { supabase } from '../lib/supabase'
import { diaLongo, lerData } from '../lib/formato'
import { Botao, Campo } from './pecas'
import { cor } from '../../theme'

// "20", "20h", "9h30", "20:00" → "20:00". Vazio → null (evento sem hora). Torto → undefined.
export function normalizarHora(texto: string): string | null | undefined {
  const t = texto.trim().toLowerCase()
  if (!t) return null
  const m = t.match(/^(\d{1,2})(?:[:h](\d{2})?)?$/)
  if (!m) return undefined
  const h = Number(m[1])
  const min = Number(m[2] ?? 0)
  if (h > 23 || min > 59) return undefined
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}

// Criar ou editar um evento livre da agenda (spec 029 no mobile): "jantar no Le Safari às 20h".
// O dia é o que está aberto no Roteiro (na edição, o do próprio evento).
export function FormEvento({
  viagemId,
  dia,
  evento,
  aoFechar,
  aoSalvar,
}: {
  viagemId: string
  dia: string
  evento?: EventoDaAgenda
  aoFechar: () => void
  aoSalvar: () => void
}) {
  const [titulo, setTitulo] = useState(evento?.titulo ?? '')
  const [hora, setHora] = useState(evento?.hora?.slice(0, 5) ?? '')
  const [local, setLocal] = useState(evento?.local ?? '')
  const [observacao, setObservacao] = useState(evento?.observacao ?? '')
  const [salvando, setSalvando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const diaDoEvento = evento?.dia ?? dia

  async function salvar() {
    if (!titulo.trim()) return setErro('Dê um nome pro evento.')
    const h = normalizarHora(hora)
    if (h === undefined) return setErro('Hora inválida. Ex.: 20:00 ou 9h30')
    setErro(null)
    setSalvando(true)
    // Participantes (spec 070) ficam como estão: no app o evento é do comboio inteiro
    const dados = { dia: diaDoEvento, hora: h, titulo, local, observacao }
    try {
      if (evento) await editarEventoDaAgenda(supabase, evento.id, dados)
      else await criarEventoDaAgenda(supabase, viagemId, { ...dados, participantes: [] })
      aoSalvar()
    } catch (falha) {
      console.error('Erro ao salvar o evento:', falha)
      setErro('Não deu pra salvar o evento. Confira a internet e tente de novo.')
      setSalvando(false)
    }
  }

  async function apagar() {
    if (!evento) return
    setSalvando(true)
    try {
      await apagarEventoDaAgenda(supabase, evento.id)
      aoSalvar()
    } catch (falha) {
      console.error('Erro ao apagar o evento:', falha)
      setErro('Não deu pra apagar o evento.')
      setSalvando(false)
    }
  }

  return (
    <Modal visible transparent animationType="slide" onRequestClose={aoFechar}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-end bg-black/30">
        <Pressable className="flex-1" onPress={aoFechar} accessibilityLabel="Fechar" />
        <View className="gap-3 rounded-t-[28px] bg-fundo px-5 pb-10 pt-5">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-display text-[22px] text-texto">{evento ? 'Editar evento' : 'Novo evento'}</Text>
              <Text className="font-body text-[13px] text-suave">{diaLongo(lerData(diaDoEvento))}</Text>
            </View>
            <Pressable onPress={aoFechar} accessibilityLabel="Fechar" className="h-10 w-10 items-center justify-center rounded-full bg-cartao active:opacity-80">
              <X size={20} color={cor.texto} />
            </Pressable>
          </View>
          <Campo placeholder="O quê? (ex.: jantar no Le Safari)" value={titulo} onChangeText={setTitulo} maxLength={120} autoFocus={!evento} accessibilityLabel="Nome do evento" />
          <View className="flex-row gap-2.5">
            <View className="w-[110px]">
              <Campo placeholder="Hora" value={hora} onChangeText={setHora} maxLength={5} keyboardType="numbers-and-punctuation" accessibilityLabel="Hora (opcional)" />
            </View>
            <View className="flex-1">
              <Campo placeholder="Onde? (opcional)" value={local} onChangeText={setLocal} maxLength={200} accessibilityLabel="Onde" />
            </View>
          </View>
          <Campo placeholder="Observação (opcional)" value={observacao} onChangeText={setObservacao} maxLength={500} accessibilityLabel="Observação" />
          {erro ? <Text className="font-body-medium text-[13px] text-vermelho">{erro}</Text> : null}
          {confirmando ? (
            <View className="gap-2.5 rounded-2xl bg-vermelho-fundo p-3.5">
              <Text className="font-body-semibold text-[14px] text-texto">Apagar "{evento?.titulo}" da agenda?</Text>
              <View className="flex-row gap-2.5">
                <View className="flex-1">
                  <Botao compacto tipo="secundario" titulo="Manter" aoTocar={() => setConfirmando(false)} />
                </View>
                <View className="flex-1">
                  <Botao compacto titulo="Apagar evento" carregando={salvando} aoTocar={apagar} />
                </View>
              </View>
            </View>
          ) : (
            <View className="flex-row gap-2.5">
              {evento ? (
                <View className="flex-1">
                  <Botao compacto tipo="secundario" titulo="Apagar" aoTocar={() => setConfirmando(true)} />
                </View>
              ) : null}
              <View className="flex-1">
                <Botao compacto titulo="Salvar" carregando={salvando} aoTocar={salvar} />
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

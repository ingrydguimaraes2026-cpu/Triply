import { useMemo, useState } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { criarTrajeto, type Destino } from '@together/core'
import { lerData, paraIso } from '../lib/formato'
import { supabase } from '../lib/supabase'
import { Botao, Campo } from './pecas'

// Cadastrar trajeto no app (antes só dava no site). Uma folha só, do mais importante pro opcional:
// como vai → de onde → pra onde → dia e horários → (preço e link da reserva).
// Quem pode: ADM ou quem ele liberou em Configurações; o banco recusa os outros.

const MEIOS = [
  { id: 'aviao', nome: 'Voo' },
  { id: 'carro', nome: 'Carro' },
  { id: 'onibus', nome: 'Ônibus' },
  { id: 'trem', nome: 'Trem' },
  { id: 'barco', nome: 'Barco' },
]
const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

type Props = {
  visivel: boolean
  viagemId: string
  moeda: string
  dataInicio: string | null
  dataFim: string | null
  destinos: Destino[]
  aoFechar: () => void
  aoSalvar: () => void
}

export function NovoTrajeto({ visivel, viagemId, moeda, dataInicio, dataFim, destinos, aoFechar, aoSalvar }: Props) {
  const insets = useSafeAreaInsets()
  const [meio, setMeio] = useState('aviao')
  const [origem, setOrigem] = useState<string | null>(null) // null = "de casa"
  const [destino, setDestino] = useState<string | null>(destinos[0]?.id ?? null)
  const [dia, setDia] = useState<string | null>(dataInicio)
  const [diaDigitado, setDiaDigitado] = useState('')
  const [saida, setSaida] = useState('')
  const [chegada, setChegada] = useState('')
  const [preco, setPreco] = useState('')
  const [link, setLink] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // Dias da viagem (um antes e um depois, pra ida e volta) viram botões; sem datas, digita "dd/mm"
  const dias = useMemo(() => {
    if (!dataInicio || !dataFim) return []
    const lista: string[] = []
    const fim = lerData(dataFim)
    fim.setDate(fim.getDate() + 1)
    for (let d = lerData(dataInicio), i = 0; d <= fim && i < 40; i++) {
      if (i === 0) d.setDate(d.getDate() - 1)
      lista.push(paraIso(d))
      d.setDate(d.getDate() + 1)
    }
    return lista
  }, [dataInicio, dataFim])

  function diaEscolhido(): string | null {
    if (dias.length) return dia
    const m = diaDigitado.trim().match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/)
    if (!m) return null
    const hoje = new Date()
    const ano = m[3] ? Number(m[3].length === 2 ? `20${m[3]}` : m[3]) : hoje.getFullYear()
    return paraIso(new Date(ano, Number(m[2]) - 1, Number(m[1])))
  }

  // "8", "8:30", "0830" → Date no dia escolhido (horário do celular, igual ao site)
  function momento(diaIso: string | null, texto: string): string | null | 'invalido' {
    const t = texto.trim()
    if (!t) return null
    const m = t.match(/^(\d{1,2})(?::?(\d{2}))?$/)
    if (!m || !diaIso || Number(m[1]) > 23 || Number(m[2] ?? 0) > 59) return 'invalido'
    const d = lerData(diaIso)
    d.setHours(Number(m[1]), Number(m[2] ?? 0), 0, 0)
    return d.toISOString()
  }

  async function salvar() {
    setErro(null)
    const diaIso = diaEscolhido()
    if (!destino) return setErro('Escolha pra onde o trajeto vai.')
    if (!dias.length && diaDigitado.trim() && !diaIso) return setErro('Escreva o dia assim: 14/06.')
    const partida = momento(diaIso, saida)
    let chegadaIso = momento(diaIso, chegada)
    if (partida === 'invalido' || chegadaIso === 'invalido') return setErro(diaIso ? 'Escreva a hora assim: 08:30.' : 'Escolha o dia antes da hora.')
    // Chegou "antes" de sair: foi no dia seguinte (voo noturno)
    if (partida && chegadaIso && chegadaIso < partida) chegadaIso = new Date(new Date(chegadaIso).getTime() + 86_400_000).toISOString()
    const valor = preco.trim() ? Number(preco.replace(/\./g, '').replace(',', '.')) : null
    if (valor !== null && (Number.isNaN(valor) || valor < 0)) return setErro('Preço inválido. Ex.: 350 ou 350,90.')
    setSalvando(true)
    try {
      await criarTrajeto(supabase, viagemId, {
        meio,
        origem_id: origem,
        destino_id: destino,
        partida,
        chegada: chegadaIso,
        preco: valor,
        moeda: valor !== null ? moeda : null,
        link_reserva: link.trim() || null,
        observacao: null,
      })
      aoSalvar()
      aoFechar()
    } catch {
      setErro('Não deu pra salvar. Só o ADM (ou quem ele liberar em Configurações) cadastra trajetos.')
    }
    setSalvando(false)
  }

  const nomeDoDia = (iso: string) => {
    const d = lerData(iso)
    return `${SEMANA[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`
  }

  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={aoFechar}>
      <Pressable accessibilityLabel="Fechar" onPress={aoFechar} className="flex-1 bg-black/40" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="max-h-[88%] rounded-t-[26px] bg-fundo">
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: insets.bottom + 20 }} keyboardShouldPersistTaps="handled">
          <Text className="font-display text-[26px] text-texto">Novo trajeto</Text>

          <Grupo titulo="Como">
            <Chips opcoes={MEIOS} marcada={meio} aoTocar={setMeio} />
          </Grupo>
          <Grupo titulo="De onde">
            <Chips opcoes={[{ id: '', nome: 'De casa' }, ...destinos.map((d) => ({ id: d.id, nome: d.nome }))]} marcada={origem ?? ''} aoTocar={(id) => setOrigem(id || null)} />
          </Grupo>
          <Grupo titulo="Pra onde">
            <Chips opcoes={[...destinos.map((d) => ({ id: d.id, nome: d.nome })), { id: '', nome: 'Pra casa' }]} marcada={destino ?? ''} aoTocar={(id) => setDestino(id || null)} />
          </Grupo>
          <Grupo titulo="Dia">
            {dias.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {dias.map((d) => (
                  <Chip key={d} nome={nomeDoDia(d)} on={dia === d} aoTocar={() => setDia(d)} />
                ))}
              </ScrollView>
            ) : (
              <Campo placeholder="14/06" value={diaDigitado} onChangeText={setDiaDigitado} keyboardType="numbers-and-punctuation" />
            )}
          </Grupo>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Grupo titulo="Sai às">
                <Campo placeholder="08:30" value={saida} onChangeText={setSaida} keyboardType="numbers-and-punctuation" />
              </Grupo>
            </View>
            <View className="flex-1">
              <Grupo titulo="Chega às">
                <Campo placeholder="11:45" value={chegada} onChangeText={setChegada} keyboardType="numbers-and-punctuation" />
              </Grupo>
            </View>
          </View>
          <Grupo titulo={`Preço total (${moeda}) · opcional`}>
            <Campo placeholder="350,00" value={preco} onChangeText={setPreco} keyboardType="decimal-pad" />
          </Grupo>
          <Grupo titulo="Link da reserva · opcional">
            <Campo placeholder="https://…" value={link} onChangeText={setLink} autoCapitalize="none" keyboardType="url" />
          </Grupo>

          {erro ? <Text className="font-body-medium text-[14px] text-vermelho">{erro}</Text> : null}
          <Botao titulo="Salvar trajeto" aoTocar={salvar} carregando={salvando} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="font-body-bold text-[12px] uppercase tracking-[1.2px] text-suave">{titulo}</Text>
      {children}
    </View>
  )
}

function Chips({ opcoes, marcada, aoTocar }: { opcoes: { id: string; nome: string }[]; marcada: string; aoTocar: (id: string) => void }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {opcoes.map((o) => (
        <Chip key={o.id || o.nome} nome={o.nome} on={marcada === o.id} aoTocar={() => aoTocar(o.id)} />
      ))}
    </View>
  )
}

function Chip({ nome, on, aoTocar }: { nome: string; on: boolean; aoTocar: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={aoTocar}
      className={`min-h-[42px] justify-center rounded-full border-[1.5px] px-4 ${on ? 'border-couro bg-couro' : 'border-borda bg-cartao'}`}
    >
      <Text className={`font-body-semibold text-[14px] ${on ? 'text-white' : 'text-texto'}`}>{nome}</Text>
    </Pressable>
  )
}

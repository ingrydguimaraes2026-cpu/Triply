import { useEffect, useState } from 'react'
import { Linking, Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Bookmark, Check, Heart, Luggage, MapPin, Plus, Utensils, type LucideIcon } from '../src/ui/icones'
import {
  agruparLugares,
  buscarDestinos,
  buscarLugaresComVotos,
  criarLugar,
  lugarNoMapa,
  TIPOS_DO_LUGAR,
  votarNoLugar,
  type Destino,
  type LugarComVotos,
  type TipoDoLugar,
} from '@together/core'
import { useCarregar } from '../src/dados/useCarregar'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { supabase } from '../src/lib/supabase'
import { StatusBar } from '../src/ui/StatusBar'
import { Norti } from '../src/ui/Norti'
import { Botao, BotaoRedondo, Campo, Cartao, Carregando, ErroNaTela, IconeQuadrado, RotuloDeSecao } from '../src/ui/pecas'
import { cor } from '../theme'

// Lugares (specs 016 e 022 no mobile): as ideias do comboio pra cada destino,
// com o coração pra votar. Tocar no lugar abre no Google Maps.
const ICONES: Record<string, LucideIcon> = { passeio: MapPin, comida: Utensils, guarda_volumes: Luggage, outro: Bookmark }

export default function Lugares() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { atual: viagem, meuId } = useViagemAtual()
  const [novo, setNovo] = useState(false)
  const carga = useCarregar(
    viagem ? () => Promise.all([buscarLugaresComVotos(supabase, viagem.id), buscarDestinos(supabase, viagem.id)]) : null,
    [viagem?.id],
  )
  // Cópia local pra o coração responder na hora (antes do banco)
  const [lugares, setLugares] = useState<LugarComVotos[]>([])
  const [erro, setErro] = useState<string | null>(null)
  // Só quando chega dado novo do banco (o objeto `carga` muda a cada render)
  const carregados = carga.status === 'pronto' ? carga.dados[0] : null
  useEffect(() => {
    if (carregados) setLugares(carregados)
  }, [carregados])

  if (!viagem) return null
  if (carga.status === 'carregando') return <Carregando />
  if (carga.status === 'erro') return <ErroNaTela aoTentar={carga.recarregar} />
  const destinos = carga.dados[1]
  const grupos = agruparLugares(destinos, lugares)

  async function votar(l: LugarComVotos) {
    const sim = !l.votos.includes(meuId)
    const trocar = (marcar: boolean) =>
      setLugares((atual) =>
        atual.map((x) => (x.id === l.id ? { ...x, votos: marcar ? [...x.votos.filter((v) => v !== meuId), meuId] : x.votos.filter((v) => v !== meuId) } : x)),
      )
    trocar(sim)
    setErro(null)
    try {
      await votarNoLugar(supabase, l.id, meuId, sim)
    } catch {
      trocar(!sim) // desfaz
      setErro('Não deu pra salvar o voto. Tente de novo.')
    }
  }

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: insets.bottom + 40, gap: 12 }} keyboardShouldPersistTaps="handled">
        <BotaoRedondo aoTocar={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
          <ArrowLeft size={20} color={cor.texto} />
        </BotaoRedondo>
        <View className="flex-row items-end justify-between gap-3">
          <View className="flex-1">
            <Text className="font-display text-[32px] text-texto">Lugares</Text>
            <Text className="mt-0.5 font-body text-[14px] text-suave">Passeios e comidas do comboio. Curta o que você topa.</Text>
          </View>
          {!novo ? <Botao compacto titulo="Lugar" icone={<Plus size={18} color="#fff" />} aoTocar={() => setNovo(true)} /> : null}
        </View>

        {novo ? (
          <FormLugar
            viagemId={viagem.id}
            moeda={viagem.moeda}
            destinos={destinos}
            aoFechar={() => setNovo(false)}
            aoSalvar={() => {
              setNovo(false)
              carga.recarregar()
            }}
          />
        ) : null}
        {erro ? <Text className="font-body-medium text-[13px] text-vermelho">{erro}</Text> : null}

        {grupos.length === 0 && !novo ? (
          <View className="mt-10 items-center gap-3 px-6">
            <Norti humor="dormindo" tamanho={120} />
            <Text className="font-display text-[24px] text-texto">Nenhum lugar ainda</Text>
            <Text className="text-center font-body text-[15px] leading-6 text-corpo">Anote um passeio ou um restaurante e o comboio vota no que topa.</Text>
          </View>
        ) : (
          grupos.map((g) => (
            <View key={g.chave}>
              <RotuloDeSecao>{g.titulo}</RotuloDeSecao>
              <View className="gap-2.5">
                {g.lugares.map((l) => (
                  <LinhaDoLugar key={l.id} lugar={l} cidade={g.chave === 'soltos' ? null : g.titulo} meuId={meuId} aoVotar={() => votar(l)} />
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

function LinhaDoLugar({ lugar: l, cidade, meuId, aoVotar }: { lugar: LugarComVotos; cidade: string | null; meuId: string; aoVotar: () => void }) {
  const Icone = ICONES[l.tipo] ?? Bookmark
  const votei = l.votos.includes(meuId)
  const detalhe = [l.horario, l.observacao].filter(Boolean).join(' · ')
  return (
    <Cartao className="flex-row items-center gap-3 p-3.5">
      <Pressable onPress={() => Linking.openURL(l.link || lugarNoMapa(l.nome, cidade))} className="flex-1 flex-row items-center gap-3 active:opacity-80">
        <IconeQuadrado tamanho={38}>
          <Icone size={19} color={cor.couro} />
        </IconeQuadrado>
        <View className="flex-1">
          <Text className="font-body-bold text-[15px] text-texto" numberOfLines={2}>
            {l.nome}
          </Text>
          {detalhe ? (
            <Text className="font-body text-[12.5px] text-suave" numberOfLines={2}>
              {detalhe}
            </Text>
          ) : null}
          {l.visitado_em ? (
            <View className="mt-1 flex-row items-center gap-1">
              <Check size={13} color={cor.verde} />
              <Text className="font-body-bold text-[12px] text-verde">Já fomos</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
      <Pressable
        onPress={aoVotar}
        accessibilityRole="button"
        accessibilityLabel={votei ? `Tirar meu voto de ${l.nome}` : `Curtir ${l.nome}`}
        className={`min-w-[52px] flex-row items-center justify-center gap-1 rounded-xl px-2.5 py-2 ${votei ? 'bg-vermelho-fundo' : 'bg-areia'} active:opacity-80`}
      >
        <Heart size={17} color={votei ? cor.vermelho : cor.suave} fill={votei ? cor.vermelho : 'transparent'} />
        <Text className={`font-body-bold text-[14px] ${votei ? 'text-vermelho' : 'text-suave'}`}>{l.votos.length}</Text>
      </Pressable>
    </Cartao>
  )
}

function FormLugar({
  viagemId,
  moeda,
  destinos,
  aoFechar,
  aoSalvar,
}: {
  viagemId: string
  moeda: string
  destinos: Destino[]
  aoFechar: () => void
  aoSalvar: () => void
}) {
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<TipoDoLugar>('passeio')
  const [destinoId, setDestinoId] = useState<string | null>(destinos[0]?.id ?? null)
  const [observacao, setObservacao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function salvar() {
    if (!nome.trim()) return setErro('Dê um nome pro lugar.')
    setSalvando(true)
    setErro(null)
    try {
      await criarLugar(supabase, viagemId, { destinoId, tipo, nome, observacao, moeda })
      aoSalvar()
    } catch {
      setErro('Não deu pra salvar agora. Tente de novo.')
      setSalvando(false)
    }
  }

  const chip = (ativo: boolean) => `rounded-xl px-3.5 py-2 ${ativo ? 'bg-couro' : 'border border-borda bg-cartao'}`
  const textoDoChip = (ativo: boolean) => `font-body-bold text-[13px] ${ativo ? 'text-white' : 'text-texto'}`

  return (
    <Cartao className="gap-3 p-4">
      <Text className="font-body-bold text-[16px] text-texto">Novo lugar</Text>
      <Campo placeholder="Ex.: Coliseu, cantina do Mario" value={nome} onChangeText={setNome} autoFocus />
      <View className="flex-row flex-wrap gap-2">
        {TIPOS_DO_LUGAR.map((t) => (
          <Pressable key={t.chave} onPress={() => setTipo(t.chave)} className={chip(tipo === t.chave)}>
            <Text className={textoDoChip(tipo === t.chave)}>{t.nome}</Text>
          </Pressable>
        ))}
      </View>
      {destinos.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {destinos.map((d) => (
            <Pressable key={d.id} onPress={() => setDestinoId(d.id)} className={chip(destinoId === d.id)}>
              <Text className={textoDoChip(destinoId === d.id)}>{d.nome}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
      <Campo placeholder="Observação (opcional)" value={observacao} onChangeText={setObservacao} />
      {erro ? <Text className="font-body-medium text-[13px] text-vermelho">{erro}</Text> : null}
      <View className="flex-row gap-2.5">
        <View className="flex-1">
          <Botao compacto tipo="secundario" titulo="Cancelar" aoTocar={aoFechar} />
        </View>
        <View className="flex-1">
          <Botao compacto titulo="Salvar" carregando={salvando} aoTocar={salvar} />
        </View>
      </View>
    </Cartao>
  )
}

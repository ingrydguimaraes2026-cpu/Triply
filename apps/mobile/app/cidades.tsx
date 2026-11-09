import { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, MapPin, RotateCcw, Trash2 } from '../src/ui/icones'
import {
  buscarDestinos,
  contarLigadosAoDestino,
  erroAoSalvarDestinos,
  salvarDestinosEditados,
  textoDosLigados,
  type Destino,
  type LigadosAoDestino,
} from '@together/core'
import { useCarregar } from '../src/dados/useCarregar'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { supabase } from '../src/lib/supabase'
import { StatusBar } from '../src/ui/StatusBar'
import { Botao, BotaoRedondo, Campo, Cartao, Carregando, ErroNaTela } from '../src/ui/pecas'
import { cor } from '../theme'

// Cidades do roteiro no app: tirar uma cidade (ex.: desistiram de Veneza) e acertar as datas de
// chegada e saída. Salva tudo de uma vez com a mesma função do site (salvar_roteiro).
// Quem pode: o ADM, ou todos se o ADM liberou "membro edita roteiro". O banco confere.
// Rota: /cidades

// "2027-06-09" → "9/06"; "9/6" → "2027-06-09" (ano da viagem); vazio → null; errado → 'x'
const paraTexto = (iso: string | null) => (iso ? `${Number(iso.slice(8, 10))}/${iso.slice(5, 7)}` : '')
const paraIso = (texto: string, ano: string): string | null | 'x' => {
  const t = texto.trim()
  if (!t) return null
  const m = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/.exec(t)
  if (!m || Number(m[1]) > 31 || Number(m[2]) > 12 || Number(m[1]) < 1 || Number(m[2]) < 1) return 'x'
  return `${m[3] ?? ano}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
}

type Linha = { destino: Destino; chegada: string; saida: string }

export default function Cidades() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { atual: viagem, meuId, recarregar: recarregarViagens } = useViagemAtual()
  const carga = useCarregar(
    viagem
      ? async () => {
          const [destinos, permissao] = await Promise.all([
            buscarDestinos(supabase, viagem.id),
            supabase.from('viagens').select('membro_edita_roteiro').eq('id', viagem.id).single(),
          ])
          return { destinos, membroEdita: !!permissao.data?.membro_edita_roteiro }
        }
      : null,
    [viagem?.id],
  )
  const [linhas, setLinhas] = useState<Linha[]>([])
  const [tirados, setTirados] = useState<Destino[]>([])
  const [confirmando, setConfirmando] = useState<{ id: string; ligados: LigadosAoDestino | null } | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const salvos = carga.status === 'pronto' ? carga.dados.destinos : null
  useEffect(() => {
    if (!salvos) return
    setLinhas(salvos.map((d) => ({ destino: d, chegada: paraTexto(d.chegada), saida: paraTexto(d.saida) })))
    setTirados([])
  }, [salvos])

  if (!viagem) return null
  if (carga.status === 'carregando') return <Carregando />
  if (carga.status === 'erro') return <ErroNaTela aoTentar={carga.recarregar} />
  const euSouAdm = viagem.membros.some((m) => m.id === meuId && m.papel === 'adm')
  const podeEditar = euSouAdm || carga.dados.membroEdita
  const ano = (viagem.dataInicio ?? new Date().toISOString()).slice(0, 4)
  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/'))
  const mudou =
    tirados.length > 0 || linhas.some((l) => l.chegada !== paraTexto(l.destino.chegada) || l.saida !== paraTexto(l.destino.saida))

  async function pedirParaTirar(d: Destino) {
    setConfirmando({ id: d.id, ligados: null })
    try {
      const ligados = await contarLigadosAoDestino(supabase, d.id)
      setConfirmando((c) => (c?.id === d.id ? { id: d.id, ligados } : c))
    } catch {
      setConfirmando((c) => (c?.id === d.id ? { id: d.id, ligados: { trajetos: 0, hospedagens: 0, lugares: 0, fotos: 0 } } : c))
    }
  }

  function tirar(d: Destino) {
    if (linhas.length <= 1) return setErro('O roteiro precisa ter pelo menos uma cidade.')
    setLinhas((atual) => atual.filter((l) => l.destino.id !== d.id))
    setTirados((atual) => [...atual, d])
    setConfirmando(null)
  }

  function desfazer(d: Destino) {
    setTirados((atual) => atual.filter((x) => x.id !== d.id))
    // Volta pro lugar original na ordem
    setLinhas((atual) => {
      const ordem = salvos!.map((s) => s.id)
      return [...atual, { destino: d, chegada: paraTexto(d.chegada), saida: paraTexto(d.saida) }].sort((a, b) => ordem.indexOf(a.destino.id) - ordem.indexOf(b.destino.id))
    })
  }

  const mudarData = (id: string, campo: 'chegada' | 'saida', texto: string) =>
    setLinhas((atual) => atual.map((l) => (l.destino.id === id ? { ...l, [campo]: texto } : l)))

  async function salvar() {
    setErro(null)
    const ficam = []
    for (const l of linhas) {
      const chegada = paraIso(l.chegada, ano)
      const saida = paraIso(l.saida, ano)
      if (chegada === 'x' || saida === 'x') return setErro(`Data inválida em ${l.destino.nome}. Use dia/mês, por exemplo 9/6.`)
      if (chegada && saida && saida < chegada) return setErro(`Em ${l.destino.nome}, a saída está antes da chegada.`)
      ficam.push({ id: l.destino.id, chegada, saida })
    }
    setSalvando(true)
    try {
      await salvarDestinosEditados(supabase, viagem!.id, salvos!, ficam)
      recarregarViagens()
      voltar()
    } catch (e) {
      setErro(erroAoSalvarDestinos(e))
      setSalvando(false)
    }
  }

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: insets.bottom + 110, gap: 10 }} keyboardShouldPersistTaps="handled">
        <BotaoRedondo aoTocar={voltar}>
          <ArrowLeft size={20} color={cor.texto} />
        </BotaoRedondo>
        <View>
          <Text className="font-display text-[30px] leading-[34px] text-texto">Cidades do roteiro</Text>
          <Text className="mt-1 font-body text-[13.5px] text-suave">
            {podeEditar ? 'Acerte as datas de cada cidade ou tire a que não vai mais rolar.' : 'Só o ADM muda as cidades e as datas. Peça pra quem organiza.'}
          </Text>
        </View>

        {linhas.map((l) => {
          const d = l.destino
          const pedindo = confirmando?.id === d.id
          return (
            <Cartao key={d.id} className="gap-2.5 p-3.5">
              <View className="flex-row items-center gap-2">
                <MapPin size={17} color={cor.couro} />
                <Text className="flex-1 font-body-bold text-[15.5px] text-texto">{d.nome}</Text>
                {podeEditar && !pedindo ? (
                  <Pressable onPress={() => void pedirParaTirar(d)} accessibilityRole="button" accessibilityLabel={`Tirar ${d.nome} do roteiro`} className="flex-row items-center gap-1 rounded-full border border-borda px-3 py-1.5 active:opacity-80">
                    <Trash2 size={14} color={cor.vermelho} />
                    <Text className="font-body-bold text-[12.5px] text-vermelho">Tirar</Text>
                  </Pressable>
                ) : null}
              </View>
              <View className="flex-row gap-2.5">
                <View className="flex-1 gap-1">
                  <Text className="font-body-bold text-[11px] uppercase tracking-wider text-suave">Chega</Text>
                  <Campo placeholder="dia/mês" value={l.chegada} onChangeText={(t) => mudarData(d.id, 'chegada', t)} editable={podeEditar} keyboardType="numbers-and-punctuation" />
                </View>
                <View className="flex-1 gap-1">
                  <Text className="font-body-bold text-[11px] uppercase tracking-wider text-suave">Sai</Text>
                  <Campo placeholder="dia/mês" value={l.saida} onChangeText={(t) => mudarData(d.id, 'saida', t)} editable={podeEditar} keyboardType="numbers-and-punctuation" />
                </View>
              </View>
              {pedindo ? (
                <View className="gap-2 rounded-xl p-3" style={{ backgroundColor: cor.vermelhoFundo }}>
                  <Text className="font-body text-[13px] leading-5 text-vermelho">
                    {confirmando!.ligados === null
                      ? 'Vendo o que está ligado a essa cidade…'
                      : textoDosLigados(confirmando!.ligados)
                        ? `Tirar ${d.nome}? ${textoDosLigados(confirmando!.ligados)} continuam na viagem, mas sem cidade.`
                        : `Tirar ${d.nome}? Não tem nada ligado a ela.`}
                  </Text>
                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <Botao compacto tipo="secundario" titulo="Cancelar" aoTocar={() => setConfirmando(null)} />
                    </View>
                    <View className="flex-1">
                      <Botao compacto titulo="Sim, tirar" desabilitado={confirmando!.ligados === null} aoTocar={() => tirar(d)} />
                    </View>
                  </View>
                </View>
              ) : null}
            </Cartao>
          )
        })}

        {tirados.length ? (
          <View className="gap-2">
            <Text className="mt-2 font-body-bold text-[12px] uppercase tracking-widest text-caramelo">Vão sair ao salvar</Text>
            {tirados.map((d) => (
              <View key={d.id} className="flex-row items-center gap-2 rounded-2xl border border-dashed border-tracejado px-3.5 py-2.5">
                <Text className="flex-1 font-body text-[14px] text-suave line-through">{d.nome}</Text>
                <Pressable onPress={() => desfazer(d)} className="flex-row items-center gap-1 active:opacity-80">
                  <RotateCcw size={14} color={cor.couro} />
                  <Text className="font-body-bold text-[13px] text-couro">Desfazer</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        {erro ? <Text className="font-body-medium text-[13px] text-vermelho">{erro}</Text> : null}
      </ScrollView>

      {podeEditar && mudou ? (
        <View className="absolute bottom-0 left-0 right-0 px-5" style={{ paddingBottom: insets.bottom + 12 }}>
          <Botao titulo={tirados.length ? `Salvar e tirar ${tirados.length === 1 ? tirados[0].nome : `${tirados.length} cidades`}` : 'Salvar datas'} carregando={salvando} aoTocar={() => void salvar()} />
        </View>
      ) : null}
    </View>
  )
}

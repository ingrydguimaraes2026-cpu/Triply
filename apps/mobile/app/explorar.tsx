import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Image, Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, CalendarPlus, Heart, SlidersHorizontal, Star, Undo2, X } from '../src/ui/icones'
import {
  ESTILOS,
  semAcento,
  ORCAMENTOS,
  RITMOS,
  acabou,
  apagarEscolhaDoExplorar,
  buscarDestinos,
  buscarLugaresComVotos,
  buscarMinhasEscolhas,
  buscarRoteiroDoDestino,
  destinosParaExplorar,
  carregarCatalogoDaCidade,
  comecarDeslize,
  creditoDaFoto,
  criarLugaresDoExplorar,
  decidir,
  desfazer,
  diasDoPeriodo,
  montarDiasPelosVotos,
  montarPilha,
  podeNaoAbrirMao,
  porDiaDoRitmo,
  precoLegivel,
  prioridadesForaDoExplorar,
  salvarEscolhaDoExplorar,
  salvarRoteiroDoDestino,
  tempoLegivel,
  type DiasDoRoteiro,
  type Destino,
  type Escolha,
  type EstadoDoDeslize,
  type EstiloId,
  type LugarComVotos,
  type LugarDoCatalogo,
  type OrcamentoId,
  type RitmoId,
} from '@together/core'
import { useAoVivo } from '../src/dados/useAoVivo'
import { useCarregar } from '../src/dados/useCarregar'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { supabase } from '../src/lib/supabase'
import { convidarProComboio } from '../src/lib/convite'
import { StatusBar } from '../src/ui/StatusBar'
import { Avatar, Botao, BotaoRedondo, Carregando, ErroNaTela } from '../src/ui/pecas'
import { Comemoracao } from '../src/ui/Comemoracao'
import { buscarMatches, ehMatch } from '../src/dados/matches'
import { primeiroNome } from '../src/lib/formato'
import { CartaoDoExplorar } from '../src/ui/CartaoDoExplorar'
import { Foto } from '../src/ui/Foto'
import { RoteiroDoExplorar } from '../src/ui/RoteiroDoExplorar'
import { cor, sombra } from '../theme'

// Explorar / Roteiro (specs 114 e 115 v2) no app.
// Abre no roteiro se o destino já tem um; senão, direto no deslize (12 cartões, estilo no padrão).
// Acabou a pilha → vira lugares da viagem e o roteiro do grupo aparece, editável.
const CARTOES_POR_VEZ = 6

export default function Explorar() {
  const { atual: viagem } = useViagemAtual()
  // `viagem`: a viagem acabou de ser criada/aceita (espera ela chegar). `guiado`: primeira viagem (spec 116)
  // `roteiro=1`: já tem escolhas (gostinho do /comecar), monta o roteiro direto. `estilos`: o que a pessoa curte
  const { destino: destinoPedido, viagem: viagemPedida, guiado, roteiro, estilos } = useLocalSearchParams<{
    destino?: string
    viagem?: string
    guiado?: string
    roteiro?: string
    estilos?: string
  }>()
  const carga = useCarregar(viagem ? () => buscarDestinos(supabase, viagem.id) : null, [viagem?.id])
  const [escolhido, setEscolhido] = useState<string | null>(destinoPedido ?? null)

  if (viagemPedida && viagem?.id !== viagemPedida) return <Carregando texto="Arrumando a viagem…" />
  if (!viagem) return null
  if (carga.status === 'carregando') return <Carregando />
  if (carga.status === 'erro') return <ErroNaTela aoTentar={carga.recarregar} />
  // Aeroporto/rodoviária de saída não é cidade pra explorar
  const destinos = destinosParaExplorar(carga.dados)
  const destino = destinos.find((d) => d.id === escolhido) ?? destinos[0]
  if (!destino) {
    return (
      <View className="flex-1 items-center justify-center bg-fundo p-6">
        <Text className="text-center font-body text-[15px] text-corpo">Adicione um destino no Roteiro pra explorar os lugares.</Text>
      </View>
    )
  }
  // `key`: trocar de destino recomeça tudo
  return <ExplorarDestino key={destino.id} destino={destino} destinos={destinos} aoTrocar={setEscolhido} guiado={guiado === '1'} direto={roteiro === '1'} estilosIniciais={estilos ? (estilos.split(',') as EstiloId[]) : undefined} />
}

type Etapa = 'carregando' | 'deck' | 'ajustar' | 'montando' | 'roteiro' | 'erro'

function ExplorarDestino({
  destino,
  destinos,
  aoTrocar,
  guiado,
  direto,
  estilosIniciais,
}: {
  destino: Destino
  destinos: Destino[]
  aoTrocar: (id: string) => void
  guiado: boolean
  direto?: boolean
  estilosIniciais?: EstiloId[]
}) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { height } = useWindowDimensions()
  const { atual: viagem, meuId } = useViagemAtual()

  const [etapa, setEtapa] = useState<Etapa>('carregando')
  const [estilos, setEstilos] = useState<EstiloId[]>(estilosIniciais?.length ? estilosIniciais : ['cultura'])
  const [ritmo, setRitmo] = useState<RitmoId>('equilibrado')
  const [orcamento, setOrcamento] = useState<OrcamentoId>('medio')
  const [preparando, setPreparando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [catalogo, setCatalogo] = useState<LugarDoCatalogo[]>([])
  const [deslize, setDeslize] = useState<EstadoDoDeslize>(comecarDeslize([]))
  const [jaTenho, setJaTenho] = useState(0)
  const [comando, setComando] = useState<{ escolha: Escolha; vez: number } | null>(null)
  const [detalhe, setDetalhe] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  const [lugaresDoGrupo, setLugaresDoGrupo] = useState<LugarComVotos[]>([])
  const [diasSalvos, setDiasSalvos] = useState<DiasDoRoteiro>([])
  const vez = useRef(0)
  // Spec 117: quem do comboio já quer cada lugar (id do catálogo → ids) e o "Deu match!" da vez
  const [querem, setQuerem] = useState<Record<string, string[]>>({})
  const [deuMatch, setDeuMatch] = useState<LugarDoCatalogo | null>(null)

  const dias = useMemo(
    () => (destino.chegada ? diasDoPeriodo(destino.chegada, destino.saida ?? destino.chegada) : Array.from({ length: Math.max(1, destino.dias ?? 3) }, (_, i) => `Dia ${i + 1}`)),
    [destino.chegada, destino.saida, destino.dias],
  )
  const rotulos = useMemo(() => (destino.chegada ? dias.map(diaPorExtenso) : dias), [destino.chegada, dias])
  const porDia = porDiaDoRitmo(ritmo)
  const porId = useMemo(() => new Map(catalogo.map((l) => [l.id, l])), [catalogo])
  // Foto de cada lugar do roteiro: acha no catálogo pelo Wikidata (ou pelo nome, sem acento)
  const fotosDosLugares = useMemo(() => {
    const porWikidata = new Map(catalogo.filter((c) => c.wikidata && c.fotoUrl).map((c) => [c.wikidata!, c.fotoUrl!]))
    const porNome = new Map(catalogo.filter((c) => c.fotoUrl).map((c) => [semAcento(c.nome), c.fotoUrl!]))
    const fotos: Record<string, string> = {}
    for (const l of lugaresDoGrupo) {
      const f = (l.wikidata && porWikidata.get(l.wikidata)) || porNome.get(semAcento(l.nome))
      if (f) fotos[l.id] = f
    }
    return fotos
  }, [catalogo, lugaresDoGrupo])
  const atual = porId.get(deslize.pilha[deslize.posicao] ?? '') ?? null
  const proximo = porId.get(deslize.pilha[deslize.posicao + 1] ?? '') ?? null
  const alturaCartao = Math.round(Math.min(600, Math.max(400, height - insets.top - insets.bottom - 240)))
  const pessoas = viagem?.membros.length ?? 1
  const euSouAdm = !!viagem?.membros.some((m) => m.id === meuId && m.papel === 'adm')

  // Ao abrir: com roteiro, abre nele; sem roteiro, começa a deslizar.
  // Guiado (spec 116): sempre começa pelo deslize; quem já escolheu tudo cai no roteiro sozinho.
  useEffect(() => {
    if (guiado) {
      void (direto ? abrirRoteiro(true) : comecar())
      return
    }
    let vivo = true
    buscarRoteiroDoDestino(supabase, destino.id)
      .then((salvo) => {
        if (vivo) void (salvo ? abrirRoteiro(false) : comecar())
      })
      .catch(() => {
        if (vivo) void comecar()
      })
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (viagem) void atualizarQuemQuer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viagem?.id, destino.id])

  // Outra pessoa arrumou o roteiro ou curtiu algo: recarrega (igual ao site)
  useAoVivo(viagem?.id, ['roteiros', 'lugares'], () => {
    if (etapa === 'roteiro') void abrirRoteiro(false, true)
  })

  if (!viagem) return null

  // ---------- Deslize ----------
  async function comecar() {
    setErro(null)
    setPreparando(false)
    setEtapa('carregando')
    try {
      const [cat, antigas, naViagem] = await Promise.all([
        carregarCatalogoDaCidade(supabase, destino, () => setPreparando(true)),
        buscarMinhasEscolhas(supabase, destino.id, meuId),
        supabase.from('lugares').select('nome, wikidata').eq('viagem_id', viagem!.id).eq('destino_id', destino.id),
      ])
      const qidsEstrela = cat.lugares.filter((l) => antigas[l.id] === 'nao_abro_mao' && l.wikidata).map((l) => l.wikidata!)
      setJaTenho(await prioridadesForaDoExplorar(supabase, destino.id, meuId, qidsEstrela))
      const pilha = montarPilha(cat.lugares, {
        estilos,
        orcamento,
        tamanho: CARTOES_POR_VEZ,
        jaNaViagem: (naViagem.data ?? []).filter((l) => !cat.lugares.some((c) => c.wikidata && c.wikidata === l.wikidata && antigas[c.id])),
        jaEscolhidos: Object.keys(antigas),
      })
      // Baixa as fotos da pilha já: o cartão aparece com a foto, sem ficar bege esperando
      for (const l of pilha) if (l.fotoUrl) Image.prefetch(l.fotoUrl).catch(() => {})
      setCatalogo(cat.lugares)
      setDeslize(comecarDeslize(pilha.map((l) => l.id), antigas))
      if (pilha.length === 0 && Object.keys(antigas).length > 0) await abrirRoteiro(true)
      else setEtapa('deck')
    } catch (e) {
      console.error('Erro ao carregar o Explorar:', e)
      setErro(e instanceof Error ? e.message : 'Não deu pra carregar agora.')
      setEtapa('erro')
    }
  }

  function podeDecidir(e: Escolha): boolean {
    if (e === 'nao_abro_mao' && !podeNaoAbrirMao(deslize, jaTenho)) {
      setAviso('Você já tem 3 "não abro mão" aqui. Tire um pra marcar outro.')
      return false
    }
    setAviso(null)
    return true
  }

  // Botão: pede pro cartão voar (o mesmo voo do arrasto)
  function pedir(e: Escolha) {
    if (!atual || !podeDecidir(e)) return
    setDetalhe(false)
    vez.current += 1
    setComando({ escolha: e, vez: vez.current })
  }

  // O cartão terminou de voar: troca de cartão (sem animação) e salva
  function aoVoar(e: Escolha) {
    const id = deslize.pilha[deslize.posicao]
    if (!id) return
    const novo = decidir(deslize, e, jaTenho)
    setComando(null)
    setDeslize(novo)
    // Fui eu quem completou o match? (3 "quero", ou todo mundo se o comboio é menor)
    const outros = (querem[id] ?? []).filter((q) => q !== meuId).length
    const fizMatch = e !== 'passo' && ehMatch(outros + 1, pessoas) && !ehMatch(outros, pessoas)
    salvarEscolhaDoExplorar(supabase, viagem!.id, destino.id, meuId, id, e)
      .then(() => atualizarQuemQuer())
      .catch((erroAoSalvar) => {
        console.error('Erro ao salvar escolha:', erroAoSalvar)
        setAviso('Não deu pra salvar a última escolha. Confira a internet.')
      })
    if (fizMatch) setDeuMatch(porId.get(id) ?? null)
    else if (acabou(novo)) void abrirRoteiro(true)
  }

  async function atualizarQuemQuer() {
    const lista = await buscarMatches(viagem!.id).catch(() => [])
    setQuerem(Object.fromEntries(lista.filter((m) => m.destinoId === destino.id).map((m) => [m.catalogoId, m.quem])))
  }

  function voltarUm() {
    const id = deslize.historico[deslize.historico.length - 1]
    if (!id) return
    setDeslize(desfazer(deslize))
    apagarEscolhaDoExplorar(supabase, destino.id, meuId, id).catch((e) => console.error('Erro ao desfazer:', e))
  }

  // ---------- Roteiro ----------
  async function buscarDoGrupo() {
    const todos = await buscarLugaresComVotos(supabase, viagem!.id)
    return todos
      .filter((l) => l.destino_id === destino.id && (l.votos.length > 0 || l.prioridades.length > 0))
      .sort((a, b) => b.prioridades.length - a.prioridades.length || b.votos.length - a.votos.length)
  }

  function propor(lugares: LugarComVotos[]): DiasDoRoteiro {
    const proposta = montarDiasPelosVotos(
      dias,
      lugares.map((l) => ({ id: l.id, nome: l.nome, tipo: l.tipo, votos: l.votos.length, prioridades: l.prioridades.length, latitude: l.latitude, longitude: l.longitude, endereco: l.endereco })),
      porDia,
    )
    return dias.map((d) => proposta.dias.find((p) => p.dia === d)?.itens.map((i) => i.lugarId) ?? [])
  }

  // `converter`: minhas escolhas viram lugares da viagem antes (depois de deslizar)
  // `silencioso`: recarrega sem mostrar "Montando…" (quando outra pessoa mexeu)
  async function abrirRoteiro(converter: boolean, silencioso = false) {
    if (!silencioso) setEtapa('montando')
    try {
      if (converter) await criarLugaresDoExplorar(supabase, destino.id)
      const [doGrupo, salvo] = await Promise.all([buscarDoGrupo(), buscarRoteiroDoDestino(supabase, destino.id)])
      // Primeira vez (ou roteiro vazio): o app monta; depois, o que chega novo fica em "Sem dia"
      let diasDoRoteiro = salvo ?? []
      if (diasDoRoteiro.every((d) => d.length === 0)) {
        diasDoRoteiro = propor(doGrupo)
        await salvarRoteiroDoDestino(supabase, viagem!.id, destino.id, diasDoRoteiro)
      }
      setLugaresDoGrupo(doGrupo)
      setDiasSalvos(diasDoRoteiro)
      setEtapa('roteiro')
      // Abriu direto no roteiro (onboarding, link): busca o catálogo só pras fotos dos lugares, sem travar a tela
      if (catalogo.length === 0) {
        carregarCatalogoDaCidade(supabase, destino)
          .then((cat) => setCatalogo(cat.lugares))
          .catch((e) => console.warn('Roteiro sem fotos do catálogo:', e))
      }
    } catch (e) {
      console.error('Erro ao montar:', e)
      setErro('Não deu pra montar o roteiro agora. Suas escolhas estão salvas: tente de novo.')
      setEtapa('erro')
    }
  }

  function mudarRoteiro(novo: DiasDoRoteiro) {
    setDiasSalvos(novo)
    salvarRoteiroDoDestino(supabase, viagem!.id, destino.id, novo).catch((e) => {
      console.error('Erro ao salvar o roteiro:', e)
      setAviso('Não deu pra salvar a mudança. Confira a internet.')
    })
  }

  // ---------- Tela ----------
  const ehRoteiro = etapa === 'roteiro'
  const topo = (
    <View className="gap-3 px-5" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row items-center gap-3">
        <BotaoRedondo aoTocar={() => (guiado && viagem ? router.replace(`/viagem/${viagem.id}`) : router.canGoBack() ? router.back() : router.replace(viagem ? `/viagem/${viagem.id}` : '/'))} rotulo="Voltar">
          <ArrowLeft size={20} color={cor.texto} />
        </BotaoRedondo>
        <View className="flex-1">
          <Text className="font-body-bold text-[12px] uppercase tracking-[1.4px] text-suave">{ehRoteiro ? 'Roteiro' : 'Explorar'}</Text>
          <Text numberOfLines={1} className="font-display text-[26px] leading-[30px] text-texto">
            {destino.nome}
          </Text>
        </View>
        {etapa === 'deck' ? (
          <Pressable accessibilityRole="button" onPress={() => setEtapa('ajustar')} className="min-h-[44px] flex-row items-center gap-1.5 px-1">
            <SlidersHorizontal size={16} color={cor.couro} />
            <Text className="font-body-bold text-[14px] text-couro">Ajustar</Text>
          </Pressable>
        ) : null}
      </View>
      {destinos.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {destinos.map((d) => (
            <Pressable
              key={d.id}
              accessibilityRole="button"
              accessibilityState={{ selected: d.id === destino.id }}
              onPress={() => aoTrocar(d.id)}
              className={`min-h-[36px] justify-center rounded-full border-[1.5px] px-3.5 ${d.id === destino.id ? 'border-couro bg-couro' : 'border-borda bg-cartao'}`}
            >
              <Text className={`font-body-semibold text-[13px] ${d.id === destino.id ? 'text-white' : 'text-texto'}`}>{d.nome}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  )

  if (etapa === 'carregando' || etapa === 'montando') {
    return (
      <View className="flex-1 bg-fundo">
        <StatusBar style="dark" />
        {topo}
        <Carregando texto={etapa === 'montando' ? 'Montando o roteiro…' : preparando ? `Preparando os lugares de ${destino.nome}… (só na primeira vez, até 30 s)` : 'Carregando os lugares…'} />
      </View>
    )
  }

  if (etapa === 'erro') {
    return (
      <View className="flex-1 bg-fundo">
        <StatusBar style="dark" />
        {topo}
        <View className="gap-4 p-5">
          <View className="rounded-[12px] bg-vermelho-fundo p-3.5">
            <Text className="font-body text-[14px] text-vermelho">{erro}</Text>
          </View>
          <Botao titulo="Tentar de novo" aoTocar={comecar} />
        </View>
      </View>
    )
  }

  if (etapa === 'ajustar') {
    return (
      <View className="flex-1 bg-fundo">
        <StatusBar style="dark" />
        {topo}
        <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: insets.bottom + 32 }}>
          <Text className="font-display text-[26px] text-texto">Como vai ser a viagem?</Text>
          <Grupo titulo="Estilo · escolha quantos quiser">
            <View className="flex-row flex-wrap gap-2">
              {ESTILOS.map((e) => {
                const on = estilos.includes(e.id)
                return <Opcao key={e.id} on={on} titulo={e.nome} redonda aoTocar={() => setEstilos(on ? estilos.filter((x) => x !== e.id) : [...estilos, e.id])} />
              })}
            </View>
          </Grupo>
          <Grupo titulo="Ritmo">
            <View className="flex-row gap-2">
              {RITMOS.map((r) => (
                <Opcao key={r.id} on={ritmo === r.id} titulo={r.nome} sub={`${r.porDia} por dia`} aoTocar={() => setRitmo(r.id)} />
              ))}
            </View>
          </Grupo>
          <Grupo titulo="Quanto quer gastar com passeios?">
            <View className="flex-row gap-2">
              {ORCAMENTOS.map((o) => (
                <Opcao key={o.id} on={orcamento === o.id} titulo={o.nome} aoTocar={() => setOrcamento(o.id)} />
              ))}
            </View>
          </Grupo>
          <Botao titulo="Ver os lugares" aoTocar={comecar} />
        </ScrollView>
      </View>
    )
  }

  if (etapa === 'roteiro') {
    return (
      <View className="flex-1 bg-fundo">
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
          {topo}
          <View className="gap-3 px-5 pt-4">
            {aviso ? <Aviso texto={aviso} /> : null}
            <RoteiroDoExplorar
              destinoNome={destino.nome}
              rotulos={rotulos}
              lugares={lugaresDoGrupo}
              salvo={diasSalvos}
              pessoas={pessoas}
              euSouAdm={euSouAdm}
              aoMudar={mudarRoteiro}
              aoReorganizar={() => mudarRoteiro(propor(lugaresDoGrupo))}
              aoVerMais={comecar}
              aoConvidar={() => void convidarProComboio(viagem.id, viagem.nome)}
              fotos={fotosDosLugares}
              mostrarConvite={!guiado}
            />
          </View>
        </ScrollView>
        {guiado ? (
          <View className="border-t border-linha bg-fundo px-5 pt-3" style={{ paddingBottom: insets.bottom + 16 }}>
            <Botao
              titulo="Continuar"
              aoTocar={() => router.replace(euSouAdm && pessoas <= 1 ? `/chamar-galera?viagem=${viagem.id}` : `/viagem/${viagem.id}`)}
            />
          </View>
        ) : null}
      </View>
    )
  }

  // ---------- Deck ----------
  const total = deslize.pilha.length
  const membros = viagem.membros
  const quemQuer = (catalogoId: string) =>
    (querem[catalogoId] ?? [])
      .filter((q) => q !== meuId)
      .map((q) => ({ nome: primeiroNome(membros.find((m) => m.id === q)?.nome ?? 'Alguém'), indice: Math.max(0, membros.findIndex((m) => m.id === q)) }))
  const faltamNoMatch = deuMatch ? membros.filter((m) => m.id !== meuId && !(querem[deuMatch.id] ?? []).includes(m.id)) : []
  const naoAbroMaoLiberado = podeNaoAbrirMao(deslize, jaTenho)
  // Sem fileira de botões: o gesto decide. Embaixo só a dica das direções e o "Desfazer"
  const altura = alturaCartao
  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      {topo}
      <View className="flex-1 px-4 pt-3">
        <View className="mb-3 flex-row items-center gap-3 px-1">
          <Text className="font-body-semibold text-[13px] text-suave">
            {Math.min(deslize.posicao + 1, total)} de {total}
          </Text>
          <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-areia">
            <View className="h-full rounded-full bg-caramelo" style={{ width: `${total ? Math.round((deslize.posicao / total) * 100) : 0}%` }} />
          </View>
          <Pressable accessibilityRole="button" onPress={() => abrirRoteiro(true)} hitSlop={8} className="min-h-[36px] justify-center">
            <Text className="font-body-bold text-[14px] text-couro">Pronto</Text>
          </Pressable>
        </View>

        {total === 0 ? (
          <View className="items-center gap-3 rounded-[20px] border-[1.5px] border-dashed border-tracejado p-8">
            <Text className="text-center font-body text-[15px] text-corpo">Achamos poucos lugares em {destino.nome} ainda.</Text>
            <Botao titulo="Adicionar um lugar" tipo="secundario" aoTocar={() => router.push('/lugares')} />
          </View>
        ) : (
          <View style={{ height: altura }}>
            {proximo ? <CartaoDoExplorar key={`b-${proximo.id}`} lugar={proximo} altura={altura} parado /> : null}
            {atual ? (
              <CartaoDoExplorar
                key={atual.id}
                lugar={atual}
                altura={altura}
                comando={comando}
                podeDecidir={podeDecidir}
                aoVoar={aoVoar}
                aoVerMais={() => setDetalhe(true)}
                querem={quemQuer(atual.id)}
              />
            ) : null}
          </View>
        )}

        {aviso ? <Aviso texto={aviso} /> : null}

        {total > 0 ? (
          <View className="mt-4 flex-row items-center justify-between px-1">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Desfazer"
              onPress={voltarUm}
              disabled={!deslize.historico.length}
              hitSlop={10}
              className="min-h-[40px] flex-row items-center gap-1.5 px-1"
              style={{ opacity: deslize.historico.length ? 1 : 0.35 }}
            >
              <Undo2 size={18} color={cor.couro} />
              <Text className="font-body-bold text-[14px] text-couro">Desfazer</Text>
            </Pressable>
            <View className="flex-row items-center gap-3">
              <Dica Icone={X} cor={cor.vermelho} texto="passo" />
              <Dica Icone={Star} cor={naoAbroMaoLiberado ? cor.caramelo : cor.apagado} texto="↑" />
              <Dica Icone={Heart} cor={cor.verde} texto="quero" />
            </View>
          </View>
        ) : null}
      </View>

      {/* Deu match! (spec 117, tela B): eu dei o "quero" que fechou o match */}
      <Comemoracao
        visivel={!!deuMatch}
        acima="Deu match no comboio"
        titulo={deuMatch?.nome ?? ''}
        topo={
          deuMatch ? (
            <View className="items-center">
              <View className="h-[150px] w-[150px] overflow-hidden rounded-full border-4 border-dourado bg-couro">
                {deuMatch.fotoUrl ? <Foto source={{ uri: deuMatch.fotoUrl }} style={{ width: '100%', height: '100%' }} /> : null}
              </View>
              <View className="-mt-5 flex-row" style={{ paddingLeft: 8 }}>
                {[meuId, ...(querem[deuMatch.id] ?? []).filter((q) => q !== meuId)].slice(0, 5).map((q) => {
                  const i = Math.max(0, membros.findIndex((m) => m.id === q))
                  return (
                    <View key={q} style={{ marginLeft: -8 }}>
                      <Avatar nome={membros[i]?.nome ?? '?'} indice={i} tamanho={40} borda="#3B2715" />
                    </View>
                  )
                })}
              </View>
            </View>
          ) : null
        }
        texto={
          deuMatch
            ? `${['Você', ...quemQuer(deuMatch.id).map((q) => q.nome)].join(', ').replace(/, ([^,]*)$/, ' e $1')} querem ir.${faltamNoMatch.length ? ` Falta ${faltamNoMatch.map((m) => primeiroNome(m.nome)).join(', ').replace(/, ([^,]*)$/, ' e $1')} ${faltamNoMatch.length === 1 ? 'opinar' : 'opinarem'}.` : ''}`
            : undefined
        }
        botoes={[
          { titulo: 'Adicionar a um dia', icone: <CalendarPlus size={18} color={cor.escuro} />, principal: true, aoTocar: () => { setDeuMatch(null); void abrirRoteiro(true) } },
          { titulo: 'Continuar deslizando', aoTocar: () => { setDeuMatch(null); if (acabou(deslize)) void abrirRoteiro(true) } },
        ]}
        aoFechar={() => setDeuMatch(null)}
      />

      {/* Ver mais */}
      <Modal visible={detalhe && !!atual} transparent animationType="slide" onRequestClose={() => setDetalhe(false)}>
        <Pressable accessibilityLabel="Fechar" onPress={() => setDetalhe(false)} className="flex-1 bg-black/40" />
        {atual ? (
          <View className="max-h-[80%] rounded-t-[26px] bg-fundo" style={{ paddingBottom: insets.bottom + 16 }}>
            <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
              {atual.fotoUrl ? <Foto source={{ uri: atual.fotoUrl }} style={{ width: '100%', height: 220, borderRadius: 16 }} /> : null}
              <Text className="font-display text-[24px] text-texto">{atual.nome}</Text>
              {atual.bairro ? <Text className="font-body text-[13px] text-suave">{atual.bairro}</Text> : null}
              <Text className="font-body text-[15px] leading-[22px] text-corpo">{atual.sobre ?? atual.porQue ?? 'Sem descrição ainda.'}</Text>
              <View className="flex-row gap-2">
                <Fato titulo="Quanto tempo" valor={tempoLegivel(atual.tempoMin)} />
                <Fato titulo="Preço" valor={precoLegivel(atual.gratis)} />
                <Fato titulo="Melhor hora" valor={atual.melhorHora ?? '—'} />
              </View>
              <Text className="font-body text-[12px] text-suave">
                {atual.fotoUrl ? `${creditoDaFoto(atual.fotoAutor, atual.fotoLicenca)} · ` : ''}Dados: Wikidata, Wikipédia e © OpenStreetMap · horários e preços: confira no site oficial
              </Text>
              <View className="flex-row gap-2.5">
                <View className="flex-1">
                  <Botao titulo="Passo" tipo="secundario" aoTocar={() => pedir('passo')} />
                </View>
                <View className="flex-1">
                  <Botao titulo="Quero ir" aoTocar={() => pedir('quero')} />
                </View>
              </View>
            </ScrollView>
          </View>
        ) : null}
      </Modal>
    </View>
  )
}

// "2027-06-04" → "Sexta-feira, 4 de junho"
function diaPorExtenso(dia: string) {
  try {
    const t = new Date(`${dia}T12:00:00Z`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
    return t.charAt(0).toUpperCase() + t.slice(1)
  } catch {
    return dia
  }
}

function Aviso({ texto }: { texto: string }) {
  return (
    <View className="mt-3 rounded-[12px] bg-chip px-3.5 py-2.5">
      <Text className="font-body text-[14px] text-texto">{texto}</Text>
    </View>
  )
}

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <View className="gap-2.5">
      <Text className="font-body-bold text-[15px] text-texto">{titulo}</Text>
      {children}
    </View>
  )
}

function Opcao({ on, titulo, sub, redonda, aoTocar }: { on: boolean; titulo: string; sub?: string; redonda?: boolean; aoTocar: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      onPress={aoTocar}
      className={`min-h-[44px] items-center justify-center border-[1.5px] px-3.5 py-2 ${redonda ? 'rounded-full' : 'flex-1 rounded-[14px]'} ${on ? 'border-couro bg-couro' : 'border-borda bg-cartao'}`}
    >
      <Text className={`text-center font-body-semibold text-[14px] ${on ? 'text-white' : 'text-texto'}`}>{titulo}</Text>
      {sub ? <Text className={`font-body text-[12px] ${on ? 'text-white' : 'text-suave'}`}>{sub}</Text> : null}
    </Pressable>
  )
}

function Fato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <View className="flex-1 gap-0.5 rounded-[14px] bg-cartao p-2.5">
      <Text className="font-body text-[11px] text-suave">{titulo}</Text>
      <Text className="font-body-bold text-[14px] text-texto">{valor}</Text>
    </View>
  )
}

// Dica de deslize (primeira viagem): ícone + direção
function Dica({ Icone, cor: tom, texto }: { Icone: typeof Heart; cor: string; texto: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <Icone size={15} color={tom} />
      <Text className="font-body-semibold text-[13px] text-texto">{texto}</Text>
    </View>
  )
}

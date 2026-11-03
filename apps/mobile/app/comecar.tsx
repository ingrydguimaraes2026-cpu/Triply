import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Animated, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Heart, MapPin, Minus, Plus, Search, Star, X } from 'lucide-react-native'
import {
  CIDADES_DA_PRE_CARGA,
  NOME_EM_PORTUGUES,
  buscarDestinos,
  carregarCatalogoDaCidade,
  criarViagem,
  moedaDoPais,
  montarDiasPelosVotos,
  montarPilha,
  porDiaDoRitmo,
  salvarEscolhaDoExplorar,
  semAcento,
  type Escolha,
  type EstiloId,
  type LugarDoCatalogo,
} from '@together/core'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { guardarRascunho, lerRascunho, type RascunhoDaViagem } from '../src/lib/rascunho'
import { useSessao } from '../src/lib/sessao'
import { supabase } from '../src/lib/supabase'
import { Agulha, type Humor } from '../src/ui/Agulha'
import { Selo, type NomeDoSelo } from '../src/ui/Selos'
import { CartaoDoExplorar } from '../src/ui/CartaoDoExplorar'
import { StatusBar } from '../src/ui/StatusBar'
import { Botao, Campo } from '../src/ui/pecas'
import { useTamanhoDaTela } from '../src/ui/Moldura'
import { cor, sombra } from '../theme'

// Começo do app (spec 116 v2): a Agulha conversa com a pessoa, uma pergunta por tela,
// deixa provar o deslize ANTES da conta (padrão WeWard/Headspace) e só pede a conta
// pra salvar o roteiro. Depois do login, esta mesma tela cria a viagem e abre o roteiro.

type Etapa = 'oi' | 'destino' | 'dias' | 'gosto' | 'preparando' | 'deslize' | 'previa' | 'conta' | 'criando'
const ORDEM: Etapa[] = ['oi', 'destino', 'dias', 'gosto', 'deslize', 'previa', 'conta']
const CARTOES_DO_GOSTINHO = 6

const SUGESTOES: { nome: string; pais: string }[] = [
  { nome: 'Rio de Janeiro', pais: 'BR' },
  { nome: 'Jericoacoara', pais: 'BR' },
  { nome: 'Gramado', pais: 'BR' },
  { nome: 'Lisboa', pais: 'PT' },
  { nome: 'Paris', pais: 'FR' },
  { nome: 'Buenos Aires', pais: 'AR' },
]
const GRUPOS: { id: string; nome: string; selo: NomeDoSelo; estilo?: EstiloId }[] = [
  { id: 'amigos', nome: 'Amigos', selo: 'galera' },
  { id: 'casal', nome: 'Casal', selo: 'casal', estilo: 'romantica' },
  { id: 'familia', nome: 'Família', selo: 'familia', estilo: 'criancas' },
  { id: 'sozinho', nome: 'Sozinho', selo: 'mochila' },
]
const GOSTOS: { id: EstiloId; nome: string; selo: NomeDoSelo }[] = [
  { id: 'ar_livre', nome: 'Natureza e trilhas', selo: 'montanha' },
  { id: 'cultura', nome: 'Museus e história', selo: 'museu' },
  { id: 'fotogenica', nome: 'Lugares pra foto', selo: 'camera' },
]

export default function Comecar() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { sessao, ehConvidado } = useSessao()
  const { escolher, recarregar } = useViagemAtual()
  const temConta = !!sessao && !ehConvidado

  // Voltando do login com um rascunho: cria a viagem direto
  const rascunhoGuardado = useRef(lerRascunho()).current
  // Com rascunho e sem conta (voltou do login): reabre no passo da conta, com as respostas
  const [etapa, setEtapa] = useState<Etapa>(rascunhoGuardado ? (temConta ? 'criando' : 'conta') : 'oi')
  const [busca, setBusca] = useState('')
  const [destino, setDestino] = useState<{ nome: string; pais: string | null } | null>(rascunhoGuardado ? { nome: rascunhoGuardado.destino, pais: rascunhoGuardado.pais } : null)
  const [dias, setDias] = useState(rascunhoGuardado?.dias ?? 4)
  const [grupo, setGrupo] = useState<string | null>(rascunhoGuardado ? 'amigos' : null)
  const [gostos, setGostos] = useState<EstiloId[]>(rascunhoGuardado?.estilos ?? [])
  const [pilha, setPilha] = useState<LugarDoCatalogo[]>([])
  const [posicao, setPosicao] = useState(0)
  const [escolhas, setEscolhas] = useState<Record<string, Escolha>>(rascunhoGuardado?.escolhas ?? {})
  const [comando, setComando] = useState<{ escolha: Escolha; vez: number } | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const vez = useRef(0)

  const estilos = useMemo(() => {
    const doGrupo = GRUPOS.find((g) => g.id === grupo)?.estilo
    const todos = doGrupo ? [...gostos, doGrupo] : gostos
    return todos.length ? todos : (['cultura'] as EstiloId[])
  }, [grupo, gostos])

  // A sessão chega um instante depois: quem voltou do login com rascunho vai direto criar
  useEffect(() => {
    if (temConta && rascunhoGuardado && etapa === 'conta') setEtapa('criando')
  }, [temConta, rascunhoGuardado, etapa])

  const rascunho = (): RascunhoDaViagem => ({ destino: destino!.nome, pais: destino!.pais, dias, estilos, escolhas })

  // ---------- Gostinho: entra como convidado (sem a pessoa ver) e carrega uns lugares ----------
  async function preparar() {
    setEtapa('preparando')
    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        const { error } = await supabase.auth.signInAnonymously()
        if (error) throw error
      }
      const cat = await carregarCatalogoDaCidade(supabase, { id: '', nome: destino!.nome, pais: destino!.pais ? (NOME_EM_PORTUGUES[destino!.pais] ?? null) : null })
      const p = montarPilha(cat.lugares, { estilos, orcamento: 'medio', tamanho: CARTOES_DO_GOSTINHO })
      if (p.length === 0) throw new Error('sem lugares')
      for (const l of p) if (l.fotoUrl) Image.prefetch(l.fotoUrl).catch(() => {}) // fotos prontas antes do cartão aparecer
      setPilha(p)
      setPosicao(0)
      setEtapa('deslize')
    } catch (e) {
      // Login anônimo desligado ou cidade sem catálogo: pula o gostinho
      console.warn('Gostinho do deslize pulado:', e)
      setEtapa(temConta ? 'criando' : 'conta')
    }
  }

  function pedir(e: Escolha) {
    if (!pilha[posicao]) return
    vez.current += 1
    setComando({ escolha: e, vez: vez.current })
  }

  function aoVoar(e: Escolha) {
    const lugar = pilha[posicao]
    if (!lugar) return
    setComando(null)
    setEscolhas((atual) => ({ ...atual, [lugar.id]: e }))
    if (posicao + 1 >= pilha.length) setEtapa('previa')
    else setPosicao(posicao + 1)
  }

  // ---------- Conta: guarda o rascunho e vai pro login ----------
  async function irPraConta(modo: 'criar' | 'entrar') {
    await guardarRascunho(rascunho())
    if (ehConvidado) await supabase.auth.signOut() // o convidado do gostinho não serve mais
    router.replace({ pathname: '/login', params: { modo } })
  }

  // ---------- Criar a viagem (já com conta) ----------
  useEffect(() => {
    if (etapa !== 'criando' || !temConta) return
    const r = rascunhoGuardado ?? (destino ? rascunho() : null)
    if (!r) {
      setEtapa('destino')
      return
    }
    let vivo = true
    ;(async () => {
      try {
        setErro(null)
        const id = await criarViagem(supabase, {
          nome: r.destino,
          dataInicio: null,
          dataFim: null,
          moeda: r.pais ? moedaDoPais(r.pais) : 'BRL',
          destinos: [{ nome: r.destino, pais: r.pais ? (NOME_EM_PORTUGUES[r.pais] ?? null) : null, latitude: null, longitude: null, dias: r.dias }],
        })
        const ids = Object.keys(r.escolhas)
        if (ids.length) {
          const [d] = await buscarDestinos(supabase, id)
          // O que curtiu no gostinho vira escolha de verdade na viagem
          if (d) await Promise.all(ids.map((c) => salvarEscolhaDoExplorar(supabase, id, d.id, sessao!.user.id, c, r.escolhas[c]).catch(() => null)))
        }
        await guardarRascunho(null)
        if (!vivo) return
        escolher(id)
        recarregar()
        router.replace({ pathname: '/explorar', params: { viagem: id, guiado: '1', ...(ids.length ? { roteiro: '1' } : { estilos: r.estilos.join(',') }) } })
      } catch (e) {
        console.error('Erro ao criar a primeira viagem:', e)
        if (vivo) setErro('Não deu pra criar a viagem. Confira a internet e tente de novo.')
      }
    })()
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa, temConta])

  // ---------- Tela ----------
  const passo = ORDEM.indexOf(etapa === 'preparando' ? 'deslize' : etapa)
  const voltar = () => {
    const anterior: Partial<Record<Etapa, Etapa>> = { destino: 'oi', dias: 'destino', gosto: 'dias', conta: 'gosto' }
    const para = anterior[etapa]
    if (para) setEtapa(para)
  }

  if (etapa === 'oi') {
    return (
      <View className="flex-1 bg-fundo px-7" style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}>
        <StatusBar style="dark" />
        <View className="flex-1 items-center justify-center gap-4">
          <Agulha humor="feliz" tamanho={170} />
          <Text className="mt-2 text-center font-display text-[36px] leading-[40px] text-texto">Oi, eu sou a Agulha</Text>
          <Text className="text-center font-body text-[17px] leading-[25px] text-corpo">Em 1 minuto eu monto o roteiro da sua viagem com a galera. Bora?</Text>
        </View>
        <Botao titulo="Bora" aoTocar={() => setEtapa('destino')} />
        {!temConta ? (
          <Pressable onPress={() => router.replace({ pathname: '/login', params: { modo: 'entrar' } })} className="mt-1 h-12 items-center justify-center">
            <Text className="font-body-semibold text-[15px] text-couro">Já tenho conta</Text>
          </Pressable>
        ) : null}
      </View>
    )
  }

  if (etapa === 'preparando' || etapa === 'criando') {
    return (
      <View className="flex-1 items-center justify-center gap-5 bg-fundo px-8">
        <StatusBar style="dark" />
        <Agulha humor="pensando" tamanho={140} />
        <Text className="text-center font-display text-[26px] leading-[30px] text-texto">
          {etapa === 'criando' ? 'Montando a sua viagem…' : `Separando os lugares de ${destino?.nome ?? 'lá'}…`}
        </Text>
        {etapa === 'preparando' ? <Text className="text-center font-body text-[14px] text-suave">Na primeira vez de uma cidade pode levar até 30 segundos.</Text> : null}
        {erro ? (
          <View className="gap-3 self-stretch">
            <Text className="text-center font-body-medium text-[14px] text-vermelho">{erro}</Text>
            <Botao titulo="Tentar de novo" aoTocar={() => setEtapa('oi')} tipo="secundario" />
          </View>
        ) : null}
      </View>
    )
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 bg-fundo" style={{ paddingTop: insets.top + 6 }}>
      <StatusBar style="dark" />
      {/* Barra de progresso fina + voltar */}
      <View className="flex-row items-center gap-3 px-5">
        <Pressable accessibilityLabel="Voltar" onPress={voltar} hitSlop={10} className="h-9 w-9 items-center justify-center" style={{ opacity: ['destino', 'dias', 'gosto', 'conta'].includes(etapa) ? 1 : 0 }}>
          <ArrowLeft size={22} color={cor.texto} />
        </Pressable>
        <View className="h-2 flex-1 overflow-hidden rounded-full bg-areia">
          <View className="h-full rounded-full bg-caramelo" style={{ width: `${Math.round((passo / (ORDEM.length - 1)) * 100)}%` }} />
        </View>
        <View className="w-9" />
      </View>

      {etapa === 'destino' ? (
        <Conversa fala="Pra onde vocês vão?">
          <Campo icone={<Search size={20} color={cor.couro} />} placeholder="Buscar cidade" value={busca} onChangeText={setBusca} autoCorrect={false} />
          <ListaDeCidades
            busca={busca}
            aoEscolher={(c) => {
              setDestino(c)
              setEtapa('dias')
            }}
          />
        </Conversa>
      ) : null}

      {etapa === 'dias' ? (
        <>
          <Conversa fala={`${destino?.nome}! Boa escolha. Quantos dias vocês vão ficar?`}>
            <View className="mt-6 flex-row items-center justify-center gap-6">
              <BotaoMaisMenos aoTocar={() => setDias(Math.max(1, dias - 1))}>
                <Minus size={22} color={cor.texto} />
              </BotaoMaisMenos>
              <View className="w-32 items-center">
                <Text className="font-display text-[76px] leading-[82px] text-texto">{dias}</Text>
                <Text className="font-body-semibold text-[15px] text-suave">{dias === 1 ? 'dia' : 'dias'}</Text>
              </View>
              <BotaoMaisMenos aoTocar={() => setDias(Math.min(30, dias + 1))}>
                <Plus size={22} color={cor.texto} />
              </BotaoMaisMenos>
            </View>
            <Text className="mt-6 text-center font-body text-[14px] text-suave">Não sabe as datas? Tudo bem, dá pra pôr depois.</Text>
          </Conversa>
          <Rodape>
            <Botao titulo="Continuar" aoTocar={() => setEtapa('gosto')} />
          </Rodape>
        </>
      ) : null}

      {etapa === 'gosto' ? (
        <>
          <Conversa fala="Com quem você vai?">
            <Chips opcoes={GRUPOS} marcadas={grupo ? [grupo] : []} aoTocar={(id) => setGrupo(id)} />
            <Bolha texto="E o que vocês curtem? Pode marcar mais de um." />
            <Chips opcoes={GOSTOS} marcadas={gostos} aoTocar={(id) => setGostos(gostos.includes(id as EstiloId) ? gostos.filter((g) => g !== id) : [...gostos, id as EstiloId])} />
          </Conversa>
          <Rodape>
            <Botao titulo="Ver os lugares" aoTocar={preparar} desabilitado={!grupo} />
          </Rodape>
        </>
      ) : null}

      {etapa === 'deslize' ? (
        <Deslize pilha={pilha} posicao={posicao} comando={comando} aoVoar={aoVoar} aoPedir={pedir} />
      ) : null}

      {etapa === 'previa' ? (
        <>
          <Previa destino={destino?.nome ?? ''} dias={dias} pilha={pilha} escolhas={escolhas} />
          <Rodape>
            <Botao titulo="Salvar meu roteiro" aoTocar={() => (temConta ? setEtapa('criando') : setEtapa('conta'))} />
          </Rodape>
        </>
      ) : null}

      {etapa === 'conta' ? (
        <>
          <Conversa fala="Crie sua conta pra guardar o roteiro e chamar a galera. Leva 20 segundos." humor="feliz">
            <View className="mt-4 gap-3 rounded-3xl bg-cartao p-5" style={sombra.cartao}>
              <Vantagem selo="mapa" texto="O roteiro fica salvo no seu celular e no de quem for" />
              <Vantagem selo="cartas" texto="A galera desliza também e o roteiro se ajusta" />
              <Vantagem selo="mala" texto="Contas, hospedagem e fotos do grupo num lugar só" />
            </View>
          </Conversa>
          <Rodape>
            <Botao titulo="Criar minha conta" aoTocar={() => void irPraConta('criar')} />
            <Pressable onPress={() => void irPraConta('entrar')} className="h-12 items-center justify-center">
              <Text className="font-body-semibold text-[15px] text-couro">Já tenho conta</Text>
            </Pressable>
          </Rodape>
        </>
      ) : null}
    </KeyboardAvoidingView>
  )
}

// ---------- Peças da conversa ----------

// A Agulha fala num balão (entra deslizando) e o conteúdo vem embaixo
function Conversa({ fala, humor = 'parada', children }: { fala: string; humor?: Humor; children: ReactNode }) {
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
      <View className="mb-5 flex-row items-end gap-1">
        <View className="-ml-2">
          <Agulha humor={humor} tamanho={78} sombra={false} />
        </View>
        <Bolha texto={fala} grande />
      </View>
      {children}
    </ScrollView>
  )
}

function Bolha({ texto, grande }: { texto: string; grande?: boolean }) {
  const entrada = useRef(new Animated.Value(0)).current
  useEffect(() => {
    entrada.setValue(0)
    Animated.spring(entrada, { toValue: 1, useNativeDriver: Platform.OS !== 'web', friction: 7 }).start()
  }, [texto, entrada])
  return (
    // O estilo fica numa View comum (o className não pega no Animated.View); o Animated só mexe
    <Animated.View
      style={[grande ? { flex: 1, marginBottom: 16 } : { alignSelf: 'flex-start', marginTop: 28, marginBottom: 12 }, { opacity: entrada, transform: [{ translateY: entrada.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}
    >
      <View className="rounded-3xl rounded-bl-md bg-cartao px-4 py-3" style={sombra.cartao}>
        <Text className={`font-body-semibold text-texto ${grande ? 'text-[19px] leading-[26px]' : 'text-[16px] leading-[22px]'}`}>{texto}</Text>
      </View>
    </Animated.View>
  )
}

function Rodape({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets()
  return (
    <View className="px-5 pt-3" style={{ paddingBottom: insets.bottom + 16 }}>
      {children}
    </View>
  )
}

function Chips({ opcoes, marcadas, aoTocar }: { opcoes: { id: string; nome: string; selo: NomeDoSelo }[]; marcadas: string[]; aoTocar: (id: string) => void }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {opcoes.map((o) => {
        const on = marcadas.includes(o.id)
        return (
          <Pressable
            key={o.id}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => aoTocar(o.id)}
            className={`min-h-[52px] flex-row items-center gap-2 rounded-2xl border-[1.5px] py-1.5 pl-2 pr-4 ${on ? 'border-couro bg-couro' : 'border-borda bg-cartao'}`}
          >
            <Selo nome={o.selo} tamanho={34} tom={on ? 'escuro' : 'claro'} />
            <Text className={`font-body-bold text-[15px] ${on ? 'text-white' : 'text-texto'}`}>{o.nome}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

function BotaoMaisMenos({ children, aoTocar }: { children: ReactNode; aoTocar: () => void }) {
  return (
    <Pressable onPress={aoTocar} className="h-14 w-14 items-center justify-center rounded-full bg-cartao active:opacity-80" style={sombra.cartao}>
      {children}
    </Pressable>
  )
}

function ListaDeCidades({ busca, aoEscolher }: { busca: string; aoEscolher: (c: { nome: string; pais: string | null }) => void }) {
  const digitado = busca.trim()
  const achadas = useMemo(() => {
    const t = semAcento(digitado)
    if (t.length < 2) return []
    return CIDADES_DA_PRE_CARGA.filter((c) => semAcento(c.nome).includes(t)).slice(0, 6)
  }, [digitado])
  const lista = digitado.length > 1 ? achadas : SUGESTOES
  return (
    <View className="mt-3 gap-2">
      {lista.map((c) => (
        <Pressable
          key={`${c.nome}-${c.pais}`}
          onPress={() => aoEscolher(c)}
          className="min-h-[58px] flex-row items-center gap-3 rounded-2xl border-[1.5px] border-borda bg-cartao px-4 active:border-couro"
        >
          <MapPin size={20} color={cor.couro} />
          <Text className="flex-1 font-body-bold text-[16px] text-texto">{c.nome}</Text>
          <Text className="font-body text-[13px] text-suave">{NOME_EM_PORTUGUES[c.pais] ?? c.pais}</Text>
        </Pressable>
      ))}
      {digitado.length > 1 && !achadas.some((c) => semAcento(c.nome) === semAcento(digitado)) ? (
        <Pressable onPress={() => aoEscolher({ nome: digitado, pais: null })} className="min-h-[58px] flex-row items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-tracejado px-4">
          <Search size={20} color={cor.couro} />
          <Text className="flex-1 font-body-bold text-[16px] text-texto">Usar “{digitado}”</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

function Deslize({
  pilha,
  posicao,
  comando,
  aoVoar,
  aoPedir,
}: {
  pilha: LugarDoCatalogo[]
  posicao: number
  comando: { escolha: Escolha; vez: number } | null
  aoVoar: (e: Escolha) => void
  aoPedir: (e: Escolha) => void
}) {
  const { height } = useTamanhoDaTela()
  const insets = useSafeAreaInsets()
  const altura = Math.round(Math.min(520, Math.max(340, height - insets.top - insets.bottom - 300)))
  const atual = pilha[posicao]
  const proximo = pilha[posicao + 1]
  return (
    <View className="flex-1 px-4 pt-3">
      <View className="mb-3 flex-row items-end gap-1 px-1">
        <View className="-ml-2">
          <Agulha humor="feliz" tamanho={60} sombra={false} />
        </View>
        <Bolha texto={posicao === 0 ? 'Curte ou passa? Arrasta pro lado.' : `Mais ${pilha.length - posicao}!`} grande />
      </View>
      <View style={{ height: altura }}>
        {proximo ? <CartaoDoExplorar key={`b-${proximo.id}`} lugar={proximo} altura={altura} parado /> : null}
        {atual ? <CartaoDoExplorar key={atual.id} lugar={atual} altura={altura} comando={comando} aoVoar={aoVoar} /> : null}
      </View>
      <View className="mt-4 flex-row items-center justify-center gap-5">
        <BotaoRedondoGrande rotulo="Passo" aoTocar={() => aoPedir('passo')}>
          <X size={26} color={cor.vermelho} strokeWidth={2.6} />
        </BotaoRedondoGrande>
        <BotaoRedondoGrande rotulo="Não abro mão" pequeno aoTocar={() => aoPedir('nao_abro_mao')}>
          <Star size={22} color={cor.caramelo} fill={cor.dourado} />
        </BotaoRedondoGrande>
        <BotaoRedondoGrande rotulo="Quero" principal aoTocar={() => aoPedir('quero')}>
          <Heart size={26} color="#fff" fill="#fff" />
        </BotaoRedondoGrande>
      </View>
    </View>
  )
}

function BotaoRedondoGrande({ children, rotulo, aoTocar, principal, pequeno }: { children: ReactNode; rotulo: string; aoTocar: () => void; principal?: boolean; pequeno?: boolean }) {
  const t = pequeno ? 52 : 62
  return (
    <Pressable accessibilityLabel={rotulo} onPress={aoTocar} className={`items-center justify-center rounded-full active:opacity-80 ${principal ? 'bg-couro' : 'bg-cartao'}`} style={[{ width: t, height: t }, sombra.flutuante]}>
      {children}
    </Pressable>
  )
}

// Prévia do roteiro: o que curtiu, 2 por dia (o roteiro de verdade é montado depois da conta)
function Previa({ destino, dias, pilha, escolhas }: { destino: string; dias: number; pilha: LugarDoCatalogo[]; escolhas: Record<string, Escolha> }) {
  // Mesma conta do roteiro que abre depois (Explorar, ritmo equilibrado): o que a pessoa vê aqui é o que vai ganhar
  const curtidos = pilha.filter((l) => escolhas[l.id] === 'nao_abro_mao' || escolhas[l.id] === 'quero')
  const proposta = montarDiasPelosVotos(
    Array.from({ length: dias }, (_, i) => `Dia ${i + 1}`),
    curtidos.map((l) => ({ id: l.id, nome: l.nome, tipo: 'passeio', votos: 1, prioridades: escolhas[l.id] === 'nao_abro_mao' ? 1 : 0, latitude: l.latitude, longitude: l.longitude })),
    porDiaDoRitmo('equilibrado'),
  )
  const blocos = Array.from({ length: Math.min(dias, 3) }, (_, i) => proposta.dias.find((d) => d.dia === `Dia ${i + 1}`)?.itens ?? [])
  return (
    <Conversa fala={curtidos.length ? `Pronto! Olha o começo do roteiro de ${destino}:` : `Tudo bem! Eu monto ${destino} com os lugares mais famosos.`} humor="feliz">
      <View className="gap-2.5">
        {blocos.map((lugares, i) => (
          <View key={i} className="rounded-2xl bg-cartao p-4" style={[sombra.cartao, { opacity: lugares.length ? 1 : 0.55 }]}>
            <Text className="font-body-bold text-[12px] uppercase tracking-[1.4px] text-caramelo">Dia {i + 1}</Text>
            <Text className="mt-1 font-body-bold text-[16px] leading-[22px] text-texto">{lugares.length ? lugares.map((l) => l.nome).join(' · ') : 'Vou completar com o que a galera curtir'}</Text>
          </View>
        ))}
        {dias > 3 ? <Text className="text-center font-body text-[14px] text-suave">+ {dias - 3} {dias - 3 === 1 ? 'dia' : 'dias'}</Text> : null}
      </View>
    </Conversa>
  )
}

function Vantagem({ selo, texto }: { selo: NomeDoSelo; texto: string }) {
  return (
    <View className="flex-row items-center gap-3">
      <Selo nome={selo} tamanho={36} />
      <Text className="flex-1 font-body-semibold text-[15px] leading-[21px] text-texto">{texto}</Text>
    </View>
  )
}

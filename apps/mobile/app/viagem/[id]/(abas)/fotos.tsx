import { useCallback, useState, type ReactNode } from 'react'
import { Image, Pressable, ScrollView, Text, View } from 'react-native'
import { StatusBar } from '../../../../src/ui/StatusBar'
import { useFocusEffect, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { buscarDestinos, buscarFotos, buscarPostsDaViagem, type FotoDaViagem, type ViagemComDetalhes } from '@together/core'
import { useCarregar } from '../../../../src/dados/useCarregar'
import { useViagemAtual } from '../../../../src/dados/viagemAtual'
import { diaCurto, diasDaViagem, paraIso, primeiroNome } from '../../../../src/lib/formato'
import { supabase } from '../../../../src/lib/supabase'
import { Norti } from '../../../../src/ui/Norti'
import { FeedDaViagem } from '../../../../src/ui/FeedDaViagem'
import { Avatar, Carregando, ErroNaTela } from '../../../../src/ui/pecas'
import { SemViagem } from '../../../../src/ui/SemViagem'
import { puxarPraAtualizar } from '../../../../src/ui/Puxar'
import { Icone } from '../../../../src/ui/Icone'
import { Entra } from '../../../../src/ui/Entra'
import { fonte, rotulo, titulo, trabalho } from '../../../../theme'

// Fotos no caminho B "Embarque" (10/11/2026). Régua: docs/design/direcao-redesenho/embarque.html,
// tela "Fotos": rótulo "N fotos · N pessoas", título grande, o álbum em mosaico e um botão só, "Publicar",
// acima da barra. Continua o "Feed" (posts, curtidas, comentários) e o "Por dia" com filtro por pessoa.
export default function Fotos() {
  const { atual, meuId } = useViagemAtual()
  if (!atual) return <SemViagem titulo="Fotos" />
  return <FotosDaViagem viagem={atual} meuId={meuId} />
}

function FotosDaViagem({ viagem, meuId }: { viagem: ViagemComDetalhes; meuId: string }) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [modo, setModo] = useState<'feed' | 'dias'>('feed')
  const [pessoa, setPessoa] = useState<string | null>(null)
  const carga = useCarregar(async () => {
    const [fotos, posts, destinos] = await Promise.all([buscarFotos(supabase, viagem.id), buscarPostsDaViagem(supabase, viagem.id), buscarDestinos(supabase, viagem.id)])
    return { fotos, posts, destinos }
  }, [viagem.id])
  const { recarregar } = carga
  useFocusEffect(useCallback(() => recarregar(), [recarregar]))

  if (carga.status === 'carregando') return <Carregando />
  if (carga.status === 'erro') return <ErroNaTela aoTentar={carga.recarregar} />

  const todas = carga.dados.fotos
  const fotos = pessoa ? todas.filter((f) => f.enviada_por === pessoa) : todas
  const quemPostou = new Set(todas.map((f) => f.enviada_por)).size
  const grupos = agruparPorDia(fotos, viagem)
  const indice = (id: string) => Math.max(0, viagem.membros.findIndex((m) => m.id === id))
  const nome = (id: string) => (id === meuId ? 'Você' : primeiroNome(viagem.membros.find((m) => m.id === id)?.nome ?? '?'))

  return (
    <View className="flex-1" style={{ backgroundColor: trabalho.fundo }}>
      <StatusBar style="dark" />
      <ScrollView refreshControl={puxarPraAtualizar(carga)} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
        <Entra ordem={0}>
          <View style={{ paddingHorizontal: 18, paddingTop: 6, paddingBottom: 12 }}>
            <Text style={[rotulo, { color: trabalho.texto2 }]}>
              {todas.length} {todas.length === 1 ? 'foto' : 'fotos'} · {quemPostou} {quemPostou === 1 ? 'pessoa' : 'pessoas'}
            </Text>
            <Text style={[titulo(32), { color: trabalho.texto, marginTop: 6 }]}>Fotos</Text>
          </View>
        </Entra>

        {/* Feed ou Por dia: segmento do B */}
        <Entra ordem={1}>
          <View className="flex-row rounded-full border p-[3px]" style={{ marginHorizontal: 18, backgroundColor: trabalho.superficie, borderColor: trabalho.linha }}>
            {(['feed', 'dias'] as const).map((m) => {
              const ativo = modo === m
              return (
                <Pressable
                  key={m}
                  onPress={() => setModo(m)}
                  className="h-9 flex-1 items-center justify-center rounded-full"
                  style={ativo ? { backgroundColor: trabalho.acento } : undefined}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: ativo }}
                >
                  <Text style={{ fontFamily: fonte.item, fontSize: 13.5, color: ativo ? trabalho.acentoTexto : trabalho.texto }}>{m === 'feed' ? 'Feed' : 'Por dia'}</Text>
                </Pressable>
              )
            })}
          </View>
        </Entra>

        {modo === 'feed' ? (
          carga.dados.posts.length === 0 ? (
            <Vazio titulo="Nenhum post ainda" texto={'Toque em "Publicar" pra mandar as primeiras fotos pra galera.'} />
          ) : (
            <Entra ordem={2} style={{ marginTop: 14, paddingHorizontal: 14 }}>
              <FeedDaViagem posts={carga.dados.posts} membros={viagem.membros} meuId={meuId} destinos={carga.dados.destinos} aoMudar={recarregar} />
            </Entra>
          )
        ) : null}

        {modo === 'dias' ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3.5" contentContainerStyle={{ gap: 6, paddingHorizontal: 18 }}>
              <Chip ativo={!pessoa} aoTocar={() => setPessoa(null)} texto="Todos" />
              {viagem.membros.map((m, i) => (
                <Chip key={m.id} ativo={pessoa === m.id} aoTocar={() => setPessoa(pessoa === m.id ? null : m.id)} texto={nome(m.id)}>
                  <Avatar nome={m.nome} indice={i} tamanho={22} />
                </Chip>
              ))}
            </ScrollView>

            {fotos.length === 0 ? (
              <Vazio titulo="Nenhuma foto ainda" texto="As fotos que a galera publicar aparecem aqui, separadas por dia." />
            ) : (
              grupos.map((g, n) => (
                <Entra key={g.titulo} ordem={2 + n}>
                  <View className="flex-row items-baseline justify-between" style={{ marginHorizontal: 18, marginTop: 18, marginBottom: 10 }}>
                    <Text style={{ fontFamily: fonte.item, fontSize: 15, letterSpacing: -0.15, color: trabalho.texto }}>{g.titulo}</Text>
                    <Text style={[rotulo, { color: trabalho.texto2 }]}>
                      {g.fotos.length} {g.fotos.length === 1 ? 'foto' : 'fotos'}
                    </Text>
                  </View>
                  <Mosaico fotos={g.fotos} nome={nome} nomeCompleto={(id) => viagem.membros.find((m) => m.id === id)?.nome ?? '?'} indice={indice} />
                </Entra>
              ))
            )}
          </>
        ) : null}
      </ScrollView>

      {/* Um botão só, acima da barra de vidro */}
      <View className="absolute" style={{ right: 16, bottom: insets.bottom + 4 }}>
        <Pressable
          onPress={() => router.push('/novo-post')}
          accessibilityRole="button"
          accessibilityLabel="Publicar fotos"
          className="h-[50px] flex-row items-center gap-1.5 rounded-full pl-3.5 pr-[18px] active:opacity-90"
          style={{ backgroundColor: trabalho.acento, boxShadow: '0 10px 24px rgba(0,0,0,0.3)' }}
        >
          <Icone nome="nova-foto" tamanho={20} cor={trabalho.acentoTexto} />
          <Text style={{ fontFamily: fonte.item, fontSize: 14.5, color: trabalho.acentoTexto }}>Publicar</Text>
        </Pressable>
      </View>
    </View>
  )
}

function Vazio({ titulo: t, texto }: { titulo: string; texto: string }) {
  return (
    <View className="mt-12 items-center gap-2 px-8">
      <Norti humor="dormindo" tamanho={110} />
      <Text style={[titulo(22), { color: trabalho.texto }]}>{t}</Text>
      <Text className="text-center" style={{ fontFamily: fonte.corpo, fontSize: 14, lineHeight: 20, color: trabalho.texto2 }}>
        {texto}
      </Text>
    </View>
  )
}

function Chip({ ativo, aoTocar, texto, children }: { ativo: boolean; aoTocar: () => void; texto: string; children?: ReactNode }) {
  return (
    <Pressable
      onPress={aoTocar}
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}
      className={`h-9 flex-row items-center gap-1.5 rounded-full border ${children ? 'pl-1 pr-3' : 'px-3.5'}`}
      style={{ backgroundColor: ativo ? trabalho.acento : trabalho.superficie, borderColor: ativo ? trabalho.acento : trabalho.linha }}
    >
      {children}
      <Text style={{ fontFamily: fonte.corpoForte, fontSize: 12.5, color: ativo ? trabalho.acentoTexto : trabalho.texto }}>{texto}</Text>
    </Pressable>
  )
}

// Mosaico do B: de 3 em 3, uma foto alta na esquerda e duas empilhadas na direita
function Mosaico({ fotos, nome, nomeCompleto, indice }: { fotos: FotoDaViagem[]; nome: (id: string) => string; nomeCompleto: (id: string) => string; indice: (id: string) => number }) {
  const blocos: FotoDaViagem[][] = []
  for (let i = 0; i < fotos.length; i += 3) blocos.push(fotos.slice(i, i + 3))
  const foto = (f: FotoDaViagem, altura: number) => (
    <View key={f.id} className="overflow-hidden rounded-[14px]" style={{ height: altura, backgroundColor: trabalho.superficie2 }}>
      {f.url ? <Image source={{ uri: f.url }} className="h-full w-full" resizeMode="cover" /> : null}
      <View className="absolute left-2 top-2 flex-row items-center gap-1.5 rounded-full py-[3px] pl-[3px] pr-2" style={{ backgroundColor: 'rgba(251,243,230,0.92)' }}>
        <Avatar nome={nomeCompleto(f.enviada_por)} indice={indice(f.enviada_por)} tamanho={18} />
        <Text style={{ fontFamily: fonte.corpoNegrito, fontSize: 11, color: trabalho.texto }}>{nome(f.enviada_por)}</Text>
      </View>
    </View>
  )
  return (
    <View className="gap-1" style={{ paddingHorizontal: 14 }}>
      {blocos.map((b, i) =>
        b.length === 3 ? (
          <View key={i} className="flex-row gap-1">
            <View className="flex-1">{foto(b[0], 244)}</View>
            <View className="flex-1 gap-1">
              {foto(b[1], 120)}
              {foto(b[2], 120)}
            </View>
          </View>
        ) : (
          <View key={i} className="flex-row gap-1">
            {b.map((f) => (
              <View key={f.id} className="flex-1">
                {foto(f, b.length === 1 ? 200 : 150)}
              </View>
            ))}
          </View>
        ),
      )}
    </View>
  )
}

// "Dia 2 · sáb 15" quando a foto cai dentro da viagem; senão só a data
function agruparPorDia(fotos: FotoDaViagem[], viagem: ViagemComDetalhes) {
  const dias = diasDaViagem(viagem.dataInicio, viagem.dataFim).map(paraIso)
  const grupos: { titulo: string; fotos: FotoDaViagem[] }[] = []
  for (const f of fotos) {
    const data = new Date(f.criado_em)
    const n = dias.indexOf(paraIso(data))
    const titulo = n >= 0 ? `Dia ${n + 1} · ${diaCurto(data)}` : diaCurto(data)
    const g = grupos.find((x) => x.titulo === titulo)
    if (g) g.fotos.push(f)
    else grupos.push({ titulo, fotos: [f] })
  }
  return grupos
}

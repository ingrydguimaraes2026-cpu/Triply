import { useState } from 'react'
import { Modal, Pressable, ScrollView, Text, View } from 'react-native'
import Svg, { Circle, Polyline } from 'react-native-svg'
import { ArrowDown, ArrowUp, MoreHorizontal, Star } from './icones'
import { arrumarRoteiro, moverNaOrdem, moverPraDia, regiaoEspalhada, trecho, type DiasDoRoteiro, type LugarComVotos } from '@together/core'
import { Botao } from './pecas'
import { cor, sombra } from '../../theme'

// Roteiro do destino (spec 115 v2) no app: o plano dia a dia que o grupo arruma junto.
// Cada lugar pode subir/descer, mudar de dia ou ir pro "Sem dia". Tudo salva na hora (a tela salva).
const SEM_DIA = -1
type Ponto = { latitude: number; longitude: number }

type Props = {
  destinoNome: string
  rotulos: string[] // "Sexta-feira, 4 de junho" ou "Dia 1"
  lugares: LugarComVotos[] // o que o grupo curtiu neste destino, os mais importantes primeiro
  salvo: DiasDoRoteiro
  pessoas: number
  euSouAdm: boolean
  aoMudar: (dias: DiasDoRoteiro) => void
  aoReorganizar: () => void
  aoVerMais: () => void
  aoConvidar: () => void
}

export function RoteiroDoExplorar({ destinoNome, rotulos, lugares, salvo, pessoas, euSouAdm, aoMudar, aoReorganizar, aoVerMais, aoConvidar }: Props) {
  const [aberto, setAberto] = useState(0)
  const [mexendo, setMexendo] = useState<LugarComVotos | null>(null)

  const porId = new Map(lugares.map((l) => [l.id, l]))
  const { dias, semDia } = arrumarRoteiro(
    salvo,
    lugares.map((l) => l.id),
    rotulos.length,
  )
  const ids = aberto === SEM_DIA ? semDia : (dias[aberto] ?? [])
  const doDia = ids.map((id) => porId.get(id)).filter((l): l is LugarComVotos => !!l)

  const ponto = (l: LugarComVotos | undefined): Ponto | null => (l && l.latitude != null && l.longitude != null ? { latitude: l.latitude, longitude: l.longitude } : null)
  const todos = lugares.map(ponto).filter((p): p is Ponto => !!p)
  const caixa = todos.length
    ? {
        n: Math.max(...todos.map((p) => p.latitude)),
        s: Math.min(...todos.map((p) => p.latitude)),
        l: Math.max(...todos.map((p) => p.longitude)),
        o: Math.min(...todos.map((p) => p.longitude)),
      }
    : null
  const noMapa = (p: Ponto) => {
    if (!caixa) return { x: 50, y: 30 }
    const w = Math.max(caixa.l - caixa.o, 0.002)
    const h = Math.max(caixa.n - caixa.s, 0.002)
    return { x: 6 + ((p.longitude - caixa.o) / w) * 88, y: (8 + ((caixa.n - p.latitude) / h) * 84) * 0.6 }
  }
  const idsDoDia = new Set(ids)
  const espalhada = regiaoEspalhada(todos)

  const mudar = (novo: DiasDoRoteiro) => {
    aoMudar(novo)
    setMexendo(null)
  }

  const curtiram = (l: LugarComVotos) => new Set([...l.votos, ...l.prioridades]).size

  return (
    <View className="gap-4">
      {pessoas <= 1 ? (
        <View className="gap-2.5 rounded-[18px] bg-chip p-4">
          <Text className="font-body text-[14px] leading-[20px] text-texto">
            <Text className="font-body-bold">Chame a galera pra deslizar também.</Text> O que vocês curtirem juntos entra aqui, com o selo de quantos curtiram.
          </Text>
          {euSouAdm ? <Botao titulo="Mandar o convite" aoTocar={aoConvidar} compacto /> : null}
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {rotulos.map((_, i) => (
          <AbaDoDia key={i} ativa={i === aberto} titulo={`Dia ${i + 1}`} sub={`${dias[i].length} ${dias[i].length === 1 ? 'lugar' : 'lugares'}`} aoTocar={() => setAberto(i)} />
        ))}
        {semDia.length > 0 ? <AbaDoDia ativa={aberto === SEM_DIA} titulo="Sem dia" sub={`${semDia.length}`} aoTocar={() => setAberto(SEM_DIA)} /> : null}
      </ScrollView>

      {caixa ? (
        <View className="h-[150px] overflow-hidden rounded-[18px] bg-areia" accessibilityLabel={`Mapa: ${doDia.map((l) => l.nome).join(', ')}`}>
          <Svg width="100%" height="100%" viewBox="0 0 100 60" preserveAspectRatio="none">
            <Polyline
              points={doDia
                .map(ponto)
                .filter((p): p is Ponto => !!p)
                .map((p) => `${noMapa(p).x},${noMapa(p).y}`)
                .join(' ')}
              fill="none"
              stroke={cor.couro}
              strokeWidth={0.5}
              strokeDasharray="1.5 1.5"
            />
            {lugares.map((l) => {
              const p = ponto(l)
              if (!p) return null
              const m = noMapa(p)
              return <Circle key={l.id} cx={m.x} cy={m.y} r={idsDoDia.has(l.id) ? 1.8 : 1.1} fill={idsDoDia.has(l.id) ? cor.couro : cor.tracejado} stroke="#fff" strokeWidth={0.4} />
            })}
          </Svg>
        </View>
      ) : null}

      <View>
        <Text className="mb-2 font-body-bold text-[15px] text-texto">{aberto === SEM_DIA ? 'Ainda sem dia' : rotulos[aberto]}</Text>
        {doDia.length === 0 ? (
          <View className="rounded-[16px] border-[1.5px] border-dashed border-tracejado p-4">
            <Text className="font-body text-[13px] text-suave">{aberto === SEM_DIA ? 'Nada sobrando.' : 'Dia livre. Quer ver mais lugares pra ele?'}</Text>
          </View>
        ) : (
          doDia.map((l, k) => {
            const antes = k > 0 ? ponto(doDia[k - 1]) : null
            const aqui = ponto(l)
            const n = curtiram(l)
            return (
              <View key={l.id}>
                {antes && aqui && aberto !== SEM_DIA ? (
                  <View className="ml-[26px] border-l-2 border-tracejado py-1 pl-3">
                    <Text className="font-body text-[12px] text-suave">{trecho(antes, aqui)}</Text>
                  </View>
                ) : null}
                <View className="flex-row items-center gap-3 rounded-[16px] bg-cartao p-3" style={sombra.cartao}>
                  <Text className="w-6 text-center font-body-bold text-[13px] text-couro">{aberto === SEM_DIA ? '•' : k + 1}</Text>
                  <View className="flex-1">
                    <Text className="font-body-bold text-[15px] text-texto">{l.nome}</Text>
                    {pessoas > 1 ? (
                      <Text className="font-body-semibold text-[12px]" style={{ color: n >= 2 ? cor.verde : cor.suave }}>
                        {n} de {pessoas} curtiram
                      </Text>
                    ) : null}
                  </View>
                  {l.prioridades.length > 0 ? <Star size={16} color={cor.caramelo} fill={cor.dourado} accessibilityLabel="Não abro mão" /> : null}
                  <Pressable accessibilityRole="button" accessibilityLabel={`Mexer em ${l.nome}`} onPress={() => setMexendo(l)} hitSlop={8} className="h-11 w-11 items-center justify-center">
                    <MoreHorizontal size={20} color={cor.suave} />
                  </Pressable>
                </View>
              </View>
            )
          })
        )}
      </View>

      {espalhada ? (
        <View className="rounded-[12px] bg-chip px-3.5 py-2.5">
          <Text className="font-body text-[14px] text-texto">Região grande: vale dormir em 2 lugares diferentes.</Text>
        </View>
      ) : null}

      <View className="gap-2.5">
        <Botao titulo="Ver mais lugares" aoTocar={aoVerMais} tipo="secundario" />
        <Pressable accessibilityRole="button" onPress={aoReorganizar} className="min-h-[44px] items-center justify-center">
          <Text className="font-body-bold text-[14px] text-couro">Reorganizar tudo pela proximidade</Text>
        </Pressable>
      </View>

      {/* "…": mais cedo, mais tarde, mover pra outro dia */}
      <Modal visible={!!mexendo} transparent animationType="slide" onRequestClose={() => setMexendo(null)}>
        <Pressable accessibilityLabel="Fechar" onPress={() => setMexendo(null)} className="flex-1 bg-black/40" />
        {mexendo ? (
          <View className="gap-2 rounded-t-[26px] bg-fundo px-5 pb-8 pt-5">
            <Text className="mb-1 font-display text-[22px] text-texto">{mexendo.nome}</Text>
            {aberto !== SEM_DIA ? (
              <View className="flex-row gap-2">
                <OpcaoDoMenu titulo="Mais cedo" Icone={ArrowUp} aoTocar={() => mudar(moverNaOrdem(dias, mexendo.id, -1))} />
                <OpcaoDoMenu titulo="Mais tarde" Icone={ArrowDown} aoTocar={() => mudar(moverNaOrdem(dias, mexendo.id, 1))} />
              </View>
            ) : null}
            <Text className="mt-2 font-body-bold text-[13px] text-suave">Mover pra</Text>
            <View className="flex-row flex-wrap gap-2">
              {rotulos.map((_, i) =>
                i === aberto ? null : <OpcaoDoMenu key={i} titulo={`Dia ${i + 1}`} aoTocar={() => mudar(moverPraDia(dias, mexendo.id, i))} />,
              )}
              {aberto !== SEM_DIA ? <OpcaoDoMenu titulo="Sem dia" aoTocar={() => mudar(moverPraDia(dias, mexendo.id, null))} /> : null}
            </View>
          </View>
        ) : null}
      </Modal>
      <Text className="text-center font-body text-[12px] text-suave">Roteiro de {destinoNome}: todo mundo do comboio pode arrumar</Text>
    </View>
  )
}

function AbaDoDia({ ativa, titulo, sub, aoTocar }: { ativa: boolean; titulo: string; sub: string; aoTocar: () => void }) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: ativa }}
      onPress={aoTocar}
      className={`min-w-[76px] items-center justify-center rounded-[14px] border-[1.5px] px-3 py-2 ${ativa ? 'border-couro bg-couro' : 'border-borda bg-cartao'}`}
    >
      <Text className={`font-body-bold text-[14px] ${ativa ? 'text-white' : 'text-texto'}`}>{titulo}</Text>
      <Text className={`font-body text-[11px] ${ativa ? 'text-white' : 'text-suave'}`}>{sub}</Text>
    </Pressable>
  )
}

function OpcaoDoMenu({ titulo, Icone, aoTocar }: { titulo: string; Icone?: typeof ArrowUp; aoTocar: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={aoTocar} className="min-h-[44px] flex-row items-center gap-2 rounded-[12px] border-[1.5px] border-borda bg-cartao px-3.5">
      {Icone ? <Icone size={16} color={cor.couro} /> : null}
      <Text className="font-body-semibold text-[14px] text-texto">{titulo}</Text>
    </Pressable>
  )
}

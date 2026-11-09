import { useState } from 'react'
import { Image, Modal, Pressable, Text, View } from 'react-native'
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
  fotos?: Record<string, string> // id do lugar → foto (vem do catálogo do Explorar)
  mostrarConvite?: boolean // na primeira viagem guiada o "Continuar" já leva pra chamar a galera
}

export function RoteiroDoExplorar({ destinoNome, rotulos, lugares, salvo, pessoas, euSouAdm, aoMudar, aoReorganizar, aoVerMais, aoConvidar, fotos = {}, mostrarConvite = true }: Props) {
  const [mexendo, setMexendo] = useState<LugarComVotos | null>(null)

  const porId = new Map(lugares.map((l) => [l.id, l]))
  const { dias, semDia } = arrumarRoteiro(
    salvo,
    lugares.map((l) => l.id),
    rotulos.length,
  )
  const lugaresDe = (ids: string[]) => ids.map((id) => porId.get(id)).filter((l): l is LugarComVotos => !!l)
  // Em que dia está o lugar do menu "…" (SEM_DIA se não tem dia)
  const diaDoMexendo = mexendo ? dias.findIndex((d) => d.includes(mexendo.id)) : SEM_DIA

  const ponto = (l: LugarComVotos | undefined): Ponto | null => (l && l.latitude != null && l.longitude != null ? { latitude: l.latitude, longitude: l.longitude } : null)
  const todos = lugares.map(ponto).filter((p): p is Ponto => !!p)
  const espalhada = regiaoEspalhada(todos)

  const mudar = (novo: DiasDoRoteiro) => {
    aoMudar(novo)
    setMexendo(null)
  }

  const totalNoRoteiro = dias.reduce((t, d) => t + d.length, 0)
  const curtiram = (l: LugarComVotos) => new Set([...l.votos, ...l.prioridades]).size

  // Um dia do roteiro: título + cartões com foto, ligados pelo tempo de um lugar ao outro
  const blocoDoDia = (chave: string, titulo: string, sub: string | null, doDia: LugarComVotos[], numerar: boolean, vazio: string) => (
    <View key={chave} testID={chave}>
      <View className="mb-2.5 flex-row items-baseline justify-between">
        <Text className="font-display text-[22px] text-texto">{titulo}</Text>
        {sub ? <Text className="font-body text-[13px] text-suave">{sub}</Text> : null}
      </View>
      {doDia.length === 0 ? (
        <View className="rounded-[16px] border-[1.5px] border-dashed border-tracejado p-4">
          <Text className="font-body text-[13px] text-suave">{vazio}</Text>
        </View>
      ) : (
        doDia.map((l, k) => {
          const antes = k > 0 ? ponto(doDia[k - 1]) : null
          const aqui = ponto(l)
          const n = curtiram(l)
          return (
            <View key={l.id}>
              {antes && aqui && numerar ? (
                <View className="ml-[42px] border-l-2 border-dashed border-tracejado py-1.5 pl-3">
                  <Text className="font-body text-[12px] text-suave">{trecho(antes, aqui)}</Text>
                </View>
              ) : k > 0 ? (
                <View className="h-2" />
              ) : null}
              <View className="flex-row items-center gap-3 rounded-[20px] bg-cartao p-2.5" style={sombra.cartao}>
                <View className="h-[68px] w-[68px] overflow-hidden rounded-[14px] bg-areia">
                  {fotos[l.id] ? <Image source={{ uri: fotos[l.id] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : null}
                  {numerar ? (
                    <View className="absolute left-1.5 top-1.5 h-6 w-6 items-center justify-center rounded-full bg-couro">
                      <Text className="font-body-bold text-[12px] text-white">{k + 1}</Text>
                    </View>
                  ) : null}
                </View>
                <View className="flex-1">
                  <Text numberOfLines={2} className="font-body-bold text-[16px] leading-[21px] text-texto">{l.nome}</Text>
                  {pessoas > 1 ? (
                    <Text className="mt-0.5 font-body-semibold text-[12px]" style={{ color: n >= 2 ? cor.verde : cor.suave }}>
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
  )

  return (
    <View className="gap-6">
      <Text className="font-body text-[15px] text-corpo">
        {totalNoRoteiro} {totalNoRoteiro === 1 ? 'lugar' : 'lugares'} em {rotulos.length} {rotulos.length === 1 ? 'dia' : 'dias'}. Toque no "…" pra trocar de dia ou de ordem.
      </Text>

      {rotulos.map((rotulo, i) =>
        blocoDoDia(`dia-${i + 1}`, rotulo, `${dias[i].length} ${dias[i].length === 1 ? 'lugar' : 'lugares'}`, lugaresDe(dias[i]), true, 'Dia livre. Quer ver mais lugares pra ele?'),
      )}
      {semDia.length > 0 ? blocoDoDia('sem-dia', 'Ainda sem dia', null, lugaresDe(semDia), false, 'Nada sobrando.') : null}

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

      {mostrarConvite && pessoas <= 1 ? (
        <View className="gap-2.5 rounded-[18px] bg-chip p-4">
          <Text className="font-body text-[14px] leading-[20px] text-texto">
            <Text className="font-body-bold">Chame a galera pra deslizar também.</Text> O que vocês curtirem juntos entra aqui, com o selo de quantos curtiram.
          </Text>
          {euSouAdm ? <Botao titulo="Mandar o convite" aoTocar={aoConvidar} compacto /> : null}
        </View>
      ) : null}

      {/* "…": mais cedo, mais tarde, mover pra outro dia */}
      <Modal visible={!!mexendo} transparent animationType="slide" onRequestClose={() => setMexendo(null)}>
        <Pressable accessibilityLabel="Fechar" onPress={() => setMexendo(null)} className="flex-1 bg-black/40" />
        {mexendo ? (
          <View className="gap-2 rounded-t-[26px] bg-fundo px-5 pb-8 pt-5">
            <Text className="mb-1 font-display text-[22px] text-texto">{mexendo.nome}</Text>
            {diaDoMexendo !== SEM_DIA ? (
              <View className="flex-row gap-2">
                <OpcaoDoMenu titulo="Mais cedo" Icone={ArrowUp} aoTocar={() => mudar(moverNaOrdem(dias, mexendo.id, -1))} />
                <OpcaoDoMenu titulo="Mais tarde" Icone={ArrowDown} aoTocar={() => mudar(moverNaOrdem(dias, mexendo.id, 1))} />
              </View>
            ) : null}
            <Text className="mt-2 font-body-bold text-[13px] text-suave">Mover pra</Text>
            <View className="flex-row flex-wrap gap-2">
              {rotulos.map((_, i) =>
                i === diaDoMexendo ? null : <OpcaoDoMenu key={i} titulo={`Dia ${i + 1}`} aoTocar={() => mudar(moverPraDia(dias, mexendo.id, i))} />,
              )}
              {diaDoMexendo !== SEM_DIA ? <OpcaoDoMenu titulo="Sem dia" aoTocar={() => mudar(moverPraDia(dias, mexendo.id, null))} /> : null}
            </View>
          </View>
        ) : null}
      </Modal>
      <Text className="text-center font-body text-[12px] text-suave">Roteiro de {destinoNome}: todo mundo do comboio pode arrumar</Text>
    </View>
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

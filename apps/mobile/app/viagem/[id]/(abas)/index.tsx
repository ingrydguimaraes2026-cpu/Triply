import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import { useFocusEffect, useLocalSearchParams, useRouter, type Href } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from '../../../../src/ui/StatusBar'
import { Share2 } from '../../../../src/ui/icones'
import { carregarAbaViagem } from '../../../../src/dados/abaViagem'
import { resumoDasContas } from '../../../../src/dados/contas'
import { useCarregar } from '../../../../src/dados/useCarregar'
import { useCapas } from '../../../../src/dados/useCapas'
import { useViagemAtual } from '../../../../src/dados/viagemAtual'
import { convidarProComboio } from '../../../../src/lib/convite'
import { compartilharTexto, linkDaViagem } from '../../../../src/lib/compartilhar'
import { diasAte, diasDaViagem, hojeIso, periodo } from '../../../../src/lib/formato'
import { montarPassos, proximoCarimbo, type DestinoDoPasso, type Passo } from '../../../../src/ui/PassosDaViagem'
import { CarimbosDaViagem } from '../../../../src/ui/viagem/CarimbosDaViagem'
import { Capa } from '../../../../src/ui/viagem/Capa'
import { FaixaDoProximoPasso, PassaporteDaGalera } from '../../../../src/ui/viagem/ProximoPasso'
import { EsqueletoDaViagem } from '../../../../src/ui/viagem/Esqueleto'
import { Lembrancas } from '../../../../src/ui/viagem/Lembrancas'
import { Hoje } from '../../../hoje'
import { Comemoracao } from '../../../../src/ui/Comemoracao'
import { Icone } from '../../../../src/ui/Icone'
import { Selo } from '../../../../src/ui/Selos'
import { Avatar, ErroNaTela } from '../../../../src/ui/pecas'
import { useCascata, useNumeroAnimado } from '../../../../src/ui/movimento'
import { formatarDinheiro, type NomeDoIcone } from '@together/core'
import { cor, fonte, rotulo, sombra, trabalho } from '../../../../theme'
import { puxarPraAtualizar } from '../../../../src/ui/Puxar'

// Aba Viagem (caminho B "Embarque", aprovado pelo Victor em 10/11/2026). Muda com a fase:
// - antes: a capa com a foto do destino, quantos dias faltam (grande) com os rostos da galera,
//   o passaporte da galera, o resumo das outras 4 abas e UM próximo passo numa faixa fixa no pé
//   (refeito em 10/11 com as referências do App Store Tracker: Tripsy, Luggo, Wanderlog, Antigone);
// - durante: o Hoje;
// - depois: Lembranças (passaporte e história).
// O cabeçalho (viagem, galera, ajustes) e a barra de abas ficam no _layout.
export default function AbaViagem() {
  // Só em desenvolvimento: ?fase=durante|voltou simula a fase (pra testar sem mudar as datas)
  const { id, fase: faseSimulada } = useLocalSearchParams<{ id: string; fase?: 'antes' | 'durante' | 'voltou' }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { meuId, atual } = useViagemAtual()
  // No navegador, ao voltar de outra tela, o id da rota pode vir vazio: aí vale a viagem atual
  const viagemId = id || atual?.id
  const [convite, setConvite] = useState<string | null>(null)
  const [carimbo, setCarimbo] = useState<Passo | null>(null)
  const capa = useCapas(viagemId ? [viagemId] : [])

  const carga = useCarregar(viagemId ? () => carregarAbaViagem(viagemId) : null, [viagemId], 'aba-viagem')
  // Volta de outra tela (votou, lançou gasto, definiu datas): busca de novo pra o carimbo cair
  const { recarregar } = carga
  const [primeiraVez, setPrimeiraVez] = useState(true)
  useFocusEffect(
    useCallback(() => {
      if (primeiraVez) setPrimeiraVez(false)
      else recarregar()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recarregar]),
  )

  if (carga.status === 'carregando') return <EsqueletoDaViagem />
  if (carga.status === 'erro' || !carga.dados) return <ErroNaTela aoTentar={carga.recarregar} />
  const d = carga.dados
  const { viagem } = d
  const euSouAdm = viagem.membros.some((m) => m.id === meuId && m.papel === 'adm')
  const contas = resumoDasContas(d.gastos, viagem.moeda)
  const estado = {
    lugares: d.lugares,
    pessoas: viagem.membros.length,
    temDatas: !!viagem.dataInicio,
    // O carimbo "Dormir" só cai quando o lugar foi escolhido (a decisão foi resolvida)
    hospedagens: d.opcoes.some((o) => o.escolhida) ? 1 : 0,
    trajetos: d.trajetos.length,
    gastos: d.gastos.length,
    euSouAdm,
  }
  const passos = montarPassos(estado)
  const proximo = proximoCarimbo(estado)
  const faltam = viagem.dataInicio ? diasAte(viagem.dataInicio) : null

  const ir = (rota: string) => router.push((['roteiro', 'reservas', 'contas', 'fotos'].includes(rota) ? `/viagem/${viagem.id}/${rota}` : `/${rota}`) as Href)
  const irProPasso = (destino: DestinoDoPasso) => (destino === 'convidar' ? void convidar() : ir(destino === 'explorar' ? `explorar` : destino))

  async function convidar() {
    setConvite((await convidarProComboio(viagem.id, viagem.nome))?.texto ?? null)
  }

  // Fase da viagem: antes → na viagem (vira o "Hoje") → voltou (Lembranças)
  const hoje = hojeIso()
  const fase: 'antes' | 'durante' | 'voltou' =
    __DEV__ && faseSimulada ? faseSimulada : viagem.dataFim && viagem.dataFim < hoje ? 'voltou' : viagem.dataInicio && viagem.dataInicio <= hoje ? 'durante' : 'antes'

  if (fase === 'durante') return <Hoje naAba />

  if (fase === 'voltou') {
    const dias = viagem.dataInicio && viagem.dataFim ? diasDaViagem(viagem.dataInicio, viagem.dataFim).length : 0
    return (
      <View className="flex-1" style={{ backgroundColor: trabalho.fundo }}>
        <StatusBar style="dark" />
        <Animated.ScrollView refreshControl={puxarPraAtualizar(carga)} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
          <Lembrancas
            viagem={viagem}
            foto={capa(viagem.id)}
            numeros={{ dias, fotos: d.fotos, lugares: d.visitados || d.lugares, gasto: contas.total }}
            passos={passos}
            contasEmDia={contas.acertos.length === 0}
            ir={ir}
            aoExtra={(origem) => ir(`passe?de=${origem}`)}
          />
          <View className="px-5 pt-6">
            <CarimbosDaViagem viagem={viagem} meuId={meuId} />
          </View>
        </Animated.ScrollView>
      </View>
    )
  }

  // Antes da viagem
  const destinos = viagem.destinos
  const noites = viagem.dataInicio && viagem.dataFim ? diasDaViagem(viagem.dataInicio, viagem.dataFim).length - 1 : 0
  const meuSaldo = contas.saldos.get(meuId) ?? 0
  const reservasFeitas = d.passagens.compradas.length
  const ondeFicar = d.opcoes.some((o) => o.escolhida) ? 'onde ficar escolhido' : d.opcoes.length ? 'votando onde ficar' : 'falta onde ficar'
  // Resumo das outras 4 abas: mesmo nome e mesmo ícone da barra; tocar leva pra aba
  const resumo: { aba: string; icone: NomeDoIcone; titulo: string; linha: string }[] = [
    {
      aba: 'roteiro',
      icone: 'roteiro',
      titulo: 'Roteiro',
      linha: d.dias.length ? `${d.dias.length} ${d.dias.length === 1 ? 'dia' : 'dias'} com plano` : d.lugares ? `${d.lugares} ${d.lugares === 1 ? 'lugar salvo' : 'lugares salvos'}` : 'Nada planejado ainda',
    },
    { aba: 'reservas', icone: 'hospedagem', titulo: 'Reservas', linha: `${reservasFeitas ? `${reservasFeitas} ${reservasFeitas === 1 ? 'passagem comprada' : 'passagens compradas'}` : 'Nenhuma passagem'}, ${ondeFicar}` },
    {
      aba: 'contas',
      icone: 'contas',
      titulo: 'Contas',
      linha: !d.gastos.length ? 'Nenhum gasto ainda' : Math.abs(meuSaldo) < 0.01 ? 'Você está em dia' : meuSaldo > 0 ? `A galera te deve ${formatarDinheiro(meuSaldo, viagem.moeda)}` : `Você deve ${formatarDinheiro(-meuSaldo, viagem.moeda)}`,
    },
    { aba: 'fotos', icone: 'fotos', titulo: 'Fotos', linha: d.fotos ? `${d.fotos} ${d.fotos === 1 ? 'foto' : 'fotos'} da galera` : 'Nenhuma foto ainda' },
  ]

  return (
    <View className="flex-1" style={{ backgroundColor: trabalho.fundo }}>
      <StatusBar style="dark" />
      <Animated.ScrollView refreshControl={puxarPraAtualizar(carga)} contentContainerStyle={{ paddingTop: 2, paddingBottom: insets.bottom + (proximo ? 92 : 16) }}>
        <Capa
          foto={capa(viagem.id)}
          nome={destinos.length === 1 ? destinos[0] : viagem.nome}
          linha={[viagem.dataInicio ? periodo(viagem.dataInicio, viagem.dataFim) : '', noites > 0 ? `${noites} ${noites === 1 ? 'noite' : 'noites'}` : '', destinos.length > 1 ? destinos.join(', ') : '']
            .filter(Boolean)
            .join(' · ')}
          aoTocar={() => ir('roteiro')}
        />

        <Entra indice={0}>
          <Contagem
            faltam={faltam}
            pessoas={viagem.membros.map((m) => m.nome)}
            podeDefinir={euSouAdm}
            aoDefinir={() => ir('configuracoes')}
            aoGalera={() => ir('comboio')}
          />
        </Entra>

        <Entra indice={1} style={{ marginTop: 18 }}>
          <PassaporteDaGalera viagemId={viagem.id} passos={passos} aoCarimbar={setCarimbo} />
          {convite ? (
            <Text selectable className="mx-4 mt-2 font-body-medium text-[13px] text-verde">
              {convite}
            </Text>
          ) : null}
        </Entra>

        <Entra indice={2}>
          <Text style={[rotulo, { color: trabalho.texto2, marginTop: 22, marginBottom: 10, marginHorizontal: 18 }]}>A viagem</Text>
          <View className="mx-3.5 rounded-[20px] border" style={[{ backgroundColor: trabalho.superficie, borderColor: trabalho.linha }, sombra.cartao]}>
            {resumo.map((r, i) => (
              <Pressable
                key={r.aba}
                onPress={() => ir(r.aba)}
                accessibilityRole="button"
                accessibilityLabel={`${r.titulo}: ${r.linha}`}
                className="flex-row items-center gap-3 px-3.5 py-3 active:opacity-70"
                style={i < resumo.length - 1 ? { borderBottomWidth: 1, borderColor: trabalho.linha } : undefined}
              >
                <View className="h-[38px] w-[38px] items-center justify-center rounded-xl" style={{ backgroundColor: trabalho.superficie2 }}>
                  <Icone nome={r.icone} tamanho={20} cor={trabalho.texto} />
                </View>
                <View className="flex-1">
                  <Text style={{ fontFamily: fonte.item, fontSize: 14.5, letterSpacing: -0.15, color: trabalho.texto }}>{r.titulo}</Text>
                  <Text numberOfLines={1} style={{ fontFamily: fonte.corpo, fontSize: 12.5, color: trabalho.texto2, marginTop: 1 }}>
                    {r.linha}
                  </Text>
                </View>
                <Icone nome="seta-direita" tamanho={16} cor={trabalho.texto2} />
              </Pressable>
            ))}
          </View>
        </Entra>

        {/* Spec 118a: os carimbos dos lugares (apagados até a galera chegar lá) */}
        <Entra indice={3} style={{ marginTop: 22, marginHorizontal: 18 }}>
          <CarimbosDaViagem viagem={viagem} meuId={meuId} />
        </Entra>
      </Animated.ScrollView>

      {/* Um próximo passo só, sempre no mesmo lugar: logo acima da barra de abas */}
      <FaixaDoProximoPasso proximo={proximo} aoAbrir={() => proximo && irProPasso(proximo.destino)} baixo={insets.bottom - 4} />

      {/* Carimbo novo: a Norti comemora o marco */}
      <Comemoracao
        visivel={!!carimbo}
        acima={`Carimbo ${passos.filter((p) => p.feito).length} de ${passos.length}`}
        titulo={carimbo ? `${carimbo.titulo}: resolvido!` : ''}
        desenho={carimbo ? <Selo nome={carimbo.selo} tamanho={96} tom="escuro" /> : null}
        texto={!proximo ? 'Passaporte completo. Boa viagem!' : `${passos.filter((p) => !p.feito).length === 1 ? 'Falta só' : 'Próximo:'} ${proximo.titulo.toLowerCase()}.`}
        botoes={[
          {
            titulo: 'Contar pra galera',
            icone: <Share2 size={18} color={cor.escuro} />,
            principal: true,
            aoTocar: () => void compartilharTexto(`Carimbo novo em ${viagem.nome}: ${carimbo?.titulo.toLowerCase()} resolvido! ${linkDaViagem(viagem.id)}`).finally(() => setCarimbo(null)),
          },
          { titulo: 'Continuar', aoTocar: () => setCarimbo(null) },
        ]}
        aoFechar={() => setCarimbo(null)}
      />
    </View>
  )
}

// Entrada em cascata: cada seção sobe 12 px e aparece um tiquinho depois da anterior
// (começa no 3, pra dar tempo do bilhete chegar primeiro)
function Entra({ indice, style, children }: { indice: number; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const cascata = useCascata(indice + 3)
  return <Animated.View style={[style, cascata]}>{children}</Animated.View>
}

// "23 dias pra embarcar" bem grande na esquerda, os rostos da galera na direita.
// O número corre do zero até o valor quando a tela abre.
function Contagem({
  faltam,
  pessoas,
  podeDefinir,
  aoDefinir,
  aoGalera,
}: {
  faltam: number | null
  pessoas: string[]
  podeDefinir: boolean
  aoDefinir: () => void
  aoGalera: () => void
}) {
  const [alvo, setAlvo] = useState(0)
  useEffect(() => setAlvo(faltam ?? 0), [faltam])
  const mostrado = Math.round(useNumeroAnimado(alvo, 900))
  const semData = faltam == null || faltam <= 0
  return (
    <View className="flex-row items-end justify-between px-[18px] pt-[18px]">
      {semData ? (
        <Pressable onPress={podeDefinir ? aoDefinir : undefined} accessibilityRole={podeDefinir ? 'button' : undefined} className="flex-1 active:opacity-70">
          <Text style={{ fontFamily: fonte.titulo, fontSize: 30, letterSpacing: -1, color: trabalho.texto }}>Sem data ainda</Text>
          <Text style={{ fontFamily: fonte.corpoMedio, fontSize: 14, color: podeDefinir ? cor.caramelo : trabalho.texto2, marginTop: 4 }}>
            {podeDefinir ? 'Definir quando vai ser' : 'Quem organiza define as datas'}
          </Text>
        </Pressable>
      ) : (
        <View className="flex-1" accessibilityLabel={`${faltam} ${faltam === 1 ? 'dia' : 'dias'} pra embarcar`}>
          <Text style={{ fontFamily: fonte.titulo, fontSize: 76, lineHeight: 72, letterSpacing: -3.4, color: trabalho.texto, fontVariant: ['tabular-nums'] }}>{mostrado}</Text>
          <Text style={{ fontFamily: fonte.corpoMedio, fontSize: 14, color: trabalho.texto2, marginTop: 4 }}>{faltam === 1 ? 'dia' : 'dias'} pra embarcar</Text>
        </View>
      )}
      <Pressable onPress={aoGalera} accessibilityRole="button" accessibilityLabel={`Galera: ${pessoas.length} ${pessoas.length === 1 ? 'pessoa' : 'pessoas'}`} className="items-end pb-1 active:opacity-70">
        <View className="flex-row">
          {pessoas.slice(0, 5).map((n, i) => (
            <View key={i} style={{ marginLeft: i ? -8 : 0 }}>
              <Avatar nome={n} indice={i} tamanho={30} borda={trabalho.fundo} />
            </View>
          ))}
        </View>
        <Text style={{ fontFamily: fonte.corpoForte, fontSize: 12, color: trabalho.texto2, marginTop: 6 }}>
          {pessoas.length} {pessoas.length === 1 ? 'vai' : 'vão'}
        </Text>
      </Pressable>
    </View>
  )
}

import { useCallback, useState } from 'react'
import { Text, View } from 'react-native'
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
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
import { diasAte, periodo } from '../../../../src/lib/formato'
import { montarPassos, proximoCarimbo, type DestinoDoPasso, type Passo } from '../../../../src/ui/PassosDaViagem'
import { Passaporte } from '../../../../src/ui/viagem/Passaporte'
import { ProximoCarimbo } from '../../../../src/ui/viagem/ProximoCarimbo'
import { AntesDeEmbarcar, Cabecalho, Capa, CarrosselDoRoteiro, ResumoDasContas, Rostos, Secao } from '../../../../src/ui/viagem/Secoes'
import { EsqueletoDaViagem } from '../../../../src/ui/viagem/Esqueleto'
import { Comemoracao } from '../../../../src/ui/Comemoracao'
import { Selo } from '../../../../src/ui/Selos'
import { ErroNaTela } from '../../../../src/ui/pecas'
import { cor } from '../../../../theme'

// Aba Viagem (spec 117): muda com a fase. Antes da viagem: capa, comboio, próximo carimbo,
// passaporte e o resumo do roteiro, das contas e da papelada. Nada além disso.
export default function AbaViagem() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { meuId } = useViagemAtual()
  const [convite, setConvite] = useState<string | null>(null)
  const [carimbo, setCarimbo] = useState<Passo | null>(null)
  const capa = useCapas(id ? [id] : [])
  const rolagem = useSharedValue(0)
  const aoRolar = useAnimatedScrollHandler((e) => {
    rolagem.value = e.contentOffset.y
  })

  const carga = useCarregar(() => carregarAbaViagem(id), [id])
  // Volta de outra tela (votou, lançou gasto, pôs datas): busca de novo pra o carimbo cair
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
  const linha = [periodo(viagem.dataInicio, viagem.dataFim), faltam != null && faltam > 0 ? `faltam ${faltam} ${faltam === 1 ? 'dia' : 'dias'}` : null].filter(Boolean).join(' · ') || 'Sem data ainda'

  const ir = (rota: string) => router.push((['roteiro', 'contas', 'fotos'].includes(rota) ? `/viagem/${id}/${rota}` : `/${rota}`) as Href)
  const irProPasso = (destino: DestinoDoPasso) => (destino === 'convidar' ? void convidar() : ir(destino === 'explorar' ? `explorar` : destino))

  async function convidar() {
    setConvite((await convidarProComboio(viagem.id, viagem.nome))?.texto ?? null)
  }

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="light" />
      <Animated.ScrollView onScroll={aoRolar} scrollEventThrottle={16} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <Capa foto={capa(viagem.id)} nome={viagem.nome} linha={linha} rolagem={rolagem} />

        <View className="gap-6 bg-fundo px-5 pt-5">
          <Secao indice={0}>
            <Rostos membros={viagem.membros} atividades={d.atividades} vistoEm={d.vistoEm} meuId={meuId} aoTocar={() => ir('comboio')} aoConvidar={convidar} />
            {convite ? <Text selectable className="mt-2 font-body-medium text-[13px] text-verde">{convite}</Text> : null}
          </Secao>

          {proximo ? (
            <Secao indice={1}>
              <ProximoCarimbo
                passo={proximo}
                viagem={viagem}
                opcoes={d.opcoes}
                meuId={meuId}
                aoAbrir={() => irProPasso(proximo.destino)}
                aoMudar={carga.recarregar}
              />
            </Secao>
          ) : null}

          <Secao indice={2}>
            <Passaporte viagemId={viagem.id} passos={passos} aoCarimbar={setCarimbo} />
          </Secao>

          <Secao indice={3} titulo="Roteiro" direita={d.dias.length ? <Text className="font-body-bold text-[13px] text-caramelo">{d.dias.length} {d.dias.length === 1 ? 'dia' : 'dias'}</Text> : null}>
            <CarrosselDoRoteiro dias={d.dias} aoAbrir={() => ir('roteiro')} aoMontar={() => ir('explorar')} />
          </Secao>

          <Secao indice={4} titulo="Contas">
            <ResumoDasContas total={contas.total} meuSaldo={contas.saldos.get(meuId) ?? 0} moeda={viagem.moeda} aoAbrir={() => ir('contas')} />
          </Secao>

          <Secao indice={5} titulo="Antes de embarcar">
            <AntesDeEmbarcar pessoas={viagem.membros.length} passaportesOk={d.passaportesOk} semSeguro={d.semSeguro} aoDocumentos={() => ir('documentos')} />
          </Secao>
        </View>
      </Animated.ScrollView>

      <Cabecalho
        nome={viagem.nome}
        rolagem={rolagem}
        aoVoltar={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        aoCompartilhar={convidar}
        aoMais={() => ir('tudo-da-viagem')}
      />

      {/* Carimbo novo (tela 7): a Norti comemora o marco */}
      <Comemoracao
        visivel={!!carimbo}
        acima={`Carimbo ${passos.filter((p) => p.feito).length} de ${passos.length}`}
        titulo={carimbo ? `${carimbo.titulo}: resolvido!` : ''}
        desenho={carimbo ? <Selo nome={carimbo.selo} tamanho={96} tom="escuro" /> : null}
        texto={!proximo ? 'Passaporte completo. Boa viagem!' : `${passos.filter((p) => !p.feito).length === 1 ? 'Falta só' : 'Próximo:'} ${proximo.titulo.toLowerCase()}.`}
        botoes={[
          { titulo: 'Contar pro comboio', icone: <Share2 size={18} color={cor.escuro} />, principal: true, aoTocar: () => void compartilharTexto(`Carimbo novo em ${viagem.nome}: ${carimbo?.titulo.toLowerCase()} resolvido! ${linkDaViagem(viagem.id)}`).finally(() => setCarimbo(null)) },
          { titulo: 'Continuar', aoTocar: () => setCarimbo(null) },
        ]}
        aoFechar={() => setCarimbo(null)}
      />
    </View>
  )
}

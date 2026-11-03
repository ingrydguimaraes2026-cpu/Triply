import { useEffect, useState } from 'react'
import { Linking, Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, BedDouble, Check, ExternalLink, Heart, Plus, TriangleAlert } from '../src/ui/icones'
import {
  adicionarOpcaoDeHospedagem,
  buscarDestinos,
  buscarOpcoesDeHospedagem,
  buscarViagemComDetalhes,
  contasDaOpcao,
  detectarSite,
  escolherHospedagem,
  formatarDinheiro,
  linksDeBusca,
  linkValido,
  montarHospedagem,
  noitesDaOpcao,
  resumoDaHospedagem,
  sugerirNome,
  textoDosHorarios,
  votarNaHospedagem,
  type Destino,
  type DestinoDaHospedagem,
  type Opcao,
} from '@together/core'
import { useCarregar } from '../src/dados/useCarregar'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { supabase } from '../src/lib/supabase'
import { StatusBar } from '../src/ui/StatusBar'
import { Botao, BotaoRedondo, Campo, Cartao, Carregando, ErroNaTela, RotuloDeSecao } from '../src/ui/pecas'
import { cor } from '../theme'

// Hospedagem (spec 011 no mobile): por destino, buscar nos sites, juntar as opções do comboio,
// votar e o ADM fechar a escolhida. "Lançar como gasto" e o guia da casa completo ficam no site.

const SELO: Record<DestinoDaHospedagem['situacao'], { texto: string; classe: string }> = {
  resolvido: { texto: 'Resolvido', classe: 'bg-verde-fundo text-verde' },
  precisa: { texto: 'Falta escolher', classe: 'bg-chip text-caramelo' },
  'sem-datas': { texto: 'Sem datas', classe: 'bg-areia text-suave' },
  'bate-e-volta': { texto: 'Bate-e-volta', classe: 'bg-areia text-suave' },
  casa: { texto: 'Em casa', classe: 'bg-areia text-suave' },
}

// "2027-06-04" → "4/06"
const dataCurta = (d: string | null) => (d ? `${Number(d.slice(8, 10))}/${d.slice(5, 7)}` : '?')

export default function Hospedagem() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { atual: viagem, meuId } = useViagemAtual()
  const [novaEm, setNovaEm] = useState<string | null>(null) // destino com o formulário aberto
  const [erro, setErro] = useState<string | null>(null)
  const carga = useCarregar(
    viagem
      ? () => Promise.all([buscarOpcoesDeHospedagem(supabase, viagem.id), buscarDestinos(supabase, viagem.id), buscarViagemComDetalhes(supabase, viagem.id)])
      : null,
    [viagem?.id],
  )
  // Cópia local pra o coração e o "escolher" responderem na hora (antes do banco)
  const [opcoes, setOpcoes] = useState<Opcao[]>([])
  const carregadas = carga.status === 'pronto' ? carga.dados[0] : null
  useEffect(() => {
    if (carregadas) setOpcoes(carregadas)
  }, [carregadas])

  if (!viagem) return null
  if (carga.status === 'carregando') return <Carregando />
  if (carga.status === 'erro') return <ErroNaTela aoTentar={carga.recarregar} />
  const [, destinos, detalhe] = carga.dados
  const membros = detalhe?.membros ?? []
  const pessoas = Math.max(1, membros.length)
  const euSouAdm = membros.some((m) => m.id === meuId && m.papel === 'adm')
  const itens = montarHospedagem(destinos, opcoes).filter((i) => i.situacao !== 'casa')
  const resumo = resumoDaHospedagem(itens, pessoas)

  async function votar(o: Opcao) {
    const sim = !o.votos.includes(meuId)
    const trocar = (marcar: boolean) =>
      setOpcoes((atual) =>
        atual.map((x) => (x.id === o.id ? { ...x, votos: marcar ? [...x.votos.filter((v) => v !== meuId), meuId] : x.votos.filter((v) => v !== meuId) } : x)),
      )
    trocar(sim)
    try {
      await votarNaHospedagem(supabase, o.id, meuId, sim)
    } catch {
      trocar(!sim) // desfaz
      setErro('Não deu pra salvar o voto. Tente de novo.')
    }
  }

  async function escolher(o: Opcao) {
    const escolher = !o.escolhida
    const antes = opcoes
    // Só uma escolhida por destino: marcar esta desmarca as outras
    setOpcoes((atual) => atual.map((x) => (x.destinoId === o.destinoId ? { ...x, escolhida: x.id === o.id ? escolher : false } : x)))
    try {
      await escolherHospedagem(supabase, o.id, escolher)
    } catch {
      setOpcoes(antes)
      setErro('Só o ADM pode escolher a hospedagem.')
    }
  }

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: insets.bottom + 40, gap: 12 }} keyboardShouldPersistTaps="handled">
        <BotaoRedondo aoTocar={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
          <ArrowLeft size={20} color={cor.texto} />
        </BotaoRedondo>
        <View>
          <Text className="font-display text-[32px] text-texto">Hospedagem</Text>
          <Text className="mt-0.5 font-body text-[14px] text-suave">
            {resumo.total ? `${resumo.resolvidos} de ${resumo.total} destinos com hospedagem` : 'Onde o comboio vai dormir em cada destino.'}
          </Text>
          {Object.entries(resumo.porPessoa).length ? (
            <Text className="mt-1 font-body-semibold text-[14px] text-texto">
              {Object.entries(resumo.porPessoa)
                .map(([moeda, valor]) => formatarDinheiro(valor, moeda))
                .join(' + ')}{' '}
              por pessoa
            </Text>
          ) : null}
          {resumo.total ? (
            <View className="mt-2.5 h-2 overflow-hidden rounded-full bg-areia">
              <View className="h-2 rounded-full bg-caramelo" style={{ width: `${(resumo.resolvidos / resumo.total) * 100}%` }} />
            </View>
          ) : null}
        </View>
        {erro ? <Text className="font-body-medium text-[13px] text-vermelho">{erro}</Text> : null}

        {itens.length === 0 ? (
          <Text className="mt-6 text-center font-body text-[15px] text-corpo">Adicione destinos no roteiro pra começar.</Text>
        ) : null}

        {itens.map((item) => (
          <View key={item.destino.id} className="gap-2.5">
            <View className="mt-2 flex-row items-center justify-between gap-2">
              <View className="flex-1">
                <RotuloDeSecao>{`${item.indice + 1}. ${item.destino.nome}`}</RotuloDeSecao>
                <Text className="-mt-1.5 font-body text-[13px] text-suave">
                  {item.destino.chegada ? `${dataCurta(item.destino.chegada)} a ${dataCurta(item.destino.saida)}` : 'Sem datas no roteiro'}
                  {item.noites ? ` · ${item.noites} ${item.noites === 1 ? 'noite' : 'noites'}` : ''}
                </Text>
              </View>
              <Text className={`overflow-hidden rounded-lg px-2 py-1 font-body-bold text-[11px] ${SELO[item.situacao].classe}`}>{SELO[item.situacao].texto}</Text>
            </View>

            {/* Bate-e-volta: o selo já diz que não precisa de hospedagem */}
            {item.situacao === 'bate-e-volta' ? null : (
              <>
                {item.escolhida ? (
                  <Escolhida opcao={item.escolhida} destino={item.destino} pessoas={pessoas} avisos={item.avisos} euSouAdm={euSouAdm} aoDesmarcar={() => escolher(item.escolhida!)} />
                ) : null}

                {/* Busca pronta: cidade, datas e número de pessoas já preenchidos */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {linksDeBusca(item.destino, pessoas).map((b) => (
                    <Pressable key={b.site} onPress={() => Linking.openURL(b.url)} className="flex-row items-center gap-1.5 rounded-xl bg-chip px-3 py-2 active:opacity-80">
                      <ExternalLink size={14} color={cor.couro} />
                      <Text className="font-body-bold text-[13px] text-couro">{b.nome}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                {item.situacao === 'sem-datas' ? <Text className="font-body text-[12.5px] text-suave">Defina as datas no roteiro pra busca já sair com elas.</Text> : null}

                {item.opcoes
                  .filter((o) => !o.escolhida)
                  .map((o) => (
                    <LinhaDaOpcao
                      key={o.id}
                      opcao={o}
                      destino={item.destino}
                      pessoas={pessoas}
                      meuId={meuId}
                      euSouAdm={euSouAdm}
                      aoVotar={() => votar(o)}
                      aoEscolher={() => escolher(o)}
                    />
                  ))}
                {item.opcoes.length === 0 && novaEm !== item.destino.id ? (
                  <Text className="font-body text-[13px] leading-5 text-suave">Nenhuma opção ainda. Busque nos sites acima e cole aqui o link do que gostar.</Text>
                ) : null}

                {novaEm === item.destino.id ? (
                  <FormOpcao
                    viagemId={viagem.id}
                    destino={item.destino}
                    moeda={viagem.moeda}
                    aoFechar={() => setNovaEm(null)}
                    aoSalvar={() => {
                      setNovaEm(null)
                      carga.recarregar()
                    }}
                  />
                ) : (
                  <Pressable onPress={() => setNovaEm(item.destino.id)} className="flex-row items-center justify-center gap-1.5 rounded-2xl border border-dashed border-tracejado py-3 active:opacity-80">
                    <Plus size={16} color={cor.couro} />
                    <Text className="font-body-bold text-[14px] text-couro">Adicionar opção</Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

function Precos({ opcao, destino, pessoas }: { opcao: Opcao; destino: Destino; pessoas: number }) {
  if (opcao.precoTotal === null) return null
  const { porPessoa, porNoite } = contasDaOpcao(opcao.precoTotal, pessoas, noitesDaOpcao(opcao, destino))
  return (
    <Text className="font-body text-[13px] text-corpo">
      <Text className="font-body-bold text-texto">{formatarDinheiro(opcao.precoTotal, opcao.moeda)}</Text>
      {porPessoa !== null && pessoas > 1 ? ` · ${formatarDinheiro(porPessoa, opcao.moeda)} por pessoa` : ''}
      {porNoite !== null ? ` · ${formatarDinheiro(porNoite, opcao.moeda)} por noite` : ''}
    </Text>
  )
}

function Escolhida({
  opcao: o,
  destino,
  pessoas,
  avisos,
  euSouAdm,
  aoDesmarcar,
}: {
  opcao: Opcao
  destino: Destino
  pessoas: number
  avisos: string[]
  euSouAdm: boolean
  aoDesmarcar: () => void
}) {
  const horarios = textoDosHorarios(o, destino)
  return (
    <Cartao className="gap-2 border-2 border-caramelo p-4">
      <View className="flex-row items-center gap-2">
        <BedDouble size={18} color={cor.caramelo} />
        <Text className="font-body-bold text-[12px] uppercase tracking-wider text-caramelo">Escolhida</Text>
      </View>
      <Text className="font-body-bold text-[17px] text-texto">{o.nome}</Text>
      <Precos opcao={o} destino={destino} pessoas={pessoas} />
      {horarios ? <Text className="font-body text-[12.5px] text-suave">{horarios}</Text> : null}
      {avisos.map((a) => (
        <View key={a} className="flex-row gap-2 rounded-xl bg-chip p-2.5">
          <TriangleAlert size={15} color={cor.caramelo} />
          <Text className="flex-1 font-body text-[12.5px] leading-5 text-texto">{a}</Text>
        </View>
      ))}
      <View className="flex-row gap-2.5">
        {o.link ? (
          <View className="flex-1">
            <Botao compacto titulo="Abrir reserva" aoTocar={() => Linking.openURL(o.link!)} />
          </View>
        ) : null}
        {euSouAdm ? (
          <View className="flex-1">
            <Botao compacto tipo="secundario" titulo="Desmarcar" aoTocar={aoDesmarcar} />
          </View>
        ) : null}
      </View>
    </Cartao>
  )
}

function LinhaDaOpcao({
  opcao: o,
  destino,
  pessoas,
  meuId,
  euSouAdm,
  aoVotar,
  aoEscolher,
}: {
  opcao: Opcao
  destino: Destino
  pessoas: number
  meuId: string
  euSouAdm: boolean
  aoVotar: () => void
  aoEscolher: () => void
}) {
  const votei = o.votos.includes(meuId)
  const site = detectarSite(o.link)
  return (
    <Cartao className="gap-2.5 p-3.5">
      <View className="flex-row items-center gap-3">
        <Pressable onPress={() => (o.link ? Linking.openURL(o.link) : undefined)} disabled={!o.link} className="min-w-0 flex-1 gap-0.5 active:opacity-80">
          <View className="flex-row items-center gap-2">
            <Text className="shrink font-body-bold text-[15px] text-texto" numberOfLines={1}>
              {o.nome}
            </Text>
            {site ? <Text className="overflow-hidden rounded-md bg-areia px-1.5 py-0.5 font-body-bold text-[10.5px] text-suave">{site.nome}</Text> : null}
          </View>
          <Precos opcao={o} destino={destino} pessoas={pessoas} />
          {o.observacao ? (
            <Text className="font-body text-[12.5px] text-suave" numberOfLines={2}>
              {o.observacao}
            </Text>
          ) : null}
        </Pressable>
        <Pressable
          onPress={aoVotar}
          accessibilityRole="button"
          accessibilityLabel={votei ? `Tirar meu voto de ${o.nome}` : `Curtir ${o.nome}`}
          className={`min-w-[52px] flex-row items-center justify-center gap-1 rounded-xl px-2.5 py-2 ${votei ? 'bg-vermelho-fundo' : 'bg-areia'} active:opacity-80`}
        >
          <Heart size={17} color={votei ? cor.vermelho : cor.suave} fill={votei ? cor.vermelho : 'transparent'} />
          <Text className={`font-body-bold text-[14px] ${votei ? 'text-vermelho' : 'text-suave'}`}>{o.votos.length}</Text>
        </Pressable>
      </View>
      {euSouAdm ? (
        <Pressable onPress={aoEscolher} accessibilityLabel={`Escolher ${o.nome}`} className="flex-row items-center gap-1.5 self-start active:opacity-80">
          <Check size={15} color={cor.couro} />
          <Text className="font-body-bold text-[13px] text-couro">Escolher esta</Text>
        </Pressable>
      ) : null}
    </Cartao>
  )
}

// "480" ou "1.250,90" → centavos (null se vazio ou errado)
const centavos = (texto: string) => {
  if (!texto.trim()) return null
  const n = Number(texto.trim().replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : NaN
}

function FormOpcao({ viagemId, destino, moeda: moedaViagem, aoFechar, aoSalvar }: { viagemId: string; destino: Destino; moeda: string; aoFechar: () => void; aoSalvar: () => void }) {
  const [link, setLink] = useState('')
  const [nome, setNome] = useState('')
  const [preco, setPreco] = useState('')
  const [moeda, setMoeda] = useState(moedaViagem)
  const [observacao, setObservacao] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  // O link vem primeiro: o nome é sugerido a partir dele
  function trocarLink(texto: string) {
    setLink(texto)
    if (!nome.trim() && linkValido(texto.trim())) setNome(sugerirNome(texto.trim()) ?? '')
  }

  async function salvar() {
    if (!nome.trim()) return setErro('Dê um nome pra opção.')
    if (link.trim() && !linkValido(link.trim())) return setErro('O link precisa começar com https://')
    const precoTotal = centavos(preco)
    if (Number.isNaN(precoTotal)) return setErro('Preço inválido. Ex.: 480 ou 1.250,90')
    setSalvando(true)
    setErro(null)
    try {
      await adicionarOpcaoDeHospedagem(supabase, viagemId, {
        destinoId: destino.id,
        nome,
        link: link || null,
        precoTotal,
        moeda: moeda.trim().toUpperCase() || moedaViagem,
        checkin: destino.chegada,
        checkout: destino.saida,
        horaCheckin: null,
        horaCheckout: null,
        observacao: observacao || null,
        cancelamentoGratisAte: null,
        guardaMalas: null,
        guardaMalasObs: null,
        etiquetas: [],
        nota: null,
      })
      aoSalvar()
    } catch {
      setErro('Não deu pra salvar agora. Tente de novo.')
      setSalvando(false)
    }
  }

  return (
    <Cartao className="gap-3 p-4">
      <Text className="font-body-bold text-[16px] text-texto">Nova opção em {destino.nome}</Text>
      <Campo placeholder="Link (Airbnb, Booking...)" value={link} onChangeText={trocarLink} autoCapitalize="none" keyboardType="url" autoFocus />
      <Campo placeholder="Nome (ex.: Apê no centro)" value={nome} onChangeText={setNome} />
      <View className="flex-row gap-2.5">
        <View className="flex-1">
          <Campo placeholder="Preço total" value={preco} onChangeText={setPreco} keyboardType="decimal-pad" />
        </View>
        <View className="w-[96px]">
          <Campo placeholder="Moeda" value={moeda} onChangeText={setMoeda} autoCapitalize="characters" maxLength={3} />
        </View>
      </View>
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

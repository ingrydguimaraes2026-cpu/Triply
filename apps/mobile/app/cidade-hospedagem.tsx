import { useEffect, useState } from 'react'
import { Image, Linking, Pressable, ScrollView, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AlertTriangle, ArrowLeft, ArrowLeftRight, Check, ExternalLink, Footprints, Heart, KeyRound, Luggage, Pencil, Plus } from '../src/ui/icones'
import {
  detectarSite,
  escolherHospedagem,
  fatosDaOpcao,
  formatarDinheiro,
  linkDoGuardaVolumes,
  linksDeBusca,
  marcarReservaDaHospedagem,
  noitesDaViagem,
  textoAPe,
  textoDasNoites,
  votarNaHospedagem,
  type CidadeDaNoite,
  type Opcao,
  type Reserva,
} from '@together/core'
import { useHospedagemDaViagem } from '../src/dados/hospedagemDaViagem'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { supabase } from '../src/lib/supabase'
import { StatusBar } from '../src/ui/StatusBar'
import { Botao, BotaoRedondo, Cartao, Carregando, ErroNaTela, PilhaDeAvatares } from '../src/ui/pecas'
import { cor } from '../theme'

// Spec 123: as opções de hospedagem de uma cidade. Cada cartão mostra só o que o grupo compara:
// preço por pessoa, minutos a pé de onde chegam e check-in contra a hora de chegada.
// "Comparar" põe as opções lado a lado. Membro adiciona opção e vota; o ADM escolhe e marca reservada/paga.
// Rota: /cidade-hospedagem?destino=<id>

const NOME_DA_RESERVA: Record<Reserva, string> = { nao: 'Escolhida', reservada: 'Reservada', paga: 'Reservada e paga' }

export default function CidadeHospedagem() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { destino: destinoId } = useLocalSearchParams<{ destino: string }>()
  const { atual: viagem, meuId } = useViagemAtual()
  const carga = useHospedagemDaViagem(viagem?.id)
  const [comparando, setComparando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  // Cópia local pra o coração e o "escolher" responderem na hora (antes do banco)
  const [opcoes, setOpcoes] = useState<Opcao[]>([])
  const carregadas = carga.status === 'pronto' ? carga.dados.opcoes : null
  useEffect(() => {
    if (carregadas) setOpcoes(carregadas)
  }, [carregadas])

  if (!viagem) return null
  if (carga.status === 'carregando') return <Carregando />
  if (carga.status === 'erro') return <ErroNaTela aoTentar={carga.recarregar} />
  const { destinos, trajetos } = carga.dados
  const pessoas = Math.max(1, viagem.membros.length)
  const euSouAdm = viagem.membros.some((m) => m.id === meuId && m.papel === 'adm')
  const cidade = noitesDaViagem(destinos, opcoes, trajetos, pessoas).cidades.find((c) => c.destino.id === destinoId)
  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/'))
  if (!cidade) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-fundo px-8">
        <Text className="text-center font-body text-[15px] text-corpo">Essa cidade não tem noites no roteiro.</Text>
        <Botao titulo="Voltar" aoTocar={voltar} />
      </View>
    )
  }
  const nomeDe = (id: string) => viagem.membros.find((m) => m.id === id)?.nome ?? '?'

  async function votar(o: Opcao) {
    const sim = !o.votos.includes(meuId)
    const trocar = (marcar: boolean) =>
      setOpcoes((atual) => atual.map((x) => (x.id === o.id ? { ...x, votos: marcar ? [...x.votos.filter((v) => v !== meuId), meuId] : x.votos.filter((v) => v !== meuId) } : x)))
    trocar(sim)
    try {
      await votarNaHospedagem(supabase, o.id, meuId, sim)
    } catch {
      trocar(!sim)
      setErro('Não deu pra salvar o voto. Tente de novo.')
    }
  }

  async function escolher(o: Opcao, sim: boolean) {
    const antes = opcoes
    setOpcoes((atual) => atual.map((x) => (x.destinoId === o.destinoId ? { ...x, escolhida: x.id === o.id ? sim : false, reserva: x.id === o.id && sim ? x.reserva : 'nao' } : x)))
    try {
      if (!sim && o.reserva && o.reserva !== 'nao') await marcarReservaDaHospedagem(supabase, o.id, 'nao')
      await escolherHospedagem(supabase, o.id, sim)
      setComparando(false)
    } catch {
      setOpcoes(antes)
      setErro('Não deu: quem escolhe a hospedagem é o ADM.')
    }
  }

  async function marcar(o: Opcao, reserva: Reserva) {
    const antes = opcoes
    setOpcoes((atual) => atual.map((x) => (x.id === o.id ? { ...x, reserva } : x)))
    try {
      await marcarReservaDaHospedagem(supabase, o.id, reserva)
    } catch {
      setOpcoes(antes)
      setErro('Não deu: quem marca como reservada é o ADM.')
    }
  }

  const podeEditar = (o: Opcao) => euSouAdm || o.criadoPor === meuId
  const editar = (o: Opcao) => router.push(`/opcao-hospedagem?destino=${cidade.destino.id}&opcao=${o.id}`)

  return (
    <View className="flex-1 bg-fundo">
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: insets.bottom + 110, gap: 12 }}>
        <View className="flex-row items-center justify-between">
          <BotaoRedondo aoTocar={comparando ? () => setComparando(false) : voltar}>
            <ArrowLeft size={20} color={cor.texto} />
          </BotaoRedondo>
          {cidade.opcoes.length >= 2 && !comparando ? (
            <Pressable onPress={() => setComparando(true)} accessibilityRole="button" className="flex-row items-center gap-1.5 rounded-full border border-borda bg-cartao px-3.5 py-2 active:opacity-80">
              <ArrowLeftRight size={15} color={cor.couro} />
              <Text className="font-body-bold text-[13px] text-couro">Comparar</Text>
            </Pressable>
          ) : null}
        </View>
        <View>
          <Text className="font-display text-[30px] leading-[34px] text-texto">{comparando ? `Onde dormir em ${cidade.destino.nome}` : cidade.destino.nome}</Text>
          <Text className="mt-1 font-body text-[13.5px] text-suave">
            {textoDasNoites(cidade)}
            {cidade.chegada?.hora ? ` · chegam ${cidade.chegada.hora}${cidade.chegada.lugar !== cidade.destino.nome ? ` em ${cidade.chegada.lugar}` : ''}` : ''}
          </Text>
        </View>
        {erro ? <Text className="font-body-medium text-[13px] text-vermelho">{erro}</Text> : null}

        {comparando ? (
          <Comparar cidade={cidade} pessoas={pessoas} euSouAdm={euSouAdm} aoEscolher={(o) => escolher(o, true)} />
        ) : (
          <>
            {cidade.malas ? (
              <View className="flex-row gap-2 rounded-2xl p-3" style={{ backgroundColor: '#FBEBD2' }}>
                <Luggage size={16} color="#7A4E0C" />
                <View className="flex-1 gap-1.5">
                  <Text className="font-body text-[13px] leading-5" style={{ color: '#7A4E0C' }}>
                    <Text className="font-body-bold">Malas no dia do check-out. </Text>O próximo trecho sai às {cidade.malas.ate}: deixem num guarda-volumes perto de {cidade.malas.lugar}.
                  </Text>
                  <Pressable onPress={() => Linking.openURL(linkDoGuardaVolumes(cidade.malas!.lugar))} className="self-start rounded-lg bg-cartao px-2.5 py-1.5 active:opacity-80">
                    <Text className="font-body-bold text-[12px] text-couro">Achar guarda-volumes</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {cidade.opcoes.length === 0 ? (
              <Text className="font-body text-[14px] leading-6 text-corpo">Nenhuma opção ainda. Procure nos sites abaixo e toque em "Adicionar opção" pra colar o link do que gostar.</Text>
            ) : null}

            {cidade.opcoes.map((o) => (
              <CartaoDaOpcao
                key={o.id}
                opcao={o}
                cidade={cidade}
                pessoas={pessoas}
                meuId={meuId}
                euSouAdm={euSouAdm}
                nomes={o.votos.map(nomeDe)}
                aoVotar={() => votar(o)}
                aoEditar={podeEditar(o) ? () => editar(o) : undefined}
                aoEscolher={(sim) => escolher(o, sim)}
                aoMarcar={(r) => marcar(o, r)}
              />
            ))}

            <Text className="mt-1 font-body-bold text-[12px] uppercase tracking-widest text-caramelo">Procurar</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {linksDeBusca(cidade.destino, pessoas).map((b) => (
                <Pressable key={b.site} onPress={() => Linking.openURL(b.url)} className="flex-row items-center gap-1.5 rounded-xl bg-chip px-3 py-2 active:opacity-80">
                  <ExternalLink size={14} color={cor.couro} />
                  <Text className="font-body-bold text-[13px] text-couro">{b.nome}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}
      </ScrollView>

      {comparando ? null : (
        <View className="absolute bottom-0 left-0 right-0 px-5" style={{ paddingBottom: insets.bottom + 12 }}>
          <Pressable onPress={() => router.push(`/opcao-hospedagem?destino=${cidade.destino.id}`)} accessibilityRole="button" className="min-h-[54px] flex-row items-center justify-center gap-2 rounded-full bg-couro active:opacity-90">
            <Plus size={18} color={cor.creme} />
            <Text className="font-body-bold text-[15px] text-creme">Adicionar opção</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const FUNDO = { ok: cor.verdeFundo, ruim: cor.vermelhoFundo, neutro: cor.fundo }
const TEXTO = { ok: cor.verde, ruim: cor.vermelho, neutro: cor.suave }

function Fato({ nivel, Icone, children }: { nivel: 'ok' | 'ruim' | 'neutro'; Icone: typeof Footprints; children: string }) {
  return (
    <View className="flex-row items-center gap-2 rounded-xl px-2.5 py-2" style={{ backgroundColor: FUNDO[nivel] }}>
      <Icone size={15} color={TEXTO[nivel]} />
      <Text className="flex-1 font-body-semibold text-[12.5px]" style={{ color: TEXTO[nivel] }}>
        {children}
      </Text>
    </View>
  )
}

function CartaoDaOpcao({
  opcao: o,
  cidade,
  pessoas,
  meuId,
  euSouAdm,
  nomes,
  aoVotar,
  aoEditar,
  aoEscolher,
  aoMarcar,
}: {
  opcao: Opcao
  cidade: CidadeDaNoite
  pessoas: number
  meuId: string
  euSouAdm: boolean
  nomes: string[]
  aoVotar: () => void
  aoEditar?: () => void
  aoEscolher: (sim: boolean) => void
  aoMarcar: (r: Reserva) => void
}) {
  const f = fatosDaOpcao(o, cidade, pessoas)
  const site = detectarSite(o.link)
  const votei = o.votos.includes(meuId)
  const reserva = o.reserva ?? 'nao'
  const ondeChega = cidade.chegada?.lugar ?? 'centro'
  return (
    <Cartao className={`gap-2.5 p-2.5 ${o.escolhida ? 'border-2 border-couro' : ''}`}>
      {o.fotoUrl ? (
        <Pressable onPress={() => (o.link ? Linking.openURL(o.link) : undefined)}>
          <Image source={{ uri: o.fotoUrl }} className="h-[110px] w-full rounded-2xl bg-areia" resizeMode="cover" />
        </Pressable>
      ) : null}
      <View className="gap-2 px-1.5 pb-1">
        <View className="flex-row items-start gap-2">
          <Pressable onPress={aoEditar} disabled={!aoEditar} className="min-w-0 flex-1 active:opacity-80">
            {o.escolhida ? <Text className="font-body-bold text-[11px] uppercase tracking-wider text-caramelo">{NOME_DA_RESERVA[reserva]}</Text> : null}
            <Text className="font-body-bold text-[15.5px] leading-5 text-texto">{o.nome}</Text>
            {site ? <Text className="font-body text-[12px] text-suave">{site.nome}</Text> : null}
          </Pressable>
          {o.precoTotal !== null ? (
            <View className="items-end">
              <Text className="font-display text-[19px] text-texto">{formatarDinheiro(f.porPessoa ?? o.precoTotal, o.moeda)}</Text>
              <Text className="font-body text-[10.5px] text-suave">
                {pessoas > 1 ? `por pessoa · ${formatarDinheiro(o.precoTotal, o.moeda)} total` : 'total'}
              </Text>
            </View>
          ) : (
            <Text className="font-body text-[12px] text-suave">sem preço</Text>
          )}
        </View>

        {f.minutos !== null ? (
          <Fato nivel={f.minutos <= 15 ? 'ok' : 'neutro'} Icone={Footprints}>{`${textoAPe(f.minutos)} de ${ondeChega}`}</Fato>
        ) : (
          <Fato nivel="neutro" Icone={Footprints}>
            {!o.guia?.endereco
              ? 'Adicione o endereço pra ver a distância'
              : o.lat == null
                ? 'Endereço não achado no mapa'
                : 'Adicione no roteiro como vocês chegam pra ver a distância'}
          </Fato>
        )}
        {f.checkin ? (
          <Fato nivel={f.checkin.nivel} Icone={f.checkin.nivel === 'ruim' ? AlertTriangle : KeyRound}>
            {f.checkin.texto}
          </Fato>
        ) : null}
        {f.checkin?.nivel === 'ruim' && o.link ? (
          <Pressable onPress={() => Linking.openURL(o.link!)} className="self-start rounded-lg px-2.5 py-1.5 active:opacity-80" style={{ backgroundColor: cor.vermelhoFundo }}>
            <Text className="font-body-bold text-[12px] text-vermelho">Perguntar se dá pra entrar mais tarde</Text>
          </Pressable>
        ) : null}

        <View className="flex-row items-center gap-2">
          {nomes.length ? <PilhaDeAvatares nomes={nomes} tamanho={24} borda={cor.cartao} /> : null}
          <Text className="flex-1 font-body text-[12px] text-suave">{nomes.length ? `${nomes.length} de ${pessoas} querem` : 'Ninguém votou ainda'}</Text>
          {aoEditar ? (
            <Pressable onPress={aoEditar} accessibilityLabel={`Editar ${o.nome}`} className="h-9 w-9 items-center justify-center rounded-full border border-borda active:opacity-80">
              <Pencil size={15} color={cor.suave} />
            </Pressable>
          ) : null}
          <Pressable
            onPress={aoVotar}
            accessibilityRole="button"
            accessibilityLabel={votei ? `Tirar meu voto de ${o.nome}` : `Votar em ${o.nome}`}
            className={`flex-row items-center gap-1 rounded-full px-3 py-2 ${votei ? 'bg-vermelho-fundo' : 'border border-borda'} active:opacity-80`}
          >
            <Heart size={15} color={votei ? cor.vermelho : cor.suave} fill={votei ? cor.vermelho : 'transparent'} />
            <Text className={`font-body-bold text-[13px] ${votei ? 'text-vermelho' : 'text-suave'}`}>{o.votos.length}</Text>
          </Pressable>
        </View>

        {euSouAdm ? (
          o.escolhida ? (
            <View className="flex-row flex-wrap gap-2 border-t border-borda pt-2.5">
              {reserva === 'nao' ? <Acao texto="Marcar reservada" aoTocar={() => aoMarcar('reservada')} /> : null}
              {reserva !== 'paga' ? <Acao texto="Marcar paga" aoTocar={() => aoMarcar('paga')} /> : null}
              {reserva !== 'nao' ? <Acao texto="Ainda não reservei" aoTocar={() => aoMarcar('nao')} claro /> : null}
              <Acao texto="Desmarcar" aoTocar={() => aoEscolher(false)} claro />
            </View>
          ) : (
            <Pressable onPress={() => aoEscolher(true)} accessibilityLabel={`Escolher ${o.nome}`} className="flex-row items-center gap-1.5 self-start active:opacity-80">
              <Check size={15} color={cor.couro} />
              <Text className="font-body-bold text-[13px] text-couro">Ficar com esta</Text>
            </Pressable>
          )
        ) : null}
      </View>
    </Cartao>
  )
}

function Acao({ texto, aoTocar, claro }: { texto: string; aoTocar: () => void; claro?: boolean }) {
  return (
    <Pressable onPress={aoTocar} className={`rounded-full px-3 py-1.5 active:opacity-80 ${claro ? 'border border-borda' : 'bg-chip'}`}>
      <Text className={`font-body-bold text-[12.5px] ${claro ? 'text-suave' : 'text-couro'}`}>{texto}</Text>
    </Pressable>
  )
}

// Lado a lado: as linhas que o grupo discute. Verde = melhor da linha; vermelho = check-in que não dá.
function Comparar({ cidade, pessoas, euSouAdm, aoEscolher }: { cidade: CidadeDaNoite; pessoas: number; euSouAdm: boolean; aoEscolher: (o: Opcao) => void }) {
  const lista = cidade.opcoes.slice(0, 3)
  const fatos = lista.map((o) => fatosDaOpcao(o, cidade, pessoas))
  const melhor = (valores: (number | null)[], maior = false) => {
    const validos = valores.filter((v): v is number => v !== null)
    if (validos.length < 2) return -1
    const alvo = maior ? Math.max(...validos) : Math.min(...validos)
    return valores.filter((v) => v === alvo).length === 1 ? valores.indexOf(alvo) : -1
  }
  // Preço só tem "melhor" quando todas estão na mesma moeda (€150 não é mais barato que R$424)
  const mesmaMoeda = new Set(lista.map((o) => o.moeda)).size === 1
  const linhas: { rotulo: string; valores: string[]; melhor: number; ruins?: boolean[] }[] = [
    { rotulo: 'Por pessoa', valores: fatos.map((f, i) => (f.porPessoa !== null ? formatarDinheiro(f.porPessoa, lista[i].moeda) : '?')), melhor: mesmaMoeda ? melhor(fatos.map((f) => f.porPessoa)) : -1 },
    { rotulo: 'Total', valores: lista.map((o) => (o.precoTotal !== null ? formatarDinheiro(o.precoTotal, o.moeda) : '?')), melhor: mesmaMoeda ? melhor(lista.map((o) => o.precoTotal)) : -1 },
    { rotulo: `De ${cidade.chegada?.lugar ?? 'onde chegam'}`, valores: fatos.map((f) => (f.minutos !== null ? textoAPe(f.minutos) : '?')), melhor: melhor(fatos.map((f) => f.minutos)) },
    {
      rotulo: 'Check-in',
      valores: lista.map((o) => (o.selfCheckin ? 'qualquer hora' : o.horaCheckinLimite ? `até ${o.horaCheckinLimite}` : '?')),
      melhor: -1,
      ruins: fatos.map((f) => f.checkin?.nivel === 'ruim'),
    },
    { rotulo: 'Cancela grátis', valores: lista.map((o) => (o.cancelamentoGratisAte ? `até ${Number(o.cancelamentoGratisAte.slice(8, 10))}/${o.cancelamentoGratisAte.slice(5, 7)}` : '?')), melhor: -1 },
    { rotulo: 'Votos', valores: lista.map((o) => String(o.votos.length)), melhor: melhor(lista.map((o) => o.votos.length), true) },
  ]
  return (
    <View className="gap-3">
      <View className="overflow-hidden rounded-[18px] border border-borda bg-cartao">
        <View className="flex-row">
          <View className="w-[84px] bg-[#FCF7EF]" />
          {lista.map((o) => (
            <Text key={o.id} className="flex-1 p-2 font-body-bold text-[12.5px] leading-4 text-texto" numberOfLines={3}>
              {o.nome}
            </Text>
          ))}
        </View>
        {linhas.map((l) => (
          <View key={l.rotulo} className="flex-row border-t border-linha">
            <Text className="w-[84px] bg-[#FCF7EF] p-2 font-body-bold text-[11px] text-suave">{l.rotulo}</Text>
            {l.valores.map((v, i) => {
              const ruim = l.ruins?.[i]
              const bom = l.melhor === i || (l.ruins && !ruim && l.ruins.some(Boolean) && v !== '?')
              return (
                <Text
                  key={i}
                  className="flex-1 p-2 font-body-semibold text-[12.5px]"
                  style={ruim ? { backgroundColor: cor.vermelhoFundo, color: cor.vermelho } : bom ? { backgroundColor: cor.verdeFundo, color: cor.verde } : { color: cor.texto }}
                >
                  {v}
                </Text>
              )
            })}
          </View>
        ))}
      </View>
      {cidade.opcoes.length > 3 ? <Text className="font-body text-[12px] text-suave">Mostrando as 3 mais votadas.</Text> : null}
      {euSouAdm ? (
        lista.map((o, i) => <Botao key={o.id} titulo={`Ficar com ${o.nome}`} tipo={i === 0 ? 'primario' : 'secundario'} aoTocar={() => aoEscolher(o)} />)
      ) : (
        <Text className="text-center font-body text-[13px] text-suave">Vote no coração de cada opção. Quem escolhe é o ADM.</Text>
      )}
    </View>
  )
}

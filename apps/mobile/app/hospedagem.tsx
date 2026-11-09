import { Pressable, ScrollView, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, BedDouble, ChevronRight, Luggage, Repeat } from '../src/ui/icones'
import { detectarSite, fatosDaOpcao, formatarDinheiro, noitesDaViagem, textoAPe, textoDasNoites, textoDoDia, type CidadeDaNoite, type EstadoDaCidade } from '@together/core'
import { useHospedagemDaViagem } from '../src/dados/hospedagemDaViagem'
import { useViagemAtual } from '../src/dados/viagemAtual'
import { StatusBar } from '../src/ui/StatusBar'
import { Norti } from '../src/ui/Norti'
import { BotaoRedondo, Cartao, Carregando, ErroNaTela, IconeQuadrado } from '../src/ui/pecas'
import { cor } from '../theme'
import { puxarPraAtualizar } from '../src/ui/Puxar'

// Hospedagem por noite (spec 123): onde o grupo dorme cada noite, o que falta decidir e reservar,
// e quanto custa tudo. Tocar numa cidade abre as opções dela (/cidade-hospedagem).

export const SELO_DA_CIDADE: Record<EstadoDaCidade, { texto: string; fundo: string; cor: string }> = {
  'sem-cama': { texto: 'Sem cama', fundo: '#FBEBD2', cor: '#8A5A10' },
  comparando: { texto: 'Comparando', fundo: '#FBEBD2', cor: '#8A5A10' },
  escolhida: { texto: 'Escolhida', fundo: '#F6EAD7', cor: '#7B542F' },
  reservada: { texto: 'Reservada', fundo: '#EEF0DF', cor: '#5E6B2E' },
}
const COR_DA_NOITE: Record<EstadoDaCidade, string> = { 'sem-cama': '#F1D3A4', comparando: '#F1D3A4', escolhida: '#B97A22', reservada: '#5E6B2E' }

export default function Hospedagem() {
  return <TelaDeHospedagem />
}

// Spec 122d: a mesma tela entra na aba Reservas (naAba: sem voltar, sem título grande, sem a margem de cima)
export function TelaDeHospedagem({ naAba = false }: { naAba?: boolean }) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { atual: viagem } = useViagemAtual()
  const carga = useHospedagemDaViagem(viagem?.id)

  if (!viagem) return null
  if (carga.status === 'carregando') return <Carregando />
  if (carga.status === 'erro') return <ErroNaTela aoTentar={carga.recarregar} />
  const { destinos, opcoes, trajetos } = carga.dados
  const pessoas = Math.max(1, viagem.membros.length)
  const n = noitesDaViagem(destinos, opcoes, trajetos, pessoas)
  const moedas = Object.keys(n.total)

  return (
    <View className="flex-1 bg-fundo">
      {naAba ? null : <StatusBar style="dark" />}
      <ScrollView refreshControl={puxarPraAtualizar(carga)} contentContainerStyle={{ paddingTop: naAba ? 8 : insets.top + 8, paddingHorizontal: 20, paddingBottom: (naAba ? 0 : insets.bottom) + 40, gap: 10 }}>
        {naAba ? null : (
          <>
            <BotaoRedondo aoTocar={() => (router.canGoBack() ? router.back() : router.replace('/'))} rotulo="Voltar">
              <ArrowLeft size={20} color={cor.texto} />
            </BotaoRedondo>
            <Text className="font-display text-[32px] leading-[36px] text-texto">Hospedagem</Text>
          </>
        )}

        {n.cidades.length === 0 ? (
          <View className="mt-4 items-center gap-3 px-4">
            <Norti humor="dormindo" tamanho={110} />
            <Text className="text-center font-display text-[22px] text-texto">Nenhuma noite ainda</Text>
            <Text className="text-center font-body text-[15px] leading-6 text-corpo">Adicione os destinos e as datas no roteiro pra ver as noites.</Text>
          </View>
        ) : (
          <View className="flex-row gap-2">
            <Contador numero={n.semCama} rotulo={n.semCama === 1 ? 'noite sem cama' : 'noites sem cama'} fundo="#FBEBD2" corTexto="#8A5A10" />
            <Contador numero={n.praReservar} rotulo="pra reservar" fundo="#F6EAD7" corTexto="#7B542F" />
            <Contador numero={n.reservadas} rotulo={n.reservadas === 1 ? 'reservada' : 'reservadas'} fundo="#EEF0DF" corTexto="#5E6B2E" />
          </View>
        )}

        {/* Na ordem do roteiro: cidades com cama e, entre elas, os bate-e-voltas */}
        {destinos.map((d) => {
          const cidade = n.cidades.find((c) => c.destino.id === d.id)
          if (cidade) return <CartaoDaCidade key={d.id} cidade={cidade} pessoas={pessoas} aoAbrir={() => router.push(`/cidade-hospedagem?destino=${d.id}`)} />
          const p = n.passagens.find((x) => x.destino.id === d.id)
          if (!p) return null
          return (
            <View key={d.id} className="flex-row items-center gap-2 px-1">
              <Repeat size={14} color={cor.suave} />
              <Text className="flex-1 font-body text-[12.5px] text-suave">
                {d.nome}
                {p.dia ? ` (${textoDoDia(p.dia)})` : ''}: só de dia{p.dormemEm ? `, dormem em ${p.dormemEm}` : ''}
              </Text>
            </View>
          )
        })}

        {moedas.length ? (
          <View className="mt-2 flex-row items-center justify-between rounded-[20px] bg-couro px-4 py-3.5">
            <View>
              <Text className="font-body text-[12px] text-creme">Hospedagem por pessoa</Text>
              <Text className="font-display text-[22px] text-creme">{moedas.map((m) => formatarDinheiro(n.porPessoa[m], m)).join(' + ')}</Text>
            </View>
            <View className="items-end">
              <Text className="font-body text-[12px] text-creme">grupo · já pago</Text>
              {moedas.map((m) => (
                <Text key={m} className="font-body-bold text-[15px] text-creme">
                  {formatarDinheiro(n.total[m], m)} · {formatarDinheiro(n.pago[m] ?? 0, m)}
                </Text>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  )
}

function Contador({ numero, rotulo, fundo, corTexto }: { numero: number; rotulo: string; fundo: string; corTexto: string }) {
  return (
    <View className="flex-1 items-center rounded-2xl px-1 py-3" style={{ backgroundColor: fundo }}>
      <Text className="font-display text-[26px]" style={{ color: corTexto }}>
        {numero}
      </Text>
      <Text className="text-center font-body-bold text-[12px]" style={{ color: corTexto }}>
        {rotulo}
      </Text>
    </View>
  )
}

function CartaoDaCidade({ cidade, pessoas, aoAbrir }: { cidade: CidadeDaNoite; pessoas: number; aoAbrir: () => void }) {
  const selo = SELO_DA_CIDADE[cidade.estado]
  const e = cidade.escolhida
  const fatos = e ? fatosDaOpcao(e, cidade, pessoas) : null
  const precisa = cidade.estado === 'sem-cama' || cidade.estado === 'comparando'
  const textoSelo = cidade.estado === 'comparando' ? `${cidade.opcoes.length} ${cidade.opcoes.length === 1 ? 'opção' : 'opções'}` : selo.texto
  const barras = cidade.noites ?? 1
  return (
    <Pressable onPress={aoAbrir} accessibilityRole="button" accessibilityLabel={`Hospedagem em ${cidade.destino.nome}`} className="active:opacity-80">
      <Cartao className={`gap-2.5 p-3.5 ${precisa ? 'border-dourado' : ''}`}>
        <View className="flex-row items-center gap-3">
          <IconeQuadrado tamanho={36}>
            <BedDouble size={19} color={cor.couro} />
          </IconeQuadrado>
          <View className="min-w-0 flex-1">
            <Text className="font-body-bold text-[15px] text-texto">{cidade.destino.nome}</Text>
            <Text className="font-body text-[12.5px] text-suave" numberOfLines={1}>
              {textoDasNoites(cidade)}
              {cidade.chegada?.hora ? ` · chegam ${cidade.chegada.hora}` : ''}
            </Text>
          </View>
          <Text className="overflow-hidden rounded-full px-2.5 py-1 font-body-bold text-[11px]" style={{ backgroundColor: selo.fundo, color: selo.cor }}>
            {textoSelo}
          </Text>
          <ChevronRight size={18} color={cor.suave} />
        </View>

        <View className="flex-row gap-1">
          {Array.from({ length: Math.min(barras, 14) }).map((_, i) => (
            <View key={i} className="h-1.5 flex-1 rounded-full" style={{ backgroundColor: COR_DA_NOITE[cidade.estado] }} />
          ))}
        </View>

        {e && fatos ? (
          <View className="flex-row items-center gap-2 border-t border-dashed border-borda pt-2.5">
            <View className="min-w-0 flex-1">
              <Text className="font-body-bold text-[13.5px] text-texto" numberOfLines={1}>
                {e.nome}
              </Text>
              <Text className="font-body text-[12px] text-suave" numberOfLines={1}>
                {[detectarSite(e.link)?.nome, fatos.minutos ? `${textoAPe(fatos.minutos)} da chegada` : null, e.horaCheckinLimite ? `check-in até ${e.horaCheckinLimite}` : null].filter(Boolean).join(' · ') || 'Toque pra ver os detalhes'}
              </Text>
            </View>
            {fatos.porPessoa !== null ? (
              <View className="items-end">
                <Text className="font-body-bold text-[14px] text-texto">{formatarDinheiro(fatos.porPessoa, e.moeda)}</Text>
                <Text className="font-body text-[10.5px] text-suave">por pessoa</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {cidade.malas ? (
          <View className="flex-row gap-2 rounded-xl p-2.5" style={{ backgroundColor: '#FBEBD2' }}>
            <Luggage size={15} color="#7A4E0C" />
            <Text className="flex-1 font-body text-[12.5px] leading-5" style={{ color: '#7A4E0C' }}>
              <Text className="font-body-bold">Malas no check-out{cidade.destino.saida ? ` (${textoDoDia(cidade.destino.saida)})` : ''}. </Text>
              Próximo trecho às {cidade.malas.ate}: guarda-volumes perto de {cidade.malas.lugar}.
            </Text>
          </View>
        ) : null}
      </Cartao>
    </Pressable>
  )
}

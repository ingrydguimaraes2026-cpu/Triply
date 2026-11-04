import { useEffect, useState, type ReactNode } from 'react'
import { Linking, Modal, Pressable, Text, View } from 'react-native'
import { Briefcase, Calculator, Camera, Car, Languages, Percent, Utensils, X, type LucideIcon } from './icones'
import {
  CONGELADO,
  codigoDoPais,
  contaComGorjeta,
  cotacoesDeHoje,
  emReais,
  formatarDinheiro,
  frasesDoIdioma,
  gorjetaSugerida,
  idiomaDoPais,
  linkDeTraducaoPelaCamera,
  linksDeGuardaVolumes,
  linksDeRestaurante,
  moedaDoPais,
  NOME_DO_IDIOMA,
  type Destino,
  type Idioma,
} from '@together/core'
import { Botao, Campo, Cartao, IconeQuadrado } from './pecas'
import { cor } from '../../theme'

// Ferramentas do dia (spec 059 no mobile): conversor, gorjeta, frases, mostrar pro motorista,
// comer por perto e guardar as malas. O "banheiro grátis perto" fica no site (precisa da localização).

// "12,50" → 1250 centavos (0 se vazio/errado)
const centavos = (texto: string) => {
  const n = Number(texto.trim().replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0
}

export function FerramentasDoDia({ destino, moedaViagem, enderecoHospedagem }: { destino: Destino | null; moedaViagem: string; enderecoHospedagem: string | null }) {
  const pais = codigoDoPais(destino?.pais)
  const moedaLocal = pais ? moedaDoPais(pais) : moedaViagem
  const idioma = idiomaDoPais(pais)
  const cidade = destino?.nome ?? ''

  return (
    <View className="gap-3">
      <Text className="mt-2 font-body-bold text-[12px] uppercase tracking-widest text-suave">Ferramentas do dia</Text>
      <Conversor moeda={moedaLocal === 'BRL' ? moedaViagem : moedaLocal} />
      <Gorjeta pais={pais} moeda={moedaLocal} />
      {/* ❄ congelado pelo RUMO (03/11/2026): frases úteis */}
      {idioma && !CONGELADO.frasesUteis ? <Frases idioma={idioma} /> : null}
      {enderecoHospedagem ? <MostrarProMotorista endereco={enderecoHospedagem} /> : null}
      {destino ? (
        <Bloco Icone={Utensils} titulo="Comer por perto">
          <Links links={linksDeRestaurante(cidade, destino.latitude, destino.longitude)} />
        </Bloco>
      ) : null}
      {destino ? (
        <Bloco Icone={Briefcase} titulo="Guardar as malas">
          <Text className="font-body text-[13px] leading-5 text-suave">
            Antes do check-in ou no dia de passagem: guarda-volumes perto da estação costumam ser mais baratos que o do hotel.
          </Text>
          <Links links={linksDeGuardaVolumes(cidade).map((l) => ({ ...l, nome: `${l.nome} em ${cidade}` }))} />
        </Bloco>
      ) : null}
    </View>
  )
}

// J2: quanto dá em reais (comercial + IOF), pela cotação de hoje
function Conversor({ moeda }: { moeda: string }) {
  const [valor, setValor] = useState('')
  const [reaisPorUnidade, setTaxa] = useState<number | null | undefined>(undefined)

  useEffect(() => {
    let ativo = true
    if (moeda === 'BRL') return
    cotacoesDeHoje('BRL', [moeda]).then((t) => {
      if (!ativo) return
      const porReal = t?.[moeda]
      setTaxa(porReal ? 1 / porReal : null)
    })
    return () => {
      ativo = false
    }
  }, [moeda])

  if (moeda === 'BRL') return null
  const c = centavos(valor)
  return (
    <Bloco Icone={Calculator} titulo="Quanto dá em reais?">
      <Campo
        value={valor}
        onChangeText={setValor}
        placeholder="0,00"
        keyboardType="decimal-pad"
        accessibilityLabel={`Valor em ${moeda}`}
        icone={<Text className="font-body-bold text-[14px] text-suave">{moeda}</Text>}
      />
      {reaisPorUnidade === undefined ? <Text className="font-body text-[13px] text-suave">Buscando a cotação…</Text> : null}
      {reaisPorUnidade === null ? <Text className="font-body text-[13px] text-suave">Sem cotação agora (sem internet?).</Text> : null}
      {reaisPorUnidade ? (
        <View>
          <Text className="font-body-bold text-[20px] text-texto">{formatarDinheiro(emReais(c, reaisPorUnidade), 'BRL')}</Text>
          <Text className="font-body text-[12px] text-suave">
            com IOF de 3,5% · {formatarDinheiro(emReais(c, reaisPorUnidade, false), 'BRL')} sem · 1 {moeda} ={' '}
            {formatarDinheiro(Math.round(reaisPorUnidade * 100), 'BRL')}
          </Text>
        </View>
      ) : null}
    </Bloco>
  )
}

// J6: gorjeta pelo costume do país, dividida
function Gorjeta({ pais, moeda }: { pais: string | null; moeda: string }) {
  const [conta, setConta] = useState('')
  const [porcento, setPorcento] = useState(() => gorjetaSugerida(pais))
  const [pessoas, setPessoas] = useState(2)
  const r = contaComGorjeta(centavos(conta), porcento, pessoas)
  return (
    <Bloco Icone={Percent} titulo="Gorjeta e divisão">
      <Campo
        value={conta}
        onChangeText={setConta}
        placeholder="Valor da conta"
        keyboardType="decimal-pad"
        accessibilityLabel="Valor da conta"
        icone={<Text className="font-body-bold text-[14px] text-suave">{moeda}</Text>}
      />
      <View className="flex-row gap-3">
        <Contador rotulo="Gorjeta" valor={porcento} sufixo="%" min={0} max={30} passo={5} aoMudar={setPorcento} />
        <Contador rotulo="Pessoas" valor={pessoas} min={1} max={30} passo={1} aoMudar={setPessoas} />
      </View>
      {centavos(conta) > 0 ? (
        <View>
          <Text className="font-body-bold text-[18px] text-texto">{formatarDinheiro(r.porPessoa, moeda)} por pessoa</Text>
          <Text className="font-body text-[12px] text-suave">
            gorjeta {formatarDinheiro(r.gorjeta, moeda)} · total {formatarDinheiro(r.total, moeda)}
            {r.sobra > 0 ? ` · sobram ${formatarDinheiro(r.sobra, moeda)} pra alguém` : ''}
          </Text>
        </View>
      ) : null}
      <Text className="font-body text-[12.5px] text-suave">
        {porcento === 0 ? 'Aqui não se costuma dar gorjeta.' : `Costume local: por volta de ${gorjetaSugerida(pais)}%.`}
      </Text>
    </Bloco>
  )
}

// Spec 104: as frases mais úteis no idioma da rua (o áudio fica no site por enquanto)
function Frases({ idioma }: { idioma: Idioma }) {
  const [todas, setTodas] = useState(false)
  const frases = frasesDoIdioma(idioma)
  return (
    <Bloco Icone={Languages} titulo={`Frases em ${NOME_DO_IDIOMA[idioma].toLowerCase()}`}>
      {(todas ? frases : frases.slice(0, 5)).map((f) => (
        <View key={f.pt} className="border-t border-linha pt-2">
          <Text className="font-body-bold text-[15px] text-texto">{f.texto}</Text>
          <Text className="font-body text-[12px] text-suave">{f.pt}</Text>
        </View>
      ))}
      {!todas ? (
        <Pressable onPress={() => setTodas(true)} className="active:opacity-80">
          <Text className="font-body-bold text-[13px] text-couro">Ver todas ({frases.length})</Text>
        </Pressable>
      ) : null}
      <Pressable onPress={() => Linking.openURL(linkDeTraducaoPelaCamera(idioma))} className="flex-row items-center gap-1.5 active:opacity-80">
        <Camera size={15} color={cor.couro} />
        <Text className="font-body-bold text-[13px] text-couro">Traduzir cardápio ou placa pela câmera</Text>
      </Pressable>
    </Bloco>
  )
}

// J4: endereço em tela cheia, pra mostrar no táxi
function MostrarProMotorista({ endereco }: { endereco: string }) {
  const [aberto, setAberto] = useState(false)
  return (
    <>
      <Botao tipo="secundario" titulo="Mostrar endereço pro motorista" icone={<Car size={18} color={cor.couro} />} aoTocar={() => setAberto(true)} />
      <Modal visible={aberto} animationType="fade" onRequestClose={() => setAberto(false)}>
        <Pressable onPress={() => setAberto(false)} className="flex-1 items-center justify-center bg-white p-8" accessibilityLabel="Fechar">
          <View className="absolute right-6 top-14">
            <X size={30} color={cor.texto} />
          </View>
          <Text className="text-center font-body-bold text-[34px] leading-[44px] text-black">{endereco}</Text>
        </Pressable>
      </Modal>
    </>
  )
}

function Contador({ rotulo, valor, sufixo = '', min, max, passo, aoMudar }: {
  rotulo: string
  valor: number
  sufixo?: string
  min: number
  max: number
  passo: number
  aoMudar: (v: number) => void
}) {
  const botao = (texto: string, novo: number) => (
    <Pressable
      onPress={() => aoMudar(Math.max(min, Math.min(max, novo)))}
      accessibilityLabel={`${texto === '+' ? 'Mais' : 'Menos'} ${rotulo.toLowerCase()}`}
      className="h-9 w-9 items-center justify-center rounded-xl bg-chip active:opacity-80"
    >
      <Text className="font-body-bold text-[18px] text-couro">{texto}</Text>
    </Pressable>
  )
  return (
    <View className="flex-1 gap-1">
      <Text className="font-body-semibold text-[12px] text-suave">{rotulo}</Text>
      <View className="flex-row items-center justify-between rounded-2xl border border-borda bg-cartao p-1.5">
        {botao('−', valor - passo)}
        <Text className="font-body-bold text-[16px] text-texto">
          {valor}
          {sufixo}
        </Text>
        {botao('+', valor + passo)}
      </View>
    </View>
  )
}

function Links({ links }: { links: { nome: string; url: string }[] }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {links.map((l) => (
        <Pressable key={l.url} onPress={() => Linking.openURL(l.url)} className="rounded-xl bg-chip px-3 py-2 active:opacity-80">
          <Text className="font-body-bold text-[13px] text-couro">{l.nome}</Text>
        </Pressable>
      ))}
    </View>
  )
}

export function Bloco({ Icone, titulo, children }: { Icone: LucideIcon; titulo: string; children: ReactNode }) {
  return (
    <Cartao className="gap-2.5 p-4">
      <View className="flex-row items-center gap-3">
        <IconeQuadrado tamanho={36}>
          <Icone size={18} color={cor.couro} />
        </IconeQuadrado>
        <Text className="font-body-bold text-[15px] text-texto">{titulo}</Text>
      </View>
      {children}
    </Cartao>
  )
}

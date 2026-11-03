import { Pressable, Text, View } from 'react-native'
import { ChevronRight } from './icones'
import { Cartao } from './pecas'
import { Selo, type NomeDoSelo } from './Selos'
import { cor } from '../../theme'

// "Montem a viagem" (spec 116): checklist no topo da viagem que apresenta o que o app faz,
// na ordem certa, e marca o que já foi feito. Some quando tudo está feito ou a viagem começou.

export type EstadoDosPassos = {
  lugares: number
  pessoas: number
  temDatas: boolean
  hospedagens: number
  trajetos: number
  gastos: number
  euSouAdm: boolean
}

export type ChaveDoPasso = 'roteiro' | 'galera' | 'datas' | 'hospedagem' | 'transporte' | 'gastos'
export type DestinoDoPasso = 'explorar' | 'convidar' | 'configuracoes' | 'hospedagem' | 'transportes' | 'contas'
export type Passo = { chave: ChaveDoPasso; selo: NomeDoSelo; rotulo: string; titulo: string; sub: string; feito: boolean; destino: DestinoDoPasso; soAdm?: boolean }

// Os 6 passos (= os 6 carimbos do passaporte da spec 117), na ordem certa.
// `soAdm`: só o ADM resolve (datas); pra quem não é ADM ele não vira o "próximo".
export function montarPassos(estado: EstadoDosPassos): Passo[] {
  return [
    { chave: 'roteiro', selo: 'mapa', rotulo: 'Roteiro', titulo: 'Montar o roteiro', sub: 'Deslize os lugares e o app monta os dias', feito: estado.lugares > 0, destino: 'explorar' },
    { chave: 'galera', selo: 'galera', rotulo: 'Galera', titulo: 'Chamar a galera', sub: 'Cada um escolhe o que quer fazer', feito: estado.pessoas > 1, destino: 'convidar' },
    { chave: 'datas', selo: 'calendario', rotulo: 'Datas', titulo: 'Pôr as datas', sub: 'Quando vocês vão e voltam', feito: estado.temDatas, destino: 'configuracoes', soAdm: true },
    { chave: 'hospedagem', selo: 'barraca', rotulo: 'Dormir', titulo: 'Onde dormir', sub: 'Juntem opções e votem', feito: estado.hospedagens > 0, destino: 'hospedagem' },
    { chave: 'transporte', selo: 'passagem', rotulo: 'Chegar', titulo: 'Como chegar', sub: 'Voos, ônibus e carro de todo mundo', feito: estado.trajetos > 0, destino: 'transportes' },
    { chave: 'gastos', selo: 'moedas', rotulo: 'Contas', titulo: 'Dividir as contas', sub: 'Lance um gasto e o app faz a conta', feito: estado.gastos > 0, destino: 'contas' },
  ]
}

// O próximo carimbo a conquistar. Comboio de 1 pessoa: chamar a galera vem primeiro (spec 117).
export function proximoCarimbo(estado: EstadoDosPassos): Passo | null {
  const abertos = montarPassos(estado).filter((p) => !p.feito && (!p.soAdm || estado.euSouAdm))
  return abertos.find((p) => p.chave === 'galera') ?? abertos[0] ?? null
}

export function PassosDaViagem({ estado, ir }: { estado: EstadoDosPassos; ir: (chave: DestinoDoPasso) => void }) {
  // Só o ADM muda as datas: pra quem não é ADM o passo nem aparece
  const passos = montarPassos(estado)
    .filter((p) => !p.soAdm || estado.euSouAdm || p.feito)
    .map((p) => ({ ...p, aoTocar: () => ir(p.destino) }))
  const feitos = passos.filter((p) => p.feito).length
  if (feitos === passos.length) return null
  const proximo = passos.find((p) => !p.feito)

  return (
    <Cartao className="p-5">
      <View className="flex-row items-baseline justify-between">
        <Text className="font-display text-[22px] text-texto">Montem a viagem</Text>
        <Text className="font-body-semibold text-[13px] text-suave">
          {feitos} de {passos.length}
        </Text>
      </View>
      <View className="mb-2 mt-3 h-1.5 overflow-hidden rounded-full bg-areia">
        <View className="h-full rounded-full bg-caramelo" style={{ width: `${Math.round((feitos / passos.length) * 100)}%` }} />
      </View>
      {passos.map((p) => {
        const ehProximo = p === proximo
        return (
          <Pressable key={p.chave} onPress={p.aoTocar} className="min-h-[56px] flex-row items-center gap-3 border-b border-linha py-2.5 active:opacity-80">
            <View className={`h-11 w-11 items-center justify-center rounded-2xl ${ehProximo ? 'bg-chip' : ''}`} style={{ opacity: p.feito ? 0.9 : ehProximo ? 1 : 0.75 }}>
              <Selo nome={p.feito ? 'feito' : p.selo} tamanho={p.feito ? 30 : 36} />
            </View>
            <View className="flex-1">
              <Text className={`font-body-bold text-[15px] ${p.feito ? 'text-suave line-through' : 'text-texto'}`}>{p.titulo}</Text>
              {!p.feito ? <Text className="font-body text-[13px] text-suave">{p.sub}</Text> : null}
            </View>
            {ehProximo ? (
              <View className="rounded-full bg-caramelo px-2.5 py-1">
                <Text className="font-body-bold text-[11px] uppercase tracking-wider text-white">Próximo</Text>
              </View>
            ) : !p.feito ? (
              <ChevronRight size={18} color={cor.apagado} />
            ) : null}
          </Pressable>
        )
      })}
    </Cartao>
  )
}

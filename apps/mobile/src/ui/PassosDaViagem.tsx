import { Pressable, Text, View } from 'react-native'
import { BedDouble, Calendar, Car, Check, ChevronRight, Compass, ReceiptText, Users } from 'lucide-react-native'
import { Cartao } from './pecas'
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

type Passo = { chave: string; Icone: typeof Compass; titulo: string; sub: string; feito: boolean; aoTocar: () => void }

export function PassosDaViagem({ estado, ir }: { estado: EstadoDosPassos; ir: (chave: 'explorar' | 'convidar' | 'configuracoes' | 'hospedagem' | 'transportes' | 'contas') => void }) {
  const passos: Passo[] = [
    { chave: 'roteiro', Icone: Compass, titulo: 'Montar o roteiro', sub: 'Deslize os lugares e o app monta os dias', feito: estado.lugares > 0, aoTocar: () => ir('explorar') },
    { chave: 'galera', Icone: Users, titulo: 'Chamar a galera', sub: 'Cada um escolhe o que quer fazer', feito: estado.pessoas > 1, aoTocar: () => ir('convidar') },
    // Só o ADM muda as datas: pra quem não é ADM o passo nem aparece
    ...(estado.euSouAdm || estado.temDatas
      ? [{ chave: 'datas', Icone: Calendar, titulo: 'Pôr as datas', sub: 'Quando vocês vão e voltam', feito: estado.temDatas, aoTocar: () => ir('configuracoes') }]
      : []),
    { chave: 'hospedagem', Icone: BedDouble, titulo: 'Onde dormir', sub: 'Juntem opções e votem', feito: estado.hospedagens > 0, aoTocar: () => ir('hospedagem') },
    { chave: 'transporte', Icone: Car, titulo: 'Como chegar', sub: 'Voos, ônibus e carro de todo mundo', feito: estado.trajetos > 0, aoTocar: () => ir('transportes') },
    { chave: 'gastos', Icone: ReceiptText, titulo: 'Dividir as contas', sub: 'Lance um gasto e o app faz a conta', feito: estado.gastos > 0, aoTocar: () => ir('contas') },
  ]
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
            <View className={`h-9 w-9 items-center justify-center rounded-full ${p.feito ? 'bg-verde-fundo' : ehProximo ? 'bg-couro' : 'bg-chip'}`}>
              {p.feito ? <Check size={18} color={cor.verde} strokeWidth={2.6} /> : <p.Icone size={18} color={ehProximo ? '#fff' : cor.couro} />}
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

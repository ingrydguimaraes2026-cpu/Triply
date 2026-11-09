import { Redirect, type Href } from 'expo-router'
import { useViagemAtual } from '../dados/viagemAtual'
import { Carregando } from './pecas'
import { SemViagem } from './SemViagem'

// Rotas antigas (/roteiro, /contas, /fotos) da barra de 5 abas: levam pra aba da viagem atual (spec 117)
export function IrPraAba({ aba, titulo }: { aba: 'roteiro' | 'contas' | 'fotos'; titulo: string }) {
  const { status, atual } = useViagemAtual()
  if (status === 'carregando') return <Carregando />
  if (!atual) return <SemViagem titulo={titulo} />
  return <Redirect href={`/viagem/${atual.id}/${aba}` as Href} />
}

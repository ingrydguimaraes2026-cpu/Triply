import { Bed, Coins, Plane, Receipt, ShoppingBag, Ticket, Utensils, Wallet, type LucideIcon } from 'lucide-react'
import { useViagemAtual } from '../../features/viagens/hooks'
import CabecalhoPagina from '../../components/ui/CabecalhoPagina'
import Cartao from '../../components/ui/Cartao'
import EstadoVazio from '../../components/ui/EstadoVazio'
import './abas.css'

/*
  TODO (Ingryd): Financeiro. Specs completas: docs/specs/002-financeiro-gastos-e-divisao.md
  e docs/specs/003-financeiro-orcamento-e-cambio.md
  - Orçamento: tabela "orcamentos" (uma linha por categoria, com valor_meta). Só ADM edita.
  - Gastos: tabela "gastos". Quem lançou, quem pagou (pago_por), valor, moeda, categoria.
    "pessoal = true" → só quem lançou vê (comprinhas). O banco já garante isso.
  - Divisão: tabela "gasto_divisoes" (quanto cada pessoa deve de cada gasto).
  - Câmbio: tabela "compras_cambio". A cotação já é calculada sozinha no banco.
    Cotação de hoje: API grátis https://api.frankfurter.dev/v1/latest?base=EUR&symbols=BRL
  - Preencher os 3 números do topo e as barras de cada categoria.
  - Criar src/features/financeiro/api.ts e src/features/cambio/api.ts.
*/

// Mesmas categorias da tabela "gastos" no banco
const CATEGORIAS: { chave: string; nome: string; icone: LucideIcon }[] = [
  { chave: 'transporte', nome: 'Transporte', icone: Plane },
  { chave: 'hospedagem', nome: 'Hospedagem', icone: Bed },
  { chave: 'alimentacao', nome: 'Alimentação', icone: Utensils },
  { chave: 'passeios', nome: 'Passeios', icone: Ticket },
  { chave: 'comprinhas', nome: 'Comprinhas', icone: ShoppingBag },
  { chave: 'outros', nome: 'Outros', icone: Receipt },
]

export default function Financeiro() {
  const { viagem } = useViagemAtual()

  return (
    <>
      <CabecalhoPagina
        titulo="Financeiro"
        subtitulo={`Orçamento, quem pagou o quê e câmbio · em ${viagem.moeda_principal}`}
        acao={
          <button type="button" className="botao" disabled>
            Lançar gasto (em breve)
          </button>
        }
      />

      <div className="numeros">
        <Cartao titulo="Orçamento total" icone={Wallet}>
          <p className="numero">—</p>
        </Cartao>
        <Cartao titulo="Gasto até agora" icone={Receipt}>
          <p className="numero">—</p>
        </Cartao>
        <Cartao titulo="Cotação média" icone={Coins}>
          <p className="numero">—</p>
          <p className="numero-legenda">Quanto vocês pagaram, em média, por 1 {viagem.moeda_principal}</p>
        </Cartao>
      </div>

      <Cartao titulo="Por categoria">
        <ul className="categorias">
          {CATEGORIAS.map(({ chave, nome, icone: Icone }) => (
            <li key={chave}>
              <span className="categoria-icone">
                <Icone size={18} aria-hidden="true" />
              </span>
              <span className="categoria-nome">{nome}</span>
              <span className="categoria-barra" aria-hidden="true">
                <span style={{ width: '0%' }} />
              </span>
              <span className="categoria-valor">—</span>
            </li>
          ))}
        </ul>
      </Cartao>

      <EstadoVazio
        icone={Receipt}
        titulo="Nenhum gasto ainda"
        texto="Lance o primeiro gasto e o app mostra quem pagou e quanto cada um deve."
      />
    </>
  )
}

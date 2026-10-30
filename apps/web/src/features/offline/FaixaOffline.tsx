import { WifiOff } from 'lucide-react'
import { useSemInternet } from './cache'

// Faixa no topo quando o aparelho está sem internet (spec 034)
export default function FaixaOffline() {
  const semInternet = useSemInternet()
  if (!semInternet) return null
  return (
    <p className="faixa-offline" role="status">
      <WifiOff size={16} aria-hidden="true" /> Sem internet: mostrando o que você já abriu. Gastos e marcações (listas, mala, tarefas) ficam guardados e sobem quando a conexão voltar.
    </p>
  )
}

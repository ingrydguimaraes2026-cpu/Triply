import { Send } from 'lucide-react'
import { textoParaIndicar } from '@together/core'
import type { Lugar } from './regras'

// Indicar lugares pra um amigo (spec 103): manda a lista do destino pelo WhatsApp (ou o
// compartilhar do celular). Só texto e links do Google Maps: o amigo não precisa do app.
export default function IndicarLugares({ destino, lugares }: { destino: string; lugares: Lugar[] }) {
  if (lugares.filter((l) => l.tipo !== 'guarda_volumes').length === 0) return null

  async function indicar() {
    const texto = textoParaIndicar(
      destino,
      lugares.map((l) => ({
        nome: l.nome,
        tipo: l.tipo,
        votos: l.votos.length,
        visitado: !!l.visitadoEm,
        latitude: l.latitude,
        longitude: l.longitude,
        observacao: l.observacao,
      })),
    )
    if (navigator.share) {
      try {
        await navigator.share({ text: texto })
      } catch {
        // cancelou: tudo bem
      }
      return
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener')
  }

  return (
    <button type="button" className="botao-texto indicar-lugares" onClick={indicar}>
      <Send size={15} aria-hidden="true" /> Indicar pra um amigo
    </button>
  )
}

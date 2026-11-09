import { Bookmark, Luggage, MapPin, Utensils, type LucideIcon } from '../../components/ui/icones'
import type { TipoDeLugar } from './regras'

// Ícone de cada tipo de lugar (spec 016)
export const ICONE_DO_TIPO: Record<TipoDeLugar, LucideIcon> = {
  passeio: MapPin,
  comida: Utensils,
  guarda_volumes: Luggage,
  outro: Bookmark,
}

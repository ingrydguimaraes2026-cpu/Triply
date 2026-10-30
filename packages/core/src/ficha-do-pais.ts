// Ficha do país (spec 047): tomada, voltagem, gorjeta, idioma, lado da rua e internet.
// Só dados estáveis e bem conhecidos. País fora da lista: a tela avisa e manda pesquisar.
// Puro, testado em apps/web/tests/ficha-do-pais.test.mjs.

export type FichaDoPais = {
  tomadas: string[] // tipos (A, B, C, F, G...)
  volts: number
  gorjeta: string
  idioma: string
  maoInglesa?: boolean // dirige do lado esquerdo
  roamingUE?: boolean // chip de qualquer país da UE funciona sem roaming extra
}

const EURO_CF = { tomadas: ['C', 'F'], volts: 230, roamingUE: true }
const GORJETA_EUROPA = 'Serviço costuma vir na conta; arredondar ou deixar 5–10% num lugar bom é gentileza, não obrigação.'

const FICHAS: Record<string, FichaDoPais> = {
  FR: { tomadas: ['C', 'E'], volts: 230, roamingUE: true, idioma: 'Francês', gorjeta: 'Serviço incluso ("service compris"); deixar uns trocados é opcional.' },
  MC: { tomadas: ['C', 'E', 'F'], volts: 230, idioma: 'Francês', gorjeta: 'Serviço incluso; deixar uns trocados é opcional.' },
  IT: { tomadas: ['C', 'F', 'L'], volts: 230, roamingUE: true, idioma: 'Italiano', gorjeta: 'Muitas contas têm "coperto" (couvert). Gorjeta é opcional; arredondar basta.' },
  VA: { tomadas: ['C', 'F', 'L'], volts: 230, idioma: 'Italiano', gorjeta: 'Igual à Itália: opcional.' },
  SM: { tomadas: ['C', 'F', 'L'], volts: 230, idioma: 'Italiano', gorjeta: 'Igual à Itália: opcional.' },
  ES: { ...EURO_CF, idioma: 'Espanhol', gorjeta: GORJETA_EUROPA },
  PT: { ...EURO_CF, idioma: 'Português', gorjeta: GORJETA_EUROPA },
  DE: { ...EURO_CF, idioma: 'Alemão', gorjeta: 'Arredondar ou 5–10%, dito na hora de pagar ("faz 30").' },
  AT: { ...EURO_CF, idioma: 'Alemão', gorjeta: 'Arredondar ou 5–10%, dito na hora de pagar.' },
  NL: { ...EURO_CF, idioma: 'Holandês (inglês é muito falado)', gorjeta: GORJETA_EUROPA },
  BE: { tomadas: ['C', 'E'], volts: 230, roamingUE: true, idioma: 'Francês e holandês', gorjeta: GORJETA_EUROPA },
  LU: { ...EURO_CF, idioma: 'Francês, alemão e luxemburguês', gorjeta: GORJETA_EUROPA },
  GR: { ...EURO_CF, idioma: 'Grego', gorjeta: 'Arredondar ou 5–10% em restaurante.' },
  HR: { ...EURO_CF, idioma: 'Croata', gorjeta: GORJETA_EUROPA },
  PL: { tomadas: ['C', 'E'], volts: 230, roamingUE: true, idioma: 'Polonês', gorjeta: '10% em restaurante é comum.' },
  CZ: { tomadas: ['C', 'E'], volts: 230, roamingUE: true, idioma: 'Tcheco', gorjeta: 'Arredondar ou 5–10%.' },
  HU: { ...EURO_CF, idioma: 'Húngaro', gorjeta: '10% é comum quando não vem na conta.' },
  IE: { tomadas: ['G'], volts: 230, roamingUE: true, maoInglesa: true, idioma: 'Inglês', gorjeta: '10% em restaurante com mesa.' },
  DK: { tomadas: ['C', 'E', 'F', 'K'], volts: 230, roamingUE: true, idioma: 'Dinamarquês (inglês é muito falado)', gorjeta: 'Serviço incluso; gorjeta é opcional.' },
  SE: { ...EURO_CF, idioma: 'Sueco (inglês é muito falado)', gorjeta: 'Serviço incluso; arredondar é opcional.' },
  FI: { ...EURO_CF, idioma: 'Finlandês e sueco', gorjeta: 'Não é costume.' },
  CH: { tomadas: ['C', 'J'], volts: 230, idioma: 'Alemão, francês e italiano', gorjeta: 'Serviço incluso; arredondar é gentileza.' },
  NO: { ...EURO_CF, roamingUE: true, idioma: 'Norueguês (inglês é muito falado)', gorjeta: 'Serviço incluso; arredondar é opcional.' },
  IS: { ...EURO_CF, roamingUE: true, idioma: 'Islandês (inglês é muito falado)', gorjeta: 'Não é costume.' },
  GB: { tomadas: ['G'], volts: 230, maoInglesa: true, idioma: 'Inglês', gorjeta: '10–12,5%; muitas vezes já vem como "service charge" na conta.' },
  US: { tomadas: ['A', 'B'], volts: 120, idioma: 'Inglês', gorjeta: 'Esperada: 15–20% em restaurante (o preço do cardápio não inclui imposto nem gorjeta).' },
  CA: { tomadas: ['A', 'B'], volts: 120, idioma: 'Inglês e francês', gorjeta: 'Esperada: 15–20% em restaurante.' },
  MX: { tomadas: ['A', 'B'], volts: 127, idioma: 'Espanhol', gorjeta: '10–15% em restaurante.' },
  AR: { tomadas: ['C', 'I'], volts: 220, idioma: 'Espanhol', gorjeta: '10% em restaurante.' },
  CL: { tomadas: ['C', 'L'], volts: 220, idioma: 'Espanhol', gorjeta: '10% (a conta costuma perguntar "propina sugerida").' },
  UY: { tomadas: ['C', 'F', 'I', 'L'], volts: 220, idioma: 'Espanhol', gorjeta: '10% em restaurante.' },
  JP: { tomadas: ['A', 'B'], volts: 100, maoInglesa: true, idioma: 'Japonês', gorjeta: 'Não se dá gorjeta (pode até ofender).' },
  AU: { tomadas: ['I'], volts: 230, maoInglesa: true, idioma: 'Inglês', gorjeta: 'Não é obrigatória; 10% num serviço bom.' },
  NZ: { tomadas: ['I'], volts: 230, maoInglesa: true, idioma: 'Inglês', gorjeta: 'Não é costume.' },
  TH: { tomadas: ['A', 'B', 'C', 'O'], volts: 220, maoInglesa: true, idioma: 'Tailandês', gorjeta: 'Arredondar ou deixar uns trocados.' },
  ZA: { tomadas: ['C', 'D', 'M', 'N'], volts: 230, maoInglesa: true, idioma: 'Inglês e outros 10 idiomas oficiais', gorjeta: '10–15% em restaurante.' },
  BR: { tomadas: ['C', 'N'], volts: 220, idioma: 'Português', gorjeta: '10% de serviço costuma vir na conta (opcional).' },
}

export function fichaDoPais(codigo: string | null): FichaDoPais | null {
  return codigo ? (FICHAS[codigo.toUpperCase()] ?? null) : null
}

// O plugue brasileiro (tipo N, e o redondinho tipo C) entra direto?
export function precisaAdaptador(ficha: FichaDoPais): 'nao' | 'so_tres_pinos' | 'sim' {
  if (ficha.tomadas.includes('N')) return 'nao'
  if (ficha.tomadas.includes('C') || ficha.tomadas.includes('E') || ficha.tomadas.includes('F')) return 'so_tres_pinos'
  return 'sim'
}

// Carregador do Brasil costuma ser bivolt; secador e chapinha, não
export function avisoDeVoltagem(volts: number): string {
  if (volts <= 127) return `${volts} V: secador e chapinha de 220 V não funcionam bem. Celular e notebook bivolt (100–240 V) funcionam.`
  return `${volts} V: aparelho só 127 V queima. Confira se diz 100–240 V (bivolt).`
}

// Prazo da tarefa do eSIM (I12): 3 dias antes da ida (ou null sem data)
export function prazoDoEsim(ida: string | null): string | null {
  if (!ida) return null
  const d = new Date(`${ida}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - 3)
  return d.toISOString().slice(0, 10)
}

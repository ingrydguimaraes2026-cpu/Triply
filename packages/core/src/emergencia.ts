// Emergência (spec 037): números locais por país + links úteis (hospital perto, consulado do Brasil).
// Só números amplamente conhecidos. País fora da lista: 112 (funciona na maioria das redes GSM do
// mundo, inclusive sem chip) e um link pra conferir. Testado em apps/web/tests/emergencia.test.mjs.

export type NumeroDeEmergencia = { rotulo: string; numero: string }

const UE_112: NumeroDeEmergencia[] = [{ rotulo: 'Emergência (polícia, ambulância, bombeiros)', numero: '112' }]

// Países da União Europeia + vizinhos que usam o 112 como número único
const SO_112 = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'MC', 'VA', 'SM', 'AD', 'LI', 'IS', 'TR',
]

const NUMEROS: Record<string, NumeroDeEmergencia[]> = {
  GB: [{ rotulo: 'Emergência', numero: '999' }, { rotulo: 'Emergência (também funciona)', numero: '112' }],
  CH: [
    { rotulo: 'Emergência', numero: '112' },
    { rotulo: 'Ambulância', numero: '144' },
    { rotulo: 'Polícia', numero: '117' },
  ],
  NO: [
    { rotulo: 'Emergência', numero: '112' },
    { rotulo: 'Ambulância', numero: '113' },
  ],
  US: [{ rotulo: 'Emergência', numero: '911' }],
  CA: [{ rotulo: 'Emergência', numero: '911' }],
  MX: [{ rotulo: 'Emergência', numero: '911' }],
  AR: [{ rotulo: 'Emergência', numero: '911' }, { rotulo: 'Ambulância (SAME)', numero: '107' }],
  UY: [{ rotulo: 'Emergência', numero: '911' }],
  CL: [
    { rotulo: 'Ambulância', numero: '131' },
    { rotulo: 'Bombeiros', numero: '132' },
    { rotulo: 'Polícia (Carabineros)', numero: '133' },
  ],
  CO: [{ rotulo: 'Emergência', numero: '123' }],
  JP: [
    { rotulo: 'Polícia', numero: '110' },
    { rotulo: 'Ambulância e bombeiros', numero: '119' },
  ],
  CN: [
    { rotulo: 'Polícia', numero: '110' },
    { rotulo: 'Ambulância', numero: '120' },
    { rotulo: 'Bombeiros', numero: '119' },
  ],
  KR: [
    { rotulo: 'Polícia', numero: '112' },
    { rotulo: 'Ambulância e bombeiros', numero: '119' },
  ],
  IN: [{ rotulo: 'Emergência', numero: '112' }],
  AU: [{ rotulo: 'Emergência', numero: '000' }],
  NZ: [{ rotulo: 'Emergência', numero: '111' }],
  TH: [
    { rotulo: 'Polícia', numero: '191' },
    { rotulo: 'Ambulância', numero: '1669' },
    { rotulo: 'Polícia turística', numero: '1155' },
  ],
  AE: [
    { rotulo: 'Polícia', numero: '999' },
    { rotulo: 'Ambulância', numero: '998' },
  ],
  BR: [
    { rotulo: 'SAMU', numero: '192' },
    { rotulo: 'Polícia', numero: '190' },
    { rotulo: 'Bombeiros', numero: '193' },
  ],
}

for (const pais of SO_112) NUMEROS[pais] = UE_112

export function numerosDeEmergencia(codigoPais: string | null): { numeros: NumeroDeEmergencia[]; conferido: boolean } {
  const lista = codigoPais ? NUMEROS[codigoPais.toUpperCase()] : undefined
  if (lista) return { numeros: lista, conferido: true }
  return { numeros: [{ rotulo: 'Emergência (funciona na maioria dos países)', numero: '112' }], conferido: false }
}

// Busca no Google Maps: "hospital" perto do ponto (ou do nome da cidade)
export function linkHospitalPerto(lugar: { nome: string; latitude: number | null; longitude: number | null }): string {
  if (lugar.latitude !== null && lugar.longitude !== null) {
    return `https://www.google.com/maps/search/hospital/@${lugar.latitude},${lugar.longitude},14z`
  }
  return `https://www.google.com/maps/search/${encodeURIComponent(`hospital ${lugar.nome}`)}`
}

// Busca do consulado/embaixada do Brasil na cidade (não guardamos telefone de consulado: muda e a gente erraria)
export function linkConsuladoDoBrasil(cidade: string, pais: string | null): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`consulado do Brasil ${pais ? `${cidade} ${pais}` : cidade} plantão`)}`
}

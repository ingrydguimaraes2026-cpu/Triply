// Aeroportos mais usados por brasileiros e os jeitos de ir até o centro (spec 121, T1).
// Tabela feita à mão, igual às exigências da spec 111: sem API, sem nada ao vivo.
// Preços em CENTAVOS da moeda local, sempre aproximados ("~€14" na tela).
// Revisar a cada ~6 meses; quando revisar, troque REFERENCIA_DOS_PRECOS.
// Testado em apps/web/tests/como-ir.test.mjs.

export const REFERENCIA_DOS_PRECOS = 'nov/2026'

export type MeioAteOCentro = 'trem' | 'metro' | 'onibus' | 'taxi' | 'corrida'

export type JeitoDeIr = {
  meio: MeioAteOCentro
  nome: string // "Leonardo Express até Termini"
  minutos: number
  preco: number // centavos, por pessoa (táxi e corrida: o carro inteiro)
  moeda: string
}

export type Aeroporto = {
  codigo: string // "FCO"
  nome: string // "Fiumicino"
  cidades: string[] // como as pessoas escrevem a cidade no roteiro, sem acento ("roma", "rome")
  apelidos: string[] // outros nomes do AEROPORTO ("leonardo da vinci"), nunca o da cidade
  jeitos: JeitoDeIr[] // do mais barato pro mais caro
}

const j = (meio: MeioAteOCentro, nome: string, minutos: number, preco: number, moeda: string): JeitoDeIr => ({ meio, nome, minutos, preco: Math.round(preco * 100), moeda })

// O primeiro de cada cidade é o principal (usado quando o trajeto não diz o aeroporto).
export const AEROPORTOS: Aeroporto[] = [
  { codigo: 'LIS', nome: 'Aeroporto de Lisboa', cidades: ['lisboa', 'lisbon'], apelidos: ['humberto delgado', 'portela'], jeitos: [j('metro', 'Metrô (linha vermelha)', 25, 1.85, 'EUR'), j('corrida', 'Corrida (Uber/Bolt)', 20, 15, 'EUR')] },
  { codigo: 'OPO', nome: 'Aeroporto do Porto', cidades: ['porto', 'oporto'], apelidos: ['francisco sa carneiro'], jeitos: [j('metro', 'Metrô (linha E)', 30, 2.2, 'EUR'), j('corrida', 'Corrida (Uber/Bolt)', 25, 22, 'EUR')] },
  { codigo: 'MAD', nome: 'Barajas', cidades: ['madri', 'madrid'], apelidos: ['adolfo suarez'], jeitos: [j('onibus', 'Ônibus Exprés Aeropuerto', 40, 5, 'EUR'), j('metro', 'Metrô (linha 8)', 40, 5, 'EUR'), j('taxi', 'Táxi (tarifa fixa)', 30, 33, 'EUR')] },
  { codigo: 'BCN', nome: 'El Prat', cidades: ['barcelona'], apelidos: ['josep tarradellas'], jeitos: [j('trem', 'Trem R2 Nord', 30, 5.15, 'EUR'), j('onibus', 'Aerobús até a Plaça Catalunya', 35, 7.25, 'EUR'), j('taxi', 'Táxi', 30, 40, 'EUR')] },
  { codigo: 'CDG', nome: 'Charles de Gaulle', cidades: ['paris'], apelidos: ['roissy'], jeitos: [j('trem', 'RER B até o centro', 45, 14, 'EUR'), j('taxi', 'Táxi (tarifa fixa)', 50, 56, 'EUR')] },
  { codigo: 'ORY', nome: 'Orly', cidades: ['paris'], apelidos: [], jeitos: [j('metro', 'Metrô (linha 14)', 30, 14, 'EUR'), j('taxi', 'Táxi (tarifa fixa)', 35, 36, 'EUR')] },
  { codigo: 'FCO', nome: 'Fiumicino', cidades: ['roma', 'rome'], apelidos: ['leonardo da vinci'], jeitos: [j('onibus', 'Ônibus até Termini', 55, 7, 'EUR'), j('trem', 'Leonardo Express até Termini', 32, 14, 'EUR'), j('taxi', 'Táxi (tarifa fixa)', 40, 55, 'EUR')] },
  { codigo: 'MXP', nome: 'Malpensa', cidades: ['milao', 'milan', 'milano'], apelidos: [], jeitos: [j('onibus', 'Ônibus até a Centrale', 60, 10, 'EUR'), j('trem', 'Malpensa Express', 50, 13, 'EUR'), j('taxi', 'Táxi (tarifa fixa)', 50, 104, 'EUR')] },
  { codigo: 'LHR', nome: 'Heathrow', cidades: ['londres', 'london'], apelidos: [], jeitos: [j('metro', 'Metrô (Piccadilly)', 55, 6, 'GBP'), j('trem', 'Elizabeth line', 40, 13, 'GBP'), j('taxi', 'Táxi', 60, 90, 'GBP')] },
  { codigo: 'AMS', nome: 'Schiphol', cidades: ['amsterda', 'amsterdam', 'amsterdao'], apelidos: [], jeitos: [j('trem', 'Trem até a Centraal', 17, 6, 'EUR'), j('taxi', 'Táxi', 25, 50, 'EUR')] },
  { codigo: 'FRA', nome: 'Aeroporto de Frankfurt', cidades: ['frankfurt'], apelidos: [], jeitos: [j('trem', 'S-Bahn (S8/S9)', 15, 6.3, 'EUR'), j('taxi', 'Táxi', 20, 40, 'EUR')] },
  { codigo: 'EZE', nome: 'Ezeiza', cidades: ['buenos aires'], apelidos: ['ministro pistarini'], jeitos: [j('onibus', 'Ônibus até o centro', 60, 15, 'USD'), j('taxi', 'Remis (táxi do aeroporto)', 50, 40, 'USD')] },
  { codigo: 'AEP', nome: 'Aeroparque', cidades: ['buenos aires'], apelidos: ['jorge newbery'], jeitos: [j('corrida', 'Corrida (Uber/Cabify)', 20, 8, 'USD')] },
  { codigo: 'SCL', nome: 'Aeroporto de Santiago', cidades: ['santiago'], apelidos: ['arturo merino benitez'], jeitos: [j('onibus', 'Ônibus (Centropuerto)', 40, 2500, 'CLP'), j('taxi', 'Táxi oficial', 30, 25000, 'CLP')] },
  { codigo: 'MIA', nome: 'Aeroporto de Miami', cidades: ['miami'], apelidos: [], jeitos: [j('metro', 'Metrorail (linha laranja)', 30, 2.25, 'USD'), j('corrida', 'Corrida (Uber/Lyft)', 25, 35, 'USD')] },
  { codigo: 'MCO', nome: 'Aeroporto de Orlando', cidades: ['orlando'], apelidos: [], jeitos: [j('corrida', 'Corrida até a International Drive', 25, 35, 'USD')] },
  { codigo: 'JFK', nome: 'JFK', cidades: ['nova york', 'new york'], apelidos: ['john f kennedy', 'kennedy'], jeitos: [j('metro', 'AirTrain + metrô', 60, 11.4, 'USD'), j('taxi', 'Táxi (tarifa fixa pra Manhattan)', 60, 90, 'USD')] },
  { codigo: 'CUN', nome: 'Aeroporto de Cancún', cidades: ['cancun'], apelidos: [], jeitos: [j('onibus', 'Ônibus ADO até o centro', 30, 120, 'MXN'), j('taxi', 'Transfer até a Zona Hotelera', 30, 45, 'USD')] },
  { codigo: 'GRU', nome: 'Guarulhos', cidades: ['sao paulo'], apelidos: ['cumbica', 'aeroporto de sp'], jeitos: [j('trem', 'Trem (linha 13) + metrô', 75, 5.2, 'BRL'), j('corrida', 'Corrida (Uber/99)', 60, 130, 'BRL')] },
  { codigo: 'GIG', nome: 'Galeão', cidades: ['rio de janeiro'], apelidos: ['tom jobim', 'aeroporto do rio'], jeitos: [j('onibus', 'BRT', 60, 4.7, 'BRL'), j('corrida', 'Corrida até a Zona Sul (Uber/99)', 45, 90, 'BRL')] },
]

function normalizar(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// Acha o aeroporto num texto livre: "FCO", "Fiumicino", "Aeroporto de Roma (FCO)". Sem achar → null.
// O código só vale como palavra inteira (senão "Lisboa" acharia "LIS").
export function acharAeroporto(texto: string | null | undefined): Aeroporto | null {
  if (!texto) return null
  const n = ` ${normalizar(texto)} `
  const porCodigo = AEROPORTOS.find((a) => n.includes(` ${a.codigo.toLowerCase()} `))
  if (porCodigo) return porCodigo
  return AEROPORTOS.find((a) => [a.nome, ...a.apelidos].some((nome) => n.includes(` ${normalizar(nome)} `))) ?? null
}

// O aeroporto principal da cidade do roteiro ("Roma" → FCO). Sem cidade conhecida → null.
export function aeroportoDaCidade(cidade: string | null | undefined): Aeroporto | null {
  if (!cidade) return null
  const n = normalizar(cidade)
  return AEROPORTOS.find((a) => a.cidades.includes(n)) ?? null
}

// Quanto leva de carro entre o centro e o aeroporto (táxi ou corrida). Sem carro na tabela → o jeito mais rápido.
export function minutosDeCarro(a: Aeroporto): number {
  const carro = a.jeitos.find((x) => x.meio === 'taxi' || x.meio === 'corrida')
  return carro ? carro.minutos : Math.min(...a.jeitos.map((x) => x.minutos))
}

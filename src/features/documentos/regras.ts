// Regras de entrada pra quem viaja com passaporte BRASILEIRO, a turismo (spec 010).
//
// COMO ATUALIZAR: confira na fonte oficial, mude o texto aqui, troque o `conferidoEm`
// e abra um PR. A revisão do PR é a "pessoa que aprova" a regra antes de ir pro app.
// Pesquisa que deu origem a isto: docs/pesquisa-documentos-de-entrada.md
//
// Itens com a mesma `chave` em vários países viram um item só no checklist
// (França + Itália + Mônaco = um ETIAS só).

export type Fonte = { nome: string; url: string }

export type Regra = {
  chave: string
  titulo: string
  texto: string
  // 'tarefa' a pessoa resolve e marca; 'aviso' é só pra saber (não conta no progresso)
  tipo: 'tarefa' | 'aviso'
  // Resolver até X dias antes do início da viagem
  prazoDias: number | null
  fonte: Fonte
  conferidoEm: string
  aConfirmar?: boolean // regra anunciada mas ainda sem data ou confirmação oficial
}

export type RegrasDoPais = {
  // Documento de viagem
  documento: {
    mesesDeValidade: number // validade mínima do passaporte depois da saída (0 = durante a viagem)
    aceitaRG?: boolean // RG/CIN com menos de 10 anos serve no lugar do passaporte
    emitidoHaMenosDe10Anos?: boolean
  }
  itens: Regra[]
}

export const PAIS_DE_CASA = 'BR'
const CONFERIDO = '2026-10-18'

const FONTES = {
  itamaraty: { nome: 'Portal Consular (Itamaraty)', url: 'https://www.gov.br/mre/pt-br/assuntos/portal-consular' },
  pf: { nome: 'Polícia Federal: passaporte', url: 'https://www.gov.br/pf/pt-br/assuntos/passaporte' },
  etias: { nome: 'União Europeia: ETIAS', url: 'https://travel-europe.europa.eu/etias_en' },
  ees: { nome: 'União Europeia: EES', url: 'https://travel-europe.europa.eu/ees_en' },
  cnj: { nome: 'CNJ: Resolução 131/2011', url: 'https://atos.cnj.jus.br/atos/detalhar/3335' },
  conecteSus: { nome: 'Certificado de vacinação (gov.br)', url: 'https://www.gov.br/saude/pt-br/composicao/seidigi/conecte-sus' },
  ukEta: { nome: 'Governo do Reino Unido: ETA', url: 'https://www.gov.uk/eta' },
  eua: { nome: 'Embaixada dos EUA: vistos', url: 'https://br.usembassy.gov/pt/visas-pt/' },
  canada: { nome: 'Governo do Canadá: eTA', url: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eta.html' },
  mexico: { nome: 'Governo do México: SRE', url: 'https://www.gob.mx/sre' },
  japao: { nome: 'Governo do Japão: vistos', url: 'https://www.mofa.go.jp/j_info/visit/visa/' },
  australia: { nome: 'Governo da Austrália: vistos', url: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/visitor-600' },
} satisfies Record<string, Fonte>

// ---------- Espaço Schengen ----------

const ITENS_SCHENGEN: Regra[] = [
  {
    chave: 'etias',
    titulo: 'ETIAS (autorização de viagem da Europa)',
    texto:
      'Autorização online, cerca de €20, vale 3 anos. Prevista pra começar no fim de 2026, ainda sem data oficial. Confira se já está valendo antes da viagem.',
    tipo: 'tarefa',
    prazoDias: 30,
    fonte: FONTES.etias,
    conferidoEm: CONFERIDO,
    aConfirmar: true,
  },
  {
    chave: 'seguro-schengen',
    titulo: 'Seguro viagem com cobertura de €30 mil',
    texto: 'Cobertura médica mínima de €30 mil, valendo em todos os dias e todos os países da viagem. Pode ser pedido na imigração.',
    tipo: 'tarefa',
    prazoDias: 7,
    fonte: FONTES.itamaraty,
    conferidoEm: CONFERIDO,
  },
  {
    chave: 'comprovantes-schengen',
    titulo: 'Comprovantes pra imigração',
    texto: 'Passagem de volta, reservas de hospedagem de cada cidade e dinheiro (ou cartão) pros dias de viagem. Tenha no celular ou impresso.',
    tipo: 'tarefa',
    prazoDias: 7,
    fonte: FONTES.itamaraty,
    conferidoEm: CONFERIDO,
  },
  {
    chave: 'ees',
    titulo: 'Registro biométrico na chegada (EES)',
    texto: 'Na primeira entrada na Europa tiram foto e digitais. Não precisa pedir nada antes.',
    tipo: 'aviso',
    prazoDias: null,
    fonte: FONTES.ees,
    conferidoEm: CONFERIDO,
  },
  {
    chave: 'schengen-90-dias',
    titulo: 'Até 90 dias sem visto',
    texto: 'Turismo sem visto até 90 dias a cada 180, somando todos os países da zona Schengen.',
    tipo: 'aviso',
    prazoDias: null,
    fonte: FONTES.itamaraty,
    conferidoEm: CONFERIDO,
  },
]

const SCHENGEN: RegrasDoPais = {
  documento: { mesesDeValidade: 3, emitidoHaMenosDe10Anos: true },
  itens: ITENS_SCHENGEN,
}

export const PAISES_SCHENGEN = [
  'AT', 'BE', 'BG', 'HR', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IS', 'IT', 'LV',
  'LI', 'LT', 'LU', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'CH',
  // Não são Schengen, mas a entrada é pela zona Schengen, sem controle de fronteira
  'MC', 'SM', 'VA',
]

// ---------- Mercosul e associados (RG vale) ----------

const MERCOSUL: RegrasDoPais = {
  documento: { mesesDeValidade: 0, aceitaRG: true },
  itens: [
    {
      chave: 'conexao-mercosul',
      titulo: 'Escala fora do Mercosul exige passaporte',
      texto: 'Se o voo fizer escala num país que não aceita RG (ex.: Panamá), leve passaporte.',
      tipo: 'aviso',
      prazoDias: null,
      fonte: FONTES.itamaraty,
      conferidoEm: CONFERIDO,
    },
  ],
}

export const PAISES_MERCOSUL = ['AR', 'UY', 'PY', 'CL', 'BO', 'PE', 'EC', 'CO']

// ---------- Outros países ----------

const OUTROS: Record<string, RegrasDoPais> = {
  GB: {
    documento: { mesesDeValidade: 0 },
    itens: [
      {
        chave: 'eta-reino-unido',
        titulo: 'ETA do Reino Unido',
        texto: 'Autorização eletrônica (£20) pedida online antes de viajar. Confira no site oficial se vale pro seu passaporte.',
        tipo: 'tarefa',
        prazoDias: 14,
        fonte: FONTES.ukEta,
        conferidoEm: CONFERIDO,
        aConfirmar: true,
      },
    ],
  },
  US: {
    documento: { mesesDeValidade: 0 },
    itens: [
      {
        chave: 'visto-eua',
        titulo: 'Visto americano (B1/B2)',
        texto: 'Precisa de visto com entrevista no consulado. A fila pode levar meses: comece o quanto antes.',
        tipo: 'tarefa',
        prazoDias: 180,
        fonte: FONTES.eua,
        conferidoEm: CONFERIDO,
      },
    ],
  },
  CA: {
    documento: { mesesDeValidade: 0 },
    itens: [
      {
        chave: 'eta-canada',
        titulo: 'eTA ou visto do Canadá',
        texto: 'eTA online se já teve visto canadense nos últimos 10 anos ou tem visto americano válido. Se não, precisa de visto.',
        tipo: 'tarefa',
        prazoDias: 60,
        fonte: FONTES.canada,
        conferidoEm: CONFERIDO,
        aConfirmar: true,
      },
    ],
  },
  MX: {
    documento: { mesesDeValidade: 0 },
    itens: [
      {
        chave: 'visto-mexico',
        titulo: 'Visto do México',
        texto: 'Precisa de visto mexicano, ou de um visto válido dos EUA, Canadá, Reino Unido, Japão ou Schengen.',
        tipo: 'tarefa',
        prazoDias: 60,
        fonte: FONTES.mexico,
        conferidoEm: CONFERIDO,
        aConfirmar: true,
      },
    ],
  },
  JP: {
    documento: { mesesDeValidade: 0 },
    itens: [
      {
        chave: 'japao-isento',
        titulo: 'Japão: sem visto até 90 dias',
        texto: 'Brasileiros não precisam de visto pra turismo de até 90 dias.',
        tipo: 'aviso',
        prazoDias: null,
        fonte: FONTES.japao,
        conferidoEm: CONFERIDO,
      },
    ],
  },
  AU: {
    documento: { mesesDeValidade: 0 },
    itens: [
      {
        chave: 'visto-australia',
        titulo: 'Visto de visitante da Austrália',
        texto: 'Visto de visitante (subclass 600), pedido online.',
        tipo: 'tarefa',
        prazoDias: 60,
        fonte: FONTES.australia,
        conferidoEm: CONFERIDO,
      },
    ],
  },
}

export function regrasDoPais(codigo: string): RegrasDoPais | null {
  if (PAISES_SCHENGEN.includes(codigo)) return SCHENGEN
  if (PAISES_MERCOSUL.includes(codigo)) return MERCOSUL
  return OUTROS[codigo] ?? null
}

// ---------- Itens que valem pra qualquer viagem internacional ----------

export const FONTE_PASSAPORTE = FONTES.pf
export const FONTE_ITAMARATY = FONTES.itamaraty

export const ITENS_GERAIS: Regra[] = [
  {
    chave: 'seguro',
    titulo: 'Seguro viagem',
    texto: 'Nem todo país exige, mas o SUS não cobre o exterior e uma consulta lá fora pode sair muito cara.',
    tipo: 'tarefa',
    prazoDias: 7,
    fonte: FONTES.itamaraty,
    conferidoEm: CONFERIDO,
  },
  {
    chave: 'menores',
    titulo: 'Menor de 18 anos sem os dois pais',
    texto:
      'Se alguém com menos de 18 anos viaja sem os dois pais, precisa de autorização: em papel com firma reconhecida ou pelo e-Notariado.',
    tipo: 'aviso',
    prazoDias: null,
    fonte: FONTES.cnj,
    conferidoEm: CONFERIDO,
  },
]

// Pra país que ainda não tem regra aqui
export const ITEM_FEBRE_AMARELA: Regra = {
  chave: 'febre-amarela',
  titulo: 'Vacina de febre amarela',
  texto: 'Alguns países exigem o certificado internacional (sai pelo app Meu SUS Digital/ConecteSUS). Confira se o destino exige.',
  tipo: 'tarefa',
  prazoDias: 30,
  fonte: FONTES.conecteSus,
  conferidoEm: CONFERIDO,
}

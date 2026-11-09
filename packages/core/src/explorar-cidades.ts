// Lista inicial de cidades que o Explorar prepara com antecedência (spec 114, Decisão 2).
// Fonte: rankings de 2025/2026 (Decolar, Civitatis, Azul, Booking). Depois, todo destino criado no app entra na fila.
// `busca` = como procurar no mapa quando o nome sozinho é ambíguo.

export type CidadeDaLista = { nome: string; pais: string; busca?: string }

export const CIDADES_DO_BRASIL: CidadeDaLista[] = [
  { nome: 'Rio de Janeiro', pais: 'BR' }, { nome: 'São Paulo', pais: 'BR' }, { nome: 'Salvador', pais: 'BR' },
  { nome: 'Fortaleza', pais: 'BR' }, { nome: 'Recife', pais: 'BR' }, { nome: 'Maceió', pais: 'BR' },
  { nome: 'Natal', pais: 'BR' }, { nome: 'João Pessoa', pais: 'BR' }, { nome: 'Porto Seguro', pais: 'BR' },
  { nome: 'Florianópolis', pais: 'BR' }, { nome: 'Foz do Iguaçu', pais: 'BR' }, { nome: 'Gramado', pais: 'BR' },
  { nome: 'Canela', pais: 'BR', busca: 'Canela, Rio Grande do Sul' }, { nome: 'Belo Horizonte', pais: 'BR' },
  { nome: 'Ouro Preto', pais: 'BR' }, { nome: 'Tiradentes', pais: 'BR', busca: 'Tiradentes, Minas Gerais' },
  { nome: 'Brasília', pais: 'BR' }, { nome: 'Curitiba', pais: 'BR' }, { nome: 'Porto Alegre', pais: 'BR' },
  { nome: 'Bonito', pais: 'BR', busca: 'Bonito, Mato Grosso do Sul' }, { nome: 'Manaus', pais: 'BR' },
  { nome: 'Belém', pais: 'BR', busca: 'Belém, Pará' }, { nome: 'São Luís', pais: 'BR' },
  { nome: 'Lençóis Maranhenses', pais: 'BR', busca: 'Barreirinhas, Maranhão' }, { nome: 'Jericoacoara', pais: 'BR' },
  { nome: 'Fernando de Noronha', pais: 'BR' }, { nome: 'Porto de Galinhas', pais: 'BR' }, { nome: 'Maragogi', pais: 'BR' },
  { nome: 'Pipa', pais: 'BR', busca: 'Praia da Pipa, Tibau do Sul' }, { nome: 'Arraial do Cabo', pais: 'BR' },
  { nome: 'Búzios', pais: 'BR', busca: 'Armação dos Búzios' }, { nome: 'Paraty', pais: 'BR' },
  { nome: 'Ilha Grande', pais: 'BR', busca: 'Vila do Abraão, Angra dos Reis' }, { nome: 'Petrópolis', pais: 'BR' },
  { nome: 'Campos do Jordão', pais: 'BR' }, { nome: 'Monte Verde', pais: 'BR', busca: 'Monte Verde, Camanducaia' },
  { nome: 'Ilhabela', pais: 'BR' }, { nome: 'Ubatuba', pais: 'BR' }, { nome: 'Balneário Camboriú', pais: 'BR' },
  { nome: 'Bombinhas', pais: 'BR' }, { nome: 'Chapada dos Veadeiros', pais: 'BR', busca: 'Alto Paraíso de Goiás' },
  { nome: 'Chapada Diamantina', pais: 'BR', busca: 'Lençóis, Bahia' }, { nome: 'Pirenópolis', pais: 'BR' },
  { nome: 'Morro de São Paulo', pais: 'BR' }, { nome: 'Itacaré', pais: 'BR' }, { nome: 'Trancoso', pais: 'BR' },
  { nome: 'Caldas Novas', pais: 'BR' }, { nome: 'Olinda', pais: 'BR' }, { nome: 'Aracaju', pais: 'BR' },
  { nome: 'Vitória', pais: 'BR', busca: 'Vitória, Espírito Santo' },
]

export const CIDADES_DO_EXTERIOR: CidadeDaLista[] = [
  { nome: 'Buenos Aires', pais: 'AR' }, { nome: 'Santiago', pais: 'CL', busca: 'Santiago, Chile' },
  { nome: 'Punta Cana', pais: 'DO' }, { nome: 'Orlando', pais: 'US', busca: 'Orlando, Florida' },
  { nome: 'Miami', pais: 'US' }, { nome: 'Nova York', pais: 'US', busca: 'New York City' },
  { nome: 'Fort Lauderdale', pais: 'US' }, { nome: 'Lisboa', pais: 'PT' }, { nome: 'Porto', pais: 'PT', busca: 'Porto, Portugal' },
  { nome: 'Paris', pais: 'FR' }, { nome: 'Roma', pais: 'IT' }, { nome: 'Florença', pais: 'IT', busca: 'Firenze' },
  { nome: 'Veneza', pais: 'IT', busca: 'Venezia' }, { nome: 'Milão', pais: 'IT', busca: 'Milano' },
  { nome: 'Madri', pais: 'ES', busca: 'Madrid' }, { nome: 'Barcelona', pais: 'ES' }, { nome: 'Sevilha', pais: 'ES', busca: 'Sevilla' },
  { nome: 'Londres', pais: 'GB', busca: 'London' }, { nome: 'Edimburgo', pais: 'GB', busca: 'Edinburgh' },
  { nome: 'Amsterdã', pais: 'NL', busca: 'Amsterdam' }, { nome: 'Berlim', pais: 'DE', busca: 'Berlin' },
  { nome: 'Praga', pais: 'CZ', busca: 'Praha' }, { nome: 'Viena', pais: 'AT', busca: 'Wien' },
  { nome: 'Budapeste', pais: 'HU', busca: 'Budapest' }, { nome: 'Zurique', pais: 'CH', busca: 'Zürich' },
  { nome: 'Atenas', pais: 'GR', busca: 'Athens' }, { nome: 'Istambul', pais: 'TR', busca: 'Istanbul' },
  { nome: 'Dubai', pais: 'AE' }, { nome: 'Cancún', pais: 'MX' }, { nome: 'Cidade do México', pais: 'MX', busca: 'Ciudad de México' },
  { nome: 'Lima', pais: 'PE' }, { nome: 'Cusco', pais: 'PE' }, { nome: 'Bariloche', pais: 'AR', busca: 'San Carlos de Bariloche' },
  { nome: 'Mendoza', pais: 'AR', busca: 'Mendoza, Argentina' }, { nome: 'Montevidéu', pais: 'UY', busca: 'Montevideo' },
  { nome: 'Punta del Este', pais: 'UY' }, { nome: 'Bogotá', pais: 'CO' }, { nome: 'Cartagena', pais: 'CO', busca: 'Cartagena, Colombia' },
  { nome: 'San Andrés', pais: 'CO', busca: 'San Andrés, Colombia' }, { nome: 'Las Vegas', pais: 'US' },
  { nome: 'Los Angeles', pais: 'US' }, { nome: 'São Francisco', pais: 'US', busca: 'San Francisco' },
  { nome: 'Toronto', pais: 'CA' }, { nome: 'Tóquio', pais: 'JP', busca: 'Tokyo' }, { nome: 'Seul', pais: 'KR', busca: 'Seoul' },
  { nome: 'Bangkok', pais: 'TH' }, { nome: 'Cairo', pais: 'EG' }, { nome: 'Cidade do Cabo', pais: 'ZA', busca: 'Cape Town' },
  { nome: 'Marrakech', pais: 'MA' }, { nome: 'Nice', pais: 'FR', busca: 'Nice, France' },
]

export const CIDADES_DA_PRE_CARGA: CidadeDaLista[] = [...CIDADES_DO_BRASIL, ...CIDADES_DO_EXTERIOR]

// ---------- Ponto de partida (aeroporto, rodoviária) ----------
// Tem gente que põe o aeroporto de saída como 1º destino ("Galeão"). Não é cidade pra explorar:
// pular evita gastar um pedido de cidade nova na função `explorar-cidade`.
const PALAVRAS_DE_PARTIDA = ['aeroporto', 'airport', 'aeropuerto', 'aéroport', 'rodoviaria', 'terminal']
const AEROPORTOS_CONHECIDOS = ['galeao', 'guarulhos', 'congonhas', 'viracopos', 'confins', 'santos dumont', 'pampulha', 'salgado filho', 'afonso pena', 'jfk', 'heathrow', 'charles de gaulle', 'barajas', 'ezeiza', 'aeroparque']

const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export function ehPontoDePartida(nome: string): boolean {
  const n = semAcento(nome)
  return PALAVRAS_DE_PARTIDA.some((p) => n.includes(semAcento(p))) || AEROPORTOS_CONHECIDOS.some((a) => n === a || n.startsWith(`${a} `) || n.endsWith(` ${a}`))
}

// Destinos que dá pra explorar (sem os pontos de partida). Se só tiver partida, devolve tudo.
export function destinosParaExplorar<T extends { nome: string }>(destinos: T[]): T[] {
  const bons = destinos.filter((d) => !ehPontoDePartida(d.nome))
  return bons.length ? bons : destinos
}

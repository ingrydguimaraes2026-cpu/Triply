// Função "explorar-cidade" (spec 114): monta o catálogo de lugares de uma cidade UMA vez e guarda no banco.
// O app nunca chama Open-Meteo/Wikidata/Wikipédia/Commons direto: pede aqui, e daqui em diante lê do banco.
//
// Dois jeitos de chamar:
// 1. Pelo app (logado): POST { nome, pais?, busca? } → { situacao, cidade, lugares }
//    - cidade pronta e atualizada (90 dias): devolve na hora;
//    - cidade nova: monta agora (10 a 30 s) e devolve. Limite: 5 cidades novas por pessoa por dia.
// 2. Pela pré-carga (pg_cron, a cada 10 min): POST { precarga: true, quantos?: 3 }
//    → prepara até 3 cidades da lista e dos destinos criados no app que ainda não estão prontas
//    (só se a última foi preparada há mais de 4 min, pra ninguém abusar).
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import CURADO from './curado.json' with { type: 'json' }

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (dados: unknown, status = 200) =>
  new Response(JSON.stringify(dados), { status, headers: { 'Content-Type': 'application/json', ...cors } })

const UA = 'TripwaveExplorar/1.0 (victuribdev@gmail.com)'
const VALIDADE_DIAS = 90
const LIMITE_POR_DIA = 5
const MAX_LUGARES = 60

// ---- Cópia de packages/core/src/explorar.ts e explorar-cidades.ts. Mudou lá, muda aqui. ----
type Tipo =
  | 'museu' | 'igreja' | 'castelo' | 'palacio' | 'monumento' | 'mirante' | 'ponte' | 'praca' | 'parque' | 'jardim'
  | 'praia' | 'cachoeira' | 'lagoa' | 'duna' | 'natureza' | 'sitio_historico' | 'zoologico' | 'aquario' | 'bairro' | 'outro'
type Info = { estilos: string[]; tempoMin: number; melhorHora: string; gratis: boolean | null }
const INFO: Record<Tipo, Info> = {
  museu: { estilos: ['cultura'], tempoMin: 120, melhorHora: 'Manhã', gratis: false },
  igreja: { estilos: ['cultura', 'fotogenica'], tempoMin: 45, melhorHora: 'Manhã', gratis: true },
  castelo: { estilos: ['cultura', 'fotogenica', 'criancas'], tempoMin: 120, melhorHora: 'Manhã', gratis: false },
  palacio: { estilos: ['cultura', 'fotogenica'], tempoMin: 120, melhorHora: 'Manhã', gratis: false },
  monumento: { estilos: ['cultura', 'fotogenica'], tempoMin: 30, melhorHora: 'Qualquer hora', gratis: true },
  mirante: { estilos: ['romantica', 'fotogenica', 'ar_livre'], tempoMin: 30, melhorHora: 'Pôr do sol', gratis: true },
  ponte: { estilos: ['romantica', 'fotogenica'], tempoMin: 20, melhorHora: 'Fim da tarde', gratis: true },
  praca: { estilos: ['fotogenica', 'cultura'], tempoMin: 30, melhorHora: 'Fim da tarde', gratis: true },
  parque: { estilos: ['ar_livre', 'criancas', 'romantica'], tempoMin: 90, melhorHora: 'Tarde', gratis: true },
  jardim: { estilos: ['ar_livre', 'romantica', 'fotogenica'], tempoMin: 60, melhorHora: 'Manhã', gratis: null },
  praia: { estilos: ['ar_livre', 'romantica', 'criancas'], tempoMin: 180, melhorHora: 'Manhã', gratis: true },
  cachoeira: { estilos: ['ar_livre', 'fotogenica'], tempoMin: 120, melhorHora: 'Manhã', gratis: null },
  lagoa: { estilos: ['ar_livre', 'romantica', 'criancas'], tempoMin: 120, melhorHora: 'Tarde', gratis: true },
  duna: { estilos: ['ar_livre', 'romantica', 'fotogenica'], tempoMin: 90, melhorHora: 'Pôr do sol', gratis: true },
  natureza: { estilos: ['ar_livre', 'fotogenica'], tempoMin: 180, melhorHora: 'Manhã', gratis: null },
  sitio_historico: { estilos: ['cultura', 'fotogenica'], tempoMin: 90, melhorHora: 'Manhã', gratis: false },
  zoologico: { estilos: ['criancas', 'ar_livre'], tempoMin: 180, melhorHora: 'Manhã', gratis: false },
  aquario: { estilos: ['criancas'], tempoMin: 120, melhorHora: 'Qualquer hora', gratis: false },
  bairro: { estilos: ['fotogenica', 'romantica', 'cultura'], tempoMin: 120, melhorHora: 'Fim da tarde', gratis: true },
  outro: { estilos: [], tempoMin: 60, melhorHora: 'Qualquer hora', gratis: null },
}
const CLASSES: Record<string, Tipo> = {
  Q33506: 'museu', Q207694: 'museu',
  Q16970: 'igreja', Q2977: 'igreja', Q163687: 'igreja', Q108325: 'igreja', Q44613: 'igreja', Q32815: 'igreja', Q44539: 'igreja',
  Q23413: 'castelo', Q57821: 'castelo', Q1785071: 'castelo',
  Q16560: 'palacio',
  Q4989906: 'monumento', Q5003624: 'monumento', Q575759: 'monumento', Q12518: 'monumento', Q179700: 'monumento',
  Q6017969: 'mirante',
  Q12280: 'ponte',
  Q174782: 'praca',
  Q22698: 'parque', Q22746: 'parque', Q46169: 'natureza',
  Q1107656: 'jardim', Q167346: 'jardim',
  Q40080: 'praia',
  Q34038: 'cachoeira',
  Q23397: 'lagoa', Q187223: 'lagoa',
  Q25391: 'duna',
  Q8502: 'natureza', Q23442: 'natureza', Q39816: 'natureza', Q35509: 'natureza',
  Q839954: 'sitio_historico', Q1081138: 'sitio_historico', Q9259: 'sitio_historico',
  Q43501: 'zoologico',
  Q2281788: 'aquario',
  Q570116: 'outro',
}
const simplificar = (t: string) =>
  t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const chaveDaCidade = (nome: string, pais: string | null) => `${simplificar(nome)}|${(pais ?? '').toLowerCase()}`
const LISTA: { nome: string; pais: string; busca?: string }[] = [
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
// ---- fim da cópia ----

type Admin = ReturnType<typeof createClient<any>>
type LugarNovo = Record<string, unknown> & { nome: string; latitude: number; longitude: number; wikidata: string | null }

async function buscarJson(url: string, ms = 20000, init: RequestInit = {}) {
  const r = await fetch(url, { ...init, headers: { 'User-Agent': UA, Accept: 'application/json', ...(init.headers ?? {}) }, signal: AbortSignal.timeout(ms) })
  if (!r.ok) throw new Error(`${r.status} em ${url.slice(0, 60)}`)
  return r.json()
}

const sparqlUrl = (q: string) => 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(q)
const qidDe = (uri: string) => uri.split('/').pop()!
async function sparql(q: string, ms = 40000) {
  const d = await buscarJson(sparqlUrl(q), ms, { headers: { Accept: 'application/sparql-results+json' } })
  return d.results.bindings as Record<string, { value: string }>[]
}

// 1. Onde fica. O Nominatim bloqueia chamadas vindas do Supabase (403, teste de 02/11), então:
//    - cidade: geocodificação do Open-Meteo (GeoNames, grátis, sem chave; a mesma do clima);
//      "Lençóis, Bahia": o que vem depois da vírgula desempata pelo estado/país;
//    - região (Toscana, Algarve): o Open-Meteo só tem cidades, então busca o item na Wikidata.
type Geo = { latitude: number; longitude: number; regiao: boolean; raio: number; wikidata: string | null; pais: string | null }
async function geocodar(busca: string, pais: string | null): Promise<Geo> {
  const [nome, dica] = busca.split(',').map((x) => x.trim())
  const p = new URLSearchParams({ name: nome, count: '10', language: 'pt', format: 'json' })
  if (pais) p.set('countryCode', pais)
  const d = await buscarJson(`https://geocoding-api.open-meteo.com/v1/search?${p}`, 10000).catch(() => ({}))
  const cidades = ((d as { results?: any[] }).results ?? []).filter((r) => /^PPL/.test(r.feature_code ?? ''))
  const dicaS = dica ? simplificar(dica) : ''
  const r = (dicaS && cidades.find((x) => [x.admin1, x.admin2, x.country].some((a) => a && simplificar(a).includes(dicaS)))) || cidades[0]
  if (r) {
    return {
      latitude: r.latitude,
      longitude: r.longitude,
      regiao: false,
      raio: (r.population ?? 0) > 1500000 ? 5 : 4,
      wikidata: null,
      pais: typeof r.country_code === 'string' ? r.country_code.toUpperCase() : pais,
    }
  }
  const busq = new URLSearchParams({ action: 'wbsearchentities', format: 'json', language: 'pt', uselang: 'pt', type: 'item', limit: '1', search: nome })
  const s = await buscarJson(`https://www.wikidata.org/w/api.php?${busq}`, 10000)
  const qid: string | undefined = s.search?.[0]?.id
  if (!qid || !/^Q\d+$/.test(qid)) throw new Error('Cidade não encontrada no mapa')
  const b = await sparql(`SELECT ?coord ?iso WHERE { wd:${qid} wdt:P625 ?coord . OPTIONAL { wd:${qid} wdt:P17 ?p . ?p wdt:P297 ?iso } } LIMIT 1`, 15000)
  const m = /Point\(([-\d.]+) ([-\d.]+)\)/.exec(b[0]?.coord?.value ?? '')
  if (!m) throw new Error('Região sem coordenada na Wikidata')
  return { latitude: Number(m[2]), longitude: Number(m[1]), regiao: true, raio: 40, wikidata: qid, pais: b[0]?.iso?.value ?? pais }
}

// 2. Wikidata, em 3 consultas leves (a consulta única estourava o tempo em Paris e na Toscana, teste de 02/11):
//    a) os mais famosos da área, com os tipos (P31) de cada um;
//    b) tipos que não estão na nossa lista: pergunta de quais classes eles são subclasse (1 nível);
//    c) detalhes (foto, descrição, Wikipédia, onde fica) só dos que ficaram.

async function lugaresDaWikidata(lat: number, lon: number, raioKm: number, regiaoQid: string | null) {
  // Região (Toscana): o que "fica dentro" dela na Wikidata, só os bem conhecidos (o círculo de 80 km pesava e
  // pegava pedaço de outras regiões). Cidade: o círculo em volta do centro.
  const area = regiaoQid && /^Q\d+$/.test(regiaoQid)
    ? `?item wdt:P131/wdt:P131* wd:${regiaoQid} . ?item wdt:P625 ?c . ?item wikibase:sitelinks ?sl . FILTER(?sl >= 8)`
    : `SERVICE wikibase:around { ?item wdt:P625 ?c . bd:serviceParam wikibase:center "Point(${lon} ${lat})"^^geo:wktLiteral . bd:serviceParam wikibase:radius "${raioKm}" . }
  ?item wikibase:sitelinks ?sl . FILTER(?sl >= 3)`
  const a = await sparql(`SELECT ?item ?sl (SAMPLE(?c) AS ?coord) (GROUP_CONCAT(DISTINCT ?t; separator=" ") AS ?tipos) WHERE {
  ${area}
  ?item wdt:P31 ?t .
  FILTER NOT EXISTS { ?item wdt:P576 ?demolido }
  FILTER NOT EXISTS { ?item wdt:P195 ?acervo }
} GROUP BY ?item ?sl ORDER BY DESC(?sl) LIMIT 300`)

  const candidatos = a.map((b) => ({
    qid: qidDe(b.item.value),
    fama: Number(b.sl.value),
    coord: b.coord.value,
    tipos: b.tipos.value.split(' ').map(qidDe),
  }))

  // b) Tipos desconhecidos → sobe 1 nível (subclasse de) e vê se cai na nossa lista
  const desconhecidos = [...new Set(candidatos.flatMap((c) => c.tipos).filter((t) => !CLASSES[t]))].slice(0, 300)
  const mapaTipo: Record<string, Tipo> = { ...CLASSES }
  if (desconhecidos.length) {
    const b = await sparql(`SELECT ?t ?pai WHERE { VALUES ?t { ${desconhecidos.map((t) => 'wd:' + t).join(' ')} } ?t wdt:P279 ?pai . }`, 25000).catch(() => [])
    for (const r of b) {
      const t = qidDe(r.t.value)
      const pai = CLASSES[qidDe(r.pai.value)]
      if (pai && (!mapaTipo[t] || mapaTipo[t] === 'outro')) mapaTipo[t] = pai
    }
  }

  const escolhidos = candidatos
    .map((c) => {
      const tipos = c.tipos.map((t) => mapaTipo[t]).filter(Boolean) as Tipo[]
      // Prefere um tipo específico a "outro" (atração turística genérica)
      const tipo = tipos.find((t) => t !== 'outro') ?? tipos[0]
      return tipo ? { ...c, tipo } : null
    })
    .filter((c): c is NonNullable<typeof c> => !!c)
    .slice(0, MAX_LUGARES)
  if (!escolhidos.length) return []

  // c) Detalhes só dos escolhidos
  const c = await sparql(`SELECT ?item ?nome (SAMPLE(?img0) AS ?img) (SAMPLE(?desc0) AS ?desc) (SAMPLE(?pt0) AS ?ptwiki)
  (SAMPLE(?en0) AS ?enwiki) (SAMPLE(?onde0) AS ?ondeNome) WHERE {
  VALUES ?item { ${escolhidos.map((e) => 'wd:' + e.qid).join(' ')} }
  OPTIONAL { ?item wdt:P18 ?img0 }
  OPTIONAL { ?item schema:description ?desc0 FILTER(lang(?desc0) = "pt") }
  OPTIONAL { ?pt0 schema:about ?item ; schema:isPartOf <https://pt.wikipedia.org/> }
  OPTIONAL { ?en0 schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> }
  OPTIONAL { ?item wdt:P131 ?onde . ?onde rdfs:label ?onde0 FILTER(lang(?onde0) = "pt") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "pt,pt-br,en". ?item rdfs:label ?nome . }
} GROUP BY ?item ?nome`, 30000)
  const detalhes = new Map(c.map((r) => [qidDe(r.item.value), r]))

  const lugares: (LugarNovo & { _img?: string; _wiki?: string })[] = []
  for (const e of escolhidos) {
    const d = detalhes.get(e.qid)
    const nome = d?.nome?.value ?? ''
    if (!nome || /^Q\d+$/.test(nome)) continue // sem nome em pt/en
    const m = /Point\(([-\d.]+) ([-\d.]+)\)/.exec(e.coord)
    if (!m) continue
    const info = INFO[e.tipo]
    lugares.push({
      wikidata: e.qid,
      nome: nome.slice(0, 120),
      bairro: d?.ondeNome?.value?.slice(0, 120) ?? null,
      tipo: e.tipo,
      estilos: info.estilos,
      fama: e.fama,
      latitude: Number(m[2]),
      longitude: Number(m[1]),
      por_que: d?.desc?.value ? primeiraLetraMaiuscula(d.desc.value).slice(0, 200) : null,
      tempo_min: info.tempoMin,
      gratis: info.gratis,
      melhor_hora: info.melhorHora,
      fonte: 'wikidata',
      _img: d?.img?.value,
      _wiki: d?.ptwiki?.value ?? d?.enwiki?.value,
    })
  }
  return lugares
}

const primeiraLetraMaiuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

// 3. Wikipédia: primeiro parágrafo vira "sobre"; a primeira frase curta vira "por que ir" (se a Wikidata não deu)
async function completarComWikipedia(lugares: (LugarNovo & { _wiki?: string })[]) {
  const comLink = lugares.filter((l) => l._wiki).slice(0, 40)
  for (let i = 0; i < comLink.length; i += 6) {
    await Promise.all(
      comLink.slice(i, i + 6).map(async (l) => {
        const m = /^https:\/\/(pt|en)\.wikipedia\.org\/wiki\/(.+)$/.exec(l._wiki!)
        if (!m) return
        l.link_wikipedia = l._wiki
        try {
          const s = await buscarJson(`https://${m[1]}.wikipedia.org/api/rest_v1/page/summary/${m[2]}`, 10000)
          const texto: string = (s.extract ?? '').replace(/\s+/g, ' ').trim()
          if (!texto) return
          l.sobre = texto.slice(0, 600)
          if (m[1] === 'pt' && !l.por_que) {
            const frase = texto.split(/(?<=\.)\s/)[0]
            if (frase.length <= 200) l.por_que = frase
          }
        } catch { /* sem resumo: segue */ }
      }),
    )
  }
}

// 4. Fotos do Commons: miniatura de 960 px (tamanho padrão) + autor e licença pro crédito
async function completarComFotos(lugares: (LugarNovo & { _img?: string })[]) {
  const comFoto = lugares.filter((l) => l._img)
  for (let i = 0; i < comFoto.length; i += 40) {
    const lote = comFoto.slice(i, i + 40)
    const nomes = lote.map((l) => 'File:' + decodeURIComponent(l._img!.split('/').pop()!))
    const p = new URLSearchParams({
      action: 'query', format: 'json', formatversion: '2', prop: 'imageinfo',
      iiprop: 'url|extmetadata', iiurlwidth: '960', iiextmetadatafilter: 'Artist|LicenseShortName', titles: nomes.join('|'),
    })
    try {
      const d = await buscarJson(`https://commons.wikimedia.org/w/api.php?${p}`, 20000)
      const porNome = new Map<string, any>()
      for (const pg of d.query?.pages ?? []) porNome.set(pg.title, pg.imageinfo?.[0])
      for (const n of d.query?.normalized ?? []) porNome.set(n.from, porNome.get(n.to))
      lote.forEach((l, k) => aplicarFoto(l, porNome.get(nomes[k])))
    } catch { /* sem fotos desse lote */ }
  }
  // Sem foto na Wikidata: a foto mais perto no Commons (até 300 m), só pros primeiros
  for (const l of lugares.filter((x) => !x.foto_url).slice(0, 25)) {
    await fotoPorPerto(l)
  }
}

function aplicarFoto(l: Record<string, unknown>, info: any) {
  if (!info?.thumburl) return
  l.foto_url = info.thumburl
  l.foto_pagina = info.descriptionurl ?? null
  const autor = String(info.extmetadata?.Artist?.value ?? '').replace(/<[^>]*>/g, '').trim()
  l.foto_autor = autor ? autor.slice(0, 200) : null
  l.foto_licenca = info.extmetadata?.LicenseShortName?.value?.slice(0, 60) ?? null
}

async function fotoPorPerto(l: LugarNovo) {
  const p = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', generator: 'geosearch', ggsnamespace: '6',
    // Natureza (base curada) fica longe de tudo: raio maior
    ggscoord: `${l.latitude}|${l.longitude}`, ggsradius: l.fonte === 'curado' ? '1000' : '300', ggslimit: '5',
    prop: 'imageinfo', iiprop: 'url|extmetadata', iiurlwidth: '960', iiextmetadatafilter: 'Artist|LicenseShortName',
  })
  try {
    const d = await buscarJson(`https://commons.wikimedia.org/w/api.php?${p}`, 10000)
    const palavras = simplificar(l.nome).split(' ').filter((w) => w.length > 3)
    const fotos = (d.query?.pages ?? [])
      .filter((pg: any) => pg.imageinfo?.[0]?.thumburl && /\.(jpe?g|png|webp)(\?|$)/i.test(pg.imageinfo[0].url ?? ''))
      .map((pg: any) => ({ info: pg.imageinfo[0], acerto: palavras.filter((w) => simplificar(pg.title).includes(w)).length }))
      .sort((a: any, b: any) => b.acerto - a.acerto)
    aplicarFoto(l, fotos[0]?.info)
  } catch { /* fica sem foto */ }
}

// Monta a cidade inteira e grava. Devolve a cidade pronta.
async function prepararCidade(admin: Admin, nome: string, paisPedido: string | null, busca: string) {
  const g = await geocodar(busca, paisPedido)
  // Sem país no pedido (destino antigo só com o nome do país): usa o país que o mapa devolveu
  const pais = paisPedido ?? g.pais
  const chave = chaveDaCidade(nome, pais)
  const { data: jaTem } = await admin.from('catalogo_cidades').select('*').eq('chave', chave).maybeSingle()
  if (jaTem && fresca(jaTem)) return { ...jaTem, novo: false }
  const raio = g.raio
  const { data: cidade, error } = await admin
    .from('catalogo_cidades')
    .upsert(
      { chave, nome, pais, latitude: g.latitude, longitude: g.longitude, raio_km: raio, regiao: g.regiao, situacao: 'preparando' },
      { onConflict: 'chave' },
    )
    .select()
    .single()
  if (error) throw error

  try {
    let lugares: (LugarNovo & { _img?: string; _wiki?: string })[] = await lugaresDaWikidata(g.latitude, g.longitude, raio, g.regiao ? g.wikidata : null)
    // Região que não é divisão oficial (Costa Amalfitana): quase nada "fica dentro" dela. Usa um círculo de 25 km.
    if (g.regiao && lugares.length < 5) lugares = await lugaresDaWikidata(g.latitude, g.longitude, 25, null)
    // Base curada entra na frente (fama alta) e sem duplicar pelo nome
    const curados = ((CURADO as unknown as Record<string, unknown>)[chave] ?? []) as any[]
    const nomes = new Set(lugares.map((l) => simplificar(l.nome)))
    curados.forEach((c, i) => {
      if (nomes.has(simplificar(c.nome))) return
      const info = INFO[c.tipo as Tipo] ?? INFO.outro
      lugares.push({ ...c, wikidata: null, estilos: info.estilos, fama: 1000 - i, fonte: 'curado' })
    })
    // Curados na frente, pra entrar na busca de foto por perto (que só olha os primeiros)
    lugares.sort((a, b) => Number(b.fama) - Number(a.fama))
    await completarComWikipedia(lugares)
    await completarComFotos(lugares)

    const linhas = lugares.map(({ _img, _wiki, ...l }) => ({ ...l, cidade_id: cidade.id }))
    // Recomeça os lugares da cidade (as escolhas antigas apontam pra lugares que podem mudar: mantém pelo wikidata)
    const comQid = linhas.filter((l) => l.wikidata)
    const semQid = linhas.filter((l) => !l.wikidata)
    if (comQid.length) {
      const { error: e1 } = await admin.from('catalogo_lugares').upsert(comQid, { onConflict: 'cidade_id,wikidata' })
      if (e1) throw e1
    }
    if (semQid.length) {
      await admin.from('catalogo_lugares').delete().eq('cidade_id', cidade.id).is('wikidata', null)
      const { error: e2 } = await admin.from('catalogo_lugares').insert(semQid)
      if (e2) throw e2
    }
    await admin.from('catalogo_cidades').update({ situacao: 'pronta', atualizado_em: new Date().toISOString() }).eq('id', cidade.id)
    return { ...cidade, situacao: 'pronta', novo: true }
  } catch (e) {
    await admin.from('catalogo_cidades').update({ situacao: 'erro' }).eq('id', cidade.id)
    throw e
  }
}

const fresca = (c: { situacao: string; atualizado_em: string | null }) =>
  c.situacao === 'pronta' && !!c.atualizado_em && Date.now() - Date.parse(c.atualizado_em) < VALIDADE_DIAS * 86400000

async function lugaresDaCidade(admin: Admin, cidadeId: string) {
  const { data } = await admin.from('catalogo_lugares').select('*').eq('cidade_id', cidadeId).order('fama', { ascending: false }).limit(MAX_LUGARES + 20)
  return data ?? []
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  const chaveServico = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, chaveServico)
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  const corpo = await req.json().catch(() => ({}))

  // ---- Pré-carga (pg_cron) ----
  if (corpo?.precarga === true) {
    // O agendamento chama com a chave pública (igual às outras funções agendadas). Pra ninguém abusar,
    // a pré-carga só roda se a última cidade foi preparada há mais de 4 minutos (a chave de serviço pula a trava).
    if (token !== chaveServico) {
      const { data: ultima } = await admin.from('catalogo_cidades').select('atualizado_em').not('atualizado_em', 'is', null).order('atualizado_em', { ascending: false }).limit(1).maybeSingle()
      if (ultima?.atualizado_em && Date.now() - Date.parse(ultima.atualizado_em) < 4 * 60000) return json({ feitas: [], pulou: 'cedo demais' })
    }
    const quantos = Math.min(3, Math.max(1, Number(corpo.quantos) || 3))
    const { data: prontas } = await admin.from('catalogo_cidades').select('chave, situacao, atualizado_em')
    const ok = new Set((prontas ?? []).filter(fresca).map((c) => c.chave))
    // Destino do app vem sem código de país: pula se já tem cidade pronta com esse nome
    const nomesProntos = new Set([...ok].map((k) => k.split('|')[0]))
    // Destinos criados no app também entram (Decisão 2)
    const { data: destinos } = await admin.from('destinos').select('nome, pais').limit(2000)
    const fila = [
      ...LISTA,
      ...(destinos ?? []).map((d: { nome: string; pais: string | null }) => ({ nome: d.nome, pais: '', busca: [d.nome, d.pais].filter(Boolean).join(', ') })),
    ]
    let tentativas = 0
    const feitas: string[] = []
    const vistas = new Set<string>()
    for (const c of fila) {
      const chave = chaveDaCidade(c.nome, c.pais || null)
      if (feitas.length >= quantos || tentativas >= 10) break
      if (ok.has(chave) || vistas.has(chave) || (!c.pais && nomesProntos.has(chave.split('|')[0]))) continue
      vistas.add(chave)
      tentativas++
      try {
        const r = await prepararCidade(admin, c.nome, c.pais || null, c.busca ?? c.nome)
        if (r.novo) feitas.push(c.nome)
      } catch (e) {
        console.error('pré-carga', c.nome, String(e))
      }
      await new Promise((r) => setTimeout(r, 1500))
    }
    return json({ feitas })
  }

  // ---- Pedido do app ----
  const { data: quem } = await admin.auth.getUser(token)
  if (!quem?.user) return json({ erro: 'Faça login.' }, 401)
  const nome = typeof corpo?.nome === 'string' ? corpo.nome.trim().slice(0, 120) : ''
  const pais = typeof corpo?.pais === 'string' && /^[A-Za-z]{2}$/.test(corpo.pais) ? corpo.pais.toUpperCase() : null
  const busca = typeof corpo?.busca === 'string' && corpo.busca.trim() ? corpo.busca.trim().slice(0, 160) : nome
  if (!nome) return json({ erro: 'Diga a cidade.' }, 400)

  const chave = chaveDaCidade(nome, pais)
  const { data: existente } = await admin.from('catalogo_cidades').select('*').eq('chave', chave).maybeSingle()
  if (existente && fresca(existente)) {
    return json({ situacao: 'pronta', cidade: existente, lugares: await lugaresDaCidade(admin, existente.id) })
  }
  // Alguém já está preparando agora (há menos de 2 minutos): o app espera e pergunta de novo
  if (existente?.situacao === 'preparando' && Date.now() - Date.parse(existente.criado_em) < 120000) {
    return json({ situacao: 'preparando', cidade: existente, lugares: [] })
  }

  const ontem = new Date(Date.now() - 86400000).toISOString()
  const { count } = await admin.from('catalogo_pedidos').select('id', { count: 'exact', head: true }).eq('usuario_id', quem.user.id).gte('criado_em', ontem)
  if ((count ?? 0) >= LIMITE_POR_DIA) {
    return json({ erro: 'Você já pediu 5 cidades novas hoje. Tente amanhã.' }, 429)
  }

  try {
    const cidade = await prepararCidade(admin, nome, pais, busca)
    if (cidade.novo) await admin.from('catalogo_pedidos').insert({ usuario_id: quem.user.id, cidade_id: cidade.id })
    return json({ situacao: 'pronta', cidade, lugares: await lugaresDaCidade(admin, cidade.id) })
  } catch (e) {
    console.error('explorar-cidade', nome, String(e))
    return json({ erro: 'Não deu pra carregar os lugares agora. Tente de novo em alguns minutos.' }, 502)
  }
})

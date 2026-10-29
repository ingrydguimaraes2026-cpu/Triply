// Clima por dia do roteiro (roadmap #8). Dados do Open-Meteo: grátis, sem chave, funciona direto do navegador e do app.
// - Dias dentro dos próximos ~16 dias: previsão de verdade.
// - Dias mais longe: estimativa pelo mesmo período do ano passado (média histórica serve de palpite).
// A parte que decide quais dias são previsão e quais são estimativa é pura (sem internet), e tem teste.

// Quantos dias à frente o Open-Meteo dá previsão de verdade (hoje + 15 = 16 dias no total).
const DIAS_DE_PREVISAO = 15

export type TipoDePrevisao = 'previsao' | 'estimativa'

export type PrevisaoDia = {
  data: string // "2026-11-12", a data real do roteiro
  tempMax: number | null // °C
  tempMin: number | null // °C
  chuvaMm: number | null // milímetros de chuva no dia
  codigo: number // código de tempo da WMO (0 = céu limpo)
  tipo: TipoDePrevisao
}

export type TempoInfo = { rotulo: string; emoji: string }

// Código de tempo da WMO → um rótulo curto em português e um emoji.
// Tabela: https://open-meteo.com/en/docs (WMO Weather interpretation codes)
export function interpretarTempo(codigo: number): TempoInfo {
  if (codigo <= 0) return { rotulo: 'Céu limpo', emoji: '☀️' }
  if (codigo === 1) return { rotulo: 'Quase limpo', emoji: '🌤️' }
  if (codigo === 2) return { rotulo: 'Parcial nublado', emoji: '⛅' }
  if (codigo === 3) return { rotulo: 'Nublado', emoji: '☁️' }
  if (codigo === 45 || codigo === 48) return { rotulo: 'Névoa', emoji: '🌫️' }
  if (codigo >= 51 && codigo <= 57) return { rotulo: 'Garoa', emoji: '🌦️' }
  if (codigo >= 61 && codigo <= 67) return { rotulo: 'Chuva', emoji: '🌧️' }
  if (codigo >= 71 && codigo <= 77) return { rotulo: 'Neve', emoji: '🌨️' }
  if (codigo >= 80 && codigo <= 82) return { rotulo: 'Pancadas de chuva', emoji: '🌦️' }
  if (codigo === 85 || codigo === 86) return { rotulo: 'Pancadas de neve', emoji: '🌨️' }
  if (codigo >= 95) return { rotulo: 'Trovoada', emoji: '⛈️' }
  return { rotulo: 'Tempo variável', emoji: '🌥️' }
}

// "2026-11-12" → nº de dias desde 1970 (sem fuso). Mesmo truque do datas.ts.
function diaNum(data: string): number {
  const [a, m, d] = data.split('-').map(Number)
  return Date.UTC(a, m - 1, d) / 86_400_000
}

// nº de dias desde 1970 → "2026-11-12"
function numData(n: number): string {
  return new Date(n * 86_400_000).toISOString().slice(0, 10)
}

// Mesma data um ano antes ("2026-11-12" → "2025-11-12"), pra buscar o histórico.
function anoAnterior(data: string): string {
  const [a, m, d] = data.split('-')
  return `${Number(a) - 1}-${m}-${d}`
}

export type JanelaDeClima = {
  // Intervalo de dias que têm previsão de verdade (dentro dos próximos ~16 dias), ou null.
  previsao: { inicio: string; fim: string } | null
  // Intervalo de dias longe demais pra previsão: estimativa pelo ano passado, ou null.
  estimativa: { inicio: string; fim: string } | null
  // Todos os dias do roteiro que valem a pena mostrar (de hoje em diante), em ordem.
  dias: string[]
}

/**
 * Decide, SEM internet, quais dias do roteiro são previsão e quais são estimativa.
 * - Dias no passado (antes de hoje) são ignorados: clima é pra frente.
 * - De hoje até hoje+15: previsão de verdade.
 * - Depois disso: estimativa pelo mesmo período do ano passado.
 * Roteiro sem as duas datas, ou todo no passado → dias vazio e os dois intervalos null.
 */
export function janelaDeClima(inicio: string, fim: string, hoje: string): JanelaDeClima {
  const vazio: JanelaDeClima = { previsao: null, estimativa: null, dias: [] }
  if (!inicio || !fim) return vazio
  const ini = Math.max(diaNum(inicio), diaNum(hoje)) // não mostra dias que já passaram
  const fimN = diaNum(fim)
  if (fimN < ini) return vazio

  const limitePrevisao = diaNum(hoje) + DIAS_DE_PREVISAO
  const dias: string[] = []
  for (let n = ini; n <= fimN; n++) dias.push(numData(n))

  const diasPrevisao = dias.filter((d) => diaNum(d) <= limitePrevisao)
  const diasEstimativa = dias.filter((d) => diaNum(d) > limitePrevisao)

  return {
    previsao: diasPrevisao.length ? { inicio: diasPrevisao[0], fim: diasPrevisao.at(-1)! } : null,
    estimativa: diasEstimativa.length ? { inicio: diasEstimativa[0], fim: diasEstimativa.at(-1)! } : null,
    dias,
  }
}

// ---------- Busca no Open-Meteo (com cache em memória por 3 horas) ----------

type RespostaOpenMeteo = {
  daily?: {
    time?: string[]
    weather_code?: number[]
    temperature_2m_max?: number[]
    temperature_2m_min?: number[]
    precipitation_sum?: number[]
  }
}

const TRES_HORAS = 3 * 60 * 60 * 1000
const memoria = new Map<string, { quando: number; dias: PrevisaoDia[] }>()

const PARAMS_DIARIOS = 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum'

async function buscarIntervalo(
  base: string,
  lat: number,
  lon: number,
  inicio: string,
  fim: string,
  tipo: TipoDePrevisao,
  deslocarAno: boolean, // estimativa vem do ano passado; devolvemos a data do roteiro
): Promise<PrevisaoDia[]> {
  const url =
    `${base}?latitude=${lat}&longitude=${lon}&daily=${PARAMS_DIARIOS}` +
    `&timezone=auto&start_date=${inicio}&end_date=${fim}`
  const resposta = await fetch(url)
  if (!resposta.ok) throw new Error(`Open-Meteo respondeu ${resposta.status}`)
  const dados: RespostaOpenMeteo = await resposta.json()
  const d = dados.daily
  if (!d?.time) return []
  return d.time.map((data, i) => ({
    // Na estimativa, a API devolve a data do ano passado; mostramos a data real do roteiro (+1 ano).
    data: deslocarAno ? `${Number(data.slice(0, 4)) + 1}${data.slice(4)}` : data,
    tempMax: d.temperature_2m_max?.[i] ?? null,
    tempMin: d.temperature_2m_min?.[i] ?? null,
    chuvaMm: d.precipitation_sum?.[i] ?? null,
    codigo: d.weather_code?.[i] ?? 0,
    tipo,
  }))
}

/**
 * Clima dia a dia de um destino, do dia de hoje até o fim do período.
 * Junta previsão (próximos ~16 dias) e estimativa (ano passado) num resultado só, em ordem de data.
 * Sem coordenadas, sem datas ou com o período todo no passado → lista vazia.
 * Sem internet / API fora do ar → erro (a tela mostra "tentar de novo").
 */
export async function buscarClima(
  latitude: number | null,
  longitude: number | null,
  inicio: string | null,
  fim: string | null,
  hoje: string,
): Promise<PrevisaoDia[]> {
  if (latitude == null || longitude == null || !inicio || !fim) return []
  const janela = janelaDeClima(inicio, fim, hoje)
  if (janela.dias.length === 0) return []

  const chave = `${latitude.toFixed(3)},${longitude.toFixed(3)}:${janela.dias[0]}..${janela.dias.at(-1)}`
  const guardado = memoria.get(chave)
  if (guardado && Date.now() - guardado.quando < TRES_HORAS) return guardado.dias

  const buscas: Promise<PrevisaoDia[]>[] = []
  if (janela.previsao) {
    buscas.push(
      buscarIntervalo('https://api.open-meteo.com/v1/forecast', latitude, longitude, janela.previsao.inicio, janela.previsao.fim, 'previsao', false),
    )
  }
  if (janela.estimativa) {
    buscas.push(
      buscarIntervalo(
        'https://archive-api.open-meteo.com/v1/archive',
        latitude,
        longitude,
        anoAnterior(janela.estimativa.inicio),
        anoAnterior(janela.estimativa.fim),
        'estimativa',
        true,
      ),
    )
  }

  const partes = await Promise.all(buscas)
  const dias = partes.flat().sort((a, b) => a.data.localeCompare(b.data))
  memoria.set(chave, { quando: Date.now(), dias })
  return dias
}

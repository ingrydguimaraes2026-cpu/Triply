// Retrospectiva da viagem (spec 105, K7): os cartões "estilo story" do fim da viagem.
// Puro, pra dar pra testar. Os números vêm das outras partes (estatísticas, financeiro, fotos).

export type CartaoDaRetrospectiva = { chave: string; numero: string; titulo: string; legenda: string }

const n = (v: number) => v.toLocaleString('pt-BR')

export function cartoesDaRetrospectiva(d: {
  nome: string
  dias: number
  km: number
  cidades: string[]
  paises: string[] // nomes
  gastoTotal: number | null // centavos, moeda da viagem (só o que é do comboio)
  dinheiro: (centavos: number) => string // formatador da moeda da viagem
  pessoas: number
  posts: number
  fotos: number
  curtidas: number
  lugaresVisitados: number
  carimbados?: string[] // spec 118c: nomes dos lugares carimbados, na ordem em que caíram
}): CartaoDaRetrospectiva[] {
  const cartoes: CartaoDaRetrospectiva[] = []
  if (d.dias > 0) cartoes.push({ chave: 'dias', numero: n(d.dias), titulo: d.dias === 1 ? 'dia de viagem' : 'dias de viagem', legenda: d.nome })
  const doCarimbo = cartaoDosCarimbos(d.carimbados ?? [])
  if (doCarimbo) cartoes.push(doCarimbo)
  if (d.cidades.length > 0)
    cartoes.push({
      chave: 'cidades',
      numero: n(d.cidades.length),
      titulo: d.cidades.length === 1 ? 'cidade' : 'cidades',
      legenda: d.cidades.slice(0, 6).join(' → ') + (d.cidades.length > 6 ? '…' : ''),
    })
  if (d.km >= 10)
    cartoes.push({
      chave: 'km',
      numero: n(d.km),
      titulo: 'km entre cidades',
      legenda: d.paises.length > 1 ? `passando por ${d.paises.join(', ')}` : d.paises[0] ? `em ${d.paises[0]}` : 'em linha reta, no mapa',
    })
  if (d.gastoTotal && d.gastoTotal > 0 && d.pessoas > 0)
    cartoes.push({
      chave: 'gasto',
      numero: d.dinheiro(Math.round(d.gastoTotal / d.pessoas)),
      titulo: 'por pessoa',
      legenda: `${d.dinheiro(d.gastoTotal)} no total do comboio (${d.pessoas} ${d.pessoas === 1 ? 'pessoa' : 'pessoas'})`,
    })
  if (d.fotos > 0)
    cartoes.push({
      chave: 'fotos',
      numero: n(d.fotos),
      titulo: d.fotos === 1 ? 'foto' : 'fotos',
      legenda: `${n(d.posts)} ${d.posts === 1 ? 'post' : 'posts'} · ${n(d.curtidas)} ${d.curtidas === 1 ? 'curtida' : 'curtidas'}`,
    })
  if (d.lugaresVisitados > 0)
    cartoes.push({ chave: 'lugares', numero: n(d.lugaresVisitados), titulo: d.lugaresVisitados === 1 ? 'lugar riscado da lista' : 'lugares riscados da lista', legenda: 'marcados como "já fomos"' })
  return cartoes
}

// ---- Spec 118c: retrospectiva que monta sozinha -----------------------------------------------

// Cartão dos carimbos da viagem (o passaporte da galera). Fica logo depois dos dias.
export function cartaoDosCarimbos(carimbados: string[]): CartaoDaRetrospectiva | null {
  if (carimbados.length === 0) return null
  return {
    chave: 'carimbos',
    numero: n(carimbados.length),
    titulo: carimbados.length === 1 ? 'lugar carimbado' : 'lugares carimbados',
    legenda: carimbados.slice(0, 5).join(' · ') + (carimbados.length > 5 ? '…' : ''),
  }
}

// A viagem acabou (o dia de hoje já passou do último dia): a retrospectiva está pronta
export function retrospectivaPronta(dataFim: string | null, hoje: string): boolean {
  return !!dataFim && dataFim < hoje
}

// ---- Moldura por data ----
// Réveillon (passa por 31/12) > Carnaval > São João > feriado prolongado > padrão.
// As cores são da paleta (global.css / theme.ts): fundo do cartão, destaque (número) e texto claro.
export type ChaveDaMoldura = 'reveillon' | 'carnaval' | 'sao-joao' | 'feriado' | 'padrao'
export type Moldura = {
  chave: ChaveDaMoldura
  titulo: string | null // "Réveillon 2027" (null na padrão)
  icone: 'festa' | 'bandeira' | 'sol' | 'lugar'
  fundo: string
  destaque: string
  texto: string
}

const CORES_DA_MOLDURA: Record<ChaveDaMoldura, Pick<Moldura, 'fundo' | 'destaque' | 'texto' | 'icone'>> = {
  reveillon: { fundo: '#3B2715', destaque: '#E3A04A', texto: '#F5E9D6', icone: 'festa' },
  carnaval: { fundo: '#B97A22', destaque: '#FBF3E6', texto: '#F5E9D6', icone: 'festa' },
  'sao-joao': { fundo: '#5E6B2E', destaque: '#E3A04A', texto: '#F5E9D6', icone: 'bandeira' },
  feriado: { fundo: '#4A2E14', destaque: '#E3A04A', texto: '#F5E9D6', icone: 'sol' },
  padrao: { fundo: '#7B542F', destaque: '#E3A04A', texto: '#F5E9D6', icone: 'lugar' },
}

const DIA_MS = 86400000
const paraData = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`)
const paraIso = (d: Date) => d.toISOString().slice(0, 10)
const somarDias = (d: Date, dias: number) => new Date(d.getTime() + dias * DIA_MS)

// Domingo de Páscoa (cálculo de Meeus, calendário gregoriano)
export function domingoDePascoa(ano: number): string {
  const a = ano % 19
  const b = Math.floor(ano / 100)
  const c = ano % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

// Feriados nacionais que costumam virar "feriadão" (Carnaval tem moldura própria)
function feriadosDoAno(ano: number): { dia: string; nome: string }[] {
  const pascoa = paraData(domingoDePascoa(ano))
  const fixos: [string, string][] = [
    ['01-01', 'Ano-Novo'],
    ['04-21', 'Tiradentes'],
    ['05-01', 'Dia do Trabalho'],
    ['09-07', 'Independência'],
    ['10-12', 'Nossa Senhora Aparecida'],
    ['11-02', 'Finados'],
    ['11-15', 'Proclamação da República'],
    ['11-20', 'Consciência Negra'],
    ['12-25', 'Natal'],
  ]
  return [
    ...fixos.map(([md, nome]) => ({ dia: `${ano}-${md}`, nome })),
    { dia: paraIso(somarDias(pascoa, -2)), nome: 'Páscoa' }, // Sexta-feira Santa
    { dia: paraIso(somarDias(pascoa, 60)), nome: 'Corpus Christi' },
  ]
}

export function molduraDaViagem(dataInicio: string | null, dataFim: string | null): Moldura {
  const com = (chave: ChaveDaMoldura, titulo: string | null): Moldura => ({ chave, titulo, ...CORES_DA_MOLDURA[chave] })
  if (!dataInicio) return com('padrao', null)
  const inicio = paraData(dataInicio)
  const fim = paraData(dataFim && dataFim >= dataInicio ? dataFim : dataInicio)
  const dias: string[] = []
  for (let d = inicio; d <= fim && dias.length < 60; d = somarDias(d, 1)) dias.push(paraIso(d))
  const tem = (dia: string) => dias.includes(dia)
  const anos = [...new Set(dias.map((d) => Number(d.slice(0, 4))))]

  for (const ano of anos) if (tem(`${ano}-12-31`)) return com('reveillon', `Réveillon ${ano + 1}`)
  for (const ano of anos) {
    const pascoa = paraData(domingoDePascoa(ano))
    // Do sábado de Carnaval até a Quarta-feira de Cinzas
    for (let i = -51; i <= -46; i++) if (tem(paraIso(somarDias(pascoa, i)))) return com('carnaval', `Carnaval ${ano}`)
  }
  for (const ano of anos) for (let dia = 20; dia <= 29; dia++) if (tem(`${ano}-06-${dia}`)) return com('sao-joao', `São João ${ano}`)

  // Feriadão: passa por um feriado, tem pelo menos 3 dias e pega sábado ou domingo
  const temFimDeSemana = dias.some((d) => [0, 6].includes(paraData(d).getUTCDay()))
  if (dias.length >= 3 && temFimDeSemana) {
    for (const ano of anos) {
      const feriado = feriadosDoAno(ano).find((f) => tem(f.dia))
      if (feriado) return com('feriado', `Feriado de ${feriado.nome}`)
    }
  }
  return com('padrao', null)
}

// ---- Legenda pronta (a pessoa pode trocar antes de postar) ----
// Montada por regra, sem digitar e sem chamar IA: nome dos lugares, moldura e os números.
function listaDeLugares(lugares: string[]): string {
  const unicos = [...new Set(lugares.map((l) => l.trim()).filter(Boolean))]
  if (unicos.length === 0) return ''
  if (unicos.length === 1) return unicos[0]
  if (unicos.length <= 3) return `${unicos.slice(0, -1).join(', ')} e ${unicos[unicos.length - 1]}`
  return `${unicos.slice(0, 2).join(', ')} e mais ${unicos.length - 2} lugares`
}

export function legendaDaRetrospectiva(d: { nome: string; lugares: string[]; moldura: Moldura; dias: number; pessoas: number; carimbados: number }): string {
  const onde = listaDeLugares(d.lugares) || d.nome
  const abertura = d.moldura.titulo ? `${d.moldura.titulo} em ${onde}` : onde
  const numeros = [
    d.dias > 0 ? `${n(d.dias)} ${d.dias === 1 ? 'dia' : 'dias'}` : null,
    d.pessoas > 1 ? `${n(d.pessoas)} pessoas` : null,
    d.carimbados > 0 ? `${n(d.carimbados)} ${d.carimbados === 1 ? 'carimbo' : 'carimbos'} no passaporte da galera` : null,
  ].filter(Boolean) as string[]
  const lista = numeros.length > 1 ? `${numeros.slice(0, -1).join(', ')} e ${numeros[numeros.length - 1]}` : (numeros[0] ?? '')
  return lista ? `${abertura}: ${lista}. Bora a próxima?` : `${abertura}. Bora a próxima?`
}

// ---- Mapa percorrido ----
// Os destinos com lugar no mapa, na ordem do roteiro, e a área que o mapa mostra (com folga,
// pra uma viagem de uma cidade só não virar um zoom gigante).
export type PontoDoTrajeto = { nome: string; latitude: number; longitude: number }
export function trajetoDaViagem(destinos: { nome: string; latitude: number | null; longitude: number | null }[]): PontoDoTrajeto[] {
  return destinos.filter((d) => d.latitude != null && d.longitude != null).map((d) => ({ nome: d.nome, latitude: d.latitude as number, longitude: d.longitude as number }))
}

export function areaDoTrajeto(pontos: PontoDoTrajeto[], folgaMinima = 3): { oeste: number; leste: number; sul: number; norte: number } | null {
  if (pontos.length === 0) return null
  const lats = pontos.map((p) => p.latitude)
  const lngs = pontos.map((p) => p.longitude)
  let [sul, norte, oeste, leste] = [Math.min(...lats), Math.max(...lats), Math.min(...lngs), Math.max(...lngs)]
  // Pelo menos `folgaMinima` graus de cada lado do meio, mais 20% de borda
  const meioLat = (sul + norte) / 2
  const meioLng = (oeste + leste) / 2
  const meiaAltura = Math.max((norte - sul) * 0.6, folgaMinima / 2)
  const meiaLargura = Math.max((leste - oeste) * 0.6, folgaMinima / 2)
  sul = Math.max(-85, meioLat - meiaAltura)
  norte = Math.min(85, meioLat + meiaAltura)
  oeste = meioLng - meiaLargura
  leste = meioLng + meiaLargura
  return { oeste, leste, sul, norte }
}

// Web leve do convite (spec 018, FILA 0.8): a página /v/<código> que o convidado abre
// no navegador do WhatsApp pra topar, votar, ver o plano e ver o passaporte da galera.
// Funções puras, sem import de valor (o teste carrega o arquivo direto).
// Teste: apps/web/tests/convite-leve.test.mjs

// Caminho do convite (o site e o app montam o link com o próprio endereço)
export const caminhoDoConvite = (codigo: string) => `/v/${codigo}`

// ---------- Dias do plano ----------
const somarDias = (dia: string, n: number) => new Date(Date.parse(`${dia}T12:00:00Z`) + n * 86400000).toISOString().slice(0, 10)

// Todos os dias da viagem, do primeiro ao último (no máximo `limite`, pra viagem enorme não travar a página)
export function diasDaViagem(inicio: string | null, fim: string | null, limite = 31): string[] {
  if (!inicio) return []
  const ultimo = fim && fim >= inicio ? fim : inicio
  const dias: string[] = []
  for (let d = inicio; d <= ultimo && dias.length < limite; d = somarDias(d, 1)) dias.push(d)
  return dias
}

const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

// "Dia 1 · sáb, 28 dez"
export function rotuloDoDia(dia: string, indice: number): string {
  const data = new Date(`${dia}T12:00:00Z`)
  return `Dia ${indice + 1} · ${SEMANA[data.getUTCDay()]}, ${data.getUTCDate()} ${MESES[data.getUTCMonth()]}`
}

// Cidade(s) do dia: quem chega ou está naquele destino. Dia de troca mostra as duas ("Floripa → Garopaba").
export function cidadesDoDia(dia: string, destinos: { nome: string; chegada: string | null; saida: string | null }[]): string {
  return destinos
    .filter((d) => d.chegada && d.chegada <= dia && (d.saida ?? d.chegada) >= dia)
    .map((d) => d.nome)
    .join(' → ')
}

// ---------- Vitrine do passaporte ----------
export type LugarDoPassaporte = { nome: string; tipo: string; data: string | null }

// Os carimbos da viagem pra vitrine: acesos primeiro (na ordem em que caíram), depois os apagados
export function vitrineDoPassaporte(lugares: LugarDoPassaporte[]): { lugares: LugarDoPassaporte[]; acesos: number; total: number; frase: string } {
  const acesos = lugares.filter((l) => l.data).sort((a, b) => (a.data as string).localeCompare(b.data as string))
  const apagados = lugares.filter((l) => !l.data)
  const total = lugares.length
  let frase: string
  if (total === 0) frase = 'Cada lugar da viagem vira um carimbo no passaporte da galera.'
  else if (acesos.length === 0) frase = total === 1 ? '1 lugar esperando o carimbo da galera.' : `${total} lugares esperando o carimbo da galera.`
  else if (acesos.length === total) frase = total === 1 ? 'O lugar da viagem já está carimbado.' : `Os ${total} lugares da viagem já estão carimbados.`
  else frase = `${acesos.length} de ${total} lugares carimbados.`
  return { lugares: [...acesos, ...apagados], acesos: acesos.length, total, frase }
}

// ---------- Falta seu voto ----------
type OpcaoV = { id: string; destinoId: string | null; nome: string; escolhida: boolean; votos: string[] }
type EnqueteV = { id: string; fechada: boolean; opcoes: { id: string; votos: string[] }[] }
type DestinoV = { id: string; nome: string }

export type HospedagemPraVotar<O extends OpcaoV = OpcaoV> = {
  destinoId: string | null
  destino: string
  escolhida: O | null // já decidida: mostra só o nome, sem votação
  opcoes: O[] // mais votadas primeiro
  meuVoto: boolean // já votei em alguma opção desse destino
}

// Hospedagem de cada destino que tem opção: a escolhida (se o ADM já decidiu) ou as opções pra votar
export function hospedagensPraVotar<O extends OpcaoV>(opcoes: O[], destinos: DestinoV[], meuId: string): HospedagemPraVotar<O>[] {
  const grupos: HospedagemPraVotar<O>[] = []
  const chaves: (string | null)[] = [...destinos.map((d) => d.id), null]
  for (const chave of chaves) {
    const doDestino = opcoes.filter((o) => (chave === null ? !destinos.some((d) => d.id === o.destinoId) : o.destinoId === chave))
    if (doDestino.length === 0) continue
    const escolhida = doDestino.find((o) => o.escolhida) ?? null
    grupos.push({
      destinoId: chave,
      destino: destinos.find((d) => d.id === chave)?.nome ?? 'Outras opções',
      escolhida,
      opcoes: escolhida ? [] : [...doDestino].sort((a, b) => b.votos.length - a.votos.length || a.nome.localeCompare(b.nome)),
      meuVoto: doDestino.some((o) => o.votos.includes(meuId)),
    })
  }
  return grupos
}

// Quantas votações ainda esperam o meu voto (hospedagem sem escolhida + enquete aberta)
export function votosQueFaltam(hospedagens: Pick<HospedagemPraVotar, 'escolhida' | 'meuVoto'>[], enquetes: EnqueteV[], meuId: string): number {
  const casas = hospedagens.filter((h) => !h.escolhida && !h.meuVoto).length
  const perguntas = enquetes.filter((e) => !e.fechada && !e.opcoes.some((o) => o.votos.includes(meuId))).length
  return casas + perguntas
}

// "Falta seu voto em 2 coisas" / "Seus votos estão em dia"
export function fraseDosVotos(faltam: number): string {
  if (faltam === 0) return 'Seus votos estão em dia.'
  return faltam === 1 ? 'Falta seu voto em 1 coisa.' : `Falta seu voto em ${faltam} coisas.`
}

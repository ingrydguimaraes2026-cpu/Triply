// Monta o checklist de documentos de uma viagem (spec 010). Funções puras, sem banco.
import { codigoDoPais, nomeDoPais } from './paises.ts'
import {
  FONTE_ITAMARATY,
  FONTE_PASSAPORTE,
  ITEM_FEBRE_AMARELA,
  ITENS_GERAIS,
  PAIS_DE_CASA,
  PAISES_SCHENGEN,
  regrasDoPais,
  type Fonte,
  type Regra,
} from './regras.ts'

export type ItemChecklist = {
  chave: string
  titulo: string
  texto: string
  tipo: 'tarefa' | 'aviso'
  paises: string[] // códigos ISO dos países que pedem este item
  prazo: { data: string | null; dias: number | null } // resolver até a data (ou X dias antes)
  fonte: Fonte
  conferidoEm: string
  aConfirmar: boolean
}

export type Checklist = {
  paises: string[] // países fora de casa, na ordem do roteiro
  semRegra: string[] // países que ainda não temos
  itens: ItemChecklist[]
}

type DestinoMinimo = { pais: string | null; chegada?: string | null; saida?: string | null }
type ViagemMinima = { data_inicio: string | null; data_fim: string | null }

// "2027-06-08" + 3 meses = "2027-09-08"
export function somarMeses(data: string, meses: number) {
  const [a, m, d] = data.split('-').map(Number)
  const total = a * 12 + (m - 1) + meses
  const ano = Math.floor(total / 12)
  const mes = (total % 12) + 1
  const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate()
  return `${ano}-${String(mes).padStart(2, '0')}-${String(Math.min(d, ultimoDia)).padStart(2, '0')}`
}

export function somarDias(data: string, dias: number) {
  const [a, m, d] = data.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10)
}

function dataBr(data: string) {
  const [a, m, d] = data.split('-')
  return `${d}/${m}/${a}`
}

// Início e fim: os da viagem; se faltarem, os das datas dos destinos
export function periodo(viagem: ViagemMinima, destinos: DestinoMinimo[]) {
  const chegadas = destinos.map((d) => d.chegada).filter((x): x is string => !!x).sort()
  const saidas = destinos.map((d) => d.saida).filter((x): x is string => !!x).sort()
  return {
    inicio: viagem.data_inicio ?? chegadas[0] ?? null,
    fim: viagem.data_fim ?? saidas.at(-1) ?? chegadas.at(-1) ?? null,
  }
}

const listaDePaises = (codigos: string[]) => {
  const nomes = codigos.map(nomeDoPais)
  return nomes.length <= 1 ? (nomes[0] ?? '') : `${nomes.slice(0, -1).join(', ')} e ${nomes.at(-1)}`
}

export function montarChecklist(viagem: ViagemMinima, destinos: DestinoMinimo[]): Checklist {
  // Países fora de casa, sem repetir, na ordem do roteiro
  const paises: string[] = []
  for (const d of destinos) {
    const codigo = codigoDoPais(d.pais)
    if (codigo && codigo !== PAIS_DE_CASA && !paises.includes(codigo)) paises.push(codigo)
  }
  if (paises.length === 0) return { paises, semRegra: [], itens: [] }

  const { inicio, fim } = periodo(viagem, destinos)
  const prazo = (dias: number | null) => ({ data: dias !== null && inicio ? somarDias(inicio, -dias) : null, dias })

  const conhecidos = paises.filter((p) => regrasDoPais(p))
  const semRegra = paises.filter((p) => !regrasDoPais(p))
  const itens = new Map<string, ItemChecklist>()

  const adicionar = (regra: Regra, pais: string | null) => {
    const atual = itens.get(regra.chave)
    if (atual) {
      if (pais && !atual.paises.includes(pais)) atual.paises.push(pais)
      return
    }
    itens.set(regra.chave, {
      chave: regra.chave,
      titulo: regra.titulo,
      texto: regra.texto,
      tipo: regra.tipo,
      paises: pais ? [pais] : [],
      prazo: prazo(regra.prazoDias),
      fonte: regra.fonte,
      conferidoEm: regra.conferidoEm,
      aConfirmar: !!regra.aConfirmar,
    })
  }

  // 1. Documento de viagem (um item só, com a regra mais exigente)
  const docs = conhecidos.map((p) => regrasDoPais(p)!.documento)
  const todosAceitamRG = semRegra.length === 0 && docs.every((d) => d.aceitaRG)
  const meses = Math.max(0, ...docs.map((d) => d.mesesDeValidade))
  const dezAnos = docs.some((d) => d.emitidoHaMenosDe10Anos)
  let textoDoc: string
  if (todosAceitamRG) {
    textoDoc = 'Passaporte válido ou RG/CIN emitido há menos de 10 anos, em bom estado e com foto reconhecível. CNH não vale.'
  } else {
    const validade =
      meses === 0
        ? 'válido durante toda a viagem'
        : fim
          ? `válido até pelo menos ${dataBr(somarMeses(fim, meses))} (${meses} meses depois da volta)`
          : `válido por pelo menos ${meses} meses depois da volta`
    textoDoc = `Passaporte ${validade}${dezAnos ? ' e emitido há menos de 10 anos' : ''}. Se precisar tirar ou renovar, a Polícia Federal tem fila.`
  }
  itens.set('passaporte', {
    chave: 'passaporte',
    titulo: todosAceitamRG ? 'Passaporte ou RG' : 'Passaporte',
    texto: textoDoc,
    tipo: 'tarefa',
    paises: [...paises],
    prazo: prazo(60),
    fonte: FONTE_PASSAPORTE,
    conferidoEm: ITENS_GERAIS[0].conferidoEm,
    aConfirmar: false,
  })

  // 2. Itens de cada país (os repetidos viram um só)
  for (const p of conhecidos) for (const regra of regrasDoPais(p)!.itens) adicionar(regra, p)

  // 3. Países que ainda não temos: mandar pro Itamaraty e lembrar da febre amarela
  for (const p of semRegra) {
    itens.set(`sem-regra-${p}`, {
      chave: `sem-regra-${p}`,
      titulo: `${nomeDoPais(p)}: confira as regras`,
      texto: `Ainda não temos as regras de ${nomeDoPais(p)} no app. Veja visto, documentos e vacinas no Portal Consular do Itamaraty.`,
      tipo: 'tarefa',
      paises: [p],
      prazo: prazo(90),
      fonte: FONTE_ITAMARATY,
      conferidoEm: ITENS_GERAIS[0].conferidoEm,
      aConfirmar: false,
    })
  }
  if (semRegra.length > 0) adicionar(ITEM_FEBRE_AMARELA, null)
  for (const p of semRegra) itens.get(ITEM_FEBRE_AMARELA.chave)!.paises.push(p)

  // 4. Gerais (o seguro da Europa já cobre o seguro geral)
  const temSchengen = paises.some((p) => PAISES_SCHENGEN.includes(p))
  for (const regra of ITENS_GERAIS) {
    if (regra.chave === 'seguro' && temSchengen) continue
    adicionar(regra, null)
  }

  // Textos que citam os países (ex.: ETIAS "vale pra França, Mônaco e Itália")
  const lista = [...itens.values()].map((item) =>
    item.paises.length > 0 && item.chave !== 'passaporte' && !item.chave.startsWith('sem-regra-')
      ? { ...item, texto: `${item.texto} Vale pra: ${listaDePaises(item.paises)}.` }
      : item,
  )

  return { paises, semRegra, itens: ordenar(lista) }
}

// Tarefas primeiro, pelo prazo mais perto; avisos no fim
function ordenar(itens: ItemChecklist[]) {
  const chave = (i: ItemChecklist) => (i.tipo === 'aviso' ? 1e9 : -(i.prazo.dias ?? -1))
  return [...itens].sort((a, b) => chave(a) - chave(b))
}

// "Resolver até 02/05/2027", "60 dias antes da viagem" ou null
export function textoDoPrazo(item: ItemChecklist) {
  if (item.prazo.data) return `Resolver até ${dataBr(item.prazo.data)}`
  if (item.prazo.dias !== null) return `${item.prazo.dias} dias antes da viagem`
  return null
}

export function prazoVencido(item: ItemChecklist, hoje: string) {
  return !!item.prazo.data && item.prazo.data < hoje
}

export type Status = 'pendente' | 'resolvido' | 'nao_preciso'

// Quantas tarefas a pessoa já resolveu (ou não precisa)
export function progresso(itens: ItemChecklist[], meusStatus: Record<string, Status>) {
  const tarefas = itens.filter((i) => i.tipo === 'tarefa')
  const feitas = tarefas.filter((i) => (meusStatus[i.chave] ?? 'pendente') !== 'pendente').length
  return { feitas, total: tarefas.length }
}

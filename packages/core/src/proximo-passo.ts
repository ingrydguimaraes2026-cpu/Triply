// Cartão "Próximo passo" no topo da viagem (spec 115, etapa 2): uma ação só, a primeira que falta.
// Puro e sem import (o teste carrega o arquivo direto). A tela só mostra.

export type EntradaDoProximoPasso = {
  hoje: string // AAAA-MM-DD
  dataInicio: string | null
  dataFim: string | null
  destinos: { id: string; nome: string }[]
  lugaresPorDestino: Record<string, number> // lugares salvos na viagem, por destino
  pessoas: number // gente no comboio
  euSouAdm: boolean
  semHospedagem: { nome: string } | null // primeiro destino que ainda não tem onde dormir
  trechoSemTransporte: { de: string; para: string } | null
}

export type ProximoPasso = {
  chave: 'durante' | 'depois' | 'escolher' | 'convidar' | 'datas' | 'hospedagem' | 'transporte'
  titulo: string
  botao: string
  link: string // relativo à viagem (ex.: "explorar?destino=…")
}

export function proximoPasso(e: EntradaDoProximoPasso): ProximoPasso | null {
  if (e.destinos.length === 0) return null // modo sonhando tem a faixa própria

  if (e.dataFim && e.dataFim < e.hoje) {
    return { chave: 'depois', titulo: 'A viagem acabou. Que tal relembrar?', botao: 'Ver a retrospectiva', link: 'retrospectiva' }
  }
  if (e.dataInicio && e.dataInicio <= e.hoje && (!e.dataFim || e.dataFim >= e.hoje)) {
    return { chave: 'durante', titulo: 'Bom dia de viagem! Veja o que tem pra hoje.', botao: 'Abrir o Hoje', link: 'hoje' }
  }

  const semLugares = e.destinos.find((d) => !e.lugaresPorDestino[d.id])
  if (semLugares) {
    return {
      chave: 'escolher',
      titulo: `Escolha o que você quer fazer em ${semLugares.nome}`,
      botao: 'Começar a escolher',
      link: `explorar?destino=${semLugares.id}`,
    }
  }
  if (e.pessoas <= 1) {
    return { chave: 'convidar', titulo: 'Chame a galera pra escolher também', botao: 'Convidar o comboio', link: 'comboio' }
  }
  // Só o ADM muda as datas
  if (!e.dataInicio && e.euSouAdm) {
    return { chave: 'datas', titulo: 'Quando vocês vão?', botao: 'Definir as datas', link: 'configuracoes' }
  }
  if (e.semHospedagem) {
    return { chave: 'hospedagem', titulo: `Onde vocês vão dormir em ${e.semHospedagem.nome}?`, botao: 'Ver hospedagem', link: 'hospedagem' }
  }
  if (e.trechoSemTransporte) {
    const { de, para } = e.trechoSemTransporte
    return { chave: 'transporte', titulo: `Como vocês vão de ${de} pra ${para}?`, botao: 'Ver transportes', link: 'transportes' }
  }
  return null
}

// ---------- Menu por fase (spec 115, etapa 3) ----------
// Antes da viagem o menu mostra o que serve pra planejar; durante, o dia a dia; depois, as lembranças.
// O resto fica em "Mais". O Início ('') sempre aparece.

export type FaseDaViagem = 'antes' | 'durante' | 'depois'

export function faseDaViagem(hoje: string, dataInicio: string | null, dataFim: string | null): FaseDaViagem {
  if (dataFim && dataFim < hoje) return 'depois'
  if (dataInicio && dataInicio <= hoje) return 'durante'
  return 'antes'
}

export const ABAS_DA_FASE: Record<FaseDaViagem, string[]> = {
  antes: ['', 'explorar', 'hospedagem', 'transportes', 'financeiro', 'comboio'],
  durante: ['', 'hoje', 'agenda', 'financeiro', 'fotos', 'comboio'],
  depois: ['', 'fotos', 'financeiro', 'agenda', 'comboio'],
}

// Separa as abas na ordem da fase (principais) e o resto na ordem original (mais)
export function separarAbas<A extends { para: string }>(abas: A[], fase: FaseDaViagem): { principais: A[]; mais: A[] } {
  const ordem = ABAS_DA_FASE[fase]
  const principais = ordem.map((p) => abas.find((a) => a.para === p)).filter((a): a is A => !!a)
  return { principais, mais: abas.filter((a) => !ordem.includes(a.para)) }
}

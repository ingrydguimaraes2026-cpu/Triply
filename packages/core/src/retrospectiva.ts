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
}): CartaoDaRetrospectiva[] {
  const cartoes: CartaoDaRetrospectiva[] = []
  if (d.dias > 0) cartoes.push({ chave: 'dias', numero: n(d.dias), titulo: d.dias === 1 ? 'dia de viagem' : 'dias de viagem', legenda: d.nome })
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

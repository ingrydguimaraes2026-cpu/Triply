// Gera icones.js: os ícones (Phosphor duotone) e os selos de verdade do @together/core,
// pro painel usar sem desenhar nada à mão. Rodar: node docs/design/direcao-redesenho/gerar-icones.mjs
import { writeFileSync } from 'node:fs'
const core = new URL('../../../packages/core/src/', import.meta.url).href
const { DESENHOS_DOS_ICONES } = await import(core + 'icones-desenhos.ts')
const { DESENHOS_DOS_SELOS } = await import(core + 'selos.ts')

const icones = ['viagens', 'roteiro', 'hospedagem', 'contas', 'fotos', 'aviao', 'comboio', 'convidar', 'datas', 'seta-direita', 'feito', 'mais', 'menos', 'fechar', 'lugar', 'votar', 'dinheiro', 'compartilhar', 'curtir', 'info']
const selos = ['mapa', 'galera', 'calendario', 'passagem', 'moedas', 'feito', 'cartas', 'barraca']

const saida = {
  icones: Object.fromEntries(icones.map((n) => [n, DESENHOS_DOS_ICONES[n].d])),
  selos: Object.fromEntries(selos.map((n) => [n, DESENHOS_DOS_SELOS[n]])),
}
writeFileSync(
  new URL('./icones.js', import.meta.url),
  '// Gerado por gerar-icones.mjs a partir do @together/core. Não editar à mão.\nwindow.NORTI_DESENHOS = ' + JSON.stringify(saida) + '\n',
)
console.log('icones.js gerado:', icones.length, 'ícones,', selos.length, 'selos')

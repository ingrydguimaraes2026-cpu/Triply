// Gera packages/core/src/icones-desenhos.ts a partir da lista (icones-lista.mjs) e do Phosphor (@iconify-json/ph).
// Rodar: node packages/core/scripts/gerar-icones.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { CHEIOS, ICONES } from './icones-lista.mjs'

const aqui = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const ph = JSON.parse(readFileSync(require.resolve('@iconify-json/ph/icons.json'), 'utf8'))

// Ícones de ação (X, +, setas, check): o duotone põe um quadrado/círculo de fundo neles. Usam o peso "bold".
const GLIFOS = new Set([
  'mais', 'menos', 'fechar', 'ok', 'tudo-ok', 'mais-opcoes', 'voltar', 'seta-direita', 'seta-cima', 'seta-baixo',
  'seta-entrada', 'seta-saida', 'trocar', 'abrir-lista', 'anterior', 'avancar', 'atualizar', 'repetir', 'recomecar', 'desfazer',
  'link', 'abrir-fora', 'ampliar', 'porcentagem',
])

function corpo(nome) {
  const ic = ph.icons[nome] ?? ph.icons[ph.aliases?.[nome]?.parent]
  if (!ic) throw new Error(`Phosphor não tem "${nome}"`)
  return ic.body
    .replace(/ opacity="\.2"/g, ' fill="__DUO__"') // camada de fundo do duotone
    .replace(/currentColor/g, '__COR__')
}

const desenhos = {}
const apelidos = {}
for (const [nome, desenho, antigos] of ICONES) {
  desenhos[nome] = { d: corpo(`${desenho}-${GLIFOS.has(nome) ? 'bold' : 'duotone'}`) }
  if (CHEIOS.includes(nome)) desenhos[nome].c = corpo(`${desenho}-fill`)
  for (const a of antigos) apelidos[a] = nome
}

const saida = `// GERADO por packages/core/scripts/gerar-icones.mjs: não edite à mão (mude icones-lista.mjs e rode o script).
// Desenhos: Phosphor Icons (MIT, phosphoricons.com). __COR__ = cor do traço, __DUO__ = cor da camada de fundo.
export const DESENHOS_DOS_ICONES = ${JSON.stringify(desenhos, null, 1)} as const satisfies Record<string, { d: string; c?: string }>

// Nomes antigos (lucide) → nome do Tripwave. Só pra a troca não quebrar nada; código novo usa o nome em português.
export const APELIDOS_DOS_ICONES = ${JSON.stringify(apelidos, null, 1)} as const
`
writeFileSync(join(aqui, '..', 'src', 'icones-desenhos.ts'), saida)
console.log(`ok: ${ICONES.length} ícones, ${Object.keys(apelidos).length} apelidos`)

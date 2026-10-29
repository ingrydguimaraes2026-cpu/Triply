// Metro num monorepo pnpm: precisa enxergar a raiz (pra achar packages/core, que é TS puro)
// e os node_modules da raiz além dos do app.
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Observa o monorepo inteiro (pra Metro transpilar o @together/core a partir do fonte .ts)
config.watchFolders = [workspaceRoot]

// Procura dependências no app e, depois, na raiz
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

module.exports = config

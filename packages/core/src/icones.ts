// Ícones e selos da Norti (docs/design/ICONES.md). Um catálogo só pra web e app:
// - Ícone: desenho do dia a dia (botão, aba, lista). Phosphor Duotone recolorido: traço na cor pedida
//   e uma camada de fundo dourada. Ex.: svgDoIcone('lugar', { cor: '#7B542F' })
// - Selo: ilustração nossa, grande, pra categorias, passos e onboarding. Ex.: svgDoSelo('mapa')
// Nada de emoji nem de pacote de ícone direto nas telas: tudo passa por aqui.
import { APELIDOS_DOS_ICONES, DESENHOS_DOS_ICONES } from './icones-desenhos'
import { DESENHOS_DOS_SELOS } from './selos'

export type NomeDoIcone = keyof typeof DESENHOS_DOS_ICONES
export type ApelidoDoIcone = keyof typeof APELIDOS_DOS_ICONES
export type NomeDoSelo = keyof typeof DESENHOS_DOS_SELOS
export { APELIDOS_DOS_ICONES }

export const COR_DUO_DOS_ICONES = '#E3A04A' // dourado da paleta
const TRACO_DOS_SELOS = { claro: '#4A2E14', escuro: '#FFF6E8' } as const

// Traço em cor "de marca" (marrons, branco, creme): fundo dourado. Traço colorido (verde, vermelho):
// o fundo é a mesma cor, clarinha, pra não brigar com o significado da cor.
const NEUTRAS = new Set(['#3b2715', '#6e5540', '#7a5f45', '#8a7058', '#7b542f', '#b97a22', '#4a2e14', '#f5e9d6', '#fbf3e6', '#fff', '#ffffff', 'white', 'currentcolor'])
export function duoDoIcone(cor: string): { cor: string; opacidade: number } {
  return NEUTRAS.has(cor.toLowerCase()) ? { cor: COR_DUO_DOS_ICONES, opacidade: 1 } : { cor, opacidade: 0.25 }
}

// Corpo do desenho com as marcas __COR__ e __DUO__ (a web troca por CSS)
export function corpoDoIcone(nome: NomeDoIcone, cheio = false): string {
  const desenho: { d: string; c?: string } = DESENHOS_DOS_ICONES[nome]
  return cheio && desenho.c ? desenho.c : desenho.d
}

// SVG completo, com as cores já aplicadas (o app desenha direto)
export function svgDoIcone(nome: NomeDoIcone, { cor = '#3B2715', duo, cheio = false }: { cor?: string; duo?: string; cheio?: boolean } = {}): string {
  const fundo = duo ? { cor: duo, opacidade: 1 } : duoDoIcone(cor)
  const corpo = corpoDoIcone(nome, cheio)
    .replace(/fill="__DUO__"/g, `fill="${fundo.cor}" fill-opacity="${fundo.opacidade}"`)
    .replace(/__COR__/g, cor)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">${corpo}</svg>`
}

export function svgDoSelo(nome: NomeDoSelo, tom: 'claro' | 'escuro' = 'claro'): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${DESENHOS_DOS_SELOS[nome].replace(/__TRACO__/g, TRACO_DOS_SELOS[tom])}</svg>`
}

export const nomeDoApelido = (apelido: ApelidoDoIcone): NomeDoIcone => APELIDOS_DOS_ICONES[apelido]

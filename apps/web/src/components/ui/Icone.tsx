import { memo, type ComponentType, type SVGProps } from 'react'
import { corpoDoIcone, svgDoSelo, type NomeDoIcone, type NomeDoSelo } from '@together/core'

// Ícones da Norti (docs/design/ICONES.md). Ex.: <Icone nome="lugar" size={20} />
// O traço usa a cor do texto (currentColor); a camada de fundo é dourada (.icone .duo no global.css).
// `cheio`: versão preenchida (coração curtido, estrela).
export type PropsDoIcone = Omit<SVGProps<SVGSVGElement>, 'ref'> & {
  size?: number | string
  cheio?: boolean
}

// Corpo do desenho pronto pro navegador: só depende do nome, então guarda em memória
const prontos = new Map<string, string>()
function corpo(nome: NomeDoIcone, cheio: boolean) {
  const chave = `${nome}:${cheio}`
  let html = prontos.get(chave)
  if (!html) {
    html = corpoDoIcone(nome, cheio).replace(/fill="__DUO__"/g, 'class="duo"').replace(/__COR__/g, 'currentColor')
    prontos.set(chave, html)
  }
  return html
}

function desenhar(nome: NomeDoIcone, { size = 24, cheio, fill, strokeWidth: _traco, className, ...resto }: PropsDoIcone) {
  // fill antigo: "none" = vazio; qualquer cor = cheio
  const ehCheio = cheio ?? (!!fill && fill !== 'none' && fill !== 'transparent')
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width={size}
      height={size}
      fill="none"
      className={className ? `icone ${className}` : 'icone'}
      aria-hidden={resto['aria-label'] ? undefined : true}
      {...resto}
      dangerouslySetInnerHTML={{ __html: corpo(nome, ehCheio) }}
    />
  )
}

export const Icone = memo(function Icone({ nome, ...p }: PropsDoIcone & { nome: NomeDoIcone }) {
  return desenhar(nome, p)
})

// Componente com nome fixo (usado pelos apelidos em ./icones)
export type ComponenteDeIcone = ComponentType<PropsDoIcone>
export function criarIcone(nome: NomeDoIcone): ComponenteDeIcone {
  const C = memo((p: PropsDoIcone) => desenhar(nome, p))
  C.displayName = `Icone(${nome})`
  return C
}

// Selo: ilustração nossa (onboarding, passos, categorias). `tom="escuro"` em cima de fundo marrom.
export const Selo = memo(function Selo({ nome, tamanho = 36, tom = 'claro', className }: { nome: NomeDoSelo; tamanho?: number; tom?: 'claro' | 'escuro'; className?: string }) {
  return (
    <span
      className={className ? `selo ${className}` : 'selo'}
      style={{ width: tamanho, height: tamanho }}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: svgDoSelo(nome, tom) }}
    />
  )
})
export type { NomeDoIcone, NomeDoSelo }

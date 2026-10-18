// Comprime a foto no navegador antes de enviar (spec 005):
// no máximo 1600 px no lado maior, WebP (ou JPEG se o navegador não fizer WebP) e menos de 1 MB.

const LADO_MAXIMO = 1600
const TAMANHO_MAXIMO = 1024 * 1024 - 16 * 1024 // um pouco abaixo de 1 MB, por segurança

export class ArquivoInvalido extends Error {}

function paraBlob(canvas: HTMLCanvasElement, tipo: string, qualidade: number): Promise<Blob | null> {
  return new Promise((resolver) => canvas.toBlob(resolver, tipo, qualidade))
}

// Padrão: foto do mural. Pra foto de perfil: { ladoMaximo: 400, tamanhoMaximo: 500 * 1024 }
export async function comprimirFoto(
  arquivo: File,
  { ladoMaximo = LADO_MAXIMO, tamanhoMaximo = TAMANHO_MAXIMO } = {},
): Promise<Blob> {
  if (!arquivo.type.startsWith('image/')) throw new ArquivoInvalido('Esse arquivo não é uma foto.')

  let imagem: ImageBitmap
  try {
    imagem = await createImageBitmap(arquivo, { imageOrientation: 'from-image' })
  } catch {
    throw new ArquivoInvalido('Não consegui abrir essa foto. Tente outra (JPG, PNG ou WebP).')
  }

  let escala = Math.min(1, ladoMaximo / Math.max(imagem.width, imagem.height))
  let qualidade = 0.82
  let tipo = 'image/webp'

  for (let tentativa = 0; tentativa < 8; tentativa++) {
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(imagem.width * escala)
    canvas.height = Math.round(imagem.height * escala)
    canvas.getContext('2d')!.drawImage(imagem, 0, 0, canvas.width, canvas.height)
    const blob = await paraBlob(canvas, tipo, qualidade)
    // Navegador sem WebP devolve PNG: troca pra JPEG
    if (!blob || (tipo === 'image/webp' && blob.type !== 'image/webp')) {
      tipo = 'image/jpeg'
      continue
    }
    if (blob.size <= tamanhoMaximo) {
      imagem.close()
      return blob
    }
    // Ainda grande: primeiro baixa a qualidade, depois o tamanho
    if (qualidade > 0.6) qualidade -= 0.12
    else escala *= 0.8
  }
  imagem.close()
  throw new ArquivoInvalido('A foto ficou grande demais mesmo comprimida. Tente outra.')
}

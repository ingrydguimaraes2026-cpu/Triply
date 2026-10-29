// Fotos de capa temporárias (Unsplash) enquanto a viagem não tem capa própria no banco.
// Cada viagem pega sempre a mesma foto (escolhida pelo id), pra não ficar trocando.
const IDS = [
  '1500530855697-b586d89ba3ee',
  '1469474968028-56623f02e42e',
  '1483729558449-99ef09a8c325',
  '1507525428034-b723cf961d3e',
  '1464822759023-fed622ff2c3b',
  '1433086966358-54859d0ed716',
  '1506905925346-21bda4d32df4',
  '1470071459604-3b5ec3a7fe05',
]

export const fotoUnsplash = (id: string, largura = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${largura}&q=70`

export function capaDaViagem(viagemId: string, largura = 900) {
  let soma = 0
  for (const c of viagemId) soma = (soma * 31 + c.charCodeAt(0)) >>> 0
  return fotoUnsplash(IDS[soma % IDS.length], largura)
}

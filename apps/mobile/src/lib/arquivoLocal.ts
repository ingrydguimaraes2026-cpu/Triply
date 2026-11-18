import { Platform } from 'react-native'
import { File } from 'expo-file-system'

// Lê um arquivo do aparelho (foto escolhida, PDF, imagem comprimida) como bytes.
// Android (teste 17/11): `fetch(uri).arrayBuffer()` num arquivo local voltava 14 bytes e a foto
// subia vazia. No celular lê pelo expo-file-system; na web (teste no navegador) o fetch funciona.
// Arquivo vazio ou quebrado nunca sobe: dá erro com mensagem pra pessoa.
const MINIMO = 100 // bytes; nenhuma foto ou PDF de verdade é menor que isso

export class ArquivoVazio extends Error {
  constructor() {
    super('Não deu pra ler o arquivo do celular. Escolha de novo.')
    this.name = 'ArquivoVazio'
  }
}

export async function lerArquivoLocal(uri: string): Promise<Uint8Array> {
  const bytes = Platform.OS === 'web' ? new Uint8Array(await (await fetch(uri)).arrayBuffer()) : await new File(uri).bytes()
  if (bytes.byteLength < MINIMO) throw new ArquivoVazio()
  return bytes
}

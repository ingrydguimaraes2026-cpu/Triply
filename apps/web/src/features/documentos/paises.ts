// O código do país saiu daqui pro @together/core (o app usa também).
// Importa o arquivo direto (/paises) pra os testes no Node não precisarem abrir o core inteiro.
import { semAcento, codigoDoPais } from '@together/core/paises'

export { semAcento, codigoDoPais }

const nomesPt = new Intl.DisplayNames(['pt-BR'], { type: 'region' })

// "MC" → "Mônaco"
export function nomeDoPais(codigo: string) {
  return nomesPt.of(codigo) ?? codigo
}

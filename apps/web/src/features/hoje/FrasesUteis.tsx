import { useState } from 'react'
import { Camera, Languages, Volume2 } from 'lucide-react'
import { frasesDoIdioma, linkDeTraducaoPelaCamera, NOME_DO_IDIOMA, VOZ, type Idioma } from '@together/core'
import Cartao from '../../components/ui/Cartao'

// Frases úteis (spec 104): toque pra ouvir com a voz do próprio celular (de graça, funciona sem internet
// na maioria dos aparelhos). Atalho pra traduzir cardápio/placa pela câmera no Google Tradutor.
export default function FrasesUteis({ idioma }: { idioma: Idioma }) {
  const [todas, setTodas] = useState(false)
  const frases = frasesDoIdioma(idioma)
  const temVoz = typeof window !== 'undefined' && 'speechSynthesis' in window

  function falar(texto: string) {
    if (!temVoz) return
    window.speechSynthesis.cancel()
    const fala = new SpeechSynthesisUtterance(texto)
    fala.lang = VOZ[idioma]
    fala.rate = 0.85 // um pouco mais devagar, pra dar pra repetir
    window.speechSynthesis.speak(fala)
  }

  return (
    <Cartao titulo={`Frases em ${NOME_DO_IDIOMA[idioma].toLowerCase()}`} icone={Languages}>
      <ul className="frases">
        {(todas ? frases : frases.slice(0, 5)).map((f) => (
          <li key={f.pt}>
            <button type="button" onClick={() => falar(f.texto)} disabled={!temVoz} aria-label={`Ouvir: ${f.texto}`}>
              <span>
                <strong lang={idioma}>{f.texto}</strong>
                <small>{f.pt}</small>
              </span>
              {temVoz && <Volume2 size={18} aria-hidden="true" />}
            </button>
          </li>
        ))}
      </ul>
      <div className="ferramenta-links">
        {!todas && (
          <button type="button" className="botao-texto" onClick={() => setTodas(true)}>
            Ver todas ({frases.length})
          </button>
        )}
        <a href={linkDeTraducaoPelaCamera(idioma)} target="_blank" rel="noreferrer noopener">
          <Camera size={14} aria-hidden="true" /> Traduzir cardápio ou placa pela câmera
        </a>
      </div>
    </Cartao>
  )
}

import { useState } from 'react'
import { Car, ExternalLink, Navigation } from 'lucide-react'
import { linksDeCorrida, linksDeNavegacao, textoDoAlvo, type Alvo } from '@together/core'
import Gaveta from './Gaveta'

// Botão "Ir" (spec 040): abre o caminho no app de navegação preferido ou pede uma corrida.
// Uso: <BotaoIr alvo={{ nome: 'Hotel', endereco: 'Rue X 1, Nice' }} />
export default function BotaoIr({ alvo, rotulo = 'Ir' }: { alvo: Alvo; rotulo?: string }) {
  const [aberto, setAberto] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const texto = textoDoAlvo(alvo)

  // Bolt e Free Now não aceitam o destino no link: copia o endereço pra colar no app
  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto)
      setCopiado(true)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <>
      <button type="button" className="botao-ir" onClick={() => setAberto(true)}>
        <Navigation size={14} aria-hidden="true" /> {rotulo}
      </button>
      {aberto && (
        <Gaveta titulo={`Ir até ${alvo.nome}`} aoFechar={() => setAberto(false)}>
          <p className="ir-endereco">{texto}</p>
          <h3 className="ir-grupo">
            <Navigation size={16} aria-hidden="true" /> Ver o caminho
          </h3>
          <div className="ir-apps">
            {linksDeNavegacao(alvo).map((l) => (
              <a key={l.chave} href={l.url} target="_blank" rel="noreferrer noopener" className={`ir-app ir-${l.chave}`}>
                {l.nome} <ExternalLink size={12} aria-hidden="true" />
              </a>
            ))}
          </div>
          <h3 className="ir-grupo">
            <Car size={16} aria-hidden="true" /> Pedir corrida
          </h3>
          <p className="dica">Compare antes: na Europa o Bolt costuma sair mais barato que o Uber.</p>
          <div className="ir-apps">
            {linksDeCorrida(alvo).map((l) => (
              <a
                key={l.chave}
                href={l.url}
                target="_blank"
                rel="noreferrer noopener"
                className={`ir-app ir-${l.chave}`}
                onClick={l.preenche ? undefined : copiar}
              >
                {l.nome} <ExternalLink size={12} aria-hidden="true" />
              </a>
            ))}
          </div>
          <p className="dica">{copiado ? 'Endereço copiado: é só colar no app.' : 'No Bolt e no FREENOW, o endereço é copiado pra você colar no app.'}</p>
        </Gaveta>
      )}
    </>
  )
}

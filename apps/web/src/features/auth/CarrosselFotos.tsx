import { useEffect, useState, type TransitionEvent } from 'react'

// Fotos do Unsplash (licença gratuita)
const FOTOS = [
  { id: 'photo-1779173851395-95b1c8df80db', alt: 'Orla de Cannes com palmeiras ao pôr do sol' },
  { id: 'photo-1688574890549-820a058d81b1', alt: 'Vila colorida no alto de um penhasco sobre o mar' },
  { id: 'photo-1761414884951-8c3c4d9470f7', alt: 'Castelo num penhasco à beira-mar ao pôr do sol' },
  { id: 'photo-1779173851311-25c9f8c3b348', alt: 'Scooter numa estrada costeira com palmeiras' },
  { id: 'photo-1773916481805-8b796da02da3', alt: 'Rua com prédios antigos ao entardecer' },
]

const url = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80`
const TEMPO_POR_FOTO = 5500

// A primeira foto é repetida no fim: assim a última desliza pra "primeira"
// sem voltar correndo pra trás.
const SLIDES = [...FOTOS, FOTOS[0]]

const semAnimacao = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function CarrosselFotos() {
  const [atual, setAtual] = useState(0)
  const [comTransicao, setComTransicao] = useState(true)
  const [pausado, setPausado] = useState(false)

  // Avança sozinho, a não ser que esteja pausado ou a pessoa prefira sem animação
  useEffect(() => {
    if (pausado || semAnimacao()) return
    const timer = setTimeout(() => {
      setComTransicao(true)
      setAtual((i) => i + 1)
    }, TEMPO_POR_FOTO)
    return () => clearTimeout(timer)
  }, [atual, pausado])

  // Chegou na cópia da primeira foto: pula pra original sem animação
  function aoTerminarTransicao(evento: TransitionEvent) {
    // Ignora o fim do zoom das fotos; só interessa o deslize do trilho
    if (evento.target !== evento.currentTarget) return
    if (atual === FOTOS.length) {
      setComTransicao(false)
      setAtual(0)
    }
  }

  const ativa = atual % FOTOS.length

  return (
    <div
      className="carrossel"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
    >
      <div
        className="carrossel-trilho"
        style={{
          transform: `translateX(-${atual * 100}%)`,
          transition: comTransicao ? undefined : 'none',
        }}
        onTransitionEnd={aoTerminarTransicao}
      >
        {SLIDES.map((foto, i) => (
          <div key={i} className="carrossel-slide">
            <img
              src={url(foto.id)}
              alt={i === ativa ? foto.alt : ''}
              className={i === atual ? 'carrossel-foto ativa' : 'carrossel-foto'}
              draggable={false}
            />
          </div>
        ))}
      </div>

      <div className="carrossel-pontos">
        {FOTOS.map((foto, i) => (
          <button
            key={foto.id}
            type="button"
            className={i === ativa ? 'ativo' : undefined}
            aria-label={`Ver foto ${i + 1} de ${FOTOS.length}`}
            aria-current={i === ativa}
            onClick={() => {
              setComTransicao(true)
              setAtual(i)
            }}
          />
        ))}
      </div>
    </div>
  )
}

import { useState } from 'react'
import './mapa.css'

// Google Maps embutido, guardando os últimos mapas abertos.
// Trocar de destino e voltar não baixa o mapa de novo: o iframe antigo só fica escondido.
// Enquanto um mapa novo carrega, aparece um fundo com "Carregando mapa…" em vez da tela branca.
// Uso: <MapaGoogle url={link.embed} titulo="Google Maps: hotéis em Nice" />

type Props = {
  url: string
  titulo: string
}

// Cada mapa do Google pesa na memória: guarda só os últimos 4
const MAXIMO = 4

export default function MapaGoogle({ url, titulo }: Props) {
  const [recentes, setRecentes] = useState<string[]>([url])
  const [carregados, setCarregados] = useState<string[]>([])

  // Mapa novo: entra na lista; o mais antigo sai (e deixa de contar como carregado)
  if (!recentes.includes(url)) {
    const novos = [...recentes.slice(-(MAXIMO - 1)), url]
    setRecentes(novos)
    setCarregados(carregados.filter((u) => novos.includes(u)))
  }

  const carregando = !carregados.includes(url)

  return (
    <div className="mapa-google">
      {recentes.map((u) => (
        <iframe
          key={u}
          src={u}
          title={titulo}
          className={u === url ? 'ativo' : undefined}
          aria-hidden={u === url ? undefined : true}
          tabIndex={u === url ? undefined : -1}
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
          onLoad={() => setCarregados((lista) => (lista.includes(u) ? lista : [...lista, u]))}
        />
      ))}
      {carregando && (
        <div className="mapa-google-carregando" role="status">
          <span className="mapa-google-pino" aria-hidden="true" />
          Carregando mapa…
        </div>
      )}
    </div>
  )
}

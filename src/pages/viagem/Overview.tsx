// Overview: resumo da viagem com o mapa e as bandeirinhas dos destinos.
export default function Overview() {
  return (
    <main className="pagina">
      <h1 style={{ margin: 0 }}>Overview</h1>
      <div className="cartao" style={{ height: 280, display: 'grid', placeItems: 'center' }}>
        [mapa com bandeirinhas nos destinos]
      </div>
      <div className="cartao">Próximo trajeto: [origem → destino]</div>
      <div className="cartao">Orçamento usado: [__]%</div>
      <div className="cartao">Fotos: [_] de 5</div>
    </main>
  )
}

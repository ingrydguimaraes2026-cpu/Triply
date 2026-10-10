// Transportes: trajetos entre destinos, horários e bate-e-volta.
export default function Transportes() {
  return (
    <main className="pagina">
      <h1 style={{ margin: 0 }}>Transportes</h1>
      <div className="cartao">[trajeto: origem → destino · trem/ônibus · horários]</div>
      <div className="cartao">[aviso de bate-e-volta: precisa de +1 diária na base?]</div>
    </main>
  )
}

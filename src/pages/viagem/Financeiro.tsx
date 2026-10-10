// Financeiro: orçamento por categoria, quem pagou o quê e câmbio.
export default function Financeiro() {
  return (
    <main className="pagina">
      <h1 style={{ margin: 0 }}>Financeiro</h1>
      <div className="cartao">[orçamento: transporte · hospedagem · comprinhas]</div>
      <div className="cartao">[quem pagou o quê · quem deve pra quem]</div>
      <div className="cartao">[câmbio: cotação média de compra × cotação de hoje]</div>
    </main>
  )
}

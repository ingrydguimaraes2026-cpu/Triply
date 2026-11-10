// Primeira carga de uma aba da viagem: blocos creme no formato da tela, pulsando de leve
// (no lugar da Norti "Carregando"). Depois da primeira vez a aba abre na hora (src/lib/memoria.ts),
// então isso só aparece uma vez. Igual ao EsqueletoDaAba do app.
// Uso: <Esqueleto forma="contas" />

type Forma = 'viagem' | 'contas' | 'cartoes'

export default function Esqueleto({ forma = 'cartoes' }: { forma?: Forma }) {
  return (
    <div className={`esqueleto esqueleto-${forma}`} role="status" aria-busy="true" aria-label="Carregando">
      {forma === 'viagem' && (
        <>
          <div className="esq-bloco esq-capa" />
          <div className="esq-fila">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="esq-bloco esq-redondo" />
            ))}
          </div>
          <div className="esq-cartao" style={{ height: 200 }} />
          <div className="esq-cartao" style={{ height: 90 }} />
        </>
      )}
      {forma === 'contas' && (
        <>
          <div className="esq-cartao" style={{ height: 168 }} />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="esq-cartao esq-item">
              <span className="esq-bloco esq-avatar" />
              <span className="esq-linhas">
                <span className="esq-bloco" style={{ width: '60%' }} />
                <span className="esq-bloco" style={{ width: '40%' }} />
              </span>
            </div>
          ))}
        </>
      )}
      {forma === 'cartoes' && [0, 1, 2].map((i) => <div key={i} className="esq-cartao" style={{ height: 120 }} />)}
    </div>
  )
}

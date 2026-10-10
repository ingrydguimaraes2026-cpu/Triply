import { Link } from 'react-router'

// Primeiro acesso: a pessoa escolhe os destinos da viagem.
export default function NovaViagem() {
  return (
    <main className="pagina" style={{ maxWidth: 520 }}>
      <h1 style={{ margin: 0 }}>Pra onde vocês vão?</h1>
      <div className="campo">
        <label htmlFor="destino">Adicionar destino</label>
        <input id="destino" type="search" placeholder="Cidade ou país" />
      </div>
      <div className="cartao">[lista de destinos, na ordem]</div>
      <div className="cartao" style={{ background: 'var(--cor-comboio-fundo)' }}>
        Vai viajar com alguém? Convide pro comboio depois. Você é o ADM desta viagem.
      </div>
      <Link to="/viagem/exemplo" className="botao">
        Criar viagem
      </Link>
    </main>
  )
}

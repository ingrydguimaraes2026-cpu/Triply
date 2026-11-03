import { Link, useRouteError } from 'react-router'
import Norti from '../components/ui/Norti'
import SobreOMapa from '../components/ui/SobreOMapa'
import './perdido.css'

// Ponto Nemo: o lugar do oceano mais longe de qualquer terra
const PONTO_NEMO = [{ nome: 'Você está aqui', latitude: -48.88, longitude: -123.39 }]

const textos = {
  naoEncontrada: {
    codigo: '404',
    titulo: 'Você saiu do mapa',
    texto: 'Essa página não existe. Você foi parar no Ponto Nemo, o lugar mais longe de qualquer terra do planeta.',
  },
  erro: {
    codigo: 'Ops',
    titulo: 'Algo deu errado',
    texto: 'Tivemos um problema pra abrir essa tela. Tente de novo em instantes.',
  },
}

// Usada pra endereço que não existe (404) e quando alguma tela quebra.
export default function Perdido({ tipo = 'naoEncontrada' }: { tipo?: keyof typeof textos }) {
  const t = textos[tipo]
  return (
    <SobreOMapa pontos={PONTO_NEMO} zoomMaximo={2.5} centralizado className="perdido">
      <Norti humor={tipo === 'erro' ? 'dormindo' : 'pensando'} tamanho={104} className="perdido-mascote" />
      <p className="perdido-codigo">{t.codigo}</p>
      <h1>{t.titulo}</h1>
      <p className="sobre-mapa-texto">{t.texto}</p>
      <div className="perdido-botoes">
        <Link to="/" className="sobre-mapa-botao">
          Voltar pro início
        </Link>
        {tipo === 'erro' && (
          <button type="button" className="sobre-mapa-botao secundario" onClick={() => window.location.reload()}>
            Tentar de novo
          </button>
        )}
      </div>
    </SobreOMapa>
  )
}

// Quando alguma tela quebra, o React Router mostra isso no lugar
export function ErroNaTela() {
  const erro = useRouteError()
  // Endereço inexistente dentro de uma rota também cai aqui
  const status = (erro as { status?: number } | null)?.status
  return <Perdido tipo={status === 404 ? 'naoEncontrada' : 'erro'} />
}

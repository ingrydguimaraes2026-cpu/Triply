import { Link } from 'react-router'
import PaginaLegal, { EMAIL_CONTATO, RESPONSAVEL } from './PaginaLegal'

// Termos de uso (página pública /termos). Rascunho escrito pelo Claude em 10/11/2026,
// pro Victor revisar antes de mandar o app pras lojas (docs/produto/LANCAMENTO.md, Etapa 1).
export default function Termos() {
  return (
    <PaginaLegal titulo="Termos de uso">
      <p>
        Estes termos explicam como funciona o uso da Norti, o app e o site pra organizar viagens e rolês com a galera. Ao
        criar uma conta ou usar a Norti, você concorda com eles. A Norti é mantida por{' '}
        <span className="legal-a-definir">{RESPONSAVEL}</span>.
      </p>

      <h2>1. O que a Norti faz</h2>
      <p>
        A Norti junta num lugar só o que um grupo precisa pra viajar: destinos, roteiro, votos, passagens, hospedagem,
        gastos divididos, fotos e o passaporte da galera, com os carimbos de cada lugar onde vocês estiveram.
      </p>

      <h2>2. Sua conta</h2>
      <ul>
        <li>Pra organizar uma viagem, você cria uma conta com o Google ou com e-mail e senha.</li>
        <li>Quem recebe um convite pode ver o plano e responder pelo link, sem instalar o app.</li>
        <li>Você precisa ter pelo menos 13 anos. Quem tem menos de 18 usa com o conhecimento dos pais ou responsáveis.</li>
        <li>Cuide da sua senha. O que for feito com a sua conta é responsabilidade sua.</li>
        <li>Informe dados verdadeiros. Não crie conta no nome de outra pessoa.</li>
      </ul>

      <h2>3. O que você coloca na Norti</h2>
      <ul>
        <li>
          Fotos, textos, gastos e tudo o que você adiciona continuam sendo seus. Você só dá à Norti a permissão de guardar
          e mostrar isso pra quem você escolheu (as pessoas da viagem) e de montar com isso a retrospectiva, o mapa e o
          livro da viagem.
        </li>
        <li>O que você posta numa viagem, todo mundo da viagem vê. Gasto marcado como pessoal só você vê.</li>
        <li>
          Não poste o que não é seu, nem nada que ofenda, ameace ou exponha alguém. A gente pode tirar do ar o que
          desrespeitar essas regras.
        </li>
      </ul>

      <h2>4. Dinheiro e reservas</h2>
      <ul>
        <li>
          A Norti faz a conta de quem pagou o quê e de quem deve quem. <strong>O dinheiro nunca passa pela Norti:</strong>{' '}
          os pagamentos são feitos entre vocês, por Pix ou como preferirem.
        </li>
        <li>
          A Norti não é agência de viagem. Passagens e hospedagem são compradas direto nos sites de cada empresa (Airbnb,
          Booking, companhias aéreas e outros), e quem responde pela reserva é a empresa.
        </li>
        <li>O câmbio mostrado é uma referência e pode ser diferente do valor cobrado pelo seu banco ou cartão.</li>
      </ul>

      <h2>5. Documentos de entrada</h2>
      <p>
        A lista de documentos por país é uma ajuda, não uma orientação oficial. As regras mudam: confira sempre na fonte
        oficial que o app mostra junto de cada item.
      </p>

      <h2>6. Preço</h2>
      <p>
        Hoje a Norti é grátis. Se um dia tiver partes pagas, o preço aparece antes de qualquer cobrança, e a cobrança é
        feita pela loja do seu celular (App Store ou Google Play), com as regras de cancelamento da loja.
      </p>

      <h2>7. Uso correto</h2>
      <p>
        Não use a Norti pra mandar spam, enganar pessoas, tentar acessar dados de outras contas ou atrapalhar o
        funcionamento do app. Se isso acontecer, a conta pode ser suspensa.
      </p>

      <h2>8. Disponibilidade</h2>
      <p>
        A gente faz o possível pra Norti funcionar sempre, mas ela pode ficar fora do ar ou mudar. Partes do app podem ser
        criadas, mudadas ou retiradas. Se for algo importante, a gente avisa antes no app.
      </p>

      <h2>9. Excluir a conta</h2>
      <p>
        Você pode excluir sua conta quando quiser, no Perfil do app ou do site. O que é apagado e o que fica pro grupo
        está explicado na <Link to="/privacidade">Política de privacidade</Link>.
      </p>

      <h2>10. Mudanças nestes termos</h2>
      <p>
        Se os termos mudarem de um jeito importante, a gente avisa no app antes de a mudança valer. A data no topo desta
        página mostra a última atualização.
      </p>

      <h2>11. Lei aplicável</h2>
      <p>
        Estes termos seguem as leis do Brasil, incluindo o Código de Defesa do Consumidor e a Lei Geral de Proteção de
        Dados (LGPD).
      </p>

      <h2>12. Fale com a gente</h2>
      <p>
        Dúvidas sobre estes termos: <span className="legal-a-definir">{EMAIL_CONTATO}</span>.
      </p>
    </PaginaLegal>
  )
}

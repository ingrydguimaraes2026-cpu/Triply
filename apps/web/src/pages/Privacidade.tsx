import { Link } from 'react-router'
import PaginaLegal, { EMAIL_CONTATO, RESPONSAVEL } from './PaginaLegal'

// Política de privacidade (página pública /privacidade). Rascunho escrito pelo Claude em 10/11/2026,
// conferido com o que o código faz de verdade (Supabase, login, localização, fotos, avisos,
// função excluir-conta e "Baixar meus dados" da spec 089). O Victor revisa antes das lojas.
export default function Privacidade() {
  return (
    <PaginaLegal titulo="Política de privacidade">
      <p>
        Esta página explica, sem juridiquês, quais dados a Norti guarda, pra quê, com quem eles são divididos e como você
        controla tudo isso. Ela segue a Lei Geral de Proteção de Dados (LGPD). Quem cuida dos seus dados é{' '}
        <span className="legal-a-definir">{RESPONSAVEL}</span>.
      </p>

      <h2>1. O que a Norti guarda</h2>
      <ul>
        <li>
          <strong>Conta:</strong> nome, e-mail e foto de perfil. Se você entra com o Google, eles vêm da sua conta Google.
          Se entra com e-mail e senha, a senha é guardada embaralhada: ninguém da Norti consegue ler.
        </li>
        <li>
          <strong>Viagens:</strong> destinos, datas, roteiro, passagens, hospedagem, votos, gastos, acertos, comentários e
          quem está em cada viagem.
        </li>
        <li>
          <strong>Fotos e posts:</strong> as fotos que você escolhe postar no feed da viagem, com legendas, curtidas e
          comentários.
        </li>
        <li>
          <strong>Carimbos:</strong> qual lugar da viagem foi carimbado e em que dia.
        </li>
        <li>
          <strong>Coisas só suas:</strong> ficha pessoal, documentos de entrada, mala, orçamento pessoal e gastos marcados
          como pessoais. Só você vê, menos o que a própria ficha diz que o grupo vê.
        </li>
        <li>
          <strong>Avisos no celular:</strong> um código do aparelho pra mandar notificações (lembretes, resumo da noite,
          câmbio, novidades do feed), só se você deixar.
        </li>
      </ul>

      <h2>2. Localização</h2>
      <ul>
        <li>
          <strong>No app, só com o app aberto e só se você deixar.</strong> Ela serve pra liberar o carimbo do lugar onde a
          galera está, pra achar o lugar de um rolê e pra mostrar a próxima parada num caminho. A Norti nunca usa sua
          localização com o app fechado.
        </li>
        <li>
          A comparação com os destinos da viagem é feita no próprio celular. A Norti guarda o carimbo (o lugar e o dia), e
          não a sua posição nem o caminho que você fez.
        </li>
        <li>
          Pra descobrir o nome do lugar onde você está, o app manda só as coordenadas, sem nome nem e-mail, pra um serviço
          de mapas.
        </li>
        <li>
          No site existe a opção de mostrar onde você está pro grupo da viagem, por até 8 horas. Ela só liga se você
          escolher, e depois desse tempo a posição é apagada.
        </li>
      </ul>

      <h2>3. Fotos e câmera</h2>
      <p>
        A Norti só abre a galeria ou a câmera quando você toca pra postar uma foto, e só envia as fotos que você escolher.
      </p>

      <h2>4. Gmail (opcional, só no site)</h2>
      <p>
        Se você conectar seu Gmail na carteira da viagem, a Norti lê só os e-mails da Wise e da Nomad, pra lançar os
        movimentos da sua carteira sem você digitar. Nenhum outro e-mail é lido. Dá pra desconectar quando quiser, e a
        permissão é apagada.
      </p>

      <h2>5. Quem vê o quê</h2>
      <ul>
        <li>Quem está numa viagem vê o que é daquela viagem. Quem não está, não vê.</li>
        <li>Gasto pessoal, ficha, documentos e mala são só seus.</li>
        <li>
          Quem tem o link de convite vê uma prévia da viagem (nome, datas, destinos e o primeiro nome de quem vai) e pode
          responder. Mande o link só pra quem vai junto.
        </li>
        <li>Essas regras ficam no próprio banco de dados, não só na tela.</li>
      </ul>

      <h2>6. Com quem os dados são divididos</h2>
      <p>
        <strong>A Norti não vende seus dados, não mostra anúncios e não usa ferramentas de rastreamento.</strong> Pra
        funcionar, ela usa alguns serviços de outras empresas, que recebem só o necessário:
      </p>
      <ul>
        <li>
          <strong>Supabase:</strong> guarda o banco de dados, o login e as fotos.
        </li>
        <li>
          <strong>Vercel:</strong> hospeda o site.
        </li>
        <li>
          <strong>Google:</strong> quando você entra com o Google ou conecta o Gmail.
        </li>
        <li>
          <strong>Expo:</strong> entrega os avisos no celular.
        </li>
        <li>
          <strong>Anthropic:</strong> quando você manda o print ou o PDF de uma reserva pra virar item do dia, o arquivo é
          lido por esse serviço de inteligência artificial só pra tirar as informações da reserva.
        </li>
        <li>
          <strong>Serviços públicos de mapas, clima e câmbio</strong> (como OpenStreetMap, Photon, BigDataCloud, Open-Meteo
          e Frankfurter): recebem só o que a busca precisa, como o nome de uma cidade ou coordenadas, nunca seu nome ou
          e-mail.
        </li>
      </ul>
      <p>
        Alguns desses serviços ficam fora do Brasil. Nesses casos, os dados são enviados com as proteções que a LGPD pede.
      </p>

      <h2>7. Por que a Norti usa seus dados</h2>
      <ul>
        <li>Pra o app funcionar como você espera: guardar suas viagens e mostrar pro seu grupo.</li>
        <li>
          Localização, avisos no celular, câmera, galeria e Gmail: só com a sua permissão. Você pode tirar a permissão
          quando quiser, nos ajustes do celular ou no app.
        </li>
        <li>Pra manter a Norti segura e resolver problemas.</li>
      </ul>

      <h2>8. Seus direitos</h2>
      <ul>
        <li>
          <strong>Ver e baixar seus dados:</strong> no Perfil do site, em "Baixar meus dados", você recebe um arquivo com
          tudo o que é seu.
        </li>
        <li>
          <strong>Corrigir:</strong> nome e foto mudam no Perfil. O resto muda dentro de cada viagem.
        </li>
        <li>
          <strong>Excluir a conta:</strong> no Perfil, no app ou no site (veja o que acontece logo abaixo).
        </li>
        <li>
          <strong>Tirar uma permissão</strong> que você deu, a qualquer hora.
        </li>
        <li>
          <strong>Reclamar</strong> na Autoridade Nacional de Proteção de Dados (ANPD), se achar que algo está errado.
        </li>
      </ul>

      <h2>9. Quando você exclui a conta</h2>
      <ul>
        <li>Você sai de todas as viagens. Se for o único ADM de uma viagem, o ADM passa pra quem entrou primeiro.</li>
        <li>Viagem em que só você está é apagada.</li>
        <li>
          Ficha, documentos, mala, orçamento pessoal, carteira, Gmail conectado, avisos no celular e gastos pessoais são
          apagados.
        </li>
        <li>
          Gastos divididos, fotos e posts continuam pro grupo, com o nome "Conta excluída", pra não bagunçar as contas de
          ninguém.
        </li>
        <li>O login é desativado e o seu e-mail deixa de aparecer.</li>
        <li>Não dá pra desfazer. Se quiser, baixe seus dados antes.</li>
      </ul>
      <p>Cópias de segurança do banco podem guardar esses dados por alguns dias, até serem substituídas.</p>

      <h2>10. Por quanto tempo</h2>
      <p>Os dados ficam guardados enquanto a sua conta existir, ou até você apagar cada coisa.</p>

      <h2>11. Segurança</h2>
      <p>
        Tudo trafega com conexão criptografada. O banco de dados só deixa cada pessoa ver o que é dela ou das viagens em
        que ela está.
      </p>

      <h2>12. Crianças</h2>
      <p>A Norti não é feita pra menores de 13 anos.</p>

      <h2>13. Mudanças nesta política</h2>
      <p>
        Se esta política mudar de um jeito importante, a gente avisa no app. Veja também os{' '}
        <Link to="/termos">Termos de uso</Link>.
      </p>

      <h2>14. Fale com a gente</h2>
      <p>
        Pra qualquer pedido sobre seus dados: <span className="legal-a-definir">{EMAIL_CONTATO}</span>.
      </p>
    </PaginaLegal>
  )
}

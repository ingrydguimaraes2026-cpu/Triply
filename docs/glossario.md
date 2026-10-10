# Glossário

Palavras que vão aparecer bastante, explicadas sem complicação. Se aparecer uma nova, peça pro Claude adicionar aqui.

## Projeto e código

| Palavra | O que é |
|---|---|
| **Front-end** | A parte que a pessoa vê e clica: telas, botões, cores. É a "vitrine da loja". |
| **Back-end** | A parte que guarda e protege os dados. É o "estoque e o cofre" da loja. Aqui quem faz esse papel é o Supabase. |
| **Componente** | Uma peça de tela reaproveitável, como um bloco de Lego. Ex.: o `Cartao` é usado em várias telas. |
| **Rota** | O endereço de uma tela. `/login` é a rota da tela de login. A lista fica em `src/router.tsx`. |
| **Página / tela** | Arquivo em `src/pages/` que monta o que aparece num endereço. |
| **Hook** | Uma função do React que "pega" algo pra tela usar. Ex.: `useViagemAtual()` pega os dados da viagem aberta. Sempre começa com `use`. |
| **Estado (state)** | Uma informação que a tela lembra e que, quando muda, faz a tela se redesenhar. Ex.: o que está digitado num campo. |
| **CSS** | O arquivo que diz as cores, tamanhos e espaçamentos. É a "roupa" da tela. |
| **TypeScript** | JavaScript com etiquetas. Avisa antes de rodar quando você usa um dado do jeito errado (ex.: texto onde devia ser número). |
| **npm** | O "app store" das peças de código. `npm install` baixa as peças que o projeto usa. |
| **localhost** | O seu próprio computador fingindo ser um site. Só você vê. Endereço: http://localhost:5173 |
| **Build** | Empacotar o site na versão final, otimizada. `npm run build` também confere se tem erro. |
| **Lint** | Um "corretor ortográfico" de código. `npm run lint` aponta problemas comuns. |
| **PWA** | Site que pode ser "instalado" no celular e parece um app, sem passar pela loja de apps. |
| **API** | Uma porta pra pedir informação pra outro sistema. Ex.: pedimos pra API do Photon "onde fica o Lago di Como?". |
| **`.env.local`** | Arquivo com as chaves secretas do projeto. Nunca vai pro GitHub. Peça pro Victor. |

## Banco de dados (Supabase)

| Palavra | O que é |
|---|---|
| **Supabase** | O serviço que guarda os dados, faz o login e guarda as fotos. Nosso back-end pronto. |
| **Tabela** | Uma planilha dentro do banco. Ex.: `viagens`, `gastos`. Cada linha é um item, cada coluna um campo. |
| **Migration** | Um arquivo com instruções pra criar ou mudar tabelas. Fica em `supabase/migrations/`. Nunca se edita uma antiga: cria-se uma nova. |
| **RLS** | "Quem pode ver o quê", direto no banco. Ex.: só quem está no comboio vê a viagem. Mesmo que a tela erre, o banco não deixa vazar. |
| **Storage** | A "pasta de arquivos" do Supabase, onde as fotos ficam guardadas. |
| **Comboio** | O grupo de pessoas de uma viagem. Tabela `comboio_membros`. |
| **ADM** | Quem organiza a viagem. Pode editar destinos, trajetos, orçamento e convidar gente. |

## Git e GitHub

| Palavra | O que é |
|---|---|
| **Git** | O "histórico de versões" do projeto. Guarda cada mudança e deixa voltar no tempo. |
| **GitHub** | O site onde o projeto fica guardado na nuvem e onde a gente revisa o trabalho um do outro. |
| **Commit** | Salvar um ponto no histórico, como "salvar o jogo". Vem com uma mensagem dizendo o que mudou. |
| **Push** | Mandar seus commits do computador pro GitHub. |
| **Pull** | Trazer do GitHub o que os outros mandaram. |
| **Branch** | Uma "cópia paralela" do projeto pra trabalhar sem mexer na versão oficial. A sua é a `dev-ingryd`. |
| **main** | A branch oficial. Ninguém mexe direto nela. |
| **Pull Request (PR)** | Pedir pra alguém conferir seu trabalho antes de juntar na `main`. |
| **Merge** | Juntar uma branch na outra (ex.: sua branch na `main`, depois do PR aprovado). |

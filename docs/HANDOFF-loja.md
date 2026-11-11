# HANDOFF — Pronto pra loja (Etapa 1 do LANCAMENTO)

Atualizado: 10/11/2026. Plano geral em [`produto/LANCAMENTO.md`](produto/LANCAMENTO.md).

## O que ficou pronto (código)

- **Páginas públicas `/termos` e `/privacidade`** no site (`apps/web/src/pages/Termos.tsx`,
  `Privacidade.tsx` e a moldura `PaginaLegal.tsx`). Abrem sem login, a 360px e no desktop.
  O texto é **rascunho** (faixa no topo) e foi conferido com o que o código faz de verdade.
- **Login liga nas duas páginas:** no site (`apps/web/src/pages/Login.tsx`, link interno) e no app
  (`apps/mobile/app/login.tsx`, abre o site no navegador do celular).
- **Excluir conta dentro do app:** Perfil → "Excluir minha conta" (`apps/mobile/src/ui/ExcluirConta.tsx`).
  Mesma função `excluir-conta` do site, com a lista do que acontece e "escreva EXCLUIR".
  Testado em 10/11 com uma conta `teste+…@teste.norti.app` no Expo web: a conta saiu
  (`deleted_at` preenchido, e-mail embaralhado, nome "Conta excluída") e o app voltou pro começo.
- **Avisos do app na exclusão:** a função do banco (`excluir_meus_dados`) apaga os avisos do site
  (`push_inscricoes`), mas esquecia os do app (`push_expo`). O app e o site agora apagam esses
  avisos antes de chamar a função.
- **`apps/mobile/eas.json`** com 3 perfis:
  - `development`: build com o "dev client", só pra quem desenvolve, com o modo teste ligado;
  - `preview`: instalação interna (APK no Android), com o modo teste ligado;
  - `production`: o que vai pra loja (TestFlight e Google), **sem** modo teste, versão sobe sozinha.

## Contas das lojas no CNPJ (decidido pelo Victor em 10/11)

As contas da Apple e do Google ficam no CNPJ do Victor (conta de empresa, com o número D-U-N-S).
O que isso muda aqui:

- **Entrar com Apple e a build de produção esperam a conta de empresa da Apple**, que depende do
  D-U-N-S (pedido em 10/11; demora alguns dias). Até lá, dá pra testar no Expo Go e no Expo web.
- **Google:** com conta de empresa, não precisa do teste fechado de 12 pessoas por 14 dias.
- **Apple:** pede um site público ligado à empresa. As páginas `/termos` e `/privacidade` ajudam
  nisso, desde que o nome da empresa e o e-mail de contato (item 2 abaixo) estejam preenchidos.

## O que falta o Victor decidir ou fazer

1. **Identificador do app** (`ios.bundleIdentifier` e `android.package` no `apps/mobile/app.json`).
   **Não muda depois.** Sugestão: `app.norti`. Ainda não foi gravado: esperando a resposta.
2. **Preencher na página** (`apps/web/src/pages/PaginaLegal.tsx`, constantes no topo):
   - `RESPONSAVEL`: razão social e CNPJ da empresa (as contas das lojas vão no CNPJ, decidido em 10/11);
   - `EMAIL_CONTATO`: e-mail de contato e de pedidos sobre dados (LGPD).
   Depois, revisar o texto inteiro e tirar a faixa "Rascunho a revisar".
3. **Ligar o EAS** (precisa da conta da Expo):
   ```bash
   cd apps/mobile
   npx eas-cli login
   npx eas-cli init          # grava o projectId no app.json (os avisos do app precisam dele)
   ```
   Variáveis do Supabase no EAS (o `.env` não sobe pra build na nuvem). Uma vez por ambiente
   (`development`, `preview`, `production`), com os mesmos valores do `apps/mobile/.env`:
   ```bash
   npx eas-cli env:create --environment production --name EXPO_PUBLIC_SUPABASE_URL --value <url> --visibility plaintext
   npx eas-cli env:create --environment production --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value <chave publicável> --visibility plaintext
   ```
   O perfil `development` precisa do pacote `expo-dev-client` (`npx expo install expo-dev-client`).
   Pra TestFlight e teste interno do Google, use o `production`.
4. **"Confirm email"**: decidir (ver `HANDOFF-contas-de-teste.md`).
5. **Gmail na política:** a carteira lê o Gmail (escopo de leitura). O Google trata esse escopo como
   "restrito": pra abrir pro público, a tela de consentimento do Google precisa de verificação
   (pode pedir auditoria de segurança). Se não for usar no lançamento, melhor esconder.

## Entrar com Apple (levantamento, não implementado)

Por que: a regra 4.8 da App Store pede, pra app com "Entrar com Google", uma opção de login que
proteja a privacidade (só nome e e-mail, e-mail escondido, sem rastreio). "Entrar com Apple"
cumpre. O e-mail e senha da própria Norti talvez bastem, mas não é garantido: o revisor costuma pedir.
Só no iPhone. No Android a regra não vale.

**Na conta de desenvolvedor da Apple** (precisa existir antes de tudo):
- No App ID do app (o mesmo identificador do item 1), ligar a capacidade **Sign in with Apple**.
  Se a build for pelo EAS com as credenciais gerenciadas por ele, o EAS sincroniza isso sozinho.
- Em Services, configurar o **"Sign in with Apple for Email Communication"** com o domínio que manda
  e-mail (o do Supabase ou o próprio): sem isso, quem esconde o e-mail não recebe nada da Norti.
- Só se quiser Apple também no **site**: criar um Services ID, apontar a volta pra
  `https://ltygqabtdbphtjscvuit.supabase.co/auth/v1/callback`, criar uma chave `.p8` e gerar o
  segredo. **Esse segredo vence a cada 6 meses** (lembrete no calendário). Só no app, não precisa.

**No Supabase** (Authentication → Sign In / Providers → Apple):
- Ligar o Apple e colocar o identificador do app em **Client IDs**. Se um dia tiver o Services ID
  do site, ele vai **primeiro** na lista, e o do app depois.

**No app** (`apps/mobile`):
- Pacote `expo-apple-authentication` (`npx expo install expo-apple-authentication`), o plugin
  `"expo-apple-authentication"` em `plugins` e `"usesAppleSignIn": true` dentro de `ios` no `app.json`.
- Botão oficial `AppleAuthenticationButton` na tela de login, só quando
  `AppleAuthentication.isAvailableAsync()` for verdade (iPhone).
- `AppleAuthentication.signInAsync({ requestedScopes: [FULL_NAME, EMAIL] })` e depois
  `supabase.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken })`.
- **O nome só vem no primeiro login.** O gatilho que cria o perfil lê `full_name` na hora do
  cadastro, e nessa hora o nome ainda não chegou: depois do login, gravar o nome em `perfis.nome`
  (e em `supabase.auth.updateUser({ data: { full_name } })`). Senão o perfil fica com o pedaço do e-mail.
- **Excluir conta com Apple:** a Apple pede que, ao excluir a conta, o acesso seja revogado na Apple
  (`https://appleid.apple.com/auth/revoke`). A função `excluir-conta` ainda não faz isso. Precisa
  guardar o código de autorização no login e revogar na exclusão (isso exige o segredo da `.p8`).
- Testar num iPhone de verdade (build de desenvolvimento ou TestFlight). No Expo Go dá pra testar,
  mas com o identificador do Expo Go, não o da Norti.

## Conserto pendente no banco (pedir confirmação antes)

- `excluir_meus_dados()` não apaga `push_expo` (os avisos do app). App e site já apagam antes de chamar,
  mas o certo é a função do banco também apagar: migration nova com
  `delete from public.push_expo where usuario_id = eu;` dentro da função.
- O site (`MinhaPrivacidade.tsx`) mostra uma mensagem genérica quando a função recusa (ex.: "só sobram
  convidados"), porque lê `data.erro`, que vem vazio em resposta de erro. O app já lê a mensagem certa.

## Cuidados

- Os botões de conta de teste no login aparecem nos perfis `development` e `preview`
  (`EXPO_PUBLIC_MODO_TESTE=1`). Nunca ligar no `production`.
- Não rodei nenhuma build nem criei conta em loja.

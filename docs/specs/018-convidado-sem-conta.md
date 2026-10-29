# 018. Convidado sem conta

**Fase:** 2 · **Tamanho:** M · **Depende de:** 007 · **Status:** Em andamento

## Objetivo
Quem recebe o link do convite entra na viagem só digitando o nome: sem e-mail, sem senha e sem instalar nada. Depois, se quiser, cria a conta e não perde nada do que já fez.

## Por que
- **Pesquisa de mercado (out/2026):** ter que criar conta é o motivo de abandono mais citado contra Splitwise, Wanderlog e Polarsteps. Tricount, Splid e TREK deixam entrar só com o nome, e é isso que as pessoas elogiam.
  - Ver `reports/Mercado de apps de viagem em grupo.md` e o catálogo, item F2.
- **Viagem em família é 59,1% dos casos** (pesquisa Imaginadora). A tia ou o avô não vão criar conta só pra ver o roteiro.
- **Hoje** o link do convite manda pro login antes (`RotaProtegida`). Quem desiste ali nunca entra no comboio, e o organizador volta a mandar tudo pelo WhatsApp.

## Como funciona (ideia central)
Usamos o **login anônimo do Supabase** (`signInAnonymously`):
- **Cria uma conta de verdade, só que sem e-mail.** O convidado ganha um `id` igual ao de qualquer pessoa e vira membro normal do comboio. Todas as tabelas e regras (RLS) continuam funcionando sem mudar.
- **Criar a conta depois mantém o mesmo `id`.** Nada precisa ser migrado: os gastos, votos e fotos já estão no nome dele.
  - Por e-mail: `updateUser({ email })` e depois a senha.
  - Pelo Google: `linkIdentity({ provider: 'google' })`.

Comparação do dia a dia: é como entrar numa festa com uma pulseirinha de visitante. Você aproveita tudo; se quiser voltar outro dia, troca a pulseira pelo cartão de sócio e o seu histórico continua lá.

## Inclui
- **Tela do convite nova** (`/convite/<código>`), web e mobile:
  - **Prévia da viagem antes de entrar:** capa, nome, datas, destinos e quem já está no comboio (iniciais e primeiro nome).
  - **Sem login:** campo "Como te chamam?" e o botão **"Entrar na viagem"**. Embaixo, o link "Já tenho conta" leva ao login normal e depois volta pro convite.
  - **Com login:** só o botão "Entrar na viagem", igual a hoje.
- **Convidado dentro da viagem:**
  - Vê e usa tudo que um membro usa: roteiro, transportes, hospedagem (inclusive votar), financeiro (lançar gasto, ver saldo), fotos e documentos.
  - **Faixa discreta no topo:** "Você está como convidado. Crie sua conta pra não perder o acesso." O botão "Criar conta" abre as opções Google e e-mail com senha.
- **Transformar em conta:**
  - **Google:** liga a identidade Google ao mesmo usuário.
  - **E-mail e senha:** manda o link de confirmação; ao confirmar, a pessoa define a senha.
  - Depois disso a faixa some e a pessoa vira usuária normal.
- **Perfil do convidado:** dá pra mudar o nome. A tela "Minhas viagens" mostra só a viagem do convite.
- **"Ex-convidado":** se o convidado nunca criar conta e perder o acesso (limpou o navegador ou trocou de celular), o que ele lançou continua na viagem com o nome dele. Igual a quem sai do comboio (decisão da 007).

## Não inclui (fica pra depois)
- **Pessoa sem app** (a avó, a criança: membro que nunca entra e o ADM lança por ela). Esse é o item F3 do catálogo e terá uma spec própria. Precisa de uma tabela de "participantes" separada de `perfis`.
- Recuperar o acesso de um convidado que perdeu a sessão. Sem e-mail, não há como provar quem ele é. O ADM pode mandar um convite novo.
- Convidado criando viagem própria. Ele precisa criar conta antes.
- Boletim do câmbio no celular (push) e saldo por e-mail pro convidado. Exigem conta.
- Limpeza automática de convidados abandonados.

## Telas
- **Convite (`/convite/:codigo`):**
  - **Carregando:** a Malinha e "Abrindo o convite…".
  - **Convite inválido ou expirado:** a mesma mensagem de hoje, com o botão "Criar minha viagem".
  - **Prévia + nome:** se o nome ficar vazio, o botão fica desabilitado.
  - **Erro ao entrar** (sem internet): "Não deu pra entrar. Confira a internet e tente de novo."
- **Faixa de convidado:** no topo do dashboard da viagem (web) e na home/abas (mobile). Some depois de criar a conta.
- **Criar conta (convidado):** pode ser uma folha (sheet) ou modal reaproveitando o visual do login, sem a aba "Entrar".
- **Perfil:** no lugar de "Sair", o convidado vê "Criar conta". O "Sair" do convidado avisa: "Você vai perder o acesso a esta viagem. Crie uma conta antes?"

## Dados
- **Nenhuma tabela nova.** O convidado é um `auth.users` com `is_anonymous = true`. O perfil é criado pelo trigger `criar_perfil` que já existe.
- **Migration nova:**
  1. **`ver_convite(p_codigo)`** (`security definer`, liberada pra `anon`). Devolve só o necessário pra prévia: nome da viagem, datas, destinos, primeiros nomes do comboio e se o convite vale. Hoje um não-membro não consegue ler a viagem, por causa da RLS.
  2. **`aceitar_convite(p_codigo, p_nome default null)`.** Se vier nome e o perfil estiver sem nome, grava o nome. Continua exigindo `auth.uid()` (o anônimo tem).
  3. **Convidado não vira ADM.** Ajustar o trigger ou a função da 007 pra recusar `papel = 'adm'` quando o usuário for anônimo, olhando `auth.users.is_anonymous`.
  4. **Convidado não cria viagem.** Política de insert em `viagens` (e na RPC de criar) recusa quando `(auth.jwt() ->> 'is_anonymous')::boolean` for verdadeiro.
- **Config do Supabase (Victor faz no painel, não é migration):**
  - Authentication → Sign In / Providers → ligar **"Allow anonymous sign-ins"**.
  - Authentication → ligar **"Manual linking"**, que é o que permite o `linkIdentity` do Google.
  - Recomendado: **CAPTCHA** (Turnstile) pro login anônimo, pra ninguém criar milhares de contas falsas. Pode ser depois do teste local.
- **Tipos:** depois da migration, gerar de novo `packages/core/src/database.ts`.

## Quem pode o quê
| Ação | ADM | Membro | Convidado |
|---|---|---|---|
| Ver a prévia do convite | sim | sim | sim (até sem login) |
| Ver e usar as abas da viagem | sim | sim | sim |
| Lançar gasto, votar, postar foto | sim | sim | sim |
| Editar roteiro, orçamento, convites | sim | não | não |
| Virar ADM | — | sim | **não** (precisa criar conta) |
| Criar viagem nova | sim | sim | **não** |
| Receber push / saldo por e-mail | sim | sim | não |
| Criar conta sem perder dados | — | — | sim |

## Critérios de aceite
- [ ] Numa janela anônima do navegador, abrir `/convite/<código>` mostra a prévia (nome, datas, destinos, quem vai) **sem** pedir login.
- [ ] Digitar "Tia Rosa" e tocar em "Entrar na viagem" abre a viagem, e "Tia Rosa" aparece no Comboio como membro.
- [ ] A Tia Rosa lança um gasto de €20 dividido com todos. O ADM vê o gasto e o saldo certo.
- [ ] A Tia Rosa vota numa hospedagem e o voto aparece pro ADM.
- [ ] A faixa "Você está como convidado" aparece. Tocar em "Criar conta" com Google mantém tudo: o gasto e o voto continuam no nome dela, e a faixa some.
- [ ] O mesmo vale criando conta por e-mail e senha.
- [ ] Mesmo chamando o banco direto, o ADM não consegue tornar um convidado ADM.
- [ ] Mesmo chamando o banco direto, o convidado não consegue criar viagem.
- [ ] Um código inválido mostra "Convite inválido" na prévia, sem criar usuário anônimo.
- [ ] Quem já tem login e abre o convite entra direto, como hoje.
- [ ] Funciona no web (360px e desktop) e no app mobile.
- [ ] `npm run build`, `npm run lint` e os testes passam.

## Perguntas em aberto
1. **O convidado pode apagar ou editar gastos?** Sugestão: igual ao membro, só os que ele lançou.
2. **O ADM deve saber quem é convidado?** Sugestão: um selo "convidado" na lista do Comboio, pra ele lembrar a pessoa de criar conta.
3. **Ligar o CAPTCHA já no primeiro PR ou depois?** Sugestão: depois do teste local, antes de publicar.
4. **O que acontece com o convidado se o convite expirar?** Sugestão: nada. Ele já é membro, e o convite só serve pra entrar.

## Dicas pra implementar
- **Web:**
  - `src/pages/Convite.tsx` sai de dentro da `RotaProtegida` e cuida sozinho dos dois casos.
  - `src/features/comboio/api.ts` ganha `verConvite` e o parâmetro de nome no `aceitarConvite`.
  - `useSessao` deve expor `ehConvidado = sessao?.user.is_anonymous`.
- **Mobile:**
  - A rota `convite/[codigo].tsx` entra em `PUBLICAS` no `_layout.tsx`.
  - O porteiro deixa o convidado passar.
  - O `entrarComGoogle` ganha uma versão `ligarGoogle` com `linkIdentity`.
- **Core:**
  - `verConvite` e `aceitarConvite` ficam em `packages/core/src/dados.ts`, pra web e mobile usarem as mesmas.
- **Armadilhas:**
  - O trigger `criar_perfil` grava `nome = null` pro anônimo, porque não tem e-mail. Por isso o nome vem no `aceitar_convite`.
  - Testar o `linkIdentity` com "Manual linking" ligado. Se o e-mail do Google já tiver outra conta, o Supabase recusa. Mostrar: "Esse Google já tem conta. Entre com ele e use o convite de novo."
  - Sessão anônima mora no `localStorage` (web) e no `SecureStore`/`AsyncStorage` (mobile). Limpar isso apaga o acesso, e por isso a faixa precisa existir.
- **Referência de produto:** Tricount e Splid (entrar só com nome); TREK (convidado sem login).

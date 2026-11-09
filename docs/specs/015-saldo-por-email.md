# 015. Saldo da viagem por e-mail (Wise e Nomad)

**Fase:** 3 · **Tamanho:** G · **Depende de:** 002, 003, 013 · **Status:** A fazer

## Objetivo
Cada pessoa conecta o Gmail uma vez e o app passa a ler sozinho os e-mails de transação do Wise e do Nomad ("você gastou 20 EUR", "você recebeu…"). Com isso o app mostra o **saldo em euro de cada um** na viagem e a lista de movimentos, sem ninguém digitar gasto a gasto.

## Por que
Ideia do Victor e da Ingryd (out/2026), já estava guardada na Fase 3. A API oficial dos bancos é burocrática, mas **todo gasto no cartão gera um e-mail na hora**. Lendo esse e-mail a gente tem o movimento sem depender de API de banco. Resolve a preguiça de lançar gasto manual e dá uma noção real de quanto euro ainda tem.

## Como vai funcionar (decisões já tomadas)
- **Gmail API oficial**, escopo **só leitura** (`gmail.readonly`).
- Tela de consentimento **"External" em modo Testing**. Consequência aceita: o Google derruba o acesso **a cada 7 dias**, então a pessoa reconecta o Gmail toda semana. Tudo bem pra uma viagem curta e pro comboio pequeno (limite de 100 usuários de teste).
- Rastreia **saldo + gastos**: a pessoa informa um **saldo inicial** da conta e cada e-mail soma (entrada) ou subtrai (gasto). Tem um botão pra **ajustar o saldo** na mão quando desencontrar.
- A leitura roda no **servidor** (Supabase Edge Function + pg_cron), igual ao `boletim-cambio`. O celular não lê e-mail; MCP/agente de dev não entra aqui.

## Inclui
- **Conectar Gmail:** botão na viagem → consentimento do Google → o app guarda o acesso (refresh token) daquela pessoa.
- **Carteira por pessoa na viagem:** saldo inicial + moeda (começa com EUR), saldo atual calculado.
- **Leitura automática:** a cada ~15 min o servidor busca e-mails novos do Wise e do Nomad, extrai valor/moeda/data/descrição e grava como movimento.
- **Lista de movimentos:** entradas e gastos, mais novo primeiro, com origem (Wise/Nomad).
- **Ajuste manual de saldo:** corrige o saldo quando um e-mail não chegou ou veio errado.
- **Desconectar:** apaga o token guardado e para de ler. Opção de apagar também os movimentos importados.
- **Só a própria pessoa** vê e mexe na carteira dela; o comboio vê o total de euro do grupo (soma dos saldos), sem o detalhe dos movimentos dos outros.

## Não inclui (fica pra depois)
- Virar esses movimentos em `gastos` da viagem com divisão entre o comboio (pra não contar em dobro com o lançamento manual). Fica como "promover movimento a gasto" numa próxima.
- Publicar a tela de consentimento (sair do Testing) e a auditoria de segurança do Google (CASA).
- Outros bancos além de Wise e Nomad.
- Aviso no celular a cada transação nova (pode entrar depois, reaproveitando o push da 013).
- Multimoeda de verdade: por ora conta só a moeda da carteira (EUR); transação em outra moeda é ignorada ou só listada.
- Ler anexos, PDF de fatura ou extrato — só o corpo do e-mail de transação.

## Telas
- **Financeiro → aba/box "Minha carteira":**
  - sem conexão: cartão "Conectar Gmail pra puxar os gastos do Wise/Nomad" + campo de saldo inicial;
  - conectado: saldo atual grande, "atualizado há X min", lista de movimentos, botões "Ajustar saldo" e "Desconectar";
  - no topo do financeiro do grupo: "Euro do comboio: € X" (soma das carteiras).
- **Conectar (fluxo):** abre o Google, volta pro app, mostra "Gmail conectado ✓" e a data em que o acesso expira (7 dias).
- **Estados:** vazio (sem conexão), carregando, erro ("Não deu pra ler agora, tenta de novo"), e **expirado** ("Reconecte o Gmail") quando o Google derrubar o acesso.

## Dados
- **`carteiras`** (nova): `viagem_id`, `usuario_id`, `moeda` (default EUR), `saldo_inicial`, `criado_em`. Uma por pessoa por viagem. RLS: só o dono lê/escreve; o comboio vê o saldo agregado por uma função/`view`.
- **`movimentos_carteira`** (nova): `carteira_id`, `tipo` (`entrada` | `gasto`), `valor`, `moeda`, `descricao`, `data`, `provedor` (`wise` | `nomad`), `gmail_message_id` (único por carteira, pra não duplicar), `criado_em`.
- **`conexoes_gmail`** (nova): `usuario_id`, `email`, `refresh_token` (**criptografado via Supabase Vault / pgsodium — nunca exposto ao cliente**), `expira_em`, `ultimo_sync`, `status`. RLS nega leitura ao cliente; só a Edge Function (service role) lê o token. O cliente só enxerga `email`/`status`/`expira_em`.
- **Edge Functions (novas):**
  - `conectar-gmail`: recebe o `code` do OAuth, troca pelos tokens (usa o client secret, por isso é no servidor), guarda o refresh token.
  - `ler-carteiras`: chamada pelo pg_cron. Pra cada conexão ativa: renova o access token, chama a Gmail API (`messages.list` com `q=from:(wise.com OR nomadglobal.com) newer_than:2d`), pega os e-mails ainda não vistos pelo `gmail_message_id`, roda o parser e grava os movimentos.
  - `desconectar-gmail`: revoga o token no Google e apaga a conexão.
- **Parser** (`supabase/functions/_shared/carteira/parsers.ts`): um por provedor, por regex no assunto/corpo. Guarda **só** valor, moeda, sinal, data e uma descrição curta — **nunca o corpo inteiro do e-mail**.
- **Reaproveita:** o padrão de `boletim-cambio` (pg_cron → `net.http_post` → Edge Function) e a cotação Frankfurter da 003, se precisar converter.

## Quem pode o quê
| Ação | ADM | Membro | Dono da carteira |
|---|---|---|---|
| Conectar/desconectar o próprio Gmail | — | — | sim |
| Ver os movimentos da carteira | não | não | sim |
| Ver o saldo agregado do comboio (€ total) | sim | sim | sim |
| Ajustar o próprio saldo | — | — | sim |

## Critérios de aceite
- [ ] Conectar o Gmail: abre o Google, volta pro app e mostra "conectado ✓" com a data de expiração (7 dias).
- [ ] Com saldo inicial de € 500 e um e-mail do Wise "você gastou € 20", o saldo vira € 480 e aparece 1 movimento.
- [ ] Rodar a leitura duas vezes seguidas **não duplica** o mesmo movimento (dedup por `gmail_message_id`).
- [ ] Outra pessoa do comboio **não** vê meus movimentos, mas vê o "Euro do comboio" somado.
- [ ] "Ajustar saldo" corrige o saldo atual e fica registrado.
- [ ] "Desconectar" para de ler e some o cartão de carteira.
- [ ] Quando o Google derruba o acesso, o app mostra "Reconecte o Gmail" em vez de erro genérico.
- [ ] O `refresh_token` **não** aparece em nenhuma resposta da API pro cliente (checar no painel de rede).

## Perguntas em aberto
- **Wise entrada:** confirmado com e-mail real (`noreply@wise.com`, corpo "Você adicionou 20 EUR à sua conta."). Já implementado e testado.
- **Wise gasto:** ainda sem amostra real do e-mail de compra ("você gastou/pagou"). O padrão está ativo mas provisório — confirmar quando aparecer uma compra.
- **Nomad:** ainda sem amostra (o Victor não tem conta). Fica dormente (não processa) até ter um e-mail real.
- Transação **em outra moeda** (ex.: comprou em libra com conta em euro): ignora, só lista, ou converte pela Frankfurter? (sugestão: v1 ignora no saldo e só lista.)
- E-mail de **estorno/reembolso**: tratar como entrada? (sugestão: sim.)
- Onde guardar o **client secret** do Google (segredo da Edge Function, igual ao `VAPID_PRIVATE_KEY`).
- Apagar os movimentos ao desconectar é **opcional** (perguntar) ou sempre apaga?

## Dicas pra implementar
- OAuth de SPA: abrir o consentimento com `access_type=offline&prompt=consent` pra garantir o refresh token; a troca `code → tokens` tem que ser na Edge Function (precisa do client secret).
- Gmail API: `users.messages.list` com `q` por remetente e `newer_than`, depois `users.messages.get` só dos ids novos. Guardar o maior `historyId`/data pra não reprocessar tudo.
- Segurança: token **só** no servidor (Vault), RLS fechada na `conexoes_gmail`, e deixar claro na tela o que o app lê e por quê.
- Parser frágil por natureza: isolar por provedor, cobrir com teste em cima de e-mails de exemplo salvos (sem dados reais no repo), e ter o "ajustar saldo" como rede de segurança.

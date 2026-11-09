# 021. Enquete rápida

**Fase:** 2 · **Tamanho:** P · **Depende de:** 007 · **Status:** Em andamento

## Objetivo
Qualquer um do comboio faz uma pergunta com opções pra decidir junto: "que dia a gente vai?", "qual restaurante na sexta?", "praia ou trilha?". Todo mundo vota e o resultado aparece na hora.

## Por que
- **Pesquisa de mercado (out/2026):** achar data comum (39%) e interesses diferentes na programação (42,7%) são as maiores dores. É a área "Decidir juntos" do catálogo.
- A votação de hospedagem (spec 011) já mostrou que o grupo gosta de votar; a enquete leva isso pra qualquer decisão.

## Como funciona
- Uma `enquete` tem uma pergunta e de 2 a 10 opções. Pode ser de **escolha única** (um voto) ou **múltipla** (marca quantas quiser).
- **Todo o comboio** cria enquetes e vota.
- **Fechar e apagar:** quem criou ou o ADM. Enquete fechada não recebe mais voto.
- Escolha única troca o voto; múltipla soma.

## Inclui
- **Web (Overview):** cartão "Enquetes" com a lista. Cada opção é uma barra clicável que mostra os votos; um "Nova enquete" abre o formulário (pergunta + opções + "pode marcar várias").
- **Mobile (tela da viagem):** cartão "Enquetes" igual: votar tocando na opção, criar pelo formulário embutido.
- Quem criou (ou o ADM) vê o cadeado pra fechar/reabrir e a lixeira pra apagar.

## Não inclui (fica pra depois)
- Enquete de **data** ligada ao calendário da viagem (vira os dias em comum, item da Onda 2).
- Voto secreto (aqui o banco sabe quem votou; a tela mostra só a contagem).
- Comentar a enquete (a conversa é no WhatsApp).
- Avisar por push quando sai uma enquete nova (depende de Lembretes/Notificações).
- Editar as opções depois de criada (por enquanto, apaga e cria de novo).

## Dados
- **Migration nova** (`20261029150000_enquetes.sql`):
  - Tabelas `enquetes`, `enquete_opcoes`, `enquete_votos`.
  - Função `criar_enquete(viagem, pergunta, multipla, opcoes)`: cria tudo junto (2 a 10 opções).
  - Função `votar_enquete(opcao, marcar)`: respeita escolha única × múltipla e recusa enquete fechada.
  - RLS: comboio vê tudo; autor/ADM fecham e apagam; criar e votar são pelas funções.
- **Tipos:** `enquetes`, `enquete_opcoes`, `enquete_votos` e as duas funções foram adicionados à mão em `packages/core/src/database.ts`. Depois de aplicar a migration, gerar de novo.

## Quem pode o quê
| Ação | ADM | Membro | Convidado |
|---|---|---|---|
| Ver e votar | sim | sim | sim |
| Criar enquete | sim | sim | sim |
| Fechar / reabrir / apagar | sim | só o que criou | só o que criou |

## Critérios de aceite
- [ ] Um membro cria "Que dia a gente vai?" com "Sexta" e "Sábado"; todo o comboio vê e vota.
- [ ] Escolha única: votar em outra opção troca o voto (continua 1 voto por pessoa).
- [ ] Múltipla: dá pra marcar mais de uma; a contagem soma.
- [ ] Enquete fechada não aceita mais voto.
- [ ] Quem não é do comboio não vê nem vota.
- [ ] Menos de 2 opções é recusado.
- [ ] Quem criou e o ADM fecham e apagam; outro membro não.
- [ ] Funciona no web (360px e desktop) e no app mobile.
- [ ] `npm run build`, `npm run lint` e os testes passam.

## Perguntas em aberto
1. **Mostrar quem votou em quê, ou só a contagem?** Sugestão (adotada): só a contagem na tela (o banco guarda quem, pra evitar voto duplicado).
2. **Quem pode criar enquete: só o ADM ou qualquer um?** Sugestão (adotada): qualquer um do comboio.

## Dicas pra implementar
- **Core:** `buscarEnquetes`, `criarEnquete`, `votarEnquete`, `fecharEnquete`, `apagarEnquete` em `packages/core/src/dados.ts`.
- **Web:** `src/features/enquetes/Enquetes.tsx`, num `Cartao` no `Overview`. CSS em `abas.css` (`.enquetes`).
- **Mobile:** `src/ui/Enquetes.tsx`, dentro de `app/viagem/[id].tsx`.
- **Testes:** `apps/web/tests/banco-specs.test.mjs`, seção "021".

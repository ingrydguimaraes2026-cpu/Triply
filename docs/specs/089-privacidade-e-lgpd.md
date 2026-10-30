# 089. Privacidade e LGPD

**Fase:** 7 · **Tamanho:** M · **Depende de:** 007, 047 · **Status:** Pronto pra testar (web) · banco **não aplicado** · função **não publicada**

## Objetivo
Cumprir o básico da LGPD: a pessoa **baixa os dados dela** e **exclui a conta** sozinha, pelo Perfil.

## Por que
- Catálogo M11. A LGPD dá esse direito (acesso e eliminação), e a loja de apps exige "excluir conta" dentro do app.

## Inclui
- Perfil → "Privacidade":
  - **Baixar meus dados**: um arquivo `.json` com perfil, e-mail, ficha, documentos, viagens, gastos que lançou ou pagou, a parte dela nas divisões, compras de moeda, mala, orçamento pessoal, avisos, disponibilidades, chegadas, posts e comentários. Gasto pessoal de outra pessoa nunca entra.
  - **Excluir minha conta**: explica o que acontece, pede pra escrever EXCLUIR, e:
    - sai de todas as viagens; único ADM → o ADM passa pra quem entrou primeiro (com conta);
    - viagem só dela é apagada;
    - ficha, documentos, mala, orçamento pessoal, carteira, avisos, gastos pessoais: apagados;
    - gastos divididos, fotos e posts ficam pro comboio com o nome "Conta excluída";
    - o login é desativado (exclusão suave do Supabase Auth).
  - Se numa viagem só sobram convidados sem conta, não exclui e explica o porquê.

## Não inclui (fica pra depois)
- Apagar a foto de perfil e as fotos do Storage (hoje ficam; o perfil perde o link).
- Escolher, item a item, o que cada coisa mostra.
- App mobile.

## Quem pode
- Cada um só os próprios dados (`auth.uid()`).

## Dados
- **Migration:** `supabase/migrations/20261031120000_privacidade_lgpd.sql` — `meus_dados()` e `excluir_meus_dados()`.
- **Edge Function:** `supabase/functions/excluir-conta` (usa `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`, que o Supabase já dá).

## Critérios de aceite
- [x] Meus dados traz o que é meu e não o pessoal dos outros; precisa estar logado (testado no banco).
- [x] Excluir passa o ADM, apaga viagem solo e o pessoal, mantém o gasto dividido (testado no banco).
- [x] Não deixa viagem só com convidado (testado no banco).
- [ ] No navegador: Perfil → Baixar meus dados; criar conta de teste, excluir e ver que não entra mais.

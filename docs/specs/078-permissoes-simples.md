# 078. Permissões simples

**Fase:** 2 · **Tamanho:** M · **Depende de:** 007 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
Em Configurações, o ADM liga três interruptores: o comboio também pode editar o **roteiro**, os **transportes** e/ou o **orçamento**. Desligado (padrão) fica como sempre: só o ADM.

## Por que
- Catálogo F7. Em grupo de amigos, todo mundo quer mexer; em família, só quem organiza. Poucas chaves, não 17.

## Inclui
- Configurações → "O que o comboio pode editar": Roteiro, Transportes, Orçamento.
- Liberado, o membro vê o "Editar" do roteiro, os botões de trajeto e o "Definir" do orçamento como o ADM.
- Garantido no banco: as regras de destinos, trajetos e orçamentos e a função `salvar_roteiro` usam `privado.pode_editar(viagem, área)`. Só o ADM liga/desliga.

## Não inclui (fica pra depois)
- Permissão de hospedagem (escolher a opção continua do ADM).
- Passageiros do trajeto (spec 067) continuam do ADM, mesmo com transportes liberados.
- App mobile.

## Dados
- **Migration:** `supabase/migrations/20261031070000_permissoes_simples.sql` — 3 colunas em `viagens`, `privado.pode_editar`, policies novas e `salvar_roteiro` recriada (mesmo corpo, só a checagem mudou).

## Critérios de aceite
- [x] Padrão só ADM; membro não se libera; liberado edita trajeto e salva roteiro; orçamento continua do ADM; estranho nunca (testado no banco). Testes antigos de roteiro e transportes continuam passando.
- [ ] No navegador: ADM liga "Transportes"; o membro vê "Adicionar trajeto".

## Cuidado ao aplicar
- Essa migration troca policies existentes. Revisar com calma antes de aplicar.

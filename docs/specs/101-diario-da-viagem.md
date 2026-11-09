# 101. Diário da viagem

**Fase:** 8 · **Tamanho:** M · **Depende de:** 029 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
Cada um escreve como foi o seu dia; o comboio lê o dos outros. Fica dentro de cada dia da Agenda.

## Por que
- Catálogo K6. As fotos mostram o que aconteceu; o diário guarda o que cada um sentiu. Vira matéria-prima da retrospectiva e do livro da viagem (K7/K8).

## Inclui
- Agenda → dia → "Diário do dia" (aparece a partir do próprio dia, não no futuro).
- Um texto por pessoa por dia (até 5.000 caracteres), com "Só eu leio" opcional.
- Mostra o dos outros (o que é do comboio) e o meu, com Editar. Apagar = salvar vazio.

## Não inclui (fica pra depois)
- Foto dentro do diário (as fotos do dia estão em Fotos → Por dia, spec 098).
- Lembrete à noite pra escrever (pode entrar no resumo da noite, spec 042).
- App mobile.

## Quem pode
- Ver: o meu sempre; o dos outros se for "comboio".
- Escrever/mudar/apagar: só o meu, e só se estou no comboio.

## Dados
- **Migration:** `supabase/migrations/20261031150000_diario_da_viagem.sql` — tabela `diario` (único por viagem + pessoa + dia).

## Critérios de aceite
- [x] Comboio lê o do comboio; "só eu" só o dono; ninguém muda o dos outros; estranho nada; um por dia (testado no banco).
- [ ] No navegador: Agenda → hoje → Escrever o meu dia → ver no outro aparelho.

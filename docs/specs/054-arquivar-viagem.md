# 054. Arquivar viagem

**Fase:** 2 · **Tamanho:** P · **Depende de:** 008 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
Tirar viagens velhas da lista "Minhas viagens" sem apagar nada.

## Por que
- Catálogo N2. Depois de 3 ou 4 viagens a lista fica comprida; apagar perde fotos e gastos.

## Inclui
- Botão de arquivo no canto de cada cartão. Arquivar é **só pra mim**: os outros do comboio continuam vendo a viagem na lista deles.
- Seção "Arquivadas (N)" no fim da lista, fechada; dali dá pra voltar a viagem.
- Quem tem todas arquivadas não vê a mensagem de "Nenhuma viagem ainda".

## Não inclui (fica pra depois)
- Viagem "só leitura" depois do fechamento (N1, travado).
- App mobile.

## Dados
- **Migration:** `supabase/migrations/20261030130000_arquivar_viagem.sql` — `comboio_membros.arquivada_em` + `arquivar_viagem(viagem, arquivar)` (só mexe na linha de quem chama).

## Critérios de aceite
- [x] Cada um arquiva só na própria lista; desarquivar limpa; estranho não muda nada (testado no banco).
- [ ] No navegador: arquivar uma viagem, ela vai pra "Arquivadas"; voltar.

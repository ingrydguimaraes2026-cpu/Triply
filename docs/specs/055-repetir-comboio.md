# 055. Repetir com o mesmo comboio

**Fase:** 2 · **Tamanho:** P · **Depende de:** 007, 008 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
Na aba Comboio, "Nova viagem com este comboio" abre o onboarding e, ao criar, todo mundo da viagem antiga já entra na nova, sem convite.

## Por que
- Catálogo N3. O mesmo grupo viaja de novo (família, amigos de faculdade); recriar o comboio é atrito.

## Inclui
- Botão na aba Comboio (quando há mais alguém além de você).
- `/nova-viagem?comboio=<id>`: depois de criar, traz as pessoas como **membro** (você continua ADM) e mostra "4 pessoas do comboio já entraram nesta viagem". O link de convite continua aparecendo pra quem faltar.

## Não inclui (fica pra depois)
- Escolher quem vem (traz todo mundo; dá pra remover depois na aba Comboio).
- Avisar no celular quem foi trazido.
- App mobile.

## Dados
- **Migration:** `supabase/migrations/20261030140000_repetir_comboio.sql` — `trazer_comboio(nova, origem)`: só o ADM da nova, e só de uma viagem em que ele está.

## Critérios de aceite
- [x] ADM da nova traz o comboio; membro não; origem alheia barrada; quem já estava não duplica (testado no banco).
- [ ] No navegador: Comboio → "Nova viagem com este comboio" → criar → ver as pessoas na aba Comboio da nova.

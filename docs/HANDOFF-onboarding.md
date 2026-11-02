# HANDOFF — Onboarding e primeira viagem guiada (spec 116), 02/11/2026

> Leia `AGENTS.md` (seções 1, 3.1, 5) e `docs/specs/116-primeira-viagem-guiada-no-app.md`.

## Pronto (app mobile, `npx tsc --noEmit` ok em apps/mobile e packages/core)
- **Boas-vindas novas** (3 telas que contam a jornada). Conferido na versão web do Expo (375px).
- **Conta nova sem viagem** → `/primeira-viagem`: "Pra onde vocês vão?" (6 sugestões + busca nas 100 cidades + "Usar “texto”" + "Recebi um convite") → "Quantos dias?" (contador, atalhos, "Já sei as datas") → cria a viagem → deslize do Explorar com dica → roteiro → "Continuar" → "Chamar a galera" (pode pular) → dashboard.
- **"+ Nova viagem"** usa o mesmo jeito rápido (a tela antiga de 3 etapas + moeda saiu).
- **Convite** → depois de entrar, vai pro deslize do destino (guiado) e depois pro roteiro/dashboard.
- **Dashboard**: cartão "Montem a viagem" (6 passos, próximo destacado).
- Conferido no navegador: boas-vindas (3 telas), "Pra onde" (sugestões e busca) e "Quantos dias".

## Não testado ainda (precisa de conta logada)
- Criar a viagem de verdade pelo jeito rápido, o deslize guiado, "Continuar", "Chamar a galera" e o cartão do dashboard. O Victor testa no iPhone: `npx expo start --tunnel` em `apps/mobile`, criar uma conta nova.
- Convite de ponta a ponta.

## Cuidados
- Sem mudança no banco.
- `destinos.pais` recebe o nome em português (`NOME_EM_PORTUGUES`); o Explorar acha o código pelo `codigoDoPais`.
- Quem só tem viagens passadas continua vendo a home vazia antiga (função `Vazio`), não o guia.
- Fora daqui: redesenho da tela de login e o site.

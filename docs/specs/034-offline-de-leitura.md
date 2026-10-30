# 034. Offline de leitura

**Fase:** 2 · **Tamanho:** G · **Depende de:** PWA (M1) · **Status:** Pronto pra testar (web, site publicado)

## Objetivo
Sem internet (avião, metrô, roaming desligado), o que a pessoa já abriu continua abrindo: roteiro, agenda, transportes, hospedagem, documentos, gastos, fotos já vistas.

## Por que
- Catálogo M3 / Roadmap #15. Falta de offline é a queixa mais grave contra o Wanderlog e motivo de abandono.

## Inclui
- O service worker do PWA guarda as **leituras do banco** (GET `/rest/v1/…`): com internet busca na rede (espera até 6 s) e atualiza a cópia; sem internet usa a última cópia. Guarda até 600 respostas por 45 dias.
- **Fotos e arquivos** (Storage) ficam guardados depois da primeira vez (até 300).
- **Clima** guardado por 7 dias.
- **Faixa "Sem internet"** no topo da viagem explicando que é a última cópia e que gasto rápido sobe depois (fila que já existia, spec 009).
- **Sair da conta apaga as cópias** (celular emprestado não mostra a viagem de outra pessoa).

## Não inclui (fica pra depois)
- Gravar offline em tudo (M4): só o gasto rápido grava offline hoje.
- Baixar a viagem inteira de propósito ("deixar offline"). Hoje fica offline o que foi aberto pelo menos uma vez com internet.
- App mobile (usa outro mecanismo).
- Chamadas `rpc` (POST), como alertas de passaporte e lembretes: sem internet, essas partes somem em silêncio.

## Dados
- Nenhuma mudança no banco. Config em `apps/web/vite.config.ts` (`workbox.runtimeCaching`).

## Critérios de aceite
- [x] Build gera o service worker com os caches `together-dados`, `together-arquivos`, `together-clima`.
- [ ] No site publicado (não funciona no `npm run dev`): abrir a viagem com internet, ligar o modo avião, recarregar e ver roteiro, gastos e agenda.
- [ ] Sair da conta e conferir (DevTools → Application → Cache Storage) que os caches sumiram.

## Dicas pra implementar
- `features/offline/cache.ts` (`useSemInternet`, `apagarCopiasOffline`) e `FaixaOffline.tsx`.
- Workbox casa a cópia pela URL (não pelo token). Por isso apagar ao sair é obrigatório.

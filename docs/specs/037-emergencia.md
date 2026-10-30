# 037. Botão de emergência

**Fase:** 2 · **Tamanho:** P · **Depende de:** 010 · **Status:** Pronto pra testar (web)

## Objetivo
Um toque abre os números de emergência do país onde o comboio está, com ligar direto, e atalhos pra hospital perto e consulado do Brasil.

## Por que
- Catálogo J3. Na hora do susto ninguém lembra que na França é 112 e no Reino Unido é 999.

## Inclui
- Botão **boia** no topo (celular) e "Emergência" no menu (computador).
- Gaveta com o país de hoje primeiro (pelas datas do roteiro; fora delas, o primeiro destino) e depois os outros países do roteiro.
- Números com toque pra ligar (`tel:`). Europa: 112; Reino Unido 999/112; Suíça 112/144/117; EUA/Canadá/México 911; Japão, China, Coreia, Austrália, Tailândia, Emirados, Chile, Argentina, Colômbia, Uruguai, Índia, Noruega, Nova Zelândia; Brasil (SAMU 192).
- País sem número na lista: mostra 112 e avisa pra conferir.
- "Hospital perto de <cidade>" (Google Maps) e "Consulado do Brasil" (busca).
- Dica de passaporte perdido.

## Não inclui (fica pra depois)
- Telefone do consulado guardado no app (muda; a gente erraria). Vai por busca.
- Seguro viagem (entra com a spec do I5) e contatos de emergência da pessoa (F6).
- App mobile.

## Dados
- Nenhuma mudança no banco. Os números vêm junto com o app (funcionam sem internet).

## Critérios de aceite
- [x] Números por país, país desconhecido cai no 112 com aviso, links de hospital e consulado (testado: `emergencia.test.mjs`).
- [ ] No celular: tocar na boia, ver o país certo e o "ligar" abrir o discador.

## Dicas pra implementar
- Core: `packages/core/src/emergencia.ts`. País novo: acrescentar em `NUMEROS` só com fonte oficial.
- Web: `features/emergencia/Emergencia.tsx` (gaveta no `ViagemLayout`).

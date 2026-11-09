# 109. Tema escuro (teste)

**Fase:** 6 · **Tamanho:** P (virou M) · **Depende de:** 090 · **Status:** Pronto pra testar (web) · sem banco · **ligado só por escolha**

## Objetivo
Um tema escuro "couro à noite" (mesmo couro e laranja, fundo escuro), bom pra usar o app à noite, no ônibus, no show.

## Por que
- Catálogo M12. Estava adiado porque havia ~300 cores fixas espalhadas nos CSS.

## Inclui
- Perfil → "Leitura e modo simples" → **Tema escuro (teste)**. Vale só neste aparelho. **Não** liga sozinho pelo sistema: enquanto ninguém revisou tela por tela, quem quiser liga.
- Variáveis novas no `global.css`: `--cor-borda-forte`, `--cor-fundo-suave`, `--cor-erro(-fundo)`, `--cor-sucesso(-fundo)` e `--creme` (texto claro em cima do couro, igual nos dois temas).
- ~170 cores fixas dos CSS das telas trocadas por variáveis (fundos de cartão, bordas, erros, links). No tema claro nada muda (mesmas cores).
- Links e textos que usavam o couro passam a usar `--cor-comboio` (couro no claro, dourado no escuro).
- Tema escuro + alto contraste: texto branco.
- Campos e controles nativos seguem o tema (`color-scheme: dark`).

## Não inclui (fica pra depois)
- Seguir o tema do celular automaticamente (ligar depois da revisão visual).
- Mapa da Overview e cores de marca (Airbnb, Booking) seguem iguais.

## Como foi conferido
- Prints em 360 px (Playwright) do Login e da página 404, nos dois temas: claro igual a antes; escuro legível, sem rolagem lateral.
- As telas de dentro da viagem precisam de login: **não foram vistas** no escuro.

## Critérios de aceite
- [x] Preferência guardada aceita "escuro" (testado: `acessibilidade.test.mjs`).
- [x] Login e 404 no escuro, 360 px (prints).
- [ ] No navegador: ligar o tema escuro e passar por Overview, Financeiro, Fotos, Hospedagem e Agenda; anotar o que ficar ilegível.

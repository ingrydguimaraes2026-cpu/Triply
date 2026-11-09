# 090. Acessibilidade e modo simples

**Fase:** 7 · **Tamanho:** M · **Depende de:** — · **Status:** Pronto pra testar (web) · sem banco

## Objetivo
Dar pra usar o app com letra maior, mais contraste e um **modo simples** com menos abas, pro familiar menos digital.

## Por que
- Catálogo M10. Comboio de família tem avó, tio, criança: o app não pode exigir olho bom e paciência.

## Inclui
- Perfil → "Leitura e modo simples" (vale só neste aparelho):
  - Tamanho da letra: Normal / Grande (+15%) / Maior (+30%).
  - Alto contraste: texto mais escuro, bordas mais fortes, links sublinhados.
  - Modo simples: o menu da viagem mostra só Início, Hoje, Financeiro, Fotos e Comboio (5 abas maiores no celular). As outras telas continuam abrindo por link.
- Quem pediu "menos movimento" no sistema não vê animação.
- A escolha vale desde o carregamento da página (sem piscar).

## Não inclui (fica pra depois)
- Guardar a escolha na conta (hoje é por aparelho).
- Revisão completa de leitor de tela em todas as telas.
- App mobile.

## Dados
- Sem migration. Chave `together:acessibilidade` no aparelho.

## Critérios de aceite
- [x] Modo simples filtra as abas; preferência guardada só aceita valores conhecidos (testado: `acessibilidade.test.mjs`).
- [ ] No navegador (360px): Perfil → Maior + Alto contraste + Modo simples; abrir uma viagem e ver 5 abas, letra maior e sem rolagem lateral.

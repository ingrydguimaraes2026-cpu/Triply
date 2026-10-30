# 047. Ficha do país + internet no destino

**Fase:** 2 · **Tamanho:** P · **Depende de:** 010, 020 · **Status:** Pronto pra testar (web)

## Objetivo
Na Overview, o básico de cada país do roteiro: idioma, moeda e costume de gorjeta, tomada (precisa adaptador?), voltagem, mão inglesa. E um lembrete de comprar o eSIM antes de embarcar.

## Por que
- Catálogo I9 (ficha do país) e I12 (ideia do Holafly, lote 1 de `docs/ideias-de-outros-apps.md`: "cheguei no aeroporto com internet").

## Inclui
- Cartão "Ficha do país" com uma aba por país fora do Brasil.
- ~37 países com dados estáveis (Europa, Américas, Japão, Austrália, Nova Zelândia, Tailândia, África do Sul). País sem ficha: avisa e mostra a moeda.
- Tomada comparada com o plugue brasileiro (tipo N/C): "entra direto", "só o de 2 pinos entra" ou "precisa de adaptador".
- Voltagem: aviso de secador/chapinha em 100–127 V e de aparelho só 127 V em 220–240 V.
- **Internet:** explicação do eSIM, nota de roaming na UE e botão **"Criar tarefa comprar eSIM"** (vai pro checklist de tarefas, prazo 3 dias antes da ida).

## Não inclui (fica pra depois)
- Fuso horário, água da torneira, links de compra de eSIM (sem afiliado por enquanto).
- App mobile.

## Dados
- Nenhuma mudança no banco. A tarefa usa a tabela `tarefas` (spec 020).

## Critérios de aceite
- [x] Ficha por país, adaptador, voltagem e prazo do eSIM (testado: `ficha-do-pais.test.mjs`).
- [ ] No navegador: viagem com França e Reino Unido mostra duas abas; "Criar tarefa" aparece no checklist.

## Dicas pra implementar
- Core: `packages/core/src/ficha-do-pais.ts`. País novo: acrescentar em `FICHAS`.

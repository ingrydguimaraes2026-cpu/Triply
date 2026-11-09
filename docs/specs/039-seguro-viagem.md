# 039. Seguro viagem

**Fase:** 2 · **Tamanho:** P · **Depende de:** 037 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
O comboio cadastra o(s) seguro(s) viagem e, na emergência, liga pro telefone 24 h com um toque, sabendo quem está coberto.

## Por que
- Catálogo I5. Obrigatório no Schengen; na hora do problema ninguém acha o PDF nem o telefone.

## Inclui
- Na gaveta **Emergência**: seção "Seguro viagem" com seguradora, telefone 24 h (toque pra ligar), apólice, validade, o que cobre e quem está coberto.
- Vários seguros por viagem (cada família com o seu). "Sem seguro cadastrado: Ana, Léo."
- Aviso "não cobre a viagem inteira" quando a validade não bate com as datas.
- Cadastrar/editar/apagar (quem cadastrou ou o ADM).

## Não inclui (fica pra depois)
- PDF da apólice (use o Cofre, spec 028).
- Item "seguro" automático no checklist de documentos.
- App mobile.

## Dados
- **Migration:** `supabase/migrations/20261030050000_seguro_viagem.sql` — `seguros_viagem`. Gatilho só deixa cobrir gente do comboio.

## Quem pode o quê
| Ação | ADM | Membro | Quem não é do comboio |
|---|---|---|---|
| Ver os seguros | ✅ | ✅ | ❌ |
| Cadastrar | ✅ | ✅ | ❌ |
| Editar/apagar | ✅ todos | ✅ o que cadastrou | ❌ |

## Critérios de aceite
- [x] Comboio vê e cadastra; estranho não; só cobre gente do comboio; telefone inválido barrado; ADM edita o do membro (testado no banco).
- [x] Quem está sem seguro, telefone pro "ligar", cobre a viagem inteira (testado: `seguro.test.mjs`).
- [ ] No celular: Emergência → Cadastrar seguro → tocar no telefone e abrir o discador.

## Dicas pra implementar
- Core: `packages/core/src/seguro.ts`. Web: `features/emergencia/SeguroViagem.tsx`.

# 051. "Cheguei bem"

**Fase:** 2 · **Tamanho:** P · **Depende de:** 013, 029 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
Um toque avisa o comboio no celular: "✅ Ingryd chegou bem · Em Nice."

## Por que
- Catálogo F9. É a mensagem mais mandada no WhatsApp em viagem de família, e a alternativa saudável ao GPS ligado o tempo todo (ver "O que NÃO vamos fazer").

## Inclui
- Cartão "Cheguei bem" na Overview com o botão (traz a cidade de hoje, pelas datas do roteiro).
- Lista de quem chegou bem nas últimas 24 h (só a última de cada pessoa).
- Push pro resto do comboio (função `cheguei-bem`).

## Não inclui (fica pra depois)
- Avisar só a família (núcleos, F4).
- Pedir "avisa quando chegar" pra alguém.
- App mobile.

## Dados
- **Migration:** `supabase/migrations/20261030120000_cheguei_bem.sql` — `chegadas`. Função nova `supabase/functions/cheguei-bem`.

## Quem pode o quê
| Ação | A pessoa | Resto do comboio | Quem não é do comboio |
|---|---|---|---|
| Registrar/apagar a própria chegada | ✅ | ❌ | ❌ |
| Ver as chegadas | ✅ | ✅ | ❌ |

## Critérios de aceite
- [x] Cada um registra a própria; comboio vê; ADM não registra nem apaga a dos outros; estranho não (testado no banco).
- [x] Última de cada pessoa nas últimas 24 h (testado: `chegadas.test.mjs`).
- [ ] No celular: tocar "Cheguei bem" e o outro celular receber o aviso.

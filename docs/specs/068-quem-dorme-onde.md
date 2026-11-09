# 068. Quem dorme onde

**Fase:** 2 · **Tamanho:** M · **Depende de:** 011 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
Na hospedagem escolhida, o comboio vê os quartos (e o sofá-cama), cada um entra no seu, e o ADM pode sortear.

## Por que
- Catálogo E7 (diferencial). "Quem fica no sofá-cama" é briga clássica (pesquisa Skyscanner).

## Inclui
- "Quem dorme onde" embaixo do guia da casa, na hospedagem escolhida.
- ADM ou quem sugeriu a opção: cria quarto (nome + vagas), apaga, **sorteia** (embaralha todo mundo e enche os quartos na ordem).
- Cada um: "Vou dormir aqui" / "Sair" (trocar de quarto tira do outro sozinho). Quarto cheio não aceita.
- "Sem quarto: Léo · faltam vagas".

## Não inclui (fica pra depois)
- Dividir o preço pelo tipo de cama (cama de casal x sofá).
- App mobile.

## Dados
- **Migration:** `supabase/migrations/20261031000000_quem_dorme_onde.sql` — `quartos` (vagas, ocupantes) + gatilho (cheio, só comboio, ninguém em dois quartos) + `entrar_no_quarto`.

## Quem pode o quê
| Ação | ADM / quem sugeriu | Membro | Fora do comboio |
|---|---|---|---|
| Ver | ✅ | ✅ | ❌ |
| Criar/apagar quarto, sortear | ✅ | ❌ | ❌ |
| Entrar/sair (só a si mesmo) | ✅ | ✅ | ❌ |

## Critérios de aceite
- [x] Vagas, cheio, trocar de quarto, só comboio, membro não cria quarto, estranho não vê nem entra (testado no banco).
- [x] Sorteio respeita vagas e diz quem sobrou (testado: `quartos.test.mjs`).
- [ ] No navegador: criar "Quarto 1 (2)" e "Sofá (1)", sortear e trocar de quarto.

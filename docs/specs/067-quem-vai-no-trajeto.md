# 067. Quem vai em cada trajeto + "meu itinerário"

**Fase:** 2 · **Tamanho:** M · **Depende de:** 004, 032 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
O ADM marca quem vai em cada trajeto (gente chegando em voos diferentes, quem volta antes). Cada um liga "Meu itinerário" e vê só os seus; o lembrete do celular vai só pra quem vai.

## Por que
- Catálogo D5. O comboio nem sempre viaja junto; hoje todo trajeto parece ser de todo mundo.

## Inclui
- Formulário do trajeto: "Quem vai" (caixinhas). Ninguém marcado ou todo mundo marcado = o comboio inteiro (inclusive quem entrar depois).
- Bate-e-volta: a ida e a volta ficam com os mesmos passageiros.
- Cartão do trajeto: selo com os nomes (laranja quando você vai).
- Transportes: "Meu itinerário" (aparece quando algum trajeto tem lista) filtra a página toda.
- Lembretes (spec 032) avisam só os passageiros.

## Não inclui (fica pra depois)
- "Vou nesse / não vou" pela própria pessoa na tela (o banco já deixa; falta o botão).
- Agenda do dia filtrada por pessoa.
- App mobile.

## Dados
- **Migration:** `supabase/migrations/20261030235000_passageiros.sql` — `trajeto_passageiros`.

## Quem pode o quê
| Ação | ADM | A própria pessoa | Outros | Fora do comboio |
|---|---|---|---|---|
| Ver | ✅ | ✅ | ✅ | ❌ |
| Pôr/tirar alguém | ✅ | só ela mesma | ❌ | ❌ |

## Critérios de aceite
- [x] ADM define; cada um se põe/tira; ninguém mexe nos outros; só gente do comboio; estranho não vê (testado no banco).
- [ ] No navegador: marcar só "Victor" num voo, ligar "Meu itinerário" na conta da Ingryd e o voo sumir.

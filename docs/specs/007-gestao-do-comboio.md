# 007. Gestão do comboio

**Fase:** 2 · **Tamanho:** P · **Depende de:** — · **Status:** A fazer

## Objetivo
O ADM organiza quem está na viagem: tira alguém, passa outra pessoa pra ADM e vê ou cancela os convites. Qualquer membro pode sair da viagem.

## Por que
Hoje dá pra convidar, mas não dá pra desfazer nada. Do áudio: quem organiza é o ADM, os outros "só estão lá no comboio". Às vezes o casal quer dividir a organização: aí entram dois ADMs.

## Inclui
- **ADM:**
  - remover membro, com confirmação;
  - tornar alguém ADM ou voltar pra membro;
  - ver os convites ativos (link e validade) e cancelar um convite.
- **Qualquer membro:** "Sair da viagem", com confirmação.
- **Regra de segurança:** a viagem nunca fica sem ADM.
  - O último ADM não pode sair nem se rebaixar sem antes passar o ADM pra alguém.
  - Se ele for a única pessoa, "sair" vira "apagar a viagem", com uma confirmação bem clara.

## Não inclui
- Convidar por e-mail (o link já resolve).
- Papéis além de ADM e membro.

## Telas
- **Comboio → lista "Quem vai":** pro ADM, cada pessoa ganha um menu "⋯" com "Tornar ADM", "Tornar membro" e "Remover".
- **Comboio → "Convites ativos"** (só ADM): link, expira em, botão "Cancelar".
- **Comboio → no fim da página:** "Sair da viagem".

## Dados (já existem no banco)
- **`comboio_membros`:** campo `papel` (`adm` ou `membro`). O ADM adiciona, muda o papel e remove; qualquer um pode se remover.
- **`convites`:** o ADM vê e apaga.
- **Falta no banco:** a regra "nunca ficar sem ADM". Precisa de uma migration nova (função ou trigger que recuse remover ou rebaixar o último ADM). Não confie só na tela.
- **Cuidado:** os gastos de quem saiu continuam lá (`pago_por` aponta pra essa pessoa). A tela precisa mostrar "ex-membro" em vez de quebrar.

## Quem pode o quê
| Ação | ADM | Membro |
|---|---|---|
| Remover outra pessoa | sim | não |
| Mudar o papel de alguém | sim | não |
| Ver e cancelar convites | sim | não |
| Sair da viagem | sim (se não for o último ADM) | sim |

## Critérios de aceite
- [ ] O ADM torna a Ingryd ADM: ela passa a ver "Editar roteiro".
- [ ] O ADM remove alguém: essa pessoa perde o acesso (a viagem some da lista dela e o link dá 404).
- [ ] O último ADM tentando sair vê "passe o ADM pra alguém antes".
- [ ] Mesmo chamando o banco direto, não dá pra deixar a viagem sem ADM.
- [ ] Cancelar um convite faz o link dele mostrar "Convite inválido".
- [ ] Os gastos de quem saiu continuam aparecendo, com o nome dessa pessoa.

## Perguntas em aberto
- Quem sai perde acesso às fotos que postou? (Sugestão: as fotos ficam na viagem.)

## Dicas pra implementar
- Tela: `src/pages/viagem/Comboio.tsx` (o `TODO (Ingryd)` já fala disso). Lógica: `src/features/comboio/api.ts`.
- Depois de remover ou mudar papéis, recarregue os membros. Dá pra criar um `atualizarMembros` no `useViagem`, igual ao `atualizarDestinos` do PR #3.

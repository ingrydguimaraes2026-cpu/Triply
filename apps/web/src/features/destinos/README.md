# Destinos

Lugares da viagem, na ordem. Viram as bandeirinhas do mapa no Overview.

| Arquivo | O que faz |
|---|---|
| `buscarCidades.ts` | Busca lugares pelo nome (Open-Meteo + Photon) |
| `api.ts` | Fala com o banco: buscar destinos, contar trajetos/fotos ligados, salvar o roteiro |
| `ordem.ts` | Regras de ordem (mover, aplicar uma ordem, avisar datas fora de ordem). Não fala com o banco |
| `EditorRoteiro.tsx` | Lista editável do roteiro (Overview > Roteiro > Editar) |

## Editar o roteiro

- Só o ADM vê o botão "Editar" (o banco também só deixa o ADM mexer em `destinos`).
- Enquanto edita, a lista e o mapa mostram o **rascunho**. "Cancelar" joga o rascunho fora.
- "Salvar alterações" chama a função `salvar_roteiro` do banco, que faz tudo numa transação só
  ("tudo ou nada"): apaga **só** os destinos que a pessoa removeu (`p_removidos`), insere os novos
  e grava a ordem de todos.
- Se o roteiro mudou em outro lugar desde que a edição começou (outra aba, outro aparelho, outro ADM),
  o banco recusa tudo (erro `TR409`) e a tela oferece "Recarregar roteiro".
- Com alterações não salvas, o site avisa antes de trocar de aba ou fechar a página.
- Depois de salvar, `atualizarDestinos` (de `useViagemAtual`) troca a lista de todas as abas.
- Remover um destino **não apaga** trajetos nem fotos ligados: eles ficam sem esse lugar
  (`on delete set null` no banco). O editor avisa antes.
- Nada é recalculado sozinho: datas de chegada/saída, nome da viagem, moeda e trajetos ficam como estão.
- No mapa, as linhas são só a ordem do roteiro, não o caminho real.

## Sugestão de ordem (futuro, ainda não existe)

O tipo `SugestaoDeOrdem` em `ordem.ts` é o formato combinado:

1. A sugestão calcula uma ordem (`chavesNaOrdem`) e diz de onde vêm os dados (`fonte`, obrigatório).
2. A tela mostra a proposta. Nada muda até a pessoa aceitar.
3. Aceitou → `aplicarOrdem(rascunho, sugestao.chavesNaOrdem)` vira o novo rascunho, e a pessoa ainda pode mexer antes de salvar.

Regra: nenhuma estimativa de tempo, preço ou transporte sem uma fonte de dados confiável.

# Mapa de telas: hoje → proposta (02/11/2026)

Pedido do Victor: "pegar todas as nossas telas e ver como cada uma vai se tornar: se vai se fragmentar ou se juntar. Do jeito que está hoje não pode continuar."
Base: `docs/design/referencias/README.md` (conceito **passaporte do comboio**, uma ação por tela, complexidade em camadas).
Escopo: o app (`apps/mobile`, mobile primeiro). O site segue depois, só no essencial.

## Hoje: 25 telas, e as abas não são da viagem

- Abas de baixo: Viagens · Roteiro · Contas · Fotos · Perfil. Roteiro, Contas e Fotos mostram "a viagem escolhida", mas a pessoa entra na viagem por outra tela (`viagem/[id]`) que **repete** tudo em 11 atalhos + 10 blocos.
- **Coisas repetidas**: Explorar × Roteiro × Lugares (as três são "o que fazer lá"); Hoje × agenda/clima na tela da viagem; Comboio × Chamar a galera × Tarefas/Enquetes/Ponto de encontro (tudo "o grupo"); Documentos × Cofre (papéis); PDF × Retrospectiva (lembranças).

| Tela hoje | Linhas | Vira |
|---|---|---|
| `comecar` (conversa com a Norti), `login`, `criar-conta`, `convite/[codigo]`, `boas-vindas` | 518 / 200 / 106 / 156 / 7 | **Entrada** (fica, revisar texto: 1 frase por tela). `boas-vindas` sai (já é só redirecionamento). |
| `(tabs)/index` Minhas viagens | 180 | **Viagens**: 1 cartão de foto grande por viagem (a próxima em destaque), sem lista de detalhes. |
| `viagem/[id]` (17 blocos) + `hoje` | 213 + 230 | **Passaporte** (a casa da viagem). Muda com a fase: antes = o próximo carimbo; durante = Hoje (agenda, clima, ferramentas); depois = Lembranças. 4 blocos no máximo. |
| `explorar` + `(tabs)/roteiro` + `lugares` | 608 + 312 + 230 | **Roteiro** (junta 3 em 1): deslizar pra descobrir, os dias montados, as ideias do grupo. Hospedagem e Transporte aparecem como "paradas" dentro dos dias. |
| `hospedagem`, `transportes` | 406 / 132 | Continuam telas, mas **só se entra pelo Roteiro** (ou pelo carimbo "onde dormir"/"como chegar"). |
| `(tabs)/contas` + `novo-gasto` | 264 + 168 | **Contas** (fica): um número grande (meu saldo) + o botão "+". Detalhe em camada. |
| `(tabs)/fotos` + `novo-post` | 275 + 330 | **Fotos** (fica). |
| `comboio` + `chamar-galera` + Tarefas, Enquetes, Ponto de encontro | 266 + 73 + (blocos) | **Galera** (junta): quem vai e o que falta cada um fazer, convidar, tarefas, enquetes, encontro. Abre pelos rostos no topo do Passaporte. |
| `documentos` + Cofre + Guia da casa | 260 + (blocos) | **Papéis** (junta): passaporte/visto, reservas e bilhetes, guia da casa. Vira um carimbo do passaporte. |
| `retrospectiva` + `pdf-da-viagem` | 174 + 228 | **Lembranças** (junta): aparece no Passaporte depois da viagem. |
| `configuracoes` | 209 | Fica, atrás da engrenagem. |
| `(tabs)/perfil` | 113 | Sai da barra: abre pela foto da pessoa na tela Viagens. |

## Proposta: barra de baixo DA VIAGEM com 4 abas

**Passaporte · Roteiro · Contas · Fotos** (+ Galera pelos rostos, Papéis e Lembranças como carimbos).
Fora de uma viagem: a tela Viagens, sem barra de abas.

Resultado: 25 telas → 15; tela da viagem de 17 blocos → 4; 11 atalhos → 4 abas.

## Cada tela nova, em uma frase (régua pro desenho)
- **Viagens**: "pra onde vamos?" Foto grande da próxima viagem + "Nova viagem".
- **Passaporte**: "o que falta agora?" Um carimbo pra conquistar, os selos da viagem, os rostos do grupo.
- **Roteiro**: "o que vamos fazer?" Os dias com fotos; deslizar pra achar mais.
- **Contas**: "quanto eu devo / recebo?" Um número e o "+".
- **Fotos**: "como está sendo?" O feed.
- **Galera**: "quem falta?" Rostos e o que cada um precisa fazer.
- **Papéis**: "posso embarcar?" O que cada um precisa levar.
- **Lembranças**: "como foi?" A história da viagem pronta.

## Próximos passos
1. Victor valida este mapa (juntar/separar).
2. Desenhar **3 direções** do conceito passaporte, cada uma com as 5 telas principais (Viagens, Passaporte antes/durante, Roteiro, Contas) em iPhone com foto real → Victor escolhe.
3. Specs: atualizar a 116 (Passaporte) e criar uma spec "nova navegação do app" antes de codar.
4. Implementar no app por partes: navegação (abas da viagem) → Passaporte → Roteiro junto → Galera → Papéis → Lembranças.

# 014. Feed de fotos do comboio

**Fase:** 2 · **Tamanho:** G · **Depende de:** 005, 013 · **Status:** Pronto pra testar

## Objetivo
A aba Fotos vira um feed estilo Instagram, só do comboio. Cada post tem uma ou mais fotos, e o comboio curte e comenta. Quando alguém posta ou comenta, chega um aviso no celular.

## Por que
Pedido do Victor e da Ingryd (out/2026). O mural de "5 melhores por lugar" ficou limitado: o comboio quer ir postando a viagem e reagir às fotos dos outros, como no Instagram, mas fechado entre quem viaja junto.

## Inclui
- **Post:**
  - de 1 a 10 fotos, que viram um carrossel (arrasta pro lado);
  - lugar opcional;
  - legenda opcional (até 2.200 caracteres).
  - As fotos continuam comprimidas no navegador, com menos de 1 MB cada (spec 005).
- **Feed:** um post embaixo do outro, mais novo primeiro. Cada post mostra:
  - cabeçalho com avatar, nome e lugar;
  - fotos, curtidas, legenda, os 2 últimos comentários e há quanto tempo foi postado.
- **Curtir:** botão de coração ou toque duplo na foto.
  - O toque duplo só curte, nunca descurte, igual ao Instagram.
  - Texto: "Curtido por você e mais 2".
- **Comentar:** campo embaixo do post e lista completa em "Ver todos os N comentários".
- **Grade:** um botão alterna pra miniaturas quadradas, 3 por linha. Tocar numa miniatura volta pro feed naquele post.
- **Aviso no celular** (usa o push da spec 013):
  - post novo → todo o comboio, menos quem postou;
  - comentário → quem postou e quem já comentou naquele post, menos quem comentou.
  - Tocar no aviso abre o feed naquele post.
- **Sem limite de fotos por lugar** (sai a regra de 5 da spec 005).

## Não inclui (fica pra depois)
- Vídeo, stories, filtros ou cortar foto.
- Editar a legenda depois de postar.
- Aviso de curtida.
- Marcar pessoas na foto.
- Atualização ao vivo: o feed atualiza ao abrir a aba ou depois de postar, curtir ou comentar.

## Telas
- **Fotos (feed):**
  - topo com "Novo post" e o seletor Feed/Grade (sem filtro por lugar: é um feed normal);
  - se este aparelho ainda não recebe avisos: cartão "Avisar quando o comboio postar".
- **Novo post (gaveta):**
  - escolher até 10 fotos (galeria ou câmera), com miniaturas que dá pra remover;
  - lugar, legenda e "Publicar";
  - progresso "Preparando 2 de 5…" e "Enviando 2 de 5…".
- **Comentários (gaveta):** todos os comentários, com campo pra comentar.
- **Estados:** vazio ("Nenhum post ainda"), carregando, erro com "Tentar de novo".

## Dados
- **`posts`** (novo): `viagem_id`, `destino_id` (opcional), `autor`, `legenda`, `criado_em`.
- **`fotos`:** ganha `post_id` (obrigatório) e `ordem`.
  - Cada foto antiga vira um post com 1 foto. O post fica com o mesmo id da foto.
  - No máximo 10 fotos por post (regra no banco, erro `TR_LIMITE_POST`).
- **`curtidas`** (nova): `post_id` + `usuario_id`, uma por pessoa.
- **`comentarios`** (nova): `post_id`, `autor`, `texto` (de 1 a 1.000 caracteres).
- **Função `avisos-feed`** (Edge Function): recebe `{ post_id }` ou `{ comentario_id }` de quem acabou de postar ou comentar e manda o push.
- **Storage:** o bucket `fotos` continua igual. Caminho: `<viagem_id>/<post_id>/<arquivo>`.

## Quem pode o quê
| Ação | ADM | Membro | Fora do comboio |
|---|---|---|---|
| Ver posts, curtidas e comentários | sim | sim | não |
| Postar, curtir, comentar | sim | sim | não |
| Apagar o próprio post ou comentário | sim | sim | — |
| Apagar post de outra pessoa | sim | não | — |
| Apagar comentário no próprio post | sim | sim | — |

## Critérios de aceite
- [ ] Postar 3 fotos de uma vez cria 1 post com carrossel. Os pontinhos e o "1/3" acompanham ao arrastar.
- [ ] Outra pessoa do comboio vê o post. Alguém de fora não vê nada.
- [ ] Toque duplo curte e mostra o coração. Tocar no coração de novo descurte. O texto "Curtido por…" atualiza na hora.
- [ ] Comentar aparece embaixo do post. "Ver todos" abre a lista completa. Apagar o próprio comentário funciona.
- [ ] Apagar um post tira ele do feed e apaga os arquivos do Storage.
- [ ] A grade mostra 1 miniatura por post, com ícone de "várias fotos" quando tem mais de uma. Tocar volta pro feed no post certo.
- [ ] Com o aviso ligado no celular, alguém do comboio posta e chega "📸 Fulano postou em Viagem". Tocar abre o post.
- [ ] As fotos antigas aparecem no feed como posts de 1 foto.
- [ ] Dá pra postar a 6ª foto do mesmo lugar (sem limite). A 11ª foto no mesmo post é recusada.

# 005. Fotos

**Fase:** 1 · **Tamanho:** M · **Depende de:** — · **Status:** A fazer

## Objetivo
O comboio monta um mural com as melhores fotos de cada lugar da viagem, estilo Pinterest. As fotos são comprimidas antes do envio.

## Por que
É um dos 3 diferenciais do benchmark: "fotos curadas, as melhores de cada lugar, em vez de um álbum infinito". Do áudio: "a gente não vai armazenar vídeo", "comprime no upload" e "5 melhores fotos por país". Isso também resolve o limite de 1 GB do plano grátis do Supabase.

## Inclui
- **Adicionar foto:**
  - escolher da galeria ou tirar na hora (no celular);
  - escolher o destino;
  - legenda opcional.
- **Comprimir no navegador** antes de enviar: no máximo 1600 px no lado maior, formato WebP e menos de 1 MB.
- **Mural** em colunas, com o filtro por destino que já existe na tela e o contador "3/5".
- **Ver a foto grande** ao tocar, com legenda, quem postou e data.
- **Apagar:** quem postou ou o ADM.
- **Limite de 5 fotos por destino**, se for decidido assim (ver perguntas).

## Não inclui
- Vídeo.
- Curtidas ou votação de "melhor foto" (pode ser uma spec futura e divertida).
- Baixar todas as fotos de uma vez.
- Editar a foto (cortar, filtros).

## Telas
- **Fotos → "Adicionar foto":** abre o seletor de arquivo; depois mostra a prévia, o destino, a legenda e o botão "Enviar". Uma barra de progresso aparece durante o envio.
- **Mural:** 2 colunas no celular e 3 a 4 no computador; cada foto com o avatar de quem postou.
- **Foto aberta:** tela cheia, escura, com setas pra passar.
- **Estados:** vazio (já existe); limite atingido ("Nice já tem 5 fotos. Troque uma pra adicionar outra."); erro de envio.

## Dados (já existem no banco)
- **Bucket `fotos`** (privado):
  - aceita só `image/jpeg` e `image/webp`, até 1 MB;
  - caminho obrigatório: `<viagem_id>/<arquivo>`;
  - só quem está no comboio vê e envia.
- **Tabela `fotos`:** `viagem_id`, `destino_id`, `enviada_por`, `caminho`, `legenda`.
- Bucket privado: pra mostrar a foto, gere um link temporário com `createSignedUrl` (ou `createSignedUrls` pra várias de uma vez).
- **Se o limite de 5 for regra,** valide também no banco (migration nova com função ou trigger), não só na tela.

## Quem pode o quê
| Ação | ADM | Membro |
|---|---|---|
| Ver fotos | sim | sim |
| Enviar foto | sim | sim |
| Apagar a própria foto | sim | sim |
| Apagar foto de outra pessoa | sim | não |

## Critérios de aceite
- [ ] Enviar uma foto de 5 MB do celular chega no Storage com menos de 1 MB.
- [ ] A foto aparece no mural, no filtro do destino certo, e o contador sobe pra "1/5".
- [ ] Outra pessoa do comboio vê a foto; alguém de fora do comboio não consegue abrir o link depois que ele expira.
- [ ] Apagar a foto tira do mural e do Storage (não pode sobrar arquivo perdido).
- [ ] Enviar arquivo que não é imagem mostra erro claro.
- [ ] O mural com 30 fotos rola liso no celular.

## Perguntas em aberto
- O limite é 5 por destino ou 5 por país? Por pessoa ou do comboio inteiro? (O áudio fala "5 por país"; a tela hoje mostra por destino.)
- Ao atingir o limite: bloquear ou deixar escolher qual foto sai?
- Mostrar no mapa da Overview um pino com a miniatura da foto, igual ao Polarsteps? (Seria lindo, mas fica pra spec 006 ou depois.)

## Dicas pra implementar
- Tela: `src/pages/viagem/Fotos.tsx` (o `TODO (Ingryd)`). Lógica: `src/features/fotos/api.ts`.
- Compressão: biblioteca `browser-image-compression` (instalar com `npm install`) ou desenhar num `<canvas>` e usar `canvas.toBlob(..., 'image/webp', 0.8)`.
- Nome único do arquivo: `crypto.randomUUID() + '.webp'`.
- Mural sem biblioteca: CSS `columns: 2` e `break-inside: avoid` em cada foto.
- Ordem ao apagar: primeiro o arquivo do Storage, depois a linha da tabela. Se a segunda parte falhar, avise.

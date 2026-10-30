# 100. Marcar pessoas nas fotos

**Fase:** 8 · **Tamanho:** P · **Depende de:** 017 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
Ao postar, marcar quem está nas fotos ("com Ingryd e Victor"). Na Grade, "Fotos em que estou" filtra só as suas.

## Por que
- Catálogo K9. Cada um quer achar as próprias fotos da viagem.

## Inclui
- Novo post: "Quem está nas fotos?" com o nome de cada um do comboio pra tocar.
- No post: "com Ingryd, Victor e mais 2" embaixo do nome.
- Quem foi marcado pode tocar "me tirar".
- Grade: botão "Fotos em que estou (12)".

## Não inclui (fica pra depois)
- Marcar num ponto da foto (como o Instagram) ou foto a foto.
- Marcar depois de postado (hoje só ao postar).
- Aviso no celular pra quem foi marcado.

## Quem pode
- Ver: o comboio. Marcar: quem é do comboio, só gente do comboio.
- Tirar: a própria pessoa marcada, quem marcou ou o autor do post.

## Dados
- **Migration:** `supabase/migrations/20261031140000_marcar_pessoas.sql` — tabela `post_marcacoes` + gatilho que só aceita gente do comboio.

## Critérios de aceite
- [x] Só marca gente do comboio; estranho não vê nem marca; marcado, quem marcou ou autor tira (testado no banco).
- [x] Texto "com…" (testado: `album.test.mjs`).
- [ ] No navegador: postar marcando 2 pessoas; ver "com…"; na Grade, "Fotos em que estou".

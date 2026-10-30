# 072. Prévia do link da opção de hospedagem

**Fase:** 2 · **Tamanho:** M · **Depende de:** 011 · **Status:** Pronto pra testar (web + função) · banco **não aplicado**

## Objetivo
Colou o link do Airbnb/Booking/hotel na opção: o app busca o título e a foto sozinho. A foto aparece no cartão da opção.

## Por que
- Catálogo E9. Comparar opções só pelo nome é ruim; ninguém quer abrir 6 abas.

## Inclui
- Função `previa-link` (servidor): baixa a página (até 8 s, só o começo), lê as meta tags Open Graph (título, foto, descrição, site). Só pra quem está logado; só links `https://` públicos.
- Formulário da opção: ao colar o link, "Buscando a prévia…"; preenche o nome (se você não digitou outro) e mostra a foto, com "Tirar foto".
- Cartão: foto no topo.
- Site que bloqueia robôs: volta vazio e segue sem prévia (sem erro na tela).

## Não inclui (fica pra depois)
- Preço automático (cada site esconde de um jeito).
- Prévia nos lugares e no cofre.

## Dados
- **Migration:** `supabase/migrations/20261031030000_foto_da_opcao.sql` — `hospedagens.foto_url` (só https). Função nova `supabase/functions/previa-link` (precisa publicar).

## Critérios de aceite
- [x] Leitura do Open Graph (duas ordens de atributo, &amp;, título como reserva, foto relativa, só https) (testado: `previa.test.mjs`).
- [x] Foto só https no banco (testado no banco).
- [ ] Publicar a função e colar um link de hotel: ver nome e foto.

## Cuidados
- A função só aceita `https://` e recusa endereços internos (localhost, 10.x, 192.168.x, 169.254.x) pra não virar porta de entrada pra rede do servidor.

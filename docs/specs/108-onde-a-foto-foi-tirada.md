# 108. Onde a foto foi tirada

**Fase:** 8 · **Tamanho:** M (feito em P) · **Depende de:** 017 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
Ao postar, a pessoa pode marcar "Mostrar pro comboio onde as fotos foram tiradas". Cada foto com localização ganha "📍 ver no mapa".

## Por que
- Catálogo K4 (fotos no mapa). Primeiro passo: guardar o lugar de cada foto, só com permissão. O mapa com todas as fotos fica pra quando houver um mapa de ruas (C9).

## Inclui
- O app lê o GPS da foto original (EXIF do JPEG) **antes** de comprimir (a compressão apaga o EXIF de propósito).
- A caixinha só aparece se alguma foto tiver localização, e vem **desmarcada**.
- Marcada: cada foto guarda latitude/longitude. Na foto que está na tela do carrossel, "📍 ver no mapa" abre o Google Maps.

## Não inclui (fica pra depois)
- Mapa com todas as fotos da viagem (precisa de mapa de ruas, ver C9).
- HEIC: o iPhone normalmente converte pra JPEG ao escolher no navegador; se vier sem GPS, só não aparece a caixinha.

## Riscos
- Alguns celulares tiram a localização ao escolher a foto (privacidade do sistema). Aí a caixinha não aparece.

## Dados
- **Migration:** `supabase/migrations/20261031170000_onde_a_foto_foi_tirada.sql` — `fotos.latitude` e `fotos.longitude` (opcionais, os dois juntos).

## Critérios de aceite
- [x] Lê o GPS (norte/sul, leste/oeste); sem EXIF, não-JPEG ou quebrado dá null (testado: `exif.test.mjs`).
- [ ] No navegador (celular): postar foto da câmera com localização, marcar a caixinha e ver "📍 ver no mapa".

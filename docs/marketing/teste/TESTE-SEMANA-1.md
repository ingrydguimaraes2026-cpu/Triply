# Teste da semana 1: F1 x F2 x F3

> **Rumo novo (04/11/2026):** o app virou **o Passaporte da galera** (`docs/RUMO.md`). O conteúdo agora mostra carimbos, o mapa da galera e a retrospectiva; pix e "organizar a viagem" saem do centro. O que vale hoje está em `CONTEUDO-PASSAPORTE.md`. Este teste está **cancelado**: os 6 posts foram reprovados e o tema (pix) saiu do centro.

*03/11/2026. Decisão da dupla: testar os 3 formatos do benchmark (`benchmark/PADROES.md`), 2 posts de cada. Substitui a semana 1 do `CALENDARIO-2-SEMANAS.md`, que tinha o S1 e os 4 formatos antigos.*

## Os 6 posts (todos prontos)

| Post | Formato | Ideia | Pasta |
|---|---|---|---|
| F1 | "E o pix, [nome]?" | LUCAS, → oi sumido rs → tudo bem? → e o pix da casa do réveillon? | `slides/saida/F1` |
| F1b | "E o pix, [nome]?" | GABRIEL, → vi seu story na praia → ficou lindo → e o pix do mercado? | `slides/saida/F1b` |
| F2 | "O amigo que..." | a amiga que deu a ideia → criou o grupo, mandou 40 links → sumiu na hora do sinal | `slides/saida/F2` |
| F2b | "O amigo que..." | o amigo que diz que vai acordar cedo → alarmes: 0 → 11h: "bora tomar café?" | `slides/saida/F2b` |
| F3 | Expectativa x realidade | "esse ano a gente decide cedo" → 10 de novembro, 0 decisões → 47 casas vistas, 0 fechadas → marca quem tá "vendo com a mãe" | `slides/saida/F3` |
| F3b | Expectativa x realidade | "vai caber todo mundo na casa" → 4 quartos, 14 pessoas → marca quem vai dormir no colchão da sala | `slides/saida/F3b` |

Cada pasta tem `tiktok-*.png` (1080×1920), `instagram-*.png` (1080×1350), `legenda.txt` e `previa-tiktok.png`.

## Quando postar

Um post por dia, alternando os formatos, pra nenhum pegar só o dia bom:

| Dia | Post |
|---|---|
| seg 09/11 | F1 |
| ter 10/11 | F2 |
| qua 11/11 | F3 |
| qui 12/11 | F1b |
| sex 13/11 | F2b |
| sáb 14/11 | F3b |
| dom 15/11 | ler os números e decidir |

- **Mesma hora todo dia**, no TikTok e no Instagram. Começar à noite, perto das 19h, quando o pessoal está no celular. Se o perfil mostrar outro horário de pico, mudar a partir da semana 2.
- **Como postar no TikTok:** "Foto" (carrossel), subir os PNGs em ordem e escolher um **áudio em alta** do dia na hora. Colar a `legenda.txt`. Nada de link na legenda.
- **No Instagram:** carrossel com os `instagram-*.png`, a mesma legenda e um áudio do Reels, se o carrossel permitir.
- **Não apagar** post que flopou: no teste, ele também é resultado.

## O que medir

Anotar em `teste/resultados.csv`, 24 h e 72 h depois de postar: views, curtidas, comentários, compartilhamentos e salvos. Dá pra ver nas estatísticas do próprio post, na conta comercial.

**Quem vence:** o formato com mais **compartilhamentos a cada 1.000 views** em 72 h, somando os 2 posts dele. Esse é o número que o benchmark mostrou que importa: é o post sendo mandado no grupo de amigos. Curtida e view vêm depois.

Também vale anotar: comentários que **marcam alguém** e comentários perguntando "que app é esse?".

## Depois do teste (dom 15/11)

1. Colocar os números na planilha e trazer pro Claude (numa sessão de marketing) pra ler junto.
2. O vencedor vira série: 10 variações na semana 2 (no F1: um nome por post; no F2: um tipo de amigo por post; no F3: uma frase de expectativa por post).
3. O 2º colocado continua 2 vezes por semana. O 3º sai.
4. Se nenhum passar de 1.000 views, o problema provavelmente é a conta nova (aquecimento) ou o áudio, não o formato: repetir mais uma semana antes de mudar tudo.

## Antes de 09/11 (não depende do teste)

- Criar `@tripwave.app` no TikTok e no Instagram, como conta comercial, com as bios de `CONTEUDO-INICIAL.md`.
- Aquecer as contas: 15 a 20 min por dia rolando viagem e réveillon, curtindo e comentando, sem postar.
- A Ingryd revisa as frases dos 6 posts. Trocar o que soar forçado é só editar a `planilha.csv` e rodar `node docs/marketing/slides/gerar.mjs F1` (ou o post que mudou).

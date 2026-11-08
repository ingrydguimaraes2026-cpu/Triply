# Atualização da semana: domingo 01/11 a domingo 08/11/2026

**Branch:** `monorepo-split` · **135 commits** (01/11 a 05/11; de 06 a 08/11 não teve commit)
**Em uma frase:** o app ganhou nome (**Norti**), rumo (**viagem sem climão**, com o **passaporte da galera** como âncora), a regra de **mobile primeiro** e a primeira versão completa da experiência no celular: Explorar, onboarding guiado, 4 abas, carimbos, match do comboio e Passe da viagem.

---

## Decisões da semana
| Decisão | Quando | Onde está escrito |
|---|---|---|
| **Mobile primeiro**: tudo novo nasce no app; o site fica pro convite, ver a viagem e planejar no PC | 02/11 | `AGENTS.md` (seção 5) |
| **Nome**: Together → Tripwave (02/11) → **Norti**, igual à mascote (04/11). Nomes internos (`@together/core`, `together://`) continuam iguais de propósito | 04/11 | `docs/marketing/NOME-E-VOZ.md`, `AGENTS.md` |
| **Rumo novo: "viagem sem climão"**, com âncora no **passaporte da galera** e o **Hoje** como tela do durante; o resto foi congelado e escondido do menu | 03/11 | `docs/RUMO.md`, specs 118 e 120, `docs/FILA-completa.md` |
| **Catálogo de lugares grátis** (Wikidata + Wikipédia + fotos do Wikimedia, guardado no nosso banco). Nada de API paga nem consulta ao vivo | 02/11 | spec 114 |
| **Regras de trabalho com o Claude**: perto do limite, escrever o HANDOFF e dar commit + push; sessão grande vira sessão nova; economia de uso | 02/11 | `AGENTS.md` (seção 3.1) |

---

## Domingo 01/11: o site com a cara do app
- **Spec 112:** paleta "Malinha" (couro e caramelo), peças base e todas as telas do site no estilo do app.
- **Spec 113:** site no design "Plataforma": menu lateral, Overview em duas colunas, Hospedagem e Transportes com mapa e painel, Financeiro, Fotos, Comboio, Imprimir e Livro.

## Segunda 02/11: Explorar, jornada nova e o app de verdade
**Explorar (spec 114)**: deslizar lugares estilo Tinder e montar o roteiro.
- Banco: catálogo por cidade, escolhas de cada pessoa e a função que transforma escolhas em lugares, curtidas e prioridades.
- Função `explorar-cidade` no ar, com pré-carga agendada a cada 10 minutos.
  - Na estreia ela usava o Nominatim, que bloqueia o Supabase, e foi trocada pelo Open-Meteo.
  - O catálogo saiu com **43+ cidades** e **600+ lugares**.
- Sugestões da aba Lugares (spec 094) passaram a ler esse catálogo. Antes chamavam o Overpass, que já dava erro 429.
- **Testes de banco consertados:** todos estavam quebrados desde a spec 111 (faltava o papel `service_role` no banco falso).

**Jornada nova (spec 115)**: criar a viagem pelo desejo ("pra onde" e "quantos dias").
- O cartão "Próximo passo" no topo da viagem e o menu organizado por fase.
- Quem entra pelo convite cai direto em escolher os lugares.
- O roteiro do grupo é editável, e vários destinos ganham dias e dica de ordem.

**App mobile**:
- O Explorar chegou no app, com toque e tempo real, e pula o aeroporto de saída.
- **Onboarding (spec 116):** uma conversa com a mascote, e a conta só é criada no fim.
- **Spec 117 (UX definitiva):**
  - entraram Reanimated, Gesture Handler e Haptics;
  - Início sem abas e a viagem com **4 abas** (Viagem, Roteiro, Contas, Fotos);
  - **carimbos**, "Deu match" do comboio e Contas em formato de conversa;
  - tela do **Passe da viagem** (ainda sem cobrar) e polimento de movimento.

**Marca**: a mascote **Norti** (9 poses, animada no app e no site) substituiu a Agulha. Ícones próprios (selos + Phosphor Duotone), sem emoji, inclusive nos avisos das funções do Supabase.

**Lista de espera**: página pública `/espera` no site.

## Terça 03/11: rumo, âncora e pesquisa
- **Benchmark 11/2026:**
  - apps com IA, apps de grupo, mercado brasileiro, App Store e X;
  - destrinchamos o Enxovaly e o tripbff;
  - âncoras de produtos fora de viagem;
  - uma síntese com a proposta de rumo.
- **`docs/RUMO.md`**: "viagem sem climão", com a âncora no **passaporte da galera**. As funções fora do rumo foram congeladas e escondidas do menu (FILA 0.2).
- **Teste da âncora**: 3 telas falsas, roteiro de entrevista e planilha. O protótipo do passaporte é literal (capa de couro, carimbos, luz UV).
- **Hoje com as reservas do grupo (spec 120a)**: casa, agenda, quem vai buscar e o contato do anfitrião.
- **Produto:** a jornada em 5 fases, o teste do réveillon e uma hipótese de preço.
- **Marketing:**
  - conteúdo sem rosto, com carrossel e a Norti nos dois lados;
  - gerador de carrossel (planilha → PNG);
  - benchmark de posts (TikTok, Shorts e X) e teste com 3 formatos na semana 1.
- **Vídeo do app**: modo demonstração (a Eurotrip de mentira, sem login nem banco) e a versão 2 horizontal.

## Quarta 04/11: app mais leve e transportes que ajudam
- **App mais leve:** deslize nativo, cache de telas e fotos, cadastro de trajeto.
- **Spec 121, etapa 1:**
  - "Saia às X" pro voo;
  - dividir o transfer com quem chega na mesma hora;
  - como ir do aeroporto até a casa;
  - links de busca entre destinos.
- **Nome Norti** trocado em todo o app e no site.
- **Marketing:** carrosséis C0 e C1 com telas reais do modo demonstração.

## Quinta 05/11: QA e onboarding
- **Contas de teste com um toque** no login do app, só em modo dev. O roteiro de teste do Explorar (Playwright) passou **7 de 7**.
- **Onboarding:**
  - a primeira tela tem cartões de cidade com foto e clima (sorteia 6 de 26);
  - a tela de guardar o roteiro muda conforme com quem a pessoa vai.
- **Roteiro do Explorar:** todos os dias empilhados, lugar com foto e sem o mapa falso.
- **Marketing:** carrosséis C2, C3, C4 e K1 (WhatsApp × Norti). O vídeo ficou pausado.

## Sexta 06/11 a domingo 08/11
- Sem commits no repositório.
- Hoje entram as fontes do vídeo do passaporte (`docs/marketing/video/passaporte/fontes`).

---

## O que está no ar (Supabase `ltygqabtdbphtjscvuit`)
- Migrations da semana:
  - explorar e lista de espera;
  - quem escolheu e dias dos destinos;
  - montar sem repetir e roteiros;
  - matches, avisos de match e interesse no Passe (spec 117).
- Funções: `explorar-cidade` (com pré-carga a cada 10 minutos) e as funções de aviso sem emoji.

## Pendências pra próxima semana
1. **TestFlight e teste interno do Google:** gerar a build e testar com grupos reais.
2. **Rodar o teste da âncora** (entrevistas com o passaporte falso) e decidir com base nele.
3. **Spec 121:** as próximas etapas (hospedagem por região e teto de preço).
4. **Base curada do Explorar:** faltam 18 destinos de natureza (Chapada Diamantina veio com 0 lugares).
5. **Antes de juntar na `main`:** tirar o MP4 do vídeo do repositório.
6. **Tempo real** nas outras telas do app (hoje só o Explorar escuta).

## Onde continuar
- `docs/RUMO.md` e `docs/FILA-completa.md`: o que fazer e em que ordem.
- `docs/HANDOFF-*.md`: onde cada frente parou (Explorar, marketing, tela da viagem, vídeo).
- `AGENTS.md`: regras do projeto, incluindo mobile primeiro e economia de uso.

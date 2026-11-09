# HANDOFF: site espelho do app

**Decisão (Victor, 09/11/2026):** o site (`apps/web`) passa a ser espelho do app (`apps/mobile`). Ele usa as mesmas 5 partes e os mesmos nomes, e copia o desenho do app adaptado pra tela larga. O motivo e a comparação tela por tela estão em `docs/COMPARACAO-SITE-APP-2026-11-09.md`. A regra nova está em `docs/RUMO.md` ("Onde roda") e em `AGENTS.md`, seção 5.

## Regras pra quem pegar uma etapa
- Leia antes `AGENTS.md`, a comparação e a spec da tela (`docs/specs/`).
- **A lógica fica no `@together/core`.** O site só mostra. Se uma conta existe só no app (`apps/mobile/src/dados/...`), mova pro core antes de usar no site.
- **O modelo é a tela do app**, e não a tela antiga do site. Abra as duas lado a lado:
  - site: `npm run dev` em `apps/web`, http://localhost:5173;
  - app no navegador: preview "mobile", http://localhost:8089.
- **Teste em 360 px e em 1366 px.** No computador:
  - uma coluna central larga, mais um painel lateral quando fizer sentido;
  - nada de grade de botões iguais;
  - nada de cor de marca (Airbnb, Booking) fora da paleta.
- **Texto:** pt-BR, sem "ponha/pôr/põe", sem emoji, ícones só do catálogo. O teste `apps/web/tests/icones.test.mjs` já falha por causa dos "❄" em comentários de 03/11; não é da sua etapa.
- **Antes de dizer que terminou:** rode `npm run build` e `npm run lint` em `apps/web`.
- **Git:** commit local na branch `monorepo-split`, sem push (o Victor dá push).

## Etapas (em ordem)

| # | Etapa | O que muda | Estado |
|---|---|---|---|
| 1 | **Navegação e nomes** | `apps/web/src/pages/viagem/ViagemLayout.tsx`: as 5 partes do app (Viagem, Roteiro, Reservas, Contas, Fotos) e "Tudo da viagem" com o resto (Hoje, Lugares, Cidades, Comboio, Retrospectiva, PDF, Configurações). Sai o "Overview" (inglês), "Estadia", "Passag." e "Finanças". "Reservas" junta Passagens e Hospedagem com as duas pílulas, como no app | A fazer |
| 2 | **Tela da viagem** | `Overview.tsx` vira a aba Viagem do app (`apps/mobile/app/viagem/[id]/(abas)/index.tsx` + `src/ui/viagem/Secoes.tsx`): capa, rostos, próximo carimbo, passaporte do comboio, carrossel dos dias, passagens, contas. Sai a grade de 11 botões | A fazer (depois da 1) |
| 3 | **Hospedagem por noite** | `Hospedagem.tsx` segue a spec 123 (`docs/specs/123-hospedagem-por-noite.md`): `noitesDaViagem` e `fatosDaOpcao` já estão no core. Modelo: `apps/mobile/app/hospedagem.tsx`, `cidade-hospedagem.tsx`, `opcao-hospedagem.tsx` | Feita (09/11), ver abaixo |
| 4 | **Contas** | `Financeiro.tsx` no estilo da aba Contas do app: saldo grande, lista e lançamento rápido. O orçamento e a carteira vão pra uma linha ou um painel lateral, não 8 cartões | A fazer |
| 5 | **Passagens** | `Transportes.tsx` segue a spec 122 (deslocamentos com opções, votos e comparar). Modelo: `apps/mobile/app/transportes.tsx` e `comparar.tsx` | A fazer |
| 6 | Roteiro do dia e Agenda | Juntar Agenda no Roteiro como no app (dia a dia com mapa ilustrado) | A fazer |

As etapas 3, 4 e 5 mexem em arquivos separados e podem andar em paralelo, cada uma na sua sessão ou worktree. A 2 depende da 1.

## Onde parou
Nada do site mudou ainda. Commit da decisão: este arquivo, o RUMO e o AGENTS.

### Etapa 3: Hospedagem por noite (feita em 09/11)
- `apps/web/src/pages/viagem/Hospedagem.tsx` reescrita igual ao app: três números (sem cama, pra reservar, reservadas), cidades na ordem do roteiro com as barrinhas das noites, linhas finas de "só de dia", total por pessoa e do grupo (já pago).
- Cidade aberta: cartões das opções (preço por pessoa, a pé da chegada, check-in contra a hora da chegada, votos), malas no check-out, Comparar (tabela, melhor da linha em verde) e as ações do ADM (Ficar com esta, Marcar reservada, Marcar paga, Ainda não reservei, Desmarcar). Busca Airbnb/Booking/Maps virou chips na paleta Couro, dentro da cidade.
- Celular: lista OU cidade (`?cidade=<id>` na URL, o voltar do navegador funciona). Computador (1024px+): lista à esquerda, cidade num painel à direita (abre sozinha a primeira que precisa de algo).
- Formulário curto novo: `apps/web/src/features/hospedagem/FormOpcaoCurta.tsx` (link, nome, preço, endereço, self check-in, check-in até; o resto em "Mais detalhes"). Endereço vira ponto no mapa com `acharLugar` (Transitous), como no app.
- Hook novo `useNoitesDaViagem` em `features/hospedagem/hooks.ts` (opções + deslocamentos, tempo real). O `useHospedagem` antigo continua (Agenda, Imprimir e Overview usam).
- `hospedagem.css`: seção nova `hn-*`; saíram as cores de marca. As regras `hosp-*` antigas ficam porque Lugares e Transportes usam o seletor e o painel.
- **Ficou de fora da tela nova:** mapa do Google embutido, Guia da casa, Quem dorme onde, "Lançar como gasto" e comentários (o app também não tem na hospedagem). `FormOpcao.tsx` antigo não é mais usado por esta tela.
- **Conferido** na Eurotrip em 1366px e 360px (logado como membro): números, cidades, só de dia, Nice aberta, formulário e voltar; sem rolagem lateral. Dentro de Reservas a URL fica `?parte=hospedagem&cidade=<id>`.
- **Não testado:** salvar, votar e as ações do ADM (não gravei dado de teste na Eurotrip; o login era de membro).


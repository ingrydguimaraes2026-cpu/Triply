# 112. Site no estilo do app

**Fase:** 7 · **Tamanho:** G · **Depende de:** redesign "Malinha" do mobile · **Status:** Em andamento

## Objetivo
O site (`apps/web`) fica com a mesma cara do app do celular (`apps/mobile`): mesmas cores, cartões, botões, títulos e capas com foto. Quem usa os dois sente que é o mesmo produto.

## Por que
O app ganhou o redesign "Malinha" em 29/10 e ficou bem mais bonito. O site continuou com o visual antigo (laranja vivo, cartões chapados). Pedido do Victor em 01/11/2026: "o mobile está muito mais bonito que o web".

## Inclui
Uma tela por vez, nesta ordem. Só começa a próxima quando a anterior está pronta e commitada.

| # | Etapa | Referência no app | Onde no site | Status |
|---|---|---|---|---|
| 0 | Cores, sombras e cantos | `apps/mobile/theme.ts` | `styles/global.css` | ✅ feito |
| 1 | Peças base: cartão, botões, botão redondo, ícone quadrado, título da tela, rótulo de seção, campo, carregando, avatares | `src/ui/pecas.tsx` | `components/ui/` | ✅ feito |
| 2 | Login, criar conta, esqueci a senha | `app/login.tsx`, `criar-conta.tsx` | `pages/Login.tsx` | a fazer |
| 3 | Minhas viagens (lista com capa) | `app/(tabs)/index.tsx` | `pages/MinhasViagens.tsx`, `Inicio.tsx` | a fazer |
| 4 | Moldura da viagem: capa com foto, menu e abas | `app/viagem/[id].tsx`, `(tabs)/_layout.tsx` | `pages/viagem/ViagemLayout.tsx` | a fazer |
| 5 | Overview | `app/viagem/[id].tsx` | `pages/viagem/Overview.tsx` | a fazer |
| 6 | Financeiro (contas) | `app/(tabs)/contas.tsx`, `novo-gasto.tsx` | `pages/viagem/Financeiro.tsx` | a fazer |
| 7 | Roteiro e agenda | `app/(tabs)/roteiro.tsx` | `pages/viagem/Agenda.tsx` | a fazer |
| 8 | Fotos | `app/(tabs)/fotos.tsx`, `novo-post.tsx` | `pages/viagem/Fotos.tsx` | a fazer |
| 9 | Perfil | `app/(tabs)/perfil.tsx` | `pages/Perfil.tsx` | a fazer |
| 10 | Hoje | `app/hoje.tsx` | `pages/viagem/Hoje.tsx` | a fazer |
| 11 | Hospedagem | `app/hospedagem.tsx` | `pages/viagem/Hospedagem.tsx` | a fazer |
| 12 | Lugares | `app/lugares.tsx` | `pages/viagem/Lugares.tsx` | a fazer |
| 13 | Transportes | `app/transportes.tsx` | `pages/viagem/Transportes.tsx` | a fazer |
| 14 | Comboio e Configurações | `app/comboio.tsx`, `configuracoes.tsx` | `pages/viagem/Comboio.tsx`, `Configuracoes.tsx` | a fazer |
| 15 | Nova viagem, convite e 404 | `app/nova-viagem.tsx`, `convite/[codigo].tsx` | `NovaViagem.tsx`, `Convite.tsx`, `Perdido.tsx` | a fazer |

## Não inclui (fica pra depois)
- Funcionalidade nova. É só visual: nada muda no que cada tela faz.
- Compartilhar código de tela entre web e mobile (react-dom e react-native não se misturam). Só as cores ficam espelhadas.
- Tema escuro novo: ele continua com as cores dele. Cada etapa só confere que nada ficou ilegível nele.

## Telas
Em cada etapa:
- Copiar do app: hierarquia (título grande em Fraunces, rótulo de seção em caixa alta), cartões brancos com sombra marrom, ícones em quadradinho bege, botão principal couro com sombra, capa com foto onde o app tem.
- No desktop, a tela não estica: conteúdo centralizado (até ~960px) e, onde o app tem uma coluna, o site pode usar duas.
- Estados vazio, carregando e erro com a Agulha, como no app.

## Dados
Nada muda no banco.

## Quem pode o quê
Igual ao de hoje em cada tela (só muda o visual).

## Critérios de aceite
Valem pra cada etapa:
- [ ] A tela do site lembra a do app, lado a lado (mesmas cores, cartões, botões e títulos).
- [ ] Tudo que a tela fazia continua funcionando (mesmos botões e ações).
- [ ] Funciona em 360px sem rolar pro lado, e no desktop fica centralizada.
- [ ] No tema escuro e no alto contraste nada fica ilegível.
- [ ] `npm run build` e `npm run lint` passam.

## Perguntas em aberto
- O logo do site (símbolo "Rota") continua com o laranja `#FF9D00` ou passa pro dourado do app?

## Dicas pra implementar
- Cores só por variável de `styles/global.css` (os nomes antigos foram mantidos e apontam pros valores do app; `--laranja` agora é o dourado `#E3A04A`).
- Sombras: `--sombra-cartao`, `--sombra-botao`, `--sombra-flutuante`, `--sombra-hero`.
- Fotos de capa: o app usa Unsplash fixo por viagem (`apps/mobile/src/ui/fotos.ts`). Usar a mesma regra pra a viagem ter a mesma capa nos dois.
- Uma etapa = um commit (`Web no estilo do app (spec 112): <tela>`), e o status atualizado na tabela acima.
- Sem navegador com login, conferir o que der (build, lint, telas sem login) e deixar o critério "lado a lado" desmarcado.

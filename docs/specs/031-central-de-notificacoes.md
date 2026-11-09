# 031. Central de notificações

**Fase:** 2 · **Tamanho:** M · **Depende de:** 002, 016, 019, 020, 021, 027, 028, 029 · **Status:** Pronto pra testar (web)

## Objetivo
Um sino com tudo que o comboio fez desde a minha última visita: gasto novo, lugar sugerido, enquete, comentário, foto, alguém que entrou. Tocar no item abre ele.

## Por que
- Roadmap #10 (Onda 1). Sem isso, quem abre o app não sabe o que mudou e volta pro WhatsApp pra perguntar.
- Base pra #11 Lembretes (push): o mesmo log pode virar aviso no celular depois.

## Inclui
- **Sino** no topo (celular) e "Novidades" no menu lateral (computador), com o número de novidades (até "9+").
- **Gaveta "Novidades":** as 50 mais recentes, com foto, "<nome> <o que fez> «<item>»" e "há quanto tempo". As novas ficam destacadas com um ponto laranja.
- Abrir a gaveta marca tudo como visto.
- Tocar abre o item: gasto e lugar com destaque (`?foco=`); os outros abrem a aba certa.
- O que entra no log: gasto do comboio, enquete, aviso do ADM, ponto de encontro, tarefa, lugar, hospedagem sugerida e escolhida, post de fotos, comentário (gasto, lugar, hospedagem), evento da agenda, trajeto, arquivo do cofre, pessoa que entrou no comboio.
- O que eu mesmo fiz aparece na lista ("Você…"), mas não conta como novidade.
- Atualiza ao abrir a viagem, ao voltar pra aba do navegador e a cada 2 minutos.

## Não inclui (fica pra depois)
- Push no celular (#11 Lembretes).
- Avisar mudanças (editar gasto, mudar data) e exclusões: só o que é **novo**.
- Notificação por pessoa ("te marcaram como responsável").
- Tempo real (Supabase Realtime).
- App mobile (web primeiro).

## Telas
- **Vazio:** "Nada novo por aqui · Quando alguém do comboio lançar um gasto, sugerir um lugar ou comentar, aparece aqui."
- Autor que saiu do app aparece como "Alguém".
- Erro ao carregar: o sino fica sem número e a gaveta mostra "Não deu pra carregar as novidades agora."

## Dados
- **Migration:** `supabase/migrations/20261029234828_central_de_notificacoes.sql`.
- `atividades_viagem` (`viagem_id`, `autor`, `tipo`, `alvo_id`, `titulo` até 200, `criado_em`): gravada **só por gatilho** (`privado.registrar_atividade()`, security definer). Ninguém insere, edita ou apaga pelo app.
- `atividades_vistas` (`viagem_id`, `usuario_id`, `visto_em`): o "visto até" de cada pessoa. O app grava a hora da atividade mais nova (hora do banco), não a do celular.
- **Privacidade:** gasto pessoal e comentário em gasto pessoal não entram no log.
- Apagar o item não apaga a linha do log (o link abre a aba; o item some). Apagar a viagem apaga tudo.

## Quem pode o quê
| Ação | ADM | Membro | Quem não é do comboio |
|---|---|---|---|
| Ver as novidades da viagem | ✅ | ✅ | ❌ |
| Marcar como visto (o próprio) | ✅ | ✅ | ❌ |
| Gravar/apagar no log | ❌ (só o banco) | ❌ | ❌ |

## Critérios de aceite
- [x] Gasto do comboio, lugar e evento entram no log com autor e título (testado no banco).
- [x] Gasto pessoal e comentário nele não entram (testado no banco).
- [x] Quem não é do comboio não vê; ninguém grava no log na mão (testado no banco).
- [x] Sino mostra o número; abrir a gaveta zera e continua zerado ao recarregar (testado no navegador).
- [x] Texto e link de cada tipo (testado: `notificacoes.test.mjs`).
- [x] `npm run build`, `npm run lint` e os testes passam.

## Perguntas em aberto
- Nenhuma. Decidido: log gravado por gatilho (mais confiável que montar na hora); só coisas novas, não edições.

## Dicas pra implementar
- Core: `packages/core/src/notificacoes.ts` (`descreverAtividade`, `contarNovas`, `buscarAtividades`, `buscarVistoEm`, `marcarAtividadesComoVistas`).
- Web: `features/notificacoes/` (`useNovidades`, `BotaoSino`, `Novidades`), ligado no `ViagemLayout`.
- Tipo novo no log: acrescentar no `check` da tabela, no gatilho e no `COMO` do core.
- Testes: `apps/web/tests/notificacoes.test.mjs` e `banco-specs.test.mjs` (seção 031).

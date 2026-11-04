# HANDOFF: rumo novo com âncora (03/11/2026)

> **Atualização (03/11, mais tarde):** os passos 1 a 3 do "Próximo passo exato" estão **feitos**: `docs/RUMO.md` reescrito, spec 118 virou [`118-passaporte-da-galera.md`](specs/118-passaporte-da-galera.md), spec nova [`120-hoje-com-reservas-do-grupo.md`](specs/120-hoje-com-reservas-do-grupo.md), FILA (Fase 0 nova), ROADMAP, `specs/README.md` e AGENTS.md seção 5 ajustados. Próximo: task 0.1 da FILA (3 telas falsas pra 10 organizadores).

## Onde estamos
- O benchmark de 11/2026 está completo em `docs/benchmark-2026-11/`, partes 00 a 09. A **09-ancora-opcoes.md** é a conclusão.
- Os arquivos `docs/RUMO.md` e `docs/specs/118-ciclo-viagem-sem-climao.md` foram escritos **antes** da decisão final. Eles põem a **cobrança de Pix como âncora**, e o Victor **rejeitou** isso ("não faz sentido nenhum"). **Precisam ser reescritos.**
- A FILA (Fase 0), o ROADMAP, `specs/README.md` e AGENTS.md seção 5 também apontam pro ciclo do Pix. Precisam ser ajustados junto.
- Commits locais, **sem push**: 88194a8, eeeed8d, 86f486d e o deste HANDOFF.

## O que o Victor decidiu (03/11)
1. **Âncora = Passaporte da galera:** "o mapa de todas as viagens e rolês da sua galera".
   - Cada lugar vira carimbo com arte local e data, liberado quando alguém do grupo está lá (localização ou foto), sem digitar.
   - O mapa do grupo acende, com disputa leve entre os amigos.
   - A retrospectiva monta sozinha o post e o caderno (moldura de Réveillon e Carnaval).
   - "Há 1 ano vocês estavam em…".
   - Widget com a contagem da próxima viagem.
   - Dá pra preencher viagens antigas.
   - Rolê, show e bate-volta também contam: é o que resolve a frequência baixa.
2. **O app não é só a âncora.** São 3 camadas:
   - **Âncora:** o passaporte da galera (o que aparece no vídeo, na loja e no post).
   - **Na viagem:** o modo **"Hoje"**, com o plano do dia, horários, endereço da casa, voo e check-in, ou seja, as reservas **do grupo**. O "Hoje" alimenta o passaporte: chegou no lugar do roteiro, sai o carimbo. Base: `apps/mobile/app/hoje.tsx`.
   - **Base:** planejar (hospedagem com busca e votos, transporte, roteiro por dia, gastos). Fica, sem inventar coisa nova. **Roteiro do dia e transportes NÃO são congelados** (corrigir a lista de congelados do RUMO).
3. **Porta de entrada:** convite que todo mundo topa sem instalar, estilo Partiful (web leve pro convidado). **Fase 2:** "copiar a viagem de outro grupo", estilo Xiaohongshu; cada passaporte terminado vira modelo.
4. **IA invisível, nunca como âncora** (virou commodity: Expedia comprou a Layla, Booking e Expedia rodam dentro do ChatGPT). A IA serve pra tirar digitação:
   - print ou e-mail da reserva aparecer no "Hoje" do grupo (estilo TripIt);
   - "jantar 84" virar gasto;
   - legenda da retrospectiva;
   - foto ou lugar virar carimbo.
5. **Pix:** sai do papel de âncora. No máximo, o Pix copia-e-cola fica como detalhe do Financeiro no acerto.
6. **Público:** o organizador do grupo é quem a gente persegue. Solo e casal usam sem atrito, sem funcionalidade exclusiva. O viajante solo quer conhecer gente (tripbff), que é outro produto.

## Próximo passo exato
1. Reescrever `docs/RUMO.md` com as 3 camadas, a âncora, a IA invisível, o público, os congelados corrigidos, a monetização (assinatura do organizador, grátis pro grupo, nunca cobrar antes do valor), a distribuição e a validação. A validação agora é **3 telas falsas, uma por opção da parte 09, mostradas pra 10 organizadores: "qual você postaria?"**.
2. Reescrever a spec 118 como **"Passaporte da galera"**, dividida em partes: carimbo, mapa do grupo, retrospectiva, "há 1 ano", widget, viagens antigas. Criar a **spec 120: "Hoje" com reservas do grupo**. A 119 (Passe/RevenueCat) continua congelada.
3. Ajustar a FILA (Fase 0 nova), o ROADMAP, `specs/README.md` e AGENTS.md seção 5 (o convidado age pela web leve; RUMO manda).
4. Commit local. **Push só se o Victor pedir.**

## Cuidados
- Ler antes: `AGENTS.md`, `docs/benchmark-2026-11/09-ancora-opcoes.md` e as partes 06, 07 e 08 por cima.
- Mudança de banco = migration nova + pedir confirmação.
- O MP4 em `docs/marketing/video/saida/` sai antes de juntar na main (ver `docs/HANDOFF-video-do-app.md`).
- Responder sempre em pt-BR.

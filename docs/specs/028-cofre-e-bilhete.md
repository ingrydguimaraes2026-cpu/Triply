# 028. Cofre da viagem + bilhete no trajeto

**Fase:** 2 · **Tamanho:** M · **Depende de:** 004 · **Status:** Pronto pra testar (web)

## Objetivo
Guardar reservas, ingressos e passagens (PDF ou foto) num lugar só, que o comboio inteiro abre. O bilhete do trem ou voo fica direto no trajeto: na hora de embarcar, é um toque.

## Por que
- Roadmap #12 (Cofre) e #13 (Bilhete no trajeto), Onda 1. Hoje o PDF da reserva fica perdido no e-mail de uma pessoa só.
- Feitos juntos: o bilhete é **um arquivo do cofre ligado a um trajeto**. Uma tabela, um bucket, uma regra de acesso.

## Inclui
- Cartão **Cofre** na Overview: lista (nome, tamanho, quem enviou, "bilhete" quando é de um trajeto), abrir, guardar arquivo, apagar.
- Na aba Transportes, em cada trajeto: **Anexar bilhete** (não tem) ou **Abrir bilhete** (tem).
- PDF, JPG, PNG ou WebP, até 10 MB.
- Apagar a viagem apaga os arquivos do cofre também.

## Não inclui (fica pra depois)
- Pastas, renomear arquivo, trocar o bilhete de trajeto (apaga no cofre e anexa de novo).
- Vários bilhetes por trajeto na tela (o banco aceita; a tela mostra o primeiro).
- Arquivo "só pra mim" (tudo no cofre é do comboio).
- Ler o PDF e preencher o trajeto sozinho (Onda 2).
- Offline (vai com #15).
- App mobile (web primeiro).

## Telas
- **Cofre (Overview):** vazio: "Cofre vazio · Guarde aqui reservas, ingressos e passagens em PDF ou foto." Botão tracejado "Guardar arquivo" abre o seletor do aparelho. Nome do arquivo é o link (abre em outra aba). Lixeira só pra quem enviou ou pro ADM, com confirmação.
- **Trajeto (Transportes):** link "Anexar bilhete" (clipe) abaixo da reserva; depois de enviado vira "Abrir bilhete" (ingresso).
- Erros em vermelho: tipo errado, mais de 10 MB, falha de internet.

## Dados
- **Migration:** `supabase/migrations/20261029225050_cofre_da_viagem.sql`.
- Bucket `cofre` privado (10 MB, só PDF e imagens). Caminho `<viagem_id>/<uuid>.<ext>`; a policy confere a pasta.
- Tabela `arquivos_viagem` (`viagem_id`, `trajeto_id` opcional, `nome`, `caminho`, `tipo`, `tamanho`, `enviado_por`, `criado_em`).
  - Caminho tem que começar pela viagem (check).
  - Gatilho: trajeto tem que ser da mesma viagem; viagem, caminho e quem enviou não mudam depois.
  - Apagar o trajeto não apaga o arquivo (fica no cofre, `trajeto_id` vira nulo).
- Links de abrir são temporários (1 hora), porque o bucket é privado.

## Quem pode o quê
| Ação | ADM | Membro | Quem não é do comboio |
|---|---|---|---|
| Ver e abrir arquivos | ✅ | ✅ | ❌ |
| Guardar arquivo / anexar bilhete | ✅ | ✅ | ❌ |
| Apagar arquivo que enviou | ✅ | ✅ | — |
| Apagar arquivo de outra pessoa | ✅ | ❌ | — |

## Critérios de aceite
- [x] Guardar um PDF no cofre aparece na lista e abre (testado no navegador).
- [x] Anexar bilhete num trajeto troca o link pra "Abrir bilhete" e o arquivo abre (testado no navegador).
- [x] O bilhete aparece no cofre com o selo "bilhete".
- [x] Apagar some da lista e do storage.
- [x] Quem não é do comboio não vê nem envia; membro não apaga arquivo dos outros (testado no banco).
- [x] Trajeto de outra viagem é recusado (testado no banco).
- [x] `npm run build`, `npm run lint` e os testes passam.

## Perguntas em aberto
- Nenhuma. Decidido: cofre e bilhete na mesma tabela; 10 MB; 1 bilhete por trajeto na tela.

## Dicas pra implementar
- Web: `features/cofre/api.ts` (listar com links, enviar com rollback, apagar, limpar a viagem), `hooks.ts` (`useCofre`), `Cofre.tsx` e `BilheteDoTrajeto.tsx`.
- Testes: `apps/web/tests/banco-specs.test.mjs` (seção 028).

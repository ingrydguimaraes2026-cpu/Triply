# 026. Endereço e guia da casa

**Fase:** 2 · **Tamanho:** P · **Depende de:** 011 · **Status:** Pronto pra testar (web)

## Objetivo
Na hospedagem escolhida, o comboio vê num lugar só o **endereço**, o **Wi-Fi** (rede e senha), o **código da porta** e as **regras da casa**. Ninguém precisa caçar a mensagem do anfitrião no WhatsApp.

## Por que
- Roadmap #14 (Onda 1, "não sair do app"). Na chegada, todo mundo pergunta a mesma coisa: "qual o endereço?", "qual a senha do Wi-Fi?". A informação fica perdida no e-mail da reserva de uma pessoa só.

## Inclui
- Bloco **"Guia da casa"** dentro do cartão da hospedagem **escolhida** (aba Hospedagem).
- **Endereço** com botão "Abrir no mapa" (Google Maps).
- **Wi-Fi:** rede e senha, com botão **"Copiar senha"**.
- **Código da porta / cofre de chaves** e **regras da casa** (texto livre: silêncio, lixo, onde deixar a chave…).
- Botão **"Editar guia"** abre uma gaveta com os 5 campos.

## Não inclui (fica pra depois)
- Mostrar o guia na Overview ou numa tela "Hoje" (Onda 2).
- Guia em opções que não foram escolhidas.
- Importar os dados da reserva automaticamente (Onda 2, "Importar sem digitar").
- App mobile (web primeiro; vai pro mobile depois).

## Telas
- **Hospedagem → cartão "Onde vocês vão ficar":** abaixo das datas, o bloco "Guia da casa".
  - Com dados: mostra só os campos preenchidos.
  - Vazio: "Ninguém preencheu o guia ainda." + "Preencher guia" (só pra quem pode editar).
  - Copiar senha: o botão vira "Copiado!" por 2 segundos.
- **Gaveta "Guia da casa":** endereço, rede do Wi-Fi, senha do Wi-Fi, código da porta, regras. Salvar / Cancelar. Erro aparece em cima do botão.

## Dados
- Tabela `hospedagens` (spec 011). **Migration nova, aditiva:** 5 colunas de texto opcionais: `endereco` (até 300), `wifi_rede` (até 100), `wifi_senha` (até 100), `codigo_porta` (até 50), `regras_casa` (até 1000).
- **Sem regra nova de acesso:** as policies da 011 já valem. Quem está no comboio vê; quem criou a opção ou o ADM edita.
- Senha do Wi-Fi e código da porta ficam em texto puro: é informação que o comboio inteiro precisa e já divide hoje pelo WhatsApp. Não são credenciais de conta. O link de compartilhar e o convite não mostram nada disso; só quem é do comboio lê.

## Quem pode o quê
| Ação | ADM | Quem adicionou a opção | Outro membro |
|---|---|---|---|
| Ver o guia | ✅ | ✅ | ✅ |
| Preencher / editar o guia | ✅ | ✅ | ❌ |

## Critérios de aceite
- [ ] Na hospedagem escolhida aparece o bloco "Guia da casa"; nas outras opções, não.
- [ ] Quem adicionou a opção ou o ADM preenche e salva; ao recarregar, os dados continuam lá.
- [ ] Outro membro vê o guia, mas não vê o botão de editar (e o banco recusa se tentar).
- [ ] "Copiar senha" copia a senha do Wi-Fi; "Abrir no mapa" abre o endereço no Google Maps.
- [ ] Quem não é do comboio não lê nada (testado no banco).
- [ ] Campo maior que o limite é recusado pelo banco.
- [ ] `npm run build`, `npm run lint` e os testes passam.

## Perguntas em aberto
- Nenhuma. Decidido: edita quem adicionou a opção ou o ADM (mesma regra da 011); senha em texto puro.

## Dicas pra implementar
- Migration: `supabase/migrations/20261029223421_guia_da_casa.sql`. Teste em `apps/web/tests/banco-specs.test.mjs` (seção 026).
- API: `salvarGuiaDaCasa` em `features/hospedagem/api.ts`. O `editarOpcao` não mexe nesses campos, então um não apaga o outro.
- Tela: `features/hospedagem/GuiaDaCasa.tsx`, usado no `cartaoDaOpcao` de `pages/viagem/Hospedagem.tsx` quando `destaque`.

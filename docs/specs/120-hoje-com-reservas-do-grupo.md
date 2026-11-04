# 120. "Hoje" com as reservas do grupo

**Fase:** 0 · **Tamanho:** G (dividida em 120a a 120c) · **Depende de:** 004, 011, 028, 029, 058, 117 · **Status:** 120a pronta pra testar (app e site, 03/11/2026) · banco aplicado · 120b e 120c a fazer

> Camada 2 do [`docs/RUMO.md`](../RUMO.md): o que faz abrir o app todo dia durante a viagem. Alimenta o [passaporte da galera (118)](118-passaporte-da-galera.md).

## Objetivo
Durante a viagem, uma tela só com o dia do grupo: o plano de hoje com horários, o endereço da casa, o check-in, e o voo ou ônibus de cada um. As reservas entram sem digitar: a pessoa manda o print ou o PDF e elas aparecem no "Hoje" de todo mundo. Chegou no lugar do roteiro, sai o carimbo.

## Por que
- Benchmark parte 06: "ao vivo no dia" é o motor de frequência (Flighty, Polarsteps), e "zero digitação" (TripIt) já é o esperado.
- Hoje a reserva fica no e-mail de uma pessoa só; o grupo pergunta no WhatsApp "qual o endereço?", "que horas é o check-in?", "quem chega que horas?".
- O TripIt faz isso pra uma pessoa. Ninguém faz **pro grupo**.
- Já temos quase tudo: a tela Hoje (058, `apps/mobile/app/hoje.tsx`), agenda do dia (029), trajetos (004), hospedagem escolhida (011) e o cofre (028).

## Inclui (em 3 partes)

### 120a · Reservas do grupo no "Hoje"
- O "Hoje" ganha os blocos, nesta ordem:
  1. **Agora / Próximo** (já existe, 058);
  2. **Onde dormimos:** nome e **endereço da casa** com "Ir", horário de check-in e check-out, código de acesso ou contato do anfitrião (se houver);
  3. **Quem chega e quem sai hoje:** voo, ônibus ou carro de cada um, com horário e "quem vai buscar" (vindo dos trajetos, 004 e 067);
  4. **Plano do dia:** os lugares do roteiro de hoje com horário (029), cada um com "Ir" e **"Cheguei"**.
- Cada item com reserva tem **"ver reserva"** (abre o arquivo do cofre, 028).
- O "Hoje" abre sozinho quando a viagem está acontecendo (era o "não inclui" da 058).

### 120b · Reserva entra sem digitar (IA invisível)
- Botão "adicionar reserva" com 3 jeitos: **mandar print**, **mandar PDF** ou **colar o texto** do e-mail.
- Também pelo compartilhar do celular: no app do banco, da companhia aérea ou do Airbnb, "compartilhar" → Tripwave.
- A IA lê e devolve um rascunho: tipo (voo, ônibus, casa, carro, ingresso, restaurante), data, horário, endereço, código da reserva e de quem é.
- A pessoa confere e confirma (1 toque). O rascunho vira o que já existe:
  - voo, ônibus, carro → trajeto (004);
  - casa, hotel → hospedagem escolhida do destino (011), com check-in e check-out;
  - ingresso, restaurante, passeio → item da agenda do dia (029).
- O arquivo original vai pro cofre (028), ligado ao item.
- Se a IA não entender, abre o formulário normal já com o que conseguiu ler.

### 120c · "Cheguei" vira carimbo
- Tocar "Cheguei" num lugar do plano do dia (ou chegar na casa no dia do check-in, com o app aberto e a permissão de localização) avisa o grupo ("Ana chegou na casa") e **libera o carimbo do lugar** (118a).
- O "Cheguei" da casa substitui o "cheguei bem" (051) durante a viagem.

## Não inclui (fica pra depois)
- Encaminhar e-mail pra um endereço do Tripwave (precisa de e-mail de entrada; ver 015). Na 1ª versão, print, PDF e texto colado.
- Ler a caixa de e-mail da pessoa sozinho (Gmail).
- Status do voo ao vivo (atraso, portão). Precisa de API paga.
- Live Activity na tela de bloqueio.
- Reserva "só minha" escondida do grupo (tudo no "Hoje" é do grupo; documento pessoal continua fora).
- Mudar a web: o "Hoje" é do app. O convidado pelo link vê só o plano do dia, sem as reservas.

## Telas
- **Hoje (app):** os 4 blocos acima, de cima pra baixo, com "Ir", "ver reserva" e "Cheguei". Rolagem única, sem abas.
- **Adicionar reserva:** 3 botões (print, PDF, colar texto) → "lendo..." (esqueleto) → rascunho pra conferir → confirmar.
- Estados: viagem sem reserva ainda ("mande o print da reserva da casa e ela aparece aqui pra todo mundo"), fora das datas da viagem (mostra o próximo dia da viagem), leitura falhou ("não consegui ler; preenche o que faltar"), sem internet (mostra o que está guardado, 034).
- Tudo em 360px. Nada de emoji; ícones do catálogo.

## Dados
- Usa: trajetos (004), hospedagem escolhida (011), agenda (029), cofre (028), membros, chegadas (`packages/core/src/chegadas.ts`).
- **Tentar não criar tabela nova:** a reserva lida vira trajeto, hospedagem ou item da agenda, e o arquivo vai pro cofre.
- **Pode precisar mudar (migration nova, pedir confirmação antes):** campos que faltarem, como código da reserva, check-in/check-out e endereço na hospedagem escolhida, e o vínculo do arquivo do cofre com hospedagem e agenda (hoje o cofre só liga com trajeto).
- A leitura por IA roda numa Edge Function (a chave fica no servidor, nunca no app). A imagem vai pro cofre; o texto lido não é guardado à parte.

## Quem pode o quê
| Ação | ADM (organizador) | Membro | Convidado pelo link |
|---|---|---|---|
| Ver o "Hoje" com as reservas | sim | sim | só o plano do dia, sem reservas |
| Adicionar reserva (print, PDF, texto) | sim | sim | não |
| Editar ou apagar reserva | sim | só a que ele adicionou | não |
| "Cheguei" | sim | sim | não |

## Critérios de aceite
- [ ] Mando o print da reserva do Airbnb e, em até 15 s, vejo o rascunho com endereço, check-in e check-out; confirmo e a casa aparece no "Hoje" de todo mundo.
- [ ] Mando o PDF de um voo e ele vira trajeto com horário e a pessoa certa; aparece em "quem chega hoje" no dia.
- [x] "Ver reserva" abre o arquivo original. (120a: no bilhete do trajeto, no "Onde dormimos" e nos itens da agenda, pelo cofre. No site dá pra anexar a reserva ali mesmo; no app só abre.)
- [ ] Leitura que falha abre o formulário com o que deu pra ler, sem perder o arquivo.
- [x] Num dia da viagem, o app abre direto no "Hoje". (120a: no app, o Início leva pra viagem, uma vez por abertura; no site, abrir a viagem leva pro Hoje, uma vez por aba.)
- [ ] "Cheguei" num lugar do roteiro avisa o grupo e libera o carimbo (118a).
- [x] O convidado pelo link vê o plano do dia, mas não o endereço nem o código da reserva. (120a: conta de convidado no app e no site esconde "Onde dormimos" e os bilhetes. A web leve `/v/` é a 0.8.)
- [ ] Tudo funciona em 360px. (120a: bilhete e plano conferidos em 360px no site com uma página de teste; a tela logada e o app ficam pra conferir com conta de teste.)

## Como ficou a 120a (03/11/2026)
- Regra: `packages/core/src/hoje-do-grupo.ts` (`quemChegaESaiHoje`, `planoDoDia`, `arquivoDeCadaTrajeto`, `viagemAcontecendo`). Teste: `apps/web/tests/hoje-do-grupo.test.mjs`.
- App: `apps/mobile/app/hoje.tsx` + `src/ui/BilheteDoDia.tsx`; abre sozinho em `app/index.tsx`.
- Site: `apps/web/src/pages/viagem/Hoje.tsx` + `src/features/hoje/ReservasDoDia.tsx` (o pedido foi fazer no site também, apesar do "não inclui").
- "Cheguei" hoje avisa o grupo (chegadas, 051) e marca o lugar como visitado. O carimbo é a 120c.
- Banco (`20261103120000_reservas_no_hoje.sql`, aplicado 03/11): arquivo do cofre amarra em hospedagem e agenda, `hospedagens.contato_anfitriao`, `trajetos.quem_busca_id`. Onde preencher (site): contato no formulário da hospedagem, "quem vai buscar" no do trajeto, reserva anexada no Hoje.

## Perguntas em aberto
- O endereço da casa e o código de acesso podem aparecer pro convidado pelo link? (proposta: não, só pra quem está no comboio com conta)
- Qual modelo lê a reserva e quanto custa por leitura? (proposta: um modelo pequeno com visão; limite por viagem no grátis)
- "Cheguei" da casa pela localização sozinho, ou sempre com toque? (proposta: com toque, e sugerido pela localização)

## Dicas pra implementar
- **Ordem sugerida:** 120a (só juntar o que já existe na tela) → 120c (liga com o carimbo) → 120b (a leitura por IA).
- Base: `apps/mobile/app/hoje.tsx` e as regras de `packages/core/src/hoje.ts`, `agenda.ts`, `chegadas.ts`.
- Cofre: tabela e bucket da 028; no app, o mesmo upload das fotos.
- Leitura de reserva: Edge Function nova; publicar pela CLI (`supabase functions deploy`), nunca colando o código na conversa.
- Compartilhar pro app (share extension) precisa de build nativo (EAS); a 1ª versão pode ser só pelo botão dentro do app.
- A regra "qual reserva é de hoje" e "quem chega hoje" fica no `packages/core`, com teste.

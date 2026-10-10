# Requisitos — conversa de 10/10/2026

Resumo do áudio (15min). Só o que importa pro app; papo aleatório removido.

> **Atualização:** vai ser **website primeiro, com PWA** (instala no celular pelo navegador), não app de loja. O nome **Triply mudou pra "Together"** (provisório), porque Triply já existe. Ver `benchmark.md`.

## Fluxo inicial

- Login.
- Primeiro acesso sem viagem → tela pra escolher destino(s) da viagem.
- Depois disso → **dashboard principal** com **mapa** e **bandeirinhas** nos destinos escolhidos.

## Abas da viagem

| Aba | O quê |
|---|---|
| **Overview** | Aba principal do dashboard. Junta as informações de todas as outras. |
| **Transportes** | Trajetos entre destinos e como ir de um lugar pro outro. |
| **Financeiro** | Orçamento, gastos e câmbio. |
| **Fotos** | Feed estilo Pinterest. |

## Comboio (grupo da viagem)

- "Comboio" = grupo de pessoas que viajam juntas. Nome decidido.
- Os dados passam a ser compartilhados entre usuários. Precisa de permissões no banco (RLS no Supabase).
- Papéis:
  - **ADM**: quem organiza. Escolhe destinos, transportes, idas e voltas.
  - **Membro**: mais pra ver as coisas. Pode adicionar fotos e gastos compartilhados (confirmar).

## Fotos

- Armazenadas no **Supabase Storage**. Plano grátis dá 1 GB; o Pro custa US$ 25/mês.
- **Só foto, sem vídeo.**
- **Comprimir no upload.** Ex.: 2 MB → ~200–300 KB, o que dá uns 3–5 mil fotos no 1 GB.
- Ideia de limite: **escolher as 5 melhores fotos por país/viagem** (ainda não decidido).
- O feed é visível pro comboio.

## Financeiro

- **Orçamento geral da viagem**, dividido em categorias:
  - transporte
  - hospedagem
  - comprinhas / gastos aleatórios
- **Gastos compartilhados com o comboio**, tipo "quem pagou o quê". Ex.: "você pagou o café todo".
- **Gastos pessoais** (comprinhas) podem ser individuais e privados.
- **Câmbio**:
  - registrar cada compra de moeda (ex.: euro) com a cotação do dia;
  - mostrar quanto cada pessoa tem de cada moeda;
  - métrica de **cotação média de compra**, pra saber se o dinheiro está rendendo.
- Referência de uso real: dinheiro numa conta só, com 2 cartões, como gasto da viagem.

### Problema em aberto: ninguém quer lançar gasto no meio da viagem

- A Ingryd lançaria à noite, no hotel. O Victor não lançaria.
- Ideia: ler os **e-mails de notificação de compra** do banco e classificar automaticamente.
- Ressalva: o e-mail não traz o contexto (quem pagou, como dividir). **Pensar melhor.**
- Os dois são perfis de usuário opostos, o que é bom pra testar.

## Transportes

- Calcular o deslocamento entre pontos. Ex.: "vou pra X e preciso voltar pra Y porque o Airbnb está lá".
- Sugerir o meio de transporte (ônibus, trem…).
- Tratar o **bate-e-volta** (horários de ônibus/trem). Casos reais:
  - Nice → Mônaco → volta pra Nice, o que exige +1 diária de Airbnb;
  - trem pra Suíça.
- Comparação: ir direto Nice → Mônaco → Milão, sem voltar.
- Ainda **não tem desenho visual**.

## Ordem de trabalho

1. **Backend primeiro** (Supabase: tabelas, login, RLS, storage).
2. Front-end depois.

## Decisões em aberto

- [ ] Limite de fotos: 5 por país ou um limite por tamanho?
- [ ] O que o membro do comboio pode editar?
- [ ] Como lançar gastos sem atrito (e-mail do banco? lançamento rápido?)
- [ ] Fonte de dados pra horários de ônibus/trem

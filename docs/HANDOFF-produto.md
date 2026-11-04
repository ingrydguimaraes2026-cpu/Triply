# HANDOFF: sessão de produto (jornada, teste do réveillon, preço)

Data: 03/11/2026. Branch `monorepo-split`. Só documentos: nada de código, banco ou migration.

## Pronto
- `docs/produto/JORNADA.md`: jornada em 5 fases (antes do antes, antes, durante, depois, entre viagens), com o que o grupo faz hoje, o que o app tem, até 3 ideias e o motivo pra voltar. Termina na aposta central.
- `docs/produto/TESTE-REVEILLON.md`: 5 grupos reais (3 da lista de espera, 2 amigos de amigos, +2 de reserva), o que cada um faz, o que medir, roteiros Mom Test antes e depois, datas de 03/11 a 19/01 e a barra de decisão.
- `docs/produto/PRECO.md`: hipótese de preço. Grátis sem limite pro grupo; Passe da viagem a R$ 29,90 pro comboio (testar 19,90 / 29,90 / 49,90); preço só no cadeado; parceiros; consultas SQL na `interesse_no_passe`.

## Decisões propostas (Victor precisa validar)
1. **Aposta central contestada:** em vez de "fazer a viagem sair do papel", proponho **"ninguém fica devendo e ninguém precisa cobrar"** (o dinheiro do grupo, do sinal da casa ao último pix). "Sair do papel" fica como gancho de marketing e porta de entrada (viagem rascunho "Bora?").
2. **Métrica norte candidata:** comboios que fecharam a conta no app no mês.
3. **Próximas specs sugeridas:** acerto pago + fechamento + cobrança gentil → sinal da casa → viagem rascunho "Bora?" → "Bora de novo?" e feriados.

## Próximo passo exato
1. Victor lê a aposta central e decide.
2. **Até 08/11:** mandar o convite pra lista de espera (texto pronto no TESTE-REVEILLON) e pedir indicações.
3. **Até 13/11:** decidir como o app chega no celular dos grupos (TestFlight/EAS ou site como plano B).
4. Apagar as linhas de teste em `interesse_no_passe` antes de medir.

## Cuidados
- O réveillon **não testa** o "antes do antes": os grupos já decidiram o destino. Ver "Grupos extras" (carnaval 2027).
- Mostrar o preço na tela do Passe e gravar o preço visto é código + migration: sessão de dev, com confirmação.
- Números de mercado só de `reports/`. O resto está marcado como hipótese.

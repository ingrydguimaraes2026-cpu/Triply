# HANDOFF: repensar a jornada e a tela da viagem (antes do TestFlight)

Data: 02/11/2026. Pedido do Victor: "não gosto desses cards... muito texto, muita coisa na tela faz o usuário se cansar e sair. Lembrar a jornada completa do usuário, do login até o fim da viagem. Já me perdi no objetivo do app. Precisa melhorar muito pra lançar o teste pra Apple. Podemos pegar referência no X."

## O que está pronto (não mexer agora)
- Ícones próprios: selos + Phosphor Duotone no app e no site, sem emoji (`docs/design/ICONES.md`, commits 7c7ceac e 21b9ddf).
- Avisos do celular sem emoji, funções do Supabase publicadas (lembretes, resumo-da-noite e avisos-cambio com `--no-verify-jwt`; o repo não tem `supabase/config.toml`, então todo deploy pela CLI precisa da flag nessas três).
- Onboarding v2 (spec 116), Explorar com deslize (114), jornada do grupo (115): prontos pra testar.

## O problema (diagnóstico da tela `app/viagem/[id].tsx`)
1. **É um menu, não uma jornada.** 11 cartões do mesmo tamanho (Explorar, Hoje, Roteiro, Transporte, Hospedagem, Lugares, Contas, Fotos, Documentos, Retrospectiva, PDF): tudo pesa igual, então nada é importante.
2. **Texto demais.** Cada cartão tem ícone + título + subtítulo; o "Montem a viagem" é mais uma lista de 6 linhas com texto.
3. **A tela é igual em todo momento.** Quem está sonhando, quem embarca amanhã e quem já voltou veem a mesma grade.

## A direção (proposta, validar com o Victor)
- **A viagem tem fases**, e a tela muda com a fase:
  sonhando (sem data) → planejando (com data, falta resolver coisas) → falta pouco (≤7 dias) → na viagem (vira o "Hoje") → voltou (fotos, contas acertadas, retrospectiva).
- **Uma ação grande por vez.** O topo mostra só a próxima coisa a fazer, grande, com foto/selo e um botão. O resto some pra uma barra de abas curta (Roteiro, Contas, Fotos, Galera) ou um "tudo da viagem" escondido.
- **Progresso visual, não lista.** Ex.: passaporte que vai ganhando os selos conforme o grupo resolve (roteiro, datas, onde dormir, como chegar, contas). Pouco texto, muito desenho.
- **O grupo à vista.** Rostos de quem já entrou e do que falta cada um fazer (é o que traz a pessoa de volta).

## Próximo passo exato (sessão nova)
1. Escrever `docs/JORNADA.md` numa página: cada fase, o objetivo dela, a ÚNICA ação principal e o que a pessoa vê. Do login ao "voltou". Mostrar pro Victor antes de desenhar.
2. Buscar referências no X (o Victor deixa logado no navegador interno): apps de viagem e de grupo (Polarsteps, Wanderlog, Airbnb Viagens, Splitwise, Partiful, Duolingo pelo caminho/progresso). Guardar os prints em `docs/design/referencias/`.
3. Fazer 3 direções da tela da viagem **com foto e tela de celular de verdade** (o Victor não escolhe sem ver; ver `fotos-icones` no HANDOFF anterior: HTML + Chrome headless → PNG). Ele escolhe uma.
4. Implementar no app primeiro (`apps/mobile`, regra "mobile primeiro"), depois o essencial no site. Escrever/atualizar spec antes (`docs/specs/`).

## Cuidados
- Não apagar funcionalidade: o que sair da tela principal continua acessível (abas ou "tudo da viagem").
- Viagens de teste na conta logada: "Lisboa" (e1004c1f…), "Paris" (9fb15741…) e outras. Não apagar sem perguntar.
- PR pra `main`: ainda NÃO (Victor, 02/11).

# 071. Mover evento entre dias

**Fase:** 2 · **Tamanho:** P · **Depende de:** 029 · **Status:** Pronto pra testar (web)

## Objetivo
Na Agenda, setas ‹ › em cada evento editável passam ele pro dia anterior ou seguinte (a tela vai junto pro dia novo).

## Por que
- Catálogo B8. Choveu, o museu fechou: mudar o plano de dia tem que ser um toque.
- Setas em vez de arrastar: arrastar no celular é frágil e difícil de acertar.

## Inclui
- ‹ › nos eventos que a pessoa pode editar (quem criou ou ADM), dentro do período da viagem.
- A ordem dentro do dia continua pela hora.

## Não inclui (fica pra depois)
- Arrastar e soltar de verdade (computador).
- Mover trajetos (eles têm data e hora reais).

## Dados
- Nenhuma mudança no banco (usa a edição do evento, spec 029).

## Critérios de aceite
- [ ] No navegador: mover "Jantar" de terça pra quarta com ›.

# 033. Preferências de aviso no celular

**Fase:** 2 · **Tamanho:** P · **Depende de:** 014, 031, 032 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
Cada pessoa escolhe o que quer receber no celular: lembretes de horário, resumo da noite e fotos do comboio.

## Por que
- Catálogo G4 (central de notificações com preferências por tipo). Sem isso, quem se irrita com push desliga tudo no sistema e perde o lembrete do trem.

## Inclui
- Três chaves no painel "Avisos no celular" (gaveta Novidades): **Lembretes de horário**, **Resumo da noite**, **Fotos do comboio**.
- Padrão: tudo ligado. A escolha vale pra todas as viagens e todos os aparelhos da pessoa.
- As funções `lembretes` e `avisos-feed` respeitam a escolha.

## Não inclui (fica pra depois)
- Escolha por viagem.
- Horário de silêncio.
- O boletim do câmbio continua com o liga/desliga dele (Financeiro).

## Telas
- Gaveta Novidades → "Avisos no celular" → "Ajustar": lista com caixinhas. Se der erro ao salvar, volta a caixinha e mostra "Não deu pra salvar".

## Dados
- **Migration:** `supabase/migrations/20261030020000_preferencias_de_aviso.sql`.
- `preferencias_aviso` (`usuario_id`, `tipo` em lembretes/fotos/resumo, `ligado`). Sem linha = ligado.

## Quem pode o quê
| Ação | A própria pessoa | Outra pessoa |
|---|---|---|
| Ver e mudar as preferências | ✅ | ❌ |

## Critérios de aceite
- [x] Cada um liga/desliga os próprios avisos e não vê os dos outros (testado no banco).
- [x] Ninguém grava preferência no nome de outro; tipo inventado é barrado (testado no banco).
- [ ] Desligar "Fotos do comboio" e não receber o push de post novo (depois de aplicar o banco e publicar a função).

## Perguntas em aberto
- Nenhuma.

## Dicas pra implementar
- Core: `buscarPreferenciasDeAviso`, `marcarPreferenciaDeAviso`, `TIPOS_DE_AVISO` em `packages/core/src/lembretes.ts`.
- Tipo novo de aviso: acrescentar no `check` da tabela (migration nova) e em `TIPOS_DE_AVISO`.

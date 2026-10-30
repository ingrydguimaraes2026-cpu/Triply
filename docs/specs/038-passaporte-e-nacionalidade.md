# 038. Passaporte: nacionalidade e validade

**Fase:** 2 · **Tamanho:** P · **Depende de:** 008, 010 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
A pessoa informa no perfil o(s) país(es) do passaporte e a validade. O app avisa se o passaporte vence a menos de 6 meses da volta, e o ADM sabe quem do comboio precisa renovar.

## Por que
- Catálogo I2 e I3. Passaporte vencendo é motivo clássico de embarque negado; dupla cidadania (comum em brasileiros com passaporte italiano/português) muda as regras de entrada.

## Inclui
- **Perfil → Passaporte:** nacionalidades (até 3, digitando o nome do país) e data de validade. Nunca o número.
- **Overview → Documentos:** "Passaporte válido até…", "vence menos de 6 meses depois da volta, renove" ou "venceu". Sem data: link pro perfil.
- Com passaporte europeu e destino Schengen: "visto Schengen e ETIAS não valem pra você".
- **ADM:** "Passaporte vencendo perto da viagem: Ingryd, Ana" (sem mostrar a data de ninguém).

## Não inclui (fica pra depois)
- Regras por país diferentes de 6 meses (ex.: 3 meses em alguns Schengen). Usamos a mais comum e segura.
- Checklist inteiro recalculado pela nacionalidade (hoje o checklist assume passaporte brasileiro).
- App mobile.

## Dados
- **Migration:** `supabase/migrations/20261030040000_passaporte_e_nacionalidade.sql`.
- `documentos_pessoais` (`nacionalidades` ISO, `passaporte_validade`): só a própria pessoa vê.
- `alertas_de_passaporte(viagem)`: devolve quem precisa olhar (vence / sem data), sem a data.

## Quem pode o quê
| Ação | A pessoa | ADM | Membro | Quem não é do comboio |
|---|---|---|---|---|
| Ver/mudar a própria validade e nacionalidade | ✅ | — | — | — |
| Ver a data dos outros | — | ❌ | ❌ | ❌ |
| Saber quem precisa renovar | — | ✅ | (a função responde, a tela só mostra pro ADM) | ❌ |

## Critérios de aceite
- [x] Só a pessoa vê a própria linha; o comboio recebe só o alerta; estranho não recebe nada (testado no banco).
- [x] País inválido, 4 nacionalidades e gravar no nome de outro são barrados (testado no banco).
- [x] ok / renovar / vencido / sem data; passaporte europeu (testado: `passaporte.test.mjs`).
- [ ] No navegador: pôr validade 01/09/2027 numa viagem que volta em 20/06/2027 e ver o aviso de renovar.

## Dicas pra implementar
- Core: `packages/core/src/passaporte.ts`.
- Web: `features/passaporte/FormPassaporte.tsx` (perfil) e `AvisoPassaporte.tsx` (checklist).

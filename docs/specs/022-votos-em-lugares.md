# 022. Votos em lugares

**Fase:** 2 · **Tamanho:** P · **Depende de:** 016 · **Status:** Em andamento

## Objetivo
Deixar o comboio **curtir** os lugares (passeios, comidas, guarda-volumes) de cada destino, igual já dá pra votar na hospedagem. Assim fica visível o que a maioria quer fazer, sem brigar na programação.

## Por que
- **Pesquisa de mercado (out/2026):** interesses diferentes na programação é a maior dor (42,7%). Votar nos lugares mostra na hora o que o grupo prefere.
- A votação de hospedagem (spec 011) já existe e as pessoas usam; este item leva o mesmo coração pros lugares (spec 016).

## Como funciona
- Uma tabela `lugar_votos` guarda um coração por pessoa em cada lugar (igual a `hospedagem_votos`).
- Todo o comboio vê os votos; cada um só dá e tira o **próprio** voto.
- A contagem aparece no cartão do lugar.

## Inclui
- **Web (aba Lugares):** um botão de coração em cada lugar, com a contagem. Clicar curte/descurte (muda na hora; se o banco recusar, recarrega).

## Não inclui (fica pra depois)
- **Mobile:** o app ainda não tem uma tela de Lugares (eles aparecem só dentro do Roteiro, sem voto). Uma tela de Lugares no app é um item à parte; quando existir, reaproveita `lugar_votos`. Hoje a votação de hospedagem também é só no site, pelo mesmo motivo.
- Ordenar os lugares pelos mais votados (dá pra fazer depois com o mesmo dado).
- "Montar o dia pelos votos" (é um item de IA da Onda 3).

## Dados
- **Migration nova** (`20261029160000_votos_em_lugares.sql`):
  - Tabela `lugar_votos` (`lugar_id`, `usuario_id`, `criado_em`, PK `(lugar_id, usuario_id)`).
  - RLS: comboio vê; cada um insere/apaga só o próprio voto (`usuario_id = auth.uid()`).
- **Tipos:** `lugar_votos` adicionado à mão em `packages/core/src/database.ts`. Depois de aplicar a migration, gerar de novo.

## Quem pode o quê
| Ação | ADM | Membro | Convidado |
|---|---|---|---|
| Ver os votos | sim | sim | sim |
| Dar/tirar o próprio voto | sim | sim | sim |
| Votar no nome de outra pessoa | não | não | não |

## Critérios de aceite
- [ ] Na aba Lugares, cada lugar tem um coração com a contagem.
- [ ] Curtir e descurtir muda a contagem na hora e persiste.
- [ ] Ninguém consegue votar no nome de outra pessoa (nem chamando o banco direto).
- [ ] Quem não é do comboio não vota.
- [ ] Apagar o lugar leva os votos junto.
- [ ] `npm run build`, `npm run lint` e os testes passam.

## Dicas pra implementar
- **Web:** `src/features/lugares/api.ts` (`buscarLugares` traz `lugar_votos`; `votarLugar`), `hooks.ts` (`votar` otimista, recebe `meuId`), `pages/viagem/Lugares.tsx` (botão de coração). CSS em `lugares.css` (`.lugar-voto`).
- **Testes:** `apps/web/tests/banco-specs.test.mjs`, seção "022" (espelha os votos da hospedagem, 011).
- **Referência:** a votação da hospedagem (spec 011) é o molde exato.

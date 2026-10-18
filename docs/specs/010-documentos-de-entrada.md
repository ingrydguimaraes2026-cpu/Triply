# 010. Documentos de entrada

**Fase:** 2 · **Tamanho:** M · **Depende de:** 001 · **Status:** Pronto pra testar

## Objetivo
Depois de escolher pra onde vão, cada pessoa do comboio vê **o que precisa pra entrar em cada país** (passaporte, visto ou autorização, seguro, comprovantes), com prazo pra resolver e link da fonte oficial. Cada um marca o que já resolveu e o comboio vê quem ainda falta.

## Por que
Ideia do Victor (18/10/2026): "o primeiro ponto é decidir pra onde vamos; o próximo é saber quais documentos eu, brasileiro, preciso". A pesquisa (`docs/pesquisa-documentos-de-entrada.md`) mostrou que:
- nenhum app de viagem em grupo faz isso;
- não existe API de governo, e os sites oficiais bloqueiam robôs (CAPTCHA, 403, JavaScript);
- a regra depende da **pessoa** (dupla cidadania muda tudo), não só da viagem.

## Inclui
- **Regras curadas no próprio código** (`src/features/documentos/regras.ts`), cada uma com fonte oficial e "conferido em". Atualizar = mudar o arquivo e revisar no PR (é a "pessoa que revisa e aprova").
- **Cobertura inicial** (passaporte brasileiro, turismo):
  - Espaço Schengen (todos os países), mais Mônaco, San Marino e Vaticano (entrada pela zona Schengen);
  - Mercosul e associados que aceitam RG/CIN (Argentina, Uruguai, Paraguai, Chile, Bolívia, Peru, Equador, Colômbia);
  - Reino Unido, Estados Unidos, Canadá, México, Japão, Austrália.
- **País sem regra cadastrada:** aparece "Ainda não temos esse país: confira no Portal Consular do Itamaraty", com o link.
- **O país de casa não entra:** destinos no Brasil são ignorados.
- **Itens repetidos aparecem uma vez:** França + Itália + Mônaco geram um item "ETIAS", não três.
- **Prazo calculado:** "resolver até DD/MM", contando a partir do início da viagem. Atrasado fica em destaque.
- **Validade do passaporte calculada:** pela data do fim da viagem (ex.: Schengen = 3 meses depois da saída).
- **Status por pessoa:** "Resolvido", "Não preciso" (ex.: tem passaporte europeu) ou pendente (o padrão).
- **Resumo do comboio:** em cada item, as fotos de quem já resolveu; no topo, "você resolveu 3 de 8".
- **Item "a confirmar":** regras ainda sem data oficial (ex.: ETIAS) aparecem com o selo "a confirmar".
- **Aviso fixo:** "As regras mudam. Confira sempre na fonte oficial antes de viajar."

## Não inclui (fica pra depois)
- Pedir a nacionalidade/passaportes no perfil (por enquanto, quem não precisa marca "Não preciso").
- Buscar regras automaticamente numa API (Orizn, Travel Buddy, Sherpa).
- Fazer o pedido de visto pela pessoa ou guardar foto do passaporte. **Nunca guardar número de documento.**
- Regras de conexão/trânsito (só um aviso genérico).

## Telas
- **Nova aba "Documentos"** no menu da viagem.
- Topo: países que a viagem cobre e o progresso "você resolveu X de Y".
- Lista de itens, ordenada pelo prazo: título, explicação curta, prazo, link "Fonte oficial", selo "a confirmar" quando for o caso, e os botões **Resolvido** / **Não preciso**.
- Embaixo de cada item: fotos de quem já resolveu.
- **Estado vazio:** viagem só no Brasil: "Viagem nacional: leve RG ou CNH com foto".
- **Sem datas na viagem:** o prazo aparece como "60 dias antes da viagem".
- **Overview:** cartão "Documentos: X de Y resolvidos", que leva pra aba.

## Dados
- **Regras:** no código, não no banco.
- **País do destino:** o banco só guarda o nome (`destinos.pais`, às vezes escrito diferente: "Mónaco"/"Mônaco"). O app converte o nome pro código ISO (MC) sem mudar o banco.
- **Migration nova:** tabela `documentos_status`
  - `viagem_id`, `usuario_id`, `item` (texto curto), `status` ('pendente' | 'resolvido' | 'nao_preciso'), `atualizado_em`;
  - chave: (`viagem_id`, `usuario_id`, `item`).
- RLS: o comboio vê o status de todos da viagem; cada um só grava o próprio.

## Quem pode o quê
| Ação | ADM | Membro |
|---|---|---|
| Ver checklist e status do comboio | sim | sim |
| Marcar o próprio status | sim | sim |
| Marcar o status de outra pessoa | não | não |

## Critérios de aceite
- [ ] Viagem Galeão → Paris → Nice → Mônaco → Milão → Como → Roma (1 a 8 jun 2027) mostra: passaporte (válido até pelo menos 08/09/2027), ETIAS (a confirmar), seguro viagem €30 mil, comprovantes, e nada sobre o Brasil.
- [ ] O ETIAS aparece uma vez só, citando França, Mônaco e Itália.
- [ ] Viagem só pra Argentina e Chile: o item de documento diz "passaporte ou RG/CIN com menos de 10 anos".
- [ ] Destino num país sem regra (ex.: Tailândia): aparece o item "confira no Itamaraty".
- [ ] Marco "Resolvido" no passaporte, atualizo a página: continua marcado, e minha foto aparece no item.
- [ ] Outra pessoa do comboio vê minha foto no item, mas não consegue mudar o meu status.
- [ ] Item com prazo vencido aparece em destaque.
- [ ] Viagem sem datas: os prazos aparecem como "X dias antes da viagem".

## Perguntas em aberto
- Quem mantém as regras e de quanto em quanto tempo? (Sugestão: revisar todo mês e sempre que alguém criar viagem pra um país sem regra.)
- Mostrar o status de todo mundo ou só um resumo? (Sugestão: as fotos de quem resolveu; não mostra quem marcou "Não preciso".)

## Dicas pra implementar
- Lógica pura e testável: `src/features/documentos/checklist.ts` (monta os itens a partir dos destinos e das datas) e `paises.ts` (nome → código).
- Para o nome → código: `Intl.DisplayNames` em pt-BR, pt-PT, en, es, it e fr, ignorando acentos.
- Ícones: `FileCheck`, `ShieldCheck`, `Plane`, `Syringe`, `Baby`.

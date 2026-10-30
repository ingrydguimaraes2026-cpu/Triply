# Relatório da noite (29 → 30/10/2026)

Branch `monorepo-split`, **local** (o push dá 403: o app do Claude no GitHub não está instalado na conta da Ingryd). Backup completo no `together-noite.bundle` que mandei no chat.

## Resumo

- **83 commits**, specs **032 a 109** (78 specs novas), cada uma com doc em `docs/specs/`, testes e status no `docs/specs/README.md`.
- Fila (`docs/FILA-completa.md`): Fases 1 a 8 andaram inteiras. O que sobrou está travado em decisão sua (lista abaixo) ou é paridade do mobile.
- Tudo passa: `pnpm build`, `pnpm lint`, type-check do core e do mobile, e os testes (puros + banco no PGlite). **Nada foi visto no navegador com login** (não tenho `.env.local` nem conta): cada spec tem um critério "No navegador" desmarcado pra vocês.
- **Nada foi pro ar**: nenhuma migration aplicada, nenhuma Edge Function publicada, nenhum push.

## O que entrou (por área)

| Área | Specs |
|---|---|
| Avisos no celular | 032 lembretes (trem, check-out, encontro) · 033 preferências por tipo · 042 resumo da noite (21h) · 043 menções @nome |
| Transportes | 035 situação e preço + lançar gasto · 040 botão Ir (Maps, Waze, Uber, Bolt) · 067 quem vai em cada trajeto · 073 carro e rodízio de motorista · 074 conexões com alerta de conexão curta · 080 volta pra base no bate-e-volta |
| Roteiro e agenda | 036 calendário .ics · 046 modo sonhando · 065 datas em comum · 070 programação em paralelo · 071 mover evento de dia · 075 destinos candidatos · 076 sugestão de ordem · 077 compromissos apertados · 092 detector de furos · 095 feriados · 096 montar os dias pelos votos |
| Hospedagem | 041 prazo de cancelamento · 060 malas antes do check-in · 062 como chegar · 063 vibe (etiquetas, nota, hostels) · 068 quem dorme onde · 072 prévia do link |
| Lugares | 061 já fomos + perto de mim · 064 autocompletar com coordenada · 066 não abro mão · 079 importar do Google Maps · 094 sugestões (OpenStreetMap) · 097 link do Instagram/TikTok vira lugar · 103 indicar pra um amigo |
| Financeiro | 045 orçamento combinado · 052 exportar (planilha/Splitwise) · 056 orçamento pessoal · 057 a pagar · 081 divisão por pesos/itens · 082 relatórios · 083 meio de pagamento + dinheiro na mão · 084 movimento da carteira vira gasto · 093 gasto por frase ou voz |
| Pessoas e segurança | 037 emergência · 038 passaporte (validade, sem número) · 039 seguro · 050 ficha da pessoa · 051 cheguei bem · 107 localização ao vivo temporária |
| Preparação | 044 decisões registradas · 047 ficha do país + eSIM · 048 listas do comboio · 049 progresso · 069 minha mala |
| Viagem e conta | 053 busca · 054 arquivar · 055 repetir comboio · 078 permissões simples · 085 tempo real · 086 marcações offline · 087 histórico e lixeira · 088 PDF · 089 LGPD (baixar dados, excluir conta) · 090 acessibilidade e modo simples · 091 duplicar viagem · 109 tema escuro (teste) |
| Tela Hoje | 058 Hoje · 059 ferramentas (conversor, gorjeta, motorista, banheiro, restaurante, guarda-volumes) · 104 frases úteis com áudio |
| Fotos e memórias | 098 álbum por dia e melhores · 099 baixar .zip · 100 marcar pessoas · 101 diário · 102 onde já fui + estatísticas · 105 retrospectiva (cartões pro story) · 106 livro da viagem · 108 onde a foto foi tirada |
| Offline | 034 offline de leitura (PWA) |
| Mobile (Expo) | agenda de hoje, tempo, novidades, guia da casa, cofre (só type-check: não rodei o Expo) |

## Pra pôr no ar (na ordem)

1. **Revisar o PR** (quando o push funcionar). Atenção especial:
   - `20261031070000_permissoes_simples.sql`: troca as regras de destinos/trajetos/orçamentos e recria `salvar_roteiro` (conferi: o corpo é igual ao de `20261018120100`, só muda a checagem de quem pode).
   - `20261031110000_historico_e_lixeira.sql`: gatilhos em gastos, lugares, trajetos e agenda (BEFORE DELETE guarda a cópia; a restauração usa SQL dinâmico só com o nome da tabela, que é travado por `check`).
   - `20261031120000_privacidade_lgpd.sql`: `excluir_meus_dados()` passa o ADM adiante, apaga o pessoal e troca o nome por "Conta excluída".
2. **Aplicar as 41 migrations** de `20261030020000` a `20261031170000`, em ordem (todas têm "Pra desfazer" no topo). Antes, conferir se a `20261030010000_lembretes.sql` (que já estava no seu push) foi aplicada: a `20261030060000` recria a view dela.
3. **Gerar os tipos de novo** (`packages/core/src/database.ts`): eu remendei à mão; conferir com o gerado.
4. **Publicar as Edge Functions**:
   - novas: `lembretes`, `resumo-da-noite` (essas duas com `--no-verify-jwt`, igual à `avisos-cambio`, porque o agendamento chama sem login), `avisar-mencao`, `cheguei-bem`, `previa-link`, `excluir-conta`;
   - alterada: `avisos-feed` (respeita a preferência "fotos").
5. **Agendamentos (pg_cron)**, no SQL Editor:
   - `lembretes` a cada 5 min (spec 032);
   - `resumo-da-noite` de hora em hora, minuto 5 (spec 042);
   - `limpar-historico` 1x por dia (spec 087);
   - `limpar-localizacoes` a cada 15 min (spec 107).
6. **Realtime**: a migration `20261031100000_tempo_real.sql` põe 9 tabelas na publicação `supabase_realtime`.

## Precisa de decisão sua (🔒)

- **F3 pessoa sem app, H7 acerto pago, N1 fechamento, F4 núcleos, H8 caixa**: as perguntas estão no fim da `FILA-completa.md` (mudam como o saldo é calculado).
- **IA** (L1 importar reserva, H10 recibo, L6 assistente): usar a API do Claude numa Edge Function? Precisa da chave e de um teto de gasto.
- **L2 e-mail da viagem**: provedor de e-mail de entrada + domínio.
- **M15 idiomas**: ~830 textos; plano de 2 a 3 dias na fila.
- **D7 voo, D10 trens**: APIs pagas ou uma por país.
- **C9 mapa offline**: biblioteca nova (MapLibre + PMTiles) e espaço no Storage.
- **M14 Wallet**: conta Apple Developer. **M13 widgets**: só no app nativo.
- **H6 saldo das contas globais (Gmail)**: deixei parado.

## Avisos

- **A Overview está lotada de cartões.** Entraram vários (furos, listas, mala, ficha do país, datas em comum, cheguei bem…). Vale uma rodada de design: o que fica, o que vira "ver mais".
- **Tema escuro** está como opção "em teste" no Perfil (não segue o celular sozinho). Conferi só Login e 404 em print de 360 px; as telas de dentro precisam de uma passada.
- **Marcações offline** (spec 086): vence quem envia por último.
- **Localização ao vivo** só atualiza com o app aberto (limite do navegador).
- Renomeei a migration de passageiros pra `20261030235000` (estava com hora "24").

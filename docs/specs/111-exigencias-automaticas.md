# 111. Exigências de entrada automáticas (todos os países, por passaporte)

**Fase:** 2 · **Tamanho:** G · **Depende de:** 010, 038 · **Status:** Pronto pra testar (web e app) · banco e função no ar

## Objetivo
Qualquer país do roteiro mostra o que a pessoa precisa pra entrar (isento por X dias, ETA, e-visa, visto na chegada, visto), pelo passaporte dela, em vez de "ainda não temos as regras". Os dados se atualizam sozinhos toda semana.

## Por que
A spec 010 cobre ~43 países escritos à mão (só passaporte brasileiro). O resto mandava pro Itamaraty. Pesquisa em `docs/pesquisa-documentos-de-entrada.md` e conversa de 30/10/2026: não existe API oficial; API paga não compensa agora; a melhor saída grátis é juntar duas fontes que se vigiam.

## Fontes
| Fonte | Usa pra | Frescor | Licença |
|---|---|---|---|
| Wikipédia, "Visa requirements for Brazilian citizens" (API `action=parse`, wikitext) | Passaporte **brasileiro** | Editada toda semana | CC BY-SA (citar) |
| Passport Index Data (`github.com/imorte/passport-index-data`, `passport-index.json`) | **Outros** passaportes (dupla nacionalidade) e conferência | Última: 17/02/2026 | MIT |

A tabela à mão da 010 continua valendo pros países que ela cobre (checklist completo: seguro, ETIAS, RG no Mercosul). As fontes automáticas entram nos países que ela não cobre.

## Inclui
- Tabela `exigencias_de_entrada` (passaporte × destino × fonte → tipo + dias + data dos dados), leitura pra quem está logado.
- Função `atualizar-exigencias` (Edge Function), toda segunda 6h UTC pelo pg_cron:
  - baixa as duas fontes, confere se vieram inteiras (Wikipédia ≥ 150 países, dataset ≥ 30 mil linhas) e só então troca os dados;
  - se uma fonte quebrar, mantém os últimos dados bons e registra o erro;
  - grava em `fontes_de_exigencias` quando cada fonte foi lida e de quando são os dados.
- **Alarme** em `alertas_de_exigencias` (só o servidor e o Victor via SQL):
  - Wikipédia × dataset discordam no tipo de um país pro passaporte brasileiro;
  - Wikipédia contradiz um país da tabela à mão (ex.: Reino Unido deixa de ser ETA).
- Checklist (web e app): país sem regra à mão vira item automático com o tipo, os dias, "dados de <data>" e o link do Itamaraty. Usa **o passaporte mais fácil** da pessoa (brasileiro + nacionalidades do perfil, spec 038).
- Lógica do checklist e das regras vai pro `@together/core` (web e app usam a mesma).
- Tela Documentos no app (paridade da 010).

## Não inclui (fica pra depois)
- Ler a Wikipédia de outras nacionalidades (só brasileiro; os outros passaportes vêm do dataset).
- Trocar os itens da tabela à mão quando a pessoa tem outro passaporte melhor (ex.: italiano na França). Fica um aviso simples só nos países automáticos.
- Tela de revisão dos alertas (por enquanto: `select * from alertas_de_exigencias where not resolvido`).
- API paga (Sherpa, Timatic, Orizn).

## Telas
- **Site, Overview/Documentos:** o cartão "País: confira as regras" vira, por exemplo, "Tailândia: sem visto até 90 dias", com a origem dos dados, a data e o link do Itamaraty. Visto, e-visa e ETA viram tarefa com prazo; isento e visto na chegada viram aviso.
- **App:** tela Documentos (atalho na viagem) com o mesmo checklist e as marcações "Tenho / Não preciso".
- Sem dados automáticos pro país (fonte fora do ar desde sempre): continua o cartão do Itamaraty.

## Dados
- Novas: `exigencias_de_entrada`, `fontes_de_exigencias`, `alertas_de_exigencias`.
- Já existem: `documentos_status` (marcações), `documentos_pessoais.nacionalidades` (spec 038).
- Agendamento: `cron.schedule('atualizar-exigencias', '0 6 * * 1', ...)`, chamando a função como os outros jobs.

## Quem pode o quê
| Ação | ADM | Membro | Servidor |
|---|---|---|---|
| Ver exigências e data das fontes | ✓ | ✓ | ✓ |
| Gravar exigências e alertas | – | – | ✓ |
| Ver alertas | – | – | ✓ (Victor por SQL) |

## Critérios de aceite
- [x] Depois de rodar a função, `exigencias_de_entrada` tem o Brasil pela Wikipédia (~200 destinos) e todos os passaportes pelo dataset (~39 mil linhas).
- [x] Viagem com Tailândia mostra "Tailândia: sem visto até 90 dias" com fonte e data, em vez de "ainda não temos".
- [ ] Viagem com Índia mostra "e-visa" como tarefa com prazo.
- [ ] Pessoa com nacionalidade italiana no perfil vê a exigência do passaporte mais fácil nos países automáticos.
- [x] Países da tabela à mão (França, Reino Unido...) continuam iguais.
- [ ] Quebrar a URL da Wikipédia de propósito: a função registra o erro e os dados antigos continuam.
- [ ] App mostra o mesmo checklist do site e as marcações valem nos dois.

## Perguntas em aberto
- Victor quer ser avisado dos alertas por e-mail/push? (Por enquanto só SQL.)

## Dicas pra implementar
- O Deno da função não importa do core: o leitor da Wikipédia e o mapa de tipos ficam copiados lá (avisar no comentário).
- Wikipédia: cada linha da tabela tem `{{Timatic|nationality=BR|destination=XX}}`, que já dá o código do país. O tipo está na 2ª célula, os dias na 3ª ("90 days", "3 months").
- Mandar `User-Agent` na chamada da Wikipédia (regra da API deles).

## Teste no banco real (31/10/2026)
- Função rodada: Wikipédia 228 países (dados de 19/10/2026), Passport Index 39.402 linhas (17/02/2026), 11 alertas (o que importa: México virou e-visa pela Wikipédia; a tabela à mão diz visto).
- App (Paulo, viagem Galeão, 390px): destino de teste "Bangkok (teste)" → item "Tailândia: sem visto até 90 dias · automático", texto e link do Itamaraty certos. Destino apagado depois.
- Marcar/desmarcar Passaporte grava em `documentos_status` (1/4 → 0/4).
- Logado vê as exigências; anônimo sem login não vê nada. Passaporte italiano: EUA vira ETA.

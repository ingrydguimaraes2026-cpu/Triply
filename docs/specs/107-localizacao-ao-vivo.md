# 107. Localização ao vivo temporária

**Fase:** 8 · **Tamanho:** G (feito em M) · **Depende de:** 058 · **Status:** Pronto pra testar (web) · banco **não aplicado**

## Objetivo
Na tela Hoje, "Onde está o comboio": quem quiser compartilha a localização por 1, 2 ou 4 horas, só pro comboio. Os outros veem "Ingryd · 350 m de você · há 1 min" e um botão Ir.

## Por que
- Catálogo F8. Em show, parque ou cidade grande, o grupo se perde e o WhatsApp não ajuda.

## Inclui
- Sempre opcional e por tempo (no máximo 8 horas, regra do banco).
- Só o comboio vê, e só enquanto não venceu (regra do banco). Vencida, a limpeza apaga.
- Atualiza a cada 30 s com o app aberto; mostra quanto tempo falta e "Parar".
- Ordena pelo mais perto de mim; "Ir" abre o caminho no app de navegação (spec 040).
- Excluir a conta (spec 089) apaga a posição.

## Não inclui (fica pra depois)
- Atualizar com o app fechado (só no app nativo).
- Mapa com todo mundo junto.

## Quem pode
- Ver: o comboio, só até vencer. Gravar/mudar/apagar: só a própria.

## Dados
- **Migration:** `supabase/migrations/20261031160000_localizacao_ao_vivo.sql` — tabela `localizacoes_ao_vivo`, gatilho de até 8 h, `privado.limpar_localizacoes()`.
- **Agendar** depois de aplicar: `select cron.schedule('limpar-localizacoes', '*/15 * * * *', 'select privado.limpar_localizacoes()');`

## Critérios de aceite
- [x] Comboio vê enquanto vale; até 8 h; estranho não; só a própria; vencida some e é apagada (testado no banco).
- [x] Mais perto primeiro, minutos, vencida fora (testado: `localizacao.test.mjs`).
- [ ] No navegador (2 celulares): compartilhar por 1 h num e ver a distância no outro.

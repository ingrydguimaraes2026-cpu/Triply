# 016. Lugares de cada destino

**Fase:** 2 · **Tamanho:** M · **Depende de:** 001 · **Status:** Pronto pra testar

## Objetivo
Em cada destino do roteiro, o comboio guarda o que quer ver, comer e usar ali: passeios, lugares pra comer e **guarda-volumes**, cada um com link, horário, preço e observação. Assim o "destrinchar a cidade" fica dentro do app, não perdido no WhatsApp ou no TikTok.

## Por que
Duas reuniões planejando a Eurotrip (19/10 e 22/10/2026):
- **Guarda-volumes** apareceu nas duas. Em Nice (deixar as malas no dia do GP), em **Milão** (malas na Milano Centrale enquanto giram no touro da Galeria) e em **Como** (Lock & Go perto da estação antes do passeio no lago). São justamente dias de passagem, sem hospedagem: hoje não há onde anotar isso no app.
- O próximo passo combinado foi "começar a destrinchar os lugares, restaurantes e horários de cada cidade". Na call foram anotados, por exemplo: Colline du Château e Promenade des Anglais (Nice); cassino de Monte Carlo, Porto Hércules, Museu Oceanográfico, o banquinho com vista e um lugar barato pra comer (Mônaco); Galeria Vittorio Emanuele e Duomo (Milão); paradas Poschiavo, Alp Grüm e Ospizio Bernina (linha Bernina); Varenna e Bellagio de barco (Lago de Como).

## Inclui
- **Lugares por destino**, na ordem do roteiro. Tipos: **passeio**, **comida**, **guarda-volumes** e **outro**.
- Campos: nome (obrigatório), link (https), horário (texto livre, ex.: "6h às 23h", "primeiro trem 9h"), preço e moeda (opcional) e observação.
- Qualquer pessoa do comboio adiciona; quem criou (ou o ADM) edita e apaga.
- **Destino de passagem** (bate-e-volta, 0 noites) com malas: a tela sugere "Vai passar com malas? Anote um guarda-volumes".
- Lugar continua existindo se o destino sair do roteiro (fica "sem destino", como as fotos).

## Não inclui (fica pra depois)
- Agenda hora a hora do dia (roteiro dia a dia com horários de cada lugar).
- Votos e "já fomos" (marcar como visitado).
- Mapa com os lugares e busca automática de lugares (Google Places).
- Reserva ou compra de ingresso pelo app.

## Telas
- **Hospedagem → por destino**, ou uma aba própria "Lugares" (decidir; ver perguntas em aberto).
- Por destino: lista agrupada por tipo, cada item com ícone, nome, horário, preço e o link "Abrir".
- "+ Adicionar lugar" abre a gaveta com o formulário; o link vem primeiro.
- Vazio: "Nada anotado em Milão ainda. Passeios, comida ou guarda-volumes?"
- Carregando e erro iguais às outras abas.

## Dados (migration `20261023040125_lugares.sql`)
- **`lugares`:** `id`, `viagem_id`, `destino_id` (fica vazio se o destino sair do roteiro), `tipo` (`passeio` | `comida` | `guarda_volumes` | `outro`), `nome`, `link`, `horario`, `preco`, `moeda`, `observacao`, `criado_por`, `criado_em`.
- Gatilho `privado.conferir_lugar`: o destino tem que ser da mesma viagem; viagem e autor não mudam.
- Não altera nenhuma tabela que já existe.

## Quem pode o quê
| Ação | ADM | Membro |
|---|---|---|
| Ver lugares | sim | sim |
| Adicionar | sim | sim |
| Editar ou apagar | qualquer um | só o seu |

## Critérios de aceite
- [ ] O membro adiciona em Milão "Guarda-volumes da Milano Centrale", tipo guarda-volumes, "6h às 23h", € 6. Todo o comboio vê, e continua lá depois de atualizar a página.
- [ ] O membro não consegue editar nem apagar o lugar que o ADM criou (nem pela tela, nem pelo banco); o ADM consegue com qualquer um.
- [ ] Como (bate-e-volta) mostra a sugestão de anotar um guarda-volumes.
- [ ] Link sem https é recusado com uma mensagem clara.
- [ ] Tirar Milão do roteiro não apaga os lugares de Milão.

## Perguntas em aberto
- ~~Onde mostrar?~~ **Decisão (23/10):** aba nova "Lugares", entre Hospedagem e Transportes. No menu do celular (agora com 7 abas), "Financeiro" aparece como "Finanças" pra caber em 360 px.
- Lugares entram no Overview (ex.: "3 lugares anotados em Nice")? (Fica pra depois.)

## Dicas pra implementar
- Seguir o padrão da Hospedagem: `src/features/lugares/api.ts`, `hooks.ts` e lógica pura em `regras.ts` (agrupar por tipo, destino de passagem).
- Gaveta e formulário: reaproveitar o jeito do `FormOpcao` da hospedagem.
- Ícones: `MapPin` (passeio), `Utensils` (comida), `Luggage` (guarda-volumes), `Bookmark` (outro).
- Testes do banco: `tests/lugares.test.mjs`.

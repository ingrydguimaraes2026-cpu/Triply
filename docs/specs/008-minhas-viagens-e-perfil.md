# 008. Minhas viagens e perfil

**Fase:** 2 · **Tamanho:** M · **Depende de:** — · **Status:** A fazer

## Objetivo
A pessoa vê todas as viagens dela, troca de uma pra outra e edita os dados da viagem (nome, datas, moeda). Também ajusta o próprio perfil (nome e foto).

## Por que
Hoje o app abre direto na viagem mais recente e não tem como voltar pras outras: só criando uma nova. E depois do onboarding, não dá pra mudar o nome, as datas nem a moeda.

## Inclui
- **Minhas viagens:**
  - lista em cartões: nome, período, destinos, avatares do comboio, selo "acontecendo agora / próxima / concluída";
  - botão "Nova viagem".
- **Trocar de viagem** pelo cartão da viagem atual no menu lateral (e pela aba no celular).
- **Configurações da viagem** (só ADM):
  - editar nome, datas e moeda principal;
  - apagar a viagem, com uma confirmação bem forte.
  - *(23/10/2026)* também direto em **Minhas viagens**: lixeira no cartão (só pra quem é ADM daquela viagem), com a mesma confirmação.
- **Perfil:** editar o nome e trocar a foto (que hoje vem do Google).

## Não inclui
- Arquivar viagem.
- Duplicar viagem.
- Excluir a conta (pode virar uma spec própria por causa da LGPD).

## Telas
- **`/viagens`:** a lista. Vira a tela inicial quando a pessoa tem mais de uma viagem? (ver perguntas)
- **Menu lateral:** o cartão "Viagem" vira um botão que leva pra `/viagens`.
- **`/viagem/:id/configuracoes`:** formulário da viagem (pode ser uma aba "⚙" escondida pro membro).
- **`/perfil`:** nome e foto.

## Dados (já existem no banco)
- **`viagens`:** o ADM edita e apaga. Apagar apaga em cascata destinos, trajetos, gastos, fotos (só a linha da tabela), convites e membros.
- **Atenção:** apagar a viagem **não apaga os arquivos do Storage**. Precisa apagar os arquivos de `fotos/<viagem_id>/` antes, ou criar uma função no banco pra isso.
- **`perfis`:** cada um edita o seu. Foto: usar o mesmo bucket `fotos`? Melhor criar um bucket `avatares` público (migration nova).

## Quem pode o quê
| Ação | ADM | Membro |
|---|---|---|
| Ver as próprias viagens | sim | sim |
| Editar nome, datas e moeda da viagem | sim | não |
| Apagar a viagem | sim | não |
| Editar o próprio perfil | sim | sim |

## Critérios de aceite
- [ ] Com 3 viagens, a lista mostra as 3 e cada uma abre a viagem certa.
- [ ] O ADM muda o nome da viagem e o menu lateral atualiza na hora.
- [ ] O membro não vê "Configurações".
- [ ] Apagar a viagem remove tudo, inclusive os arquivos das fotos, e volta pra lista.
- [ ] Mudar o próprio nome atualiza o nome no comboio de todas as viagens.

## Perguntas em aberto
- Ao abrir o app: ir pra viagem mais recente (como hoje), pra "acontecendo agora" ou pra lista?
- Mudar a moeda principal com gastos já lançados: converter ou só mudar a exibição?

## Dicas pra implementar
- `src/pages/Inicio.tsx` hoje redireciona pra última viagem: é ali que muda a regra da tela inicial.
- Lista: `select` em `viagens` já traz só as viagens da pessoa (o RLS filtra sozinho).

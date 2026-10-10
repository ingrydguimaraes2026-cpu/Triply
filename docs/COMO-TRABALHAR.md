# Como trabalhar com o Claude neste projeto

Guia rápido pra Ingryd. O Claude deste projeto já sabe que você está aprendendo: ele explica o que faz, mostra como testar e ensina um conceito novo a cada tarefa.

## Começando o dia

1. Abra o projeto no Claude.
2. Digite **`/o-que-mudou`** pra ver o que o Victor mexeu.
3. Digite **`/rodar`** pra ligar o site no seu computador. Ele te dá o link e um roteiro do que testar.

## Pedindo coisas

Fale normal, como falaria com uma pessoa. Quanto mais você contar o **objetivo**, melhor.

| Em vez de… | Tente… |
|---|---|
| "faz o financeiro" | "quero conseguir lançar um gasto: quem pagou, quanto e em qual categoria. Começa pelo mais simples." |
| "tá quebrado" | "cliquei em Criar viagem e apareceu Ops, algo deu errado. Antes funcionava." |
| "muda a cor" | "o botão de Convidar tá marrom, queria laranja igual ao menu." |

Pedidos que funcionam bem:

- "Me explica como funciona a tela de login" (ou **`/explicar login`**)
- "Começa o TODO do Financeiro, um passo de cada vez, e me mostra a cada passo"
- "Por que você fez assim e não de outro jeito?"
- "Não entendi essa parte, explica de novo com um exemplo"
- "Quero eu mesma escrever essa parte. Me guia sem fazer por mim"

## Salvando o trabalho

Quando algo estiver funcionando, digite **`/salvar`**. O Claude confere se tem erro, mostra o que mudou e pede sua confirmação antes de mandar pro GitHub. Depois ele oferece abrir um Pull Request pro Victor revisar.

## Regras de ouro

- Você trabalha na branch **`dev-ingryd`**. Nunca direto na `main`.
- Chaves e senhas **nunca** no chat. O arquivo `.env.local` você pega com o Victor.
- Deu erro? Copie a mensagem pro Claude e conte o que você estava fazendo. Erro faz parte.
- Não entendeu? Pergunte. O Claude está configurado pra explicar quantas vezes precisar.

## Palavras novas

Tudo que for termo técnico está explicado em [`glossario.md`](glossario.md).

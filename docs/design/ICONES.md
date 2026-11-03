# Ícones e selos do Tripwave

Decidido em 02/11/2026 com o Victor: **selos (desenho nosso) + Phosphor Duotone**. Nada de emoji e nada de ícone genérico solto.

## Dois tipos

| | Ícone | Selo |
|---|---|---|
| O que é | Desenho pequeno do dia a dia: botão, aba, lista, cartão | Ilustração nossa, estilo adesivo de mala (traço couro grosso, cores da paleta) |
| Onde | Em todo lugar | Onde a pessoa está conhecendo o app: onboarding, "Montem a viagem", chamar a galera, estados vazios |
| Tamanho | 14 a 28 px | 32 a 56 px |
| Componente | `<Icone nome="lugar" />` | `<Selo nome="mapa" />` |

## Como usar

- **Site** (`apps/web`): `import { Icone, Selo } from '../components/ui/Icone'`. O traço usa a cor do texto (`currentColor`); a camada de fundo é dourada (`.icone .duo` no `global.css`). Pra mudar o fundo num lugar: `--icone-duo` e `--icone-duo-op`.
- **App** (`apps/mobile`): `import { Icone, Selo } from '../src/ui/Icone'`. Passe `cor` (ex.: `cor.couro`). Traço marrom, creme ou branco ganha fundo dourado; traço colorido (verde, vermelho) ganha fundo da mesma cor bem clarinho.
- `cheio`: versão preenchida (só `curtir`, `estrela`, `comentario`). Ex.: coração curtido.
- Telas antigas importam pelos nomes velhos do lucide (`MapPin`, `Users`...) de `components/ui/icones` / `src/ui/icones`. É o mesmo desenho novo; código novo usa o nome em português.
- **Aviso no celular, texto de compartilhar, calendário (.ics)**: só texto, sem emoji.

## Estilo

- Ícones: [Phosphor](https://phosphoricons.com) (licença MIT), peso **duotone**. Ícones de ação (X, +, setas, check, caret) usam o peso **bold**, porque o duotone põe um quadrado de fundo neles.
- Selos: grade 48×48, traço 2,4, cantos redondos, cores da paleta (caramelo, dourado, creme, areia, couro, tijolo, oliva).

## Como adicionar ou trocar

**Ícone**
1. Ache o desenho em phosphoricons.com (o nome tipo `map-pin`).
2. Acrescente uma linha em `packages/core/scripts/icones-lista.mjs`: `['nome-em-portugues', 'nome-no-phosphor', []]`.
3. Rode `node packages/core/scripts/gerar-icones.mjs` (gera `packages/core/src/icones-desenhos.ts`, não edite esse à mão).

**Selo**
1. Desenhe no 48×48 seguindo o estilo acima, com `stroke="__TRACO__"` no traço (vira couro no fundo claro e creme no escuro).
2. Acrescente em `packages/core/src/selos.ts`.

## Guarda

`apps/web/tests/icones.test.mjs` falha se aparecer emoji ou `lucide-*` no código das telas (web, app, core e funções do Supabase). A única exceção é ler o "📍" de posts do Instagram (`previa.ts`).

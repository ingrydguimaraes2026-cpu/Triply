# Peças visuais (components/ui)

Blocos reutilizáveis pra montar as telas com a mesma cara. Os estilos ficam em `ui.css`.

| Peça | Pra quê | Exemplo |
|---|---|---|
| `Cartao` | Bloco branco arredondado com título e ícone | `<Cartao titulo="Orçamento" icone={Wallet}>...</Cartao>` |
| `CabecalhoPagina` | Título grande no topo de cada aba | `<CabecalhoPagina titulo="Fotos" subtitulo="..." />` |
| `EstadoVazio` | Tela/cartão sem dados ainda, explicando o próximo passo | `<EstadoVazio icone={Camera} titulo="..." texto="..." />` |
| `Avatar` | Foto ou iniciais da pessoa | `<Avatar nome="Ingryd" url={...} />` |
| `Logo` | Logo do Tripwave como no app (Agulha no quadradinho bege + nome). Pega a cor e o tamanho do texto em volta | `<Logo />` ou `<Logo comNome={false} />` |
| `Agulha` | Mascote (bússola de chapéu). Humores: `parada`, `feliz`, `dormindo`, `pensando` | `<Agulha humor="dormindo" tamanho={120} />` |
| `IconeQuadrado` | Quadradinho bege com ícone (atalhos, itens de lista), como no app | `<IconeQuadrado icone={Bed} tamanho={48} />` |
| `BotaoRedondo` | Botão redondo de 44px (voltar, compartilhar). `claro` pra ficar em cima de foto | `<BotaoRedondo rotulo="Voltar"><ArrowLeft size={20} /></BotaoRedondo>` |
| `RotuloDeSecao` | Rótulo pequeno em caixa alta que abre uma seção | `<RotuloDeSecao>Próximas</RotuloDeSecao>` |
| `PilhaDeAvatares` | Bolinhas sobrepostas do comboio | `<PilhaDeAvatares pessoas={[{ nome: 'Ana' }]} />` |
| `Carregando` | Agulha pensando + texto, enquanto busca os dados | `<Carregando texto="Buscando as viagens…" />` |
| `ErroNaTela` | Erro amigável com "Tentar de novo" | `<ErroNaTela aoTentar={recarregar} />` |

Ícones: usamos [lucide-react](https://lucide.dev/icons). Procure o ícone no site e importe pelo nome:

```tsx
import { Wallet } from 'lucide-react'
```

Botões: use as classes `botao` (marrom, principal), `botao secundario` (branco com contorno), `botao claro` (em cima de foto) e `compacto` (menor).

O visual segue o app do celular (redesign "Malinha", spec 112): mesma paleta de `apps/mobile/theme.ts` e as mesmas peças de `apps/mobile/src/ui/pecas.tsx`.

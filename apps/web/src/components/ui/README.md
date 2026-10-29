# Peças visuais (components/ui)

Blocos reutilizáveis pra montar as telas com a mesma cara. Os estilos ficam em `ui.css`.

| Peça | Pra quê | Exemplo |
|---|---|---|
| `Cartao` | Bloco branco arredondado com título e ícone | `<Cartao titulo="Orçamento" icone={Wallet}>...</Cartao>` |
| `CabecalhoPagina` | Título grande no topo de cada aba | `<CabecalhoPagina titulo="Fotos" subtitulo="..." />` |
| `EstadoVazio` | Tela/cartão sem dados ainda, explicando o próximo passo | `<EstadoVazio icone={Camera} titulo="..." texto="..." />` |
| `Avatar` | Foto ou iniciais da pessoa | `<Avatar nome="Ingryd" url={...} />` |
| `Logo` | Logo do Together (símbolo "Rota" + nome). Pega a cor e o tamanho do texto em volta | `<Logo />` ou `<Logo comNome={false} />` |

Ícones: usamos [lucide-react](https://lucide.dev/icons). Procure o ícone no site e importe pelo nome:

```tsx
import { Wallet } from 'lucide-react'
```

Botões: use as classes `botao` (marrom, principal) e `botao secundario` (contorno).

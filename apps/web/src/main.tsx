import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { router } from './router'
// Caminho B (Embarque, 10/11/2026): Inter Tight nos títulos, Inter no corpo (iguais ao app)
import '@fontsource-variable/inter-tight'
import '@fontsource-variable/inter'
import './styles/global.css'
import './components/ui/ui.css' // peças visuais (spec 112): valem em todas as telas
import { aplicarAcessibilidade } from './lib/acessibilidade'

// Spec 090: letra maior / alto contraste escolhidos neste aparelho
aplicarAcessibilidade()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)

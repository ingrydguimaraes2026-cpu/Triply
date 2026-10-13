import { useState } from 'react'
import { Camera } from 'lucide-react'
import { useViagemAtual } from '../../features/viagens/hooks'
import CabecalhoPagina from '../../components/ui/CabecalhoPagina'
import EstadoVazio from '../../components/ui/EstadoVazio'
import './abas.css'

/*
  TODO (Ingryd): Fotos. Spec completa: docs/specs/005-fotos.md
  - Só fotos (jpeg/webp), até 1 MB: comprimir no navegador antes de enviar
    (ex.: biblioteca "browser-image-compression").
  - Enviar pro Storage, bucket "fotos", no caminho `${viagem.id}/<nome-unico>.webp`.
  - Salvar o registro na tabela "fotos" (viagem_id, destino_id, caminho, legenda).
  - Mostrar em grade estilo Pinterest (CSS "columns: 2" no celular, 3–4 no computador).
  - Limite combinado: as 5 melhores por destino (ainda a confirmar).
  - Criar src/features/fotos/api.ts.
*/
export default function Fotos() {
  const { destinos } = useViagemAtual()
  const [filtro, setFiltro] = useState<string | null>(null)

  return (
    <>
      <CabecalhoPagina
        titulo="Fotos"
        subtitulo="As melhores fotos de cada lugar, do comboio inteiro."
        acao={
          <button type="button" className="botao" disabled>
            Adicionar foto (em breve)
          </button>
        }
      />

      {/* Filtro por destino */}
      <div className="filtros" role="group" aria-label="Filtrar por destino">
        <button type="button" className={filtro === null ? 'ativo' : undefined} onClick={() => setFiltro(null)}>
          Todas
        </button>
        {destinos.map((d) => (
          <button key={d.id} type="button" className={filtro === d.id ? 'ativo' : undefined} onClick={() => setFiltro(d.id)}>
            {d.nome} <span>0/5</span>
          </button>
        ))}
      </div>

      <EstadoVazio
        icone={Camera}
        titulo="Nenhuma foto ainda"
        texto="Escolham as melhores fotos de cada lugar. Elas aparecem aqui num mural pra todo o comboio."
      />
    </>
  )
}

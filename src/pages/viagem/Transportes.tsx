import { ArrowRight, TrainFront } from 'lucide-react'
import { useViagemAtual } from '../../features/viagens/hooks'
import CabecalhoPagina from '../../components/ui/CabecalhoPagina'
import Cartao from '../../components/ui/Cartao'
import EstadoVazio from '../../components/ui/EstadoVazio'
import './abas.css'

/*
  TODO (Ingryd): Transportes
  - Buscar os trajetos da tabela "trajetos" (viagem_id = viagem.id), na ordem de "partida".
  - Formulário pra adicionar trajeto: origem e destino (da lista de destinos), meio
    ("trem", "onibus", "aviao", "carro", "barco", "a_pe", "outro"), partida, chegada,
    "bate_e_volta" (sim/não) e observação.
  - Só o ADM pode adicionar/editar (use "euSouAdm"; o banco também bloqueia).
  - Se for bate-e-volta, mostrar o aviso de diária extra na base.
  - Criar o arquivo src/features/transportes/api.ts com as funções que falam com o Supabase.
*/
export default function Transportes() {
  const { destinos, euSouAdm } = useViagemAtual()

  // Cada par de destinos seguidos é um trecho da viagem (Nice → Mônaco, Mônaco → Milão...)
  const trechos = destinos.slice(1).map((d, i) => ({ de: destinos[i], para: d }))

  return (
    <>
      <CabecalhoPagina
        titulo="Transportes"
        subtitulo="Como vocês vão de um lugar pro outro, com horários e bate-e-voltas."
      />

      {trechos.length === 0 ? (
        <EstadoVazio
          icone={TrainFront}
          titulo="Só um destino por enquanto"
          texto="Quando a viagem tiver mais de um destino, os trechos entre eles aparecem aqui."
        />
      ) : (
        <div className="trechos">
          {trechos.map(({ de, para }) => (
            <Cartao key={`${de.id}-${para.id}`}>
              <div className="trecho">
                <strong>{de.nome}</strong>
                <ArrowRight size={18} aria-hidden="true" />
                <strong>{para.nome}</strong>
              </div>
              <p className="trecho-vazio">Como vocês vão? Trem, ônibus, avião…</p>
              {euSouAdm && (
                <button type="button" className="botao secundario" disabled>
                  Adicionar trajeto (em breve)
                </button>
              )}
            </Cartao>
          ))}
        </div>
      )}
    </>
  )
}

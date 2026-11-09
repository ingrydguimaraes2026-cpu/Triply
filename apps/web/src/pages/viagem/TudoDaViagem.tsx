import { useState } from 'react'
import { Link } from 'react-router'
import { AlertTriangle, BarChart3, LifeBuoy, Search, CalendarRange, ChevronRight, CircleCheck, Globe, ListChecks, Lock, Luggage, MapPin, MapPinned, PiggyBank, ShoppingBasket } from '../../components/ui/icones'
import { CONGELADO, encontrarFuros } from '@together/core'
import { hojeTexto } from '../../features/destinos/datas'
import { useTrajetos } from '../../features/transportes/hooks'
import { useHospedagem } from '../../features/hospedagem/hooks'
import { useDocumentos } from '../../features/documentos/hooks'
import ChecklistDocumentos from '../../features/documentos/ChecklistDocumentos'
import FaixaAvisos from '../../features/avisos/FaixaAvisos'
import Checklist from '../../features/tarefas/Checklist'
import Enquetes from '../../features/enquetes/Enquetes'
import ClimaDaViagem from '../../features/clima/ClimaDaViagem'
import PontoDeEncontro from '../../features/encontro/PontoDeEncontro'
import Cofre from '../../features/cofre/Cofre'
import OrcamentoCombinado from '../../features/orcamento-combinado/OrcamentoCombinado'
import FichaDoPais from '../../features/ficha-do-pais/FichaDoPais'
import ListasDoComboio from '../../features/listas/ListasDoComboio'
import ChegueiBem from '../../features/chegadas/ChegueiBem'
import DatasEmComum from '../../features/datas-em-comum/DatasEmComum'
import MinhaMala from '../../features/mala/MinhaMala'
import DestinosCandidatos from '../../features/candidatos/DestinosCandidatos'
import { useViagemAtual } from '../../features/viagens/hooks'
import { TUDO_DA_VIAGEM } from '../../features/viagens/partes'
import { useFocoDeItem } from '../../lib/foco'
import Cartao from '../../components/ui/Cartao'
import TituloDaTela from '../../components/ui/TituloDaTela'
import Gaveta from '../../components/ui/Gaveta'
import Emergencia from '../../features/emergencia/Emergencia'
import BuscaNaViagem from '../../features/busca/BuscaNaViagem'
import IconeQuadrado from '../../components/ui/IconeQuadrado'
import RotuloDeSecao from '../../components/ui/RotuloDeSecao'
import './abas.css'
import './viagem-tela.css'

// "Tudo da viagem" (como a tela do app, apps/mobile/app/tudo-da-viagem.tsx): o que não está nas 5 partes.
// Em cima, os atalhos; embaixo, as coisas do comboio que antes ficavam na tela da viagem (nada foi apagado).
export default function TudoDaViagem() {
  const { viagem, destinos, membros, meuId, euSouAdm } = useViagemAtual()
  useFocoDeItem() // destaca a enquete/ponto quando se chega por um link de compartilhar
  const atalhos = TUDO_DA_VIAGEM.filter((a) => !a.soAdm || euSouAdm)

  // Spec 092: furos no plano (até o fim da viagem)
  const trajetos = useTrajetos(viagem.id)
  const hospedagem = useHospedagem(viagem.id, destinos, meuId, membros.length)
  const docs = useDocumentos(viagem, destinos, meuId)
  const furos =
    destinos.length > 0 && trajetos.estado.status === 'pronto' && hospedagem.estado === 'pronto' && !(viagem.data_fim && viagem.data_fim < hojeTexto())
      ? encontrarFuros({
          destinos,
          trajetos: trajetos.estado.trajetos,
          escolhidas: hospedagem.itens.flatMap((i) =>
            i.escolhida ? [{ destinoId: i.destino.id, nome: i.escolhida.nome, checkin: i.escolhida.checkin, checkout: i.escolhida.checkout }] : [],
          ),
        })
      : []
  const [vendoTodosFuros, setVendoTodosFuros] = useState(false)
  // Buscar (spec 053) e Emergência (spec 037) saíram da barra de cima e do menu: ficam aqui
  const [buscando, setBuscando] = useState(false)
  const [vendoEmergencia, setVendoEmergencia] = useState(false)

  return (
    <div className="tudo-da-viagem">
      <TituloDaTela acima={viagem.nome} titulo="Tudo da viagem" voltar=".." />

      <nav className="tudo-lista" aria-label="Tudo da viagem">
        {atalhos.map(({ para, rotulo, sub, icone }) => (
          <Link key={para} to={`../${para}`} relative="path">
            <IconeQuadrado icone={icone} tamanho={36} />
            <span>
              <strong>{rotulo}</strong>
              <small>{sub}</small>
            </span>
            <ChevronRight size={18} aria-hidden="true" />
          </Link>
        ))}
        <button type="button" onClick={() => setBuscando(true)}>
          <IconeQuadrado icone={Search} tamanho={36} />
          <span>
            <strong>Buscar</strong>
            <small>Lugar, gasto, reserva, tarefa</small>
          </span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => setVendoEmergencia(true)}>
          <IconeQuadrado icone={LifeBuoy} tamanho={36} />
          <span>
            <strong>Emergência</strong>
            <small>Números, hospital e consulado</small>
          </span>
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </nav>

      {buscando && (
        <Gaveta titulo="Buscar na viagem" aoFechar={() => setBuscando(false)}>
          <BuscaNaViagem viagemId={viagem.id} destinos={destinos} aoEscolher={() => setBuscando(false)} />
        </Gaveta>
      )}
      {vendoEmergencia && (
        <Gaveta titulo="Emergência" aoFechar={() => setVendoEmergencia(false)}>
          <Emergencia destinos={destinos} seguro={{ viagemId: viagem.id, meuId, euSouAdm, membros, inicio: viagem.data_inicio, fim: viagem.data_fim }} />
        </Gaveta>
      )}

      <RotuloDeSecao>Do comboio</RotuloDeSecao>
      {/* Spec 019: recados do ADM fixados */}
      <FaixaAvisos viagemId={viagem.id} euSouAdm={euSouAdm} />

      <div className="tudo-cartoes">
        {furos.length > 0 && (
          <Cartao titulo={furos.length === 1 ? '1 furo no plano' : `${furos.length} furos no plano`} icone={AlertTriangle}>
            <ul className="furos-lista">
              {(vendoTodosFuros ? furos : furos.slice(0, 4)).map((f) => (
                <li key={f.chave} className={f.gravidade === 'alta' ? 'furo-alto' : undefined}>
                  {f.aba ? (
                    <Link to={`../${f.aba}`} relative="path">
                      <span>{f.texto}</span>
                      <ChevronRight size={15} aria-hidden="true" />
                    </Link>
                  ) : (
                    <span>{f.texto}</span>
                  )}
                </li>
              ))}
            </ul>
            {furos.length > 4 && (
              <button type="button" className="botao-texto" onClick={() => setVendoTodosFuros(!vendoTodosFuros)}>
                {vendoTodosFuros ? 'Ver menos' : `Ver os ${furos.length}`}
              </button>
            )}
          </Cartao>
        )}

        {/* Spec 020: tarefas com responsável */}
        <Cartao titulo="Tarefas" icone={ListChecks}>
          <Checklist viagemId={viagem.id} membros={membros} meuId={meuId} euSouAdm={euSouAdm} />
        </Cartao>

        {/* Spec 021: enquetes rápidas pra decidir junto */}
        <Cartao titulo="Enquetes" icone={BarChart3}>
          <Enquetes viagemId={viagem.id} meuId={meuId} euSouAdm={euSouAdm} />
        </Cartao>

        {/* Roadmap #7: ponto de encontro (onde e que horas se encontrar) */}
        <Cartao titulo="Ponto de encontro" icone={MapPin}>
          <PontoDeEncontro viagemId={viagem.id} meuId={meuId} euSouAdm={euSouAdm} />
        </Cartao>

        {/* Roadmap #8: clima dia a dia de cada destino */}
        <ClimaDaViagem destinos={destinos} />

        {/* Spec 028: cofre (reservas, ingressos, PDFs) */}
        <Cartao titulo="Cofre" icone={Lock}>
          <Cofre />
        </Cartao>

        {/* Spec 045: orçamento combinado */}
        <Cartao titulo="Orçamento combinado" icone={PiggyBank}>
          <OrcamentoCombinado viagemId={viagem.id} meuId={meuId} moeda={viagem.moeda_principal} />
        </Cartao>

        {/* Spec 075: destinos candidatos (enquanto o roteiro é curto) */}
        {destinos.length <= 1 && (
          <Cartao titulo="Pra onde vamos?" icone={MapPinned}>
            <DestinosCandidatos />
          </Cartao>
        )}

        {/* Spec 065: datas em comum (mais útil antes de fechar as datas) */}
        {(!viagem.data_inicio || destinos.length === 0) && (
          <Cartao titulo="Datas em comum" icone={CalendarRange}>
            <DatasEmComum />
          </Cartao>
        )}

        {/* Spec 051: "cheguei bem" com um toque */}
        <Cartao titulo="Cheguei bem" icone={CircleCheck}>
          <ChegueiBem />
        </Cartao>

        {/* Spec 069: mala individual (só a pessoa vê) */}
        <Cartao titulo="Minha mala" icone={Luggage}>
          <MinhaMala />
        </Cartao>

        {/* Spec 048: quem leva o quê + lista de compras */}
        <Cartao titulo="Listas do comboio" icone={ShoppingBasket}>
          <ListasDoComboio />
        </Cartao>

        {/* Spec 047: ficha do país. congelado pelo RUMO (03/11/2026) */}
        {!CONGELADO.fichaDoPais && (
          <Cartao titulo="Ficha do país" icone={Globe}>
            <FichaDoPais viagem={viagem} destinos={destinos} />
          </Cartao>
        )}

        {/* Spec 010: checklist de documentos. congelado pelo RUMO (03/11/2026) */}
        {!CONGELADO.documentos && (
          <ChecklistDocumentos docs={docs} membros={membros} passaporte={{ viagemId: viagem.id, meuId, volta: viagem.data_fim ?? viagem.data_inicio, euSouAdm }} />
        )}
      </div>
    </div>
  )
}

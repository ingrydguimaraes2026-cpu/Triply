import { useState } from 'react'
import { AlertTriangle, ArrowRight, ExternalLink, Pencil, Plus, Repeat, TrainFront } from 'lucide-react'
import { useViagemAtual } from '../../features/viagens/hooks'
import { useTrajetos } from '../../features/transportes/hooks'
import { meio, type Trajeto } from '../../features/transportes/api'
import { avisosDoTrajeto, diaLocal, hora, proximoTrajeto } from '../../features/transportes/avisos'
import FormTrajeto from '../../features/transportes/FormTrajeto'
import { formatarData } from '../../lib/datas'
import CabecalhoPagina from '../../components/ui/CabecalhoPagina'
import Cartao from '../../components/ui/Cartao'
import EstadoVazio from '../../components/ui/EstadoVazio'
import Gaveta from '../../components/ui/Gaveta'
import './abas.css'
import './transportes.css'

type Janela = { trajeto?: Trajeto; origemId?: string; destinoId?: string } | null

// Transportes (spec 004): trechos do roteiro, trajetos, avisos de logística e linha do tempo.
export default function Transportes() {
  const { viagem, destinos, euSouAdm } = useViagemAtual()
  const { estado, recarregar } = useTrajetos(viagem.id)
  const [janela, setJanela] = useState<Janela>(null)

  const trajetos = estado.status === 'pronto' ? estado.trajetos : []
  const nomeDe = (id: string | null) => destinos.find((d) => d.id === id)?.nome ?? 'Sem destino'

  // Cada par de destinos seguidos é um trecho da viagem (Nice → Mônaco, Mônaco → Milão...)
  const trechos = destinos.slice(1).map((d, i) => ({ de: destinos[i], para: d }))
  const doTrecho = (deId: string, paraId: string) =>
    trajetos.filter(
      (t) => (t.origem_id === deId && t.destino_id === paraId) || (t.bate_e_volta && t.origem_id === paraId && t.destino_id === deId),
    )
  const usados = new Set(trechos.flatMap(({ de, para }) => doTrecho(de.id, para.id).map((t) => t.id)))
  const outros = trajetos.filter((t) => !usados.has(t.id))

  const todosAvisos = trajetos.flatMap((t) =>
    avisosDoTrajeto(t, destinos, trajetos).map((texto) => ({ texto, trajeto: t })),
  )
  // Bate-e-volta gera o mesmo aviso na ida e na volta: mostra uma vez só
  const avisos = todosAvisos.filter((a, i) => todosAvisos.findIndex((b) => b.texto === a.texto) === i)
  const proximo = proximoTrajeto(trajetos)

  // Linha do tempo: trajetos com horário, agrupados por dia
  const porDia = new Map<string, Trajeto[]>()
  for (const t of trajetos) if (t.partida) porDia.set(diaLocal(t.partida), [...(porDia.get(diaLocal(t.partida)) ?? []), t])

  const fechar = () => setJanela(null)

  const linha = (t: Trajeto) => {
    const { icone: Icone, nome } = meio(t.meio)
    const ehVolta = t.bate_e_volta && trajetos.some((o) => o.id !== t.id && o.bate_e_volta && o.origem_id === t.destino_id && o.destino_id === t.origem_id && (o.partida ?? '') < (t.partida ?? ''))
    return (
      <li key={t.id} className={proximo?.id === t.id ? 'trajeto proximo' : 'trajeto'}>
        <span className="trajeto-icone" title={nome}>
          <Icone size={18} aria-hidden="true" />
        </span>
        <span className="trajeto-texto">
          <strong>
            {nomeDe(t.origem_id)} <ArrowRight size={14} aria-hidden="true" /> {nomeDe(t.destino_id)}
            {t.bate_e_volta && (
              <span className="selo-suave">
                <Repeat size={11} aria-hidden="true" /> {ehVolta ? 'volta' : 'bate-e-volta'}
              </span>
            )}
            {proximo?.id === t.id && <span className="selo-completar">próximo</span>}
          </strong>
          <small>
            {nome}
            {t.partida ? ` · ${formatarData(diaLocal(t.partida))} ${hora(t.partida)}` : ' · sem horário'}
            {t.chegada && ` → ${diaLocal(t.chegada) !== (t.partida && diaLocal(t.partida)) ? `${formatarData(diaLocal(t.chegada))} ` : ''}${hora(t.chegada)}`}
          </small>
          {t.observacao && <small className="trajeto-obs">{t.observacao}</small>}
          {t.link_reserva && (
            <a href={t.link_reserva} target="_blank" rel="noreferrer noopener" className="trajeto-link">
              Reserva <ExternalLink size={12} aria-hidden="true" />
            </a>
          )}
        </span>
        {euSouAdm && (
          <button type="button" className="botao-texto" onClick={() => setJanela({ trajeto: t })} aria-label="Editar trajeto">
            <Pencil size={16} aria-hidden="true" />
          </button>
        )}
      </li>
    )
  }

  return (
    <>
      <CabecalhoPagina
        titulo="Transportes"
        subtitulo="Como vocês vão de um lugar pro outro, com horários e bate-e-voltas."
        acao={
          euSouAdm &&
          destinos.length > 0 && (
            <button type="button" className="botao" onClick={() => setJanela({})}>
              <Plus size={18} aria-hidden="true" /> Adicionar trajeto
            </button>
          )
        }
      />

      {estado.status === 'carregando' && <p className="carregando-texto">Carregando os trajetos…</p>}
      {estado.status === 'erro' && (
        <div className="aviso-erro">
          <p>Não deu pra carregar os trajetos.</p>
          <button type="button" className="botao secundario pequeno" onClick={recarregar}>
            Tentar de novo
          </button>
        </div>
      )}

      {avisos.length > 0 && (
        <section className="avisos-logistica" aria-label="Avisos de logística">
          {avisos.map((a) => (
            <p key={a.texto}>
              <AlertTriangle size={16} aria-hidden="true" />
              <span>
                <strong>
                  {nomeDe(a.trajeto.origem_id)} → {nomeDe(a.trajeto.destino_id)}:
                </strong>{' '}
                {a.texto}
              </span>
            </p>
          ))}
        </section>
      )}

      {trechos.length === 0 && outros.length === 0 ? (
        <EstadoVazio
          icone={TrainFront}
          titulo="Só um destino por enquanto"
          texto="Quando a viagem tiver mais de um destino, os trechos entre eles aparecem aqui."
        />
      ) : (
        <div className="trechos">
          {trechos.map(({ de, para }) => {
            const lista = doTrecho(de.id, para.id)
            return (
              <Cartao key={`${de.id}-${para.id}`}>
                <div className="trecho">
                  <strong>{de.nome}</strong>
                  <ArrowRight size={18} aria-hidden="true" />
                  <strong>{para.nome}</strong>
                </div>
                {lista.length === 0 ? (
                  <p className="trecho-vazio">Como vocês vão? Trem, ônibus, avião…</p>
                ) : (
                  <ul className="trajetos">{lista.map(linha)}</ul>
                )}
                {euSouAdm && (
                  <button type="button" className="botao secundario" onClick={() => setJanela({ origemId: de.id, destinoId: para.id })}>
                    <Plus size={16} aria-hidden="true" /> {lista.length ? 'Outro trajeto' : 'Adicionar trajeto'}
                  </button>
                )}
              </Cartao>
            )
          })}
        </div>
      )}

      {outros.length > 0 && (
        <Cartao titulo="Outros trajetos">
          <p className="form-dica">Trajetos que não ligam dois destinos seguidos do roteiro, ou que ficaram sem destino.</p>
          <ul className="trajetos">{outros.map(linha)}</ul>
        </Cartao>
      )}

      {porDia.size > 0 && (
        <Cartao titulo="Linha do tempo">
          <ol className="linha-do-tempo">
            {[...porDia].map(([dia, lista]) => (
              <li key={dia}>
                <h3>{formatarData(dia, true)}</h3>
                <ul className="trajetos">{lista.map(linha)}</ul>
              </li>
            ))}
          </ol>
          <p className="form-dica">Horários no fuso do seu celular.</p>
        </Cartao>
      )}

      {janela && (
        <Gaveta titulo={janela.trajeto ? 'Editar trajeto' : 'Adicionar trajeto'} aoFechar={fechar}>
          <FormTrajeto
            viagemId={viagem.id}
            destinos={destinos}
            trajeto={janela.trajeto}
            origemId={janela.origemId}
            destinoId={janela.destinoId}
            aoTerminar={() => {
              fechar()
              recarregar()
            }}
          />
        </Gaveta>
      )}
    </>
  )
}

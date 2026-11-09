import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { AlertTriangle, ArrowLeft, ArrowLeftRight, BedDouble, Check, ChevronRight, ExternalLink, Footprints, Heart, KeyRound, LayoutList, Luggage, Map as MapIcone, Pencil, Plus, Repeat } from '../../components/ui/icones'
import MapaDaHospedagem from '../../features/hospedagem/MapaDaHospedagem'
import {
  detectarSite,
  escolherHospedagem,
  fatosDaOpcao,
  formatarDinheiro,
  linkDoGuardaVolumes,
  linksDeBusca,
  marcarReservaDaHospedagem,
  noitesDaViagem,
  textoAPe,
  textoDasNoites,
  textoDoDia,
  votarNaHospedagem,
  type CidadeDaNoite,
  type EstadoDaCidade,
  type Opcao,
  type Reserva,
} from '@together/core'
import { supabase } from '../../lib/supabase'
import { useViagemAtual } from '../../features/viagens/hooks'
import { useNoitesDaViagem } from '../../features/hospedagem/hooks'
import FormOpcaoCurta from '../../features/hospedagem/FormOpcaoCurta'
import BotaoRedondo from '../../components/ui/BotaoRedondo'
import TituloDaTela from '../../components/ui/TituloDaTela'
import TelaVazia from '../../components/ui/TelaVazia'
import Carregando from '../../components/ui/Carregando'
import ErroNaTela from '../../components/ui/ErroNaTela'
import Gaveta from '../../components/ui/Gaveta'
import IconeQuadrado from '../../components/ui/IconeQuadrado'
import PilhaDeAvatares from '../../components/ui/PilhaDeAvatares'
import RotuloDeSecao from '../../components/ui/RotuloDeSecao'
import './abas.css'
import './hospedagem.css'

// Hospedagem por noite (spec 123), espelho do app (apps/mobile/app/hospedagem.tsx e cidade-hospedagem.tsx).
// Onde o grupo dorme cada noite, o que falta decidir e reservar, e quanto custa tudo.
// Celular: a lista das cidades; tocar numa cidade abre as opções dela (?cidade=<id>).
// Computador: a lista à esquerda e a cidade aberta à direita.

const SELO: Record<EstadoDaCidade, string> = { 'sem-cama': 'Sem cama', comparando: 'Comparando', escolhida: 'Escolhida', reservada: 'Reservada' }
const NOME_DA_RESERVA: Record<Reserva, string> = { nao: 'Escolhida', reservada: 'Reservada', paga: 'Reservada e paga' }

type Janela = { destinoId: string; opcao?: Opcao } | null

// naAba: dentro de Reservas, o título já está em cima das pílulas (igual ao naAba do app)
export default function Hospedagem({ naAba = false }: { naAba?: boolean }) {
  const { viagem, destinos, membros, meuId, euSouAdm } = useViagemAtual()
  const carga = useNoitesDaViagem(viagem.id)
  const [busca, setBusca] = useSearchParams()
  const [comparando, setComparando] = useState(false)
  const [modo, setModo] = useState<'lista' | 'mapa'>('lista') // spec 124
  const [janela, setJanela] = useState<Janela>(null)
  const [erro, setErro] = useState<string | null>(null)

  const pessoas = Math.max(1, membros.length)
  const cabecalho = naAba ? null : <TituloDaTela titulo="Hospedagem" />

  if (carga.estado.status === 'carregando') {
    return (
      <>
        {cabecalho}
        <Carregando texto="Carregando as noites…" compacto />
      </>
    )
  }
  if (carga.estado.status === 'erro') {
    return (
      <>
        {cabecalho}
        <ErroNaTela titulo="Não deu pra carregar a hospedagem" aoTentar={carga.recarregar} />
      </>
    )
  }

  const { opcoes, trajetos } = carga.estado
  const n = noitesDaViagem(destinos, opcoes, trajetos, pessoas)
  const moedas = Object.keys(n.total)
  const nomeDe = (id: string) => membros.find((m) => m.id === id)

  // Cidade aberta: a da URL; no computador, sem nenhuma na URL, a primeira que precisa de algo
  const idAberta = busca.get('cidade')
  const aberta = n.cidades.find((c) => c.destino.id === idAberta) ?? null
  const noPainel = aberta ?? n.cidades.find((c) => c.estado === 'sem-cama' || c.estado === 'comparando') ?? n.cidades[0] ?? null

  function abrir(id: string | null) {
    setComparando(false)
    setErro(null)
    // Mantém o resto da URL (a aba Reservas usa ?parte=hospedagem)
    setBusca(
      (atual) => {
        const nova = new URLSearchParams(atual)
        if (id) nova.set('cidade', id)
        else nova.delete('cidade')
        return nova
      },
      { replace: !!idAberta && !!id },
    )
  }

  async function votar(o: Opcao) {
    const sim = !o.votos.includes(meuId)
    const trocar = (marcar: boolean) =>
      carga.trocarOpcoes((lista) =>
        lista.map((x) => (x.id === o.id ? { ...x, votos: marcar ? [...x.votos.filter((v) => v !== meuId), meuId] : x.votos.filter((v) => v !== meuId) } : x)),
      )
    trocar(sim)
    try {
      await votarNaHospedagem(supabase, o.id, meuId, sim)
    } catch {
      trocar(!sim)
      setErro('Não deu pra salvar o voto. Tente de novo.')
    }
  }

  async function escolher(o: Opcao, sim: boolean) {
    setErro(null)
    carga.trocarOpcoes((lista) =>
      lista.map((x) => (x.destinoId === o.destinoId ? { ...x, escolhida: x.id === o.id ? sim : false, reserva: x.id === o.id && sim ? x.reserva : 'nao' } : x)),
    )
    try {
      if (!sim && o.reserva && o.reserva !== 'nao') await marcarReservaDaHospedagem(supabase, o.id, 'nao')
      await escolherHospedagem(supabase, o.id, sim)
      setComparando(false)
    } catch {
      setErro('Não deu: quem escolhe a hospedagem é o ADM.')
      await carga.recarregar()
    }
  }

  async function marcar(o: Opcao, reserva: Reserva) {
    setErro(null)
    carga.trocarOpcoes((lista) => lista.map((x) => (x.id === o.id ? { ...x, reserva } : x)))
    try {
      await marcarReservaDaHospedagem(supabase, o.id, reserva)
    } catch {
      setErro('Não deu: quem marca como reservada é o ADM.')
      await carga.recarregar()
    }
  }

  const opcaoAberta = janela?.opcao
  const cidadeDaJanela = janela ? (n.cidades.find((c) => c.destino.id === janela.destinoId) ?? null) : null
  const destinoDaJanela = cidadeDaJanela?.destino ?? destinos.find((d) => d.id === janela?.destinoId)

  return (
    <>
      {cabecalho}

      {n.cidades.length === 0 ? (
        <TelaVazia
          titulo="Nenhuma noite ainda"
          texto="Adicione as cidades e as datas pra ver as noites."
          acao={
            <Link to="../cidades" relative="path" className="botao">
              Ver cidades
            </Link>
          }
        />
      ) : (
        <div className={aberta ? 'hn com-cidade' : 'hn'}>
          <section className="hn-lista" aria-label="Noites da viagem">
            <div className="hn-contadores">
              <Contador numero={n.semCama} rotulo={n.semCama === 1 ? 'noite sem cama' : 'noites sem cama'} tipo="sem-cama" />
              <Contador numero={n.praReservar} rotulo="pra reservar" tipo="escolhida" />
              <Contador numero={n.reservadas} rotulo={n.reservadas === 1 ? 'reservada' : 'reservadas'} tipo="reservada" />
            </div>

            {/* Na ordem do roteiro: cidades com cama e, entre elas, os bate-e-voltas */}
            <ul className="hn-cidades">
              {destinos.map((d) => {
                const cidade = n.cidades.find((c) => c.destino.id === d.id)
                if (cidade)
                  return (
                    <li key={d.id}>
                      <CartaoDaCidade cidade={cidade} pessoas={pessoas} atual={noPainel?.destino.id === d.id} aoAbrir={() => abrir(d.id)} />
                    </li>
                  )
                const p = n.passagens.find((x) => x.destino.id === d.id)
                if (!p) return null
                return (
                  <li key={d.id} className="hn-passagem">
                    <Repeat size={14} aria-hidden="true" />
                    <span>
                      {d.nome}
                      {p.dia ? ` (${textoDoDia(p.dia)})` : ''}: só de dia{p.dormemEm ? `, dormem em ${p.dormemEm}` : ''}
                    </span>
                  </li>
                )
              })}
            </ul>

            {moedas.length > 0 && (
              <div className="hn-total">
                <div>
                  <small>Hospedagem por pessoa</small>
                  <strong>{moedas.map((m) => formatarDinheiro(n.porPessoa[m], m)).join(' + ')}</strong>
                </div>
                <div className="hn-total-dir">
                  <small>grupo · já pago</small>
                  {moedas.map((m) => (
                    <b key={m}>
                      {formatarDinheiro(n.total[m], m)} · {formatarDinheiro(n.pago[m] ?? 0, m)}
                    </b>
                  ))}
                </div>
              </div>
            )}
          </section>

          {noPainel && (
            <section className="hn-cidade" aria-label={`Hospedagem em ${noPainel.destino.nome}`}>
              <div className="hn-cidade-topo">
                <span className="hn-voltar">
                  <BotaoRedondo rotulo="Voltar" aoClicar={() => (comparando ? setComparando(false) : abrir(null))}>
                    <ArrowLeft size={20} />
                  </BotaoRedondo>
                </span>
                {comparando ? (
                  <button type="button" className="hn-pilula" onClick={() => setComparando(false)}>
                    Ver as opções
                  </button>
                ) : (
                  noPainel.opcoes.length >= 2 && (
                    <button type="button" className="hn-pilula" onClick={() => setComparando(true)}>
                      <ArrowLeftRight size={15} aria-hidden="true" /> Comparar
                    </button>
                  )
                )}
              </div>
              <div>
                <h2 className="hn-cidade-titulo">{comparando ? `Onde dormir em ${noPainel.destino.nome}` : noPainel.destino.nome}</h2>
                <p className="hn-cidade-sub">
                  {textoDasNoites(noPainel)}
                  {noPainel.chegada?.hora
                    ? ` · chegam ${noPainel.chegada.hora}${noPainel.chegada.lugar !== noPainel.destino.nome ? ` em ${noPainel.chegada.lugar}` : ''}`
                    : ''}
                </p>
              </div>
              {erro && (
                <p className="aviso-erro" role="alert">
                  {erro}
                </p>
              )}

              {!comparando && noPainel.opcoes.length > 0 && (
                <div className="hn-modo" role="group" aria-label="Ver como">
                  <button type="button" className={modo === 'lista' ? 'ativo' : ''} aria-pressed={modo === 'lista'} onClick={() => setModo('lista')}>
                    <LayoutList size={14} aria-hidden="true" /> Lista
                  </button>
                  <button type="button" className={modo === 'mapa' ? 'ativo' : ''} aria-pressed={modo === 'mapa'} onClick={() => setModo('mapa')}>
                    <MapIcone size={14} aria-hidden="true" /> Mapa
                  </button>
                </div>
              )}

              {comparando ? (
                <Comparar cidade={noPainel} pessoas={pessoas} euSouAdm={euSouAdm} aoEscolher={(o) => escolher(o, true)} />
              ) : modo === 'mapa' && noPainel.opcoes.length > 0 ? (
                <MapaDaHospedagem key={noPainel.destino.id} viagemId={viagem.id} cidade={noPainel} pessoas={pessoas} />
              ) : (
                <>
                  {noPainel.malas && (
                    <div className="hn-malas">
                      <Luggage size={16} aria-hidden="true" />
                      <div>
                        <p>
                          <b>Malas no dia do check-out.</b> O próximo trecho sai às {noPainel.malas.ate}: deixem num guarda-volumes perto de {noPainel.malas.lugar}.
                        </p>
                        <a href={linkDoGuardaVolumes(noPainel.malas.lugar)} target="_blank" rel="noreferrer noopener">
                          Achar guarda-volumes
                        </a>
                      </div>
                    </div>
                  )}

                  {noPainel.opcoes.length === 0 && (
                    <p className="hn-dica">Nenhuma opção ainda. Procure nos sites abaixo e clique em "Adicionar opção" pra colar o link do que gostar.</p>
                  )}

                  {noPainel.opcoes.length > 0 && (
                    <ul className="hn-opcoes">
                      {noPainel.opcoes.map((o) => (
                        <li key={o.id}>
                          <CartaoDaOpcao
                            opcao={o}
                            cidade={noPainel}
                            pessoas={pessoas}
                            meuId={meuId}
                            euSouAdm={euSouAdm}
                            quem={o.votos.map(nomeDe).filter((m) => m !== undefined)}
                            aoVotar={() => votar(o)}
                            aoEditar={() => setJanela({ destinoId: noPainel.destino.id, opcao: o })}
                            podeEditar={euSouAdm || o.criadoPor === meuId}
                            aoEscolher={(sim) => escolher(o, sim)}
                            aoMarcar={(r) => marcar(o, r)}
                          />
                        </li>
                      ))}
                    </ul>
                  )}

                  <RotuloDeSecao>Procurar em {noPainel.destino.nome}</RotuloDeSecao>
                  <div className="hn-busca">
                    {linksDeBusca(noPainel.destino, pessoas).map((b) => (
                      <a key={b.site} href={b.url} target="_blank" rel="noreferrer noopener">
                        <ExternalLink size={14} aria-hidden="true" /> {b.nome}
                      </a>
                    ))}
                  </div>

                  <button type="button" className="botao hn-adicionar" onClick={() => setJanela({ destinoId: noPainel.destino.id })}>
                    <Plus size={18} aria-hidden="true" /> Adicionar opção
                  </button>
                </>
              )}
            </section>
          )}
        </div>
      )}

      {janela && destinoDaJanela && (
        <Gaveta titulo={opcaoAberta ? 'Editar opção' : `Opção em ${destinoDaJanela.nome}`} aoFechar={() => setJanela(null)}>
          <FormOpcaoCurta
            viagemId={viagem.id}
            destino={destinoDaJanela}
            cidade={cidadeDaJanela}
            pessoas={pessoas}
            moedaViagem={viagem.moeda_principal}
            opcao={opcaoAberta}
            podeMexer={!opcaoAberta || euSouAdm || opcaoAberta.criadoPor === meuId}
            euSouAdm={euSouAdm}
            aoTerminar={() => {
              setJanela(null)
              void carga.recarregar()
            }}
          />
        </Gaveta>
      )}
    </>
  )
}

function Contador({ numero, rotulo, tipo }: { numero: number; rotulo: string; tipo: EstadoDaCidade }) {
  return (
    <div className={`hn-contador estado-${tipo}`}>
      <strong>{numero}</strong>
      <span>{rotulo}</span>
    </div>
  )
}

function CartaoDaCidade({ cidade, pessoas, atual, aoAbrir }: { cidade: CidadeDaNoite; pessoas: number; atual: boolean; aoAbrir: () => void }) {
  const e = cidade.escolhida
  const fatos = e ? fatosDaOpcao(e, cidade, pessoas) : null
  const precisa = cidade.estado === 'sem-cama' || cidade.estado === 'comparando'
  const textoSelo = cidade.estado === 'comparando' ? `${cidade.opcoes.length} ${cidade.opcoes.length === 1 ? 'opção' : 'opções'}` : SELO[cidade.estado]
  const barras = Math.min(cidade.noites ?? 1, 14)
  return (
    <button
      type="button"
      className={`hn-cidade-cartao estado-${cidade.estado}${precisa ? ' precisa' : ''}`}
      aria-current={atual ? 'true' : undefined}
      aria-label={`Hospedagem em ${cidade.destino.nome}`}
      onClick={aoAbrir}
    >
      <span className="hn-cidade-cab">
        <IconeQuadrado icone={BedDouble} tamanho={36} />
        <span className="hn-cidade-txt">
          <b>{cidade.destino.nome}</b>
          <small>
            {textoDasNoites(cidade)}
            {cidade.chegada?.hora ? ` · chegam ${cidade.chegada.hora}` : ''}
          </small>
        </span>
        <span className={`hn-selo estado-${cidade.estado}`}>{textoSelo}</span>
        <ChevronRight size={18} aria-hidden="true" className="hn-seta" />
      </span>

      <span className="hn-barras" aria-hidden="true">
        {Array.from({ length: barras }).map((_, i) => (
          <i key={i} />
        ))}
      </span>

      {e && fatos && (
        <span className="hn-casa">
          <span className="hn-cidade-txt">
            <b>{e.nome}</b>
            <small>
              {[detectarSite(e.link)?.nome, fatos.minutos !== null ? `${textoAPe(fatos.minutos)} da chegada` : null, e.horaCheckinLimite ? `check-in até ${e.horaCheckinLimite.slice(0, 5)}` : null]
                .filter(Boolean)
                .join(' · ') || 'Clique pra ver os detalhes'}
            </small>
          </span>
          {fatos.porPessoa !== null && (
            <span className="hn-casa-preco">
              <b>{formatarDinheiro(fatos.porPessoa, e.moeda)}</b>
              <small>por pessoa</small>
            </span>
          )}
        </span>
      )}

      {cidade.malas && (
        <span className="hn-malas pequeno">
          <Luggage size={15} aria-hidden="true" />
          <span>
            <b>Malas no check-out{cidade.destino.saida ? ` (${textoDoDia(cidade.destino.saida)})` : ''}.</b> Próximo trecho às {cidade.malas.ate}: guarda-volumes perto de{' '}
            {cidade.malas.lugar}.
          </span>
        </span>
      )}
    </button>
  )
}

function Fato({ nivel, icone: Icone, children }: { nivel: 'ok' | 'ruim' | 'neutro'; icone: typeof Footprints; children: string }) {
  return (
    <p className={`hn-fato ${nivel}`}>
      <Icone size={15} aria-hidden="true" /> {children}
    </p>
  )
}

type PropsDaOpcao = {
  opcao: Opcao
  cidade: CidadeDaNoite
  pessoas: number
  meuId: string
  euSouAdm: boolean
  quem: { nome: string; avatarUrl: string | null }[]
  podeEditar: boolean
  aoVotar: () => void
  aoEditar: () => void
  aoEscolher: (sim: boolean) => void
  aoMarcar: (r: Reserva) => void
}

function CartaoDaOpcao({ opcao: o, cidade, pessoas, meuId, euSouAdm, quem, podeEditar, aoVotar, aoEditar, aoEscolher, aoMarcar }: PropsDaOpcao) {
  const f = fatosDaOpcao(o, cidade, pessoas)
  const site = detectarSite(o.link)
  const votei = o.votos.includes(meuId)
  const reserva = o.reserva ?? 'nao'
  const ondeChega = cidade.chegada?.lugar ?? 'centro'
  return (
    <article className={o.escolhida ? 'hn-opcao escolhida' : 'hn-opcao'}>
      {o.fotoUrl &&
        (o.link ? (
          <a href={o.link} target="_blank" rel="noreferrer noopener" tabIndex={-1} aria-hidden="true">
            <img className="hn-opcao-foto" src={o.fotoUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />
          </a>
        ) : (
          <img className="hn-opcao-foto" src={o.fotoUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />
        ))}
      <div className="hn-opcao-corpo">
        <div className="hn-opcao-linha1">
          <div className="hn-opcao-nome">
            {o.escolhida && <small className="hn-opcao-faixa">{NOME_DA_RESERVA[reserva]}</small>}
            <h3>
              {o.link ? (
                <a href={o.link} target="_blank" rel="noreferrer noopener">
                  {o.nome}
                </a>
              ) : (
                o.nome
              )}
            </h3>
            {site && <small>{site.nome}</small>}
          </div>
          {o.precoTotal !== null ? (
            <div className="hn-opcao-preco">
              <strong>{formatarDinheiro(f.porPessoa ?? o.precoTotal, o.moeda)}</strong>
              <small>{pessoas > 1 ? `por pessoa · ${formatarDinheiro(o.precoTotal, o.moeda)} total` : 'total'}</small>
            </div>
          ) : (
            <small className="hn-sem-preco">sem preço</small>
          )}
        </div>

        {f.minutos !== null ? (
          <Fato nivel={f.minutos <= 15 ? 'ok' : 'neutro'} icone={Footprints}>{`${textoAPe(f.minutos)} de ${ondeChega}`}</Fato>
        ) : (
          <Fato nivel="neutro" icone={Footprints}>
            {!o.guia?.endereco
              ? 'Adicione o endereço pra ver a distância'
              : o.lat == null
                ? 'Endereço não achado no mapa'
                : 'Adicione no roteiro como vocês chegam pra ver a distância'}
          </Fato>
        )}
        {f.checkin && (
          <Fato nivel={f.checkin.nivel} icone={f.checkin.nivel === 'ruim' ? AlertTriangle : KeyRound}>
            {f.checkin.texto}
          </Fato>
        )}
        {f.checkin?.nivel === 'ruim' && o.link && (
          <a className="hn-perguntar" href={o.link} target="_blank" rel="noreferrer noopener">
            Perguntar se dá pra entrar mais tarde
          </a>
        )}

        <div className="hn-votos">
          {quem.length > 0 && <PilhaDeAvatares pessoas={quem.map((m) => ({ nome: m.nome, url: m.avatarUrl }))} tamanho={24} />}
          <span className="hn-votos-txt">{quem.length ? `${quem.length} de ${pessoas} querem` : 'Ninguém votou ainda'}</span>
          {podeEditar && (
            <button type="button" className="hn-redondo" aria-label={`Editar ${o.nome}`} onClick={aoEditar}>
              <Pencil size={15} aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            className={votei ? 'hn-coracao votei' : 'hn-coracao'}
            aria-pressed={votei}
            aria-label={votei ? `Tirar meu voto de ${o.nome}` : `Votar em ${o.nome}`}
            onClick={aoVotar}
          >
            <Heart size={15} aria-hidden="true" fill={votei ? 'currentColor' : 'none'} /> {o.votos.length}
          </button>
        </div>

        {euSouAdm &&
          (o.escolhida ? (
            <div className="hn-acoes">
              {reserva === 'nao' && <Acao texto="Marcar reservada" aoClicar={() => aoMarcar('reservada')} />}
              {reserva !== 'paga' && <Acao texto="Marcar paga" aoClicar={() => aoMarcar('paga')} />}
              {reserva !== 'nao' && <Acao texto="Ainda não reservei" aoClicar={() => aoMarcar('nao')} claro />}
              <Acao texto="Desmarcar" aoClicar={() => aoEscolher(false)} claro />
            </div>
          ) : (
            <button type="button" className="hn-ficar" onClick={() => aoEscolher(true)} aria-label={`Escolher ${o.nome}`}>
              <Check size={15} aria-hidden="true" /> Ficar com esta
            </button>
          ))}
      </div>
    </article>
  )
}

function Acao({ texto, aoClicar, claro }: { texto: string; aoClicar: () => void; claro?: boolean }) {
  return (
    <button type="button" className={claro ? 'hn-acao claro' : 'hn-acao'} onClick={aoClicar}>
      {texto}
    </button>
  )
}

// Lado a lado: as linhas que o grupo discute. Verde = melhor da linha; vermelho = check-in que não dá.
function Comparar({ cidade, pessoas, euSouAdm, aoEscolher }: { cidade: CidadeDaNoite; pessoas: number; euSouAdm: boolean; aoEscolher: (o: Opcao) => void }) {
  const lista = cidade.opcoes.slice(0, 3)
  const fatos = lista.map((o) => fatosDaOpcao(o, cidade, pessoas))
  const melhor = (valores: (number | null)[], maior = false) => {
    const validos = valores.filter((v): v is number => v !== null)
    if (validos.length < 2) return -1
    const alvo = maior ? Math.max(...validos) : Math.min(...validos)
    return valores.filter((v) => v === alvo).length === 1 ? valores.indexOf(alvo) : -1
  }
  // Preço só tem "melhor" quando todas estão na mesma moeda (€150 não é mais barato que R$424)
  const mesmaMoeda = new Set(lista.map((o) => o.moeda)).size === 1
  const linhas: { rotulo: string; valores: string[]; melhor: number; ruins?: boolean[] }[] = [
    {
      rotulo: 'Por pessoa',
      valores: fatos.map((f, i) => (f.porPessoa !== null ? formatarDinheiro(f.porPessoa, lista[i].moeda) : '?')),
      melhor: mesmaMoeda ? melhor(fatos.map((f) => f.porPessoa)) : -1,
    },
    { rotulo: 'Total', valores: lista.map((o) => (o.precoTotal !== null ? formatarDinheiro(o.precoTotal, o.moeda) : '?')), melhor: mesmaMoeda ? melhor(lista.map((o) => o.precoTotal)) : -1 },
    { rotulo: `De ${cidade.chegada?.lugar ?? 'onde chegam'}`, valores: fatos.map((f) => (f.minutos !== null ? textoAPe(f.minutos) : '?')), melhor: melhor(fatos.map((f) => f.minutos)) },
    {
      rotulo: 'Check-in',
      valores: lista.map((o) => (o.selfCheckin ? 'qualquer hora' : o.horaCheckinLimite ? `até ${o.horaCheckinLimite.slice(0, 5)}` : '?')),
      melhor: -1,
      ruins: fatos.map((f) => f.checkin?.nivel === 'ruim'),
    },
    {
      rotulo: 'Cancela grátis',
      valores: lista.map((o) => (o.cancelamentoGratisAte ? `até ${Number(o.cancelamentoGratisAte.slice(8, 10))}/${o.cancelamentoGratisAte.slice(5, 7)}` : '?')),
      melhor: -1,
    },
    { rotulo: 'Votos', valores: lista.map((o) => String(o.votos.length)), melhor: melhor(lista.map((o) => o.votos.length), true) },
  ]
  return (
    <div className="hn-comparar">
      <div className="hn-tabela-rola">
        <table className="hn-tabela">
          <thead>
            <tr>
              <td />
              {lista.map((o) => (
                <th key={o.id} scope="col">
                  {o.nome}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.rotulo}>
                <th scope="row">{l.rotulo}</th>
                {l.valores.map((v, i) => {
                  const ruim = l.ruins?.[i]
                  const bom = l.melhor === i || (l.ruins && !ruim && l.ruins.some(Boolean) && v !== '?')
                  return (
                    <td key={i} className={ruim ? 'ruim' : bom ? 'bom' : undefined}>
                      {v}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {cidade.opcoes.length > 3 && <p className="hn-dica">Mostrando as 3 mais votadas.</p>}
      {euSouAdm ? (
        <div className="hn-comparar-botoes">
          {lista.map((o, i) => (
            <button key={o.id} type="button" className={i === 0 ? 'botao' : 'botao secundario'} onClick={() => aoEscolher(o)}>
              Ficar com {o.nome}
            </button>
          ))}
        </div>
      ) : (
        <p className="hn-dica hn-centro">Vote no coração de cada opção. Quem escolhe é o ADM.</p>
      )}
    </div>
  )
}

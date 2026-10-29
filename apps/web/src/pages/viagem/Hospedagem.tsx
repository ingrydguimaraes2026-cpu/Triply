import { useState } from 'react'
import { Link } from 'react-router'
import { AlertTriangle, CalendarDays, Check, Clock, Crown, ExternalLink, Heart, Maximize2, Pencil, Plus, Repeat, Wallet } from 'lucide-react'
import type { Tables } from '@together/core'
import { useViagemAtual } from '../../features/viagens/hooks'
import { useHospedagem } from '../../features/hospedagem/hooks'
import {
  contasDaOpcao,
  detectarSite,
  linkDoMapa,
  linksDeBusca,
  noitesDaOpcao,
  textoDosHorarios,
  TIPOS_NO_MAPA,
  type DestinoDaHospedagem,
  type Opcao,
  type TipoNoMapa,
} from '../../features/hospedagem/regras'
import FormOpcao from '../../features/hospedagem/FormOpcao'
import MapaGoogle from '../../features/mapa/MapaGoogle'
import FormGasto from '../../features/financeiro/FormGasto'
import { mensagemDeErro } from '../../features/financeiro/api'
import { formatarDinheiro } from '@together/core'
import { formatarData, formatarPeriodo } from '../../lib/datas'
import Avatar from '../../components/ui/Avatar'
import CabecalhoPagina from '../../components/ui/CabecalhoPagina'
import Gaveta from '../../components/ui/Gaveta'
import './abas.css'
import './hospedagem.css'

type Destino = Tables<'destinos'>
type Item = DestinoDaHospedagem<Destino>
type Janela = { tipo: 'opcao'; destinoId: string; opcao?: Opcao } | { tipo: 'gasto'; opcao: Opcao } | null

const SELO: Record<Item['situacao'], string> = {
  resolvido: 'Escolhida',
  precisa: 'Falta escolher',
  'sem-datas': 'Sem datas',
  'bate-e-volta': 'Bate-e-volta',
  casa: 'Partida',
}

// Hospedagem (spec 011): escolhe o destino em cima, vê os lugares no Google Maps
// e, ao lado, junta as opções do comboio, vota e fecha a escolhida.
export default function Hospedagem() {
  const { viagem, destinos, membros, meuId, euSouAdm } = useViagemAtual()
  const pessoas = membros.length
  const h = useHospedagem(viagem.id, destinos, meuId, pessoas)
  const [selecionado, setSelecionado] = useState<string | null>(null)
  const [tipo, setTipo] = useState<TipoNoMapa>('hotel')
  const [janela, setJanela] = useState<Janela>(null)
  const [erro, setErro] = useState<string | null>(null)
  const fechar = () => setJanela(null)

  const moeda = viagem.moeda_principal
  const pessoaDe = (id: string) => membros.find((m) => m.id === id)

  async function tentar(acao: () => Promise<void>, padrao: string) {
    setErro(null)
    try {
      await acao()
    } catch (e) {
      setErro(mensagemDeErro(e, padrao))
    }
  }

  // Destinos que aparecem no seletor: todos menos o ponto de partida/volta no Brasil
  const escolhiveis = h.itens.filter((i) => i.situacao !== 'casa')
  // Sem escolha ainda: o primeiro que falta resolver
  const item =
    escolhiveis.find((i) => i.destino.id === selecionado) ??
    escolhiveis.find((i) => i.situacao === 'precisa' || i.situacao === 'sem-datas') ??
    escolhiveis[0] ??
    null

  const { resumo } = h
  const porcentagem = resumo.total ? Math.round((resumo.resolvidos / resumo.total) * 100) : 0

  // `destino` é null nas opções cujo destino saiu do roteiro
  const cartaoDaOpcao = (opcao: Opcao, destino: Destino | null, destaque = false) => {
    const site = detectarSite(opcao.link)
    const noites = noitesDaOpcao(opcao, destino ?? undefined)
    const { porPessoa, porNoite } = contasDaOpcao(opcao.precoTotal, pessoas, noites)
    const votei = opcao.votos.includes(meuId)
    const quemVotou = opcao.votos.map(pessoaDe).filter((m) => m !== undefined)
    const podeEditar = opcao.criadoPor === meuId || euSouAdm
    const autor = pessoaDe(opcao.criadoPor)
    const datasProprias = opcao.checkin && opcao.checkout && (opcao.checkin !== destino?.chegada || opcao.checkout !== destino?.saida)
    const horarios = textoDosHorarios(opcao, destino)

    return (
      <li key={opcao.id} className={destaque ? 'hosp-opcao escolhida' : 'hosp-opcao'}>
        {destaque && (
          <p className="hosp-opcao-faixa">
            <Crown size={14} aria-hidden="true" /> Onde vocês vão ficar
          </p>
        )}
        <div className="hosp-opcao-topo">
          {site && <span className={`hosp-site site-${site.chave}`}>{site.nome}</span>}
          {autor && <small className="hosp-opcao-autor">por {autor.id === meuId ? 'você' : autor.nome.split(' ')[0]}</small>}
          {podeEditar && (
            <button
              type="button"
              className="botao-texto hosp-editar"
              aria-label={`Editar ${opcao.nome}`}
              onClick={() => setJanela({ tipo: 'opcao', destinoId: destino?.id ?? '', opcao })}
            >
              <Pencil size={15} aria-hidden="true" />
            </button>
          )}
        </div>

        <h4 className="hosp-opcao-nome">
          {opcao.link ? (
            <a href={opcao.link} target="_blank" rel="noreferrer noopener">
              {opcao.nome} <ExternalLink size={13} aria-hidden="true" />
            </a>
          ) : (
            opcao.nome
          )}
        </h4>

        {opcao.precoTotal !== null ? (
          <div className="hosp-precos">
            <strong>{formatarDinheiro(opcao.precoTotal, opcao.moeda)}</strong>
            <span>
              {porPessoa !== null && pessoas > 1 && (
                <>
                  <b>{formatarDinheiro(porPessoa, opcao.moeda)}</b> por pessoa
                </>
              )}
              {porPessoa !== null && pessoas > 1 && porNoite !== null && ' · '}
              {porNoite !== null && <>{formatarDinheiro(porNoite, opcao.moeda)} por noite</>}
            </span>
          </div>
        ) : (
          <p className="hosp-sem-preco">Sem preço ainda</p>
        )}

        {datasProprias && (
          <p className="hosp-opcao-datas">
            <CalendarDays size={13} aria-hidden="true" /> {formatarData(opcao.checkin!)} → {formatarData(opcao.checkout!)}
          </p>
        )}
        {horarios && (
          <p className="hosp-opcao-datas">
            <Clock size={13} aria-hidden="true" /> {horarios}
          </p>
        )}
        {opcao.observacao && <p className="hosp-opcao-obs">{opcao.observacao}</p>}

        <div className="hosp-opcao-rodape">
          <button
            type="button"
            className={votei ? 'hosp-voto votei' : 'hosp-voto'}
            aria-pressed={votei}
            aria-label={votei ? `Tirar meu voto de ${opcao.nome}` : `Votar em ${opcao.nome}`}
            onClick={() => tentar(() => h.votar(opcao.id, !votei), 'Não deu pra salvar o voto.')}
          >
            <Heart size={16} aria-hidden="true" fill={votei ? 'currentColor' : 'none'} />
            {opcao.votos.length > 0 ? opcao.votos.length : 'Curti'}
          </button>
          {quemVotou.length > 0 && (
            <span className="hosp-quem" aria-label={`Votaram: ${quemVotou.map((m) => m.nome).join(', ')}`}>
              {quemVotou.slice(0, 4).map((m) => (
                <Avatar key={m.id} nome={m.nome} url={m.avatarUrl} tamanho={22} />
              ))}
            </span>
          )}

          <span className="hosp-opcao-acoes">
            {destaque && opcao.precoTotal !== null && (
              <button type="button" className="botao secundario pequeno" onClick={() => setJanela({ tipo: 'gasto', opcao })}>
                <Wallet size={15} aria-hidden="true" /> Lançar como gasto
              </button>
            )}
            {euSouAdm && destino && (
              <button
                type="button"
                className={destaque ? 'botao-texto' : 'botao pequeno'}
                onClick={() => tentar(() => h.escolher(opcao.id, !destaque), 'Não deu pra escolher a hospedagem.')}
              >
                {destaque ? (
                  'Desfazer escolha'
                ) : (
                  <>
                    <Check size={15} aria-hidden="true" /> Escolher
                  </>
                )}
              </button>
            )}
          </span>
        </div>
      </li>
    )
  }

  const painel = (i: Item) => {
    const { destino, situacao, noites, escolhida } = i
    const outras = i.opcoes.filter((o) => !o.escolhida)
    const sites = linksDeBusca(destino, pessoas).filter((b) => b.site !== 'maps')
    return (
      <section className={`hosp-painel situacao-${situacao}`} aria-label={`Hospedagem em ${destino.nome}`}>
        <header className="hosp-painel-topo">
          <div>
            <h2>{destino.nome}</h2>
            <p>
              {destino.chegada || destino.saida ? formatarPeriodo(destino.chegada, destino.saida) : 'Datas a definir'}
              {noites ? ` · ${noites} ${noites === 1 ? 'noite' : 'noites'}` : ''}
              {pessoas > 1 ? ` · ${pessoas} pessoas` : ''}
            </p>
          </div>
          <span className={`hosp-selo selo-${situacao}`}>
            {situacao === 'resolvido' && <Check size={12} aria-hidden="true" />}
            {SELO[situacao]}
          </span>
        </header>

        {situacao === 'bate-e-volta' && (
          <p className="hosp-dica">
            <Repeat size={13} aria-hidden="true" /> Chegada e saída no mesmo dia: não precisa dormir aqui.
          </p>
        )}
        {situacao === 'sem-datas' && (
          <p className="hosp-dica">
            <CalendarDays size={13} aria-hidden="true" /> Com as datas no roteiro, a busca já sai com check-in e check-out.{' '}
            {euSouAdm && <Link to={`/viagem/${viagem.id}`}>Definir datas</Link>}
          </p>
        )}
        {i.avisos.map((a) => (
          <p key={a} className="hosp-aviso">
            <AlertTriangle size={15} aria-hidden="true" /> {a}
          </p>
        ))}

        {escolhida && <ul className="hosp-opcoes">{cartaoDaOpcao(escolhida, destino, true)}</ul>}

        <div className="hosp-busca-botoes">
          {sites.map((b) => (
            <a key={b.site} href={b.url} target="_blank" rel="noreferrer noopener" className={`hosp-buscar site-${b.site}`}>
              Buscar no {b.nome}
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          ))}
        </div>

        {outras.length > 0 ? (
          <>
            <h3 className="hosp-subtitulo">
              {escolhida ? 'Outras opções' : 'Opções do comboio'} ({outras.length})
            </h3>
            <ul className="hosp-opcoes">{outras.map((o) => cartaoDaOpcao(o, destino))}</ul>
          </>
        ) : (
          !escolhida && (
            <p className="hosp-vazio">
              Achou algo no mapa, no Airbnb ou no Booking? Cole o link aqui pro comboio ver e votar.
            </p>
          )
        )}

        <button type="button" className="hosp-adicionar" onClick={() => setJanela({ tipo: 'opcao', destinoId: destino.id })}>
          <Plus size={16} aria-hidden="true" /> Adicionar opção
        </button>
      </section>
    )
  }

  const mapa = item ? linkDoMapa(item.destino, tipo) : null
  const opcaoAberta = janela?.tipo === 'opcao' ? janela.opcao : undefined

  return (
    <>
      <CabecalhoPagina
        titulo="Hospedagem"
        subtitulo="Ache no mapa, cole o link, votem e fechem onde o comboio vai dormir."
        acao={
          resumo.total > 0 && (
            <div className="hosp-resumo" aria-label="Resumo da hospedagem">
              <span>
                <strong>{resumo.resolvidos}</strong>/{resumo.total} {resumo.total === 1 ? 'destino fechado' : 'destinos fechados'}
              </span>
              <span className="hosp-barra" aria-hidden="true">
                <span style={{ width: `${porcentagem}%` }} />
              </span>
              {Object.entries(resumo.totais).map(([m, total]) => (
                <small key={m}>
                  {formatarDinheiro(total, m)}
                  {pessoas > 1 && ` · ${formatarDinheiro(resumo.porPessoa[m], m)}/pessoa`}
                </small>
              ))}
            </div>
          )
        }
      />

      {h.estado === 'erro' && (
        <div className="aviso-erro">
          <p>Não deu pra carregar as opções de hospedagem.</p>
          <button type="button" className="botao secundario pequeno" onClick={h.recarregar}>
            Tentar de novo
          </button>
        </div>
      )}
      {erro && (
        <p className="aviso-erro" role="alert">
          {erro}
        </p>
      )}

      {!item ? (
        <p className="hosp-vazio">Adicione destinos no roteiro (na Overview) pra começar a buscar hospedagem.</p>
      ) : (
        <>
          <nav className="hosp-seletor" aria-label="Escolha o destino">
            {escolhiveis.map((i) => (
              <button
                key={i.destino.id}
                type="button"
                aria-pressed={i.destino.id === item.destino.id}
                className={`seletor-${i.situacao}`}
                onClick={() => setSelecionado(i.destino.id)}
              >
                <span className="hosp-seletor-marca" aria-hidden="true">
                  {i.situacao === 'resolvido' ? <Check size={12} /> : i.indice + 1}
                </span>
                {i.destino.nome}
                {i.opcoes.length > 0 && <small>{i.opcoes.length}</small>}
              </button>
            ))}
          </nav>

          <div className="hosp-palco">
            <section className="hosp-mapa" aria-label={`Mapa de ${item.destino.nome}`}>
              <MapaGoogle url={mapa!.embed} titulo={`Google Maps: ${TIPOS_NO_MAPA.find((t) => t.chave === tipo)!.nome.toLowerCase()} em ${item.destino.nome}`} />
              <div className="hosp-mapa-filtros" role="group" aria-label="O que mostrar no mapa">
                {TIPOS_NO_MAPA.map((t) => (
                  <button key={t.chave} type="button" aria-pressed={tipo === t.chave} onClick={() => setTipo(t.chave)}>
                    {t.nome}
                  </button>
                ))}
              </div>
              <a className="hosp-mapa-abrir" href={mapa!.abrir} target="_blank" rel="noreferrer noopener">
                <Maximize2 size={14} aria-hidden="true" /> Abrir no Google Maps
              </a>
            </section>

            {painel(item)}
          </div>
        </>
      )}

      {h.estado === 'carregando' && <p className="carregando-texto">Carregando as opções…</p>}

      {h.soltas.length > 0 && (
        <section className="cartao-ui">
          <header className="cartao-ui-topo">
            <h2>Sem destino</h2>
          </header>
          <p className="form-dica">Opções de um destino que saiu do roteiro. Edite pra mudar o destino, ou apague.</p>
          <ul className="hosp-opcoes">{h.soltas.map((o) => cartaoDaOpcao(o, null))}</ul>
        </section>
      )}

      {janela?.tipo === 'opcao' && (
        <Gaveta titulo={opcaoAberta ? 'Editar opção' : 'Adicionar opção'} aoFechar={fechar}>
          <FormOpcao
            destinos={destinos}
            destinoId={janela.destinoId || destinos[0]?.id}
            moedaViagem={moeda}
            opcao={opcaoAberta}
            podeApagar={!!opcaoAberta && (opcaoAberta.criadoPor === meuId || euSouAdm)}
            salvar={(dados) => (opcaoAberta ? h.editar(opcaoAberta.id, dados) : h.adicionar(dados))}
            apagar={opcaoAberta ? () => h.apagar(opcaoAberta.id) : undefined}
            aoTerminar={fechar}
          />
        </Gaveta>
      )}

      {janela?.tipo === 'gasto' && (
        <Gaveta titulo="Lançar hospedagem como gasto" aoFechar={fechar}>
          <FormGasto
            viagemId={viagem.id}
            moedaViagem={moeda}
            membros={membros}
            meuId={meuId}
            euSouAdm={euSouAdm}
            inicial={{
              descricao: `Hospedagem: ${janela.opcao.nome}`.slice(0, 200),
              valor: janela.opcao.precoTotal ?? undefined,
              moeda: janela.opcao.moeda,
              categoria: 'hospedagem',
              ...(janela.opcao.checkin ? { data: janela.opcao.checkin } : {}),
            }}
            aoTerminar={fechar}
          />
        </Gaveta>
      )}
    </>
  )
}

import { useState } from 'react'
import { Link } from 'react-router'
import {
  AlertTriangle,
  BedDouble,
  CalendarDays,
  Check,
  Crown,
  ExternalLink,
  Heart,
  Home,
  MapPin,
  Pencil,
  Plus,
  Repeat,
  Search,
  Wallet,
} from 'lucide-react'
import type { Tables } from '../../types/database'
import { useViagemAtual } from '../../features/viagens/hooks'
import { useHospedagem } from '../../features/hospedagem/hooks'
import { contasDaOpcao, detectarSite, linksDeBusca, noitesDaOpcao, type DestinoDaHospedagem, type Opcao } from '../../features/hospedagem/regras'
import FormOpcao from '../../features/hospedagem/FormOpcao'
import FormGasto from '../../features/financeiro/FormGasto'
import { mensagemDeErro } from '../../features/financeiro/api'
import { formatarDinheiro } from '../../features/financeiro/dinheiro'
import { formatarData, formatarPeriodo } from '../../lib/datas'
import Avatar from '../../components/ui/Avatar'
import CabecalhoPagina from '../../components/ui/CabecalhoPagina'
import Gaveta from '../../components/ui/Gaveta'
import './abas.css'
import './hospedagem.css'

type Destino = Tables<'destinos'>
type Janela = { tipo: 'opcao'; destinoId: string; opcao?: Opcao } | { tipo: 'gasto'; opcao: Opcao } | null

const SELO: Record<DestinoDaHospedagem['situacao'], string> = {
  resolvido: 'Escolhida',
  precisa: 'Falta escolher',
  'sem-datas': 'Sem datas',
  'bate-e-volta': 'Bate-e-volta',
  casa: 'Partida',
}

// Hospedagem (spec 011): buscar onde ficar em cada destino, juntar as opções do comboio, votar e fechar a escolhida.
export default function Hospedagem() {
  const { viagem, destinos, membros, meuId, euSouAdm } = useViagemAtual()
  const pessoas = membros.length
  const h = useHospedagem(viagem.id, destinos, meuId, pessoas)
  const [janela, setJanela] = useState<Janela>(null)
  const [erro, setErro] = useState<string | null>(null)
  const fechar = () => setJanela(null)

  const moeda = viagem.moeda_principal
  const dinheiro = (centavos: number, m: string) => formatarDinheiro(centavos, m)
  const pessoaDe = (id: string) => membros.find((m) => m.id === id)

  async function tentar(acao: () => Promise<void>, padrao: string) {
    setErro(null)
    try {
      await acao()
    } catch (e) {
      setErro(mensagemDeErro(e, padrao))
    }
  }

  const { resumo } = h
  const porcentagem = resumo.total ? Math.round((resumo.resolvidos / resumo.total) * 100) : 0
  const totais = Object.entries(resumo.totais)

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
            <strong>{dinheiro(opcao.precoTotal, opcao.moeda)}</strong>
            <span>
              {porPessoa !== null && pessoas > 1 && (
                <>
                  <b>{dinheiro(porPessoa, opcao.moeda)}</b> por pessoa
                </>
              )}
              {porPessoa !== null && pessoas > 1 && porNoite !== null && ' · '}
              {porNoite !== null && (
                <>
                  {dinheiro(porNoite, opcao.moeda)} por noite
                </>
              )}
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

  const secao = (item: DestinoDaHospedagem<Destino>) => {
    const { destino, situacao, noites, escolhida } = item
    const outras = item.opcoes.filter((o) => !o.escolhida)
    const numero = item.indice + 1

    // Partida/volta no Brasil e bate-e-volta: uma linha só, sem busca
    if (situacao === 'casa' || (situacao === 'bate-e-volta' && item.opcoes.length === 0)) {
      return (
        <li key={destino.id} id={`hosp-${destino.id}`} className="hosp-destino recolhido">
          <span className="hosp-numero">{numero}</span>
          <span className="hosp-destino-nome">
            <strong>{destino.nome}</strong>
            <small>
              {situacao === 'casa' ? (
                <>
                  <Home size={12} aria-hidden="true" /> Ponto de partida/volta: sem hospedagem
                </>
              ) : (
                <>
                  <Repeat size={12} aria-hidden="true" /> Bate-e-volta: sem pernoite
                </>
              )}
            </small>
          </span>
        </li>
      )
    }

    const busca = linksDeBusca(destino, pessoas)
    return (
      <li key={destino.id} id={`hosp-${destino.id}`} className={`hosp-destino situacao-${situacao}`}>
        <header className="hosp-destino-topo">
          <span className="hosp-numero">{numero}</span>
          <span className="hosp-destino-nome">
            <h3>{destino.nome}</h3>
            <small>
              {destino.chegada || destino.saida ? formatarPeriodo(destino.chegada, destino.saida) : 'Datas a definir'}
              {noites ? ` · ${noites} ${noites === 1 ? 'noite' : 'noites'}` : ''}
              {destino.pais && destino.pais !== destino.nome ? ` · ${destino.pais}` : ''}
            </small>
          </span>
          <span className={`hosp-selo selo-${situacao}`}>
            {situacao === 'resolvido' && <Check size={12} aria-hidden="true" />}
            {SELO[situacao]}
          </span>
        </header>

        {item.avisos.map((a) => (
          <p key={a} className="hosp-aviso">
            <AlertTriangle size={15} aria-hidden="true" /> {a}
          </p>
        ))}

        {escolhida && <ul className="hosp-opcoes">{cartaoDaOpcao(escolhida, destino, true)}</ul>}

        <div className="hosp-busca">
          <span className="hosp-busca-rotulo">
            <Search size={14} aria-hidden="true" /> Buscar {pessoas > 1 ? `pra ${pessoas} pessoas` : ''}
          </span>
          <div className="hosp-busca-botoes">
            {busca.map((b) => (
              <a key={b.site} href={b.url} target="_blank" rel="noreferrer noopener" className={`hosp-buscar site-${b.site}`}>
                {b.site === 'maps' && <MapPin size={14} aria-hidden="true" />}
                {b.nome}
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            ))}
          </div>
          {situacao === 'sem-datas' && (
            <p className="hosp-dica">
              <CalendarDays size={13} aria-hidden="true" /> Sem datas, a busca abre só com a cidade.{' '}
              {euSouAdm && <Link to="..">Definir no roteiro</Link>}
            </p>
          )}
        </div>

        {outras.length > 0 ? (
          <>
            {escolhida && <h4 className="hosp-subtitulo">Outras opções ({outras.length})</h4>}
            <ul className="hosp-opcoes">{outras.map((o) => cartaoDaOpcao(o, destino))}</ul>
          </>
        ) : (
          !escolhida && <p className="hosp-vazio">Nenhuma opção ainda. Busque nos sites acima e cole aqui o link do que gostar.</p>
        )}

        <button type="button" className="hosp-adicionar" onClick={() => setJanela({ tipo: 'opcao', destinoId: destino.id })}>
          <Plus size={16} aria-hidden="true" /> Adicionar opção
        </button>
      </li>
    )
  }

  const opcaoAberta = janela?.tipo === 'opcao' ? janela.opcao : undefined

  return (
    <>
      <CabecalhoPagina titulo="Hospedagem" subtitulo="Onde o comboio vai dormir em cada destino. Busque, cole o link, votem e fechem." />

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

      {destinos.length === 0 ? null : (
        <section className="hosp-resumo" aria-label="Resumo da hospedagem">
          <div className="hosp-resumo-principal">
            <span className="hosp-resumo-icone">
              <BedDouble size={26} aria-hidden="true" />
            </span>
            <div>
              <p className="hosp-resumo-conta">
                <strong>{resumo.resolvidos}</strong> de {resumo.total} {resumo.total === 1 ? 'destino' : 'destinos'} com hospedagem
              </p>
              <div className="hosp-barra" aria-hidden="true">
                <span style={{ width: `${porcentagem}%` }} />
              </div>
              <p className="hosp-resumo-sub">
                {resumo.total === 0
                  ? 'Nenhum destino com pernoite por enquanto.'
                  : resumo.resolvidos === resumo.total
                    ? 'Tudo fechado. Agora é só aproveitar.'
                    : `${resumo.opcoes} ${resumo.opcoes === 1 ? 'opção salva' : 'opções salvas'} pelo comboio`}
              </p>
            </div>
          </div>
          {totais.length > 0 && (
            <div className="hosp-resumo-totais">
              {totais.map(([m, total]) => (
                <p key={m}>
                  <span>Total escolhido</span>
                  <strong>{dinheiro(total, m)}</strong>
                  {pessoas > 1 && <small>{dinheiro(resumo.porPessoa[m], m)} por pessoa</small>}
                </p>
              ))}
            </div>
          )}
          <ol className="hosp-trilha" aria-label="Destinos">
            {h.itens
              .filter((i) => i.situacao !== 'casa')
              .map((i) => (
                <li key={i.destino.id}>
                  <a href={`#hosp-${i.destino.id}`} className={`trilha-${i.situacao}`}>
                    {i.situacao === 'resolvido' ? <Check size={12} aria-hidden="true" /> : <span aria-hidden="true">{i.indice + 1}</span>}
                    {i.destino.nome}
                  </a>
                </li>
              ))}
          </ol>
        </section>
      )}

      {h.estado === 'carregando' && <p className="carregando-texto">Carregando as opções…</p>}

      {destinos.length === 0 ? (
        <p className="hosp-vazio">Adicione destinos no roteiro (na Overview) pra começar a buscar hospedagem.</p>
      ) : (
        <ol className="hosp-destinos">{h.itens.map(secao)}</ol>
      )}

      {h.soltas.length > 0 && (
        <section className="cartao-ui">
          <header className="cartao-ui-topo">
            <h2>Sem destino</h2>
          </header>
          <p className="form-dica">Opções de um destino que saiu do roteiro. Edite pra mudar o destino, ou apague.</p>
          <ul className="hosp-opcoes">
            {h.soltas.map((o) => cartaoDaOpcao(o, null))}
          </ul>
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

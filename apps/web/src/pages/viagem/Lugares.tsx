import { useState } from 'react'
import { Link } from 'react-router'
import { CheckCheck, ExternalLink, Flag, Upload, Heart, Luggage, Map as MapaIcone, Pencil, Plus, Sparkles } from '../../components/ui/icones'
import type { Tables } from '@together/core'
import { useViagemAtual } from '../../features/viagens/hooks'
import { useLugares } from '../../features/lugares/hooks'
import { contarPorTipo, linkNoMapa, TIPOS_DE_LUGAR, tipoDeLugar, type Lugar, type TipoDeLugar } from '../../features/lugares/regras'
import { ICONE_DO_TIPO } from '../../features/lugares/icones'
import FormLugar from '../../features/lugares/FormLugar'
import { CONGELADO, formatarDinheiro } from '@together/core'
import { formatarData, formatarPeriodo } from '../../lib/datas'
import { useFocoDeItem } from '../../lib/foco'
import BotaoCompartilhar from '../../components/ui/BotaoCompartilhar'
import ComentariosDoItem from '../../features/comentarios/ComentariosDoItem'
import { useContagemDeComentarios } from '../../features/comentarios/hooks'
import TituloDaTela from '../../components/ui/TituloDaTela'
import TelaVazia from '../../components/ui/TelaVazia'
import Carregando from '../../components/ui/Carregando'
import ErroNaTela from '../../components/ui/ErroNaTela'
import Gaveta from '../../components/ui/Gaveta'
import BotaoIr from '../../components/ui/BotaoIr'
import PertoDeMim from '../../features/lugares/PertoDeMim'
import ImportarDoMaps from '../../features/lugares/ImportarDoMaps'
import SugestoesDoDestino from '../../features/lugares/SugestoesDoDestino'
import MontarDias from '../../features/lugares/MontarDias'
import IndicarLugares from '../../features/lugares/IndicarLugares'
import { adicionarLugar } from '../../features/lugares/api'
import './abas.css'
import './hospedagem.css'
import './lugares.css'

type Destino = Tables<'destinos'>
type Janela = { destinoId: string | null; tipo?: TipoDeLugar; lugar?: Lugar } | null

// Lugares (spec 016): o que o comboio quer ver, comer e usar em cada destino, inclusive guarda-volumes nos dias de passagem.
export default function Lugares() {
  const { viagem, destinos, membros, meuId, euSouAdm } = useViagemAtual()
  useFocoDeItem() // destaca o lugar quando se chega por um link de compartilhar
  const comentarios = useContagemDeComentarios(viagem.id)
  const l = useLugares(viagem.id, destinos, meuId)
  const [selecionado, setSelecionado] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<TipoDeLugar | null>(null)
  const [janela, setJanela] = useState<Janela>(null)
  const [avisoPrioridade, setAvisoPrioridade] = useState<string | null>(null)
  const [importando, setImportando] = useState(false) // spec 079
  const fechar = () => setJanela(null)

  const item = l.itens.find((i) => i.destino.id === selecionado) ?? l.itens[0] ?? null
  const pessoaDe = (id: string) => membros.find((m) => m.id === id)

  const cartao = (lugar: Lugar, destino: Destino | null) => {
    const tipo = tipoDeLugar(lugar.tipo)
    const Icone = ICONE_DO_TIPO[tipo.chave]
    const podeEditar = lugar.criadoPor === meuId || euSouAdm
    const autor = pessoaDe(lugar.criadoPor)
    const euVotei = lugar.votos.includes(meuId)
    const detalhes = [tipo.nome, lugar.horario, lugar.preco !== null ? formatarDinheiro(lugar.preco, lugar.moeda) : null].filter(Boolean)
    return (
      <li key={lugar.id} data-foco={lugar.id} className={`lugar tipo-${tipo.chave}`}>
        <span className="lugar-icone" aria-hidden="true">
          <Icone size={18} />
        </span>
        <div className="lugar-corpo">
          <div className="lugar-topo">
            <h3>{lugar.nome}</h3>
            {podeEditar && (
              <button
                type="button"
                className="botao-texto lugar-editar"
                aria-label={`Editar ${lugar.nome}`}
                onClick={() => setJanela({ destinoId: lugar.destinoId, lugar })}
              >
                <Pencil size={15} aria-hidden="true" />
              </button>
            )}
          </div>
          <p className="lugar-detalhes">{detalhes.join(' · ')}</p>
          {lugar.observacao && <p className="lugar-obs">{lugar.observacao}</p>}
          <div className="lugar-acoes">
            {lugar.link && (
              <a href={lugar.link} target="_blank" rel="noreferrer noopener">
                Abrir <ExternalLink size={13} aria-hidden="true" />
              </a>
            )}
            <a href={linkNoMapa(lugar, destino)} target="_blank" rel="noreferrer noopener">
              Ver no mapa <MapaIcone size={13} aria-hidden="true" />
            </a>
            <BotaoIr
              alvo={{
                nome: lugar.nome,
                endereco: lugar.endereco,
                latitude: lugar.latitude,
                longitude: lugar.longitude,
                cidade: destino ? [destino.nome, destino.pais].filter(Boolean).join(', ') : null,
              }}
            />
            <button
              type="button"
              className={(lugar.prioridades ?? []).includes(meuId) ? 'lugar-fomos foi' : 'lugar-fomos'}
              aria-pressed={(lugar.prioridades ?? []).includes(meuId)}
              title="Até 3 por destino"
              onClick={() =>
                l.marcarPrioridade(lugar.id, !(lugar.prioridades ?? []).includes(meuId)).catch(() => setAvisoPrioridade('Você já tem 3 "não abro mão" nesse destino. Tire um pra marcar outro.'))
              }
            >
              <Flag size={13} aria-hidden="true" /> Não abro mão
            </button>
            {(lugar.prioridades?.length ?? 0) > 0 && (
              <small className="lugar-prioridades">
                obrigatório pra {lugar.prioridades!.map((id) => (id === meuId ? 'você' : (pessoaDe(id)?.nome.split(' ')[0] ?? 'alguém'))).join(', ')}
              </small>
            )}
            <button
              type="button"
              className={lugar.visitadoEm ? 'lugar-fomos foi' : 'lugar-fomos'}
              aria-pressed={!!lugar.visitadoEm}
              onClick={() => l.marcarVisitado(lugar.id, !lugar.visitadoEm)}
            >
              <CheckCheck size={13} aria-hidden="true" /> {lugar.visitadoEm ? 'Já fomos' : 'Fomos?'}
            </button>
            <button
              type="button"
              className={euVotei ? 'lugar-voto votou' : 'lugar-voto'}
              onClick={() => l.votar(lugar.id, !euVotei).catch(() => {})}
              aria-pressed={euVotei}
              aria-label={euVotei ? `Tirar curtida de ${lugar.nome}` : `Curtir ${lugar.nome}`}
            >
              <Heart size={13} aria-hidden="true" fill={euVotei ? 'currentColor' : 'none'} />
              {lugar.votos.length > 0 && <span>{lugar.votos.length}</span>}
            </button>
            {/* ❄ congelado pelo RUMO (03/11/2026): comentários soltos */}
            {!CONGELADO.comentarios && (
              <ComentariosDoItem
                alvo={{ tipo: 'lugar', id: lugar.id }}
                titulo={lugar.nome}
                quantidade={comentarios.contagem[lugar.id]}
                aoMudar={comentarios.recarregar}
              />
            )}
            <BotaoCompartilhar viagemId={viagem.id} item={{ tipo: 'lugar', id: lugar.id, titulo: lugar.nome }} nomeDaViagem={viagem.nome} />
            {autor && <small>por {autor.id === meuId ? 'você' : autor.nome.split(' ')[0]}</small>}
          </div>
        </div>
      </li>
    )
  }

  const painel = () => {
    if (!item) return null
    const { destino, lugares, passagem, temGuardaVolumes } = item
    const conta = contarPorTipo(lugares)
    const visiveis = filtro ? lugares.filter((x) => x.tipo === filtro) : lugares
    // Design Plataforma (spec 113): lista do destino + sugestões num cartão ao lado
    return (
      <div className="lugares-colunas">
        <section className="hosp-painel lugares-painel" aria-label={`Lugares em ${destino.nome}`}>
          <header className="hosp-painel-topo">
            <div>
              <h2>{destino.nome}</h2>
              <p>
                {destino.chegada && destino.chegada === destino.saida
                  ? formatarData(destino.chegada, true) // dia de passagem: "7 jun 2027", não "7 – 7 jun 2027"
                  : destino.chegada || destino.saida
                    ? formatarPeriodo(destino.chegada, destino.saida)
                    : 'Datas a definir'}
              </p>
            </div>
            {passagem && <span className="hosp-selo selo-bate-e-volta">De passagem</span>}
          </header>

          {/* Spec 114: deslizar os lugares e montar o roteiro */}
          <Link to={`../explorar?destino=${destino.id}`} className="lugares-explorar">
            <Sparkles size={18} aria-hidden="true" />
            <span>
              <strong>Explorar {destino.nome}</strong>
              <small>Deslize os lugares e monte o roteiro em minutos</small>
            </span>
          </Link>

          {/* Dia de passagem: sugestão de guarda-volumes (some quando já tem um anotado) */}
          {passagem && !temGuardaVolumes && (
            <div className="lugares-dica">
              <p>
                <Luggage size={15} aria-hidden="true" /> Vai passar por {destino.nome} com malas? Anote um guarda-volumes.
              </p>
              <button type="button" className="botao secundario pequeno" onClick={() => setJanela({ destinoId: destino.id, tipo: 'guarda_volumes' })}>
                Anotar guarda-volumes
              </button>
            </div>
          )}

          {lugares.length > 0 && (
            <div className="filtros" role="group" aria-label="Filtrar por tipo">
              <button type="button" className={filtro === null ? 'ativo' : undefined} aria-pressed={filtro === null} onClick={() => setFiltro(null)}>
                Todos <span>{lugares.length}</span>
              </button>
              {TIPOS_DE_LUGAR.filter((t) => conta[t.chave] > 0).map((t) => (
                <button
                  key={t.chave}
                  type="button"
                  className={filtro === t.chave ? 'ativo' : undefined}
                  aria-pressed={filtro === t.chave}
                  onClick={() => setFiltro(t.chave)}
                >
                  {t.plural} <span>{conta[t.chave]}</span>
                </button>
              ))}
            </div>
          )}

          {lugares.length === 0 ? (
            <p className="hosp-vazio">Nada anotado em {destino.nome} ainda. Passeios, comida ou guarda-volumes?</p>
          ) : visiveis.length === 0 ? (
            <p className="hosp-vazio">
              Nenhum {tipoDeLugar(filtro!).nome.toLowerCase()} em {destino.nome}.{' '}
              <button type="button" className="botao-texto" onClick={() => setFiltro(null)}>
                Ver todos
              </button>
            </p>
          ) : (
            <ul className="lugar-lista">{visiveis.map((x) => cartao(x, destino))}</ul>
          )}

          <button type="button" className="hosp-adicionar" onClick={() => setJanela({ destinoId: destino.id, tipo: filtro ?? undefined })}>
            <Plus size={16} aria-hidden="true" /> Adicionar lugar
          </button>
          {/* Spec 103: indicar pra um amigo */}
          <IndicarLugares destino={destino.nome} lugares={lugares} />
          {/* Spec 096: montar os dias pelos votos */}
          <MontarDias key={`m${destino.id}`} viagemId={viagem.id} destino={destino} lugares={lugares} />
        </section>
        {/* Spec 094: sugestões do catálogo do Explorar */}
        {destino.latitude != null && destino.longitude != null && (
          <aside className="cartao-ui lugares-sugestoes" aria-label={`Sugestões em ${destino.nome}`}>
            <SugestoesDoDestino
              key={destino.id}
              destino={destino}
              jaSalvos={lugares.map((x) => x.nome)}
              aoSalvar={async (s) => {
                await adicionarLugar(viagem.id, {
                  destinoId: destino.id,
                  tipo: 'passeio',
                  nome: s.nome,
                  link: s.wikipedia,
                  horario: null,
                  preco: null,
                  moeda: viagem.moeda_principal,
                  observacao: null,
                  latitude: s.latitude,
                  longitude: s.longitude,
                })
                await l.recarregar()
              }}
            />
          </aside>
        )}
      </div>
    )
  }

  const lugarAberto = janela?.lugar

  return (
    <>
      <TituloDaTela
        titulo="Lugares"
        voltar="../tudo"
        acima={
          l.total > 0
            ? `${l.total} ${l.total === 1 ? 'lugar' : 'lugares'}${l.lugares.some((x) => x.visitadoEm) ? ` · ${l.lugares.filter((x) => x.visitadoEm).length} visitados` : ''}`
            : undefined
        }
        acao={
          <button type="button" className="botao secundario compacto" onClick={() => setImportando(true)} title="Importar do Google Maps">
            <Upload size={16} aria-hidden="true" /> Importar
          </button>
        }
      />
      {l.total > 0 && <PertoDeMim lugares={l.lugares} destinos={destinos} />}

      {avisoPrioridade && (
        <p className="form-erro" role="alert" onClick={() => setAvisoPrioridade(null)}>
          {avisoPrioridade}
        </p>
      )}

      {l.estado === 'erro' && (
        <ErroNaTela titulo="Não deu pra carregar os lugares" aoTentar={l.recarregar} />
      )}

      {!item ? (
        <TelaVazia
          titulo="Nenhuma cidade ainda"
          texto="Adicione as cidades da viagem pra começar a anotar lugares."
          acao={
            <Link to="../cidades" relative="path" className="botao">
              Ver cidades
            </Link>
          }
        />
      ) : (
        <>
          <nav className="hosp-seletor" aria-label="Escolha o destino">
            {l.itens.map((i) => (
              <button
                key={i.destino.id}
                type="button"
                aria-pressed={i.destino.id === item.destino.id}
                onClick={() => {
                  setSelecionado(i.destino.id)
                  setFiltro(null)
                }}
              >
                <span className="hosp-seletor-marca" aria-hidden="true">
                  {i.indice + 1}
                </span>
                {i.destino.nome}
                {i.lugares.length > 0 && <small>{i.lugares.length}</small>}
              </button>
            ))}
          </nav>
          {painel()}
        </>
      )}

      {l.estado === 'carregando' && <Carregando texto="Carregando os lugares…" compacto />}

      {l.soltos.length > 0 && (
        <section className="cartao-ui">
          <header className="cartao-ui-topo">
            <h2>Sem destino</h2>
          </header>
          <p className="form-dica">Lugares de um destino que saiu do roteiro. Edite pra escolher outro destino, ou apague.</p>
          <ul className="lugar-lista">{l.soltos.map((x) => cartao(x, null))}</ul>
        </section>
      )}

      {janela && (
        <Gaveta titulo={lugarAberto ? 'Editar lugar' : 'Adicionar lugar'} aoFechar={fechar}>
          <FormLugar
            destinos={destinos}
            destinoId={janela.destinoId}
            tipoInicial={janela.tipo}
            moedaViagem={viagem.moeda_principal}
            lugar={lugarAberto}
            podeApagar={!!lugarAberto && (lugarAberto.criadoPor === meuId || euSouAdm)}
            salvar={(dados) => (lugarAberto ? l.editar(lugarAberto.id, dados) : l.adicionar(dados))}
            apagar={lugarAberto ? () => l.apagar(lugarAberto.id) : undefined}
            aoTerminar={fechar}
          />
        </Gaveta>
      )}
      {importando && (
        <Gaveta titulo="Importar lista do Google Maps" aoFechar={() => setImportando(false)}>
          <ImportarDoMaps
            viagemId={viagem.id}
            destinos={destinos}
            moeda={viagem.moeda_principal}
            aoTerminar={() => {
              setImportando(false)
              l.recarregar()
            }}
          />
        </Gaveta>
      )}
    </>
  )
}

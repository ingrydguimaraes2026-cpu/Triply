import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ChevronLeft, Heart, Minus, Plus, Star, Undo2, X } from '../../components/ui/icones'
import {
  ESTILOS,
  ORCAMENTOS,
  RITMOS,
  acabou,
  comecarDeslize,
  contarEscolhas,
  creditoDaFoto,
  decidir,
  desfazer,
  diasDoPeriodo,
  montarDiasPelosVotos,
  montarPilha,
  podeNaoAbrirMao,
  porDiaDoRitmo,
  precoLegivel,
  tempoLegivel,
  type DiasDoRoteiro,
  type Escolha,
  type EstadoDoDeslize,
  type EstiloId,
  type LugarDoCatalogo,
  type OrcamentoId,
  type RitmoId,
  type Tables,
  destinosParaExplorar,
} from '@together/core'
import { useViagemAtual } from '../../features/viagens/hooks'
import { supabase } from '../../lib/supabase'
import { buscarLugares } from '../../features/lugares/api'
import { avisarQueMudou, useAoMudar } from '../../features/tempo-real/avisos'
import { diaPorExtenso } from '../../features/agenda/hooks'
import * as api from '../../features/explorar/api'
import Cartao from '../../features/explorar/Cartao'
import RoteiroDoDestino from '../../features/explorar/RoteiroDoDestino'
import type { Lugar } from '../../features/lugares/regras'
import Gaveta from '../../components/ui/Gaveta'
import '../../features/explorar/explorar.css'

// Explorar (spec 114) virou o Roteiro (spec 115 v2): desliza 12 lugares e cai direto no roteiro do grupo,
// que dá pra arrumar (mudar de dia, ordem, "Sem dia"). Se o destino já tem roteiro, abre nele.
// Estilo, ritmo e orçamento começam no padrão; "Ajustar" muda.
type Etapa = 'estilo' | 'carregando' | 'deck' | 'montando' | 'roteiro' | 'erro'

const CARTOES_POR_VEZ = 6

export default function Explorar() {
  // Aeroporto/rodoviária de saída não é cidade pra explorar
  const destinos = destinosParaExplorar(useViagemAtual().destinos)
  const [params] = useSearchParams()
  const destino = destinos.find((d) => d.id === params.get('destino')) ?? destinos[0]
  if (!destino) {
    return (
      <div className="exp">
        <p className="hosp-vazio">Adicione um destino no Roteiro pra explorar os lugares.</p>
      </div>
    )
  }
  // `key`: trocar de destino recomeça tudo do zero
  return <ExplorarDestino key={destino.id} destino={destino} />
}

function ExplorarDestino({ destino }: { destino: Tables<'destinos'> }) {
  const { viagem, destinos: todos, meuId } = useViagemAtual()
  const destinos = destinosParaExplorar(todos)
  const [params, setParams] = useSearchParams()

  const [etapa, setEtapa] = useState<Etapa>('carregando')
  const [estilos, setEstilos] = useState<EstiloId[]>(['cultura'])
  const [ritmo, setRitmo] = useState<RitmoId>('equilibrado')
  const [orcamento, setOrcamento] = useState<OrcamentoId>('medio')
  // Spec 115: sem datas, usa os dias planejados do destino (Nova viagem) ou ?dias=5
  const [diasManual, setDiasManual] = useState(() => Math.min(14, Math.max(1, Number(params.get('dias')) || destino.dias || 3)))
  const [preparando, setPreparando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [catalogo, setCatalogo] = useState<LugarDoCatalogo[]>([])
  const [deslize, setDeslize] = useState<EstadoDoDeslize>(comecarDeslize([]))
  const [jaTenho, setJaTenho] = useState(0)
  const [voando, setVoando] = useState<Escolha | null>(null)
  const [detalhe, setDetalhe] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)
  // Roteiro do grupo: o que o comboio curtiu neste destino e como está arrumado nos dias
  const [lugaresDoGrupo, setLugaresDoGrupo] = useState<Lugar[]>([])
  const [diasSalvos, setDiasSalvos] = useState<DiasDoRoteiro>([])
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  const depois = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms))

  const temDatas = !!destino.chegada
  const dias = useMemo(
    () => (destino.chegada ? diasDoPeriodo(destino.chegada, destino.saida ?? destino.chegada) : Array.from({ length: diasManual }, (_, i) => `Dia ${i + 1}`)),
    [destino.chegada, destino.saida, diasManual],
  )
  const porDia = porDiaDoRitmo(ritmo)
  const porId = useMemo(() => new Map(catalogo.map((l) => [l.id, l])), [catalogo])
  const atual = porId.get(deslize.pilha[deslize.posicao] ?? '') ?? null
  const proximo = porId.get(deslize.pilha[deslize.posicao + 1] ?? '') ?? null
  const contagem = contarEscolhas(deslize.escolhas)
  const escolhidos = Object.entries(deslize.escolhas)
    .filter(([, e]) => e !== 'passo')
    .map(([id, e]) => ({ lugar: porId.get(id), estrela: e === 'nao_abro_mao' }))
    .filter((x): x is { lugar: LugarDoCatalogo; estrela: boolean } => !!x.lugar)

  // ---------- Começar: catálogo + escolhas antigas ----------
  async function comecar() {
    setErro(null)
    setPreparando(false)
    setEtapa('carregando')
    try {
      const [cat, antigas, naViagem] = await Promise.all([
        api.carregarCatalogo(destino, () => setPreparando(true)),
        api.buscarMinhasEscolhas(destino.id, meuId),
        supabase.from('lugares').select('nome, wikidata').eq('viagem_id', viagem.id).eq('destino_id', destino.id),
      ])
      const qidsEstrela = cat.lugares.filter((l) => antigas[l.id] === 'nao_abro_mao' && l.wikidata).map((l) => l.wikidata!)
      setJaTenho(await api.prioridadesForaDoExplorar(destino.id, meuId, qidsEstrela))
      // O que já virou lugar da viagem pelo Explorar continua contando como escolha (não volta pra pilha)
      const pilha = montarPilha(cat.lugares, {
        estilos,
        orcamento,
        tamanho: CARTOES_POR_VEZ,
        jaNaViagem: (naViagem.data ?? []).filter((l) => !cat.lugares.some((c) => c.wikidata && c.wikidata === l.wikidata && antigas[c.id])),
        jaEscolhidos: Object.keys(antigas),
      })
      setCatalogo(cat.lugares)
      setDeslize(comecarDeslize(pilha.map((l) => l.id), antigas))
      if (pilha.length === 0 && Object.keys(antigas).length > 0) await abrirRoteiro(true)
      else setEtapa('deck')
    } catch (e) {
      console.error('Erro ao carregar o Explorar:', e)
      setErro(e instanceof Error ? e.message : 'Não deu pra carregar agora.')
      setEtapa('erro')
    }
  }

  // ---------- Deslizar ----------
  function escolher(escolha: Escolha): boolean {
    if (voando || !atual) return false
    if (escolha === 'nao_abro_mao' && !podeNaoAbrirMao(deslize, jaTenho)) {
      setAviso('Você já tem 3 "não abro mão" aqui. Tire um pra marcar outro.')
      return false
    }
    setAviso(null)
    setDetalhe(false)
    setVoando(escolha)
    const id = atual.id
    depois(250, () => {
      setVoando(null)
      setDeslize((d) => decidir(d, escolha, jaTenho))
    })
    api.salvarEscolha(viagem.id, destino.id, meuId, id, escolha).catch((e) => {
      console.error('Erro ao salvar escolha:', e)
      setAviso('Não deu pra salvar a última escolha. Confira a internet.')
    })
    return true
  }

  function voltarUm() {
    const id = deslize.historico[deslize.historico.length - 1]
    if (!id || voando) return
    setDeslize(desfazer)
    setEtapa('deck')
    api.apagarEscolha(destino.id, meuId, id).catch((e) => console.error('Erro ao desfazer:', e))
  }

  // Teclado no computador: ← passo, → quero, ↑ não abro mão, Z desfazer, Espaço ver mais
  // (refs atualizadas depois de cada render, pro atalho sempre usar a versão mais nova das funções)
  const escolherRef = useRef(escolher)
  const voltarRef = useRef(voltarUm)
  useEffect(() => {
    escolherRef.current = escolher
    voltarRef.current = voltarUm
  })
  useEffect(() => {
    if (etapa !== 'deck' || detalhe) return
    const aoApertar = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement
      if (alvo.closest('input, textarea, select, [contenteditable]')) return
      if (e.key === 'ArrowRight') escolherRef.current('quero')
      else if (e.key === 'ArrowLeft') escolherRef.current('passo')
      else if (e.key === 'ArrowUp') escolherRef.current('nao_abro_mao')
      else if (e.key === 'z' || e.key === 'Z') voltarRef.current()
      else if (e.key === ' ') setDetalhe(true)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', aoApertar)
    return () => window.removeEventListener('keydown', aoApertar)
  }, [etapa, detalhe])

  // Acabou a pilha: vai direto pro roteiro (sem tela de resumo)
  useEffect(() => {
    if (etapa === 'deck' && deslize.pilha.length > 0 && acabou(deslize)) void abrirRoteiro(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa, deslize])

  // Ao abrir: destino com roteiro abre nele; sem roteiro, começa a deslizar.
  // `?roteiro=1` (vindo dos Matches, como no app): monta os dias direto com o que já foi escolhido.
  useEffect(() => {
    let vivo = true
    if (params.get('roteiro') === '1') {
      void abrirRoteiro(true)
      return
    }
    api
      .buscarRoteiro(destino.id)
      .then((salvo) => {
        if (!vivo) return
        if (salvo) void abrirRoteiro(false)
        else void comecar()
      })
      .catch((e) => {
        console.error('Erro ao abrir o roteiro:', e)
        if (vivo) void comecar()
      })
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destino.id])

  // ---------- Roteiro ----------
  // O que alguém do comboio curtiu ou marcou como "não abro mão" neste destino; os mais importantes primeiro
  async function buscarDoGrupo() {
    const todos = await buscarLugares(viagem.id)
    return todos
      .filter((l) => l.destinoId === destino.id && (l.votos.length > 0 || (l.prioridades?.length ?? 0) > 0))
      .sort((a, b) => (b.prioridades?.length ?? 0) - (a.prioridades?.length ?? 0) || b.votos.length - a.votos.length)
  }

  // Proposta pela proximidade e pelos votos (um dia = uma lista de ids)
  function propor(lugares: Lugar[]): DiasDoRoteiro {
    const proposta = montarDiasPelosVotos(
      dias,
      lugares.map((l) => ({ id: l.id, nome: l.nome, tipo: l.tipo, votos: l.votos.length, prioridades: l.prioridades?.length ?? 0, latitude: l.latitude, longitude: l.longitude, endereco: l.endereco })),
      porDia,
    )
    return dias.map((d) => proposta.dias.find((p) => p.dia === d)?.itens.map((i) => i.lugarId) ?? [])
  }

  // `converter`: minhas escolhas viram lugares da viagem antes (depois de deslizar)
  // `silencioso`: recarga do tempo real, sem tela de "Montando" e sem tela de erro
  async function abrirRoteiro(converter: boolean, silencioso = false) {
    if (!silencioso) setEtapa('montando')
    try {
      if (converter) {
        await api.criarLugaresDoExplorar(destino.id)
        avisarQueMudou('lugares')
      }
      const [doGrupo, salvo] = await Promise.all([buscarDoGrupo(), api.buscarRoteiro(destino.id)])
      // Primeira vez (ou roteiro vazio): o app monta; depois, o que chega novo fica em "Sem dia"
      let diasDoRoteiro = salvo ?? []
      if (diasDoRoteiro.every((d) => d.length === 0)) {
        diasDoRoteiro = propor(doGrupo)
        await api.salvarRoteiro(viagem.id, destino.id, diasDoRoteiro)
      }
      setLugaresDoGrupo(doGrupo)
      setDiasSalvos(diasDoRoteiro)
      setEtapa('roteiro')
    } catch (e) {
      console.error('Erro ao montar:', e)
      if (silencioso) return
      setErro('Não deu pra montar o roteiro agora. Suas escolhas estão salvas: tente de novo.')
      setEtapa('erro')
    }
  }

  // Mexeu no roteiro: mostra na hora e salva (se falhar, avisa)
  function mudarRoteiro(novo: DiasDoRoteiro) {
    setDiasSalvos(novo)
    api.salvarRoteiro(viagem.id, destino.id, novo).catch((e) => {
      console.error('Erro ao salvar o roteiro:', e)
      setAviso('Não deu pra salvar a mudança. Confira a internet.')
    })
  }

  // Outra pessoa arrumou o roteiro ou curtiu algo: recarrega
  useAoMudar(['roteiros', 'lugares'], () => {
    if (etapa === 'roteiro') void abrirRoteiro(false, true)
  })

  const botaoOpcao = (on: boolean) => (on ? 'exp-opcao ativa' : 'exp-opcao')

  // ---------- Telas ----------
  const cabecalho = (
    <header className="exp-topo">
      <Link to="../roteiro" className="exp-voltar" aria-label="Voltar pro roteiro">
        <ChevronLeft size={20} aria-hidden="true" />
      </Link>
      <div className="exp-topo-titulo">
        <span className="exp-sobretitulo">Roteiro</span>
        <h1>{destino.nome}</h1>
      </div>
      {destinos.length > 1 && (
        <label className="exp-trocar">
          <span className="sr-only">Destino</span>
          <select value={destino.id} onChange={(e) => setParams({ destino: e.target.value })}>
            {destinos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome}
              </option>
            ))}
          </select>
        </label>
      )}
    </header>
  )

  if (etapa === 'carregando' || etapa === 'montando' || etapa === 'erro') {
    return (
      <div className="exp">
        {cabecalho}
        {etapa === 'erro' ? (
          <section className="exp-montando">
            <p className="form-erro" role="alert">
              {erro}
            </p>
            <button type="button" className="botao exp-principal" onClick={() => void comecar()}>
              Tentar de novo
            </button>
          </section>
        ) : (
          <section className="exp-montando" role="status" aria-live="polite">
            <span className="exp-pontinhos" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <h2 className="exp-titulo">
              {etapa === 'montando'
                ? `Montando ${destino.nome} em ${dias.length} ${dias.length === 1 ? 'dia' : 'dias'}`
                : preparando
                  ? `Preparando os lugares de ${destino.nome}…`
                  : 'Carregando os lugares…'}
            </h2>
            {preparando && etapa === 'carregando' && <p className="exp-dica">Pode levar uns 30 segundos, só na primeira vez.</p>}
          </section>
        )}
      </div>
    )
  }

  if (etapa === 'estilo') {
    return (
      <div className="exp">
        {cabecalho}
        <section className="exp-estilo" aria-label="Como vai ser a viagem">
          {/* Spec 115: quem acabou de entrar pelo convite */}
          {params.get('bemvindo') && (
            <p className="exp-boas-vindas">
              Você entrou em <strong>{viagem.nome}</strong>! Escolha o que quer fazer em {destino.nome}: o roteiro sai das escolhas de todo mundo.
            </p>
          )}
          <h2 className="exp-titulo">Como vai ser a viagem?</h2>

          <div className="exp-grupo">
            <span className="exp-rotulo">Quantos dias em {destino.nome}?</span>
            {temDatas ? (
              <p className="exp-dica">
                {dias.length} {dias.length === 1 ? 'dia' : 'dias'}, pelas datas do roteiro
              </p>
            ) : (
              <div className="exp-contador">
                <button type="button" aria-label="Menos um dia" onClick={() => setDiasManual((n) => Math.max(1, n - 1))}>
                  <Minus size={18} aria-hidden="true" />
                </button>
                <span aria-live="polite">{diasManual}</span>
                <button type="button" aria-label="Mais um dia" onClick={() => setDiasManual((n) => Math.min(14, n + 1))}>
                  <Plus size={18} aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          <div className="exp-grupo">
            <span className="exp-rotulo">
              Estilo <small>· escolha quantos quiser</small>
            </span>
            <div className="exp-chips-opcoes">
              {ESTILOS.map((e) => {
                const on = estilos.includes(e.id)
                return (
                  <button key={e.id} type="button" className={botaoOpcao(on)} aria-pressed={on} onClick={() => setEstilos(on ? estilos.filter((x) => x !== e.id) : [...estilos, e.id])}>
                    {e.nome}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="exp-grupo">
            <span className="exp-rotulo">Ritmo</span>
            <div className="exp-grade3">
              {RITMOS.map((r) => (
                <button key={r.id} type="button" className={botaoOpcao(ritmo === r.id)} aria-pressed={ritmo === r.id} onClick={() => setRitmo(r.id)}>
                  <strong>{r.nome}</strong>
                  <small>{r.porDia} por dia</small>
                </button>
              ))}
            </div>
          </div>

          <div className="exp-grupo">
            <span className="exp-rotulo">Quanto quer gastar com passeios?</span>
            <div className="exp-grade3">
              {ORCAMENTOS.map((o) => (
                <button key={o.id} type="button" className={botaoOpcao(orcamento === o.id)} aria-pressed={orcamento === o.id} onClick={() => setOrcamento(o.id)}>
                  {o.nome}
                </button>
              ))}
            </div>
          </div>

          <button type="button" className="botao exp-principal" onClick={() => void comecar()}>
            Ver os lugares
          </button>
        </section>
        <p className="exp-fonte">Dados: Wikidata, Wikipédia e © OpenStreetMap</p>
      </div>
    )
  }

  if (etapa === 'deck') {
    const total = deslize.pilha.length
    return (
      <div className="exp">
        {cabecalho}
        <div className="exp-mesa">
          <section className="exp-deck-coluna" aria-label="Lugares pra escolher">
            <div className="exp-progresso">
              <span>{Math.min(deslize.posicao + 1, total)} de {total}</span>
              <div className="exp-barra">
                <div style={{ width: `${total ? Math.round((deslize.posicao / total) * 100) : 0}%` }} />
              </div>
              <button type="button" className="botao-texto" onClick={() => setEtapa('estilo')}>
                Ajustar
              </button>
              <button type="button" className="botao-texto" onClick={() => void abrirRoteiro(true)}>
                Pronto
              </button>
            </div>
            {/* Spec 115: quem acabou de entrar pelo convite */}
            {params.get('bemvindo') && (
              <p className="exp-boas-vindas">
                Você entrou em <strong>{viagem.nome}</strong>! Deslize o que quer fazer em {destino.nome}: o roteiro sai das escolhas de todo mundo.
              </p>
            )}

            {total === 0 ? (
              <div className="exp-vazio">
                <p>Achamos poucos lugares em {destino.nome} ainda.</p>
                <Link to="../lugares" className="botao secundario">
                  Adicionar um lugar
                </Link>
              </div>
            ) : (
              <div className="exp-pilha">
                {proximo && <Cartao key={`b-${proximo.id}`} lugar={proximo} parado />}
                {atual && <Cartao key={atual.id} lugar={atual} voando={voando} aoDecidir={escolher} aoVerMais={() => setDetalhe(true)} />}
              </div>
            )}

            {aviso && (
              <p className="exp-aviso" role="status">
                {aviso}
              </p>
            )}

            {total > 0 && (
              <div className="exp-acoes">
                <div>
                  <button type="button" className="exp-botao pequeno" aria-label="Desfazer" onClick={voltarUm} disabled={!deslize.historico.length}>
                    <Undo2 size={18} aria-hidden="true" />
                  </button>
                  <span>Desfazer</span>
                </div>
                <div>
                  <button type="button" className="exp-botao" aria-label="Passo" onClick={() => escolher('passo')}>
                    <X size={26} aria-hidden="true" className="exp-cor-passo" />
                  </button>
                  <span>Passo</span>
                </div>
                <div>
                  <button
                    type="button"
                    className="exp-botao medio"
                    aria-label="Não abro mão"
                    onClick={() => escolher('nao_abro_mao')}
                    disabled={!podeNaoAbrirMao(deslize, jaTenho)}
                    title={podeNaoAbrirMao(deslize, jaTenho) ? undefined : 'Você já tem 3. Tire um pra marcar outro.'}
                  >
                    <Star size={22} aria-hidden="true" className="exp-cor-estrela" />
                  </button>
                  <span>Não abro mão</span>
                </div>
                <div>
                  <button type="button" className="exp-botao principal" aria-label="Quero" onClick={() => escolher('quero')}>
                    <Heart size={26} aria-hidden="true" fill="currentColor" />
                  </button>
                  <span>Quero</span>
                </div>
              </div>
            )}
            <p className="exp-atalhos" aria-hidden="true">
              <kbd>←</kbd> passo <kbd>↑</kbd> não abro mão <kbd>→</kbd> quero <kbd>Z</kbd> desfazer <kbd>Espaço</kbd> ver mais
            </p>
          </section>

          <aside className="exp-lado cartao-ui" aria-label="Sua lista">
            <h2>Sua lista</h2>
            <p className="exp-dica">
              {escolhidos.length} {escolhidos.length === 1 ? 'escolhido' : 'escolhidos'} · {contagem.passo} passou
            </p>
            <ul className="exp-lista">
              {escolhidos.map(({ lugar, estrela }) => (
                <li key={lugar.id}>
                  {lugar.fotoUrl ? <img src={lugar.fotoUrl} alt="" /> : <span className="exp-mini-sem-foto" />}
                  <span>
                    <strong>{lugar.nome}</strong>
                    <small>{tempoLegivel(lugar.tempoMin)}</small>
                  </span>
                  {estrela && <span className="exp-selinho">Não abro mão</span>}
                </li>
              ))}
            </ul>
            {escolhidos.length === 0 && <p className="exp-dica tracejado">O que você curtir aparece aqui</p>}
            <button type="button" className="botao" onClick={() => void abrirRoteiro(true)} disabled={escolhidos.length === 0}>
              Ver o roteiro
            </button>
          </aside>
        </div>

        {detalhe && atual && (
          <Gaveta titulo={atual.nome} aoFechar={() => setDetalhe(false)}>
            <div className="exp-detalhe">
              {atual.fotoUrl && <img src={atual.fotoUrl} alt={atual.nome} />}
              {atual.bairro && <p className="exp-bairro">{atual.bairro}</p>}
              <p>{atual.sobre ?? atual.porQue ?? 'Sem descrição ainda.'}</p>
              <div className="exp-grade3 exp-fatos">
                <div>
                  <small>Quanto tempo</small>
                  <strong>{tempoLegivel(atual.tempoMin)}</strong>
                </div>
                <div>
                  <small>Preço</small>
                  <strong>{precoLegivel(atual.gratis)}</strong>
                </div>
                <div>
                  <small>Melhor hora</small>
                  <strong>{atual.melhorHora ?? '—'}</strong>
                </div>
              </div>
              <p className="exp-fonte">
                {atual.fotoUrl && (
                  <>
                    {atual.fotoPagina ? (
                      <a href={atual.fotoPagina} target="_blank" rel="noreferrer">
                        {creditoDaFoto(atual.fotoAutor, atual.fotoLicenca)}
                      </a>
                    ) : (
                      creditoDaFoto(atual.fotoAutor, atual.fotoLicenca)
                    )}
                    {' · '}
                  </>
                )}
                {atual.linkWikipedia ? (
                  <a href={atual.linkWikipedia} target="_blank" rel="noreferrer">
                    Wikipédia
                  </a>
                ) : (
                  'Wikidata'
                )}{' '}
                · horários e preços: confira no site oficial
              </p>
              <div className="form-rodape">
                <button type="button" className="botao secundario" onClick={() => escolher('passo')}>
                  Passo
                </button>
                <button type="button" className="botao" onClick={() => escolher('quero')}>
                  Quero ir
                </button>
              </div>
            </div>
          </Gaveta>
        )}
      </div>
    )
  }

  // ---------- Roteiro ----------
  const indice = destinos.findIndex((d) => d.id === destino.id)
  return (
    <div className="exp">
      {cabecalho}
      <RoteiroDoDestino
        destino={destino}
        rotulos={dias.map((d, k) => (temDatas ? diaPorExtenso(d) : `Dia ${k + 1}`))}
        lugares={lugaresDoGrupo}
        salvo={diasSalvos}
        aoMudar={mudarRoteiro}
        aoReorganizar={() => mudarRoteiro(propor(lugaresDoGrupo))}
        aoVerMais={() => void comecar()}
        proximoDestino={destinos[indice + 1] ?? null}
        aoIrPara={(id) => setParams({ destino: id })}
      />
      {aviso && (
        <p className="exp-aviso" role="status">
          {aviso}
        </p>
      )}
    </div>
  )
}

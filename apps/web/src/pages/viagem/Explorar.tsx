import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ChevronLeft, Heart, Minus, Plus, Star, Undo2, X } from 'lucide-react'
import {
  ESTILOS,
  ORCAMENTOS,
  RITMOS,
  acabou,
  comecarDeslize,
  contarEscolhas,
  creditoDaFoto,
  criarEventoDaAgenda,
  decidir,
  desfazer,
  diasDoPeriodo,
  montarDiasPelosVotos,
  montarPilha,
  podeNaoAbrirMao,
  porDiaDoRitmo,
  precoLegivel,
  regiaoEspalhada,
  tamanhoDaPilha,
  tempoLegivel,
  trecho,
  type DiaProposto,
  type Escolha,
  type EstadoDoDeslize,
  type EstiloId,
  type LugarDoCatalogo,
  type OrcamentoId,
  type RitmoId,
  type Tables,
} from '@together/core'
import { useViagemAtual } from '../../features/viagens/hooks'
import { supabase } from '../../lib/supabase'
import { buscarLugares } from '../../features/lugares/api'
import { avisarQueMudou } from '../../features/tempo-real/avisos'
import { diaPorExtenso } from '../../features/agenda/hooks'
import * as api from '../../features/explorar/api'
import Cartao from '../../features/explorar/Cartao'
import Gaveta from '../../components/ui/Gaveta'
import '../../features/explorar/explorar.css'

// Explorar (spec 114): escolher o estilo, deslizar os lugares e montar o roteiro do destino.
type Etapa = 'estilo' | 'carregando' | 'deck' | 'resumo' | 'montando' | 'roteiro' | 'erro'
type Ponto = { latitude: number; longitude: number }
type Roteiro = { dias: DiaProposto[]; sobraram: string[]; pontos: Record<string, Ponto | null>; prioridades: Set<string>; espalhada: boolean }

const PASSOS_MONTANDO = ['Juntando o que fica perto', 'Respeitando seus "não abro mão"', 'Encaixando por dia, sem correria']

export default function Explorar() {
  const { destinos } = useViagemAtual()
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
  const { viagem, destinos, meuId, euSouAdm } = useViagemAtual()
  const [params, setParams] = useSearchParams()

  const [etapa, setEtapa] = useState<Etapa>('estilo')
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
  const [passoMontando, setPassoMontando] = useState(0)
  const [roteiro, setRoteiro] = useState<Roteiro | null>(null)
  const [diaAberto, setDiaAberto] = useState(0)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  // Spec 115, etapa 6: quantos do comboio já escolheram (as escolhas de cada um continuam privadas)
  const [grupo, setGrupo] = useState<{ escolheram: number; pessoas: number } | null>(null)
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
  const restantes = catalogo.filter((l) => !deslize.escolhas[l.id] && !deslize.pilha.slice(deslize.posicao).includes(l.id)).length

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
        tamanho: tamanhoDaPilha(dias.length, porDia),
        jaNaViagem: (naViagem.data ?? []).filter((l) => !cat.lugares.some((c) => c.wikidata && c.wikidata === l.wikidata && antigas[c.id])),
        jaEscolhidos: Object.keys(antigas),
      })
      setCatalogo(cat.lugares)
      setDeslize(comecarDeslize(pilha.map((l) => l.id), antigas))
      setEtapa(pilha.length === 0 && Object.keys(antigas).length > 0 ? 'resumo' : 'deck')
    } catch (e) {
      console.error('Erro ao carregar o Explorar:', e)
      setErro(e instanceof Error ? e.message : 'Não deu pra carregar agora.')
      setEtapa('erro')
    }
  }

  function maisLugares() {
    const extra = montarPilha(catalogo, { estilos, orcamento, tamanho: 15, jaEscolhidos: [...Object.keys(deslize.escolhas), ...deslize.pilha] })
    setDeslize((d) => ({ ...d, pilha: [...d.pilha, ...extra.map((l) => l.id)] }))
    setEtapa('deck')
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
      setDeslize((d) => {
        const novo = decidir(d, escolha, jaTenho)
        if (acabou(novo)) setEtapa('resumo')
        return novo
      })
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

  // Ao chegar no resumo, minhas escolhas viram lugares da viagem (contam pro grupo) e vemos quem já escolheu
  useEffect(() => {
    if (etapa !== 'resumo') return
    let vivo = true
    ;(async () => {
      try {
        if (escolhidos.length > 0) {
          await api.criarLugaresDoExplorar(destino.id)
          avisarQueMudou('lugares')
        }
        const g = await api.quemEscolheu(destino.id)
        if (vivo) setGrupo(g)
      } catch (e) {
        console.error('Erro ao juntar com o grupo:', e)
      }
    })()
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etapa, destino.id])
  // Tem escolha de mais alguém além de mim? Então o roteiro é do grupo
  const deTodos = (grupo?.escolheram ?? 0) > (escolhidos.length > 0 ? 1 : 0)

  // ---------- Montar ----------
  async function montar() {
    setEtapa('montando')
    setPassoMontando(0)
    setSalvo(false)
    PASSOS_MONTANDO.forEach((_, i) => depois(500 * (i + 1), () => setPassoMontando(i + 1)))
    const minimo = new Promise((r) => setTimeout(r, 1800))
    try {
      const ids = new Set(await api.criarLugaresDoExplorar(destino.id))
      avisarQueMudou('lugares')
      // Roteiro do grupo: entra o que eu escolhi e o que alguém do comboio curtiu ou marcou como "não abro mão"
      const lugares = (await buscarLugares(viagem.id)).filter(
        (l) => ids.has(l.id) || (l.destinoId === destino.id && (l.votos.length > 0 || (l.prioridades?.length ?? 0) > 0)),
      )
      const proposta = montarDiasPelosVotos(
        dias,
        lugares.map((l) => ({ id: l.id, nome: l.nome, tipo: l.tipo, votos: l.votos.length, prioridades: l.prioridades?.length ?? 0, latitude: l.latitude, longitude: l.longitude, endereco: l.endereco })),
        porDia,
      )
      const pontos = Object.fromEntries(lugares.map((l) => [l.id, l.latitude != null && l.longitude != null ? { latitude: l.latitude, longitude: l.longitude } : null]))
      const comPonto = Object.values(pontos).filter((p): p is Ponto => !!p)
      await minimo
      setRoteiro({
        ...proposta,
        pontos,
        prioridades: new Set(lugares.filter((l) => (l.prioridades ?? []).includes(meuId)).map((l) => l.id)),
        espalhada: regiaoEspalhada(comPonto),
      })
      setDiaAberto(0)
      setEtapa('roteiro')
    } catch (e) {
      console.error('Erro ao montar:', e)
      setErro('Não deu pra montar o roteiro agora. Suas escolhas estão salvas: tente de novo.')
      setEtapa('erro')
    }
  }

  async function porNaAgenda() {
    if (!roteiro || !temDatas) return
    setSalvando(true)
    try {
      for (const d of roteiro.dias)
        for (const i of d.itens)
          await criarEventoDaAgenda(supabase, viagem.id, { dia: d.dia, hora: i.hora || null, titulo: i.nome, local: i.local, observacao: 'Montado pelo Explorar' })
      avisarQueMudou('eventos_agenda')
      setSalvo(true)
    } catch (e) {
      console.error('Erro ao pôr na agenda:', e)
      setAviso('Não deu pra pôr tudo na agenda. Confira na Agenda o que entrou.')
    }
    setSalvando(false)
  }

  const botaoOpcao = (on: boolean) => (on ? 'exp-opcao ativa' : 'exp-opcao')

  // ---------- Telas ----------
  const cabecalho = (
    <header className="exp-topo">
      <Link to=".." className="exp-voltar" aria-label="Voltar pra viagem">
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

  if (etapa === 'estilo' || etapa === 'carregando' || etapa === 'erro') {
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

          {etapa === 'erro' && (
            <p className="form-erro" role="alert">
              {erro}
            </p>
          )}
          {etapa === 'carregando' ? (
            <div className="exp-carregando" role="status">
              <span className="exp-pontinhos" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              {preparando ? `Preparando os lugares de ${destino.nome}… (pode levar uns 30 segundos, só na primeira vez)` : 'Carregando os lugares…'}
            </div>
          ) : (
            <button type="button" className="botao exp-principal" onClick={comecar}>
              {etapa === 'erro' ? 'Tentar de novo' : 'Ver os lugares'}
            </button>
          )}
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
              <button type="button" className="botao-texto" onClick={() => setEtapa('resumo')}>
                Pronto
              </button>
            </div>

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
            <button type="button" className="botao" onClick={() => setEtapa('resumo')} disabled={escolhidos.length === 0}>
              Montar roteiro com {escolhidos.length} {escolhidos.length === 1 ? 'lugar' : 'lugares'}
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

  if (etapa === 'resumo') {
    return (
      <div className="exp">
        {cabecalho}
        <section className="exp-resumo" aria-label="Resumo das escolhas">
          <h2 className="exp-titulo">{escolhidos.length ? `Você escolheu ${escolhidos.length} ${escolhidos.length === 1 ? 'lugar' : 'lugares'}` : 'Nenhum lugar escolhido ainda'}</h2>
          <div className="exp-grade3 exp-numeros">
            <div>
              <strong className="exp-cor-quero">{contagem.quero}</strong>
              <small>Quero</small>
            </div>
            <div>
              <strong className="exp-cor-estrela">{contagem.naoAbroMao}</strong>
              <small>Não abro mão</small>
            </div>
            <div>
              <strong>{contagem.passo}</strong>
              <small>Passei</small>
            </div>
          </div>
          <ul className="exp-lista grande">
            {escolhidos.map(({ lugar, estrela }) => (
              <li key={lugar.id}>
                {lugar.fotoUrl ? <img src={lugar.fotoUrl} alt="" /> : <span className="exp-mini-sem-foto" />}
                <span>
                  <strong>{lugar.nome}</strong>
                  <small>{[lugar.bairro, tempoLegivel(lugar.tempoMin)].filter(Boolean).join(' · ')}</small>
                </span>
                {estrela && <span className="exp-selinho">Não abro mão</span>}
              </li>
            ))}
          </ul>
          {grupo && grupo.pessoas > 1 && (
            <p className="exp-quem-escolheu" role="status">
              <strong>
                {grupo.escolheram} de {grupo.pessoas}
              </strong>{' '}
              já escolheram em {destino.nome}.
              {grupo.escolheram < grupo.pessoas && (
                <>
                  {' '}
                  <Link to="../comboio">Lembrar quem falta</Link>
                </>
              )}
            </p>
          )}
          <div className="exp-rodape">
            <button type="button" className="botao exp-principal" onClick={montar} disabled={escolhidos.length === 0 && !deTodos}>
              {deTodos ? 'Montar com as escolhas de todos' : `Montar roteiro de ${dias.length} ${dias.length === 1 ? 'dia' : 'dias'}`}
            </button>
            {!acabou(deslize) ? (
              <button type="button" className="botao-texto" onClick={() => setEtapa('deck')}>
                Continuar vendo os lugares
              </button>
            ) : restantes > 0 ? (
              <button type="button" className="botao-texto" onClick={maisLugares}>
                Ver mais {Math.min(15, restantes)} lugares
              </button>
            ) : null}
          </div>
        </section>
      </div>
    )
  }

  if (etapa === 'montando') {
    return (
      <div className="exp">
        <section className="exp-montando" role="status" aria-live="polite">
          <span className="exp-pontinhos" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <h2 className="exp-titulo">
            Montando seus {dias.length} {dias.length === 1 ? 'dia' : 'dias'} em {destino.nome}
          </h2>
          <ul>
            {PASSOS_MONTANDO.map((p, i) => (
              <li key={p} className={passoMontando > i ? 'feito' : undefined}>
                {p}
              </li>
            ))}
          </ul>
        </section>
      </div>
    )
  }

  // ---------- Roteiro ----------
  const dia = roteiro?.dias[diaAberto]
  const pontosDoDia = (dia?.itens ?? []).map((i) => roteiro?.pontos[i.lugarId]).filter((p): p is Ponto => !!p)
  const todos = Object.values(roteiro?.pontos ?? {}).filter((p): p is Ponto => !!p)
  const caixa = todos.length
    ? {
        n: Math.max(...todos.map((p) => p.latitude)),
        s: Math.min(...todos.map((p) => p.latitude)),
        l: Math.max(...todos.map((p) => p.longitude)),
        o: Math.min(...todos.map((p) => p.longitude)),
      }
    : null
  const noMapa = (p: Ponto) => {
    if (!caixa) return { x: 50, y: 50 }
    const w = Math.max(caixa.l - caixa.o, 0.002)
    const h = Math.max(caixa.n - caixa.s, 0.002)
    return { x: 6 + ((p.longitude - caixa.o) / w) * 88, y: 8 + ((caixa.n - p.latitude) / h) * 84 }
  }
  const idsDoDia = new Set((dia?.itens ?? []).map((i) => i.lugarId))

  return (
    <div className="exp">
      {cabecalho}
      <section className="exp-roteiro" aria-label="Roteiro proposto">
        <div className="exp-roteiro-topo">
          <h2 className="exp-titulo">
            {destino.nome} em {dias.length} {dias.length === 1 ? 'dia' : 'dias'}
          </h2>
          <button type="button" className="botao secundario pequeno" onClick={() => setEtapa('resumo')}>
            Refazer
          </button>
        </div>

        {roteiro && roteiro.dias.length > 0 ? (
          <>
            <div className="exp-dias" role="tablist" aria-label="Dias">
              {roteiro.dias.map((d, i) => (
                <button key={d.dia} type="button" role="tab" aria-selected={i === diaAberto} className={botaoOpcao(i === diaAberto)} onClick={() => setDiaAberto(i)}>
                  <strong>Dia {dias.indexOf(d.dia) + 1}</strong>
                  <small>
                    {d.itens.length} {d.itens.length === 1 ? 'lugar' : 'lugares'}
                  </small>
                </button>
              ))}
            </div>

            {caixa && (
              <svg className="exp-mapa" viewBox="0 0 100 60" preserveAspectRatio="none" role="img" aria-label={`Mapa do dia: ${dia?.itens.map((i) => i.nome).join(', ')}`}>
                <polyline
                  points={pontosDoDia.map((p) => `${noMapa(p).x},${noMapa(p).y * 0.6}`).join(' ')}
                  fill="none"
                  stroke="var(--couro)"
                  strokeWidth="0.6"
                  strokeDasharray="1.5 1.5"
                  vectorEffect="non-scaling-stroke"
                />
                {Object.entries(roteiro.pontos).map(([id, p]) =>
                  p ? <circle key={id} cx={noMapa(p).x} cy={noMapa(p).y * 0.6} r={idsDoDia.has(id) ? 1.8 : 1.1} className={idsDoDia.has(id) ? 'no-dia' : undefined} /> : null,
                )}
              </svg>
            )}

            {dia && (
              <ol className="exp-itens">
                <li className="exp-dia-nome">{temDatas ? diaPorExtenso(dia.dia) : dia.dia}</li>
                {dia.itens.map((it, k) => {
                  const antes = k > 0 ? roteiro.pontos[dia.itens[k - 1].lugarId] : null
                  const aqui = roteiro.pontos[it.lugarId]
                  return (
                    <li key={it.lugarId}>
                      {antes && aqui && <span className="exp-trecho">{trecho(antes, aqui)}</span>}
                      <div className="exp-item">
                        <span className="exp-hora">{it.hora || '—'}</span>
                        <strong>{it.nome}</strong>
                        {roteiro.prioridades.has(it.lugarId) && (
                          <Star size={16} aria-label="Não abro mão" className="exp-cor-estrela" fill="currentColor" />
                        )}
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
            {roteiro.dias.length < dias.length && <p className="exp-dica tracejado">Sobrou {dias.length - roteiro.dias.length === 1 ? 'um dia livre' : `${dias.length - roteiro.dias.length} dias livres`}. Quer ver mais lugares?</p>}
            {roteiro.sobraram.length > 0 && <p className="exp-dica">Ficaram de fora por falta de dia: {roteiro.sobraram.join(', ')}.</p>}
            {roteiro.espalhada && <p className="exp-aviso">Região grande: vale dormir em 2 lugares diferentes.</p>}
          </>
        ) : (
          <p className="hosp-vazio">Nada pra montar ainda. Volte e escolha alguns lugares.</p>
        )}

        {aviso && (
          <p className="exp-aviso" role="status">
            {aviso}
          </p>
        )}
        <div className="exp-rodape">
          {salvo ? (
            <Link to="../agenda" className="botao exp-principal">
              Salvo na agenda · abrir a Agenda
            </Link>
          ) : temDatas && !euSouAdm ? (
            <p className="exp-dica">Quem organiza a viagem (ADM) põe o roteiro na agenda. Os lugares já estão na aba Lugares pra todo mundo ver.</p>
          ) : temDatas ? (
            <button type="button" className="botao exp-principal" onClick={porNaAgenda} disabled={salvando || !roteiro?.dias.length}>
              {salvando ? 'Pondo na agenda…' : 'Pôr na agenda da viagem'}
            </button>
          ) : (
            <p className="exp-dica">
              Os lugares já estão na aba Lugares. Pra pôr na agenda, defina as datas de {destino.nome} no <Link to="..">Roteiro</Link>.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}

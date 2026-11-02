import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { dividirDias, ordemMaisPerto } from '@together/core'
import { useSessao } from '../features/auth/hooks'
import { CriarContaDoConvidado } from '../features/auth/FaixaConvidado'
import MapaMundi from '../features/mapa/MapaMundi'
import { MarcaSobreOMapa } from '../components/ui/SobreOMapa'
import { moedaDoPais, type Cidade } from '../features/destinos/buscarCidades'
import { useBuscaDeLugares } from '../features/destinos/useBuscaDeLugares'
import { mover } from '../features/destinos/ordem'
import { criarViagem, trazerComboio } from '../features/viagens/api'
import { criarConvite } from '../features/comboio/api'
import './nova-viagem.css'

// Spec 115: o jeito rápido pede só "pra onde" e "quantos dias", chama a galera e cai no Explorar.
// O jeito completo (datas, nome e moeda) fica pra quem já tem tudo planejado ou ainda está sonhando.
type Passo = 'destinos' | 'dias' | 'datas' | 'nome' | 'comboio'
type Modo = 'rapido' | 'completo'
const PASSOS: Record<Modo, Passo[]> = {
  rapido: ['destinos', 'dias', 'comboio'],
  completo: ['destinos', 'datas', 'nome', 'comboio'],
}

const MOEDAS = [
  ['EUR', 'Euro (€)'],
  ['USD', 'Dólar americano (US$)'],
  ['GBP', 'Libra (£)'],
  ['CHF', 'Franco suíço (CHF)'],
  ['BRL', 'Real (R$)'],
  ['ARS', 'Peso argentino'],
  ['JPY', 'Iene (¥)'],
] as const

function nomeSugerido(destinos: Cidade[]) {
  const nomes = destinos.map((d) => d.nome)
  if (nomes.length === 0) return 'Próxima viagem' // spec 046: modo sonhando, ainda sem destino
  if (nomes.length === 1) return `Viagem pra ${nomes[0]}`
  if (nomes.length <= 3) return `${nomes.slice(0, -1).join(', ')} e ${nomes.at(-1)}`
  return `${nomes[0]}, ${nomes[1]} e mais ${nomes.length - 2}`
}

function diasEntre(inicio: string, fim: string) {
  const dias = Math.round((new Date(fim).getTime() - new Date(inicio).getTime()) / 86_400_000) + 1
  return dias > 0 ? dias : null
}

// Telinha usada pra saber se é celular (o painel muda de lugar)
function useEhCelular() {
  const consulta = '(max-width: 899px)'
  const [celular, setCelular] = useState(() => window.matchMedia(consulta).matches)
  useEffect(() => {
    const mq = window.matchMedia(consulta)
    const mudou = () => setCelular(mq.matches)
    mq.addEventListener('change', mudou)
    return () => mq.removeEventListener('change', mudou)
  }, [])
  return celular
}

// Onboarding: cria a viagem com o mapa ao fundo (jeito rápido da spec 115 ou o completo de antes).
// Convidado (spec 018) cria conta antes de criar viagem: o banco também recusa
export default function NovaViagem() {
  const { ehConvidado, carregando } = useSessao()
  if (carregando) return null
  if (ehConvidado) {
    return (
      <main className="pagina" style={{ maxWidth: 440, paddingTop: 96 }}>
        <h1 style={{ marginTop: 0 }}>Crie sua conta primeiro</h1>
        <p style={{ color: 'var(--cor-texto-suave)' }}>Pra criar uma viagem sua, transforme o acesso de convidado numa conta. Nada do que você já fez se perde.</p>
        <div className="cartao">
          <CriarContaDoConvidado />
        </div>
      </main>
    )
  }
  return <CriarViagem />
}

function CriarViagem() {
  const navegar = useNavigate()
  const celular = useEhCelular()
  const [passo, setPasso] = useState<Passo>('destinos')
  const [modo, setModo] = useState<Modo>('rapido')
  // Jeito rápido: só o número de dias; as datas são opcionais
  const [diasDigitados, setDiasDigitados] = useState(5)
  const [comDatas, setComDatas] = useState(false)
  // Vários destinos (spec 115, etapa 7): dias de cada um. null = divisão sugerida pelo app
  const [diasDeCada, setDiasDeCada] = useState<number[] | null>(null)

  const [destinos, setDestinos] = useState<Cidade[]>([])
  const [busca, setBusca] = useState('')

  const [ida, setIda] = useState('')
  const [volta, setVolta] = useState('')
  // Nome e moeda vêm sugeridos pelos destinos até a pessoa mexer (null = usar sugestão)
  const [nomeDigitado, setNomeDigitado] = useState<string | null>(null)
  const [moedaEscolhida, setMoedaEscolhida] = useState<string | null>(null)
  const nome = nomeDigitado ?? nomeSugerido(destinos)
  const moeda = moedaEscolhida ?? (destinos[0] ? moedaDoPais(destinos[0].codigoPais) : 'EUR')

  const [salvando, setSalvando] = useState(false)
  // Spec 055: "Nova viagem com este comboio" (vem de /nova-viagem?comboio=<viagem antiga>)
  const [busca_] = useSearchParams()
  const comboioDe = busca_.get('comboio')
  const [trazidos, setTrazidos] = useState<number | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [viagemId, setViagemId] = useState<string | null>(null)
  const [link, setLink] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  // Busca enquanto a pessoa digita (a lista anterior fica na tela até chegar a nova)
  const { sugestoes, buscando, valida: buscaValida, escolherComEnter } = useBuscaDeLugares(busca, (c) => adicionar(c))

  const pontos = useMemo(
    () => destinos.map((d) => ({ nome: d.nome, latitude: d.latitude, longitude: d.longitude })),
    [destinos],
  )

  const areaLivre = useMemo(
    () =>
      celular
        ? { esquerda: 0, topo: 60, direita: 0, baixo: window.innerHeight * 0.55 }
        : { esquerda: 520, topo: 40, direita: 40, baixo: 40 },
    [celular],
  )

  function adicionar(cidade: Cidade) {
    setDestinos((atuais) => (atuais.some((d) => d.id === cidade.id) ? atuais : [...atuais, cidade]))
    setBusca('')
  }

  function remover(id: string) {
    setDestinos(destinos.filter((d) => d.id !== id))
  }

  function moverDestino(indice: number, direcao: -1 | 1) {
    setDestinos(mover(destinos, indice, direcao))
  }

  async function criar() {
    setSalvando(true)
    setErro(null)
    try {
      const id = await criarViagem({
        nome: nome.trim() || nomeSugerido(destinos),
        dataInicio: ida || null,
        dataFim: volta || null,
        moeda,
        destinos,
        dias: modo === 'rapido' ? repartidos : undefined,
      })
      setViagemId(id)
      if (comboioDe) {
        // Se falhar, a viagem já existe: segue com o convite normal
        setTrazidos(await trazerComboio(id, comboioDe).catch(() => null))
      }
      setLink(await criarConvite(id))
      setPasso('comboio')
    } catch {
      setErro('Não deu pra criar a viagem. Tente de novo.')
    } finally {
      setSalvando(false)
    }
  }

  async function compartilhar() {
    if (!link) return
    if (navigator.share) {
      await navigator.share({ title: nome, text: `Bora planejar "${nome}" juntos?`, url: link }).catch(() => {})
      return
    }
    await navigator.clipboard.writeText(link)
    setCopiado(true)
  }

  const passos = PASSOS[modo]
  const indice = passos.indexOf(passo)
  const dias = ida && volta ? diasEntre(ida, volta) : null
  // Spec 115, etapa 7: país pesa mais que cidade na divisão dos dias; a pessoa pode ajustar cada um
  const totalDeDias = dias ?? diasDigitados
  const repartidos =
    diasDeCada && diasDeCada.length === destinos.length ? diasDeCada : dividirDias(totalDeDias, destinos.map((d) => (d.tipo === 'País' ? 2 : 1)))
  const somaDosDias = repartidos.reduce((s, x) => s + x, 0)
  const ordemSugerida = useMemo(() => ordemMaisPerto(destinos), [destinos])

  function mudarDiasDe(indice: number, delta: number) {
    const novo = repartidos.map((x, i) => (i === indice ? Math.min(30, Math.max(1, x + delta)) : x))
    setDiasDeCada(novo)
    if (!comDatas) setDiasDigitados(novo.reduce((s, x) => s + x, 0))
  }

  function jeitoCompleto() {
    setModo('completo')
    setPasso('datas')
  }

  return (
    <div className="onb">
      <MapaMundi pontos={pontos} areaLivre={areaLivre} />

      <MarcaSobreOMapa />

      <main className="onb-painel">
        <div className="onb-progresso" aria-label={`Passo ${indice + 1} de ${passos.length}`}>
          {passos.map((p, i) => (
            <span key={p} className={i <= indice ? 'feito' : undefined} />
          ))}
        </div>

        {passo === 'destinos' && (
          <section className="onb-passo">
            <div>
              <h1>Pra onde vocês querem ir?</h1>
              <p className="onb-sub">Uma cidade, várias ou um país. A gente ajuda a montar o roteiro.</p>
            </div>

            <div className="onb-busca">
              <label htmlFor="busca" className="onb-rotulo">
                Buscar cidade ou país
              </label>
              <input
                id="busca"
                type="search"
                autoComplete="off"
                autoFocus
                placeholder="Ex.: Milão, Portugal, Lago de Como"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    escolherComEnter()
                  }
                }}
                aria-controls="sugestoes"
              />
              {buscaValida && (sugestoes.length > 0 || buscando) && (
                <ul id="sugestoes" className="onb-sugestoes">
                  {buscando && sugestoes.length === 0 && <li className="onb-sugestao-vazia">Buscando…</li>}
                  {sugestoes.map((c) => (
                    <li key={c.id}>
                      <button type="button" onClick={() => adicionar(c)}>
                        <span className="onb-codigo">{c.codigoPais}</span>
                        <span>
                          <strong>{c.nome}</strong>
                          <small>{[c.tipo, [c.regiao, c.pais].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}</small>
                        </span>
                      </button>
                    </li>
                  ))}
                  {buscando && sugestoes.length > 0 && (
                    <li className="onb-sugestao-vazia onb-carregando" aria-live="polite">
                      Buscando mais lugares…
                    </li>
                  )}
                </ul>
              )}
            </div>

            {destinos.length >= 2 && <p className="onb-dica">Seu roteiro · Use ↑ e ↓ para mudar a ordem</p>}

            {destinos.length > 0 && (
              <ol className="onb-destinos">
                {destinos.map((d, i) => (
                  <li key={d.id}>
                    <span className="onb-numero">{i + 1}</span>
                    <span className="onb-destino-nome">
                      <strong>{d.nome}</strong>
                      <small>{[d.tipo, d.pais].filter(Boolean).join(' · ')}</small>
                    </span>
                    <span className="onb-acoes">
                      <button type="button" onClick={() => moverDestino(i, -1)} disabled={i === 0} aria-label={`Subir ${d.nome}`}>
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moverDestino(i, 1)}
                        disabled={i === destinos.length - 1}
                        aria-label={`Descer ${d.nome}`}
                      >
                        ↓
                      </button>
                      <button type="button" onClick={() => remover(d.id)} aria-label={`Remover ${d.nome}`}>
                        ×
                      </button>
                    </span>
                  </li>
                ))}
              </ol>
            )}

            {ordemSugerida && (
              <p className="onb-sugestao-ordem">
                Dica: indo {ordemSugerida.ordem.map((i) => destinos[i].nome).join(' → ')} vocês andam uns {ordemSugerida.economiaKm.toLocaleString('pt-BR')} km a
                menos.{' '}
                <button type="button" onClick={() => setDestinos(ordemSugerida.ordem.map((i) => destinos[i]))}>
                  Usar essa ordem
                </button>
              </p>
            )}

            <button
              type="button"
              className="onb-botao"
              disabled={destinos.length === 0}
              onClick={() => {
                setModo('rapido')
                setPasso('dias')
              }}
            >
              Continuar
            </button>
            <button type="button" className="onb-sonhando" onClick={jeitoCompleto}>
              {destinos.length === 0 ? 'Ainda não sei pra onde: começar sonhando' : 'Já tenho tudo planejado (datas, nome e moeda)'}
            </button>
          </section>
        )}

        {passo === 'dias' && (
          <section className="onb-passo">
            <div>
              <h1>Quantos dias?</h1>
              <p className="onb-sub">Mais ou menos já serve. Dá pra mudar depois.</p>
            </div>
            {comDatas ? (
              <div className="onb-datas">
                <div className="onb-campo">
                  <label htmlFor="ida" className="onb-rotulo">
                    Ida
                  </label>
                  <input id="ida" type="date" value={ida} onChange={(e) => setIda(e.target.value)} />
                </div>
                <div className="onb-campo">
                  <label htmlFor="volta" className="onb-rotulo">
                    Volta
                  </label>
                  <input id="volta" type="date" min={ida || undefined} value={volta} onChange={(e) => setVolta(e.target.value)} />
                </div>
              </div>
            ) : (
              <div className="onb-contador" role="group" aria-label="Dias de viagem">
                <button type="button" aria-label="Menos um dia" onClick={() => {
                    setDiasDigitados((n) => Math.max(1, n - 1))
                    setDiasDeCada(null)
                  }}>
                  −
                </button>
                <span>
                  <strong>{diasDigitados}</strong> {diasDigitados === 1 ? 'dia' : 'dias'}
                </span>
                <button type="button" aria-label="Mais um dia" onClick={() => {
                    setDiasDigitados((n) => Math.min(30, n + 1))
                    setDiasDeCada(null)
                  }}>
                  +
                </button>
              </div>
            )}
            {comDatas && dias && <p className="onb-destaque">{dias} dias de viagem</p>}
            <button
              type="button"
              className="onb-sonhando"
              onClick={() => {
                setComDatas(!comDatas)
                setIda('')
                setVolta('')
              }}
            >
              {comDatas ? 'Ainda não sei as datas' : 'Já sei as datas'}
            </button>
            {destinos.length >= 2 && (
              <div>
                <p className="onb-dica">Sugestão de dias em cada lugar</p>
                <ul className="onb-dias-de-cada">
                  {destinos.map((d, i) => (
                    <li key={d.id}>
                      <span>{d.nome}</span>
                      <button type="button" aria-label={`Menos um dia em ${d.nome}`} onClick={() => mudarDiasDe(i, -1)} disabled={repartidos[i] <= 1}>
                        −
                      </button>
                      <strong>
                        {repartidos[i]} {repartidos[i] === 1 ? 'dia' : 'dias'}
                      </strong>
                      <button type="button" aria-label={`Mais um dia em ${d.nome}`} onClick={() => mudarDiasDe(i, 1)}>
                        +
                      </button>
                    </li>
                  ))}
                </ul>
                {comDatas && dias && somaDosDias !== dias && (
                  <p className="onb-nota">
                    Somando dá {somaDosDias} {somaDosDias === 1 ? 'dia' : 'dias'}, e a viagem tem {dias}.
                  </p>
                )}
              </div>
            )}
            {erro && (
              <p role="alert" className="onb-erro">
                {erro}
              </p>
            )}
            <div className="onb-rodape">
              <button type="button" className="onb-voltar" onClick={() => setPasso('destinos')}>
                Voltar
              </button>
              <button type="button" className="onb-botao" onClick={criar} disabled={salvando || (comDatas && !dias)}>
                {salvando ? 'Criando…' : 'Continuar'}
              </button>
            </div>
          </section>
        )}

        {passo === 'datas' && (
          <section className="onb-passo">
            <div>
              <h1>Quando?</h1>
              <p className="onb-sub">Se ainda não tiver certeza, pode pular.</p>
            </div>
            <div className="onb-datas">
              <div className="onb-campo">
                <label htmlFor="ida" className="onb-rotulo">
                  Ida
                </label>
                <input id="ida" type="date" value={ida} onChange={(e) => setIda(e.target.value)} />
              </div>
              <div className="onb-campo">
                <label htmlFor="volta" className="onb-rotulo">
                  Volta
                </label>
                <input id="volta" type="date" min={ida || undefined} value={volta} onChange={(e) => setVolta(e.target.value)} />
              </div>
            </div>
            {dias && <p className="onb-destaque">{dias} dias de viagem</p>}
            <div className="onb-rodape">
              <button type="button" className="onb-voltar" onClick={() => setPasso('destinos')}>
                Voltar
              </button>
              <button type="button" className="onb-botao" onClick={() => setPasso('nome')}>
                {ida || volta ? 'Continuar' : 'Ainda não sei'}
              </button>
            </div>
          </section>
        )}

        {passo === 'nome' && (
          <section className="onb-passo">
            <div>
              <h1>Últimos detalhes</h1>
              <p className="onb-sub">Já deixamos sugerido. Mude se quiser.</p>
            </div>
            <div className="onb-campo">
              <label htmlFor="nome" className="onb-rotulo">
                Nome da viagem
              </label>
              <input
                id="nome"
                value={nome}
                onChange={(e) => setNomeDigitado(e.target.value)}
              />
            </div>
            <div className="onb-campo">
              <label htmlFor="moeda" className="onb-rotulo">
                Moeda principal dos gastos
              </label>
              <select id="moeda" value={moeda} onChange={(e) => setMoedaEscolhida(e.target.value)}>
                {MOEDAS.map(([codigo, rotulo]) => (
                  <option key={codigo} value={codigo}>
                    {rotulo}
                  </option>
                ))}
              </select>
            </div>
            {erro && (
              <p role="alert" className="onb-erro">
                {erro}
              </p>
            )}
            <div className="onb-rodape">
              <button type="button" className="onb-voltar" onClick={() => setPasso('datas')}>
                Voltar
              </button>
              <button type="button" className="onb-botao" onClick={criar} disabled={salvando}>
                {salvando ? 'Criando…' : 'Criar viagem'}
              </button>
            </div>
          </section>
        )}

        {passo === 'comboio' && modo === 'rapido' && (
          <section className="onb-passo">
            <div>
              <h1>Chame quem vai.</h1>
              {trazidos !== null && trazidos > 0 && (
                <p className="onb-destaque">
                  {trazidos} {trazidos === 1 ? 'pessoa do comboio já entrou' : 'pessoas do comboio já entraram'} nesta viagem.
                </p>
              )}
              <p className="onb-sub">
                Cada um escolhe o que quer fazer em {destinos[0]?.nome}, e o Tripwave monta o roteiro com as escolhas de todos.
              </p>
            </div>
            {link && (
              <div>
                <div className="onb-link">
                  <span>{link.replace(/^https?:\/\//, '')}</span>
                </div>
                <p className="onb-nota">Este link de convite vale por 7 dias.</p>
              </div>
            )}
            <button type="button" className="onb-voltar" onClick={compartilhar}>
              {copiado ? 'Link copiado!' : 'Mandar o convite'}
            </button>
            <button type="button" className="onb-botao" onClick={() => navegar(`/viagem/${viagemId}/explorar`)}>
              Começar a escolher em {destinos[0]?.nome}
            </button>
            <p className="onb-nota onb-nota-centro">Dá pra chamar a galera a qualquer momento.</p>
          </section>
        )}

        {passo === 'comboio' && modo === 'completo' && (
          <section className="onb-passo">
            <div>
              <h1>Essa viagem é de vocês.</h1>
              {trazidos !== null && trazidos > 0 && (
                <p className="onb-destaque">
                  {trazidos} {trazidos === 1 ? 'pessoa do comboio já entrou' : 'pessoas do comboio já entraram'} nesta viagem.
                </p>
              )}
              <p className="onb-sub">Convide quem vai viajar com você para participar da mesma viagem no Tripwave.</p>
              <p className="onb-sub">
                Compartilhem o roteiro, organizem os planos, acompanhem os gastos e guardem as memórias juntos. Cada pessoa
                poderá acessar a viagem pelo convite.
              </p>
            </div>
            {link && (
              <div>
                <div className="onb-link">
                  <span>{link.replace(/^https?:\/\//, '')}</span>
                </div>
                <p className="onb-nota">Este link de convite vale por 7 dias.</p>
              </div>
            )}
            <button type="button" className="onb-botao" onClick={compartilhar}>
              {copiado ? 'Link copiado!' : 'Compartilhar convite'}
            </button>
            <p className="onb-nota onb-nota-centro">
              Prefere fazer isso depois? Você pode convidar pessoas a qualquer momento.
            </p>
            <button type="button" className="onb-voltar onb-pular" onClick={() => navegar(`/viagem/${viagemId}`)}>
              Ir pra viagem
            </button>
          </section>
        )}
      </main>
    </div>
  )
}

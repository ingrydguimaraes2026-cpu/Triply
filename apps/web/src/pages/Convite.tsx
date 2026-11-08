import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router'
import {
  aceitarConvite,
  buscarDestinos,
  buscarEnquetes,
  buscarEventosDaAgenda,
  buscarOpcoesDeHospedagem,
  caminhoDoConvite,
  cidadesDoDia,
  dataDaArte,
  diasDaViagem,
  entrarComoConvidado,
  fonteDoNomeNoCarimbo,
  fraseDosVotos,
  hospedagensPraVotar,
  iconeDoTipo,
  lerDiasDoRoteiro,
  planoDoDia,
  rotuloDoDia,
  tipoDoLugar,
  verConvite,
  vitrineDoPassaporte,
  votarEnquete,
  votarNaHospedagem,
  votosQueFaltam,
  type Destino,
  type Enquete,
  type Opcao,
  type PreviaDoConvite,
} from '@together/core'
import { supabase } from '../lib/supabase'
import { useSessao } from '../features/auth/hooks'
import FaixaConvidado from '../features/auth/FaixaConvidado'
import { formatarPeriodo } from '../lib/datas'
import Norti from '../components/ui/Norti'
import Logo from '../components/ui/Logo'
import { Icone } from '../components/ui/Icone'
import '../features/carimbos/carimbos.css'
import './convite.css'
import './convite-leve.css'

// Web leve do convite (spec 018, FILA 0.8): /v/<código>.
// O convidado abre no navegador do WhatsApp, topa só com o nome, vota e vê o plano, sem instalar.
// Em todo estado mostra a vitrine do passaporte da galera.
type Estado = { tipo: 'carregando' } | { tipo: 'invalido' } | { tipo: 'previa'; previa: PreviaDoConvite }

export default function Convite() {
  const { codigo = '' } = useParams()
  const navegar = useNavigate()
  const { sessao, carregando } = useSessao()
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' })
  const [nome, setNome] = useState('')
  const [entrando, setEntrando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(() => {
    verConvite(supabase, codigo)
      .then((previa) => setEstado(previa ? { tipo: 'previa', previa } : { tipo: 'invalido' }))
      .catch(() => setEstado({ tipo: 'invalido' }))
  }, [codigo])

  useEffect(() => {
    if (!codigo || carregando) return
    carregar()
  }, [codigo, carregando, carregar])

  async function toparViagem(evento: FormEvent) {
    evento.preventDefault()
    setErro(null)
    setEntrando(true)
    try {
      if (sessao) await aceitarConvite(supabase, codigo)
      else await entrarComoConvidado(supabase, codigo, nome.trim())
      carregar()
    } catch (e) {
      // "anonymous_provider_disabled": falta ligar o login anônimo no painel do Supabase
      const desligado = (e as { code?: string }).code === 'anonymous_provider_disabled'
      setErro(desligado ? 'Entrar sem conta está desligado agora. Toque em "Já tenho conta" pra entrar.' : 'Não deu pra entrar. Confira a internet e tente de novo.')
    } finally {
      setEntrando(false)
    }
  }

  if (estado.tipo === 'carregando') {
    return (
      <Pagina>
        <div className="leve-centro" aria-busy="true">
          <Norti humor="pensando" tamanho={88} />
          <p className="convite-suave">Abrindo o convite…</p>
        </div>
      </Pagina>
    )
  }

  if (estado.tipo === 'invalido') {
    return (
      <Pagina>
        <div className="leve-centro">
          <Norti humor="dormindo" tamanho={96} />
          <h1>Convite inválido</h1>
          <p className="convite-suave">Esse link expirou ou não existe. Peça um novo pra quem te convidou.</p>
          <Link to="/espera" className="botao">
            Conhecer a Norti
          </Link>
        </div>
      </Pagina>
    )
  }

  const { previa } = estado
  const dentro = previa.jaSouMembro
  const periodo = formatarPeriodo(previa.dataInicio, previa.dataFim)
  const quem = previa.membros.slice(0, 3).join(', ') + (previa.membros.length > 3 ? ` e mais ${previa.membros.length - 3}` : '')

  return (
    <Pagina>
      <header className="leve-capa">
        <p className="convite-rotulo">{dentro ? 'Você está dentro' : 'Bora? Te chamaram pra'}</p>
        <h1>{previa.nome}</h1>
        <ul className="convite-detalhes">
          {periodo && (
            <li>
              <Icone nome="datas" size={17} aria-hidden="true" /> {periodo}
            </li>
          )}
          {previa.destinos.length > 0 && (
            <li>
              <Icone nome="lugar" size={17} aria-hidden="true" /> {previa.destinos.join(' → ')}
            </li>
          )}
          {previa.membros.length > 0 && (
            <li>
              <Icone nome="comboio" size={17} aria-hidden="true" /> {quem} já {previa.membros.length === 1 ? 'topou' : 'toparam'}
            </li>
          )}
        </ul>
      </header>

      {dentro ? (
        <>
          <FaixaConvidado />
          <DentroDaViagem viagemId={previa.viagemId} meuId={sessao?.user.id ?? ''} previa={previa} />
        </>
      ) : (
        <form className="leve-cartao convite-form" onSubmit={toparViagem}>
          {!sessao && (
            <div className="convite-campo">
              <label htmlFor="convite-nome">Como te chamam?</label>
              <input
                id="convite-nome"
                required
                maxLength={40}
                autoComplete="given-name"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
              <small>Sem instalar nada, sem e-mail e sem senha. Dá pra criar sua conta depois, sem perder nada.</small>
            </div>
          )}
          {erro && (
            <p role="alert" className="convite-erro">
              {erro}
            </p>
          )}
          <button type="submit" className="botao leve-largo" disabled={entrando || (!sessao && !nome.trim())}>
            {entrando ? 'Entrando…' : 'Tô dentro'}
          </button>
          {!sessao && (
            <button
              type="button"
              className="convite-link"
              onClick={() => {
                sessionStorage.setItem('voltarPara', caminhoDoConvite(codigo))
                navegar('/login')
              }}
            >
              Já tenho conta
            </button>
          )}
        </form>
      )}

      <Vitrine previa={previa} />
    </Pagina>
  )
}

// Moldura simples (sem o mapa do site, pra abrir rápido no navegador do WhatsApp)
function Pagina({ children }: { children: React.ReactNode }) {
  return (
    <div className="leve">
      <Link to="/espera" className="leve-marca" aria-label="Conhecer a Norti">
        <Logo />
      </Link>
      <main className="leve-conteudo">{children}</main>
    </div>
  )
}

// ---------- Depois de topar: votos e plano ----------
type Dados = {
  destinos: Destino[]
  opcoes: Opcao[]
  enquetes: Enquete[]
  eventos: Awaited<ReturnType<typeof buscarEventosDaAgenda>>
  roteiros: { destino_id: string; dias: string[][] }[]
  lugares: { id: string; nome: string; endereco: string | null; latitude: number | null; longitude: number | null; visitado_em: string | null }[]
}

// Tudo que a página mostra depois de topar (a RLS deixa porque a pessoa já é do comboio)
async function buscarDadosDaViagem(viagemId: string): Promise<Dados> {
  const [destinos, opcoes, enquetes, eventos, r] = await Promise.all([
    buscarDestinos(supabase, viagemId),
    buscarOpcoesDeHospedagem(supabase, viagemId),
    buscarEnquetes(supabase, viagemId),
    buscarEventosDaAgenda(supabase, viagemId),
    supabase.from('roteiros').select('destino_id, dias').eq('viagem_id', viagemId),
  ])
  if (r.error) throw r.error
  const roteiros = (r.data ?? []).map((x) => ({ destino_id: x.destino_id, dias: lerDiasDoRoteiro(x.dias) }))
  const ids = [...new Set(roteiros.flatMap((x) => x.dias.flat()))]
  const l = ids.length ? await supabase.from('lugares').select('id, nome, endereco, latitude, longitude, visitado_em').in('id', ids) : null
  return { destinos, opcoes, enquetes, eventos, roteiros, lugares: l?.data ?? [] }
}

function DentroDaViagem({ viagemId, meuId, previa }: { viagemId: string; meuId: string; previa: PreviaDoConvite }) {
  const [dados, setDados] = useState<Dados | null>(null)
  const [falhou, setFalhou] = useState(false)
  const [votando, setVotando] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    buscarDadosDaViagem(viagemId)
      .then((d) => ativo && setDados(d))
      .catch((e) => {
        console.error('Erro ao carregar a viagem do convite:', e)
        if (ativo) setFalhou(true)
      })
    return () => {
      ativo = false
    }
  }, [viagemId])

  async function votar(chave: string, acao: () => Promise<void>) {
    setVotando(chave)
    try {
      await acao()
      setDados(await buscarDadosDaViagem(viagemId))
    } catch (e) {
      console.error('Erro ao votar:', e)
    } finally {
      setVotando(null)
    }
  }

  const casas = useMemo(() => (dados ? hospedagensPraVotar(dados.opcoes, dados.destinos, meuId) : []), [dados, meuId])
  const abertas = useMemo(() => (dados ? dados.enquetes.filter((e) => !e.fechada) : []), [dados])
  const dias = useMemo(() => {
    if (!dados) return []
    return diasDaViagem(previa.dataInicio, previa.dataFim).map((dia, i) => ({
      dia,
      rotulo: rotuloDoDia(dia, i),
      cidade: cidadesDoDia(dia, dados.destinos),
      itens: planoDoDia(dia, { destinos: dados.destinos, eventos: dados.eventos, roteiros: dados.roteiros, lugares: dados.lugares }),
    }))
  }, [dados, previa.dataInicio, previa.dataFim])

  if (falhou) return <p className="leve-cartao convite-erro">Não deu pra abrir a viagem. Confira a internet e recarregue a página.</p>
  if (!dados) return <p className="leve-cartao convite-suave">Buscando o plano…</p>

  const faltam = votosQueFaltam(casas, abertas, meuId)
  const temVotacao = casas.length > 0 || abertas.length > 0

  return (
    <>
      {temVotacao && (
        <section className="leve-cartao" aria-labelledby="leve-votos">
          <h2 id="leve-votos">
            <Icone nome="votar" size={20} aria-hidden="true" /> Votação
          </h2>
          <p className={faltam ? 'leve-falta' : 'convite-suave'}>{fraseDosVotos(faltam)}</p>

          {casas.map((c) => (
            <div key={c.destinoId ?? 'outras'} className="leve-grupo">
              <h3>Onde dormir em {c.destino}</h3>
              {c.escolhida ? (
                <p className="leve-escolhida">
                  <Icone nome="ok" size={16} aria-hidden="true" /> Decidido: {c.escolhida.nome}
                </p>
              ) : (
                <ul className="leve-opcoes">
                  {c.opcoes.map((o) => {
                    const meu = o.votos.includes(meuId)
                    return (
                      <li key={o.id} className={meu ? 'leve-opcao meu' : 'leve-opcao'}>
                        {o.fotoUrl && <img src={o.fotoUrl} alt="" loading="lazy" />}
                        <div className="leve-opcao-texto">
                          <strong>{o.nome}</strong>
                          <small>
                            {[precoDa(o), `${o.votos.length} ${o.votos.length === 1 ? 'voto' : 'votos'}`].filter(Boolean).join(' · ')}
                          </small>
                          {o.link && (
                            <a href={o.link} target="_blank" rel="noreferrer">
                              Ver anúncio <Icone nome="abrir-fora" size={13} aria-hidden="true" />
                            </a>
                          )}
                        </div>
                        <button
                          type="button"
                          className={meu ? 'botao compacto' : 'botao secundario compacto'}
                          aria-pressed={meu}
                          disabled={votando !== null}
                          onClick={() => void votar(o.id, () => votarNaHospedagem(supabase, o.id, meuId, !meu))}
                        >
                          {meu ? 'Votei' : 'Votar'}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          ))}

          {abertas.map((e) => (
            <div key={e.id} className="leve-grupo">
              <h3>{e.pergunta}</h3>
              {e.multipla && <small className="convite-suave">Pode marcar mais de uma.</small>}
              <ul className="leve-opcoes">
                {e.opcoes.map((o) => {
                  const meu = o.votos.includes(meuId)
                  return (
                    <li key={o.id} className={meu ? 'leve-opcao meu' : 'leve-opcao'}>
                      <div className="leve-opcao-texto">
                        <strong>{o.texto}</strong>
                        <small>
                          {o.votos.length} {o.votos.length === 1 ? 'voto' : 'votos'}
                        </small>
                      </div>
                      <button
                        type="button"
                        className={meu ? 'botao compacto' : 'botao secundario compacto'}
                        aria-pressed={meu}
                        disabled={votando !== null}
                        onClick={() => void votar(o.id, () => votarEnquete(supabase, o.id, !meu))}
                      >
                        {meu ? 'Votei' : 'Votar'}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </section>
      )}

      <section className="leve-cartao" aria-labelledby="leve-plano">
        <h2 id="leve-plano">
          <Icone nome="roteiro" size={20} aria-hidden="true" /> O plano
        </h2>
        {dias.length === 0 ? (
          <p className="convite-suave">As datas ainda não foram marcadas. Assim que o plano sair, ele aparece aqui.</p>
        ) : (
          <ol className="leve-dias">
            {dias.map((d) => (
              <li key={d.dia}>
                <p className="leve-dia">
                  <strong>{d.rotulo}</strong>
                  {d.cidade && <span>{d.cidade}</span>}
                </p>
                {d.itens.length > 0 ? (
                  <ul className="leve-itens">
                    {d.itens.map((item) => (
                      <li key={item.chave}>
                        {item.hora && <span className="leve-hora">{item.hora}</span>}
                        <span>{item.titulo}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <small className="convite-suave">Dia livre (por enquanto).</small>
                )}
              </li>
            ))}
          </ol>
        )}
        <Link to={`/viagem/${viagemId}`} className="convite-link leve-completa">
          Abrir a viagem completa
        </Link>
      </section>
    </>
  )
}

function precoDa(o: Opcao): string | null {
  if (o.precoTotal === null) return null
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: o.moeda, maximumFractionDigits: 0 }).format(o.precoTotal / 100)
  } catch {
    return null
  }
}

// ---------- Vitrine do passaporte (todo estado) ----------
function Vitrine({ previa }: { previa: PreviaDoConvite }) {
  const v = vitrineDoPassaporte(previa.passaporte)
  return (
    <section className="leve-cartao leve-vitrine" aria-labelledby="leve-passaporte">
      <h2 id="leve-passaporte">
        <Icone nome="mundo" size={20} aria-hidden="true" /> Passaporte da galera
      </h2>
      <p className="convite-suave">{v.frase}</p>
      {v.total > 0 && (
        <ul className="carimbos-lista">
          {v.lugares.map((l, i) => (
            <li key={`${l.nome}-${i}`}>
              <span
                className={`carimbo leve-carimbo ${l.data ? 'aceso' : 'apagado'}`}
                style={{ '--giro': `${i % 2 ? 5 : -6}deg` } as React.CSSProperties}
                aria-label={`${l.nome}: ${l.data ? 'carimbado' : 'ainda não carimbado'}`}
              >
                <span className="carimbo-arte">
                  <Icone nome={iconeDoTipo(l.data ? l.tipo : tipoDoLugar(l.nome))} size={22} aria-hidden="true" />
                  <strong style={{ fontSize: fonteDoNomeNoCarimbo(l.nome, 70, 12.8) }}>{l.nome}</strong>
                  {l.data && <small>{dataDaArte(l.data)}</small>}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="leve-app">
        <Norti humor="apontando" tamanho={56} />
        <p>
          <strong>Ganhe o seu carimbo.</strong> Com o app da Norti, cada lugar onde a galera chega vira carimbo sozinho, e no fim sai a retrospectiva pronta pra postar.
        </p>
      </div>
      <Link to="/espera" className="botao secundario leve-largo">
        Quero o app
      </Link>
    </section>
  )
}

// /convite/<código> (links mandados antes da 0.8) → /v/<código>
export function ConviteAntigo() {
  const { codigo } = useParams()
  return <Navigate to={caminhoDoConvite(codigo ?? '')} replace />
}

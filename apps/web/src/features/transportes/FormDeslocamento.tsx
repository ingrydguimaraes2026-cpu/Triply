import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeftRight, ChevronDown, ChevronLeft, ChevronRight, Plus, Trash2 } from '../../components/ui/icones'
import {
  acharLugar,
  buscarJeitosDeIr,
  buscarLugares,
  diaNoFuso,
  duracaoCurta,
  frequenciaEstimada,
  horaNoFuso,
  livreNoDia,
  naoDaTempo,
  textoDaFrequencia,
  textoDasTrocas,
  type JeitoDeIr,
  type Lugar,
  type MeioDoJeito,
  type Saida,
  type Tables,
} from '@together/core'
import { supabase } from '../../lib/supabase'
import { diaComSemana } from '../../lib/datas'
import { MEIOS, apagarTrajeto, meio as meioDe, salvarDeslocamento, virarOpcao, type Trajeto } from './api'

// Novo deslocamento (ou editar um), espelho do app (apps/mobile/app/novo-deslocamento.tsx, spec 122a/122c/122e).
// Dois passos: 1) de, para e dia → as opções aparecem sozinhas, por meio, com as saídas;
// 2) a escolhida vem preenchida: à vista só preço e "Já comprei"; o resto em "Mais detalhes".
// "Guardar como opção pra comparar" junta opções do mesmo deslocamento (grupo_opcoes).

type Ponto = { nome: string; latitude: number | null; longitude: number | null }
type Destino = Tables<'destinos'>

const MEIOS_DO_FORM = MEIOS.filter((m) => m.chave !== 'carona' && m.chave !== 'outro')
const SITUACOES = [
  { chave: 'sugestao', nome: 'Pra decidir' },
  { chave: 'decidido', nome: 'Decidido' },
  { chave: 'reservado', nome: 'Reservado' },
  { chave: 'comprado', nome: 'Comprado' },
]
const TROCAS = [
  { chave: 'null', nome: 'Não sei' },
  { chave: '0', nome: 'Direto' },
  { chave: '1', nome: '1 troca' },
  { chave: '2', nome: '2 trocas' },
  { chave: '3', nome: '3 ou mais' },
]
const NOME_DO_JEITO: Record<MeioDoJeito, string> = { trem: 'Trem', onibus: 'Ônibus', barco: 'Barco', metro: 'Metrô', carro: 'Carro', taxi: 'Táxi', a_pe: 'A pé' }
const MEIO_DO_JEITO: Record<MeioDoJeito, string> = { trem: 'trem', onibus: 'onibus', barco: 'barco', metro: 'metro', carro: 'carro', taxi: 'carro', a_pe: 'a_pe' }
const SIMBOLO: Record<string, string> = { EUR: '€', BRL: 'R$', USD: 'US$' }

function somarDias(dia: string, n: number) {
  const d = new Date(`${dia}T12:00:00`)
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
// "9", "930", "9:30", "09h30" → "09:30" (vazio se não entender)
function normalizarHora(texto: string) {
  const so = texto.replace(/\D/g, '')
  if (!so) return ''
  const h = so.length <= 2 ? Number(so) : Number(so.slice(0, so.length - 2))
  const m = so.length <= 2 ? 0 : Number(so.slice(-2))
  if (h > 23 || m > 59) return ''
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

type Props = {
  viagemId: string
  moeda: string
  destinos: Destino[]
  trajetos: Trajeto[] // todos, com as opções
  trajeto: Trajeto | null // editando
  grupo: string | null // "Outra opção" de um grupo
  diaInicial: string
  deInicial?: string
  paraInicial?: string
  podeDecidir: boolean // ADM ou liberado
  meuId: string
  aoSalvar: (grupoPraComparar: string | null) => void
  aoOutraOpcao: (grupo: string, dia: string, de: string, para: string) => void
  aoComparar: (grupo: string) => void
}

export default function FormDeslocamento({ viagemId, moeda, destinos, trajetos, trajeto, grupo, diaInicial, deInicial, paraInicial, podeDecidir, meuId, aoSalvar, aoOutraOpcao, aoComparar }: Props) {
  const nomeDoDestino = (id: string | null) => destinos.find((d) => d.id === id)?.nome ?? ''
  const [dia, setDia] = useState(trajeto?.partida ? diaNoFuso(trajeto.partida) : diaInicial)
  const [etapa, setEtapa] = useState<'buscar' | 'detalhes'>(trajeto ? 'detalhes' : 'buscar')
  const [maisDetalhes, setMaisDetalhes] = useState(false)
  const [escolhido, setEscolhido] = useState<string | null>(null)
  const [de, setDe] = useState<Ponto>({ nome: trajeto?.de_texto ?? (nomeDoDestino(trajeto?.origem_id ?? null) || deInicial || ''), latitude: trajeto?.de_lat ?? null, longitude: trajeto?.de_lon ?? null })
  const [para, setPara] = useState<Ponto>({ nome: trajeto?.para_texto ?? (nomeDoDestino(trajeto?.destino_id ?? null) || paraInicial || ''), latitude: trajeto?.para_lat ?? null, longitude: trajeto?.para_lon ?? null })
  const [focado, setFocado] = useState<'de' | 'para' | null>(null)
  const [meio, setMeio] = useState(trajeto?.meio ?? 'trem')
  const [saida, setSaida] = useState(trajeto?.partida ? horaNoFuso(trajeto.partida) : '')
  const [chegada, setChegada] = useState(trajeto?.chegada ? horaNoFuso(trajeto.chegada) : '')
  const [situacao, setSituacao] = useState(trajeto?.situacao ?? 'sugestao')
  const [trocas, setTrocas] = useState<number | null>(trajeto?.trocas ?? null)
  const [preco, setPreco] = useState(trajeto?.preco != null ? String(trajeto.preco).replace('.', ',') : '')
  const [ultimo, setUltimo] = useState(trajeto?.ultimo_do_dia ?? false)
  const [observacao, setObservacao] = useState(trajeto?.observacao ?? '')
  const [frequencia, setFrequencia] = useState<number | null>(trajeto?.frequencia_min ?? null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  // Membro mexe só na sugestão que ele mesmo adicionou
  const podeMexer = !trajeto || podeDecidir || (trajeto.criado_por === meuId && (trajeto.situacao ?? 'sugestao') === 'sugestao')
  const podeApagar = !!trajeto && (podeDecidir || trajeto.criado_por === meuId)
  const grupoAtual = grupo ?? trajeto?.grupo_opcoes ?? null

  const [lugares, setLugares] = useState<Lugar[]>([])
  useEffect(() => {
    buscarLugares(supabase, viagemId)
      .then(setLugares)
      .catch(() => setLugares([]))
  }, [viagemId])

  // Jeitos de ir (spec 122c)
  const [jeitos, setJeitos] = useState<JeitoDeIr[] | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [aberto, setAberto] = useState<MeioDoJeito | null>(null)
  const [semJeito, setSemJeito] = useState<string | null>(null)
  const buscaAtual = useRef(0)
  const livre = useMemo(() => livreNoDia(trajetos, dia, trajeto?.id ?? null, grupoAtual), [trajetos, trajeto?.id, dia, grupoAtual])
  const referencia = useMemo(() => {
    const d = destinos.find((x) => x.chegada && x.chegada <= dia && (x.saida ?? x.chegada) >= dia && x.latitude != null) ?? destinos.find((x) => x.latitude != null)
    return d && d.latitude != null && d.longitude != null ? { latitude: d.latitude, longitude: d.longitude } : null
  }, [destinos, dia])

  // Sugestões: destinos e lugares da viagem
  const pontos = useMemo<Ponto[]>(() => {
    const todos = [
      ...destinos.map((d) => ({ nome: d.nome, latitude: d.latitude, longitude: d.longitude })),
      ...lugares.map((l) => ({ nome: l.nome, latitude: l.latitude ?? null, longitude: l.longitude ?? null })),
    ]
    const vistos = new Set<string>()
    return todos.filter((p) => !vistos.has(p.nome.toLowerCase()) && vistos.add(p.nome.toLowerCase()))
  }, [destinos, lugares])
  const texto = (focado === 'de' ? de.nome : focado === 'para' ? para.nome : '').trim().toLowerCase()
  const sugestoes = focado ? pontos.filter((p) => p.nome.toLowerCase() !== texto && p.nome.toLowerCase().includes(texto)).slice(0, 6) : []

  const hSaida = normalizarHora(saida)
  const hChegada = normalizarHora(chegada)
  const diaSeguinte = !!hSaida && !!hChegada && hChegada < hSaida
  const horaPadrao = livre ? horaNoFuso(livre.quando) : '09:00'

  function horario(hora: string, maisUmDia = false) {
    const d = new Date(`${dia}T${hora}:00`)
    if (maisUmDia) d.setDate(d.getDate() + 1)
    return d.toISOString()
  }

  async function acharJeitos() {
    const minha = ++buscaAtual.current
    setErro(null)
    setSemJeito(null)
    setBuscando(true)
    setAberto(null)
    try {
      const ponto = async (p: Ponto, setP: (p: Ponto) => void) => {
        if (p.latitude != null && p.longitude != null) return { latitude: p.latitude, longitude: p.longitude }
        const daViagem = pontos.find((x) => x.nome.trim().toLowerCase() === p.nome.trim().toLowerCase() && x.latitude != null && x.longitude != null)
        if (daViagem) {
          setP(daViagem)
          return { latitude: daViagem.latitude!, longitude: daViagem.longitude! }
        }
        const achado = await acharLugar(p.nome, referencia)
        if (achado) setP({ nome: p.nome, latitude: achado.latitude, longitude: achado.longitude })
        return achado
      }
      const [a, b] = await Promise.all([ponto(de, setDe), ponto(para, setPara)])
      if (minha !== buscaAtual.current) return
      if (!a || !b) return setSemJeito('Não achamos esses lugares no mapa. Confira os nomes ou cadastre à mão.')
      const base = livre ? livre.quando : horario('07:00')
      const quando = new Date(new Date(base).getTime() - 30 * 60000).toISOString()
      const lista = await buscarJeitosDeIr(a, b, quando, moeda)
      if (minha !== buscaAtual.current) return
      setJeitos(lista)
      if (!lista.length) setSemJeito('Não achamos jeitos de ir entre esses lugares. Cadastre à mão.')
      else if (!lista.some((j) => j.saidas.length)) setSemJeito('Sem horários de trem ou ônibus nesse trecho (balsa e ônibus local às vezes não aparecem). Cadastre à mão se for o caso.')
    } catch {
      if (minha === buscaAtual.current) setSemJeito('Não deu pra buscar agora. Confira a internet ou cadastre à mão.')
    } finally {
      if (minha === buscaAtual.current) setBuscando(false)
    }
  }

  // As opções aparecem sozinhas quando de, para e dia estão preenchidos (espera parar de digitar)
  const chaveDaBusca = etapa === 'buscar' && de.nome.trim().length > 1 && para.nome.trim().length > 1 ? `${de.nome.trim()}|${para.nome.trim()}|${dia}` : null
  useEffect(() => {
    if (!chaveDaBusca) return
    const t = setTimeout(() => void acharJeitos(), 900)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveDaBusca])

  function reabrirOpcoes() {
    if (etapa === 'buscar') return
    setEtapa('buscar')
    setEscolhido(null)
    setErro(null)
  }
  const mudarDe = (p: Ponto) => (setDe(p), reabrirOpcoes())
  const mudarPara = (p: Ponto) => (setPara(p), reabrirOpcoes())
  const mudarDia = (n: number) => (setDia(somarDias(dia, n)), reabrirOpcoes())
  const trocar = () => (setDe(para), setPara(de), reabrirOpcoes())

  function usarSaida(s: Saida, jeito: JeitoDeIr) {
    setEscolhido(`${NOME_DO_JEITO[s.meio]} · ${horaNoFuso(s.sai)} → ${horaNoFuso(s.chega)}${diaNoFuso(s.chega) !== diaNoFuso(s.sai) ? ' (+1 dia)' : ''} · ${textoDasTrocas(s.trocas)}`)
    setEtapa('detalhes')
    setMeio(MEIO_DO_JEITO[s.meio])
    setSaida(horaNoFuso(s.sai))
    setChegada(horaNoFuso(s.chega))
    setTrocas(Math.min(s.trocas, 3))
    setFrequencia(jeito.frequenciaMin ?? frequenciaEstimada(jeito.saidas))
    setUltimo(false)
    setObservacao([s.linhas.slice(0, 2).join(' + '), s.trocaEm.length ? `troca em ${s.trocaEm.join(', ')}` : ''].filter(Boolean).join(' · ').slice(0, 200))
  }
  function usarRota(jeito: JeitoDeIr) {
    setEscolhido(`${NOME_DO_JEITO[jeito.meio]} · ${duracaoCurta(jeito.minutos)}${jeito.preco ? ' · preço estimado' : ''}`)
    setEtapa('detalhes')
    setMeio(jeito.meio === 'a_pe' ? 'a_pe' : 'carro')
    setTrocas(0)
    const sai = hSaida || horaPadrao
    setSaida(sai)
    setChegada(horaNoFuso(new Date(new Date(horario(sai)).getTime() + jeito.minutos * 60000).toISOString()))
    if (jeito.preco) setPreco(String(jeito.preco.valor).replace('.', ','))
    setObservacao(jeito.meio === 'taxi' ? 'Táxi' : jeito.meio === 'carro' && jeito.km != null ? `${String(jeito.km).replace('.', ',')} km` : '')
  }

  async function salvar(extra: { grupo_opcoes?: string; escolhida?: boolean; situacao?: string } = {}, irPraComparar?: string) {
    if (!de.nome.trim() || !para.nome.trim()) return setErro('Diga de onde e pra onde.')
    const valor = preco.trim() ? Number(preco.replace(/\./g, '').replace(',', '.')) : null
    if (valor != null && (Number.isNaN(valor) || valor < 0)) return setErro('Preço inválido. Ex.: 29,90')
    setErro(null)
    setSalvando(true)
    try {
      await salvarDeslocamento(
        viagemId,
        {
          de_texto: de.nome.trim(),
          para_texto: para.nome.trim(),
          de_lat: de.latitude,
          de_lon: de.longitude,
          para_lat: para.latitude,
          para_lon: para.longitude,
          meio,
          partida: horario(hSaida || horaPadrao),
          chegada: hChegada && hSaida ? horario(hChegada, diaSeguinte) : null,
          situacao,
          trocas,
          preco: valor,
          moeda: valor != null ? (trajeto?.moeda ?? moeda) : null,
          ultimo_do_dia: ultimo,
          observacao: observacao.trim() || null,
          frequencia_min: frequencia,
          ...(grupo && !trajeto ? { grupo_opcoes: grupo, escolhida: false } : {}),
          ...extra,
        },
        trajeto?.id,
      )
      aoSalvar(irPraComparar ?? grupo)
    } catch (e) {
      console.error('Erro ao salvar o deslocamento:', e)
      setErro((e as { code?: string }).code === '42501' ? 'Não deu: decidir e comprar é com o ADM. Você pode deixar como sugestão.' : 'Não deu pra salvar. Confira a internet e tente de novo.')
    } finally {
      setSalvando(false)
    }
  }

  async function salvarComoOpcao() {
    const g = grupoAtual ?? crypto.randomUUID()
    if (trajeto) {
      // Editando: este vira a 1ª opção e abre uma opção nova, em branco, com o mesmo de/para
      try {
        if (!trajeto.grupo_opcoes) await virarOpcao(trajeto.id, g)
        aoOutraOpcao(g, dia, de.nome, para.nome)
      } catch {
        setErro('Não deu pra guardar. Tente de novo.')
      }
      return
    }
    await salvar({ grupo_opcoes: g, escolhida: false, situacao: 'sugestao' }, g)
  }

  async function apagar() {
    if (!trajeto || !window.confirm('Apagar este deslocamento? Some pra todo mundo do comboio.')) return
    setSalvando(true)
    try {
      await apagarTrajeto(trajeto.id)
      aoSalvar(null)
    } catch {
      setErro('Não deu pra apagar. Tente de novo.')
    } finally {
      setSalvando(false)
    }
  }

  const campoDoPonto = (qual: 'de' | 'para') => {
    const p = qual === 'de' ? de : para
    return (
      <>
        <div className="ps-campo">
          <input
            value={p.nome}
            onChange={(e) => (qual === 'de' ? mudarDe : mudarPara)({ nome: e.target.value, latitude: null, longitude: null })}
            onFocus={() => setFocado(qual)}
            onBlur={() => setTimeout(() => setFocado(null), 200)}
            placeholder={qual === 'de' ? 'De onde? (cidade, estação, lugar)' : 'Pra onde?'}
            aria-label={qual === 'de' ? 'De onde' : 'Pra onde'}
            maxLength={120}
          />
          {qual === 'de' && (
            <button type="button" className="ps-campo-acao" onClick={trocar} aria-label="Trocar de e para" title="Trocar de e para">
              <ArrowLeftRight size={18} aria-hidden="true" />
            </button>
          )}
        </div>
        {focado === qual && sugestoes.length > 0 && (
          <div className="ps-sugestoes">
            {sugestoes.map((s) => (
              <button key={s.nome} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => (qual === 'de' ? mudarDe : mudarPara)(s)}>
                {s.nome}
              </button>
            ))}
          </div>
        )}
      </>
    )
  }

  return (
    <div className="ps-form">
      <h2 className="ps-painel-titulo">{trajeto ? 'Deslocamento' : grupo ? 'Outra opção' : 'Novo deslocamento'}</h2>

      {/* Passo 1: de onde, pra onde, que dia */}
      <div className="ps-form-bloco">
        {campoDoPonto('de')}
        {campoDoPonto('para')}
        <div className="ps-dia">
          <button type="button" onClick={() => mudarDia(-1)} aria-label="Dia anterior">
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <strong>{diaComSemana(dia)}</strong>
          <button type="button" onClick={() => mudarDia(1)} aria-label="Próximo dia">
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {etapa === 'buscar' ? (
        <>
          {buscando && <p className="ps-dica">Procurando o que tem…</p>}
          {!buscando && !!jeitos?.length && livre && (
            <p className="ps-dica">{`Vocês ficam livres às ${horaNoFuso(livre.quando)}${livre.de ? ` (chegam de ${livre.de})` : ''}.`}</p>
          )}
          {!buscando &&
            jeitos?.map((j) => (
              <CartaoDoJeito
                key={j.meio}
                jeito={j}
                aberto={aberto === j.meio}
                livreDesde={livre?.quando ?? null}
                horaEscolhida={saida}
                aoTocar={() => (j.saidas.length ? setAberto(aberto === j.meio ? null : j.meio) : usarRota(j))}
                aoEscolher={(s) => usarSaida(s, j)}
              />
            ))}
          {semJeito && !buscando && <p className="ps-nota">{semJeito}</p>}
          {erro && <p className="form-erro" role="alert">{erro}</p>}
          {de.nome.trim() && para.nome.trim() && !buscando && (
            <button
              type="button"
              className="ps-tracejado"
              onClick={() => {
                setEscolhido(null)
                setEtapa('detalhes')
                setMaisDetalhes(true)
              }}
            >
              <Plus size={18} aria-hidden="true" />
              <span>
                <b>Não achei, vou digitar</b>
                <small>Balsa, avião ou o que não apareceu</small>
              </span>
            </button>
          )}
        </>
      ) : (
        <>
          {/* Passo 2: a escolhida, já preenchida */}
          {(escolhido || trajeto) && (
            <div className="ps-escolhido">
              <div>
                <b>{escolhido ?? `${meioDe(meio).nome}${hSaida ? ` · ${hSaida}` : ''}${hChegada ? ` → ${hChegada}` : ''}`}</b>
                {observacao && <small>{observacao}</small>}
              </div>
              <button type="button" className="botao-texto" onClick={() => (setEtapa('buscar'), setErro(null))}>
                Trocar
              </button>
            </div>
          )}

          <div className="form-campo">
            <label className="ps-rotulo" htmlFor="ps-preco">{`Preço do grupo todo (${trajeto?.moeda ?? moeda})`}</label>
            <input id="ps-preco" inputMode="decimal" placeholder="Opcional" value={preco} onChange={(e) => setPreco(e.target.value)} />
          </div>

          {!podeDecidir && <p className="ps-nota">{podeMexer ? 'Vai como sugestão pro grupo. Quem decide e compra é o ADM.' : 'Só quem adicionou essa sugestão ou o ADM mexe nela.'}</p>}

          {podeDecidir && (
            <label className="interruptor ps-interruptor">
              <span>
                <strong>Já comprei</strong>
                <small>Fica nas Passagens como garantido.</small>
              </span>
              <input
                type="checkbox"
                checked={situacao === 'comprado'}
                onChange={(e) => setSituacao(e.target.checked ? 'comprado' : trajeto?.situacao && trajeto.situacao !== 'comprado' ? trajeto.situacao : 'sugestao')}
              />
            </label>
          )}

          <button type="button" className="ps-mais" aria-expanded={maisDetalhes} onClick={() => setMaisDetalhes(!maisDetalhes)}>
            Mais detalhes <ChevronDown size={18} aria-hidden="true" />
          </button>

          {maisDetalhes && (
            <div className="ps-form-bloco">
              <span className="ps-rotulo">Transporte</span>
              <Chips opcoes={MEIOS_DO_FORM.map((m) => ({ chave: m.chave, nome: m.nome }))} valor={meio} aoMudar={setMeio} />
              <div className="ps-horas">
                <div className="form-campo">
                  <label className="ps-rotulo" htmlFor="ps-sai">Sai</label>
                  <input id="ps-sai" inputMode="numeric" placeholder={horaPadrao} value={saida} onChange={(e) => setSaida(e.target.value)} onBlur={() => setSaida(normalizarHora(saida))} />
                </div>
                <div className="form-campo">
                  <label className="ps-rotulo" htmlFor="ps-chega">Chega{diaSeguinte ? ' (+1 dia)' : ''}</label>
                  <input id="ps-chega" inputMode="numeric" placeholder="--:--" value={chegada} onChange={(e) => setChegada(e.target.value)} onBlur={() => setChegada(normalizarHora(chegada))} />
                </div>
              </div>
              <span className="ps-rotulo">Trocas</span>
              <Chips opcoes={TROCAS} valor={String(trocas)} aoMudar={(v) => setTrocas(v === 'null' ? null : Number(v))} />
              {podeDecidir && (
                <>
                  <span className="ps-rotulo">Situação</span>
                  <Chips opcoes={SITUACOES} valor={situacao} aoMudar={setSituacao} />
                </>
              )}
              <label className="interruptor ps-interruptor">
                <span>
                  <strong>Último do dia</strong>
                  <small>Se perder, fica sem.</small>
                </span>
                <input type="checkbox" checked={ultimo} onChange={(e) => setUltimo(e.target.checked)} />
              </label>
              <div className="form-campo">
                <label className="ps-rotulo" htmlFor="ps-obs">Observação</label>
                <input id="ps-obs" maxLength={200} placeholder="Ex.: compra no cais" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
              </div>
            </div>
          )}

          {erro && <p className="form-erro" role="alert">{erro}</p>}
          {podeMexer && (
            <button type="button" className="botao" onClick={() => void salvar()} disabled={salvando}>
              {salvando ? 'Salvando…' : trajeto ? 'Salvar' : grupo ? 'Adicionar como opção' : podeDecidir ? 'Adicionar ao dia' : 'Sugerir pro grupo'}
            </button>
          )}
          {!grupo && podeMexer && (
            <button type="button" className="botao secundario" onClick={() => void salvarComoOpcao()} disabled={salvando}>
              {trajeto ? 'Adicionar outra opção pra comparar' : 'Guardar como opção pra comparar'}
            </button>
          )}
          {grupoAtual && trajeto && (
            <button type="button" className="botao-texto ps-centro" onClick={() => aoComparar(grupoAtual)}>
              Ver as opções lado a lado
            </button>
          )}
          {podeApagar && (
            <button type="button" className="botao-texto ps-apagar" onClick={() => void apagar()} disabled={salvando}>
              <Trash2 size={15} aria-hidden="true" /> Apagar deslocamento
            </button>
          )}
        </>
      )}
    </div>
  )
}

// Um cartão por meio. Trem/ônibus/barco/metrô abrem as saídas; carro, táxi e a pé preenchem direto.
function CartaoDoJeito({
  jeito,
  aberto,
  livreDesde,
  horaEscolhida,
  aoTocar,
  aoEscolher,
}: {
  jeito: JeitoDeIr
  aberto: boolean
  livreDesde: string | null
  horaEscolhida: string
  aoTocar: () => void
  aoEscolher: (s: Saida) => void
}) {
  const Icone = meioDe(MEIO_DO_JEITO[jeito.meio]).icone
  const partes = [duracaoCurta(jeito.minutos)]
  if (jeito.trocas != null) partes.push(textoDasTrocas(jeito.trocas))
  if (jeito.frequenciaMin) partes.push(textoDaFrequencia(jeito.frequenciaMin))
  if (jeito.km != null && !jeito.saidas.length) partes.push(`${String(jeito.km).replace('.', ',')} km`)
  // A partir da última que não dá tempo (pra contexto), no máximo 6
  const primeiraQueDa = jeito.saidas.findIndex((s) => !naoDaTempo(s, livreDesde))
  const inicio = Math.max(0, (primeiraQueDa < 0 ? jeito.saidas.length : primeiraQueDa) - 1)
  const saidas = jeito.saidas.slice(inicio, inicio + 6)
  return (
    <div className={aberto ? 'ps-jeito aberto' : 'ps-jeito'}>
      <button type="button" className="ps-jeito-topo" onClick={aoTocar} aria-expanded={jeito.saidas.length ? aberto : undefined}>
        <span className="ps-icone">
          <Icone size={19} aria-hidden="true" />
        </span>
        <span className="ps-texto">
          <span className="ps-jeito-nome">
            <b>{NOME_DO_JEITO[jeito.meio]}</b>
            {jeito.selos.includes('mais-rapido') && <span className="ps-selo bom">Mais rápido</span>}
            {jeito.selos.includes('mais-barato') && <span className="ps-selo bom">Mais barato</span>}
          </span>
          <small>{partes.join(' · ')}</small>
        </span>
        {jeito.preco ? (
          <span className="ps-jeito-preco">
            <b>{`${SIMBOLO[jeito.preco.moeda] ?? jeito.preco.moeda} ${jeito.preco.valor}`}</b>
            <small>estimativa</small>
          </span>
        ) : jeito.saidas.length ? (
          <span className="ps-jeito-horarios">{aberto ? 'fechar' : 'horários'}</span>
        ) : null}
      </button>
      {aberto &&
        saidas.map((s) => {
          const tarde = naoDaTempo(s, livreDesde)
          const escolhida = horaEscolhida === horaNoFuso(s.sai)
          return (
            <button key={`${s.sai}${s.chega}`} type="button" className={`ps-saida${escolhida ? ' escolhida' : ''}${tarde ? ' tarde' : ''}`} onClick={() => aoEscolher(s)}>
              <b className="ps-saida-hora">{horaNoFuso(s.sai)}</b>
              <span className="ps-texto">
                <b>{`Chega ${horaNoFuso(s.chega)}${diaNoFuso(s.chega) !== diaNoFuso(s.sai) ? ' (+1 dia)' : ''}`}</b>
                <small>{s.trocas === 0 ? 'Direto' : `${textoDasTrocas(s.trocas)}${s.trocaEm[0] ? ` · ${s.trocaEm[0]}` : ''}`}</small>
              </span>
              {tarde && <span className="ps-selo ruim">Não dá tempo</span>}
            </button>
          )
        })}
    </div>
  )
}

function Chips({ opcoes, valor, aoMudar }: { opcoes: { chave: string; nome: string }[]; valor: string; aoMudar: (v: string) => void }) {
  return (
    <div className="ps-chips">
      {opcoes.map((o) => (
        <button key={o.chave} type="button" aria-pressed={valor === o.chave} onClick={() => aoMudar(o.chave)}>
          {o.nome}
        </button>
      ))}
    </div>
  )
}

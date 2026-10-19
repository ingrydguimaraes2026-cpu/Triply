import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'
import { hojeTexto } from '../destinos/datas'
import { formatarDinheiro, lerValor } from '../financeiro/dinheiro'
import { formatarData } from '../../lib/datas'
import { buscarAgora, buscarHistorico } from './api'
import BoletimCambio from './BoletimCambio'
import { analisar, comIOF, custoEmReais, IOF_GASTOS, pontosDoGrafico, taxaDoApp, ultimosDias, type Nivel, type Ponto } from './termometro'
import './termometro.css'

type Props = {
  viagemId: string
  meuId: string
  moeda: string // moeda da viagem (ex.: EUR)
  minhaMedia?: number | null // cotação média das minhas compras, se tiver
}

type Estado = { status: 'carregando' } | { status: 'erro' } | { status: 'pronto'; serie: Ponto[]; agora: number; hora: string | null }

const NIVEL: Record<Nivel, { titulo: string; texto: string }> = {
  barato: { titulo: 'Barato', texto: 'Bom momento pra comprar um pouco.' },
  medio: { titulo: 'Na média', texto: 'Nem barato nem caro. Comprar aos poucos dilui o risco.' },
  caro: { titulo: 'Caro', texto: 'Se não tiver pressa, vale esperar.' },
}

const reais = (valor: number) => `R$ ${valor.toFixed(2).replace('.', ',')}`
const pct = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1).replace('.', ',')}%`

// Termômetro do câmbio: a moeda da viagem está barata ou cara, quanto sai com IOF na Wise/Nomad e a meta de compra.
export default function TermometroCambio({ viagemId, meuId, moeda, minhaMedia }: Props) {
  const [estado, setEstado] = useState<Estado>({ status: 'carregando' })
  const [tentativa, setTentativa] = useState(0)
  const [vista, setVista] = useState('')
  const [quanto, setQuanto] = useState('1000')
  const hoje = hojeTexto()

  useEffect(() => {
    let ativo = true
    Promise.all([buscarHistorico(moeda), buscarAgora(moeda)])
      .then(([serie, agora]) => {
        if (!ativo) return
        const ultimo = serie[serie.length - 1]
        if (!agora && !ultimo) return setEstado({ status: 'erro' })
        setEstado({ status: 'pronto', serie, agora: agora?.valor ?? ultimo.valor, hora: agora?.hora ?? null })
      })
      .catch((erro) => {
        console.error('Erro ao carregar o câmbio:', erro)
        if (ativo) setEstado({ status: 'erro' })
      })
    return () => {
      ativo = false
    }
  }, [moeda, tentativa])

  const pronto = estado.status === 'pronto' ? estado : null
  const analise = useMemo(() => (pronto ? analisar(pronto.serie, pronto.agora, hoje) : null), [pronto, hoje])
  const seisMeses = useMemo(() => (pronto ? ultimosDias(pronto.serie, 182, hoje) : []), [pronto, hoje])

  if (estado.status === 'carregando') {
    return (
      <section className="cartao-ui termometro" aria-busy="true">
        <p className="carregando-texto">Buscando a cotação do {moeda}…</p>
      </section>
    )
  }
  if (estado.status === 'erro' || !pronto || !analise) {
    return (
      <section className="cartao-ui termometro">
        <p className="form-dica">Não deu pra buscar a cotação agora (sem internet ou o serviço caiu).</p>
        <button type="button" className="botao secundario pequeno" onClick={() => setTentativa((t) => t + 1)}>
          <RefreshCw size={14} aria-hidden="true" /> Tentar de novo
        </button>
      </section>
    )
  }

  const { agora } = pronto
  const comImposto = comIOF(agora)
  const vistaValor = lerValor(vista)
  const taxa = vistaValor ? taxaDoApp(vistaValor / 100, agora) : null
  const quantoCentavos = lerValor(quanto)
  const nivel = NIVEL[analise.nivel]

  // Gráfico: 6 meses, com a média dos 90 dias tracejada
  const L = 600
  const A = 140
  const pontos = pontosDoGrafico([...seisMeses, { data: hoje, valor: agora }], L, A)
  const linha = pontos.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const valores = pontos.map((p) => p.valor)
  const minG = Math.min(...valores)
  const maxG = Math.max(...valores)
  const yMedia = A - ((analise.media90 - minG) / (maxG - minG || 1)) * A
  const ultimo = pontos[pontos.length - 1]

  return (
    <section className={`cartao-ui termometro nivel-${analise.nivel}`} aria-label={`Termômetro do ${moeda}`}>
      <header className="termometro-topo">
        <div>
          <p className="termometro-rotulo">1 {moeda} hoje (comercial)</p>
          <p className="termometro-valor">{reais(agora)}</p>
          <p className="termometro-hora">{pronto.hora ? `Atualizado ${pronto.hora.slice(11, 16)}` : 'Fechamento do último dia útil'}</p>
        </div>
        <div className="termometro-nivel">
          <span className="termometro-selo">{nivel.titulo}</span>
          <small>
            {analise.nivel === 'caro'
              ? `Mais caro que ${Math.round(analise.percentil * 100)}% dos últimos 90 dias`
              : `Mais barato que ${Math.round((1 - analise.percentil) * 100)}% dos últimos 90 dias`}
          </small>
        </div>
      </header>

      <p className="termometro-frase">
        {analise.vsMedia < 0 ? <TrendingDown size={16} aria-hidden="true" /> : <TrendingUp size={16} aria-hidden="true" />}
        {pct(analise.vsMedia)} em relação à média de 90 dias ({reais(analise.media90)}). {nivel.texto}
      </p>

      {pontos.length > 1 && (
        <figure className="termometro-grafico">
          <div className="termometro-area">
          <svg viewBox={`-4 -8 ${L + 8} ${A + 16}`} preserveAspectRatio="none" role="img" aria-label={`Cotação do ${moeda} nos últimos 6 meses`}>
            <line x1="0" x2={L} y1={yMedia} y2={yMedia} className="termometro-media" vectorEffect="non-scaling-stroke" />
            <path d={linha} className="termometro-linha" vectorEffect="non-scaling-stroke" />
          </svg>
          <span className="termometro-ponto" style={{ left: `${((ultimo.x + 4) / (L + 8)) * 100}%`, top: `${((ultimo.y + 8) / (A + 16)) * 100}%` }} />
          </div>
          <figcaption>
            <span>{seisMeses[0] ? formatarData(seisMeses[0].data) : ''}</span>
            <span>tracejado: média de 90 dias</span>
            <span>hoje</span>
          </figcaption>
        </figure>
      )}

      <dl className="termometro-numeros">
        <div>
          <dt>Menor (90 dias)</dt>
          <dd>{reais(analise.min90)}</dd>
        </div>
        <div>
          <dt>Maior (90 dias)</dt>
          <dd>{reais(analise.max90)}</dd>
        </div>
        <div>
          <dt>Em 30 dias</dt>
          <dd>{analise.em30dias === null ? '—' : pct(analise.em30dias)}</dd>
        </div>
        {minhaMedia ? (
          <div>
            <dt>Sua média de compra</dt>
            <dd>{reais(minhaMedia)}</dd>
          </div>
        ) : (
          analise.minAno !== null && (
            <div>
              <dt>Menor do ano</dt>
              <dd>{reais(analise.minAno)}</dd>
            </div>
          )
        )}
      </dl>

      <div className="termometro-apps">
        <h3>Na Wise ou na Nomad</h3>
        <p>
          Com o IOF de {(IOF_GASTOS * 100).toFixed(1).replace('.', ',')}%, o mínimo que 1 {moeda} sai é <strong>{reais(comImposto)}</strong>. Cada app soma a
          taxa dele em cima.
        </p>
        <div className="form-linha">
          <div className="form-campo">
            <label className="form-rotulo" htmlFor="termo-vista">
              Cotação que você viu no app
            </label>
            <input id="termo-vista" inputMode="decimal" placeholder={comImposto.toFixed(2).replace('.', ',')} value={vista} onChange={(e) => setVista(e.target.value)} />
          </div>
          <div className="form-campo">
            <label className="form-rotulo" htmlFor="termo-quanto">
              Quantos {moeda}?
            </label>
            <input id="termo-quanto" inputMode="decimal" value={quanto} onChange={(e) => setQuanto(e.target.value)} />
          </div>
        </div>
        {taxa !== null && (
          <p className="termometro-resultado">
            {taxa <= 0.05
              ? 'Essa cotação está no piso: o app praticamente não cobra nada além do IOF.'
              : `O app está cobrando uns ${taxa.toFixed(1).replace('.', ',')}% além do IOF.`}
          </p>
        )}
        {quantoCentavos ? (
          <p className="termometro-resultado">
            {formatarDinheiro(quantoCentavos, moeda)} sai por uns <strong>{formatarDinheiro(custoEmReais(quantoCentavos, vistaValor ? vistaValor / 100 : comImposto), 'BRL')}</strong>
            {vistaValor ? ' na cotação que você viu' : ' no mínimo (comercial + IOF)'}.
          </p>
        ) : null}
        <div className="termometro-links">
          <a href={`https://wise.com/br/currency-converter/${moeda.toLowerCase()}-to-brl-rate`} target="_blank" rel="noreferrer noopener">
            Ver na Wise <ExternalLink size={12} aria-hidden="true" />
          </a>
          <a href="https://www.nomadglobal.com/" target="_blank" rel="noreferrer noopener">
            Abrir a Nomad <ExternalLink size={12} aria-hidden="true" />
          </a>
        </div>
      </div>

      <BoletimCambio viagemId={viagemId} meuId={meuId} moeda={moeda} />

      <p className="termometro-fonte">
        Comparação com o passado, não previsão. Fontes: AwesomeAPI (agora) e Banco Central Europeu (histórico).
      </p>
    </section>
  )
}

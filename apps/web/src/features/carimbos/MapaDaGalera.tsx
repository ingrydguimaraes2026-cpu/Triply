import { useEffect, useMemo, useRef, useState } from 'react'
import { geoContains, geoNaturalEarth1, geoPath } from 'd3-geo'
import { buscarMapaDaGalera, mapaDaGalera, type DadosDoMapa, type FiltroDoMapa } from '@together/core'
import { supabase } from '../../lib/supabase'
import { hojeTexto } from '../destinos/datas'
import { carregarPaises, type Pais } from '../mapa/paises'
import { mapaEmImagem } from './mapaEmImagem'
import './mapa-da-galera.css'

type Resumo = ReturnType<typeof mapaDaGalera>

// Mapa da galera (spec 118b), claro como no app: os países com carimbo acendem em dourado,
// cada lugar é uma bolinha. Filtro, os números, "quem carimbou mais este ano" e "postar mapa".
// `vez` muda quando a pessoa conta uma viagem antiga (o mapa busca de novo).
export default function MapaDaGalera({ meuId, vez = 0, aoAntigas }: { meuId: string; vez?: number; aoAntigas?: () => void }) {
  const [dados, setDados] = useState<DadosDoMapa | null>(null)
  const [filtro, setFiltro] = useState<FiltroDoMapa>('todos')
  const [gerando, setGerando] = useState(false)
  const hoje = hojeTexto()

  useEffect(() => {
    let ativo = true
    buscarMapaDaGalera(supabase)
      .then((d) => ativo && setDados(d))
      .catch((e) => console.error('Erro ao buscar o mapa da galera:', e))
    return () => {
      ativo = false
    }
  }, [meuId, vez])

  const m = useMemo(() => (dados ? mapaDaGalera(dados.carimbos, dados.viagens, meuId, filtro, hoje) : null), [dados, meuId, filtro, hoje])
  if (!dados || !m) return null
  const nome = (id: string) => (id === meuId ? 'Você' : (dados.nomes.get(id) ?? 'Alguém').split(' ')[0])

  async function postar() {
    if (!m) return
    setGerando(true)
    const png = await mapaEmImagem(m).catch(() => null)
    setGerando(false)
    if (!png) return
    const arquivo = new File([png], 'Mapa da galera.png', { type: 'image/png' })
    if (navigator.canShare?.({ files: [arquivo] })) {
      try {
        await navigator.share({ files: [arquivo] })
      } catch {
        /* cancelou */
      }
      return
    }
    const url = URL.createObjectURL(png)
    const link = document.createElement('a')
    link.href = url
    link.download = arquivo.name
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  if (dados.carimbos.length === 0)
    return (
      <section className="mapa-galera">
        <h2>Mapa da galera</h2>
        <MapaDesenhado pontos={[]} />
        <p className="mapa-galera-vazio">Seu mapa está vazio. Cada lugar onde a galera chegar vira um carimbo e acende aqui.</p>
        {aoAntigas && (
          <button type="button" className="mapa-galera-chip" onClick={aoAntigas}>
            Contar onde a galera já foi
          </button>
        )}
      </section>
    )

  return (
    <section className="mapa-galera">
      <header className="mapa-galera-topo">
        <h2>Mapa da galera</h2>
        <button type="button" className="mapa-galera-postar" onClick={() => void postar()} disabled={gerando}>
          {gerando ? 'Gerando...' : 'Postar mapa'}
        </button>
      </header>

      <div className="mapa-galera-filtro" role="group" aria-label="Filtro do mapa">
        <button type="button" className={filtro === 'todos' ? 'ativo' : ''} aria-pressed={filtro === 'todos'} onClick={() => setFiltro('todos')}>
          A galera toda
        </button>
        <button type="button" className={filtro === 'meus' ? 'ativo' : ''} aria-pressed={filtro === 'meus'} onClick={() => setFiltro('meus')}>
          Só os meus
        </button>
      </div>

      <MapaDesenhado pontos={m.pontos} />

      <dl className="mapa-galera-numeros">
        {(
          [
            [m.lugares, m.lugares === 1 ? 'lugar' : 'lugares'],
            [m.viagens, m.viagens === 1 ? 'viagem' : 'viagens'],
            ...(m.roles ? [[m.roles, m.roles === 1 ? 'rolê' : 'rolês']] : []),
            [m.diasJuntos, 'dias juntos'],
            [m.km, 'km'],
          ] as [number, string][]
        ).map(([n, rotulo]) => (
          <div key={rotulo}>
            <dt>{rotulo}</dt>
            <dd>{n.toLocaleString('pt-BR')}</dd>
          </div>
        ))}
      </dl>

      {m.podio.length > 0 && (
        <div className="mapa-galera-podio">
          <h3>Quem carimbou mais em {hoje.slice(0, 4)}</h3>
          <ol>
            {m.podio.map((p, i) => (
              <li key={p.pessoaId}>
                <span>
                  {i + 1}. {nome(p.pessoaId)}
                </span>
                <small>
                  {p.carimbos} {p.carimbos === 1 ? 'carimbo' : 'carimbos'}
                </small>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}

// O desenho: mundo inteiro parado (sem arrastar), do tamanho da caixa
function MapaDesenhado({ pontos }: { pontos: Resumo['pontos'] }) {
  const caixa = useRef<HTMLDivElement>(null)
  const [largura, setLargura] = useState(0)
  const [paises, setPaises] = useState<Pais[]>([])
  const altura = Math.round(largura * 0.52)

  useEffect(() => {
    carregarPaises()
      .then(setPaises)
      .catch((e) => console.error('Erro ao carregar o mapa:', e))
  }, [])

  useEffect(() => {
    const el = caixa.current
    if (!el) return
    const observador = new ResizeObserver(([e]) => setLargura(Math.round(e.contentRect.width)))
    observador.observe(el)
    return () => observador.disconnect()
  }, [])

  const desenho = useMemo(() => {
    if (!largura || !paises.length) return null
    const projecao = geoNaturalEarth1().fitSize([largura, altura], { type: 'FeatureCollection', features: paises })
    const caminho = geoPath(projecao)
    return {
      paises: paises.map((f, i) => ({
        d: caminho(f) ?? '',
        aceso: pontos.some((p) => geoContains(f, [p.longitude, p.latitude])),
        chave: String(f.id ?? i),
      })),
      bolinhas: pontos.map((p) => ({ ...p, xy: projecao([p.longitude, p.latitude]) })).filter((p) => p.xy),
    }
  }, [largura, altura, paises, pontos])

  return (
    <div ref={caixa} className="mapa-galera-desenho" style={{ height: altura || 160 }}>
      {desenho && (
        <svg width={largura} height={altura} role="img" aria-label={`Mapa com ${pontos.length} ${pontos.length === 1 ? 'lugar carimbado' : 'lugares carimbados'}`}>
          <g>
            {desenho.paises.map((p) => (
              <path key={p.chave} d={p.d} className={p.aceso ? 'aceso' : undefined} />
            ))}
          </g>
          {desenho.bolinhas.map((p) => (
            <g key={p.nome}>
              <circle cx={p.xy![0]} cy={p.xy![1]} r={5} className="mapa-galera-halo" />
              <circle cx={p.xy![0]} cy={p.xy![1]} r={2.5} className="mapa-galera-ponto" />
            </g>
          ))}
        </svg>
      )}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { buscarMapaDaGalera, mapaDaGalera, type DadosDoMapa, type FiltroDoMapa } from '@together/core'
import { supabase } from '../../lib/supabase'
import { hojeTexto } from '../destinos/datas'
import { Globe2, History, Share2 } from '../../components/ui/icones'
import Gaveta from '../../components/ui/Gaveta'
import ViagemAntiga from './ViagemAntiga'
import MapaMundi from '../mapa/MapaMundi'
import { mapaEmImagem } from './mapaEmImagem'
import './mapa-da-galera.css'

// Mapa da galera (spec 118b): os lugares carimbados de todas as viagens da pessoa acendem.
// Números, "quem carimbou mais este ano" (só os 3 primeiros) e "postar mapa".
export default function MapaDaGalera({ meuId }: { meuId: string }) {
  const [dados, setDados] = useState<DadosDoMapa | null>(null)
  const [filtro, setFiltro] = useState<FiltroDoMapa>('todos')
  const [gerando, setGerando] = useState(false)
  const [contando, setContando] = useState(false) // gaveta "a gente já foi pra..." (118f)
  const [vez, setVez] = useState(0)
  const [acendeu, setAcendeu] = useState<string | null>(null)
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

  return (
    <section className="cartao-ui mapa-galera">
      <header className="mapa-galera-topo">
        <h2>
          <Globe2 size={18} aria-hidden="true" /> Mapa da galera
        </h2>
        {dados.carimbos.length > 0 && (
          <button type="button" className="botao-texto" onClick={() => void postar()} disabled={gerando}>
            <Share2 size={15} aria-hidden="true" /> {gerando ? 'Gerando...' : 'Postar mapa'}
          </button>
        )}
      </header>

      {dados.carimbos.length === 0 ? (
        <p className="dica">Seu mapa está vazio. Conta onde a galera já foi: cada lugar vira um carimbo e acende aqui.</p>
      ) : (
        <>
          <div className="mapa-galera-filtro" role="group" aria-label="Filtro do mapa">
            <button type="button" className={filtro === 'todos' ? 'ativo' : ''} aria-pressed={filtro === 'todos'} onClick={() => setFiltro('todos')}>
              A galera toda
            </button>
            <button type="button" className={filtro === 'meus' ? 'ativo' : ''} aria-pressed={filtro === 'meus'} onClick={() => setFiltro('meus')}>
              Só os meus
            </button>
          </div>

          <div className="mapa-galera-mapa">
            <MapaMundi pontos={m.pontos} numerar={false} ligar={false} zoomMaximo={4} />
          </div>

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
                {m.podio.map((p) => (
                  <li key={p.pessoaId}>
                    <span>{nome(p.pessoaId)}</span>
                    <small>
                      {p.carimbos} {p.carimbos === 1 ? 'carimbo' : 'carimbos'}
                    </small>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}

      {acendeu && <p className="mapa-galera-acendeu" role="status">{acendeu} acendeu no mapa.</p>}
      <button type="button" className="botao-texto mapa-galera-antiga" onClick={() => setContando(true)}>
        <History size={15} aria-hidden="true" /> A gente já foi pra...
      </button>

      {contando && (
        <Gaveta titulo="A gente já foi pra..." aoFechar={() => setContando(false)}>
          <ViagemAntiga
            aoSalvar={(nome) => {
              setContando(false)
              setAcendeu(nome)
              setVez((v) => v + 1)
            }}
          />
        </Gaveta>
      )}
    </section>
  )
}

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { BookOpen, Copy, Download, RotateCcw, Share2, Sparkles, Users } from '../../components/ui/icones'
import { Icone } from '../../components/ui/Icone'
import {
  carimbosDaCapa,
  fonteDoNomeNoCarimbo,
  cartoesDaRetrospectiva,
  estatisticasDoViajante,
  formatarDinheiro,
  legendaDaRetrospectiva,
  melhoresPosts,
  molduraDaViagem,
  retrospectivaPronta,
  trajetoDaViagem,
  type CartaoDaRetrospectiva,
} from '@together/core'
import { supabase } from '../../lib/supabase'
import { useViagemAtual } from '../../features/viagens/hooks'
import { useResumoFinanceiro } from '../../features/financeiro/hooks'
import { usePosts } from '../../features/feed/hooks'
import { useCarimbos } from '../../features/carimbos/hooks'
import { codigoDoPais, nomeDoPais } from '../../features/documentos/paises'
import { hojeTexto } from '../../features/destinos/datas'
import { cartaoEmImagem } from '../../features/retrospectiva/cartaoEmImagem'
import MapaMundi from '../../features/mapa/MapaMundi'
import CabecalhoPagina from '../../components/ui/CabecalhoPagina'
import './retrospectiva.css'

// Retrospectiva (specs 105 e 118c): monta sozinha quando a viagem acaba. Moldura pela data,
// mapa percorrido, carimbos, cartões "estilo story" (cada um vira PNG 1080×1920), as fotos
// mais curtidas, legenda pronta (dá pra trocar), caderno e "Bora a próxima?" (mesma galera, 055).
export default function Retrospectiva() {
  const { viagem, destinos, membros } = useViagemAtual()
  const moeda = viagem.moeda_principal
  const resumo = useResumoFinanceiro(viagem.id, moeda)
  const { estado } = usePosts(viagem.id)
  const carimbos = useCarimbos(viagem.id)
  const [visitados, setVisitados] = useState(0)
  const [gerando, setGerando] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('lugares')
      .select('id', { count: 'exact', head: true })
      .eq('viagem_id', viagem.id)
      .not('visitado_em', 'is', null)
      .then(({ count }) => setVisitados(count ?? 0))
  }, [viagem.id])

  const moldura = molduraDaViagem(viagem.data_inicio, viagem.data_fim)
  const daCapa = useMemo(() => carimbosDaCapa(carimbos), [carimbos])
  const pontos = useMemo(() => trajetoDaViagem(destinos), [destinos])
  const cidades = useMemo(() => [...new Set(destinos.map((d) => d.nome))], [destinos])
  const posts = useMemo(() => (estado.status === 'pronto' ? estado.posts : []), [estado])
  const dias = useMemo(() => estatisticasDoViajante([viagem], destinos.map((d) => ({ ...d, codigo: codigoDoPais(d.pais) })), hojeTexto()), [viagem, destinos])
  const cartoes = useMemo(
    () =>
      cartoesDaRetrospectiva({
        nome: viagem.nome,
        dias: dias.dias,
        km: dias.km,
        cidades,
        paises: dias.paises.map(nomeDoPais),
        gastoTotal: resumo && resumo !== 'erro' ? resumo.gasto : null, // só o que é do grupo
        dinheiro: (c) => formatarDinheiro(c, moeda),
        pessoas: membros.length,
        posts: posts.length,
        fotos: posts.reduce((s, p) => s + p.fotos.length, 0),
        curtidas: posts.reduce((s, p) => s + p.curtidas.length, 0),
        lugaresVisitados: visitados,
        carimbados: daCapa.map((c) => c.nome),
      }),
    [viagem.nome, dias, cidades, resumo, moeda, membros.length, posts, visitados, daCapa],
  )
  const melhores = melhoresPosts(posts, 3)
  const sugerida = legendaDaRetrospectiva({ nome: viagem.nome, lugares: cidades, moldura, dias: dias.dias, pessoas: membros.length, carimbados: daCapa.length })
  const [legenda, setLegenda] = useState<string | null>(null) // null = usa a sugerida (ela muda enquanto os dados chegam)
  const [copiada, setCopiada] = useState(false)
  const pronta = retrospectivaPronta(viagem.data_fim, hojeTexto())
  const cores = { '--retro-fundo': moldura.fundo, '--retro-destaque': moldura.destaque, '--retro-texto': moldura.texto } as CSSProperties

  async function baixar(c: CartaoDaRetrospectiva) {
    setGerando(c.chave)
    const png = await cartaoEmImagem(c, viagem.nome, moldura)
    setGerando(null)
    if (!png) return
    const arquivo = new File([png], `${viagem.nome} - ${c.chave}.png`, { type: 'image/png' })
    // No celular: compartilhar direto pro Instagram/WhatsApp. No computador: baixa.
    if (navigator.canShare?.({ files: [arquivo] })) {
      try {
        await navigator.share({ files: [arquivo] })
        return
      } catch {
        return // cancelou
      }
    }
    const url = URL.createObjectURL(png)
    const link = document.createElement('a')
    link.href = url
    link.download = arquivo.name
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  async function copiarLegenda() {
    try {
      await navigator.clipboard.writeText(legenda ?? sugerida)
      setCopiada(true)
      setTimeout(() => setCopiada(false), 2000)
    } catch {
      setCopiada(false)
    }
  }

  const temShare = typeof navigator !== 'undefined' && 'share' in navigator

  return (
    <div className="retrospectiva" style={cores}>
      <CabecalhoPagina
        acima={viagem.nome}
        titulo="Retrospectiva"
        subtitulo={pronta ? 'A viagem acabou e a retrospectiva ficou pronta. Toque num cartão pra postar.' : 'Fica pronta sozinha quando a viagem acabar. Já dá pra ver como está ficando.'}
        acao={
          <Link to="../livro" className="botao secundario">
            <BookOpen size={16} aria-hidden="true" /> Caderno em PDF
          </Link>
        }
      />
      {moldura.titulo && (
        <p className="retro-moldura">
          <Icone nome={moldura.icone} size={14} aria-hidden="true" /> {moldura.titulo}
        </p>
      )}

      {(pontos.length > 0 || daCapa.length > 0) && (
        <section className="retro-capa" aria-label="Mapa percorrido e carimbos">
          {pontos.length > 0 && (
            <div className="retro-mapa">
              <MapaMundi pontos={pontos} numerar={false} zoomMaximo={9} />
            </div>
          )}
          {daCapa.length > 0 && (
            <ul className="retro-carimbos">
              {daCapa.map((c, i) => (
                <li key={`${c.nome}-${i}`} className={c.memoria ? 'memoria' : undefined}>
                  <strong style={{ fontSize: fonteDoNomeNoCarimbo(c.nome, 70, 11) }}>{c.nome}</strong>
                  <span>{c.data}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {cartoes.length === 0 ? (
        <p className="form-dica">Ainda não tem números pra mostrar. Volte quando a viagem começar.</p>
      ) : (
        <ul className="retro-cartoes">
          {cartoes.map((c) => (
            <li key={c.chave} className="retro-cartao">
              <span className="retro-viagem">{moldura.titulo ? `${moldura.titulo} · ${viagem.nome}` : viagem.nome}</span>
              <strong className="retro-numero">{c.numero}</strong>
              <span className="retro-titulo">{c.titulo}</span>
              <span className="retro-legenda">{c.legenda}</span>
              <button type="button" className="botao secundario pequeno" onClick={() => baixar(c)} disabled={gerando === c.chave}>
                {temShare ? <Share2 size={14} aria-hidden="true" /> : <Download size={14} aria-hidden="true" />}
                {gerando === c.chave ? ' Gerando…' : temShare ? ' Postar' : ' Baixar'}
              </button>
            </li>
          ))}
          {melhores.length > 0 && (
            <li className="retro-cartao retro-fotos">
              <span className="retro-viagem">
                <Sparkles size={14} aria-hidden="true" /> As mais curtidas
              </span>
              <div className="retro-fotos-grade">
                {melhores.map((p) => (p.fotos[0]?.url ? <img key={p.id} src={p.fotos[0].url} alt={p.legenda ?? ''} /> : null))}
              </div>
            </li>
          )}
        </ul>
      )}

      <section className="retro-bloco">
        <label className="form-rotulo" htmlFor="retro-legenda">
          Legenda pronta
        </label>
        <p className="form-dica">Dá pra trocar o que quiser antes de postar.</p>
        <textarea id="retro-legenda" maxLength={600} rows={3} value={legenda ?? sugerida} onChange={(e) => setLegenda(e.target.value)} />
        <div className="retro-acoes">
          <button type="button" className="botao" onClick={copiarLegenda}>
            <Copy size={16} aria-hidden="true" /> {copiada ? 'Copiada' : 'Copiar legenda'}
          </button>
          {legenda !== null && legenda !== sugerida && (
            <button type="button" className="botao secundario" onClick={() => setLegenda(null)}>
              <RotateCcw size={16} aria-hidden="true" /> Voltar à sugerida
            </button>
          )}
        </div>
      </section>

      <section className="retro-bloco">
        <h2 className="retro-proxima">
          <Users size={18} aria-hidden="true" /> Bora a próxima?
        </h2>
        <p className="form-dica">Uma viagem nova com a mesma galera: todo mundo já entra, sem convite.</p>
        <div className="retro-acoes">
          <Link to={`/nova-viagem?comboio=${viagem.id}`} className="botao">
            Criar a próxima viagem
          </Link>
        </div>
      </section>
    </div>
  )
}

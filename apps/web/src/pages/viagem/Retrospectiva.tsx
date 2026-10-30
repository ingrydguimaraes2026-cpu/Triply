import { useEffect, useMemo, useState } from 'react'
import { Download, Share2, Sparkles } from 'lucide-react'
import { cartoesDaRetrospectiva, estatisticasDoViajante, formatarDinheiro, melhoresPosts, type CartaoDaRetrospectiva } from '@together/core'
import { supabase } from '../../lib/supabase'
import { useViagemAtual } from '../../features/viagens/hooks'
import { useResumoFinanceiro } from '../../features/financeiro/hooks'
import { usePosts } from '../../features/feed/hooks'
import { codigoDoPais, nomeDoPais } from '../../features/documentos/paises'
import { hojeTexto } from '../../features/destinos/datas'
import { cartaoEmImagem } from '../../features/retrospectiva/cartaoEmImagem'
import CabecalhoPagina from '../../components/ui/CabecalhoPagina'
import './retrospectiva.css'

// Retrospectiva (spec 105, K7): cartões "estilo story" com os números da viagem.
// Cada cartão vira um PNG 1080×1920 pra postar.
export default function Retrospectiva() {
  const { viagem, destinos, membros } = useViagemAtual()
  const moeda = viagem.moeda_principal
  const resumo = useResumoFinanceiro(viagem.id, moeda)
  const { estado } = usePosts(viagem.id)
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

  const posts = useMemo(() => (estado.status === 'pronto' ? estado.posts : []), [estado])
  const cartoes = useMemo(() => {
    const comCodigo = destinos.map((d) => ({ ...d, codigo: codigoDoPais(d.pais) }))
    const e = estatisticasDoViajante([viagem], comCodigo, hojeTexto())
    const cidades = [...new Set(comCodigo.filter((d) => d.codigo !== 'BR').map((d) => d.nome))]
    return cartoesDaRetrospectiva({
      nome: viagem.nome,
      dias: e.dias,
      km: e.km,
      cidades,
      paises: e.paises.map(nomeDoPais),
      gastoTotal: resumo && resumo !== 'erro' ? resumo.gasto : null,
      dinheiro: (c) => formatarDinheiro(c, moeda),
      pessoas: membros.length,
      posts: posts.length,
      fotos: posts.reduce((s, p) => s + p.fotos.length, 0),
      curtidas: posts.reduce((s, p) => s + p.curtidas.length, 0),
      lugaresVisitados: visitados,
    })
  }, [viagem, destinos, membros.length, resumo, moeda, posts, visitados])
  const melhores = melhoresPosts(posts, 3)

  async function baixar(c: CartaoDaRetrospectiva) {
    setGerando(c.chave)
    const png = await cartaoEmImagem(c, viagem.nome)
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

  const temShare = typeof navigator !== 'undefined' && 'share' in navigator

  return (
    <div className="retrospectiva">
      <CabecalhoPagina titulo="Retrospectiva" subtitulo="A viagem em números. Toque num cartão pra postar no story." />
      {cartoes.length === 0 ? (
        <p className="form-dica">Ainda não tem números pra mostrar. Volte quando a viagem começar.</p>
      ) : (
        <ul className="retro-cartoes">
          {cartoes.map((c) => (
            <li key={c.chave} className="retro-cartao">
              <span className="retro-viagem">{viagem.nome}</span>
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
    </div>
  )
}

import { useState } from 'react'
import { Download } from 'lucide-react'
import { albumPorDia, montarZip, nomeDaFotoNoZip, type ArquivoDoZip, type Tables } from '@together/core'
import { baixarBytes } from '../../lib/baixar'
import type { Post } from './api'

// Baixar todas as fotos da viagem num .zip (spec 099). Monta no próprio aparelho:
// nada novo no servidor. Nome de cada foto: "2026-11-20_Nice_03.jpg".
type Props = { nomeDaViagem: string; posts: Post[]; destinos: Tables<'destinos'>[] }
export default function BaixarFotos({ nomeDaViagem, posts, destinos }: Props) {
  const [progresso, setProgresso] = useState<{ feitas: number; total: number } | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const total = posts.reduce((s, p) => s + p.fotos.length, 0)
  if (total === 0) return null

  async function baixar() {
    setErro(null)
    setProgresso({ feitas: 0, total })
    const arquivos: ArquivoDoZip[] = []
    let falhas = 0
    try {
      for (const grupo of albumPorDia(posts, destinos)) {
        let n = 0
        for (const post of grupo.posts) {
          for (const foto of post.fotos) {
            n++
            if (!foto.url) {
              falhas++
              continue
            }
            try {
              const r = await fetch(foto.url)
              if (!r.ok) throw new Error(String(r.status))
              arquivos.push({ nome: nomeDaFotoNoZip(grupo.dia, grupo.destino, n), bytes: new Uint8Array(await r.arrayBuffer()), data: new Date(post.criado_em) })
            } catch {
              falhas++
            }
            setProgresso({ feitas: arquivos.length + falhas, total })
          }
        }
      }
      if (arquivos.length === 0) throw new Error('nenhuma foto')
      const nome = `${nomeDaViagem.replace(/[\\/:*?"<>|]/g, '').trim() || 'viagem'} - fotos.zip`
      baixarBytes(nome, montarZip(arquivos), 'application/zip')
      if (falhas > 0) setErro(`${falhas} ${falhas === 1 ? 'foto não veio' : 'fotos não vieram'}. Tente de novo mais tarde pra pegar tudo.`)
    } catch (e) {
      console.error('Erro ao montar o zip:', e)
      setErro('Não deu pra baixar as fotos agora. Tente de novo.')
    }
    setProgresso(null)
  }

  return (
    <div className="baixar-fotos">
      <button type="button" className="botao-texto" onClick={baixar} disabled={progresso !== null}>
        <Download size={15} aria-hidden="true" />
        {progresso ? ` Baixando ${progresso.feitas} de ${progresso.total}…` : ` Baixar todas (${total}) em .zip`}
      </button>
      {erro && <p className="form-dica">{erro}</p>}
    </div>
  )
}

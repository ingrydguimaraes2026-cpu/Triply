import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, Printer } from 'lucide-react'
import { diaNoFuso, paginasDoLivro, roteiroDiaADia, type Tables } from '@together/core'
import { supabase } from '../../lib/supabase'
import { useViagemAtual } from '../../features/viagens/hooks'
import { useTrajetos } from '../../features/transportes/hooks'
import { diaPorExtenso, useEventosDaAgenda } from '../../features/agenda/hooks'
import { usePosts } from '../../features/feed/hooks'
import { formatarPeriodo } from '../../lib/datas'
import Logo from '../../components/ui/Logo'
import './imprimir.css'
import './livro.css'

const FOTOS_POR_DIA = 6

// Livro da viagem (spec 106, K8): uma página por dia com a agenda, o diário e as fotos.
// "Imprimir" → "Salvar como PDF" no navegador.
export default function Livro() {
  const { viagem, destinos, membros } = useViagemAtual()
  const { estado: trajetosEstado } = useTrajetos(viagem.id)
  const { eventos } = useEventosDaAgenda(viagem.id)
  const { estado: postsEstado } = usePosts(viagem.id)
  const [diario, setDiario] = useState<Tables<'diario'>[]>([])

  useEffect(() => {
    supabase
      .from('diario')
      .select('*')
      .eq('viagem_id', viagem.id)
      .eq('visibilidade', 'comboio') // o livro é do grupo: texto "só eu" não entra
      .order('criado_em')
      .then(({ data }) => setDiario(data ?? []))
  }, [viagem.id])

  const paginas = useMemo(() => {
    const trajetos = trajetosEstado.status === 'pronto' ? trajetosEstado.trajetos : []
    const agenda = roteiroDiaADia(viagem.data_inicio, viagem.data_fim, { destinos, trajetos, eventos: eventos ?? [] }).flatMap((d) =>
      d.itens.map((i) => ({ dia: d.dia, chave: i.chave, hora: i.hora, titulo: i.titulo })),
    )
    const posts = postsEstado.status === 'pronto' ? postsEstado.posts : []
    // Mais curtidas primeiro em cada dia
    const fotos = [...posts]
      .sort((a, b) => b.curtidas.length - a.curtidas.length)
      .flatMap((p) => p.fotos.filter((f) => f.url).map((f, i) => ({ dia: diaNoFuso(p.criado_em), id: f.id, url: f.url!, legenda: i === 0 ? p.legenda : null })))
    return paginasDoLivro(agenda, diario, fotos)
  }, [viagem, destinos, trajetosEstado, eventos, postsEstado, diario])

  const nome = (id: string) => membros.find((m) => m.id === id)?.nome.split(' ')[0] ?? 'Alguém'
  const ondeNoDia = (dia: string) => destinos.filter((d) => d.chegada && d.chegada <= dia && (d.saida ?? d.chegada) >= dia).pop()?.nome

  return (
    <div className="imprimir livro">
      <div className="imprimir-barra">
        <Link to={`/viagem/${viagem.id}`} className="botao-texto">
          <ArrowLeft size={16} aria-hidden="true" /> Voltar
        </Link>
        <button type="button" className="botao" onClick={() => window.print()}>
          <Printer size={16} aria-hidden="true" /> Imprimir ou salvar PDF
        </button>
      </div>

      <header className="livro-capa">
        <Logo />
        <h1>{viagem.nome}</h1>
        <p>{formatarPeriodo(viagem.data_inicio, viagem.data_fim)}</p>
        <p>{destinos.map((d) => d.nome).join(' → ')}</p>
        <p className="livro-comboio">{membros.map((m) => m.nome.split(' ')[0]).join(' · ')}</p>
      </header>

      {paginas.length === 0 && <p className="imprimir-vazio">Ainda não tem agenda, diário nem fotos pra montar o livro.</p>}

      {paginas.map((p) => (
        <section key={p.dia} className="livro-dia">
          <h2>
            {diaPorExtenso(p.dia)}
            {ondeNoDia(p.dia) && <small> · {ondeNoDia(p.dia)}</small>}
          </h2>
          {p.agenda.length > 0 && (
            <ul className="livro-agenda">
              {p.agenda.map((a) => (
                <li key={a.chave}>
                  <span className="imprimir-hora">{a.hora || '—'}</span> {a.titulo}
                </li>
              ))}
            </ul>
          )}
          {p.diario.map((d) => (
            <blockquote key={d.id} className="livro-diario">
              <p>{d.texto}</p>
              <cite>{nome(d.autor)}</cite>
            </blockquote>
          ))}
          {p.fotos.length > 0 && (
            <div className="livro-fotos">
              {p.fotos.slice(0, FOTOS_POR_DIA).map((f) => (
                <figure key={f.id}>
                  <img src={f.url} alt={f.legenda ?? ''} />
                  {f.legenda && <figcaption>{f.legenda}</figcaption>}
                </figure>
              ))}
            </div>
          )}
        </section>
      ))}

      <p className="imprimir-rodape">Feito no Together em {new Date().toLocaleDateString('pt-BR')}.</p>
    </div>
  )
}

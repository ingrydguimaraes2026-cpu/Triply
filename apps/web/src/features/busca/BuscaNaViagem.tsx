import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Search } from 'lucide-react'
import { buscarNaViagem, NOMES_DOS_TIPOS, type ItemDeBusca, type Tables } from '@together/core'
import { supabase } from '../../lib/supabase'
import './busca.css'

type Props = { viagemId: string; destinos: Tables<'destinos'>[]; aoEscolher: () => void }

// Monta o índice da viagem (uma leitura de cada tabela, em paralelo)
async function montarIndice(viagemId: string, destinos: Tables<'destinos'>[]): Promise<ItemDeBusca[]> {
  const raiz = `/viagem/${viagemId}`
  const nomeDe = (id: string | null) => destinos.find((d) => d.id === id)?.nome ?? ''
  const [lugares, gastos, hospedagens, trajetos, eventos, tarefas, arquivos, enquetes] = await Promise.all([
    supabase.from('lugares').select('id, nome, observacao, link, destino_id').eq('viagem_id', viagemId),
    supabase.from('gastos').select('id, descricao, data').eq('viagem_id', viagemId),
    supabase.from('hospedagens').select('id, nome, observacao, endereco, link').eq('viagem_id', viagemId),
    supabase.from('trajetos').select('id, origem_id, destino_id, observacao, link_reserva').eq('viagem_id', viagemId),
    supabase.from('eventos_agenda').select('id, titulo, local, observacao').eq('viagem_id', viagemId),
    supabase.from('tarefas').select('id, titulo').eq('viagem_id', viagemId),
    supabase.from('arquivos_viagem').select('id, nome').eq('viagem_id', viagemId),
    supabase.from('enquetes').select('id, pergunta').eq('viagem_id', viagemId),
  ])
  const juntar = (...partes: (string | null | undefined)[]) => partes.filter(Boolean).join(' · ')
  return [
    ...destinos.map((d) => ({ tipo: 'destino' as const, id: d.id, titulo: d.nome, detalhe: d.pais, caminho: raiz })),
    ...(lugares.data ?? []).map((l) => ({ tipo: 'lugar' as const, id: l.id, titulo: l.nome, detalhe: juntar(nomeDe(l.destino_id), l.observacao, l.link), caminho: `${raiz}/lugares?foco=${l.id}` })),
    ...(gastos.data ?? []).map((g) => ({ tipo: 'gasto' as const, id: g.id, titulo: g.descricao, detalhe: g.data, caminho: `${raiz}/financeiro?foco=${g.id}` })),
    ...(hospedagens.data ?? []).map((h) => ({ tipo: 'hospedagem' as const, id: h.id, titulo: h.nome, detalhe: juntar(h.endereco, h.observacao, h.link), caminho: `${raiz}/hospedagem` })),
    ...(trajetos.data ?? []).map((t) => ({
      tipo: 'trajeto' as const,
      id: t.id,
      titulo: `${nomeDe(t.origem_id)} → ${nomeDe(t.destino_id)}`,
      detalhe: juntar(t.observacao, t.link_reserva),
      caminho: `${raiz}/transportes`,
    })),
    ...(eventos.data ?? []).map((e) => ({ tipo: 'evento' as const, id: e.id, titulo: e.titulo, detalhe: juntar(e.local, e.observacao), caminho: `${raiz}/agenda` })),
    ...(tarefas.data ?? []).map((t) => ({ tipo: 'tarefa' as const, id: t.id, titulo: t.titulo, caminho: raiz })),
    ...(arquivos.data ?? []).map((a) => ({ tipo: 'arquivo' as const, id: a.id, titulo: a.nome, caminho: raiz })),
    ...(enquetes.data ?? []).map((e) => ({ tipo: 'enquete' as const, id: e.id, titulo: e.pergunta, caminho: `${raiz}?foco=${e.id}` })),
  ]
}

// Busca na viagem (spec 053), dentro de uma gaveta
export default function BuscaNaViagem({ viagemId, destinos, aoEscolher }: Props) {
  const [indice, setIndice] = useState<ItemDeBusca[] | null>(null)
  const [termo, setTermo] = useState('')

  useEffect(() => {
    let ativo = true
    montarIndice(viagemId, destinos)
      .then((i) => ativo && setIndice(i))
      .catch((e) => {
        console.error('Erro ao montar a busca:', e)
        if (ativo) setIndice([])
      })
    return () => {
      ativo = false
    }
  }, [viagemId, destinos])

  const resultados = indice ? buscarNaViagem(indice, termo) : []

  return (
    <div className="busca-viagem">
      <label className="busca-campo">
        <Search size={18} aria-hidden="true" />
        <input autoFocus type="search" placeholder="Lugar, gasto, reserva, tarefa…" value={termo} onChange={(e) => setTermo(e.target.value)} aria-label="Buscar na viagem" />
      </label>
      {!indice && <p className="carregando-texto">Preparando a busca…</p>}
      {indice && termo.trim().length >= 2 && resultados.length === 0 && <p className="dica">Nada encontrado com "{termo.trim()}".</p>}
      <ul className="busca-resultados">
        {resultados.map((r) => (
          <li key={`${r.tipo}-${r.id}`}>
            <Link to={r.caminho} onClick={aoEscolher}>
              <span className="busca-tipo">{NOMES_DOS_TIPOS[r.tipo]}</span>
              <strong>{r.titulo}</strong>
              {r.detalhe && <small>{r.detalhe}</small>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

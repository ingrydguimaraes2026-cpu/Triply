// Calendário da viagem (spec 036): junta tudo que tem data e baixa um .ics.
// O Google Agenda, o Calendário do iPhone e o Outlook abrem esse arquivo.
import { gerarIcs, nomeDoArquivoIcs, type ItemDoCalendario, type Tables } from '@together/core'
import { supabase } from '../../lib/supabase'
import { meio } from '../transportes/api'

type Viagem = Pick<Tables<'viagens'>, 'id' | 'nome'>
type Destino = Pick<Tables<'destinos'>, 'id' | 'nome' | 'chegada' | 'saida'>

export async function itensDoCalendario(viagem: Viagem, destinos: Destino[]): Promise<ItemDoCalendario[]> {
  const [trajetos, eventos, pontos, hospedagens] = await Promise.all([
    supabase.from('trajetos').select('id, origem_id, destino_id, meio, partida, chegada, observacao').eq('viagem_id', viagem.id),
    supabase.from('eventos_agenda').select('id, dia, hora, titulo, local, observacao').eq('viagem_id', viagem.id),
    supabase.from('pontos_de_encontro').select('id, local, quando, observacao').eq('viagem_id', viagem.id),
    supabase
      .from('hospedagens')
      .select('id, nome, endereco, checkin, checkout, hora_checkin, hora_checkout')
      .eq('viagem_id', viagem.id)
      .eq('escolhida', true),
  ])
  for (const r of [trajetos, eventos, pontos, hospedagens]) if (r.error) throw r.error

  const nomeDe = (id: string | null) => destinos.find((d) => d.id === id)?.nome ?? '?'
  const itens: ItemDoCalendario[] = []

  // Dias em cada destino (dia inteiro)
  for (const d of destinos) {
    if (!d.chegada) continue
    itens.push({ uid: `destino-${d.id}`, titulo: `📍 ${d.nome}`, inicio: d.chegada, fim: d.saida ?? d.chegada })
  }
  for (const t of trajetos.data ?? []) {
    if (!t.partida) continue
    itens.push({
      uid: `trajeto-${t.id}`,
      titulo: `${meio(t.meio).nome}: ${nomeDe(t.origem_id)} → ${nomeDe(t.destino_id)}`,
      inicio: t.partida,
      fim: t.chegada,
      local: nomeDe(t.origem_id),
      descricao: t.observacao,
    })
  }
  for (const e of eventos.data ?? []) {
    itens.push({
      uid: `evento-${e.id}`,
      titulo: e.titulo,
      inicio: e.hora ? `${e.dia}T${e.hora.slice(0, 5)}` : e.dia,
      local: e.local,
      descricao: e.observacao,
    })
  }
  for (const p of pontos.data ?? []) {
    if (!p.quando) continue
    itens.push({ uid: `ponto-${p.id}`, titulo: `Encontro: ${p.local}`, inicio: p.quando, local: p.local, descricao: p.observacao })
  }
  for (const h of hospedagens.data ?? []) {
    if (h.checkin) {
      itens.push({
        uid: `checkin-${h.id}`,
        titulo: `Check-in: ${h.nome}`,
        inicio: h.hora_checkin ? `${h.checkin}T${h.hora_checkin.slice(0, 5)}` : h.checkin,
        local: h.endereco,
      })
    }
    if (h.checkout) {
      itens.push({
        uid: `checkout-${h.id}`,
        titulo: `Check-out: ${h.nome}`,
        inicio: h.hora_checkout ? `${h.checkout}T${h.hora_checkout.slice(0, 5)}` : h.checkout,
        local: h.endereco,
      })
    }
  }
  return itens
}

// Monta e baixa o arquivo
export async function baixarCalendario(viagem: Viagem, destinos: Destino[]): Promise<number> {
  const itens = await itensDoCalendario(viagem, destinos)
  const arquivo = new Blob([gerarIcs(viagem.nome, itens)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(arquivo)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeDoArquivoIcs(viagem.nome)
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return itens.length
}

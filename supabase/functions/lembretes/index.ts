// Função "lembretes" (spec 032): push no celular 1 hora antes de cada trajeto e ponto de encontro,
// e 2 dias antes do fim do cancelamento grátis da hospedagem escolhida (spec 041).
// Chamada a cada 5 min pelo agendamento (pg_cron), sem corpo. Pode rodar de novo sem medo:
// o banco (`lembretes_a_enviar`) só devolve cada lembrete uma vez.
// Quem recebe: todo mundo do comboio da viagem que ligou os avisos no aparelho.
// Segredos: VAPID_PRIVATE_KEY (o mesmo das funções avisos-cambio e avisos-feed).
// Spec 117: e o aviso "falta você opinar" de quem ainda não deslizou um lugar que deu match.
// Spec 110: além do site (Web Push), manda pro app do celular pelo serviço de push do Expo (sem segredo).
// Spec 118c: e "a retrospectiva de X está pronta", uma vez por viagem, no dia seguinte ao fim.
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'
import webpush from 'npm:web-push@3.6.7'

const VAPID_PUBLICA = 'BMT3M0-HThNnW4fGo8UHb2WQkWYQIx6kYd1rSlUQzJt9yyGBDprocMC0zQc5kbUXcKWvqvXoW_6Fnsvr1D_olUI'
const CONTATO = 'https://github.com/ingrydguimaraes2026-cpu/Triply'

type Inscricao = { id: string; usuario_id: string; endpoint: string; p256dh: string; auth: string }
type AparelhoDoApp = { id: string; token: string }
type RetrospectivaPronta = { viagem_id: string; nome: string }
type AvisoDeMatch = { viagem_id: string; usuario_id: string; catalogo_lugar_id: string; lugar: string }
type Lembrete = { tipo: 'trajeto' | 'ponto' | 'cancelamento'; alvo_id: string; viagem_id: string; titulo: string | null; horario: string; meio: string | null }

const json = (dados: unknown, status = 200) =>
  new Response(JSON.stringify(dados), { status, headers: { 'Content-Type': 'application/json' } })

// ---- Cópia de packages/core/src/lembretes.ts (o Deno não importa do pacote). Mudou lá, muda aqui. ----
const NOME_DO_MEIO: Record<string, string> = { aviao: 'do voo', trem: 'do trem', onibus: 'do ônibus', carro: 'de carro', barco: 'do barco', a_pe: 'a pé' }

function faltaQuanto(horario: string, agora = new Date()) {
  const minutos = Math.round((new Date(horario).getTime() - agora.getTime()) / 60000)
  if (minutos <= 1) return 'agora'
  if (minutos < 60) return `em ${minutos} min`
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  return resto ? `em ${horas} h ${resto} min` : `em ${horas} h`
}

function textoDoLembrete(l: Lembrete) {
  const falta = faltaQuanto(l.horario)
  const titulo = l.titulo?.trim() || (l.tipo === 'ponto' ? 'o ponto de encontro' : l.tipo === 'cancelamento' ? 'a hospedagem' : 'o trajeto')
  if (l.tipo === 'cancelamento') {
    const [, m, d] = l.horario.slice(0, 10).split('-')
    return { titulo: 'Cancelamento grátis acabando', corpo: `${titulo}: dá pra cancelar sem pagar só até ${d}/${m}. Ainda vão ficar?`, url: `/viagem/${l.viagem_id}/hospedagem`, tag: `lembrete-cancelamento-${l.alvo_id}` }
  }
  if (l.tipo === 'ponto') {
    return { titulo: `Encontro ${falta}`, corpo: `${titulo}. Não se atrase!`, url: `/viagem/${l.viagem_id}?foco=${l.alvo_id}`, tag: `lembrete-ponto-${l.alvo_id}` }
  }
  const meio = l.meio && NOME_DO_MEIO[l.meio]
  return { titulo: `Saída${meio ? ` ${meio}` : ''} ${falta}`, corpo: `${titulo}. Bilhete e documentos na mão.`, url: `/viagem/${l.viagem_id}/transportes`, tag: `lembrete-trajeto-${l.alvo_id}` }
}
// ---- fim da cópia ----

Deno.serve(async () => {
  const privada = Deno.env.get('VAPID_PRIVATE_KEY')
  if (!privada) return json({ erro: 'Falta o segredo VAPID_PRIVATE_KEY na função.' }, 500)
  webpush.setVapidDetails(CONTATO, VAPID_PUBLICA, privada)
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: lembretes, error } = await admin.rpc('lembretes_a_enviar')
  if (error) return json({ erro: error.message }, 500)

  let enviados = 0
  for (const l of (lembretes ?? []) as Lembrete[]) {
    const { data: membros } = await admin.from('comboio_membros').select('usuario_id').eq('viagem_id', l.viagem_id)
    let pessoas = (membros ?? []).map((m) => m.usuario_id)
    // Spec 067: trajeto com lista de passageiros avisa só quem vai
    if (l.tipo === 'trajeto') {
      const { data: passageiros } = await admin.from('trajeto_passageiros').select('usuario_id').eq('trajeto_id', l.alvo_id)
      const lista = new Set((passageiros ?? []).map((p) => p.usuario_id))
      if (lista.size > 0) pessoas = pessoas.filter((p) => lista.has(p))
    }
    if (pessoas.length === 0) continue

    // Quem desligou esse tipo de aviso (spec G4) não recebe
    const { data: desligados } = await admin
      .from('preferencias_aviso')
      .select('usuario_id')
      .eq('tipo', 'lembretes')
      .eq('ligado', false)
      .in('usuario_id', pessoas)
    const fora = new Set((desligados ?? []).map((d) => d.usuario_id))

    const quem = pessoas.filter((p) => !fora.has(p))
    const { data: aparelhos } = await admin.from('push_inscricoes').select('id, usuario_id, endpoint, p256dh, auth').in('usuario_id', quem)
    const texto = textoDoLembrete(l)
    const dados = JSON.stringify(texto)

    // App do celular (spec 110): o toque abre a viagem certa
    const { data: doApp } = await admin.from('push_expo').select('id, token').in('usuario_id', quem)
    enviados += await mandarPeloExpo((id) => admin.from('push_expo').delete().eq('id', id), (doApp ?? []) as AparelhoDoApp[], {
      title: texto.titulo,
      body: texto.corpo,
      data: { tipo: l.tipo, viagemId: l.viagem_id, url: texto.url },
    })

    for (const a of (aparelhos ?? []) as Inscricao[]) {
      try {
        await webpush.sendNotification({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, dados, { TTL: 60 * 60 })
        enviados++
      } catch (erro) {
        const status = (erro as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) await admin.from('push_inscricoes').delete().eq('id', a.id)
        else console.error('Falha ao enviar push:', status, (erro as Error).message)
      }
    }
  }
  // Spec 117: "falta você opinar" num match do comboio. O banco já devolve no máximo 1 por dia
  // por viagem pra cada pessoa e marca como enviado (pode rodar de novo sem repetir).
  const { data: matches, error: erroDoMatch } = await admin.rpc('avisos_de_match_a_enviar')
  if (erroDoMatch) console.error('Avisos de match:', erroDoMatch.message)
  for (const m of (matches ?? []) as AvisoDeMatch[]) {
    const { data: desligado } = await admin.from('preferencias_aviso').select('usuario_id').eq('tipo', 'lembretes').eq('ligado', false).eq('usuario_id', m.usuario_id)
    if (desligado?.length) continue
    const texto = { titulo: `Falta você opinar no ${m.lugar}`, corpo: 'Deu match no comboio. Você topa ir?', url: `/viagem/${m.viagem_id}/roteiro`, tag: `match-${m.viagem_id}` }
    const { data: doApp } = await admin.from('push_expo').select('id, token').eq('usuario_id', m.usuario_id)
    enviados += await mandarPeloExpo((id) => admin.from('push_expo').delete().eq('id', id), (doApp ?? []) as AparelhoDoApp[], {
      title: texto.titulo,
      body: texto.corpo,
      data: { tipo: 'match', viagemId: m.viagem_id, url: texto.url },
    })
    const { data: aparelhos } = await admin.from('push_inscricoes').select('id, usuario_id, endpoint, p256dh, auth').eq('usuario_id', m.usuario_id)
    for (const a of (aparelhos ?? []) as Inscricao[]) {
      try {
        await webpush.sendNotification({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, JSON.stringify(texto), { TTL: 60 * 60 * 6 })
        enviados++
      } catch (erro) {
        const status = (erro as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) await admin.from('push_inscricoes').delete().eq('id', a.id)
      }
    }
  }

  // Spec 118c: a viagem acabou ontem (ou anteontem): "a retrospectiva está pronta". O banco
  // devolve cada viagem uma vez só, entre 10h e 21h de Brasília, e já marca como avisada.
  const { data: prontas, error: erroDaRetro } = await admin.rpc('retrospectivas_a_avisar')
  if (erroDaRetro) console.error('Avisos de retrospectiva:', erroDaRetro.message)
  for (const r of (prontas ?? []) as RetrospectivaPronta[]) {
    const { data: membros } = await admin.from('comboio_membros').select('usuario_id').eq('viagem_id', r.viagem_id)
    const pessoas = (membros ?? []).map((m) => m.usuario_id)
    if (pessoas.length === 0) continue
    const { data: desligados } = await admin.from('preferencias_aviso').select('usuario_id').eq('tipo', 'resumo').eq('ligado', false).in('usuario_id', pessoas)
    const fora = new Set((desligados ?? []).map((d) => d.usuario_id))
    const quem = pessoas.filter((p) => !fora.has(p))
    if (quem.length === 0) continue
    const texto = { titulo: `A retrospectiva de ${r.nome} está pronta`, corpo: 'Carimbos, fotos mais curtidas e a legenda pronta pra postar.', url: `/viagem/${r.viagem_id}/retrospectiva`, tag: `retrospectiva-${r.viagem_id}` }
    const { data: doApp } = await admin.from('push_expo').select('id, token').in('usuario_id', quem)
    enviados += await mandarPeloExpo((id) => admin.from('push_expo').delete().eq('id', id), (doApp ?? []) as AparelhoDoApp[], {
      title: texto.titulo,
      body: texto.corpo,
      data: { tipo: 'retrospectiva', viagemId: r.viagem_id, url: texto.url },
    })
    const { data: aparelhos } = await admin.from('push_inscricoes').select('id, usuario_id, endpoint, p256dh, auth').in('usuario_id', quem)
    for (const a of (aparelhos ?? []) as Inscricao[]) {
      try {
        await webpush.sendNotification({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, JSON.stringify(texto), { TTL: 60 * 60 * 12 })
        enviados++
      } catch (erro) {
        const status = (erro as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) await admin.from('push_inscricoes').delete().eq('id', a.id)
      }
    }
  }

  // Spec 118d: "Há 1 ano vocês estavam em Floripa". O banco devolve no máximo uma lembrança por
  // pessoa por dia (entre 10h e 21h de Brasília), já sem quem desligou "Lembranças" no Perfil.
  const { data: lembrancas, error: erroDaLembranca } = await admin.rpc('lembrancas_a_avisar')
  if (erroDaLembranca) console.error('Avisos de lembrança:', erroDaLembranca.message)
  for (const l of (lembrancas ?? []) as LembrancaDeHoje[]) {
    const texto = { titulo: tituloDaLembranca(l), corpo: 'Abre pra ver os carimbos, as fotos daquele dia e postar.', url: `/viagem/${l.viagem_id}/retrospectiva`, tag: `lembranca-${l.data}` }
    const { data: doApp } = await admin.from('push_expo').select('id, token').eq('usuario_id', l.usuario_id)
    enviados += await mandarPeloExpo((id) => admin.from('push_expo').delete().eq('id', id), (doApp ?? []) as AparelhoDoApp[], {
      title: texto.titulo,
      body: texto.corpo,
      data: { tipo: 'lembranca', viagemId: l.viagem_id, dia: l.data, url: texto.url },
    })
    const { data: aparelhos } = await admin.from('push_inscricoes').select('id, usuario_id, endpoint, p256dh, auth').eq('usuario_id', l.usuario_id)
    for (const a of (aparelhos ?? []) as Inscricao[]) {
      try {
        await webpush.sendNotification({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, JSON.stringify(texto), { TTL: 60 * 60 * 12 })
        enviados++
      } catch (erro) {
        const status = (erro as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) await admin.from('push_inscricoes').delete().eq('id', a.id)
      }
    }
  }

  return json({ lembretes: lembretes?.length ?? 0, matches: matches?.length ?? 0, retrospectivas: prontas?.length ?? 0, lembrancas: lembrancas?.length ?? 0, enviados })
})

// Serviço de push do Expo: até 100 avisos por chamada; a resposta vem na mesma ordem.
// Aparelho que desinstalou o app (DeviceNotRegistered) sai da lista.
async function mandarPeloExpo(
  esquecer: (id: string) => PromiseLike<unknown>,
  aparelhos: AparelhoDoApp[],
  aviso: { title: string; body: string; data: Record<string, unknown> },
) {
  let enviados = 0
  for (let i = 0; i < aparelhos.length; i += 100) {
    const lote = aparelhos.slice(i, i + 100)
    try {
      const resposta = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(lote.map((a) => ({ to: a.token, sound: 'default', channelId: 'lembretes', ttl: 60 * 60, ...aviso }))),
      })
      const { data: recibos } = (await resposta.json()) as { data?: { status: string; details?: { error?: string } }[] }
      for (const [j, r] of (recibos ?? []).entries()) {
        if (r.status === 'ok') enviados++
        else if (r.details?.error === 'DeviceNotRegistered') await esquecer(lote[j].id)
        else console.error('Falha ao enviar push do app:', r.details?.error)
      }
    } catch (erro) {
      console.error('Serviço do Expo fora do ar:', (erro as Error).message)
    }
  }
  return enviados
}

// O mesmo texto de packages/core/src/ha-um-ano.ts (textoDaLembranca); a função do servidor não importa o core.
type LembrancaDeHoje = { usuario_id: string; viagem_id: string; data: string; anos: number; lugares: string[]; so_o_mes: boolean; sozinho: boolean }
function tituloDaLembranca(l: LembrancaDeHoje) {
  const tempo = l.anos === 1 ? 'Há 1 ano' : `Há ${l.anos} anos`
  const quem = l.sozinho ? 'você estava' : 'vocês estavam'
  const ls = [...new Set(l.lugares)]
  const onde = ls.length <= 1 ? (ls[0] ?? '') : ls.length === 2 ? `${ls[0]} e ${ls[1]}` : `${ls[0]}, ${ls[1]} e mais ${ls.length - 2}`
  return `${tempo} ${quem} em ${onde}`
}

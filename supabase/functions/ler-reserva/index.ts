// Função "ler-reserva" (spec 120b): lê o print, o PDF ou o texto de uma reserva e devolve um
// rascunho (tipo, datas, horários, endereço, código, de quem é). A pessoa confere no app e confirma.
// - A chave da IA fica aqui no servidor (segredo ANTHROPIC_API_KEY), nunca no app.
// - Nada é guardado: o arquivo vai pro cofre pelo app; o texto lido só volta pra quem pediu.
// - Só pra quem tem conta (convidado anônimo não lê reserva).
// Publicar: npx supabase functions deploy ler-reserva (pede OK do Victor e a chave configurada).
import Anthropic from 'npm:@anthropic-ai/sdk@0.136.0'
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (dados: unknown, status = 200) => new Response(JSON.stringify(dados), { status, headers: { 'Content-Type': 'application/json', ...cors } })

// Modelo pequeno com visão (pergunta em aberto da spec 120: "um modelo pequeno com visão")
const MODELO = 'claude-haiku-5-5'
const TAMANHO_MAXIMO = 10 * 1024 * 1024 // igual ao cofre
const IMAGENS = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

const textoOuNulo = { type: ['string', 'null'] }
// Mesmo formato do RascunhoDeReserva de packages/core/src/reserva-lida.ts. Mudou lá, muda aqui.
const ESQUEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['tipo', 'titulo', 'codigo', 'data', 'hora', 'dataFim', 'horaFim', 'origem', 'destino', 'endereco', 'pessoa'],
  properties: {
    tipo: { type: ['string', 'null'], enum: ['voo', 'onibus', 'trem', 'carro', 'casa', 'ingresso', 'restaurante', 'passeio', null] },
    titulo: textoOuNulo,
    codigo: textoOuNulo,
    data: textoOuNulo,
    hora: textoOuNulo,
    dataFim: textoOuNulo,
    horaFim: textoOuNulo,
    origem: textoOuNulo,
    destino: textoOuNulo,
    endereco: textoOuNulo,
    pessoa: textoOuNulo,
  },
}

const INSTRUCOES = `Você lê comprovantes de reserva de viagem (print, PDF ou texto de e-mail) e devolve só os dados que estão escritos neles, em JSON.
Campos:
- tipo: voo, onibus, trem, carro (aluguel), casa (Airbnb, hotel, pousada, hostel), ingresso (show, evento, museu), restaurante ou passeio. Null se não for uma reserva.
- titulo: nome da hospedagem, do evento, do restaurante ou do passeio; em voo, o número do voo (ex.: "LA 3456").
- codigo: código da reserva, localizador ou número do pedido.
- data e hora: partida, check-in ou início do evento. dataFim e horaFim: chegada ou check-out.
- Datas sempre AAAA-MM-DD e horas HH:MM (24 h), no horário local escrito na reserva. Sem ano escrito, use o próximo a partir de HOJE.
- origem e destino: cidades do trajeto (sem o código do aeroporto). Em hospedagem, destino é a cidade da casa.
- endereco: endereço completo do lugar (casa, evento, restaurante, retirada do carro).
- pessoa: nome do passageiro ou hóspede principal.
Não invente: o que não estiver escrito fica null.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors })
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
  const { data: quem } = await admin.auth.getUser(token)
  if (!quem?.user || quem.user.is_anonymous) return json({ erro: 'Faça login com sua conta.' }, 401)

  const chave = Deno.env.get('ANTHROPIC_API_KEY')
  if (!chave) return json({ erro: 'Leitura de reserva ainda não está ligada.' }, 503)

  const corpo = await req.json().catch(() => ({}))
  const hoje = typeof corpo?.hoje === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(corpo.hoje) ? corpo.hoje : new Date().toISOString().slice(0, 10)

  // Monta o pedido: texto colado, imagem (print) ou PDF
  let conteudo: Anthropic.ContentBlockParam[]
  if (typeof corpo?.texto === 'string' && corpo.texto.trim()) {
    conteudo = [{ type: 'text', text: `HOJE: ${hoje}\n\nReserva:\n${corpo.texto.slice(0, 20000)}` }]
  } else if (typeof corpo?.arquivo === 'string' && typeof corpo?.tipo === 'string') {
    const base64 = corpo.arquivo.replace(/\s/g, '')
    if (base64.length * 0.75 > TAMANHO_MAXIMO) return json({ erro: 'Arquivo muito grande: o limite é 10 MB.' }, 413)
    let bloco: Anthropic.ContentBlockParam
    if (corpo.tipo === 'application/pdf') bloco = { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } }
    else if (IMAGENS.has(corpo.tipo)) bloco = { type: 'image', source: { type: 'base64', media_type: corpo.tipo, data: base64 } }
    else return json({ erro: 'Só dá pra ler PDF ou imagem.' }, 400)
    conteudo = [bloco, { type: 'text', text: `HOJE: ${hoje}\n\nLeia esta reserva.` }]
  } else {
    return json({ erro: 'Mande o texto, a imagem ou o PDF da reserva.' }, 400)
  }

  try {
    const cliente = new Anthropic({ apiKey: chave })
    const resposta = await cliente.messages.create({
      model: MODELO,
      max_tokens: 2000,
      system: INSTRUCOES,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: ESQUEMA } },
      messages: [{ role: 'user', content: conteudo }],
    })
    if (resposta.stop_reason === 'refusal') return json({ rascunho: null })
    const texto = resposta.content.find((b) => b.type === 'text')
    if (!texto || texto.type !== 'text') return json({ rascunho: null })
    // O app limpa de novo (normalizarRascunho), então aqui só confere se é JSON
    return json({ rascunho: JSON.parse(texto.text) })
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json({ erro: 'Muita leitura agora. Tente de novo em instantes.' }, 429)
    if (e instanceof Anthropic.APIError) console.error('Erro da IA:', e.status, e.message)
    else console.error('Erro ao ler a reserva:', e)
    return json({ rascunho: null })
  }
})

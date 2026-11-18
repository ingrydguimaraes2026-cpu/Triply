// Fotos de demonstração na Eurotrip da conta de QA (depois do copiar-eurotrip.sql).
// A Eurotrip de verdade só tem 1 foto, e o arquivo dela não dá pra copiar (o storage é privado).
// Então este script posta 5 posts com fotos do nosso catálogo (Wikimedia Commons, as mesmas do Explorar),
// cada um de alguém do comboio de demonstração, com curtidas e comentários.
// Créditos e licenças de cada foto: passeio/CREDITOS-FOTOS.md (escrito por este script).
// Se a viagem já tiver posts, para sem mexer em nada.
// Uso (dentro de docs/marketing/video): node passeio/fotos-demo.mjs
import { randomUUID } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { clienteAdminDeQa, contaDeQa } from './login-qa.mjs'

const AQUI = path.dirname(fileURLToPath(import.meta.url))
const admin = clienteAdminDeQa()

// autor = nome no perfil; fotos = [cidade do catálogo, lugar do catálogo]; dias = há quantos dias foi postado
const POSTS = [
  { autor: 'Lívia', destino: 'Nice', dias: 9, legenda: 'Contagem regressiva pra Nice. Esse mar já é nosso',
    fotos: [['Nice', 'Colline du Château'], ['Nice', 'Russian Orthodox Cathedral, Nice']] },
  { autor: 'Ana Clara', destino: 'Mónaco', dias: 7, legenda: 'Bate e volta em Mônaco confirmado!',
    fotos: [['Mónaco', 'Palácio do príncipe do Mónaco']] },
  { autor: 'Beto', destino: 'Bernina', dias: 5, legenda: 'Bilhetes do Bernina Express comprados. Janela é minha',
    fotos: [['Bernina', 'Munt Pers'], ['Bernina', 'Piz Albris']] },
  { autor: 'Juliana', destino: 'Roma', dias: 3, legenda: 'Coliseu pago. Agora é só chegar',
    fotos: [['Roma', 'Coliseu de Roma'], ['Roma', 'Panteão']] },
  { autor: 'Lívia', destino: 'Paris', dias: 1, legenda: 'E Paris pra fechar com chave de ouro',
    fotos: [['Paris', 'Torre Eiffel'], ['Paris', 'Museu do Louvre']] },
]
const COMENTARIOS = [
  ['Beto', 0, 'Já tô sentindo o cheiro de maresia'],
  ['Juliana', 2, 'Janela é sua só na ida, hein'],
  ['Ana Clara', 3, 'Vou levar tênis bom pra andar'],
  ['Juliana', 4, 'Chorei'],
]

const falhou = (o, e) => { if (e) throw new Error(`${o}: ${e.message}`) }

const demo = await contaDeQa(admin)
if (!demo) throw new Error('A conta demo@norti.test não existe.')
const { data: viagem, error: e1 } = await admin.from('viagens').select('id').eq('criado_por', demo.id).eq('nome', 'Eurotrip').maybeSingle()
falhou('viagem', e1)
if (!viagem) throw new Error('Rode antes o copiar-eurotrip.sql.')
const { count, error: e2 } = await admin.from('posts').select('id', { count: 'exact', head: true }).eq('viagem_id', viagem.id)
falhou('posts', e2)
if (count) { console.log(`A viagem já tem ${count} posts. Nada feito.`); process.exit(0) }

const { data: membros, error: e3 } = await admin.from('comboio_membros').select('usuario_id, perfis(nome)').eq('viagem_id', viagem.id)
falhou('comboio', e3)
const pessoa = Object.fromEntries(membros.map((m) => [m.perfis?.nome, m.usuario_id]))
const { data: destinos, error: e4 } = await admin.from('destinos').select('id, nome').eq('viagem_id', viagem.id)
falhou('destinos', e4)
const destino = Object.fromEntries(destinos.map((d) => [d.nome, d.id]))

const creditos = []
const idsDosPosts = []
for (const p of POSTS) {
  const postId = randomUUID()
  const quando = new Date(Date.now() - p.dias * 86400000).toISOString()
  const fotos = []
  for (const [i, [cidade, nome]] of p.fotos.entries()) {
    const { data: lugar, error } = await admin.from('catalogo_lugares')
      .select('foto_url, foto_autor, foto_licenca, foto_pagina, catalogo_cidades!inner(nome)')
      .eq('nome', nome).eq('catalogo_cidades.nome', cidade).not('foto_url', 'is', null).limit(1).maybeSingle()
    falhou(`catálogo ${nome}`, error)
    if (!lugar) throw new Error(`Sem foto no catálogo: ${nome} (${cidade})`)
    const resposta = await fetch(lugar.foto_url, { headers: { 'User-Agent': 'NortiDemoVideo/1.0 (video de demonstracao)' } })
    if (!resposta.ok) throw new Error(`Não baixou a foto de ${nome}: ${resposta.status}`)
    const corpo = Buffer.from(await resposta.arrayBuffer())
    const caminho = `${viagem.id}/${postId}/${randomUUID()}.jpg`
    const { error: eUp } = await admin.storage.from('fotos').upload(caminho, corpo, { contentType: 'image/jpeg' })
    falhou(`upload ${nome}`, eUp)
    fotos.push({ viagem_id: viagem.id, destino_id: destino[p.destino], enviada_por: pessoa[p.autor], caminho, post_id: postId, ordem: i, criado_em: quando })
    creditos.push(`| ${nome} (${cidade}) | ${lugar.foto_autor ?? 'sem autor informado'} | ${lugar.foto_licenca ?? '?'} | ${lugar.foto_pagina ?? ''} |`)
    console.log('foto ok', nome)
  }
  const { error: ePost } = await admin.from('posts').insert({ id: postId, viagem_id: viagem.id, destino_id: destino[p.destino], autor: pessoa[p.autor], legenda: p.legenda, criado_em: quando })
  falhou('post', ePost)
  const { error: eFotos } = await admin.from('fotos').insert(fotos)
  falhou('fotos', eFotos)
  // Todo mundo menos o autor curte
  const curtidas = Object.entries(pessoa).filter(([nome]) => nome !== p.autor).map(([, id]) => ({ post_id: postId, usuario_id: id, criado_em: quando }))
  const { error: eCurt } = await admin.from('curtidas').insert(curtidas)
  falhou('curtidas', eCurt)
  idsDosPosts.push(postId)
}
for (const [autor, post, texto] of COMENTARIOS) {
  const { error } = await admin.from('comentarios').insert({ post_id: idsDosPosts[post], autor: pessoa[autor], texto })
  falhou('comentário', error)
}

await writeFile(path.join(AQUI, 'CREDITOS-FOTOS.md'), [
  '# Créditos das fotos do vídeo de demonstração',
  '',
  'Fotos do Wikimedia Commons (as mesmas do catálogo do Explorar), postadas na Eurotrip da conta demo@norti.test',
  'pelo `fotos-demo.mjs`. Se o vídeo for pra divulgação, as licenças CC BY e CC BY-SA pedem crédito ao autor.',
  '',
  '| Lugar | Autor | Licença | Página |',
  '|---|---|---|---|',
  ...creditos,
  '',
].join('\n'))
console.log(`${POSTS.length} posts criados na viagem ${viagem.id}`)

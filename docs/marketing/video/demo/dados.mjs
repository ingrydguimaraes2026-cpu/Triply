// Dados de mentira do modo demonstração: um comboio de 4 indo pra Europa (base: a Eurotrip da Ingryd).
// Os lugares e as fotos vêm do catálogo do Explorar (Wikimedia, com autor e licença).
export const VIAGEM = '7a1e0000-0000-4000-8000-000000000001'
const id = (n) => `7a1e0000-0000-4000-8000-${String(n).padStart(12, '0')}`

export const EU = { id: id('a1'), nome: 'Paulo Victor', email: 'demo@tripwave.app' }
const ANA = { id: id('a2'), nome: 'Ana Clara' }
const JU = { id: id('a3'), nome: 'Juliana' }
const BETO = { id: id('a4'), nome: 'Beto' }
export const PESSOAS = [EU, ANA, JU, BETO]

export const PARIS = id('d1')
const NICE = id('d2')
const ROMA = id('d3')
const destinos = [
  { id: PARIS, viagem_id: VIAGEM, nome: 'Paris', pais: 'França', ordem: 0, chegada: '2027-06-04', saida: '2027-06-07', dias: 4, latitude: 48.85341, longitude: 2.3488 },
  { id: NICE, viagem_id: VIAGEM, nome: 'Nice', pais: 'França', ordem: 1, chegada: '2027-06-08', saida: '2027-06-09', dias: 2, latitude: 43.70313, longitude: 7.26608 },
  { id: ROMA, viagem_id: VIAGEM, nome: 'Roma', pais: 'Itália', ordem: 2, chegada: '2027-06-10', saida: '2027-06-12', dias: 3, latitude: 41.89193, longitude: 12.51133 },
]

const perfis = PESSOAS.map((p) => ({ id: p.id, nome: p.nome, avatar_url: null, criado_em: '2026-10-01T12:00:00Z' }))
const membros = PESSOAS.map((p, i) => ({ viagem_id: VIAGEM, usuario_id: p.id, papel: i === 0 ? 'adm' : 'membro', entrou_em: '2026-10-02T12:00:00Z', arquivada_em: null, perfis: perfis[i] }))

const viagem = {
  id: VIAGEM, nome: 'Eurotrip', data_inicio: '2027-06-04', data_fim: '2027-06-12', moeda_principal: 'EUR', criado_por: EU.id, criado_em: '2026-10-02T12:00:00Z',
  membro_edita_roteiro: true, membro_edita_transportes: true, membro_edita_orcamento: false,
  destinos: destinos.map(({ nome, ordem }) => ({ nome, ordem })),
  comboio_membros: membros.map(({ papel, perfis }) => ({ papel, perfis: { id: perfis.id, nome: perfis.nome, avatar_url: null } })),
}

// ---------- Catálogo do Explorar (copiado do banco) ----------
const CIDADE_PARIS = 'ae00349e-0bd6-459b-bd32-eba3270472b0'
const CIDADE_ROMA = 'deb63080-7425-4355-a858-9f5e49d3f45e'
const foto = (arquivo, largura = 960) => `https://thumb.wikimedia.org/wikipedia/commons/thumb/${arquivo}/${largura}px-${arquivo.split('/').pop()}`
const lugar = (o) => ({ estilos: ['cultura'], bairro: null, por_que: null, sobre: null, tempo_min: 90, gratis: false, melhor_hora: 'Manhã', foto_autor: null, foto_licenca: null, foto_pagina: null, link_wikipedia: null, fonte: 'wikidata', criado_em: '2026-10-01T12:00:00Z', ...o })
const catalogo = [
  lugar({ id: '5f7bfdc7-cf60-44d6-9bba-fda5ad1aa43a', cidade_id: CIDADE_PARIS, nome: 'Torre Eiffel', bairro: '7.º arrondissement', tipo: 'monumento', estilos: ['cultura', 'fotogenica'], fama: 200, por_que: 'O cartão-postal de Paris, de dia e piscando à noite', sobre: 'Torre de ferro de 330 metros no Champ de Mars.', tempo_min: 90, gratis: true, melhor_hora: 'Pôr do sol', foto_url: foto('a/a8/Tour_Eiffel_Wikimedia_Commons.jpg'), foto_autor: 'Benh LIEU SONG', foto_licenca: 'Domínio público', wikidata: 'Q243', latitude: 48.858296, longitude: 2.294479 }),
  lugar({ id: '0f8afaed-f770-4ab0-96b1-a83550f5478e', cidade_id: CIDADE_PARIS, nome: 'Basílica de Sacré-Cœur', bairro: 'Montmartre', tipo: 'igreja', estilos: ['cultura', 'fotogenica'], fama: 195, por_que: 'A vista mais bonita de Paris, no alto de Montmartre', sobre: 'Basílica branca no ponto mais alto da cidade.', tempo_min: 60, gratis: true, melhor_hora: 'Manhã', foto_url: foto('c/c5/Le_sacre_coeur.jpg'), foto_autor: 'Tonchino', foto_licenca: 'CC BY-SA 3.0', wikidata: 'Q28785', latitude: 48.88665, longitude: 2.34295 }),
  lugar({ id: 'df72d8da-93ee-45eb-98e1-2946d473bf79', cidade_id: CIDADE_PARIS, nome: 'Museu do Louvre', bairro: 'Saint-Germain-l’Auxerrois', tipo: 'museu', fama: 170, por_que: 'A Mona Lisa e a pirâmide de vidro', sobre: 'O maior museu de arte do mundo.', tempo_min: 180, foto_url: foto('2/28/Cour_Napol%C3%A9on_at_night_-_Louvre.jpg'), foto_autor: 'Benh LIEU SONG', foto_licenca: 'CC BY 2.5', wikidata: 'Q19675', latitude: 48.861111, longitude: 2.335833 }),
  lugar({ id: 'f23bf022-c39c-433d-a41c-2e6f4213f1cd', cidade_id: CIDADE_PARIS, nome: 'Museu de Orsay', bairro: '7.º arrondissement', tipo: 'museu', fama: 122, por_que: 'Monet e Van Gogh numa estação de trem', foto_url: foto('b/b3/Gare_d%27Orsay_%2849570190081%29.jpg'), foto_autor: 'Cheng-en Cheng', foto_licenca: 'CC BY-SA 2.0', wikidata: 'Q23402', latitude: 48.859972, longitude: 2.326527 }),
  lugar({ id: '6bd0f954-2c15-4658-8bbe-e573e77cb107', cidade_id: CIDADE_PARIS, nome: 'Sainte-Chapelle', bairro: 'Île de la Cité', tipo: 'igreja', fama: 58, por_que: 'Vitrais do chão ao teto', foto_url: foto('4/40/Paris_Sainte_Chapelle_East_View_02.JPG'), foto_autor: 'Uoaei1', foto_licenca: 'CC BY-SA 4.0', wikidata: 'Q193193', latitude: 48.855369, longitude: 2.345028 }),
  lugar({ id: '9935e566-1fd6-4127-82b6-c56a9425f3f2', cidade_id: CIDADE_PARIS, nome: 'Jardim de Luxemburgo', bairro: '6.º arrondissement', tipo: 'parque', estilos: ['ar_livre', 'romantica'], fama: 51, por_que: 'Piquenique de domingo à parisiense', gratis: true, melhor_hora: 'Tarde', foto_url: foto('1/16/Jardin_du_Luxembourg.JPG'), foto_autor: 'Rdevany', foto_licenca: 'CC BY-SA 3.0', wikidata: 'Q309458', latitude: 48.846944, longitude: 2.337222 }),
  lugar({ id: 'a2b22a80-9f5f-4b1f-ade6-b5d866196b66', cidade_id: CIDADE_PARIS, nome: 'Centro Georges Pompidou', bairro: 'Le Marais', tipo: 'museu', fama: 63, por_que: 'Arte moderna num prédio do avesso', foto_url: foto('7/7d/Paris_Montmartre_Blick_aufs_Centre_Georges-Pompidou.jpg'), foto_autor: 'Zairon', foto_licenca: 'CC BY-SA 4.0', wikidata: 'Q178065', latitude: 48.860642, longitude: 2.352245 }),
  lugar({ id: '4f4dfa98-034e-4071-8dfc-3e09867d7e83', cidade_id: CIDADE_ROMA, nome: 'Coliseu', tipo: 'sitio_historico', fama: 200, foto_url: foto('d/de/Colosseo_2020.jpg'), wikidata: 'Q10285', latitude: 41.8902, longitude: 12.4922 }),
  lugar({ id: 'dfb344b9-5649-4632-b03c-09e6ac5a50db', cidade_id: CIDADE_ROMA, nome: 'Basílica de São Pedro', tipo: 'igreja', fama: 190, foto_url: foto('f/f5/Basilica_di_San_Pietro_in_Vaticano_September_2015-1a.jpg'), wikidata: 'Q12512', latitude: 41.9022, longitude: 12.4539 }),
  lugar({ id: 'dd47266e-0fcc-47fe-81c7-2e7be187865c', cidade_id: CIDADE_ROMA, nome: 'Panteão', tipo: 'igreja', fama: 180, foto_url: foto('7/7b/Pantheon_%28Rome%29_-_Right_side_and_front.jpg'), wikidata: 'Q99309', latitude: 41.8986, longitude: 12.4769 }),
]
const cidades = [
  { id: CIDADE_PARIS, chave: 'paris|fr', situacao: 'pronta', regiao: 'Île-de-France' },
  { id: CIDADE_ROMA, chave: 'roma|it', situacao: 'pronta', regiao: 'Lácio' },
]

// ---------- Quem quer o quê (o resto do comboio já deslizou Paris) ----------
const QUEREM = {
  'Torre Eiffel': [ANA, JU, BETO],
  'Museu do Louvre': [ANA, BETO, JU],
  'Basílica de Sacré-Cœur': [ANA, JU], // o "quero" do Paulo fecha o match no vídeo
  'Jardim de Luxemburgo': [JU, BETO],
  'Museu de Orsay': [BETO],
}
const escolhas = Object.entries(QUEREM).flatMap(([nome, quem]) => {
  const c = catalogo.find((l) => l.nome === nome)
  return quem.map((p, i) => ({ viagem_id: VIAGEM, destino_id: PARIS, usuario_id: p.id, catalogo_lugar_id: c.id, escolha: 'quero', criado_em: `2026-10-2${i}T18:00:00Z` }))
})
function matchesDaViagem() {
  return Object.entries(QUEREM).map(([nome, quem]) => {
    const c = catalogo.find((l) => l.nome === nome)
    return { catalogo_lugar_id: c.id, destino_id: PARIS, nome: c.nome, foto_url: c.foto_url, querem: quem.length, quem: quem.map((p) => p.id), no_dia: false }
  })
}

// ---------- Roteiro de Roma já montado (carrossel da aba Viagem) ----------
const lugaresDaViagem = catalogo
  .filter((c) => c.cidade_id === CIDADE_ROMA)
  .map((c, i) => ({ id: id(`1${i}`), viagem_id: VIAGEM, destino_id: ROMA, tipo: 'passeio', nome: c.nome, wikidata: c.wikidata, latitude: c.latitude, longitude: c.longitude, criado_por: ANA.id, criado_em: '2026-10-25T12:00:00Z', visitado_em: null, link: null, horario: null, preco: null, moeda: null, observacao: null, endereco: null }))
const roteiros = [{ destino_id: ROMA, viagem_id: VIAGEM, dias: [[lugaresDaViagem[0].id], [lugaresDaViagem[1].id], [lugaresDaViagem[2].id]], atualizado_por: ANA.id, atualizado_em: '2026-10-25T12:00:00Z', destinos: { ordem: 2 } }]

// ---------- Onde dormir em Paris: duelo de 2 ----------
const hospedagem = (o) => ({ viagem_id: VIAGEM, destino_id: PARIS, moeda: 'EUR', checkin: '2027-06-04', checkout: '2027-06-08', escolhida: false, link: null, observacao: null, etiquetas: null, nota: null, criado_em: '2026-10-26T12:00:00Z', ...o })
const hospedagens = [
  hospedagem({ id: id('h1'), nome: 'Apê em Montmartre', preco_total: 680, criado_por: ANA.id, foto_url: foto('c/c5/Le_sacre_coeur.jpg'), hospedagem_votos: [{ usuario_id: ANA.id }, { usuario_id: JU.id }] }),
  hospedagem({ id: id('h2'), nome: 'Loft no Marais', preco_total: 720, criado_por: BETO.id, foto_url: foto('7/7d/Paris_Montmartre_Blick_aufs_Centre_Georges-Pompidou.jpg'), hospedagem_votos: [{ usuario_id: BETO.id }] }),
]

// ---------- Contas ----------
const gasto = (n, quem, descricao, valor, categoria, data) => ({
  id: id(`9${n}`), viagem_id: VIAGEM, pago_por: quem.id, criado_por: quem.id, descricao, valor, moeda: 'EUR', categoria, pessoal: false, data, criado_em: `${data}T20:0${n}:00Z`, rascunho: false, meio_pagamento: null, cotacao_reais: null,
  gasto_divisoes: PESSOAS.map((p) => ({ usuario_id: p.id, valor: Math.round((valor / PESSOAS.length) * 100) / 100 })),
})
const gastos = [
  gasto(1, BETO, 'Trem Paris → Nice', 236, 'transporte', '2026-10-28'),
  gasto(2, ANA, 'Ingressos do Louvre', 88, 'passeios', '2026-10-30'),
  gasto(3, JU, 'Seguro viagem', 156, 'outros', '2026-11-01'),
]

export const DADOS = {
  tabelas: {
    viagens: [viagem],
    destinos,
    perfis,
    comboio_membros: membros,
    catalogo_cidades: cidades,
    catalogo_lugares: catalogo,
    explorar_escolhas: escolhas,
    lugares: lugaresDaViagem,
    roteiros,
    hospedagens,
    gastos,
    carteiras_com_saldo: [{ viagem_id: VIAGEM, usuario_id: EU.id, saldo_atual: 310 }],
  },
  rpc: {
    matches_da_viagem: matchesDaViagem,
    saldo_euro_do_comboio: () => 1240,
    // O gasto lançado no vídeo entra na conversa (só na memória desta gravação)
    salvar_gasto: ({ p_gasto, p_divisoes }) => {
      gastos.push({ ...p_gasto, viagem_id: VIAGEM, criado_por: EU.id, criado_em: new Date().toISOString(), meio_pagamento: null, cotacao_reais: null, gasto_divisoes: p_divisoes ?? [] })
      return p_gasto.id
    },
  },
  funcoes: {},
}

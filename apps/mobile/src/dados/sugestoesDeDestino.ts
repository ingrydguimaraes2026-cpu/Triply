// Cidades sugeridas na primeira tela do onboarding. Só entram cidades com catálogo cheio no Explorar
// (20+ lugares com foto): com catálogo pequeno o deslize mostra cartão sem foto e o roteiro sai magro.
// A cada abertura sorteamos 6 (3 do Brasil
// e 3 de fora), pra a tela não ficar sempre igual. Fotos do Wikimedia Commons (crédito no cartão);
// ficam fixas aqui porque nessa hora a pessoa ainda não entrou e o catálogo só abre pra quem entrou.
// Pra trocar uma foto: o caminho é o pedaço depois de ".../commons/thumb/" (use a largura 500px).

export type SugestaoDeDestino = { nome: string; pais: string; clima: string; foto: string; credito: string }

const FOTO = (caminho: string) => `https://thumb.wikimedia.org/wikipedia/commons/thumb/${caminho}`

export const SUGESTOES_DE_DESTINO: SugestaoDeDestino[] = [
  // Brasil
  { nome: 'Rio de Janeiro', pais: 'BR', clima: 'Praia, samba e vista lá do alto', foto: FOTO('0/04/Rio_de_Janeiro_skyline_and_Sugarloaf_Mountain_at_sunset%2C_Brazil_3.jpg/500px-Rio_de_Janeiro_skyline_and_Sugarloaf_Mountain_at_sunset%2C_Brazil_3.jpg'), credito: 'Wilfredor · CC0' },
  { nome: 'Salvador', pais: 'BR', clima: 'Pelourinho, axé e acarajé', foto: FOTO('5/5b/Largo_do_Pelourinho%2C_Salvador_20150719-DSC05452.JPG/500px-Largo_do_Pelourinho%2C_Salvador_20150719-DSC05452.JPG'), credito: 'Matti Blume · CC BY-SA 4.0' },
  { nome: 'São Paulo', pais: 'BR', clima: 'Comida, museus e noite sem fim', foto: FOTO('7/75/Vista_a%C3%A9rea_de_la_Avenida_Paulista_de_S%C3%A3o_Paulo_05.jpg/500px-Vista_a%C3%A9rea_de_la_Avenida_Paulista_de_S%C3%A3o_Paulo_05.jpg'), credito: 'ProtoplasmaKid · CC BY-SA 4.0' },
  { nome: 'Recife', pais: 'BR', clima: 'Frevo, praia e centro histórico', foto: FOTO('2/2a/Capela_Dourada%2C_Recife%2C_Pernambuco%2C_Brasil.jpg/500px-Capela_Dourada%2C_Recife%2C_Pernambuco%2C_Brasil.jpg'), credito: 'Wilfredor · CC0' },
  { nome: 'Belém', pais: 'BR', clima: 'Açaí, Ver-o-Peso e Amazônia', foto: FOTO('2/25/Belem-TeatroPaz1.jpg/500px-Belem-TeatroPaz1.jpg'), credito: 'Celso R. de Abreu Silva · CC BY 2.0' },
  { nome: 'Curitiba', pais: 'BR', clima: 'Parques, jardins e Niemeyer', foto: FOTO('9/94/%27JardimBotanico.BotanicalGarden.CuritibaParanaBrasilBrazil.JPG/500px-%27JardimBotanico.BotanicalGarden.CuritibaParanaBrasilBrazil.JPG'), credito: 'SamirNosteb · CC BY-SA 2.5' },
  // Fora do Brasil
  { nome: 'Lisboa', pais: 'PT', clima: 'Miradouros e pastel de nata', foto: FOTO('e/e8/Plaza_del_Comercio%2C_Lisboa%2C_Portugal%2C_2012-05-12%2C_DD_01-03_PAN.jpg/500px-Plaza_del_Comercio%2C_Lisboa%2C_Portugal%2C_2012-05-12%2C_DD_01-03_PAN.jpg'), credito: 'Diego Delso · CC BY-SA 3.0' },
  { nome: 'Porto', pais: 'PT', clima: 'Vinho, Ribeira e pontes', foto: FOTO('e/e5/Puente_Don_Luis_I%2C_Oporto%2C_Portugal%2C_2012-05-09%2C_DD_13.JPG/500px-Puente_Don_Luis_I%2C_Oporto%2C_Portugal%2C_2012-05-09%2C_DD_13.JPG'), credito: 'Diego Delso · CC BY-SA 3.0' },
  { nome: 'Paris', pais: 'FR', clima: 'Museus, cafés e a Torre', foto: FOTO('a/a8/Tour_Eiffel_Wikimedia_Commons.jpg/500px-Tour_Eiffel_Wikimedia_Commons.jpg'), credito: 'Benh Lieu Song · domínio público' },
  { nome: 'Buenos Aires', pais: 'AR', clima: 'Tango, parrilla e livrarias', foto: FOTO('1/15/ObeliscoBA2015.jpg/500px-ObeliscoBA2015.jpg'), credito: 'Sebastianalmaraz · CC BY-SA 4.0' },
  { nome: 'Roma', pais: 'IT', clima: 'Coliseu, massa e gelato', foto: FOTO('d/de/Colosseo_2020.jpg/500px-Colosseo_2020.jpg'), credito: 'Wikimedia Commons · CC BY-SA 4.0' },
  { nome: 'Florença', pais: 'IT', clima: 'Arte por todo canto', foto: FOTO('7/77/Florence_Duomo_from_Michelangelo_hill.jpg/500px-Florence_Duomo_from_Michelangelo_hill.jpg'), credito: 'Petar Milošević · CC BY-SA 4.0' },
  { nome: 'Barcelona', pais: 'ES', clima: 'Gaudí, praia e tapas', foto: FOTO('f/f8/G%C3%BCell_BCN_edited.jpg/500px-G%C3%BCell_BCN_edited.jpg'), credito: 'Canaan · CC BY-SA 4.0' },
  { nome: 'Sevilha', pais: 'ES', clima: 'Flamenco e pátios floridos', foto: FOTO('a/ab/CATEDRAL_DE_SEVILLA.jpg/500px-CATEDRAL_DE_SEVILLA.jpg'), credito: 'Pepe Gadeiras · CC BY-SA 4.0' },
  { nome: 'Atenas', pais: 'GR', clima: 'Acrópole e ilhas logo ali', foto: FOTO('c/c6/Attica_06-13_Athens_50_View_from_Philopappos_-_Acropolis_Hill.jpg/500px-Attica_06-13_Athens_50_View_from_Philopappos_-_Acropolis_Hill.jpg'), credito: 'A.Savin · CC BY-SA 3.0' },
  { nome: 'Londres', pais: 'GB', clima: 'Museus de graça e pubs', foto: FOTO('b/b4/Buckingham_Palace%2C_London_-_April_2009.jpg/500px-Buckingham_Palace%2C_London_-_April_2009.jpg'), credito: 'Diliff · CC BY-SA 3.0' },
  { nome: 'Edimburgo', pais: 'GB', clima: 'Castelo, becos e lendas', foto: FOTO('4/4c/Edinburgh_Castle_from_the_Grassmarket.jpg/500px-Edinburgh_Castle_from_the_Grassmarket.jpg'), credito: 'Stephencdickson · CC BY-SA 4.0' },
  { nome: 'Amsterdã', pais: 'NL', clima: 'Canais, bikes e museus', foto: FOTO('1/1b/Rijksmuseum_in_Amsterdam.jpg/500px-Rijksmuseum_in_Amsterdam.jpg'), credito: 'Marco Almbauer · CC BY-SA 3.0' },
  { nome: 'Praga', pais: 'CZ', clima: 'Cidade de conto de fadas', foto: FOTO('2/20/Prague_07-2016_View_from_Petrinska_Tower_img2.jpg/500px-Prague_07-2016_View_from_Petrinska_Tower_img2.jpg'), credito: 'A.Savin · FAL' },
  { nome: 'Budapeste', pais: 'HU', clima: 'Banhos termais e o Danúbio', foto: FOTO('3/35/20190502_Zamek_w_Budapeszcie_0647_1862_DxO.jpg/500px-20190502_Zamek_w_Budapeszcie_0647_1862_DxO.jpg'), credito: 'Jakub Hałun · CC BY-SA 4.0' },
  { nome: 'Istambul', pais: 'TR', clima: 'Entre a Europa e a Ásia', foto: FOTO('1/12/Exterior_of_Sultan_Ahmed_I_Mosque_in_Istanbul%2C_Turkey_002.jpg/500px-Exterior_of_Sultan_Ahmed_I_Mosque_in_Istanbul%2C_Turkey_002.jpg'), credito: 'Moonik · CC BY-SA 3.0' },
  { nome: 'Marrakech', pais: 'MA', clima: 'Mercados, cores e temperos', foto: FOTO('c/c3/MoroccoMarrakech_DjemaaElFna..jpg/500px-MoroccoMarrakech_DjemaaElFna..jpg'), credito: 'Dániel Csörföly · CC BY-SA 3.0' },
  { nome: 'Cidade do Cabo', pais: 'ZA', clima: 'Montanha, mar e vinho', foto: FOTO('9/9f/Cape_Town_Table_Mountain.jpg/500px-Cape_Town_Table_Mountain.jpg'), credito: 'Matthiasmullie · CC BY-SA 4.0' },
  { nome: 'Nova York', pais: 'US', clima: 'A cidade que nunca dorme', foto: FOTO('f/f0/Brooklyn_Bridge_and_the_Lower_Manhattan_skyline_from_Pebble_Beach%2C_New_York.jpg/500px-Brooklyn_Bridge_and_the_Lower_Manhattan_skyline_from_Pebble_Beach%2C_New_York.jpg'), credito: 'Christian David · CC BY-SA 4.0' },
  { nome: 'Cusco', pais: 'PE', clima: 'Porta de entrada pra Machu Picchu', foto: FOTO('6/60/Sacsayhuam%C3%A1n%2C_Cusco%2C_Per%C3%BA%2C_2015-07-31%2C_DD_27.JPG/500px-Sacsayhuam%C3%A1n%2C_Cusco%2C_Per%C3%BA%2C_2015-07-31%2C_DD_27.JPG'), credito: 'Diego Delso · CC BY-SA 4.0' },
]

function embaralhar<T>(lista: T[]): T[] {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

// 3 do Brasil + 3 de fora, misturados
export function sortearSugestoes(): SugestaoDeDestino[] {
  const brasil = embaralhar(SUGESTOES_DE_DESTINO.filter((c) => c.pais === 'BR')).slice(0, 3)
  const fora = embaralhar(SUGESTOES_DE_DESTINO.filter((c) => c.pais !== 'BR')).slice(0, 3)
  return embaralhar([...brasil, ...fora])
}

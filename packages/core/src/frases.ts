// Frases úteis (spec 104, J7): o essencial em cada idioma, com a voz do próprio celular.
// Puro, pra dar pra testar.

export type Idioma = 'en' | 'es' | 'fr' | 'it' | 'de'
export type Frase = { pt: string; texto: string }

// Voz (Web Speech) de cada idioma
export const VOZ: Record<Idioma, string> = { en: 'en-US', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', de: 'de-DE' }
export const NOME_DO_IDIOMA: Record<Idioma, string> = { en: 'Inglês', es: 'Espanhol', fr: 'Francês', it: 'Italiano', de: 'Alemão' }

// País → idioma da rua (o que não está aqui cai no inglês)
const IDIOMA_DO_PAIS: Record<string, Idioma> = {
  FR: 'fr', MC: 'fr', BE: 'fr', LU: 'fr', CH: 'fr',
  IT: 'it', SM: 'it', VA: 'it',
  ES: 'es', AR: 'es', CL: 'es', UY: 'es', PY: 'es', BO: 'es', PE: 'es', CO: 'es', EC: 'es', VE: 'es', MX: 'es', CU: 'es', CR: 'es', PA: 'es', DO: 'es', GT: 'es',
  DE: 'de', AT: 'de', LI: 'de',
}

// Brasil e Portugal falam português: sem frases
export function idiomaDoPais(codigo: string | null): Idioma | null {
  if (!codigo) return null
  const c = codigo.toUpperCase()
  if (c === 'BR' || c === 'PT' || c === 'AO' || c === 'MZ') return null
  return IDIOMA_DO_PAIS[c] ?? 'en'
}

const PT = [
  'Olá / Bom dia',
  'Obrigado(a)',
  'Por favor',
  'Com licença / Desculpe',
  'Você fala inglês?',
  'Não falo [idioma]',
  'Quanto custa?',
  'A conta, por favor',
  'Uma mesa para quatro, por favor',
  'Água sem gás',
  'Onde fica o banheiro?',
  'Sou alérgico(a) a amendoim',
  'Pode tirar uma foto nossa?',
  'Socorro! Chame um médico',
]

const TEXTOS: Record<Idioma, string[]> = {
  en: [
    'Hello / Good morning',
    'Thank you',
    'Please',
    'Excuse me / Sorry',
    'Do you speak English?',
    "I don't speak English",
    'How much is it?',
    'The check, please',
    'A table for four, please',
    'Still water',
    'Where is the restroom?',
    "I'm allergic to peanuts",
    'Could you take a picture of us?',
    'Help! Call a doctor',
  ],
  es: [
    'Hola / Buenos días',
    'Gracias',
    'Por favor',
    'Perdón / Disculpe',
    '¿Habla inglés?',
    'No hablo español',
    '¿Cuánto cuesta?',
    'La cuenta, por favor',
    'Una mesa para cuatro, por favor',
    'Agua sin gas',
    '¿Dónde está el baño?',
    'Soy alérgico al maní',
    '¿Nos puede sacar una foto?',
    '¡Socorro! Llame a un médico',
  ],
  fr: [
    'Bonjour',
    'Merci',
    "S'il vous plaît",
    'Excusez-moi / Pardon',
    'Vous parlez anglais ?',
    'Je ne parle pas français',
    'Combien ça coûte ?',
    "L'addition, s'il vous plaît",
    "Une table pour quatre, s'il vous plaît",
    'De l’eau plate',
    'Où sont les toilettes ?',
    'Je suis allergique aux cacahuètes',
    'Vous pouvez nous prendre en photo ?',
    'Au secours ! Appelez un médecin',
  ],
  it: [
    'Ciao / Buongiorno',
    'Grazie',
    'Per favore',
    'Mi scusi',
    'Parla inglese?',
    'Non parlo italiano',
    'Quanto costa?',
    'Il conto, per favore',
    'Un tavolo per quattro, per favore',
    'Acqua naturale',
    "Dov'è il bagno?",
    'Sono allergico alle arachidi',
    'Ci può fare una foto?',
    'Aiuto! Chiami un medico',
  ],
  de: [
    'Hallo / Guten Morgen',
    'Danke',
    'Bitte',
    'Entschuldigung',
    'Sprechen Sie Englisch?',
    'Ich spreche kein Deutsch',
    'Wie viel kostet das?',
    'Die Rechnung, bitte',
    'Einen Tisch für vier, bitte',
    'Stilles Wasser',
    'Wo ist die Toilette?',
    'Ich bin allergisch gegen Erdnüsse',
    'Können Sie ein Foto von uns machen?',
    'Hilfe! Rufen Sie einen Arzt',
  ],
}

export function frasesDoIdioma(idioma: Idioma): Frase[] {
  return PT.map((pt, i) => ({ pt: pt.replace('[idioma]', NOME_DO_IDIOMA[idioma].toLowerCase()), texto: TEXTOS[idioma][i] }))
}

// Tradução pela câmera (cardápio, placa): abre o Google Tradutor já no idioma
export function linkDeTraducaoPelaCamera(idioma: Idioma): string {
  return `https://translate.google.com/?sl=${idioma}&tl=pt&op=images`
}

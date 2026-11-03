import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { CalendarCheck, Link2, MessageCircle, Vote, Wallet } from '../components/ui/icones'
import { Icone } from '../components/ui/Icone'
import Norti from '../components/ui/Norti'
import { emailValido, entrarNaLista } from '../features/lista-espera/api'
import './lista-espera.css'

// Página pública de lista de espera (docs/marketing/ESTRATEGIA-REDES.md, passo 5).
// Aberta sem login. Um endereço por rede ajuda a medir de onde vem a galera:
//   /espera?origem=tiktok   /espera?origem=x   /espera?origem=instagram
// Os e-mails ficam na tabela lista_espera (só o dono do projeto vê, no painel do Supabase).

const VANTAGENS = [
  { icone: Wallet, titulo: 'Ninguém fica devendo', texto: 'Cada gasto lançado na hora, em qualquer moeda. No fim, o app diz quem paga quem, com o Pix de cada um.' },
  { icone: Vote, titulo: 'O grupo decide rápido', texto: 'Hospedagem, passeios e datas no voto. Acabou a enquete que ninguém responde.' },
  { icone: CalendarCheck, titulo: 'Roteiro de todo mundo', texto: 'Destinos no mapa, transportes, documentos e o dia a dia da viagem, num lugar só.' },
  { icone: Link2, titulo: 'Entra pelo link', texto: 'Manda no grupo do zap e a galera já está dentro.' },
]

type Estado = 'digitando' | 'enviando' | 'pronto' | 'erro'

export default function ListaDeEspera() {
  const [params] = useSearchParams()
  const origem = params.get('origem')
  const [email, setEmail] = useState('')
  const [estado, setEstado] = useState<Estado>('digitando')
  const [aviso, setAviso] = useState<string | null>(null)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!emailValido(email)) {
      setAviso('Confere o e-mail? Parece que faltou alguma coisa.')
      return
    }
    setAviso(null)
    setEstado('enviando')
    const resultado = await entrarNaLista(email, origem)
    if (resultado === 'erro') {
      setEstado('erro')
      setAviso('Não deu pra salvar agora. Tenta de novo em um minutinho?')
      return
    }
    setEstado('pronto')
  }

  // Convite pro zap: quem veio por indicação conta como "amigo"
  const linkDaPagina = `${window.location.origin}/espera?origem=amigo`
  const textoZap = `Achei um app pra organizar viagem com a galera sem bagunça: roteiro, votos e quem pagou o quê. Entra na lista comigo: ${linkDaPagina}`
  const linkZap = `https://wa.me/?text=${encodeURIComponent(textoZap)}`

  return (
    <main className="espera">
      <header className="espera-topo">
        <p className="espera-marca">
          <span className="espera-marca-norti">
            <Norti tamanho={34} sombra={false} />
          </span>
          Tripwave
        </p>
        <span className="espera-selo">Em breve</span>
      </header>

      <section className="espera-hero">
        <div className="espera-texto">
          <h1>A viagem com a galera, sem a bagunça do grupo.</h1>
          <p className="espera-sub">
            Roteiro, votos e quem pagou o quê, com o Pix de cada um, numa tela só. Acabou a planilha.
          </p>

          {estado === 'pronto' ? (
            <div className="espera-pronto" role="status">
              <p className="espera-pronto-titulo">Tá na lista! <Icone nome="festa" size={22} /></p>
              <p>A gente te chama assim que abrir. Viagem boa é com a galera: chama quem vai junto.</p>
              <a className="botao espera-zap" href={linkZap} target="_blank" rel="noreferrer">
                <MessageCircle size={18} aria-hidden="true" />
                Chamar a galera no zap
              </a>
            </div>
          ) : (
            <form className="espera-form" onSubmit={enviar} noValidate>
              <label htmlFor="espera-email" className="sr-only">Seu e-mail</label>
              <input
                id="espera-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={aviso ? true : undefined}
                aria-describedby={aviso ? 'espera-aviso' : undefined}
              />
              <button type="submit" className="botao" disabled={estado === 'enviando'}>
                {estado === 'enviando' ? 'Salvando…' : 'Quero entrar'}
              </button>
              {aviso && (
                <p id="espera-aviso" className="espera-aviso" role="alert">
                  {aviso}
                </p>
              )}
              <p className="espera-letra-miuda">Só um e-mail quando abrir. Nada de spam.</p>
            </form>
          )}
        </div>

        {/* Ilustração: a Norti com "pedacinhos" do app em volta */}
        <div className="espera-ilustracao" aria-hidden="true">
          <div className="espera-circulo" />
          <Norti humor={estado === 'pronto' ? 'feliz' : 'parada'} tamanho={210} />
          <div className="espera-bolha espera-bolha-1">
            <strong>Ana pagou o Airbnb</strong>
            <span>R$ 1.240 · dividido por 6</span>
          </div>
          <div className="espera-bolha espera-bolha-2">
            <strong>Pix pro Léo</strong>
            <span>R$ 86,40 · marcar como pago</span>
          </div>
          <div className="espera-bolha espera-bolha-3">
            <strong>Casa em Floripa</strong>
            <span>5 de 6 votaram sim</span>
          </div>
        </div>
      </section>

      <section className="espera-vantagens" aria-label="O que o Tripwave faz">
        {VANTAGENS.map(({ icone: Icone, titulo, texto }) => (
          <article key={titulo} className="espera-vantagem">
            <span className="espera-vantagem-icone">
              <Icone size={22} aria-hidden="true" />
            </span>
            <h2>{titulo}</h2>
            <p>{texto}</p>
          </article>
        ))}
      </section>

      <footer className="espera-rodape">
        <p>Feito no Brasil por quem já sofreu organizando viagem em grupo.</p>
      </footer>
    </main>
  )
}

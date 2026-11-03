import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Accessibility, ArrowLeft, BookUser, Camera, Globe2, IdCard, ShieldCheck, UserRound } from '../components/ui/icones'
import { buscarMeuPerfil, salvarNome, tirarFoto, trocarFoto, type MeuPerfil } from '../features/perfil/api'
import { ArquivoInvalido } from '../features/fotos/comprimir'
import Avatar from '../components/ui/Avatar'
import Norti from '../components/ui/Norti'
import Carregando from '../components/ui/Carregando'
import ErroNaTela from '../components/ui/ErroNaTela'
import FormPassaporte from '../features/passaporte/FormPassaporte'
import FormFicha from '../features/ficha-pessoal/FormFicha'
import MinhaPrivacidade from '../features/privacidade/MinhaPrivacidade'
import FormAcessibilidade from '../features/acessibilidade/FormAcessibilidade'
import OndeJaFui from '../features/perfil/OndeJaFui'
import './minhas-viagens.css'

// Atalhos da coluna da esquerda (pulam pro cartão certo da direita)
const ATALHOS = [
  { id: 'perfil-nome', nome: 'Seu nome', Icone: UserRound },
  { id: 'perfil-onde', nome: 'Onde já fui', Icone: Globe2 },
  { id: 'perfil-ficha', nome: 'Sua ficha', Icone: IdCard },
  { id: 'perfil-passaporte', nome: 'Passaporte', Icone: BookUser },
  { id: 'perfil-leitura', nome: 'Leitura e modo simples', Icone: Accessibility },
  { id: 'perfil-privacidade', nome: 'Privacidade', Icone: ShieldCheck },
]

// "/perfil" (spec 008): nome e foto. Aparecem no comboio de todas as viagens.
// Design Plataforma (spec 113): coluna fixa com foto e atalhos, cartões à direita.
export default function Perfil() {
  const [perfil, setPerfil] = useState<MeuPerfil | null | 'erro'>(null)
  const [nome, setNome] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  useEffect(() => {
    buscarMeuPerfil()
      .then((p) => {
        setPerfil(p ?? 'erro')
        setNome(p?.nome ?? '')
      })
      .catch(() => setPerfil('erro'))
  }, [])

  if (perfil === null) {
    return (
      <div className="pagina-solta">
        <Carregando texto="Buscando seu perfil…" />
      </div>
    )
  }
  if (perfil === 'erro') {
    return (
      <div className="pagina-solta">
        <ErroNaTela titulo="Não deu pra carregar o perfil" aoTentar={() => window.location.reload()} />
      </div>
    )
  }
  const eu = perfil

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return setMensagem({ tipo: 'erro', texto: 'O nome não pode ficar vazio.' })
    setSalvando(true)
    setMensagem(null)
    try {
      await salvarNome(eu.id, nome)
      setPerfil({ ...eu, nome: nome.trim() })
      setMensagem({ tipo: 'ok', texto: 'Nome salvo. Já aparece assim em todas as viagens.' })
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Não deu pra salvar o nome.' })
    } finally {
      setSalvando(false)
    }
  }

  async function escolherFoto(arquivo: File | undefined) {
    if (!arquivo) return
    setSalvando(true)
    setMensagem(null)
    try {
      const url = await trocarFoto(eu.id, arquivo)
      setPerfil({ ...eu, avatarUrl: url })
      setMensagem({ tipo: 'ok', texto: 'Foto trocada.' })
    } catch (erro) {
      console.error('Erro ao trocar foto:', erro)
      setMensagem({ tipo: 'erro', texto: erro instanceof ArquivoInvalido ? erro.message : 'Não deu pra trocar a foto.' })
    } finally {
      setSalvando(false)
    }
  }

  async function removerFoto() {
    setSalvando(true)
    try {
      await tirarFoto(eu.id)
      setPerfil({ ...eu, avatarUrl: null })
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Não deu pra tirar a foto.' })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="pagina-solta perfil-pagina">
      <main className="pagina-solta-conteudo">
        <Link to="/viagens" className="perfil-voltar">
          <ArrowLeft size={16} aria-hidden="true" /> Minhas viagens
        </Link>
        <h1 className="perfil-titulo">Perfil</h1>

        <div className="perfil-colunas">
          <aside className="perfil-lado">
            {/* Foto, nome e e-mail */}
            <section className="cartao-ui perfil-foto">
              <Avatar nome={eu.nome || '?'} url={eu.avatarUrl} tamanho={96} />
              <strong className="perfil-nome">{eu.nome || 'Sem nome'}</strong>
              {eu.email && <span className="perfil-email">{eu.email}</span>}
              <div className="perfil-foto-acoes">
                <label className="perfil-botao-pequeno">
                  <Camera size={15} aria-hidden="true" /> {eu.avatarUrl ? 'Trocar foto' : 'Colocar foto'}
                  <input type="file" accept="image/*" className="visualmente-oculto" disabled={salvando} onChange={(e) => escolherFoto(e.target.files?.[0])} />
                </label>
                {eu.avatarUrl && (
                  <button type="button" className="perfil-botao-pequeno sem-borda" onClick={removerFoto} disabled={salvando}>
                    Tirar foto
                  </button>
                )}
              </div>
            </section>

            <nav className="cartao-ui perfil-atalhos" aria-label="Partes do perfil">
              {ATALHOS.map(({ id, nome, Icone }) => (
                <a key={id} href={`#${id}`}>
                  <Icone size={17} aria-hidden="true" /> {nome}
                </a>
              ))}
            </nav>
          </aside>

          <div className="perfil-cartoes">
            <form id="perfil-nome" className="cartao-ui form" onSubmit={salvar} noValidate>
              <label className="perfil-secao" htmlFor="perfil-campo-nome">
                Seu nome
              </label>
              <div className="perfil-nome-linha">
                <input id="perfil-campo-nome" maxLength={80} value={nome} onChange={(e) => setNome(e.target.value)} />
                <button type="submit" className="botao" disabled={salvando}>
                  {salvando ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
              {mensagem && (
                <p role="status" className={mensagem.tipo === 'ok' ? 'form-aviso' : 'form-erro'}>
                  {mensagem.texto}
                </p>
              )}
            </form>

            <div id="perfil-onde" className="perfil-ancora">
              <OndeJaFui />
            </div>
            <div id="perfil-ficha" className="perfil-ancora">
              <FormFicha meuId={eu.id} />
            </div>
            <div id="perfil-passaporte" className="perfil-ancora">
              <FormPassaporte meuId={eu.id} />
            </div>
            <div id="perfil-leitura" className="perfil-ancora">
              <FormAcessibilidade />
            </div>
            <div id="perfil-privacidade" className="perfil-ancora">
              <MinhaPrivacidade />
            </div>

            <div className="perfil-norti">
              <Norti tamanho={84} />
              <p>A Norti aponta o caminho da viagem pra vocês.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

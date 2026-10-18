import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, Camera } from 'lucide-react'
import { buscarMeuPerfil, salvarNome, tirarFoto, trocarFoto, type MeuPerfil } from '../features/perfil/api'
import { ArquivoInvalido } from '../features/fotos/comprimir'
import Avatar from '../components/ui/Avatar'
import '../components/ui/ui.css'
import './minhas-viagens.css'

// "/perfil" (spec 008): nome e foto. Aparecem no comboio de todas as viagens.
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

  if (perfil === null) return <div className="pagina-solta" />
  if (perfil === 'erro') {
    return (
      <div className="pagina-solta">
        <main className="pagina-solta-conteudo">
          <p className="aviso-erro">Não deu pra carregar o perfil. Atualize a página.</p>
        </main>
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
    <div className="pagina-solta">
      <header className="pagina-solta-topo">
        <Link to="/viagens" className="botao-texto">
          <ArrowLeft size={18} aria-hidden="true" /> Minhas viagens
        </Link>
      </header>
      <main className="pagina-solta-conteudo estreita">
        <div className="cabecalho-pagina">
          <div>
            <h1>Seu perfil</h1>
            {eu.email && <p>{eu.email}</p>}
          </div>
        </div>

        <section className="cartao-ui perfil-foto">
          <Avatar nome={eu.nome || '?'} url={eu.avatarUrl} tamanho={96} />
          <div className="perfil-foto-acoes">
            <label className="botao secundario">
              <Camera size={18} aria-hidden="true" /> {eu.avatarUrl ? 'Trocar foto' : 'Colocar foto'}
              <input type="file" accept="image/*" className="visualmente-oculto" disabled={salvando} onChange={(e) => escolherFoto(e.target.files?.[0])} />
            </label>
            {eu.avatarUrl && (
              <button type="button" className="botao-texto" onClick={removerFoto} disabled={salvando}>
                Tirar foto
              </button>
            )}
          </div>
        </section>

        <form className="cartao-ui form" onSubmit={salvar} noValidate>
          <div className="form-campo">
            <label className="form-rotulo" htmlFor="perfil-nome">
              Seu nome
            </label>
            <input id="perfil-nome" maxLength={80} value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="form-rodape">
            <button type="submit" className="botao" disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>

        {mensagem && (
          <p role="status" className={mensagem.tipo === 'ok' ? 'form-aviso' : 'form-erro'}>
            {mensagem.texto}
          </p>
        )}
      </main>
    </div>
  )
}

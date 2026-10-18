import { useEffect, useState } from 'react'
import { Camera, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useViagemAtual } from '../../features/viagens/hooks'
import { useFotos } from '../../features/fotos/hooks'
import { apagarFoto, LIMITE_POR_DESTINO, type Foto } from '../../features/fotos/api'
import FormFoto from '../../features/fotos/FormFoto'
import { formatarData } from '../../lib/datas'
import Avatar from '../../components/ui/Avatar'
import CabecalhoPagina from '../../components/ui/CabecalhoPagina'
import EstadoVazio from '../../components/ui/EstadoVazio'
import Gaveta from '../../components/ui/Gaveta'
import './abas.css'
import './fotos.css'

// Fotos (spec 005): as melhores fotos de cada lugar, num mural do comboio inteiro.
export default function Fotos() {
  const { viagem, destinos, membros, meuId, euSouAdm } = useViagemAtual()
  const { estado, recarregar } = useFotos(viagem.id)
  const [filtro, setFiltro] = useState<string | null>(null)
  const [adicionando, setAdicionando] = useState(false)
  const [aberta, setAberta] = useState<number | null>(null) // índice da foto em tela cheia

  const fotos = estado.status === 'pronto' ? estado.fotos : []
  const contagem: Record<string, number> = {}
  for (const f of fotos) if (f.destino_id) contagem[f.destino_id] = (contagem[f.destino_id] ?? 0) + 1
  const visiveis = filtro ? fotos.filter((f) => f.destino_id === filtro) : fotos

  return (
    <>
      <CabecalhoPagina
        titulo="Fotos"
        subtitulo={`As ${LIMITE_POR_DESTINO} melhores fotos de cada lugar, do comboio inteiro.`}
        acao={
          <button type="button" className="botao" onClick={() => setAdicionando(true)}>
            <Plus size={18} aria-hidden="true" /> Adicionar foto
          </button>
        }
      />

      {/* Filtro por destino */}
      <div className="filtros" role="group" aria-label="Filtrar por destino">
        <button type="button" className={filtro === null ? 'ativo' : undefined} onClick={() => setFiltro(null)}>
          Todas
        </button>
        {destinos.map((d) => (
          <button key={d.id} type="button" className={filtro === d.id ? 'ativo' : undefined} onClick={() => setFiltro(d.id)}>
            {d.nome}{' '}
            <span>
              {contagem[d.id] ?? 0}/{LIMITE_POR_DESTINO}
            </span>
          </button>
        ))}
      </div>

      {estado.status === 'carregando' && <p className="carregando-texto">Carregando as fotos…</p>}
      {estado.status === 'erro' && (
        <div className="aviso-erro">
          <p>Não deu pra carregar as fotos.</p>
          <button type="button" className="botao secundario pequeno" onClick={recarregar}>
            Tentar de novo
          </button>
        </div>
      )}

      {estado.status === 'pronto' &&
        (visiveis.length === 0 ? (
          <EstadoVazio
            icone={Camera}
            titulo={filtro ? 'Nenhuma foto desse lugar ainda' : 'Nenhuma foto ainda'}
            texto="Escolham as melhores fotos de cada lugar. Elas aparecem aqui num mural pra todo o comboio."
            acao={
              <button type="button" className="botao" onClick={() => setAdicionando(true)}>
                <Plus size={18} aria-hidden="true" /> Adicionar foto
              </button>
            }
          />
        ) : (
          <ul className="mural">
            {visiveis.map((f, i) => {
              const autor = membros.find((m) => m.id === f.enviada_por)
              return (
                <li key={f.id}>
                  <button type="button" onClick={() => setAberta(i)} aria-label={`Abrir foto${f.legenda ? `: ${f.legenda}` : ''}`}>
                    {f.url ? <img src={f.url} alt={f.legenda ?? ''} loading="lazy" decoding="async" /> : <span className="mural-sem-link" />}
                    <span className="mural-info">
                      {autor && <Avatar nome={autor.nome} url={autor.avatarUrl} tamanho={24} />}
                      <span>{destinos.find((d) => d.id === f.destino_id)?.nome}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        ))}

      {adicionando && (
        <Gaveta titulo="Adicionar foto" aoFechar={() => setAdicionando(false)}>
          <FormFoto
            viagemId={viagem.id}
            destinos={destinos}
            contagem={contagem}
            destinoInicial={filtro}
            aoTerminar={() => {
              setAdicionando(false)
              recarregar()
            }}
          />
        </Gaveta>
      )}

      {aberta !== null && visiveis[aberta] && (
        <FotoAberta
          fotos={visiveis}
          indice={aberta}
          aoMudar={setAberta}
          aoFechar={() => setAberta(null)}
          podeApagar={(f) => f.enviada_por === meuId || euSouAdm}
          nomeDoAutor={(id) => membros.find((m) => m.id === id)?.nome ?? 'Ex-membro'}
          nomeDoDestino={(id) => destinos.find((d) => d.id === id)?.nome ?? 'Sem lugar'}
          aoApagar={() => {
            setAberta(null)
            recarregar()
          }}
        />
      )}
    </>
  )
}

type PropsFoto = {
  fotos: Foto[]
  indice: number
  aoMudar: (i: number) => void
  aoFechar: () => void
  podeApagar: (f: Foto) => boolean
  nomeDoAutor: (id: string) => string
  nomeDoDestino: (id: string | null) => string
  aoApagar: () => void
}

// Foto em tela cheia, escura, com setas pra passar
function FotoAberta({ fotos, indice, aoMudar, aoFechar, podeApagar, nomeDoAutor, nomeDoDestino, aoApagar }: PropsFoto) {
  const foto = fotos[indice]
  const [confirmando, setConfirmando] = useState(false)
  const [apagando, setApagando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  function irPara(i: number) {
    setConfirmando(false)
    aoMudar(i)
  }
  const anterior = indice > 0 ? () => irPara(indice - 1) : null
  const proxima = indice < fotos.length - 1 ? () => irPara(indice + 1) : null

  useEffect(() => {
    const aoApertar = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && indice > 0) aoMudar(indice - 1)
      if (e.key === 'ArrowRight' && indice < fotos.length - 1) aoMudar(indice + 1)
    }
    document.addEventListener('keydown', aoApertar)
    return () => document.removeEventListener('keydown', aoApertar)
  }, [indice, fotos.length, aoMudar])

  async function apagar() {
    setApagando(true)
    setErro(null)
    try {
      await apagarFoto(foto)
      aoApagar()
    } catch (e) {
      console.error('Erro ao apagar foto:', e)
      setErro(e instanceof Error && e.message.startsWith('O arquivo') ? e.message : 'Não deu pra apagar a foto.')
      setApagando(false)
    }
  }

  return (
    <Gaveta titulo={nomeDoDestino(foto.destino_id)} aoFechar={aoFechar} escura>
      <div className="foto-aberta">
        <div className="foto-aberta-imagem">
          {foto.url && <img src={foto.url} alt={foto.legenda ?? ''} />}
          {anterior && (
            <button type="button" className="foto-seta esquerda" onClick={anterior} aria-label="Foto anterior">
              <ChevronLeft size={28} aria-hidden="true" />
            </button>
          )}
          {proxima && (
            <button type="button" className="foto-seta direita" onClick={proxima} aria-label="Próxima foto">
              <ChevronRight size={28} aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="foto-aberta-texto">
          {foto.legenda && <p className="foto-legenda">{foto.legenda}</p>}
          <p>
            {nomeDoAutor(foto.enviada_por)} · {formatarData(foto.criado_em.slice(0, 10), true)} · {indice + 1} de {fotos.length}
          </p>
          {erro && <p className="form-erro">{erro}</p>}
          {podeApagar(foto) &&
            (confirmando ? (
              <div className="form-rodape">
                <button type="button" className="botao secundario claro" onClick={() => setConfirmando(false)}>
                  Manter
                </button>
                <button type="button" className="botao perigo" onClick={apagar} disabled={apagando}>
                  {apagando ? 'Apagando…' : 'Apagar foto'}
                </button>
              </div>
            ) : (
              <button type="button" className="botao-texto claro" onClick={() => setConfirmando(true)}>
                <Trash2 size={16} aria-hidden="true" /> Apagar foto
              </button>
            ))}
        </div>
      </div>
    </Gaveta>
  )
}

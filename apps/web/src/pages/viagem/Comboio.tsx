import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Cake, Check, Copy, Repeat, HeartPulse, Link2, LogOut, MoreHorizontal, Phone, Ticket, Users, Utensils } from 'lucide-react'
import { aniversariosNaViagem, buscarFichasDoComboio, restricoesDoGrupo, telefoneParaLigar, type FichaNoComboio } from '@together/core'
import { supabase } from '../../lib/supabase'
import {
  buscarConvidados,
  buscarConvites,
  cancelarConvite,
  ConvidadoNaoViraAdm,
  criarConvite,
  mudarPapel,
  removerDoComboio,
  UltimoAdm,
  type Convite,
} from '../../features/comboio/api'
import { useViagemAtual, type Membro } from '../../features/viagens/hooks'
import ApagarViagem from '../../features/viagens/ApagarViagem'
import { formatarData } from '../../lib/datas'
import Avatar from '../../components/ui/Avatar'
import CabecalhoPagina from '../../components/ui/CabecalhoPagina'
import Cartao from '../../components/ui/Cartao'
import Gaveta from '../../components/ui/Gaveta'
import './abas.css'

// Comboio (spec 007): quem vai, convites e sair da viagem. O ADM organiza as pessoas.
export default function Comboio() {
  const { viagem, membros, meuId, euSouAdm, recarregar } = useViagemAtual()
  // Spec 050: fichas do comboio (alergias, aniversário, emergência quando liberada)
  const [fichas, setFichas] = useState<FichaNoComboio[]>([])
  useEffect(() => {
    let ativo = true
    buscarFichasDoComboio(supabase, viagem.id)
      .then((f) => ativo && setFichas(f))
      .catch((e) => console.error('Erro ao buscar fichas:', e))
    return () => {
      ativo = false
    }
  }, [viagem.id])
  const nomeDoMembro = (id: string) => membros.find((m) => m.id === id)?.nome ?? 'Alguém'
  const aniversarios = aniversariosNaViagem(fichas, viagem.data_inicio, viagem.data_fim)
  const proRestaurante = restricoesDoGrupo(fichas, nomeDoMembro)
  const navegar = useNavigate()
  const [link, setLink] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [menuAberto, setMenuAberto] = useState<string | null>(null)
  const [removendo, setRemovendo] = useState<Membro | null>(null)
  const [saindo, setSaindo] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [convites, setConvites] = useState<Convite[]>([])
  const [convidados, setConvidados] = useState<string[]>([])

  const adms = membros.filter((m) => m.papel === 'adm')
  const souUltimoAdm = euSouAdm && adms.length === 1
  const sozinho = membros.length === 1

  const carregarConvites = useCallback(async () => {
    if (!euSouAdm) return []
    return buscarConvites(viagem.id).catch(() => [])
  }, [viagem.id, euSouAdm])

  useEffect(() => {
    let ativo = true
    carregarConvites().then((lista) => {
      if (ativo) setConvites(lista)
    })
    return () => {
      ativo = false
    }
  }, [carregarConvites])

  // Selo "convidado" pra quem entrou pelo link sem conta (spec 018)
  useEffect(() => {
    let ativo = true
    buscarConvidados(viagem.id)
      .then((lista) => ativo && setConvidados(lista))
      .catch(() => {})
    return () => {
      ativo = false
    }
  }, [viagem.id, membros])

  async function convidar() {
    setErro(null)
    try {
      const novo = link ?? (await criarConvite(viagem.id))
      setLink(novo)
      setConvites(await carregarConvites())
      if (navigator.share) {
        await navigator.share({ title: viagem.nome, text: `Bora planejar "${viagem.nome}" juntos?`, url: novo }).catch(() => {})
      } else {
        await navigator.clipboard.writeText(novo)
        setCopiado(true)
      }
    } catch {
      setErro('Não deu pra gerar o convite. Tente de novo.')
    }
  }

  async function acao(fazer: () => Promise<void>, mensagem: string) {
    setOcupado(true)
    setErro(null)
    try {
      await fazer()
      await recarregar()
      setMenuAberto(null)
      setRemovendo(null)
    } catch (e) {
      console.error(mensagem, e)
      setErro(
        e instanceof UltimoAdm
          ? 'A viagem precisa de pelo menos um ADM. Passe o ADM pra alguém antes.'
          : e instanceof ConvidadoNaoViraAdm
            ? 'Essa pessoa entrou como convidado. Ela precisa criar conta antes de virar ADM.'
            : mensagem,
      )
    } finally {
      setOcupado(false)
    }
  }

  async function sair() {
    setOcupado(true)
    setErro(null)
    try {
      await removerDoComboio(viagem.id, meuId)
      navegar('/viagens', { replace: true })
    } catch (e) {
      console.error('Erro ao sair da viagem:', e)
      setErro(e instanceof UltimoAdm ? 'Passe o ADM pra alguém antes de sair.' : 'Não deu pra sair da viagem.')
      setOcupado(false)
    }
  }

  async function cancelar(codigo: string) {
    try {
      await cancelarConvite(codigo)
      if (link?.endsWith(codigo)) setLink(null)
      setConvites(await carregarConvites())
    } catch {
      setErro('Não deu pra cancelar o convite.')
    }
  }

  return (
    <>
      <CabecalhoPagina
        titulo="Comboio"
        subtitulo={`${membros.length} ${membros.length === 1 ? 'pessoa' : 'pessoas'} nessa viagem`}
        acao={
          euSouAdm && (
            <button type="button" className="botao" onClick={convidar}>
              {copiado ? <Check size={18} aria-hidden="true" /> : <Link2 size={18} aria-hidden="true" />}
              {copiado ? 'Link copiado' : 'Convidar'}
            </button>
          )
        }
      />

      {erro && (
        <p role="alert" className="aviso-erro">
          {erro}
        </p>
      )}
      {link && <p className="link-convite">{link.replace(/^https?:\/\//, '')}</p>}

      {(proRestaurante.length > 0 || aniversarios.length > 0) && (
        <Cartao titulo="Bom saber" icone={Utensils}>
          <ul className="bom-saber">
            {aniversarios.map((a) => (
              <li key={a.usuarioId}>
                <Cake size={15} aria-hidden="true" /> {nomeDoMembro(a.usuarioId)} faz aniversário em {formatarData(a.dia)}, durante a viagem!
              </li>
            ))}
            {proRestaurante.map((r) => (
              <li key={r}>
                <Utensils size={15} aria-hidden="true" /> {r}
              </li>
            ))}
          </ul>
        </Cartao>
      )}

      <Cartao titulo="Quem vai" icone={Users}>
        <ul className="membros">
          {membros.map((m) => {
            const souEu = m.id === meuId
            return (
              <li key={m.id} className="membro">
                <div className="membro-linha">
                  <Avatar nome={m.nome} url={m.avatarUrl} tamanho={44} />
                  <span className="membro-nome">
                    <strong>
                      {m.nome}
                      {souEu && ' (você)'}
                    </strong>
                    <small>{m.papel === 'adm' ? 'Organiza a viagem' : 'Membro do comboio'}</small>
                    <FichaResumo ficha={fichas.find((f) => f.usuario_id === m.id)} />
                  </span>
                  {m.papel === 'adm' && <span className="selo">ADM</span>}
                  {convidados.includes(m.id) && (
                    <span className="selo" title="Entrou pelo link sem criar conta">
                      Convidado
                    </span>
                  )}
                  {euSouAdm && !sozinho && (
                    <button
                      type="button"
                      className="botao-texto"
                      aria-expanded={menuAberto === m.id}
                      aria-label={`Opções de ${m.nome}`}
                      onClick={() => setMenuAberto(menuAberto === m.id ? null : m.id)}
                    >
                      <MoreHorizontal size={20} aria-hidden="true" />
                    </button>
                  )}
                </div>

                {menuAberto === m.id && (
                  <div className="membro-menu">
                    {m.papel === 'membro' ? (
                      <button
                        type="button"
                        className="botao secundario pequeno"
                        disabled={ocupado || convidados.includes(m.id)}
                        title={convidados.includes(m.id) ? 'Convidado precisa criar conta antes de virar ADM' : undefined}
                        onClick={() => acao(() => mudarPapel(viagem.id, m.id, 'adm'), 'Não deu pra mudar o papel.')}>
                        Tornar ADM
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="botao secundario pequeno"
                        disabled={ocupado || adms.length === 1}
                        title={adms.length === 1 ? 'A viagem precisa de pelo menos um ADM' : undefined}
                        onClick={() => acao(() => mudarPapel(viagem.id, m.id, 'membro'), 'Não deu pra mudar o papel.')}
                      >
                        Tornar membro
                      </button>
                    )}
                    {!souEu && (
                      <button type="button" className="botao secundario pequeno" disabled={ocupado} onClick={() => setRemovendo(m)}>
                        Remover
                      </button>
                    )}
                    {adms.length === 1 && m.papel === 'adm' && <p className="form-dica">Único ADM: torne outra pessoa ADM antes.</p>}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </Cartao>

      {euSouAdm && (
        <Cartao titulo="Convites ativos" icone={Ticket}>
          {convites.length === 0 ? (
            <p className="form-dica">Nenhum convite ativo. Toque em "Convidar" pra gerar um link.</p>
          ) : (
            <ul className="convites">
              {convites.map((c) => (
                <li key={c.codigo}>
                  <span className="convite-texto">
                    <code>{c.link.replace(/^https?:\/\//, '')}</code>
                    <small>Vale até {formatarData(c.expiraEm.slice(0, 10))}</small>
                  </span>
                  <button type="button" className="botao-texto" aria-label="Copiar link" onClick={() => navigator.clipboard.writeText(c.link)}>
                    <Copy size={16} aria-hidden="true" />
                  </button>
                  <button type="button" className="botao secundario pequeno" onClick={() => cancelar(c.codigo)}>
                    Cancelar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      )}

      {/* Spec 055: começar outra viagem com as mesmas pessoas */}
      {!sozinho && (
        <div className="comboio-repetir">
          <Link to={`/nova-viagem?comboio=${viagem.id}`} className="botao secundario">
            <Repeat size={18} aria-hidden="true" /> Nova viagem com este comboio
          </Link>
        </div>
      )}

      <div className="comboio-sair">
        <button type="button" className="botao secundario" onClick={() => setSaindo(true)}>
          <LogOut size={18} aria-hidden="true" /> {sozinho ? 'Apagar a viagem' : 'Sair da viagem'}
        </button>
      </div>

      {removendo && (
        <Gaveta titulo={`Remover ${removendo.nome.split(' ')[0]}?`} aoFechar={() => setRemovendo(null)}>
          <div className="form">
            <p className="form-dica">
              {removendo.nome} perde o acesso à viagem na hora. Os gastos e fotos que essa pessoa lançou continuam aqui.
            </p>
            <div className="form-rodape">
              <button type="button" className="botao secundario" onClick={() => setRemovendo(null)}>
                Manter
              </button>
              <button
                type="button"
                className="botao perigo"
                disabled={ocupado}
                onClick={() => acao(() => removerDoComboio(viagem.id, removendo.id), 'Não deu pra remover essa pessoa.')}
              >
                Remover do comboio
              </button>
            </div>
          </div>
        </Gaveta>
      )}

      {saindo && (
        <Gaveta titulo={sozinho ? 'Apagar a viagem?' : 'Sair da viagem?'} aoFechar={() => setSaindo(false)}>
          {sozinho ? (
            <>
              <p className="form-dica">Você é a única pessoa nessa viagem, então sair é o mesmo que apagar.</p>
              <ApagarViagem id={viagem.id} nome={viagem.nome} />
            </>
          ) : souUltimoAdm ? (
            <div className="form">
              <p className="form-aviso">Você é o único ADM. Passe o ADM pra alguém antes de sair (menu "⋯" ao lado da pessoa).</p>
              <div className="form-rodape">
                <button type="button" className="botao" onClick={() => setSaindo(false)}>
                  Entendi
                </button>
              </div>
            </div>
          ) : (
            <div className="form">
              <p className="form-dica">
                Você deixa de ver “{viagem.nome}”. Seus gastos e fotos continuam pro comboio. Pra voltar, precisa de um convite novo.
              </p>
              {erro && <p className="form-erro">{erro}</p>}
              <div className="form-rodape">
                <button type="button" className="botao secundario" onClick={() => setSaindo(false)}>
                  Ficar
                </button>
                <button type="button" className="botao perigo" onClick={sair} disabled={ocupado}>
                  Sair da viagem
                </button>
              </div>
            </div>
          )}
        </Gaveta>
      )}
    </>
  )
}

// Linha da ficha do membro (spec 050): telefone, alergia e, se liberado, emergência
function FichaResumo({ ficha }: { ficha?: FichaNoComboio }) {
  if (!ficha) return null
  return (
    <span className="membro-ficha">
      {ficha.telefone && (
        <a href={`tel:${telefoneParaLigar(ficha.telefone)}`}>
          <Phone size={12} aria-hidden="true" /> {ficha.telefone}
        </a>
      )}
      {ficha.alergias && <span>Alergia: {ficha.alergias}</span>}
      {ficha.emergencia_nome && (
        <span>
          <HeartPulse size={12} aria-hidden="true" /> Emergência: {ficha.emergencia_nome}
          {ficha.emergencia_telefone && (
            <>
              {' '}
              · <a href={`tel:${telefoneParaLigar(ficha.emergencia_telefone)}`}>{ficha.emergencia_telefone}</a>
            </>
          )}
          {ficha.tipo_sanguineo && ` · ${ficha.tipo_sanguineo}`}
        </span>
      )}
    </span>
  )
}

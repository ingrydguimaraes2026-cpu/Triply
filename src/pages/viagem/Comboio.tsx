import { useState } from 'react'
import { Check, Link2, Users } from 'lucide-react'
import { criarConvite } from '../../features/comboio/api'
import { useViagemAtual } from '../../features/viagens/hooks'
import Avatar from '../../components/ui/Avatar'
import CabecalhoPagina from '../../components/ui/CabecalhoPagina'
import Cartao from '../../components/ui/Cartao'
import './abas.css'

/*
  TODO (Ingryd): Comboio. Spec completa: docs/specs/007-gestao-do-comboio.md
  - ADM poder remover alguém ou passar alguém pra ADM (tabela "comboio_membros", campo "papel").
  - Membro poder sair da viagem.
*/
export default function Comboio() {
  const { viagem, membros, euSouAdm } = useViagemAtual()
  const [link, setLink] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [erro, setErro] = useState(false)

  async function convidar() {
    setErro(false)
    try {
      const novo = link ?? (await criarConvite(viagem.id))
      setLink(novo)
      if (navigator.share) {
        await navigator.share({ title: viagem.nome, text: `Bora planejar "${viagem.nome}" juntos?`, url: novo }).catch(() => {})
      } else {
        await navigator.clipboard.writeText(novo)
        setCopiado(true)
      }
    } catch {
      setErro(true)
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
          Não deu pra gerar o convite. Tente de novo.
        </p>
      )}
      {link && <p className="link-convite">{link.replace(/^https?:\/\//, '')}</p>}

      <Cartao titulo="Quem vai" icone={Users}>
        <ul className="membros">
          {membros.map((m) => (
            <li key={m.id}>
              <Avatar nome={m.nome} url={m.avatarUrl} tamanho={44} />
              <span className="membro-nome">
                <strong>{m.nome}</strong>
                <small>{m.papel === 'adm' ? 'Organiza a viagem' : 'Membro do comboio'}</small>
              </span>
              {m.papel === 'adm' && <span className="selo">ADM</span>}
            </li>
          ))}
        </ul>
      </Cartao>
    </>
  )
}

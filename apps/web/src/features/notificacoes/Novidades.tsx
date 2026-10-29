import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Bell } from 'lucide-react'
import { descreverAtividade, type Atividade } from '@together/core'
import { tempoAtras } from '../feed/regras'
import type { Membro } from '../viagens/hooks'
import Avatar from '../../components/ui/Avatar'
import EstadoVazio from '../../components/ui/EstadoVazio'
import './notificacoes.css'

// Botão do sino com o número de novidades (spec 031). `menu`: versão do menu lateral do computador.
export function BotaoSino({ novas, aoAbrir, menu = false }: { novas: number; aoAbrir: () => void; menu?: boolean }) {
  const rotulo = novas ? `${novas} ${novas === 1 ? 'novidade' : 'novidades'}` : 'Novidades'
  return (
    <button type="button" className={menu ? 'viagem-menu-acao sino-menu' : 'viagem-topo-icone sino'} onClick={aoAbrir} aria-label={rotulo}>
      <span className="sino-icone">
        <Bell size={menu ? 18 : 20} aria-hidden="true" />
        {novas > 0 && <span className="sino-numero">{novas > 9 ? '9+' : novas}</span>}
      </span>
      {menu && 'Novidades'}
    </button>
  )
}

type Props = {
  atividades: Atividade[] | null
  vistoEm: string | null
  erro: boolean
  meuId: string
  membros: Membro[]
  aoVer: () => void // marca como visto (chamado ao abrir a lista)
  aoEscolher: () => void // fecha a gaveta ao tocar num item
}

// Lista das novidades (vai dentro de uma Gaveta). As que eu ainda não tinha visto ficam destacadas.
export default function Novidades({ atividades, vistoEm, erro, meuId, membros, aoVer, aoEscolher }: Props) {
  // O destaque usa o "visto até" de quando a lista abriu (marcar como visto não apaga o destaque na hora)
  const [vistoAoAbrir] = useState(vistoEm)
  useEffect(() => {
    aoVer()
  }, [aoVer])

  if (erro && !atividades) return <p className="form-erro">Não deu pra carregar as novidades agora.</p>
  if (!atividades) return <p className="carregando-texto">Carregando…</p>
  if (atividades.length === 0) {
    return <EstadoVazio icone={Bell} titulo="Nada novo por aqui" texto="Quando alguém do comboio lançar um gasto, sugerir um lugar ou comentar, aparece aqui." />
  }

  return (
    <ul className="novidades">
      {atividades.map((a) => {
        const { verbo, titulo, caminho } = descreverAtividade(a)
        const quem = membros.find((m) => m.id === a.autor)
        const nome = a.autor === meuId ? 'Você' : (quem?.nome ?? 'Alguém')
        const nova = a.autor !== meuId && (!vistoAoAbrir || a.criado_em > vistoAoAbrir)
        return (
          <li key={a.id} className={nova ? 'nova' : undefined}>
            <Link to={caminho} onClick={aoEscolher}>
              <Avatar nome={quem?.nome ?? '?'} url={quem?.avatarUrl ?? null} tamanho={32} />
              <span className="novidade-texto">
                <span>
                  <strong>{nome}</strong> {verbo}
                  {titulo && <> «{titulo}»</>}
                </span>
                <time dateTime={a.criado_em}>{tempoAtras(a.criado_em)}</time>
              </span>
              {nova && <span className="novidade-ponto" aria-label="nova" />}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

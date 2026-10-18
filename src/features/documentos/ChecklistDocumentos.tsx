import { useState } from 'react'
import { AlertTriangle, Check, ChevronDown, ExternalLink, FileCheck, Info } from 'lucide-react'
import type { Membro } from '../viagens/hooks'
import { hojeTexto } from '../destinos/datas'
import { formatarData } from '../../lib/datas'
import Avatar from '../../components/ui/Avatar'
import { prazoVencido, progresso, textoDoPrazo, type ItemChecklist, type Status } from './checklist'
import { nomeDoPais } from './paises'
import type { useDocumentos } from './hooks'
import './checklist-documentos.css'

type Props = {
  docs: ReturnType<typeof useDocumentos>
  membros: Membro[]
  className?: string
}

// Checklist de documentos de entrada (spec 010), na Overview ao lado do mapa.
// Cada linha: marcar como resolvido, prazo; abrindo a linha: explicação, fonte, "não preciso" e quem já resolveu.
export default function ChecklistDocumentos({ docs, membros, className }: Props) {
  const { checklist, estado, meus, marcar, resolveram, recarregar } = docs
  const [aberto, setAberto] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const hoje = hojeTexto()

  const { feitas, total } = progresso(checklist.itens, meus)
  const tarefas = checklist.itens.filter((i) => i.tipo === 'tarefa')
  const avisos = checklist.itens.filter((i) => i.tipo === 'aviso')

  async function mudar(item: string, status: Status) {
    setErro(null)
    const novo = (meus[item] ?? 'pendente') === status ? 'pendente' : status // clicar de novo desmarca
    try {
      await marcar(item, novo)
    } catch {
      setErro('Não deu pra salvar. Confira a internet e tente de novo.')
    }
  }

  if (checklist.paises.length === 0) {
    return (
      <section className={`checklist-docs ${className ?? ''}`} aria-label="Documentos">
        <header className="checklist-docs-topo">
          <h2>
            <FileCheck size={18} aria-hidden="true" /> Documentos
          </h2>
        </header>
        <p className="checklist-docs-vazio">
          Viagem nacional: basta um documento com foto (RG, CIN ou CNH). Com um destino fora do Brasil, o checklist aparece aqui.
        </p>
      </section>
    )
  }

  const linha = (item: ItemChecklist) => {
    const meu = meus[item.chave] ?? 'pendente'
    const prazo = textoDoPrazo(item)
    const atrasado = meu === 'pendente' && prazoVencido(item, hoje)
    const quem = membros.filter((m) => resolveram(item.chave).includes(m.id))
    const estaAberto = aberto === item.chave
    return (
      <li key={item.chave} className={['doc', meu !== 'pendente' && 'feito', atrasado && 'atrasado'].filter(Boolean).join(' ')}>
        <div className="doc-linha">
          <button
            type="button"
            className="doc-marca"
            role="checkbox"
            aria-checked={meu === 'resolvido'}
            aria-label={`${item.titulo}: resolvido`}
            onClick={() => mudar(item.chave, 'resolvido')}
          >
            {meu === 'resolvido' && <Check size={14} aria-hidden="true" />}
            {meu === 'nao_preciso' && <span aria-hidden="true">–</span>}
          </button>
          <button type="button" className="doc-titulo" aria-expanded={estaAberto} onClick={() => setAberto(estaAberto ? null : item.chave)}>
            <span>
              <strong>{item.titulo}</strong>
              <small className={atrasado ? 'doc-prazo atrasado' : 'doc-prazo'}>
                {atrasado && <AlertTriangle size={12} aria-hidden="true" />}
                {meu === 'nao_preciso' ? 'Você não precisa' : meu === 'resolvido' ? 'Resolvido' : (prazo ?? '')}
                {atrasado && ' (passou)'}
              </small>
            </span>
            {item.aConfirmar && <span className="selo-completar">a confirmar</span>}
            {quem.length > 0 && (
              <span className="doc-quem" aria-label={`Já resolveram: ${quem.map((m) => m.nome).join(', ')}`}>
                {quem.slice(0, 3).map((m) => (
                  <Avatar key={m.id} nome={m.nome} url={m.avatarUrl} tamanho={20} />
                ))}
              </span>
            )}
            <ChevronDown size={16} aria-hidden="true" className="doc-seta" />
          </button>
        </div>
        {estaAberto && (
          <div className="doc-detalhe">
            <p>{item.texto}</p>
            <div className="doc-detalhe-rodape">
              <a href={item.fonte.url} target="_blank" rel="noreferrer noopener">
                {item.fonte.nome} <ExternalLink size={12} aria-hidden="true" />
              </a>
              <button type="button" className="botao-texto" aria-pressed={meu === 'nao_preciso'} onClick={() => mudar(item.chave, 'nao_preciso')}>
                {meu === 'nao_preciso' ? 'Preciso, sim' : 'Não preciso'}
              </button>
            </div>
          </div>
        )}
      </li>
    )
  }

  return (
    <section className={`checklist-docs ${className ?? ''}`} aria-label="Documentos">
      <header className="checklist-docs-topo">
        <h2>
          <FileCheck size={18} aria-hidden="true" /> Documentos
        </h2>
        <span className="checklist-docs-conta">
          {feitas}/{total}
        </span>
      </header>
      <p className="checklist-docs-sub">Pra entrar em {checklist.paises.map(nomeDoPais).join(', ')} com passaporte brasileiro</p>
      <div className="checklist-docs-barra" aria-hidden="true">
        <span style={{ width: `${total ? (feitas / total) * 100 : 0}%` }} />
      </div>

      {estado === 'erro' && (
        <p className="checklist-docs-erro">
          Não deu pra carregar o que já foi marcado.{' '}
          <button type="button" className="botao-texto" onClick={recarregar}>
            Tentar de novo
          </button>
        </p>
      )}
      {erro && (
        <p className="checklist-docs-erro" role="alert">
          {erro}
        </p>
      )}

      <ul className="checklist-docs-lista" aria-busy={estado === 'carregando'}>
        {tarefas.map(linha)}
      </ul>

      {avisos.length > 0 && (
        <details className="checklist-docs-avisos">
          <summary>
            <Info size={14} aria-hidden="true" /> Bom saber ({avisos.length})
          </summary>
          <ul>
            {avisos.map((a) => (
              <li key={a.chave}>
                <strong>{a.titulo}.</strong> {a.texto}{' '}
                <a href={a.fonte.url} target="_blank" rel="noreferrer noopener">
                  Fonte
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="checklist-docs-rodape">
        As regras mudam: confira na fonte oficial. Conferidas em {formatarData(checklist.itens[0].conferidoEm, true)}.
      </p>
    </section>
  )
}

import { useState } from 'react'
import { AlertTriangle, Check, ExternalLink, FileCheck, Info, MinusCircle } from 'lucide-react'
import { useViagemAtual } from '../../features/viagens/hooks'
import { useDocumentos } from '../../features/documentos/hooks'
import { prazoVencido, progresso, textoDoPrazo, type ItemChecklist, type Status } from '../../features/documentos/checklist'
import { nomeDoPais } from '../../features/documentos/paises'
import { hojeTexto } from '../../features/destinos/datas'
import { formatarData } from '../../lib/datas'
import Avatar from '../../components/ui/Avatar'
import CabecalhoPagina from '../../components/ui/CabecalhoPagina'
import EstadoVazio from '../../components/ui/EstadoVazio'
import './abas.css'
import './documentos.css'

// Documentos (spec 010): o que cada pessoa precisa pra entrar nos países do roteiro.
export default function Documentos() {
  const { viagem, destinos, membros, meuId } = useViagemAtual()
  const { checklist, estado, meus, marcar, resolveram, recarregar } = useDocumentos(viagem, destinos, meuId)
  const [erro, setErro] = useState<string | null>(null)
  const hoje = hojeTexto()

  const { feitas, total } = progresso(checklist.itens, meus)
  const tarefas = checklist.itens.filter((i) => i.tipo === 'tarefa')
  const avisos = checklist.itens.filter((i) => i.tipo === 'aviso')

  async function mudar(item: string, status: Status) {
    setErro(null)
    // Clicar de novo no que já está marcado desmarca
    const novo = (meus[item] ?? 'pendente') === status ? 'pendente' : status
    try {
      await marcar(item, novo)
    } catch {
      setErro('Não deu pra salvar. Confira a internet e tente de novo.')
    }
  }

  if (checklist.paises.length === 0) {
    return (
      <>
        <CabecalhoPagina titulo="Documentos" subtitulo="O que cada um precisa pra entrar nos países do roteiro." />
        <EstadoVazio
          icone={FileCheck}
          titulo="Viagem nacional"
          texto="Pra viajar no Brasil basta um documento com foto (RG, CIN ou CNH). Quando o roteiro tiver um destino fora do país, o checklist aparece aqui."
        />
      </>
    )
  }

  const linha = (item: ItemChecklist) => {
    const meu = meus[item.chave] ?? 'pendente'
    const prazo = textoDoPrazo(item)
    const atrasado = meu === 'pendente' && prazoVencido(item, hoje)
    const quem = membros.filter((m) => resolveram(item.chave).includes(m.id))
    return (
      <li key={item.chave} className={`documento ${meu !== 'pendente' ? 'feito' : ''} ${atrasado ? 'atrasado' : ''}`}>
        <div className="documento-topo">
          <strong>{item.titulo}</strong>
          {item.aConfirmar && <span className="selo-completar">a confirmar</span>}
        </div>
        <p>{item.texto}</p>
        <div className="documento-rodape">
          {prazo && (
            <span className={atrasado ? 'documento-prazo atrasado' : 'documento-prazo'}>
              {atrasado && <AlertTriangle size={13} aria-hidden="true" />}
              {atrasado ? `${prazo} (passou)` : prazo}
            </span>
          )}
          <a href={item.fonte.url} target="_blank" rel="noreferrer noopener">
            {item.fonte.nome} <ExternalLink size={12} aria-hidden="true" />
          </a>
        </div>
        <div className="documento-acoes">
          <div className="documento-botoes" role="group" aria-label={`Seu status: ${item.titulo}`}>
            <button type="button" aria-pressed={meu === 'resolvido'} onClick={() => mudar(item.chave, 'resolvido')}>
              <Check size={16} aria-hidden="true" /> Resolvido
            </button>
            <button type="button" aria-pressed={meu === 'nao_preciso'} onClick={() => mudar(item.chave, 'nao_preciso')}>
              <MinusCircle size={16} aria-hidden="true" /> Não preciso
            </button>
          </div>
          {quem.length > 0 && (
            <div className="documento-quem" aria-label={`Já resolveram: ${quem.map((m) => m.nome).join(', ')}`}>
              {quem.map((m) => (
                <span key={m.id} title={m.nome}>
                  <Avatar nome={m.nome} url={m.avatarUrl} tamanho={24} />
                </span>
              ))}
            </div>
          )}
        </div>
      </li>
    )
  }

  return (
    <>
      <CabecalhoPagina
        titulo="Documentos"
        subtitulo={`O que você precisa pra entrar em ${checklist.paises.map(nomeDoPais).join(', ')}, com passaporte brasileiro.`}
      />

      <section className="documentos-resumo" aria-label="Seu progresso">
        <strong>
          {feitas} de {total}
        </strong>
        <span>resolvidos por você</span>
        <div className="documentos-barra" aria-hidden="true">
          <span style={{ width: `${total ? (feitas / total) * 100 : 0}%` }} />
        </div>
      </section>

      {estado === 'carregando' && <p className="carregando-texto">Carregando o que o comboio já marcou…</p>}
      {estado === 'erro' && (
        <div className="aviso-erro">
          <p>Não deu pra carregar o que já foi marcado.</p>
          <button type="button" className="botao secundario pequeno" onClick={recarregar}>
            Tentar de novo
          </button>
        </div>
      )}
      {erro && (
        <p className="form-erro" role="alert">
          {erro}
        </p>
      )}

      <ul className="documentos">{tarefas.map(linha)}</ul>

      {avisos.length > 0 && (
        <section className="documentos-avisos" aria-label="Bom saber">
          <h2>Bom saber</h2>
          <ul>
            {avisos.map((a) => (
              <li key={a.chave}>
                <Info size={16} aria-hidden="true" />
                <span>
                  <strong>{a.titulo}.</strong> {a.texto}{' '}
                  <a href={a.fonte.url} target="_blank" rel="noreferrer noopener">
                    Fonte
                  </a>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="documentos-aviso">
        As regras mudam. Confira sempre na fonte oficial antes de viajar. Regras conferidas em{' '}
        {formatarData(checklist.itens[0].conferidoEm, true)}.
      </p>
    </>
  )
}

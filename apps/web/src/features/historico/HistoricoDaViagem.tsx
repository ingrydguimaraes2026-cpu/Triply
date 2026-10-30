import { useCallback, useEffect, useState } from 'react'
import { History, RotateCcw } from 'lucide-react'
import { diasNaLixeira, fraseDoHistorico, podeRestaurar, type ItemDoHistorico } from '@together/core'
import { supabase } from '../../lib/supabase'
import { useViagemAtual } from '../viagens/hooks'
import { avisarQueGastosMudaram } from '../financeiro/api'
import { avisarQueMudou } from '../tempo-real/avisos'
import Cartao from '../../components/ui/Cartao'
import './historico.css'

// Histórico e lixeira (spec 087): quem editou/apagou o quê nos últimos 30 dias,
// com "Restaurar" pra quem apagou (ou pro ADM).
export default function HistoricoDaViagem() {
  const { viagem, membros, meuId, euSouAdm } = useViagemAtual()
  const [itens, setItens] = useState<ItemDoHistorico[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [vendoTudo, setVendoTudo] = useState(false)
  const [restaurando, setRestaurando] = useState<string | null>(null)

  const recarregar = useCallback(() => {
    supabase
      .from('historico_viagem')
      .select('id, tabela, linha_id, acao, autor, titulo, restaurado_em, criado_em')
      .eq('viagem_id', viagem.id)
      .order('criado_em', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) {
          console.error('Erro ao buscar o histórico:', error)
          setErro('Não deu pra carregar o histórico.')
          return
        }
        setItens((data ?? []) as ItemDoHistorico[])
      })
  }, [viagem.id])
  useEffect(recarregar, [recarregar])

  async function restaurar(item: ItemDoHistorico) {
    setErro(null)
    setRestaurando(item.id)
    const { error } = await supabase.rpc('restaurar_da_lixeira', { p_id: item.id })
    setRestaurando(null)
    if (error) {
      setErro(error.message || 'Não deu pra restaurar.')
      return
    }
    if (item.tabela === 'gastos') avisarQueGastosMudaram()
    else avisarQueMudou(item.tabela)
    recarregar()
  }

  if (!itens) return erro ? <p className="form-erro">{erro}</p> : null
  if (itens.length === 0) return null

  const agora = new Date()
  const nome = (id: string | null) => membros.find((m) => m.id === id)?.nome.split(' ')[0] ?? 'Alguém'
  const mostrados = vendoTudo ? itens : itens.slice(0, 5)

  return (
    <Cartao titulo="Histórico e lixeira" icone={History}>
      <p className="form-dica">Edições e itens apagados nos últimos 30 dias. Quem apagou (ou o ADM) pode pôr de volta.</p>
      {erro && (
        <p className="form-erro" role="alert">
          {erro}
        </p>
      )}
      <ul className="historico-lista">
        {mostrados.map((item) => (
          <li key={item.id}>
            <span className="historico-texto">
              {fraseDoHistorico(item, item.autor === meuId ? 'Você' : nome(item.autor))}
              <small>
                {new Date(item.criado_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                {item.acao === 'apagou' && !item.restaurado_em && ` · some em ${diasNaLixeira(item, agora)} dias`}
                {item.restaurado_em && ' · restaurado'}
              </small>
            </span>
            {podeRestaurar(item, meuId, euSouAdm, agora) && (
              <button type="button" className="botao secundario pequeno" disabled={restaurando === item.id} onClick={() => restaurar(item)}>
                <RotateCcw size={14} aria-hidden="true" /> {restaurando === item.id ? 'Restaurando…' : 'Restaurar'}
              </button>
            )}
          </li>
        ))}
      </ul>
      {itens.length > 5 && (
        <button type="button" className="botao-texto" onClick={() => setVendoTudo(!vendoTudo)}>
          {vendoTudo ? 'Ver menos' : `Ver tudo (${itens.length})`}
        </button>
      )}
    </Cartao>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Download, ShieldCheck, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { baixarArquivo } from '../../lib/baixar'
import { sair } from '../auth/hooks'
import Gaveta from '../../components/ui/Gaveta'
import './privacidade.css'

// Privacidade e LGPD (spec 089): baixar meus dados e excluir minha conta.
export default function MinhaPrivacidade() {
  const navegar = useNavigate()
  const [baixando, setBaixando] = useState(false)
  const [excluindo, setExcluindo] = useState(false) // gaveta aberta
  const [confirmacao, setConfirmacao] = useState('')
  const [trabalhando, setTrabalhando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function baixarMeusDados() {
    setErro(null)
    setBaixando(true)
    const { data, error } = await supabase.rpc('meus_dados')
    setBaixando(false)
    if (error) {
      console.error('Erro ao juntar meus dados:', error)
      setErro('Não deu pra juntar seus dados agora. Tente de novo.')
      return
    }
    const hoje = new Date().toISOString().slice(0, 10)
    baixarArquivo(`together-meus-dados-${hoje}.json`, JSON.stringify(data, null, 2), 'application/json')
  }

  async function excluirConta() {
    setErro(null)
    setTrabalhando(true)
    const { data, error } = await supabase.functions.invoke('excluir-conta', { body: { confirmar: 'EXCLUIR' } })
    if (error || data?.erro) {
      setTrabalhando(false)
      setErro(data?.erro ?? 'Não deu pra excluir a conta agora. Tente de novo.')
      return
    }
    await sair()
    navegar('/login', { replace: true })
  }

  return (
    <section className="cartao-ui privacidade">
      <h2>
        <ShieldCheck size={18} aria-hidden="true" /> Privacidade
      </h2>
      <p className="form-dica">Gasto marcado como pessoal só você vê. Ficha, documentos e mala também são só seus, a não ser o que a ficha diz que o comboio vê.</p>
      <div className="privacidade-acoes">
        <button type="button" className="botao secundario" onClick={baixarMeusDados} disabled={baixando}>
          <Download size={16} aria-hidden="true" /> {baixando ? 'Juntando…' : 'Baixar meus dados'}
        </button>
        <button type="button" className="botao-texto perigo" onClick={() => setExcluindo(true)}>
          <Trash2 size={16} aria-hidden="true" /> Excluir minha conta
        </button>
      </div>
      {erro && !excluindo && (
        <p className="form-erro" role="alert">
          {erro}
        </p>
      )}

      {excluindo && (
        <Gaveta titulo="Excluir minha conta" aoFechar={() => !trabalhando && setExcluindo(false)}>
          <div className="form">
            <p>O que acontece:</p>
            <ul className="privacidade-lista">
              <li>Você sai de todas as viagens. Se for o único ADM, o ADM passa pra quem entrou primeiro.</li>
              <li>Viagem em que só você está é apagada.</li>
              <li>Ficha, documentos, mala, orçamento pessoal, carteira e gastos pessoais são apagados.</li>
              <li>Gastos divididos, fotos e posts continuam pro comboio, com o nome “Conta excluída”, pra não bagunçar as contas de ninguém.</li>
              <li>Não dá pra desfazer. Se quiser, baixe seus dados antes.</li>
            </ul>
            <div className="form-campo">
              <label className="form-rotulo" htmlFor="confirmar-exclusao">
                Pra confirmar, escreva EXCLUIR
              </label>
              <input id="confirmar-exclusao" autoComplete="off" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} />
            </div>
            {erro && (
              <p className="form-erro" role="alert">
                {erro}
              </p>
            )}
            <div className="form-rodape">
              <button type="button" className="botao perigo" disabled={confirmacao.trim().toUpperCase() !== 'EXCLUIR' || trabalhando} onClick={excluirConta}>
                {trabalhando ? 'Excluindo…' : 'Excluir de vez'}
              </button>
            </div>
          </div>
        </Gaveta>
      )}
    </section>
  )
}

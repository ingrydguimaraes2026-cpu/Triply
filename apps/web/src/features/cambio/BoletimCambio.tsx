import { useEffect, useState } from 'react'
import { BellOff, BellRing, Check, Send } from 'lucide-react'
import { mensagemDeErro } from '../financeiro/api'
import { buscarBoletim, ehIphone, ligarAvisos, marcarBoletim, situacaoDoAviso, testarAviso, type SituacaoAviso } from './avisos'

type Props = { viagemId: string; meuId: string; moeda: string }

const NOMES: Record<string, string> = { EUR: 'euro', USD: 'dólar', GBP: 'libra' }

// Boletim do câmbio no celular às 12h e 20h (spec 013): quanto subiu/caiu e se está barato
export default function BoletimCambio({ viagemId, meuId, moeda }: Props) {
  const [boletimLigado, setBoletimLigado] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [situacao, setSituacao] = useState<SituacaoAviso | null>(null)
  const [recado, setRecado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const nome = NOMES[moeda] ?? moeda

  useEffect(() => {
    let ativo = true
    buscarBoletim(viagemId, moeda)
      .then((b) => {
        if (ativo && b) setBoletimLigado(b.avisar)
      })
      .catch((e) => console.error('Erro ao buscar o boletim:', e))
    situacaoDoAviso().then((s) => ativo && setSituacao(s))
    return () => {
      ativo = false
    }
  }, [viagemId, moeda])

  const recebendo = boletimLigado && situacao === 'ligado'

  function limpar() {
    setErro(null)
    setRecado(null)
  }

  async function ligar() {
    limpar()
    setOcupado(true)
    try {
      if (situacao !== 'ligado') await ligarAvisos()
      setSituacao('ligado')
      await marcarBoletim(viagemId, meuId, moeda, true)
      setBoletimLigado(true)
      setRecado('Pronto! Toque em "Testar" pra ver como o boletim chega.')
    } catch (e) {
      const motivo = (e as Error).message
      if (motivo === 'negado') setSituacao('negado')
      else if (motivo === 'sem-app') setSituacao('sem-app')
      else setErro(mensagemDeErro(e, 'Não deu pra ligar o boletim.'))
    } finally {
      setOcupado(false)
    }
  }

  async function parar() {
    limpar()
    try {
      await marcarBoletim(viagemId, meuId, moeda, false)
      setBoletimLigado(false)
      setRecado('Boletim desligado.')
    } catch (e) {
      setErro(mensagemDeErro(e, 'Não deu pra desligar o boletim.'))
    }
  }

  async function testar() {
    limpar()
    try {
      const n = await testarAviso()
      setRecado(n > 0 ? 'Boletim de teste enviado. Deve chegar em alguns segundos.' : 'Nenhum aparelho com notificação ligada.')
    } catch (e) {
      setErro(mensagemDeErro(e, 'O teste não foi. Tente de novo em instantes.'))
    }
  }

  return (
    <div className="termometro-meta">
      <div className="termometro-aviso">
        {situacao === 'iphone-instalar' ? (
          <p>
            No iPhone, o boletim só chega com o app instalado: no Safari, toque em Compartilhar → "Adicionar à Tela de Início" e abra o Together por lá.
          </p>
        ) : situacao === 'negado' ? (
          <p>
            As notificações estão bloqueadas pra este site. Libere nas configurações do {ehIphone() ? 'iPhone' : 'navegador'} e volte aqui.
          </p>
        ) : situacao === 'sem-app' ? (
          <p>O boletim no celular funciona no app publicado (ou instalado). Aqui, no modo de desenvolvimento, ele não liga.</p>
        ) : situacao === 'sem-suporte' ? (
          <p>Este navegador não recebe notificações. Tente pelo Chrome ou com o app instalado.</p>
        ) : recebendo ? (
          <>
            <p>
              <Check size={14} aria-hidden="true" /> Você recebe o boletim do {nome} às 12h e às 20h: quanto subiu ou caiu e se está barato.
            </p>
            <div className="termometro-aviso-botoes">
              <button type="button" className="botao secundario pequeno" onClick={testar}>
                <Send size={14} aria-hidden="true" /> Testar
              </button>
              <button type="button" className="botao-texto" onClick={parar}>
                <BellOff size={14} aria-hidden="true" /> Parar boletim
              </button>
            </div>
          </>
        ) : situacao ? (
          <>
            <p>Receba no celular, às 12h e às 20h, quanto o {nome} subiu ou caiu e se está barato pra comprar.</p>
            <button type="button" className="botao pequeno" onClick={ligar} disabled={ocupado}>
              <BellRing size={14} aria-hidden="true" /> {ocupado ? 'Ligando…' : `Receber boletim do ${nome}`}
            </button>
          </>
        ) : null}
      </div>

      {recado && <p className="termometro-recado">{recado}</p>}
      {erro && (
        <p className="form-erro" role="alert">
          {erro}
        </p>
      )}
    </div>
  )
}

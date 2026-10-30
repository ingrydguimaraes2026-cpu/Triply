import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Lock } from 'lucide-react'
import { buscarFaixaDoComboio, buscarMinhaFaixa, formatarDinheiro, leituraDaFaixa, salvarMinhaFaixa, type FaixaDoComboio } from '@together/core'
import { supabase } from '../../lib/supabase'

// "1.500,50" → 150050 centavos (null se não der)
function paraCentavos(texto: string): number | null {
  const limpo = texto.trim().replace(/\./g, '').replace(',', '.')
  if (!limpo) return null
  const n = Number(limpo)
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null
}
const paraCampo = (centavos: number) => (centavos / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })

// Orçamento combinado (spec 045): minha faixa (secreta) + a faixa que serve pra todo o comboio
export default function OrcamentoCombinado({ viagemId, meuId, moeda }: { viagemId: string; meuId: string; moeda: string }) {
  const [faixa, setFaixa] = useState<FaixaDoComboio | null>(null)
  const [minimo, setMinimo] = useState('')
  const [maximo, setMaximo] = useState('')
  const [jaRespondi, setJaRespondi] = useState(false)
  const [editando, setEditando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const recarregar = useCallback(() => {
    buscarFaixaDoComboio(supabase, viagemId)
      .then(setFaixa)
      .catch((e) => console.error('Erro ao buscar a faixa do comboio:', e))
  }, [viagemId])

  useEffect(() => {
    recarregar()
    buscarMinhaFaixa(supabase, viagemId)
      .then((m) => {
        if (!m) return
        setJaRespondi(true)
        setMinimo(paraCampo(m.minimo))
        setMaximo(paraCampo(m.maximo))
      })
      .catch((e) => console.error('Erro ao buscar minha faixa:', e))
  }, [viagemId, recarregar])

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    const min = paraCentavos(minimo)
    const max = paraCentavos(maximo)
    if (min === null || max === null) return setErro('Preencha os dois valores. Ex.: 5.000 e 8.000')
    if (max < min) return setErro('O máximo está menor que o mínimo.')
    try {
      await salvarMinhaFaixa(supabase, viagemId, meuId, min, max)
      setJaRespondi(true)
      setEditando(false)
      recarregar()
    } catch {
      setErro('Não deu pra salvar. Tente de novo.')
    }
  }

  const leitura = faixa ? leituraDaFaixa(faixa) : null

  return (
    <div className="orcamento-combinado">
      {faixa && leitura && (
        <p className={`orcamento-combinado-resultado tipo-${leitura.tipo}`}>
          {leitura.tipo === 'comum' && (
            <>
              Faixa que serve pra todos: <strong>{formatarDinheiro(faixa.minimo!, moeda)}</strong> a <strong>{formatarDinheiro(faixa.maximo!, moeda)}</strong> por pessoa
            </>
          )}
          {leitura.tipo === 'sem_acordo' && <>Ainda não há uma faixa que sirva pra todos. Vale conversar sobre o que entra no orçamento.</>}
          {leitura.tipo === 'esperando' && <>Assim que 2 pessoas responderem, aparece a faixa comum.</>}
          <small>
            {' '}
            · {faixa.responderam} de {faixa.pessoas} responderam
          </small>
        </p>
      )}

      {jaRespondi && !editando ? (
        <p className="orcamento-combinado-minha">
          <Lock size={13} aria-hidden="true" /> Sua faixa: {minimo} a {maximo} ({moeda}).{' '}
          <button type="button" className="botao-texto" onClick={() => setEditando(true)}>
            Mudar
          </button>
        </p>
      ) : (
        <form className="form" onSubmit={salvar} noValidate>
          <p className="form-dica">
            <Lock size={13} aria-hidden="true" /> Quanto você topa gastar na viagem toda, por pessoa ({moeda})? Ninguém vê o seu valor.
          </p>
          <div className="form-linha">
            <div className="form-campo">
              <label className="form-rotulo" htmlFor="faixa-min">
                De
              </label>
              <input id="faixa-min" inputMode="decimal" placeholder="5.000" value={minimo} onChange={(e) => setMinimo(e.target.value)} />
            </div>
            <div className="form-campo">
              <label className="form-rotulo" htmlFor="faixa-max">
                Até
              </label>
              <input id="faixa-max" inputMode="decimal" placeholder="8.000" value={maximo} onChange={(e) => setMaximo(e.target.value)} />
            </div>
          </div>
          {erro && <p className="form-erro">{erro}</p>}
          <div className="form-rodape">
            <button type="submit" className="botao pequeno">
              Salvar em segredo
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

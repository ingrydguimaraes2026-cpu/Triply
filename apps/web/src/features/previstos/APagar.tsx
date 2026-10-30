import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Check, Plus, Trash2, Wallet } from 'lucide-react'
import {
  apagarPrevisto,
  buscarPrevistos,
  criarPrevistos,
  formatarDinheiro,
  marcarPrevistoPago,
  repetirPorDia,
  situacaoDoPrevisto,
  totalAPagar,
  type NovoPrevisto,
  type PagamentoPrevisto,
} from '@together/core'
import { supabase } from '../../lib/supabase'
import { hojeTexto } from '../destinos/datas'
import { formatarData } from '../../lib/datas'
import { CATEGORIAS } from '../financeiro/categorias'
import FormGasto from '../financeiro/FormGasto'
import Gaveta from '../../components/ui/Gaveta'
import type { Membro } from '../viagens/hooks'
import './previstos.css'

type Props = { viagemId: string; moeda: string; membros: Membro[]; meuId: string; euSouAdm: boolean; aoLancar: () => void }

const SITUACAO = { atrasado: 'atrasado', hoje: 'vence hoje', em_breve: 'em breve', depois: '', pago: 'pago' }

// Pagamentos previstos (spec 057): o que ainda vai ser pago. Fora dos acertos até virar gasto.
export default function APagar({ viagemId, moeda, membros, meuId, euSouAdm, aoLancar }: Props) {
  const [previstos, setPrevistos] = useState<PagamentoPrevisto[] | null>(null)
  const [novo, setNovo] = useState(false)
  const [pagando, setPagando] = useState<PagamentoPrevisto | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const hoje = hojeTexto()

  const recarregar = useCallback(() => {
    buscarPrevistos(supabase, viagemId)
      .then(setPrevistos)
      .catch((e) => console.error('Erro ao buscar pagamentos previstos:', e))
  }, [viagemId])
  useEffect(recarregar, [recarregar])

  if (!previstos) return null
  const pendentes = previstos.filter((p) => !p.pago_em)
  const total = totalAPagar(previstos)
  const nome = (id: string | null) => (id === meuId ? 'você' : (membros.find((m) => m.id === id)?.nome ?? null))

  async function apagar(p: PagamentoPrevisto) {
    try {
      await apagarPrevisto(supabase, p.id)
      recarregar()
    } catch {
      setErro('Não deu pra apagar.')
    }
  }

  return (
    <div className="a-pagar">
      {pendentes.length === 0 ? (
        <p className="numero-legenda">Nada previsto. Use pra sinal/saldo de reserva ou diárias (estacionamento, carro).</p>
      ) : (
        <>
          <p className="numero-legenda">
            Falta pagar {Object.entries(total).map(([m, v]) => formatarDinheiro(v, m)).join(' + ')} · fora da conta de quem deve pra quem até ser pago
          </p>
          <ul className="a-pagar-lista">
            {pendentes.map((p) => {
              const s = situacaoDoPrevisto(p, hoje)
              const quem = nome(p.quem_paga)
              return (
                <li key={p.id} className={`situacao-${s}`}>
                  <span className="a-pagar-texto">
                    <strong>{p.descricao}</strong>
                    <small>
                      {formatarDinheiro(p.valor, p.moeda)}
                      {p.vence_em && ` · ${formatarData(p.vence_em)}`}
                      {SITUACAO[s] && ` · ${SITUACAO[s]}`}
                      {quem && ` · ${quem} paga`}
                    </small>
                  </span>
                  <button type="button" className="botao secundario pequeno" onClick={() => setPagando(p)}>
                    <Wallet size={14} aria-hidden="true" /> Paguei
                  </button>
                  {(p.criado_por === meuId || euSouAdm) && (
                    <button type="button" className="botao-texto" aria-label={`Apagar ${p.descricao}`} onClick={() => apagar(p)}>
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}
      <button type="button" className="botao-texto alinhar-inicio" onClick={() => setNovo(true)}>
        <Plus size={15} aria-hidden="true" /> Pagamento previsto
      </button>
      {erro && <p className="form-erro">{erro}</p>}

      {novo && (
        <Gaveta titulo="Pagamento previsto" aoFechar={() => setNovo(false)}>
          <FormPrevisto
            moeda={moeda}
            membros={membros}
            aoSalvar={async (lista) => {
              await criarPrevistos(supabase, viagemId, lista)
              setNovo(false)
              recarregar()
            }}
          />
        </Gaveta>
      )}

      {pagando && (
        <Gaveta titulo="Lançar o pagamento como gasto" aoFechar={() => setPagando(null)}>
          <FormGasto
            viagemId={viagemId}
            moedaViagem={moeda}
            membros={membros}
            meuId={meuId}
            euSouAdm={euSouAdm}
            inicial={{
              descricao: pagando.descricao,
              valor: pagando.valor,
              moeda: pagando.moeda,
              categoria: pagando.categoria,
              ...(pagando.quem_paga ? { pagoPor: pagando.quem_paga } : {}),
            }}
            aoTerminar={() => {
              const pago = pagando
              setPagando(null)
              marcarPrevistoPago(supabase, pago.id, true)
                .then(() => {
                  recarregar()
                  aoLancar()
                })
                .catch(() => setErro('O gasto foi lançado, mas não deu pra marcar o previsto como pago.'))
            }}
          />
        </Gaveta>
      )}
    </div>
  )
}

function FormPrevisto({ moeda, membros, aoSalvar }: { moeda: string; membros: Membro[]; aoSalvar: (lista: NovoPrevisto[]) => Promise<void> }) {
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [moedaEscolhida, setMoeda] = useState(moeda)
  const [categoria, setCategoria] = useState('hospedagem')
  const [vence, setVence] = useState('')
  const [quem, setQuem] = useState('')
  const [repetir, setRepetir] = useState(false)
  const [ate, setAte] = useState('')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    const centavos = Math.round(Number(valor.trim().replace(/\./g, '').replace(',', '.')) * 100)
    if (!descricao.trim()) return setErro('O que vai ser pago?')
    if (!Number.isFinite(centavos) || centavos <= 0) return setErro('Valor inválido. Ex.: 450,00')
    if (repetir && (!vence || !ate || ate < vence)) return setErro('Pra repetir, escolha o primeiro e o último dia.')
    const base: NovoPrevisto = { descricao, valor: centavos, moeda: moedaEscolhida.toUpperCase(), categoria, venceEm: vence || null, quemPaga: quem || null }
    setSalvando(true)
    try {
      await aoSalvar(repetir ? repetirPorDia(base, vence, ate) : [base])
    } catch {
      setErro('Não deu pra salvar.')
      setSalvando(false)
    }
  }

  return (
    <form className="form" onSubmit={salvar} noValidate>
      <div className="form-campo">
        <label className="form-rotulo" htmlFor="prev-desc">
          O que vai ser pago
        </label>
        <input id="prev-desc" maxLength={200} placeholder="Ex.: saldo do Airbnb no check-in" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
      </div>
      <div className="form-linha">
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="prev-valor">
            Valor {repetir && '(por dia)'}
          </label>
          <input id="prev-valor" inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} />
        </div>
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="prev-moeda">
            Moeda
          </label>
          <input id="prev-moeda" maxLength={3} value={moedaEscolhida} onChange={(e) => setMoeda(e.target.value.toUpperCase())} />
        </div>
      </div>
      <div className="form-linha">
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="prev-cat">
            Categoria
          </label>
          <select id="prev-cat" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {CATEGORIAS.map((c) => (
              <option key={c.chave} value={c.chave}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="prev-quem">
            Quem paga
          </label>
          <select id="prev-quem" value={quem} onChange={(e) => setQuem(e.target.value)}>
            <option value="">A combinar</option>
            {membros.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-linha">
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="prev-vence">
            {repetir ? 'Primeiro dia' : 'Vence em'}
          </label>
          <input id="prev-vence" type="date" value={vence} onChange={(e) => setVence(e.target.value)} />
        </div>
        {repetir && (
          <div className="form-campo">
            <label className="form-rotulo" htmlFor="prev-ate">
              Último dia
            </label>
            <input id="prev-ate" type="date" min={vence || undefined} value={ate} onChange={(e) => setAte(e.target.value)} />
          </div>
        )}
      </div>
      <label className="interruptor">
        <span>
          <strong>Repetir todo dia</strong>
          <small>Diária de estacionamento, aluguel de carro…</small>
        </span>
        <input type="checkbox" checked={repetir} onChange={(e) => setRepetir(e.target.checked)} />
      </label>
      {erro && (
        <p className="form-erro" role="alert">
          {erro}
        </p>
      )}
      <div className="form-rodape">
        <button type="submit" className="botao" disabled={salvando}>
          <Check size={16} aria-hidden="true" /> {salvando ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </form>
  )
}

import { useEffect, useState, type FormEvent } from 'react'
import { ArrowDownLeft, ArrowUpRight, Check, FileSearch, Mail, RefreshCw, Users, Wallet } from 'lucide-react'
import Cartao from '../../components/ui/Cartao'
import Gaveta from '../../components/ui/Gaveta'
import { formatarDinheiro, lerValor, paraCampo } from '@together/core'
import type { EstadoCarteira } from './hooks'
import {
  ajustarSaldo,
  desconectar,
  diagnosticoEmails,
  salvarSaldoInicial,
  sincronizar,
  urlDeConsentimento,
  type Carteira as TCarteira,
  type ItemDiagnostico,
  type Movimento,
} from './api'
import './carteira.css'

// "há 5 min", "há 2 h", "ontem"…
function quando(iso: string | null): string {
  if (!iso) return 'ainda não li seus e-mails'
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'lido agora'
  if (min < 60) return `lido há ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `lido há ${h} h`
  return `lido há ${Math.round(h / 24)} dias`
}

const euros = (v: number) => formatarDinheiro(Math.round(v * 100), 'EUR')

// Carteira de euro da pessoa, alimentada pelos e-mails do Wise/Nomad (spec 015).
// O estado vem do Financeiro (que também usa o saldo no card do topo), pra não buscar 2x.
type Props = {
  viagemId: string
  meuId: string
  estado: EstadoCarteira
  recarregar: () => Promise<void>
  aoVirarGasto?: (m: Movimento) => void // spec 084: abre o formulário de gasto já preenchido
}
export default function Carteira({ viagemId, meuId, estado, recarregar, aoVirarGasto }: Props) {
  const [erro, setErro] = useState<string | null>(null)
  const [sincronizando, setSincronizando] = useState(false)
  const [ajustando, setAjustando] = useState(false)
  const [diag, setDiag] = useState<ItemDiagnostico[] | 'carregando' | null>(null)

  // Conectou mas ainda não tem carteira nesta viagem? Cria uma (saldo começa em 0; os e-mails somam).
  const conexao = estado.status === 'pronto' ? estado.conexao : null
  const carteira = estado.status === 'pronto' ? estado.carteira : null
  useEffect(() => {
    if (estado.status === 'pronto' && conexao && !carteira) {
      salvarSaldoInicial(viagemId, meuId, 0, 'EUR').then(recarregar).catch(() => setErro('Não deu pra preparar a carteira.'))
    }
  }, [estado.status, conexao, carteira, viagemId, meuId, recarregar])

  if (estado.status === 'carregando') return <p className="carregando-texto">Carregando a carteira…</p>
  if (estado.status === 'erro')
    return (
      <Cartao titulo="Minha carteira de euro" icone={Wallet}>
        <div className="aviso-erro">
          <p>Não deu pra carregar a carteira.</p>
          <button type="button" className="botao secundario pequeno" onClick={recarregar}>
            Tentar de novo
          </button>
        </div>
      </Cartao>
    )

  const { movimentos, comboio } = estado

  async function aoSincronizar() {
    setErro(null)
    setSincronizando(true)
    try {
      await sincronizar()
      await recarregar()
    } catch {
      setErro('Não deu pra sincronizar agora. Tente de novo.')
    }
    setSincronizando(false)
  }

  async function aoDesconectar() {
    setErro(null)
    try {
      await desconectar(false)
      await recarregar()
    } catch {
      setErro('Não deu pra desconectar.')
    }
  }

  async function abrirDiagnostico() {
    setErro(null)
    setDiag('carregando')
    try {
      setDiag(await diagnosticoEmails())
    } catch {
      setErro('Não deu pra rodar o diagnóstico.')
      setDiag(null)
    }
  }

  // ----- Ainda não conectou: só o convite -----
  if (!conexao || conexao.status === 'erro') {
    return (
      <Cartao titulo="Minha carteira de euro" icone={Wallet}>
        {comboio > 0 && (
          <p className="carteira-comboio">
            Euro do comboio: <strong>{euros(comboio)}</strong>
          </p>
        )}
        <div className="carteira-convite">
          <span className="carteira-convite-icone">
            <Mail size={26} aria-hidden="true" />
          </span>
          <p>Conecte seu Gmail e o Together puxa sozinho suas recargas e gastos em euro do Wise e do Nomad.</p>
          <a className="botao" href={urlDeConsentimento(viagemId)}>
            <Mail size={18} aria-hidden="true" /> Conectar Gmail
          </a>
          <small>Só leitura dos e-mails do Wise/Nomad. Dá pra desconectar quando quiser.</small>
        </div>
      </Cartao>
    )
  }

  // ----- Conectado -----
  return (
    <Cartao titulo="Minha carteira de euro" icone={Wallet}>
      {comboio > 0 && (
        <p className="carteira-comboio">
          Euro do comboio: <strong>{euros(comboio)}</strong>
        </p>
      )}

      <p className="carteira-saldo">{euros(carteira?.saldo_atual ?? 0)}</p>
      <p className="carteira-saldo-sub">na sua conta Wise/Nomad</p>

      {/* Status do Gmail */}
      <div className="carteira-gmail">
        {conexao.status === 'expirado' ? (
          <>
            <span className="carteira-reconectar">O acesso ao Gmail expirou (acontece a cada 7 dias).</span>
            <a className="botao pequeno" href={urlDeConsentimento(viagemId)}>
              <RefreshCw size={16} aria-hidden="true" /> Reconectar
            </a>
          </>
        ) : (
          <>
            <span className="carteira-conectado">
              <Mail size={15} aria-hidden="true" /> {conexao.email}
              <span className="carteira-ponto" aria-hidden="true">
                ·
              </span>
              {quando(conexao.ultimo_sync)}
            </span>
            <span className="carteira-acoes">
              <button type="button" className="botao-texto" onClick={aoSincronizar} disabled={sincronizando}>
                <RefreshCw size={15} aria-hidden="true" className={sincronizando ? 'girando' : undefined} />
                {sincronizando ? 'Lendo…' : 'Sincronizar'}
              </button>
              <button type="button" className="botao-texto" onClick={aoDesconectar}>
                Desconectar
              </button>
            </span>
          </>
        )}
      </div>

      {erro && (
        <p className="form-erro" role="alert">
          {erro}
        </p>
      )}

      {/* Movimentos */}
      {movimentos.length === 0 ? (
        <p className="form-dica">
          Nenhum movimento ainda. Assim que chegar um e-mail de recarga ou compra do Wise/Nomad, ele aparece aqui.
        </p>
      ) : (
        <ul className="carteira-movimentos">
          {movimentos.map((m) => (
            <li key={m.id}>
              <span className={m.tipo === 'entrada' ? 'mov-entrada' : 'mov-gasto'}>
                {m.tipo === 'entrada' ? <ArrowDownLeft size={16} aria-hidden="true" /> : <ArrowUpRight size={16} aria-hidden="true" />}
              </span>
              <span className="mov-texto">
                {m.descricao ?? (m.tipo === 'entrada' ? 'Entrada' : 'Gasto')}
                <small>{new Date(m.data).toLocaleDateString('pt-BR')}</small>
              </span>
              <span className={`mov-valor ${m.tipo === 'entrada' ? 'mov-mais' : 'mov-menos'}`}>
                {m.tipo === 'entrada' ? '+' : '−'} {formatarDinheiro(Math.round(m.valor * 100), m.moeda)}
              </span>
              {m.tipo === 'gasto' &&
                (m.gasto_id ? (
                  <small className="mov-virou">
                    <Check size={13} aria-hidden="true" /> já é gasto do comboio
                  </small>
                ) : (
                  aoVirarGasto && (
                    <button type="button" className="botao-texto mov-virar" onClick={() => aoVirarGasto(m)}>
                      <Users size={14} aria-hidden="true" /> Virar gasto do comboio
                    </button>
                  )
                ))}
            </li>
          ))}
        </ul>
      )}

      {/* Correção manual + diagnóstico, discretos */}
      {carteira && (
        <p className="carteira-rodape">
          {(carteira.saldo_inicial !== 0 || carteira.ajuste !== 0) && (
            <span>
              Base {euros(carteira.saldo_inicial + carteira.ajuste)} + e-mails ·{' '}
            </span>
          )}
          <button type="button" className="botao-texto" onClick={() => setAjustando(true)}>
            Ajustar saldo
          </button>
          <span className="carteira-ponto" aria-hidden="true">
            ·
          </span>
          <button type="button" className="botao-texto" onClick={abrirDiagnostico}>
            <FileSearch size={14} aria-hidden="true" /> Diagnóstico
          </button>
        </p>
      )}

      {diag !== null && (
        <Gaveta titulo="Diagnóstico de e-mails" aoFechar={() => setDiag(null)}>
          {diag === 'carregando' ? (
            <p className="carregando-texto">Lendo seus e-mails do Wise/Nomad…</p>
          ) : diag.length === 0 ? (
            <p className="form-dica">Nenhum e-mail do Wise/Nomad encontrado nessa conta.</p>
          ) : (
            <>
              <p className="form-dica">
                O que o Wise/Nomad mandaram pra você. <strong>💶 = achei valor em euro</strong> (dá pra puxar). Sem valor = só aviso (ex.: "extrato
                disponível").
              </p>
              <ul className="diag-lista">
                {diag.map((it, i) => (
                  <li key={i} className={it.euro ? 'tem' : undefined}>
                    <span className="diag-topo">
                      {it.euro ? '💶 ' : ''}
                      <strong>{it.provedor}</strong>
                      {it.data ? ` · ${it.data}` : ''}
                      {it.palavra ? ` · ${it.palavra}` : ''}
                    </span>
                    <span className="diag-assunto">{it.assunto || '(sem assunto)'}</span>
                    {it.trecho && <small className="diag-trecho">{it.trecho}</small>}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Gaveta>
      )}

      {ajustando && carteira && (
        <FormAjuste
          carteira={carteira}
          aoFechar={() => setAjustando(false)}
          aoSalvar={async (novoAjuste) => {
            await ajustarSaldo(carteira.id, novoAjuste)
            setAjustando(false)
            await recarregar()
          }}
        />
      )}
    </Cartao>
  )
}

// Gaveta pra corrigir o saldo na mão. A pessoa diz o saldo certo; a gente calcula o ajuste.
function FormAjuste({ carteira, aoFechar, aoSalvar }: { carteira: TCarteira; aoFechar: () => void; aoSalvar: (ajuste: number) => Promise<void> }) {
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    const campo = (e.currentTarget as HTMLFormElement).elements.namedItem('certo') as HTMLInputElement
    const centavos = lerValor(campo.value)
    if (centavos === null) return setErro('Põe o saldo certo, tipo 480.')
    // saldo_atual = saldo_inicial + ajuste + movimentos. Pra deixar o saldo = X:
    //   novoAjuste = ajusteAtual + (X - saldoAtual)
    const novoAjuste = carteira.ajuste + (centavos / 100 - carteira.saldo_atual)
    setErro(null)
    setSalvando(true)
    try {
      await aoSalvar(Number(novoAjuste.toFixed(2)))
    } catch {
      setErro('Não deu pra ajustar. Tenta de novo.')
      setSalvando(false)
    }
  }

  return (
    <Gaveta titulo="Ajustar saldo" aoFechar={aoFechar}>
      <form className="form" onSubmit={enviar}>
        <p className="form-dica">Se o saldo aqui não bater com o do app do banco, diga o valor certo e a gente corrige.</p>
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="certo">
            Saldo certo agora (EUR)
          </label>
          <input id="certo" name="certo" inputMode="decimal" defaultValue={paraCampo(Math.round(carteira.saldo_atual * 100))} autoComplete="off" />
        </div>
        {erro && (
          <p className="form-erro" role="alert">
            {erro}
          </p>
        )}
        <div className="form-rodape">
          <button type="submit" className="botao" disabled={salvando}>
            {salvando ? 'Salvando…' : 'Corrigir saldo'}
          </button>
        </div>
      </form>
    </Gaveta>
  )
}

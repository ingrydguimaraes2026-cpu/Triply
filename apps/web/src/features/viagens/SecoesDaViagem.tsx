import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { formatarDinheiro, textoDoBotaoDoPasso, votarNaHospedagem, type Atividade, type DiaDoCarrossel, type Opcao, type Passagens, type Passo } from '@together/core'
import { AlertTriangle, ChevronRight, Plus } from '../../components/ui/icones'
import { Selo } from '../../components/ui/Icone'
import Avatar from '../../components/ui/Avatar'
import { supabase } from '../../lib/supabase'
import type { Membro } from './hooks'

// Peças da tela da viagem, iguais às do app (apps/mobile/src/ui/viagem/Secoes.tsx, Passaporte.tsx e ProximoCarimbo.tsx).

const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0] ?? nome

// Rostos do comboio como stories: anel dourado = fez algo que você ainda não viu
export function Rostos({ membros, atividades, vistoEm, meuId }: { membros: Membro[]; atividades: Atividade[]; vistoEm: string | null; meuId: string }) {
  const comNovidade = new Set(atividades.filter((a) => a.autor && a.autor !== meuId && (!vistoEm || a.criado_em > vistoEm)).map((a) => a.autor))
  return (
    <ul className="vg-rostos" aria-label="Comboio">
      {membros.map((m, i) => (
        <li key={m.id}>
          <Link to="comboio" aria-label={`Ver ${m.nome} no comboio`}>
            <span className={comNovidade.has(m.id) ? 'vg-rosto novidade' : 'vg-rosto'}>
              <Avatar nome={m.nome} url={m.avatarUrl} indice={i} tamanho={52} />
            </span>
            <span className="vg-rosto-nome">{m.id === meuId ? 'Você' : primeiroNome(m.nome)}</span>
          </Link>
        </li>
      ))}
      <li>
        <Link to="comboio" aria-label="Convidar pro comboio">
          <span className="vg-rosto-convidar">
            <Plus size={22} aria-hidden="true" />
          </span>
          <span className="vg-rosto-nome">Convidar</span>
        </Link>
      </li>
    </ul>
  )
}

// "Próximo carimbo" (spec 117): a decisão aberta mais importante, grande, em destaque.
// Onde dormir com 2 ou mais opções vira um duelo de fotos com votos.
export function ProximoCarimbo({ passo, link, opcoes, membros, meuId, moeda, aoMudar }: { passo: Passo; link: string; opcoes: Opcao[]; membros: Membro[]; meuId: string; moeda: string; aoMudar: () => void }) {
  const emDuelo = passo.chave === 'hospedagem' ? duelo(opcoes) : null
  return (
    <section className="vg-proximo" aria-label="Próximo carimbo">
      <Link to={link} className="vg-proximo-topo">
        <span>
          <small>Próximo carimbo</small>
          <strong>{passo.titulo}</strong>
          {!emDuelo && <span className="vg-proximo-sub">{passo.sub}</span>}
        </span>
        <Selo nome={passo.selo} tamanho={48} className="vg-proximo-selo" />
      </Link>
      {emDuelo ? (
        <Duelo opcoes={emDuelo} membros={membros} meuId={meuId} moeda={moeda} aoMudar={aoMudar} />
      ) : (
        <Link to={link} className="vg-proximo-botao">
          {textoDoBotaoDoPasso(passo.chave)} <ChevronRight size={18} aria-hidden="true" />
        </Link>
      )}
    </section>
  )
}

// As 2 opções mais votadas do mesmo destino, se ninguém escolheu ainda
function duelo(opcoes: Opcao[]): [Opcao, Opcao] | null {
  const abertas = opcoes.filter((o) => !opcoes.some((x) => x.escolhida && x.destinoId === o.destinoId))
  const destino = abertas[0]?.destinoId
  const doDestino = abertas.filter((o) => o.destinoId === destino).sort((a, b) => b.votos.length - a.votos.length)
  return doDestino.length >= 2 ? [doDestino[0], doDestino[1]] : null
}

function Duelo({ opcoes, membros, meuId, moeda, aoMudar }: { opcoes: [Opcao, Opcao]; membros: Membro[]; meuId: string; moeda: string; aoMudar: () => void }) {
  // Voto otimista: a barra anda na hora, o banco confirma depois
  const [meusVotos, setMeusVotos] = useState(() => Object.fromEntries(opcoes.map((o) => [o.id, o.votos.includes(meuId)])))
  const votos = opcoes.map((o) => o.votos.filter((v) => v !== meuId).length + (meusVotos[o.id] ? 1 : 0))
  const maior = Math.max(1, ...votos)
  const votaram = new Set(opcoes.flatMap((o) => o.votos.filter((v) => v !== meuId)))
  if (Object.values(meusVotos).some(Boolean)) votaram.add(meuId)
  const faltam = membros.filter((m) => !votaram.has(m.id)).map((m) => (m.id === meuId ? 'você' : primeiroNome(m.nome)))

  async function votar(o: Opcao) {
    const sim = !meusVotos[o.id]
    setMeusVotos((a) => ({ ...a, [o.id]: sim }))
    try {
      await votarNaHospedagem(supabase, o.id, meuId, sim)
      aoMudar()
    } catch {
      setMeusVotos((a) => ({ ...a, [o.id]: !sim }))
    }
  }

  return (
    <div className="vg-duelo">
      <div className="vg-duelo-lados">
        {opcoes.map((o, i) => (
          <button key={o.id} type="button" className={meusVotos[o.id] ? 'vg-duelo-lado votei' : 'vg-duelo-lado'} onClick={() => votar(o)} aria-pressed={!!meusVotos[o.id]} aria-label={`Votar em ${o.nome}`}>
            {o.fotoUrl ? (
              <img src={o.fotoUrl} alt="" loading="lazy" />
            ) : (
              <span className="vg-duelo-sem-foto">
                <Selo nome="barraca" tamanho={40} />
              </span>
            )}
            <span className="vg-duelo-texto">
              <strong>{o.nome}</strong>
              {o.precoTotal != null && <small>{formatarDinheiro(o.precoTotal, o.moeda || moeda)} no total</small>}
              <span className="vg-duelo-barra">
                <span style={{ width: `${(votos[i] / maior) * 100}%` }} />
              </span>
              <small>
                {votos[i]} {votos[i] === 1 ? 'voto' : 'votos'}
                {meusVotos[o.id] ? ' · seu voto' : ''}
              </small>
            </span>
          </button>
        ))}
      </div>
      <p className="vg-duelo-faltam">{faltam.length === 0 ? 'Todo mundo votou' : `faltam ${faltam.join(', ').replace(/, ([^,]*)$/, ' e $1')}`}</p>
    </div>
  )
}

// Passaporte do comboio (spec 117): os 6 selos, apagados até serem conquistados.
// Selo conquistado desde a última visita (neste navegador) cai girando no lugar.
export function Passaporte({ viagemId, passos }: { viagemId: string; passos: Passo[] }) {
  const chave = `tripwave.carimbos.${viagemId}` // mesma chave do app
  const feitos = passos.filter((p) => p.feito).map((p) => p.chave)
  // O que este navegador já tinha visto quando a tela abriu (null = primeira vez: nada anima)
  const [vistos] = useState<string[] | null>(() => {
    try {
      return JSON.parse(localStorage.getItem(chave) ?? 'null') as string[] | null
    } catch {
      return null
    }
  })
  const novos = vistos ? feitos.filter((c) => !vistos.includes(c)) : []
  const assinatura = feitos.join(',')
  useEffect(() => {
    try {
      localStorage.setItem(chave, JSON.stringify(assinatura ? assinatura.split(',') : []))
    } catch {
      // sem armazenamento: só não anima da próxima vez
    }
  }, [chave, assinatura])

  return (
    <section className="vg-passaporte" aria-label="Passaporte do comboio">
      <div className="vg-titulo">
        <h2>Passaporte do comboio</h2>
        <span>
          {feitos.length} de {passos.length}
        </span>
      </div>
      <ul className="vg-passaporte-selos">
        {passos.map((p, i) => (
          <li key={p.chave} aria-label={`${p.rotulo}: ${p.feito ? 'conquistado' : 'falta'}`} className={p.feito ? (novos.includes(p.chave) ? 'feito novo' : 'feito') : undefined} style={{ ['--giro' as string]: `${i % 2 ? 5 : -6}deg`, ['--atraso' as string]: `${350 + Math.max(0, novos.indexOf(p.chave)) * 260}ms` }}>
            <Selo nome={p.selo} tamanho={40} />
            <span>{p.rotulo}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

// Carrossel dos dias com foto. Sem roteiro montado: um cartão que chama pro deslize.
export function CarrosselDoRoteiro({ dias }: { dias: DiaDoCarrossel[] }) {
  if (!dias.length) {
    return (
      <Link to="explorar" className="vg-sem-dias">
        <Selo nome="mapa" tamanho={40} />
        <span>
          <strong>Ainda sem dias</strong>
          <small>Deslize os lugares e o app monta</small>
        </span>
        <ChevronRight size={18} aria-hidden="true" />
      </Link>
    )
  }
  return (
    <ul className="vg-dias">
      {dias.map((d) => (
        <li key={d.numero}>
          <Link to="explorar">
            {d.foto ? (
              <img src={d.foto} alt="" loading="lazy" />
            ) : (
              <span className="vg-dia-sem-foto">
                <Selo nome="caminho" tamanho={40} />
              </span>
            )}
            <small>Dia {d.numero}</small>
            <strong>{d.titulo}</strong>
          </Link>
        </li>
      ))}
    </ul>
  )
}

// Spec 122d: o que falta decidir, comprar e o que já foi comprado + o aviso mais sério
export function ResumoDasPassagens({ passagens: p }: { passagens: Passagens }) {
  const nada = !p.decidir.length && !p.comprar.length && !p.compradas.length
  const numeros = [
    { n: p.decidir.length, t: 'pra decidir', c: 'decidir' },
    { n: p.comprar.length, t: 'pra comprar', c: 'comprar' },
    { n: p.compradas.length, t: p.compradas.length === 1 ? 'comprada' : 'compradas', c: 'comprada' },
  ]
  const aviso = p.avisos[0]
  return (
    <Link to="reservas" className="vg-cartao vg-passagens">
      {nada ? (
        <span className="vg-linha">
          <span>
            <strong>Nenhum deslocamento ainda</strong>
            <small>Trem, ônibus, barco: adicione como vocês vão e compare as opções.</small>
          </span>
          <ChevronRight size={18} aria-hidden="true" />
        </span>
      ) : (
        <>
          <span className="vg-linha">
            {numeros.map(({ n, t, c }) => (
              <span key={c} className={n ? `vg-numero ${c}` : 'vg-numero'}>
                <strong>{n}</strong>
                <small>{t}</small>
              </span>
            ))}
            <ChevronRight size={18} aria-hidden="true" />
          </span>
          {aviso && (
            <span className="vg-aviso">
              <AlertTriangle size={16} aria-hidden="true" />
              {aviso.titulo}
              {p.avisos.length > 1 ? ` (e mais ${p.avisos.length - 1})` : ''}
            </span>
          )}
        </>
      )}
    </Link>
  )
}

// Contas em uma linha: gasto do grupo e o meu saldo
export function ResumoDasContas({ total, meuSaldo, moeda }: { total: number; meuSaldo: number; moeda: string }) {
  return (
    <Link to="contas" className="vg-cartao vg-contas">
      <span>
        <small>Gasto do grupo</small>
        <strong>{formatarDinheiro(Math.round(total), moeda)}</strong>
      </span>
      <span className="vg-contas-saldo">
        <small>{meuSaldo > 0 ? 'Você recebe' : meuSaldo < 0 ? 'Você deve' : 'Seu saldo'}</small>
        <strong className={meuSaldo > 0 ? 'recebe' : meuSaldo < 0 ? 'deve' : undefined}>{formatarDinheiro(Math.round(Math.abs(meuSaldo)), moeda)}</strong>
      </span>
    </Link>
  )
}

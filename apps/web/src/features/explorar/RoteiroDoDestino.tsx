import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowDown, ArrowUp, MoreHorizontal, Star } from 'lucide-react'
import { arrumarRoteiro, moverNaOrdem, moverPraDia, regiaoEspalhada, trecho, type DiasDoRoteiro, type Tables } from '@together/core'
import { useViagemAtual } from '../viagens/hooks'
import { criarConvite } from '../comboio/api'
import type { Lugar } from '../lugares/regras'
import Gaveta from '../../components/ui/Gaveta'

// Roteiro do destino (spec 115 v2): o plano dia a dia que o grupo arruma junto.
// Cada lugar pode mudar de dia, subir/descer ou ir pro "Sem dia". Tudo salva na hora.
type Ponto = { latitude: number; longitude: number }
const SEM_DIA = -1

type Props = {
  destino: Tables<'destinos'>
  rotulos: string[] // nome de cada dia ("Sexta-feira, 4 de junho" ou "Dia 1")
  lugares: Lugar[] // o que o grupo curtiu neste destino, os mais importantes primeiro
  salvo: DiasDoRoteiro
  aoMudar: (dias: DiasDoRoteiro) => void
  aoReorganizar: () => void
  aoVerMais: () => void
  proximoDestino: Tables<'destinos'> | null
  aoIrPara: (destinoId: string) => void
}

export default function RoteiroDoDestino({ destino, rotulos, lugares, salvo, aoMudar, aoReorganizar, aoVerMais, proximoDestino, aoIrPara }: Props) {
  const { viagem, membros, euSouAdm } = useViagemAtual()
  const [aberto, setAberto] = useState(0)
  const [mexendo, setMexendo] = useState<Lugar | null>(null)
  const [convite, setConvite] = useState<'parado' | 'criando' | 'copiado'>('parado')

  const pessoas = membros.length
  const porId = new Map(lugares.map((l) => [l.id, l]))
  const { dias, semDia } = arrumarRoteiro(
    salvo,
    lugares.map((l) => l.id),
    rotulos.length,
  )
  const ids = aberto === SEM_DIA ? semDia : (dias[aberto] ?? [])
  const doDia = ids.map((id) => porId.get(id)).filter((l): l is Lugar => !!l)

  const ponto = (l: Lugar | undefined): Ponto | null => (l && l.latitude != null && l.longitude != null ? { latitude: l.latitude, longitude: l.longitude } : null)
  const todos = lugares.map(ponto).filter((p): p is Ponto => !!p)
  const caixa = todos.length
    ? {
        n: Math.max(...todos.map((p) => p.latitude)),
        s: Math.min(...todos.map((p) => p.latitude)),
        l: Math.max(...todos.map((p) => p.longitude)),
        o: Math.min(...todos.map((p) => p.longitude)),
      }
    : null
  const noMapa = (p: Ponto) => {
    if (!caixa) return { x: 50, y: 30 }
    const w = Math.max(caixa.l - caixa.o, 0.002)
    const h = Math.max(caixa.n - caixa.s, 0.002)
    return { x: 6 + ((p.longitude - caixa.o) / w) * 88, y: (8 + ((caixa.n - p.latitude) / h) * 84) * 0.6 }
  }
  const pontosDoDia = doDia.map(ponto).filter((p): p is Ponto => !!p)
  const idsDoDia = new Set(ids)

  // Mudanças: arruma a lista inteira e manda salvar
  const mudar = (novo: DiasDoRoteiro) => {
    aoMudar(novo)
    setMexendo(null)
  }

  async function convidar() {
    setConvite('criando')
    try {
      const link = await criarConvite(viagem.id)
      if (navigator.share) await navigator.share({ title: viagem.nome, text: `Desliza aí o que você quer fazer em ${destino.nome}!`, url: link }).catch(() => {})
      else await navigator.clipboard.writeText(link)
      setConvite('copiado')
    } catch (e) {
      console.error('Erro ao criar convite:', e)
      setConvite('parado')
    }
  }

  return (
    <section className="exp-roteiro" aria-label={`Roteiro de ${destino.nome}`}>
      <div className="exp-roteiro-topo">
        <h2 className="exp-titulo">
          {destino.nome} em {rotulos.length} {rotulos.length === 1 ? 'dia' : 'dias'}
        </h2>
        <button type="button" className="botao secundario pequeno" onClick={aoVerMais}>
          Ver mais lugares
        </button>
      </div>

      {/* Sozinho na viagem: o próximo passo é chamar a galera pra deslizar também */}
      {pessoas <= 1 && (
        <div className="exp-convidar">
          <p>
            <strong>Chame a galera pra deslizar também.</strong> O que vocês curtirem juntos entra aqui, com o selo de quantos curtiram.
          </p>
          {euSouAdm ? (
            <button type="button" className="botao pequeno" onClick={convidar} disabled={convite === 'criando'}>
              {convite === 'copiado' ? 'Link copiado!' : convite === 'criando' ? 'Criando o link…' : 'Mandar o convite'}
            </button>
          ) : (
            <Link to="../comboio" className="botao pequeno">
              Ver o comboio
            </Link>
          )}
        </div>
      )}

      <div className="exp-dias" role="tablist" aria-label="Dias">
        {rotulos.map((_, i) => (
          <button key={i} type="button" role="tab" aria-selected={i === aberto} className={i === aberto ? 'exp-opcao ativa' : 'exp-opcao'} onClick={() => setAberto(i)}>
            <strong>Dia {i + 1}</strong>
            <small>
              {dias[i].length} {dias[i].length === 1 ? 'lugar' : 'lugares'}
            </small>
          </button>
        ))}
        {semDia.length > 0 && (
          <button
            type="button"
            role="tab"
            aria-selected={aberto === SEM_DIA}
            className={aberto === SEM_DIA ? 'exp-opcao ativa' : 'exp-opcao'}
            onClick={() => setAberto(SEM_DIA)}
          >
            <strong>Sem dia</strong>
            <small>
              {semDia.length} {semDia.length === 1 ? 'ideia' : 'ideias'}
            </small>
          </button>
        )}
      </div>

      {caixa && (
        <svg className="exp-mapa" viewBox="0 0 100 60" preserveAspectRatio="none" role="img" aria-label={`Mapa: ${doDia.map((l) => l.nome).join(', ')}`}>
          {aberto !== SEM_DIA && (
            <polyline
              points={pontosDoDia.map((p) => `${noMapa(p).x},${noMapa(p).y}`).join(' ')}
              fill="none"
              stroke="var(--couro)"
              strokeWidth="0.6"
              strokeDasharray="1.5 1.5"
              vectorEffect="non-scaling-stroke"
            />
          )}
          {lugares.map((l) => {
            const p = ponto(l)
            return p ? <circle key={l.id} cx={noMapa(p).x} cy={noMapa(p).y} r={idsDoDia.has(l.id) ? 1.8 : 1.1} className={idsDoDia.has(l.id) ? 'no-dia' : undefined} /> : null
          })}
        </svg>
      )}

      <ol className="exp-itens">
        <li className="exp-dia-nome">{aberto === SEM_DIA ? 'Ideias que ainda não têm dia' : rotulos[aberto]}</li>
        {doDia.length === 0 && (
          <li className="exp-dica tracejado">{aberto === SEM_DIA ? 'Nada aqui.' : 'Dia livre. Mova uma ideia pra cá ou veja mais lugares.'}</li>
        )}
        {doDia.map((l, k) => {
          const antes = k > 0 && aberto !== SEM_DIA ? ponto(doDia[k - 1]) : null
          const aqui = ponto(l)
          const curtiram = new Set([...l.votos, ...(l.prioridades ?? [])]).size
          return (
            <li key={l.id}>
              {antes && aqui && <span className="exp-trecho">{trecho(antes, aqui)}</span>}
              <div className="exp-item">
                <span className="exp-hora">{aberto === SEM_DIA ? '·' : k + 1}</span>
                <span className="exp-item-nome">
                  <strong>{l.nome}</strong>
                  {pessoas > 1 && (
                    <small className={curtiram >= 2 ? 'exp-match' : undefined}>
                      {curtiram} de {pessoas} curtiram
                    </small>
                  )}
                </span>
                {(l.prioridades?.length ?? 0) > 0 && <Star size={16} aria-label="Alguém não abre mão" className="exp-cor-estrela" fill="currentColor" />}
                <button type="button" className="exp-mexer" aria-label={`Mudar ${l.nome} de lugar`} onClick={() => setMexendo(l)}>
                  <MoreHorizontal size={18} aria-hidden="true" />
                </button>
              </div>
            </li>
          )
        })}
      </ol>

      {regiaoEspalhada(todos) && <p className="exp-aviso">Região grande: vale dormir em 2 lugares diferentes.</p>}

      <div className="exp-rodape">
        {proximoDestino && (
          <button type="button" className="botao exp-principal" onClick={() => aoIrPara(proximoDestino.id)}>
            Agora, escolher em {proximoDestino.nome}
          </button>
        )}
        <button type="button" className="botao-texto" onClick={aoReorganizar}>
          Reorganizar tudo pela proximidade
        </button>
      </div>

      {mexendo && (
        <Gaveta titulo={mexendo.nome} aoFechar={() => setMexendo(null)}>
          <div className="exp-mover">
            {aberto !== SEM_DIA && (
              <div className="exp-mover-ordem">
                <button type="button" className="botao secundario" onClick={() => mudar(moverNaOrdem(dias, mexendo.id, -1))} disabled={ids[0] === mexendo.id}>
                  <ArrowUp size={16} aria-hidden="true" /> Mais cedo
                </button>
                <button type="button" className="botao secundario" onClick={() => mudar(moverNaOrdem(dias, mexendo.id, 1))} disabled={ids[ids.length - 1] === mexendo.id}>
                  <ArrowDown size={16} aria-hidden="true" /> Mais tarde
                </button>
              </div>
            )}
            <span className="exp-rotulo">Mover pra</span>
            <div className="exp-mover-dias">
              {rotulos.map((r, i) => (
                <button key={i} type="button" className="exp-opcao" onClick={() => mudar(moverPraDia(dias, mexendo.id, i))} disabled={i === aberto}>
                  <strong>Dia {i + 1}</strong>
                  <small>{r === `Dia ${i + 1}` ? `${dias[i].length} ${dias[i].length === 1 ? 'lugar' : 'lugares'}` : r}</small>
                </button>
              ))}
              {aberto !== SEM_DIA && (
                <button type="button" className="exp-opcao" onClick={() => mudar(moverPraDia(dias, mexendo.id, null))}>
                  <strong>Sem dia</strong>
                  <small>Guardar a ideia</small>
                </button>
              )}
            </div>
          </div>
        </Gaveta>
      )}
    </section>
  )
}

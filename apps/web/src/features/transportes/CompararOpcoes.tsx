import { useState } from 'react'
import { Check, Pencil, Plus } from '../../components/ui/icones'
import { compararOpcoes, diaNoFuso, duracaoCurta, escolherOpcaoDoDeslocamento, horaNoFuso, textoDaFrequencia, textoDasTrocas } from '@together/core'
import { supabase } from '../../lib/supabase'
import { diaComSemana } from '../../lib/datas'
import { meio, type Trajeto } from './api'

// Comparar as opções de um deslocamento lado a lado, espelho do app (apps/mobile/app/comparar.tsx, spec 122c):
// folga, último do dia, trocas, de quanto em quanto tempo passa, preço. Escolher com 1 clique (ADM ou liberado).
// A lógica (folga, selos, escolhida) fica no @together/core.

const SIMBOLO: Record<string, string> = { EUR: '€', BRL: 'R$', USD: 'US$' }

type Props = {
  grupo: string
  trajetos: Trajeto[] // todos, com as opções
  podeDecidir: boolean
  aoMudar: () => Promise<void> | void
  aoEditar: (id: string) => void
  aoOutraOpcao: (dia: string, de: string, para: string) => void
}

export default function CompararOpcoes({ grupo, trajetos, podeDecidir, aoMudar, aoEditar, aoOutraOpcao }: Props) {
  const [salvando, setSalvando] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const linhas = compararOpcoes(
    trajetos.filter((t) => t.grupo_opcoes === grupo),
    trajetos,
  )

  if (!linhas.length) return <p className="ps-nota">Essas opções não existem mais.</p>

  const base = linhas[0].opcao
  const dia = base.partida ? diaNoFuso(base.partida) : ''
  const temEscolhida = linhas.some((l) => l.escolhida)

  async function escolher(o: Trajeto) {
    setSalvando(o.id)
    setErro(null)
    try {
      await escolherOpcaoDoDeslocamento(supabase, grupo, o)
      await aoMudar()
    } catch (e) {
      setErro((e as { code?: string }).code === '42501' ? 'Só o ADM escolhe (ou quem ele liberou).' : 'Não deu pra escolher. Tente de novo.')
    } finally {
      setSalvando(null)
    }
  }

  return (
    <div className="ps-form">
      <div>
        {dia && <p className="ps-sobre">{diaComSemana(dia)}</p>}
        <h2 className="ps-painel-titulo">{`${base.de_texto ?? 'Origem'} → ${base.para_texto ?? 'Destino'}`}</h2>
        <p className="ps-dica">
          {temEscolhida
            ? 'Opção escolhida marcada. Dá pra trocar quando quiser.'
            : `${linhas.length} ${linhas.length === 1 ? 'opção' : 'opções'} · ${podeDecidir ? 'clique em "Ficar com esta" pra decidir' : 'quem escolhe é o ADM'}`}
        </p>
      </div>

      <ul className="ps-opcoes">
        {linhas.map(({ opcao: o, folga, folgaCurta, duracao, selos, escolhida }) => (
          <li key={o.id} className={escolhida ? 'ps-opcao escolhida' : 'ps-opcao'}>
            {(selos.length > 0 || escolhida) && (
              <div className="ps-selos">
                {escolhida && <span className="ps-selo bom">Escolhida</span>}
                {selos.map((s) => (
                  <span key={s} className="ps-selo bom">
                    {s}
                  </span>
                ))}
              </div>
            )}
            <div className="ps-opcao-topo">
              <span className="ps-texto">
                <b>{meio(o.meio).nome}</b>
                {o.observacao && <small>{o.observacao}</small>}
              </span>
              {o.preco != null && <b className="ps-opcao-preco">{`${SIMBOLO[o.moeda ?? ''] ?? o.moeda ?? ''} ${Number(o.preco).toLocaleString('pt-BR')}`}</b>}
            </div>
            <div className="ps-linha-do-tempo">
              <b>{o.partida ? horaNoFuso(o.partida) : '--:--'}</b>
              <i />
              {duracao != null && <small>{duracaoCurta(duracao)}</small>}
              <i />
              <b>{o.chegada ? horaNoFuso(o.chegada) : '--:--'}</b>
            </div>
            <div className="ps-fatos">
              {folga && (
                <Fato
                  tipo={folgaCurta ? 'ruim' : 'bom'}
                  titulo={folga.minutos < 0 ? 'Horários se cruzam' : `${duracaoCurta(folga.minutos)} de folga`}
                  texto={folga.de ? `depois de chegar de ${folga.de}` : 'depois do anterior'}
                />
              )}
              <Fato tipo={o.ultimo_do_dia ? 'ruim' : undefined} titulo={o.ultimo_do_dia ? 'Último do dia' : 'Tem outros depois'} texto={o.ultimo_do_dia ? 'perdeu, fica sem' : 'tem plano B'} />
              {o.trocas != null && <Fato titulo={o.trocas === 0 ? 'Direto' : textoDasTrocas(o.trocas)} texto="" />}
              {o.frequencia_min ? <Fato titulo={textoDaFrequencia(o.frequencia_min).replace(/^a/, 'A')} texto="passa" /> : null}
              {o.chegada && o.partida && diaNoFuso(o.chegada) !== diaNoFuso(o.partida) && <Fato titulo="Chega no dia seguinte" texto="madrugada" />}
            </div>
            <div className="ps-opcao-acoes">
              {(podeDecidir || escolhida) && (
                <button
                  type="button"
                  className={escolhida ? 'botao secundario compacto' : 'botao compacto'}
                  onClick={() => void escolher(o)}
                  disabled={escolhida || !!salvando || !podeDecidir}
                >
                  <Check size={16} aria-hidden="true" /> {salvando === o.id ? 'Salvando…' : escolhida ? 'Escolhida' : 'Ficar com esta'}
                </button>
              )}
              <button type="button" className="ps-editar" onClick={() => aoEditar(o.id)} aria-label="Editar opção" title="Editar opção">
                <Pencil size={16} aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      {erro && <p className="form-erro" role="alert">{erro}</p>}
      <button type="button" className="ps-tracejado ps-centro" onClick={() => aoOutraOpcao(dia, base.de_texto ?? '', base.para_texto ?? '')}>
        <Plus size={17} aria-hidden="true" /> <b>Outra opção</b>
      </button>
    </div>
  )
}

function Fato({ titulo, texto, tipo }: { titulo: string; texto: string; tipo?: 'bom' | 'ruim' }) {
  return (
    <span className={tipo ? `ps-fato ${tipo}` : 'ps-fato'}>
      <b>{titulo}</b>
      {texto && <small>{texto}</small>}
    </span>
  )
}

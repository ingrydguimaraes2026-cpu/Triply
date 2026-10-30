import { useState } from 'react'
import { formatarDinheiro, type relatorio as Rel } from '@together/core'
import { formatarData } from '../../lib/datas'

type Props = { relatorio: ReturnType<typeof Rel>; moeda: string; nome: (id: string) => string }

// Relatórios (spec 082): gasto por dia e por pessoa, com barras simples. Só gastos do comboio.
export default function Relatorio({ relatorio: r, moeda, nome }: Props) {
  const [aba, setAba] = useState<'dia' | 'pessoa'>('dia')
  const maxDia = Math.max(1, ...r.porDia.map((d) => d.valor))
  const maxPessoa = Math.max(1, ...r.porPessoa.flatMap((p) => [p.pagou, p.consumiu]))
  return (
    <div className="relatorio">
      <p className="numero-legenda">
        ~{formatarDinheiro(r.porPessoaPorDia, moeda)} por pessoa por dia
        {r.diaMaisCaro && ` · dia mais caro: ${formatarData(r.diaMaisCaro)}`}
      </p>
      <div className="listas-abas" role="tablist">
        <button type="button" role="tab" aria-selected={aba === 'dia'} onClick={() => setAba('dia')}>
          Por dia
        </button>
        <button type="button" role="tab" aria-selected={aba === 'pessoa'} onClick={() => setAba('pessoa')}>
          Por pessoa
        </button>
      </div>
      {aba === 'dia' ? (
        <ul className="relatorio-barras">
          {r.porDia.map((d) => (
            <li key={d.dia}>
              <span className="relatorio-rotulo">{formatarData(d.dia)}</span>
              <span className="relatorio-barra" aria-hidden="true">
                <span style={{ width: `${(d.valor / maxDia) * 100}%` }} />
              </span>
              <span className="relatorio-valor">{formatarDinheiro(d.valor, moeda)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="relatorio-barras">
          {r.porPessoa.map((p) => (
            <li key={p.usuarioId} className="relatorio-pessoa">
              <span className="relatorio-rotulo">{nome(p.usuarioId)}</span>
              <span className="relatorio-barra dupla" aria-hidden="true">
                <span className="consumiu" style={{ width: `${(p.consumiu / maxPessoa) * 100}%` }} />
                <span className="pagou" style={{ width: `${(p.pagou / maxPessoa) * 100}%` }} />
              </span>
              <span className="relatorio-valor">
                {formatarDinheiro(p.consumiu, moeda)}
                <small>pagou {formatarDinheiro(p.pagou, moeda)}</small>
              </span>
            </li>
          ))}
        </ul>
      )}
      {aba === 'pessoa' && <p className="numero-legenda">Barra cheia = quanto a pessoa consumiu; fina = quanto pagou.</p>}
    </div>
  )
}

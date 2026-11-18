import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import type { NomeDoIcone, Passo } from '@together/core'
import { Icone, Selo } from '../../components/ui/Icone'
import Avatar from '../../components/ui/Avatar'

// Peças da aba Viagem no caminho B "Embarque" (decisão do Victor, 10/11/2026), iguais às do app
// (apps/mobile/src/ui/viagem/Bilhete.tsx e ProximoPasso.tsx). Régua: docs/design/direcao-redesenho/embarque.html

// Bilhete da viagem (o objeto-herói): chega girando, balança devagar e um brilho passa por cima.
// O movimento é todo no CSS (embarque.css); com "reduzir movimento" ele só aparece.
export function Bilhete({ foto, de, para, data, noites, pessoas, link }: { foto: string | undefined; de: string; para: string; data: string; noites: string; pessoas: string[]; link: string }) {
  return (
    <div className="eb-palco">
      <Link to={link} className="eb-bilhete" aria-label={`Bilhete: ${de} para ${para}, ${data}. Abrir o roteiro`}>
        {foto ? <img className="eb-bilhete-foto" src={foto} alt="" /> : <span className="eb-bilhete-foto" />}
        <div className="eb-bilhete-lin">
          <b className={de.length > 4 ? 'longo' : undefined}>{de}</b>
          <Icone nome="aviao" size={16} aria-hidden="true" />
          <b className={para.length > 4 ? 'longo' : undefined}>{para}</b>
        </div>
        <div className="eb-picote" />
        <div className="eb-bilhete-rd">
          <span>{data}</span>
          {pessoas.length > 1 ? (
            <span className="eb-bilhete-rostos">
              {pessoas.slice(0, 4).map((n, i) => (
                <Avatar key={i} nome={n} tamanho={20} indice={i} />
              ))}
            </span>
          ) : (
            <span>{noites}</span>
          )}
        </div>
        <span className="eb-brilho" aria-hidden="true" />
      </Link>
    </div>
  )
}

// "23 dias pra Lisboa": o número corre do zero até o valor quando a tela abre
export function Contagem({ faltam, destino, podeDefinir, jaFoi = false }: { faltam: number | null; destino: string; podeDefinir: boolean; jaFoi?: boolean }) {
  const mostrado = useNumeroQueCorre(faltam ?? 0, 900)
  // M4 (QA 16/11): viagem que já passou (ex.: viagem antiga) não pede data
  if (jaFoi)
    return (
      <div className="eb-contagem eb-entra" style={{ ['--i' as string]: 0 }}>
        <b className="eb-sem-data">Vocês já foram pra {destino}</b>
        <p>Está carimbado no mapa da galera.</p>
      </div>
    )
  if (faltam == null || faltam <= 0)
    return (
      <div className="eb-contagem eb-entra" style={{ ['--i' as string]: 0 }}>
        <b className="eb-sem-data">Sem data ainda</b>
        {podeDefinir ? <Link to="configuracoes">Definir quando vai ser</Link> : <p>Quem organiza define as datas</p>}
      </div>
    )
  return (
    <div className="eb-contagem eb-entra" style={{ ['--i' as string]: 0 }} aria-label={`${faltam} ${faltam === 1 ? 'dia' : 'dias'} pra ${destino}`}>
      <b className="eb-num" aria-hidden="true">
        {mostrado}
      </b>
      <p aria-hidden="true">
        {faltam === 1 ? 'dia' : 'dias'} pra {destino}
      </p>
    </div>
  )
}

const reduzirMovimento = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function useNumeroQueCorre(alvo: number, ms: number) {
  const [n, setN] = useState(0)
  const reduzir = reduzirMovimento()
  useEffect(() => {
    if (reduzir) return
    const inicio = performance.now()
    let quadro = 0
    const passo = (agora: number) => {
      const t = Math.min(1, (agora - inicio) / ms)
      setN(Math.round(alvo * (1 - Math.pow(1 - t, 3))))
      if (t < 1) quadro = requestAnimationFrame(passo)
    }
    quadro = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro)
  }, [alvo, ms, reduzir])
  return reduzir ? alvo : n
}

const BOTAO: Record<Passo['chave'], string> = {
  roteiro: 'Descobrir',
  galera: 'Chamar',
  datas: 'Definir',
  hospedagem: 'Ver opções',
  transporte: 'Adicionar',
  gastos: 'Lançar',
}

// "Próximo passo": o antigo Próximo carimbo + o Passaporte, num cartão só (regra "um próximo passo só").
// Selo conquistado desde a última visita cai girando (mesma chave do app: tripwave.carimbos.<id>).
export function ProximoPasso({ viagemId, passos, proximo, link }: { viagemId: string; passos: Passo[]; proximo: Passo | null; link: string }) {
  const chave = `tripwave.carimbos.${viagemId}`
  const feitos = passos.filter((p) => p.feito).map((p) => p.chave)
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
    <section className="eb-cartao eb-proximo eb-entra" style={{ ['--i' as string]: 1 }} aria-label="Próximo passo">
      {proximo ? (
        <Link to={link} className="eb-proximo-topo">
          <Selo nome={proximo.selo} tamanho={44} className="eb-proximo-selo" />
          <span className="eb-proximo-txt">
            <small>Próximo passo</small>
            <b>{proximo.titulo}</b>
            <span>{proximo.sub}</span>
          </span>
          <span className="eb-ir">{BOTAO[proximo.chave]}</span>
        </Link>
      ) : (
        <div className="eb-proximo-topo">
          <span className="eb-proximo-txt">
            <small>Tudo pronto</small>
            <b>Passaporte completo. Boa viagem!</b>
          </span>
        </div>
      )}
      <div className="eb-passaporte" aria-label={`Passaporte da galera: ${feitos.length} de ${passos.length}`}>
        <ul>
          {passos.map((p, i) => (
            <li
              key={p.chave}
              className={p.feito ? (novos.includes(p.chave) ? 'feito novo' : 'feito') : undefined}
              style={{ ['--giro' as string]: `${i % 2 ? 5 : -6}deg`, ['--atraso' as string]: `${450 + Math.max(0, novos.indexOf(p.chave)) * 260}ms` }}
              title={p.rotulo}
            >
              <Selo nome={p.selo} tamanho={24} />
            </li>
          ))}
        </ul>
        <span>
          Passaporte {feitos.length} de {passos.length}
        </span>
      </div>
    </section>
  )
}

// Resumo das outras 4 abas: mesmo nome e mesmo ícone da barra; tocar leva pra aba
export function ResumoDasAbas({ itens }: { itens: { para: string; icone: NomeDoIcone; titulo: string; linha: string }[] }) {
  return (
    <section className="eb-entra" style={{ ['--i' as string]: 2 }} aria-label="A viagem">
      <p className="eb-rotulo">A viagem</p>
      <div className="eb-cartao">
        {itens.map((r) => (
          <Link key={r.para} to={r.para} className="eb-linha" aria-label={`${r.titulo}: ${r.linha}`}>
            <span className="eb-quad">
              <Icone nome={r.icone} size={20} aria-hidden="true" />
            </span>
            <span className="eb-linha-txt">
              <b>{r.titulo}</b>
              <small>{r.linha}</small>
            </span>
            <Icone nome="seta-direita" size={16} aria-hidden="true" className="eb-seta" />
          </Link>
        ))}
      </div>
    </section>
  )
}

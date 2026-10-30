import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Briefcase, Calculator, Car, ExternalLink, Percent, Toilet, Utensils, X } from 'lucide-react'
import {
  banheirosDaResposta,
  consultaDeBanheiros,
  contaComGorjeta,
  emReais,
  formatarDinheiro,
  gorjetaSugerida,
  linksDeGuardaVolumes,
  linksDeRestaurante,
  type Banheiro,
  type Tables,
} from '@together/core'
import { cotacoesDeHoje } from '../cambio/api'
import { codigoDoPais } from '../documentos/paises'
import { moedaDoPais } from '../destinos/buscarCidades'
import Cartao from '../../components/ui/Cartao'
import './ferramentas.css'

type Props = { destino: Tables<'destinos'> | null; moedaViagem: string; enderecoHospedagem: string | null }

// "12,50" → 1250 centavos (0 se vazio/errado)
const centavos = (texto: string) => {
  const n = Number(texto.trim().replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) : 0
}

// Ferramentas do dia (spec 059): conversor, gorjeta, mostrar pro motorista, banheiro, restaurante, guarda-volumes
export default function FerramentasDoDia({ destino, moedaViagem, enderecoHospedagem }: Props) {
  const pais = codigoDoPais(destino?.pais)
  const moedaLocal = pais ? moedaDoPais(pais) : moedaViagem
  const cidade = destino?.nome ?? ''

  return (
    <div className="ferramentas">
      <Conversor moeda={moedaLocal === 'BRL' ? moedaViagem : moedaLocal} />
      <Gorjeta pais={pais} moeda={moedaLocal} />
      {enderecoHospedagem && <MostrarProMotorista endereco={enderecoHospedagem} />}
      {destino && <Banheiros destino={destino} />}
      {destino && (
        <Cartao titulo="Comer por perto" icone={Utensils}>
          <div className="ferramenta-links">
            {linksDeRestaurante(cidade, destino.latitude, destino.longitude).map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noreferrer noopener">
                {l.nome} <ExternalLink size={12} aria-hidden="true" />
              </a>
            ))}
          </div>
        </Cartao>
      )}
      {destino && (
        <Cartao titulo="Guardar as malas" icone={Briefcase}>
          <p className="dica">Antes do check-in ou no dia de passagem: guarda-volumes perto da estação costumam ser mais baratos que o do hotel.</p>
          <div className="ferramenta-links">
            {linksDeGuardaVolumes(cidade).map((l) => (
              <a key={l.url} href={l.url} target="_blank" rel="noreferrer noopener">
                {l.nome} em {cidade} <ExternalLink size={12} aria-hidden="true" />
              </a>
            ))}
          </div>
        </Cartao>
      )}
    </div>
  )
}

// J2: quanto dá em reais (comercial + IOF), pela cotação de hoje
function Conversor({ moeda }: { moeda: string }) {
  const [valor, setValor] = useState('')
  const [reaisPorUnidade, setTaxa] = useState<number | null | undefined>(undefined)

  useEffect(() => {
    let ativo = true
    if (moeda === 'BRL') return
    cotacoesDeHoje('BRL', [moeda]).then((t) => {
      if (!ativo) return
      const porReal = t?.[moeda]
      setTaxa(porReal ? 1 / porReal : null)
    })
    return () => {
      ativo = false
    }
  }, [moeda])

  if (moeda === 'BRL') return null
  const c = centavos(valor)
  return (
    <Cartao titulo="Quanto dá em reais?" icone={Calculator}>
      <label className="ferramenta-campo">
        <span>{moeda}</span>
        <input inputMode="decimal" placeholder="0,00" value={valor} onChange={(e) => setValor(e.target.value)} aria-label={`Valor em ${moeda}`} />
      </label>
      {reaisPorUnidade === undefined && <p className="dica">Buscando a cotação…</p>}
      {reaisPorUnidade === null && <p className="dica">Sem cotação agora (sem internet?).</p>}
      {reaisPorUnidade && (
        <p className="ferramenta-resultado">
          <strong>{formatarDinheiro(emReais(c, reaisPorUnidade), 'BRL')}</strong>
          <small>
            com IOF de 3,5% · {formatarDinheiro(emReais(c, reaisPorUnidade, false), 'BRL')} sem · 1 {moeda} = {formatarDinheiro(Math.round(reaisPorUnidade * 100), 'BRL')}
          </small>
        </p>
      )}
    </Cartao>
  )
}

// J6: gorjeta pelo costume do país, dividida
function Gorjeta({ pais, moeda }: { pais: string | null; moeda: string }) {
  const [conta, setConta] = useState('')
  const [porcento, setPorcento] = useState(() => gorjetaSugerida(pais))
  const [pessoas, setPessoas] = useState(2)
  const r = contaComGorjeta(centavos(conta), porcento, pessoas)
  return (
    <Cartao titulo="Gorjeta e divisão" icone={Percent}>
      <div className="ferramenta-linha">
        <label className="ferramenta-campo">
          <span>{moeda}</span>
          <input inputMode="decimal" placeholder="Conta" value={conta} onChange={(e) => setConta(e.target.value)} aria-label="Valor da conta" />
        </label>
        <label className="ferramenta-campo pequeno">
          <input type="number" min={0} max={30} value={porcento} onChange={(e) => setPorcento(Math.max(0, Math.min(30, Number(e.target.value))))} aria-label="Porcentagem da gorjeta" />
          <span>%</span>
        </label>
        <label className="ferramenta-campo pequeno">
          <input type="number" min={1} max={30} value={pessoas} onChange={(e) => setPessoas(Math.max(1, Math.min(30, Number(e.target.value))))} aria-label="Pessoas" />
          <span>pess.</span>
        </label>
      </div>
      {centavos(conta) > 0 && (
        <p className="ferramenta-resultado">
          <strong>{formatarDinheiro(r.porPessoa, moeda)} por pessoa</strong>
          <small>
            gorjeta {formatarDinheiro(r.gorjeta, moeda)} · total {formatarDinheiro(r.total, moeda)}
            {r.sobra > 0 && ` · sobram ${formatarDinheiro(r.sobra, moeda)} pra alguém`}
          </small>
        </p>
      )}
      <p className="dica">{porcento === 0 ? 'Aqui não se costuma dar gorjeta.' : `Costume local: por volta de ${gorjetaSugerida(pais)}%.`}</p>
    </Cartao>
  )
}

// J4: endereço em tela cheia, pra mostrar no táxi
function MostrarProMotorista({ endereco }: { endereco: string }) {
  const [aberto, setAberto] = useState(false)
  return (
    <>
      <button type="button" className="botao secundario ferramenta-motorista" onClick={() => setAberto(true)}>
        <Car size={16} aria-hidden="true" /> Mostrar endereço pro motorista
      </button>
      {aberto &&
        createPortal(
          <div className="tela-motorista" role="dialog" aria-label="Endereço da hospedagem" onClick={() => setAberto(false)}>
            <button type="button" className="tela-motorista-fechar" aria-label="Fechar" onClick={() => setAberto(false)}>
              <X size={28} aria-hidden="true" />
            </button>
            <p>{endereco}</p>
          </div>,
          document.body,
        )}
    </>
  )
}

// C11: banheiro grátis perto (OpenStreetMap)
function Banheiros({ destino }: { destino: Tables<'destinos'> }) {
  const [lista, setLista] = useState<Banheiro[] | null>(null)
  const [estado, setEstado] = useState<'parado' | 'buscando' | 'erro'>('parado')
  const [origem, setOrigem] = useState<'aqui' | 'cidade'>('aqui')

  async function buscarEm(lat: number, lng: number) {
    try {
      const resposta = await fetch(consultaDeBanheiros(lat, lng))
      if (!resposta.ok) throw new Error(String(resposta.status))
      setLista(banheirosDaResposta(await resposta.json(), lat, lng))
      setEstado('parado')
    } catch {
      setEstado('erro')
    }
  }

  function buscar() {
    setEstado('buscando')
    const daCidade = () => {
      if (destino.latitude === null || destino.longitude === null) return setEstado('erro')
      setOrigem('cidade')
      buscarEm(destino.latitude, destino.longitude)
    }
    if (!('geolocation' in navigator)) return daCidade()
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setOrigem('aqui')
        buscarEm(p.coords.latitude, p.coords.longitude)
      },
      daCidade,
      { timeout: 8000, maximumAge: 120000 },
    )
  }

  return (
    <Cartao titulo="Banheiro grátis perto" icone={Toilet}>
      <p className="dica">Na Europa muitos banheiros cobram € 1 a 2. Dados abertos do OpenStreetMap.</p>
      <button type="button" className="botao secundario pequeno" onClick={buscar} disabled={estado === 'buscando'}>
        {estado === 'buscando' ? 'Procurando…' : lista ? 'Procurar de novo' : 'Procurar perto de mim'}
      </button>
      {estado === 'erro' && <p className="form-erro">Não deu pra procurar agora.</p>}
      {lista && lista.length === 0 && <p className="dica">Nenhum banheiro público marcado num raio de 800 m.</p>}
      {lista && lista.length > 0 && (
        <>
          {origem === 'cidade' && <p className="dica">Sem a sua localização: perto do centro de {destino.nome}.</p>}
          <ul className="ferramenta-banheiros">
            {lista.map((b) => (
              <li key={b.id}>
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${b.latitude},${b.longitude}&travelmode=walking`} target="_blank" rel="noreferrer noopener">
                  <strong>{b.metros} m</strong> {b.nome ?? 'Banheiro público'}
                  <small>
                    {b.gratis === true ? 'grátis' : b.gratis === false ? 'pago' : 'preço não informado'}
                    {b.acessivel && ' · acessível'}
                  </small>
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </Cartao>
  )
}

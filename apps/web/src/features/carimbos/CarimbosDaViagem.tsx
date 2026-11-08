import { useCallback, useEffect, useState } from 'react'
import {
  apagarCarimbo,
  buscarCarimbos,
  carimbosDaViagem,
  carimbosPelaLocalizacao,
  dataDaArte,
  dentroDaViagem,
  iconeDoTipo,
  liberarCarimbo,
  textoDoComo,
  tipoDoLugar,
  type Carimbo,
  type ComoLiberou,
  type DestinoDoCarimbo,
} from '@together/core'
import { supabase } from '../../lib/supabase'
import { useViagemAtual } from '../viagens/hooks'
import { useSessao } from '../auth/hooks'
import { hojeTexto } from '../destinos/datas'
import { Icone } from '../../components/ui/Icone'
import { Locate, Share2, Trash2 } from '../../components/ui/icones'
import Cartao from '../../components/ui/Cartao'
import PilhaDeAvatares from '../../components/ui/PilhaDeAvatares'
import { carimboEmImagem } from './carimboEmImagem'
import './carimbos.css'

// Carimbos da viagem (spec 118a): um por destino, apagado até alguém do grupo provar que esteve lá.
// Prova: localização (só com o site aberto, nas datas), foto com GPS (no post) ou "Cheguei" (120c).
// Sem prova: "a gente esteve aqui" (traço de memória). A localização da pessoa não sai do navegador.
export default function CarimbosDaViagem() {
  const { viagem, destinos, membros, meuId, euSouAdm } = useViagemAtual()
  const { ehConvidado } = useSessao()
  const [carimbos, setCarimbos] = useState<Carimbo[] | null>(null)
  const [aberto, setAberto] = useState<string | null>(null) // destino aberto
  const [novos, setNovos] = useState<Set<string>>(new Set())
  const [procurando, setProcurando] = useState(false)
  const [recado, setRecado] = useState<string | null>(null)
  const hoje = hojeTexto()
  const naViagem = dentroDaViagem(hoje, viagem)
  const podeLiberar = !ehConvidado

  const recarregar = useCallback(() => {
    buscarCarimbos(supabase, viagem.id)
      .then(setCarimbos)
      .catch((e) => console.error('Erro ao buscar carimbos:', e))
  }, [viagem.id])
  useEffect(recarregar, [recarregar])

  const liberar = useCallback(
    async (destino: DestinoDoCarimbo, como: ComoLiberou) => {
      const novo = await liberarCarimbo(supabase, viagem.id, destino, como, viagem, hojeTexto())
      if (novo) {
        setCarimbos((atual) => [...(atual ?? []), novo])
        setNovos((s) => new Set(s).add(destino.id))
        setRecado(`Carimbo de ${destino.nome} liberado!`)
      } else recarregar() // alguém liberou antes
    },
    [viagem, recarregar],
  )

  // Pela localização: compara no navegador e só manda "estive aqui"
  const procurar = useCallback(
    (avisarSeNada: boolean) => {
      if (!carimbos || !navigator.geolocation) return
      setProcurando(true)
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const ponto = { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
          const perto = carimbosPelaLocalizacao(destinos, carimbos, ponto, hojeTexto(), viagem)
          try {
            for (const d of perto) await liberar(d, 'localizacao')
            if (!perto.length && avisarSeNada) setRecado('Nenhum destino da viagem a até 15 km daqui.')
          } catch (e) {
            console.error('Erro ao carimbar pela localização:', e)
            setRecado('Não deu pra carimbar agora. Tente de novo.')
          }
          setProcurando(false)
        },
        () => {
          setProcurando(false)
          if (avisarSeNada) setRecado('Sem a localização. Dá pra carimbar postando uma foto de lá.')
        },
        { maximumAge: 10 * 60000, timeout: 15000 },
      )
    },
    [carimbos, destinos, viagem, liberar],
  )

  // Na viagem, com a permissão já dada: confere sozinho ao abrir (sem perguntar de novo)
  const carregou = carimbos !== null
  useEffect(() => {
    if (!carregou || !naViagem || !podeLiberar || !navigator.permissions) return
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((p) => p.state === 'granted' && procurar(false))
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carregou, naViagem, podeLiberar])

  if (!destinos.length) return null
  const lista = carimbosDaViagem(destinos, carimbos ?? [])
  const acesos = lista.filter((x) => x.carimbo).length
  const itemAberto = lista.find((x) => x.destino.id === aberto) ?? null
  const nomeDe = (id: string) => membros.find((m) => m.id === id)?.nome ?? 'Alguém do comboio'

  async function postar(c: Carimbo) {
    const png = await carimboEmImagem(c, viagem.nome)
    if (!png) return
    const arquivo = new File([png], `Carimbo ${c.nome}.png`, { type: 'image/png' })
    if (navigator.canShare?.({ files: [arquivo] })) {
      try {
        await navigator.share({ files: [arquivo] })
      } catch {
        /* cancelou */
      }
      return
    }
    const url = URL.createObjectURL(png)
    const link = document.createElement('a')
    link.href = url
    link.download = arquivo.name
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  async function apagar(c: Carimbo) {
    if (!confirm(`Apagar o carimbo de ${c.nome}? Dá pra liberar de novo depois.`)) return
    try {
      await apagarCarimbo(supabase, c.id)
      setCarimbos((atual) => (atual ?? []).filter((x) => x.id !== c.id))
      setAberto(null)
    } catch (e) {
      console.error('Erro ao apagar carimbo:', e)
    }
  }

  return (
    <Cartao
      titulo="Carimbos"
      icone={Locate}
      className="carimbos"
      acao={
        <span className="carimbos-conta">
          {acesos} de {lista.length}
        </span>
      }
    >
      <ul className="carimbos-lista">
        {lista.map(({ destino, carimbo }, i) => (
          <li key={destino.id}>
            <button
              type="button"
              className={`carimbo ${carimbo ? 'aceso' : 'apagado'} ${carimbo?.como === 'memoria' ? 'memoria' : ''} ${novos.has(destino.id) ? 'novo' : ''} ${aberto === destino.id ? 'aberto' : ''}`}
              style={{ '--giro': `${i % 2 ? 5 : -6}deg` } as React.CSSProperties}
              onClick={() => setAberto(aberto === destino.id ? null : destino.id)}
              aria-expanded={aberto === destino.id}
              aria-label={`${destino.nome}: ${carimbo ? `carimbado ${textoDoComo(carimbo.como)}` : 'ainda não carimbado'}`}
            >
              <span className="carimbo-arte">
                <Icone nome={iconeDoTipo(carimbo?.tipo ?? tipoDoLugar(destino.nome))} size={22} aria-hidden="true" />
                <strong>{destino.nome}</strong>
                {carimbo && <small>{dataDaArte(carimbo.data)}</small>}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {recado && (
        <p className="carimbos-recado" role="status">
          {recado}
        </p>
      )}

      {itemAberto && (
        <div className="carimbo-detalhe">
          {itemAberto.carimbo ? (
            <>
              <p>
                <strong>{itemAberto.carimbo.nome}</strong>, {dataDaArte(itemAberto.carimbo.data)}. Liberado {textoDoComo(itemAberto.carimbo.como)} por{' '}
                {itemAberto.carimbo.liberado_por === meuId ? 'você' : nomeDe(itemAberto.carimbo.liberado_por)}.
              </p>
              <div className="carimbo-quem">
                <PilhaDeAvatares pessoas={membros.map((m) => ({ nome: m.nome, url: m.avatarUrl }))} />
                <small>a galera dessa viagem</small>
              </div>
              <div className="carimbo-acoes">
                {podeLiberar && (
                  <button type="button" className="botao" onClick={() => void postar(itemAberto.carimbo!)}>
                    <Share2 size={16} aria-hidden="true" /> Postar carimbo
                  </button>
                )}
                {euSouAdm && (
                  <button type="button" className="botao-texto" onClick={() => void apagar(itemAberto.carimbo!)}>
                    <Trash2 size={14} aria-hidden="true" /> Apagar
                  </button>
                )}
              </div>
            </>
          ) : podeLiberar ? (
            <>
              <p className="dica">
                O carimbo de {itemAberto.destino.nome} cai sozinho quando alguém do comboio estiver lá (localização) ou postar uma foto de lá.
              </p>
              <div className="carimbo-acoes">
                {naViagem && (
                  <button type="button" className="botao secundario" disabled={procurando} onClick={() => procurar(true)}>
                    <Locate size={16} aria-hidden="true" /> {procurando ? 'Procurando...' : 'Estou aqui'}
                  </button>
                )}
                <button
                  type="button"
                  className="botao-texto"
                  onClick={() =>
                    void liberar(itemAberto.destino, 'memoria').catch((e) => {
                      console.error('Erro ao carimbar de memória:', e)
                      setRecado('Não deu pra carimbar agora. Tente de novo.')
                    })
                  }
                >
                  A gente esteve aqui
                </button>
              </div>
            </>
          ) : (
            <p className="dica">Ainda não carimbado.</p>
          )}
        </div>
      )}
    </Cartao>
  )
}

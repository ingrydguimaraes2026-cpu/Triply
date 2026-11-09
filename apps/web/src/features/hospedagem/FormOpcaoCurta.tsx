import { useState, type FormEvent } from 'react'
import { ChevronDown, ChevronRight, Footprints, Trash2 } from '../../components/ui/icones'
import {
  acharLugar,
  adicionarOpcaoDeHospedagem,
  apagarOpcaoDeHospedagem,
  atualizarOpcaoDeHospedagem,
  contasDaOpcao,
  formatarDinheiro,
  lerValor,
  linkValido,
  minutosAPe,
  paraCampo,
  sugerirNome,
  textoAPe,
  type CidadeDaNoite,
  type DadosDaOpcao,
  type Opcao,
} from '@together/core'
import { supabase } from '../../lib/supabase'
import { mensagemDeErro } from '../financeiro/api'
import { moedasDaViagem } from '../financeiro/categorias'

type Destino = CidadeDaNoite['destino']
type Ponto = { lat: number; lon: number; endereco: string }

type Props = {
  viagemId: string
  destino: Destino
  cidade: CidadeDaNoite | null // null: destino sem noites (não deveria acontecer, mas não quebra)
  pessoas: number
  moedaViagem: string
  opcao?: Opcao // editando
  podeMexer: boolean
  euSouAdm: boolean
  aoTerminar: () => void
}

// Spec 123: adicionar (ou editar) uma opção de hospedagem. Igual ao app (opcao-hospedagem.tsx):
// à vista só o que muda a conta (link, nome, preço, endereço e check-in até); o resto em "Mais detalhes".
export default function FormOpcaoCurta({ viagemId, destino, cidade, pessoas, moedaViagem, opcao, podeMexer, euSouAdm, aoTerminar }: Props) {
  const [link, setLink] = useState(opcao?.link ?? '')
  const [nome, setNome] = useState(opcao?.nome ?? '')
  const [foto, setFoto] = useState<string | null>(opcao?.fotoUrl ?? null)
  const [preco, setPreco] = useState(opcao?.precoTotal != null ? paraCampo(opcao.precoTotal) : '')
  const [moeda, setMoeda] = useState(opcao?.moeda ?? moedaViagem)
  const [endereco, setEndereco] = useState(opcao?.guia?.endereco ?? '')
  const [selfCheckin, setSelfCheckin] = useState(!!opcao?.selfCheckin)
  const [limite, setLimite] = useState(opcao?.horaCheckinLimite?.slice(0, 5) ?? '')
  const [horaCheckin, setHoraCheckin] = useState(opcao?.horaCheckin?.slice(0, 5) ?? '')
  const [horaCheckout, setHoraCheckout] = useState(opcao?.horaCheckout?.slice(0, 5) ?? '')
  const [cancelamento, setCancelamento] = useState(opcao?.cancelamentoGratisAte ?? '')
  const [contato, setContato] = useState(opcao?.contatoAnfitriao ?? '')
  const [observacao, setObservacao] = useState(opcao?.observacao ?? '')
  const [maisDetalhes, setMaisDetalhes] = useState(
    !!(opcao?.horaCheckin || opcao?.horaCheckout || opcao?.cancelamentoGratisAte || opcao?.contatoAnfitriao || opcao?.observacao),
  )
  const [ponto, setPonto] = useState<Ponto | null>(
    opcao?.lat != null && opcao?.lon != null && opcao.guia?.endereco ? { lat: opcao.lat, lon: opcao.lon, endereco: opcao.guia.endereco } : null,
  )
  // Spec 124: lugar que veio do link (Airbnb, hotel) ou já salvo sem endereço. O endereço passa na frente.
  const [pontoDoLink, setPontoDoLink] = useState<{ lat: number; lon: number } | null>(
    opcao?.lat != null && opcao?.lon != null && !opcao.guia?.endereco ? { lat: opcao.lat, lon: opcao.lon } : null,
  )
  const [lendoLink, setLendoLink] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const chegada = cidade?.chegada ?? null
  const valor = preco.trim() ? lerValor(preco) : null
  const contas = valor !== null ? contasDaOpcao(valor, pessoas, cidade?.noites ?? null) : null
  const pontoNaTela = endereco.trim() ? (ponto && ponto.endereco === endereco.trim() ? ponto : null) : pontoDoLink
  const minutos = pontoNaTela && chegada?.lat != null && chegada?.lon != null ? minutosAPe(pontoNaTela, { lat: chegada.lat, lon: chegada.lon }) : null

  // Spec 072: puxa título e foto do link no servidor (se o site deixar)
  function trocarLink(texto: string) {
    setLink(texto)
    const limpo = texto.trim()
    if (!linkValido(limpo) || limpo === opcao?.link) return
    if (!nome.trim()) setNome(sugerirNome(limpo) ?? '')
    setLendoLink(true)
    supabase.functions
      .invoke('previa-link', { body: { url: limpo } })
      .then(({ data }) => {
        const previa = data as { titulo?: string | null; imagem?: string | null; ponto?: { lat: number; lon: number } | null } | null
        if (previa?.ponto) setPontoDoLink(previa.ponto)
        if (previa?.imagem) setFoto(previa.imagem)
        if (previa?.titulo) setNome((atual) => (atual.trim() && atual !== sugerirNome(limpo) ? atual : previa.titulo!.slice(0, 120)))
      })
      .catch(() => {})
      .finally(() => setLendoLink(false))
  }

  // Endereço → ponto no mapa (perto de onde o grupo chega), pra distância a pé
  async function acharEndereco(): Promise<Ponto | null> {
    const texto = endereco.trim()
    if (!texto) return null
    if (ponto && ponto.endereco === texto) return ponto
    const perto = chegada?.lat != null && chegada?.lon != null ? { latitude: chegada.lat, longitude: chegada.lon } : null
    const achado = await acharLugar(texto.toLowerCase().includes(destino.nome.toLowerCase()) ? texto : `${texto}, ${destino.nome}`, perto)
    if (!achado) return null
    const novo = { lat: achado.latitude, lon: achado.longitude, endereco: texto }
    setPonto(novo)
    return novo
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    const linkLimpo = link.trim()
    if (linkLimpo && !linkValido(linkLimpo)) return setErro('O link precisa começar com https://')
    const nomeFinal = nome.trim()
    if (!nomeFinal) return setErro('Dê um nome pra opção (ex.: "Studio perto da estação").')
    if (preco.trim() && valor === null) return setErro('Preço inválido. Ex.: 190 ou 1.250,90')
    setSalvando(true)
    const lugar = endereco.trim() ? await acharEndereco().catch(() => null) : pontoDoLink
    const dados: DadosDaOpcao = {
      destinoId: destino.id,
      nome: nomeFinal.slice(0, 120),
      link: linkLimpo || null,
      precoTotal: valor,
      moeda,
      checkin: opcao?.checkin ?? destino.chegada,
      checkout: opcao?.checkout ?? destino.saida,
      horaCheckin: horaCheckin || null,
      horaCheckout: horaCheckout || null,
      horaCheckinLimite: selfCheckin ? null : limite || null,
      selfCheckin,
      endereco: endereco.trim() || null,
      lat: lugar?.lat ?? null,
      lon: lugar?.lon ?? null,
      contatoAnfitriao: contato.trim() || null,
      observacao: observacao.trim() || null,
      cancelamentoGratisAte: cancelamento || null,
      // O que o formulário curto não mostra fica como estava
      guardaMalas: opcao?.guardaMalas ?? null,
      guardaMalasObs: opcao?.guardaMalasObs ?? null,
      etiquetas: opcao?.etiquetas ?? [],
      nota: opcao?.nota ?? null,
      fotoUrl: foto,
    }
    try {
      if (opcao) await atualizarOpcaoDeHospedagem(supabase, opcao.id, dados)
      else await adicionarOpcaoDeHospedagem(supabase, viagemId, dados)
      aoTerminar()
    } catch (falha) {
      console.error('Erro ao salvar a hospedagem:', falha)
      setErro(mensagemDeErro(falha, 'Não deu pra salvar agora. Tente de novo.'))
      setSalvando(false)
    }
  }

  async function apagar() {
    if (!opcao) return
    setSalvando(true)
    try {
      await apagarOpcaoDeHospedagem(supabase, opcao.id)
      aoTerminar()
    } catch (falha) {
      console.error('Erro ao apagar a hospedagem:', falha)
      setErro(mensagemDeErro(falha, 'Não deu pra apagar. Só quem adicionou a opção ou o ADM apaga.'))
      setSalvando(false)
    }
  }

  return (
    <form className="form" onSubmit={enviar} noValidate>
      <fieldset className="hn-form-campos" disabled={!podeMexer}>
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="hn-link">
            Link (Airbnb, Booking, hotel…)
          </label>
          <input id="hn-link" type="url" inputMode="url" placeholder="https://" value={link} onChange={(e) => trocarLink(e.target.value)} autoFocus={!opcao} />
          {lendoLink && <p className="form-dica">Lendo o link…</p>}
          {foto && (
            <div className="hn-form-foto">
              <img src={foto} alt="" loading="lazy" referrerPolicy="no-referrer" />
              <span>Foto lida do link</span>
              <button type="button" className="botao-texto" onClick={() => setFoto(null)}>
                Tirar
              </button>
            </div>
          )}
        </div>

        <div className="form-campo">
          <label className="form-rotulo" htmlFor="hn-nome">
            Nome
          </label>
          <input id="hn-nome" maxLength={120} placeholder="Ex.: Studio Cannaregio" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>

        <div className="hn-form-preco">
          <div className="form-campo">
            <label className="form-rotulo" htmlFor="hn-preco">
              Preço total (todas as noites)
            </label>
            <input id="hn-preco" inputMode="decimal" placeholder="0,00" value={preco} onChange={(e) => setPreco(e.target.value)} />
          </div>
          <div className="form-campo">
            <label className="form-rotulo" htmlFor="hn-moeda">
              Moeda
            </label>
            <select id="hn-moeda" value={moeda} onChange={(e) => setMoeda(e.target.value)}>
              {moedasDaViagem(moedaViagem, [moeda]).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
        {contas?.porPessoa != null && pessoas > 1 && (
          <p className="form-dica hn-form-conta">
            {formatarDinheiro(contas.porPessoa, moeda)} por pessoa
            {contas.porNoite != null ? ` · ${formatarDinheiro(contas.porNoite, moeda)} por noite` : ''}
          </p>
        )}

        <div className="form-campo">
          <label className="form-rotulo" htmlFor="hn-endereco">
            Endereço (rua e número)
          </label>
          <input id="hn-endereco" maxLength={200} value={endereco} onChange={(e) => setEndereco(e.target.value)} onBlur={() => void acharEndereco()} />
          {minutos !== null ? (
            <p className={minutos <= 15 ? 'hn-fato ok' : 'hn-fato'}>
              <Footprints size={15} aria-hidden="true" /> {textoAPe(minutos)} de {chegada?.lugar}, onde vocês chegam
            </p>
          ) : (
            !chegada?.lat && endereco.trim() && <p className="form-dica">Adicione no roteiro como vocês chegam pra ver a distância.</p>
          )}
        </div>

        <label className="hn-form-troca">
          <span>
            <b>Self check-in</b>
            <small>Entra a qualquer hora (cofre, código)</small>
          </span>
          <input type="checkbox" checked={selfCheckin} onChange={(e) => setSelfCheckin(e.target.checked)} />
        </label>
        {!selfCheckin && (
          <div className="form-campo">
            <label className="form-rotulo" htmlFor="hn-limite">
              Check-in até que horas?{chegada?.hora ? ` (vocês chegam ${chegada.hora})` : ''}
            </label>
            <input id="hn-limite" type="time" value={limite} onChange={(e) => setLimite(e.target.value)} />
          </div>
        )}

        <button type="button" className="hn-form-mais" aria-expanded={maisDetalhes} onClick={() => setMaisDetalhes((v) => !v)}>
          <span>Mais detalhes</span>
          {!maisDetalhes && <small>horários, anfitrião</small>}
          {maisDetalhes ? <ChevronDown size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
        </button>
        {maisDetalhes && (
          <>
            <div className="form-linha">
              <div className="form-campo">
                <label className="form-rotulo" htmlFor="hn-hora-checkin">
                  Check-in a partir de
                </label>
                <input id="hn-hora-checkin" type="time" value={horaCheckin} onChange={(e) => setHoraCheckin(e.target.value)} />
              </div>
              <div className="form-campo">
                <label className="form-rotulo" htmlFor="hn-hora-checkout">
                  Check-out até
                </label>
                <input id="hn-hora-checkout" type="time" value={horaCheckout} onChange={(e) => setHoraCheckout(e.target.value)} />
              </div>
            </div>
            <div className="form-campo">
              <label className="form-rotulo" htmlFor="hn-cancelamento">
                Cancela grátis até
              </label>
              <input id="hn-cancelamento" type="date" value={cancelamento} onChange={(e) => setCancelamento(e.target.value)} />
            </div>
            <div className="form-campo">
              <label className="form-rotulo" htmlFor="hn-contato">
                Contato do anfitrião (telefone ou nome)
              </label>
              <input id="hn-contato" maxLength={120} value={contato} onChange={(e) => setContato(e.target.value)} />
            </div>
            <div className="form-campo">
              <label className="form-rotulo" htmlFor="hn-obs">
                Observação
              </label>
              <textarea id="hn-obs" maxLength={500} value={observacao} onChange={(e) => setObservacao(e.target.value)} />
            </div>
          </>
        )}
      </fieldset>

      {erro && (
        <p className="form-erro" role="alert">
          {erro}
        </p>
      )}
      {podeMexer ? (
        <>
          <div className="form-rodape">
            <button type="submit" className="botao" disabled={salvando}>
              {salvando ? 'Salvando…' : opcao ? 'Salvar' : 'Adicionar opção'}
            </button>
          </div>
          {!euSouAdm && <p className="form-dica hn-centro">O grupo vota. Quem escolhe e reserva é o ADM.</p>}
          {opcao &&
            (confirmando ? (
              <div className="form-rodape">
                <button type="button" className="botao secundario" onClick={() => setConfirmando(false)}>
                  Manter
                </button>
                <button type="button" className="botao perigo" onClick={apagar} disabled={salvando}>
                  Apagar opção
                </button>
              </div>
            ) : (
              <button type="button" className="botao-texto hn-apagar" onClick={() => setConfirmando(true)}>
                <Trash2 size={16} aria-hidden="true" /> Apagar opção
              </button>
            ))}
        </>
      ) : (
        <p className="form-dica hn-centro">Só quem adicionou essa opção ou o ADM mexe nela.</p>
      )}
    </form>
  )
}

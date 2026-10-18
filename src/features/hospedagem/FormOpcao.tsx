import { useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import type { Tables } from '../../types/database'
import { mensagemDeErro } from '../financeiro/api'
import { moedasDaViagem } from '../financeiro/categorias'
import { lerValor, paraCampo } from '../financeiro/dinheiro'
import type { DadosDaOpcao } from './api'
import { detectarSite, linkValido, sugerirNome, type Opcao } from './regras'

type Props = {
  destinos: Tables<'destinos'>[]
  destinoId: string
  moedaViagem: string
  opcao?: Opcao // editando
  podeApagar: boolean
  salvar: (dados: DadosDaOpcao) => Promise<void>
  apagar?: () => Promise<void>
  aoTerminar: () => void
}

// Formulário de uma opção de hospedagem (spec 011). O link vem primeiro: quase sempre é o que a pessoa tem na mão.
export default function FormOpcao({ destinos, destinoId, moedaViagem, opcao, podeApagar, salvar, apagar, aoTerminar }: Props) {
  const destinoInicial = destinos.find((d) => d.id === destinoId)
  const [destino, setDestino] = useState(destinoId)
  const [link, setLink] = useState(opcao?.link ?? '')
  const [nome, setNome] = useState(opcao?.nome ?? '')
  const [valorTexto, setValorTexto] = useState(opcao?.precoTotal != null ? paraCampo(opcao.precoTotal) : '')
  const [moeda, setMoeda] = useState(opcao?.moeda ?? moedaViagem)
  // Opção nova já vem com as datas do destino
  const [checkin, setCheckin] = useState(opcao ? (opcao.checkin ?? '') : (destinoInicial?.chegada ?? ''))
  const [checkout, setCheckout] = useState(opcao ? (opcao.checkout ?? '') : (destinoInicial?.saida ?? ''))
  const [observacao, setObservacao] = useState(opcao?.observacao ?? '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState(false)

  const site = linkValido(link.trim()) ? detectarSite(link.trim()) : null

  function aoMudarLink(valor: string) {
    setLink(valor)
    const limpo = valor.trim()
    if (!nome.trim() && linkValido(limpo)) {
      const sugestao = sugerirNome(limpo)
      if (sugestao) setNome(sugestao)
    }
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    const linkLimpo = link.trim()
    if (linkLimpo && !linkValido(linkLimpo)) return setErro('O link precisa começar com https://')
    const nomeFinal = nome.trim() || (site ? `Opção no ${site.nome}` : '')
    if (!nomeFinal) return setErro('Dê um nome pra opção (ex.: "Apê perto da praia").')
    const preco = valorTexto.trim() ? lerValor(valorTexto) : null
    if (valorTexto.trim() && preco === null) return setErro('Preço inválido. Ex.: 480 ou 1.234,50')
    if (checkin && checkout && checkout < checkin) return setErro('O check-out está antes do check-in.')

    setSalvando(true)
    try {
      await salvar({
        destinoId: destino,
        nome: nomeFinal.slice(0, 120),
        link: linkLimpo || null,
        precoTotal: preco,
        moeda,
        checkin: checkin || null,
        checkout: checkout || null,
        observacao: observacao.trim() || null,
      })
      aoTerminar()
    } catch (erro) {
      console.error('Erro ao salvar hospedagem:', erro)
      setErro(mensagemDeErro(erro, 'Não deu pra salvar a opção.'))
      setSalvando(false)
    }
  }

  async function confirmarApagar() {
    if (!apagar) return
    setSalvando(true)
    try {
      await apagar()
      aoTerminar()
    } catch (erro) {
      console.error('Erro ao apagar hospedagem:', erro)
      setErro(mensagemDeErro(erro, 'Não deu pra apagar a opção.'))
      setSalvando(false)
    }
  }

  return (
    <form className="form" onSubmit={enviar} noValidate>
      <div className="form-campo">
        <label className="form-rotulo" htmlFor="hosp-link">
          Link (Airbnb, Booking…)
        </label>
        <input
          id="hosp-link"
          type="url"
          inputMode="url"
          placeholder="https://www.airbnb.com.br/rooms/…"
          value={link}
          onChange={(e) => aoMudarLink(e.target.value)}
          autoFocus={!opcao}
        />
        {site && <p className="form-dica">Reconhecido: {site.nome}</p>}
      </div>

      <div className="form-campo">
        <label className="form-rotulo" htmlFor="hosp-nome">
          Nome
        </label>
        <input id="hosp-nome" maxLength={120} placeholder="Ex.: Apê no Vieux Nice" value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>

      <div className="form-linha">
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="hosp-preco">
            Preço total (todas as noites)
          </label>
          <input id="hosp-preco" inputMode="decimal" placeholder="0,00" value={valorTexto} onChange={(e) => setValorTexto(e.target.value)} />
        </div>
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="hosp-moeda">
            Moeda
          </label>
          <select id="hosp-moeda" value={moeda} onChange={(e) => setMoeda(e.target.value)}>
            {moedasDaViagem(moedaViagem, [moeda]).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-linha">
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="hosp-checkin">
            Check-in
          </label>
          <input id="hosp-checkin" type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} />
        </div>
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="hosp-checkout">
            Check-out
          </label>
          <input id="hosp-checkout" type="date" value={checkout} min={checkin || undefined} onChange={(e) => setCheckout(e.target.value)} />
        </div>
      </div>

      {destinos.length > 1 && (
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="hosp-destino">
            Destino
          </label>
          <select id="hosp-destino" value={destino} onChange={(e) => setDestino(e.target.value)}>
            {destinos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="form-campo">
        <label className="form-rotulo" htmlFor="hosp-obs">
          Observação
        </label>
        <textarea
          id="hosp-obs"
          maxLength={500}
          placeholder="Ex.: 2 quartos, cozinha, 10 min da praia. Cancelamento grátis até 15/05."
          value={observacao}
          onChange={(e) => setObservacao(e.target.value)}
        />
      </div>

      {erro && (
        <p className="form-erro" role="alert">
          {erro}
        </p>
      )}
      <div className="form-rodape">
        <button type="submit" className="botao" disabled={salvando}>
          {salvando ? 'Salvando…' : opcao ? 'Salvar alterações' : 'Adicionar opção'}
        </button>
      </div>
      {opcao &&
        podeApagar &&
        (confirmando ? (
          <div className="form-rodape">
            <button type="button" className="botao secundario" onClick={() => setConfirmando(false)}>
              Manter
            </button>
            <button type="button" className="botao perigo" onClick={confirmarApagar} disabled={salvando}>
              Apagar opção
            </button>
          </div>
        ) : (
          <button type="button" className="botao-texto" onClick={() => setConfirmando(true)}>
            <Trash2 size={16} aria-hidden="true" /> Apagar opção
          </button>
        ))}
    </form>
  )
}

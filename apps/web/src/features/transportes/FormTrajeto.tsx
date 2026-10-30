import { useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { SITUACOES_DO_TRAJETO, type Tables } from '@together/core'
import { mensagemDeErro } from '../financeiro/api'
import { apagarTrajeto, criarBateEVolta, MEIOS, salvarTrajeto, type Trajeto } from './api'
import { deCampoHorario, paraCampoHorario } from './avisos'

type Props = {
  viagemId: string
  moedaViagem: string
  destinos: Tables<'destinos'>[]
  trajeto?: Trajeto // editando
  origemId?: string // já vem preenchido pelo trecho
  destinoId?: string
  aoTerminar: () => void
}

// Formulário do trajeto (spec 004). Só o ADM chega aqui.
export default function FormTrajeto({ viagemId, moedaViagem, destinos, trajeto, origemId, destinoId, aoTerminar }: Props) {
  const [origem, setOrigem] = useState(trajeto ? (trajeto.origem_id ?? '') : (origemId ?? ''))
  const [destino, setDestino] = useState(trajeto ? (trajeto.destino_id ?? '') : (destinoId ?? ''))
  const [meioEscolhido, setMeio] = useState(trajeto?.meio ?? 'trem')
  const [partida, setPartida] = useState(paraCampoHorario(trajeto?.partida ?? null))
  const [chegada, setChegada] = useState(paraCampoHorario(trajeto?.chegada ?? null))
  const [bateEVolta, setBateEVolta] = useState(trajeto?.bate_e_volta ?? false)
  const [voltaPartida, setVoltaPartida] = useState('')
  const [voltaChegada, setVoltaChegada] = useState('')
  const [observacao, setObservacao] = useState(trajeto?.observacao ?? '')
  const [link, setLink] = useState(trajeto?.link_reserva ?? '')
  const [situacao, setSituacao] = useState(trajeto?.situacao ?? 'sugestao')
  const [preco, setPreco] = useState(trajeto?.preco != null ? String(trajeto.preco).replace('.', ',') : '')
  const [moeda, setMoeda] = useState(trajeto?.moeda ?? moedaViagem)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState(false)

  const nomeDe = (id: string) => destinos.find((d) => d.id === id)?.nome ?? 'o destino'
  const criandoVolta = !trajeto && bateEVolta

  async function salvar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    if (!origem || !destino) return setErro('Escolha de onde sai e pra onde vai.')
    if (origem === destino) return setErro('A origem e o destino são o mesmo lugar.')
    if (partida && chegada && chegada < partida) return setErro('A chegada está antes da partida.')
    if (criandoVolta && voltaPartida && partida && voltaPartida < partida) return setErro('A volta está antes da ida.')
    const linkLimpo = link.trim()
    if (linkLimpo && !/^https?:\/\//i.test(linkLimpo)) return setErro('O link precisa começar com http:// ou https://')

    const precoNumero = preco.trim() ? Number(preco.trim().replace(/\./g, '').replace(',', '.')) : null
    if (precoNumero !== null && (!Number.isFinite(precoNumero) || precoNumero < 0)) return setErro('O preço não está certo. Ex.: 45,50')
    const moedaLimpa = moeda.trim().toUpperCase()
    if (precoNumero !== null && !/^[A-Z]{3}$/.test(moedaLimpa)) return setErro('A moeda tem 3 letras. Ex.: EUR')

    const dados = {
      origem_id: origem,
      destino_id: destino,
      meio: meioEscolhido,
      partida: deCampoHorario(partida),
      chegada: deCampoHorario(chegada),
      bate_e_volta: bateEVolta,
      observacao: observacao.trim() || null,
      link_reserva: linkLimpo || null,
      situacao,
      preco: precoNumero,
      moeda: precoNumero === null ? null : moedaLimpa,
    }
    setSalvando(true)
    try {
      if (criandoVolta) {
        await criarBateEVolta(viagemId, dados, { partida: deCampoHorario(voltaPartida), chegada: deCampoHorario(voltaChegada) })
      } else {
        await salvarTrajeto(viagemId, dados, trajeto?.id)
      }
      aoTerminar()
    } catch (erro) {
      console.error('Erro ao salvar trajeto:', erro)
      setErro(mensagemDeErro(erro, 'Não deu pra salvar o trajeto.'))
      setSalvando(false)
    }
  }

  async function apagar() {
    if (!trajeto) return
    setSalvando(true)
    try {
      await apagarTrajeto(trajeto.id)
      aoTerminar()
    } catch (erro) {
      console.error('Erro ao apagar trajeto:', erro)
      setErro(mensagemDeErro(erro, 'Não deu pra apagar o trajeto.'))
      setSalvando(false)
    }
  }

  return (
    <form className="form" onSubmit={salvar} noValidate>
      <div className="form-linha">
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="trajeto-origem">
            Saindo de
          </label>
          <select id="trajeto-origem" value={origem} onChange={(e) => setOrigem(e.target.value)}>
            <option value="">Escolha…</option>
            {destinos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="trajeto-destino">
            Indo pra
          </label>
          <select id="trajeto-destino" value={destino} onChange={(e) => setDestino(e.target.value)}>
            <option value="">Escolha…</option>
            {destinos.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-campo">
        <span className="form-rotulo">Como?</span>
        <div className="escolhas">
          {MEIOS.map(({ chave, nome, icone: Icone }) => (
            <button key={chave} type="button" aria-pressed={meioEscolhido === chave} onClick={() => setMeio(chave)}>
              <Icone size={20} aria-hidden="true" />
              {nome}
            </button>
          ))}
        </div>
      </div>

      <div className="form-linha">
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="trajeto-partida">
            Partida
          </label>
          <input id="trajeto-partida" type="datetime-local" value={partida} onChange={(e) => setPartida(e.target.value)} />
        </div>
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="trajeto-chegada">
            Chegada
          </label>
          <input id="trajeto-chegada" type="datetime-local" value={chegada} min={partida || undefined} onChange={(e) => setChegada(e.target.value)} />
        </div>
      </div>
      <p className="form-dica">Horários no fuso do seu celular.</p>

      <label className="interruptor">
        <span>
          <strong>Bate-e-volta</strong>
          <small>{trajeto ? 'Ida e volta no mesmo dia' : 'Cria também a volta pra cá, no mesmo dia'}</small>
        </span>
        <input type="checkbox" checked={bateEVolta} onChange={(e) => setBateEVolta(e.target.checked)} />
      </label>

      {criandoVolta && (
        <div className="form-linha">
          <div className="form-campo">
            <label className="form-rotulo" htmlFor="volta-partida">
              Volta: partida de {destino ? nomeDe(destino) : '…'}
            </label>
            <input id="volta-partida" type="datetime-local" value={voltaPartida} min={chegada || partida || undefined} onChange={(e) => setVoltaPartida(e.target.value)} />
          </div>
          <div className="form-campo">
            <label className="form-rotulo" htmlFor="volta-chegada">
              Volta: chegada em {origem ? nomeDe(origem) : '…'}
            </label>
            <input id="volta-chegada" type="datetime-local" value={voltaChegada} min={voltaPartida || undefined} onChange={(e) => setVoltaChegada(e.target.value)} />
          </div>
        </div>
      )}

      <div className="form-campo">
        <span className="form-rotulo">Situação</span>
        <div className="escolhas">
          {SITUACOES_DO_TRAJETO.map((s) => (
            <button key={s.chave} type="button" aria-pressed={situacao === s.chave} onClick={() => setSituacao(s.chave)}>
              {s.nome}
            </button>
          ))}
        </div>
      </div>
      <div className="form-linha">
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="trajeto-preco">
            Preço {bateEVolta && !trajeto ? '(ida e volta)' : ''} pro comboio
          </label>
          <input id="trajeto-preco" inputMode="decimal" placeholder="Ex.: 45,50" value={preco} onChange={(e) => setPreco(e.target.value)} />
        </div>
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="trajeto-moeda">
            Moeda
          </label>
          <input id="trajeto-moeda" maxLength={3} value={moeda} onChange={(e) => setMoeda(e.target.value.toUpperCase())} />
        </div>
      </div>

      <div className="form-campo">
        <label className="form-rotulo" htmlFor="trajeto-obs">
          Observação
        </label>
        <textarea id="trajeto-obs" maxLength={500} placeholder="Ex.: comprar bilhete na estação" value={observacao} onChange={(e) => setObservacao(e.target.value)} />
      </div>
      <div className="form-campo">
        <label className="form-rotulo" htmlFor="trajeto-link">
          Link da reserva (opcional)
        </label>
        <input id="trajeto-link" type="url" inputMode="url" placeholder="https://…" value={link} onChange={(e) => setLink(e.target.value)} />
      </div>

      {erro && (
        <p className="form-erro" role="alert">
          {erro}
        </p>
      )}
      <div className="form-rodape">
        <button type="submit" className="botao" disabled={salvando}>
          {salvando ? 'Salvando…' : trajeto ? 'Salvar alterações' : criandoVolta ? 'Salvar ida e volta' : 'Adicionar trajeto'}
        </button>
      </div>
      {trajeto &&
        (confirmando ? (
          <div className="form-rodape">
            <button type="button" className="botao secundario" onClick={() => setConfirmando(false)}>
              Manter
            </button>
            <button type="button" className="botao perigo" onClick={apagar} disabled={salvando}>
              Apagar trajeto
            </button>
          </div>
        ) : (
          <button type="button" className="botao-texto alinhar-inicio" onClick={() => setConfirmando(true)}>
            <Trash2 size={16} aria-hidden="true" /> Apagar trajeto
          </button>
        ))}
    </form>
  )
}

import { useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { lerEscalas, SITUACOES_DO_TRAJETO, type Escala, type Tables } from '@together/core'
import { mensagemDeErro } from '../financeiro/api'
import { apagarTrajeto, criarBateEVolta, definirPassageiros, MEIOS, salvarTrajeto, type Trajeto } from './api'
import type { Membro } from '../viagens/hooks'
import { deCampoHorario, paraCampoHorario } from './avisos'

type Props = {
  viagemId: string
  moedaViagem: string
  membros: Membro[] // spec 067: quem vai
  destinos: Tables<'destinos'>[]
  trajeto?: Trajeto // editando
  origemId?: string // já vem preenchido pelo trecho
  destinoId?: string
  aoTerminar: () => void
}

// Formulário do trajeto (spec 004). Só o ADM chega aqui.
export default function FormTrajeto({ viagemId, moedaViagem, membros, destinos, trajeto, origemId, destinoId, aoTerminar }: Props) {
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
  const [passageiros, setPassageiros] = useState<string[]>(trajeto?.passageiros ?? [])
  const [motorista, setMotorista] = useState(trajeto?.motorista_id ?? '')
  // Spec 074: estação/terminal e escalas (horários no campo do celular, como partida/chegada)
  const [estacaoPartida, setEstacaoPartida] = useState(trajeto?.estacao_partida ?? '')
  const [estacaoChegada, setEstacaoChegada] = useState(trajeto?.estacao_chegada ?? '')
  const [escalas, setEscalas] = useState<Escala[]>(() =>
    lerEscalas(trajeto?.escalas).map((e) => ({ local: e.local, chegada: paraCampoHorario(e.chegada), partida: paraCampoHorario(e.partida) })),
  )
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
      motorista_id: meioEscolhido === 'carro' ? motorista || null : null,
      estacao_partida: estacaoPartida.trim() || null,
      estacao_chegada: estacaoChegada.trim() || null,
      escalas: escalas
        .filter((e) => e.local.trim())
        .map((e) => ({ local: e.local.trim().slice(0, 80), chegada: deCampoHorario(e.chegada ?? ''), partida: deCampoHorario(e.partida ?? '') })),
    }
    setSalvando(true)
    try {
      const ids = criandoVolta
        ? await criarBateEVolta(viagemId, dados, { partida: deCampoHorario(voltaPartida), chegada: deCampoHorario(voltaChegada) })
        : [await salvarTrajeto(viagemId, dados, trajeto?.id)]
      // Spec 067: todo mundo marcado = lista vazia (o comboio inteiro, inclusive quem entrar depois)
      const todos = passageiros.length === membros.length
      if (passageiros.length > 0 || (trajeto?.passageiros.length ?? 0) > 0) await definirPassageiros(ids, todos ? [] : passageiros)
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

      <div className="form-linha">
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="trajeto-est-partida">
            Estação / terminal de saída
          </label>
          <input id="trajeto-est-partida" maxLength={80} placeholder="Ex.: Terminal 2" value={estacaoPartida} onChange={(e) => setEstacaoPartida(e.target.value)} />
        </div>
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="trajeto-est-chegada">
            De chegada
          </label>
          <input id="trajeto-est-chegada" maxLength={80} placeholder="Ex.: Milano Centrale" value={estacaoChegada} onChange={(e) => setEstacaoChegada(e.target.value)} />
        </div>
      </div>

      <fieldset className="form-campo escalas">
        <legend className="form-rotulo">Escalas / conexões</legend>
        {escalas.map((e, i) => (
          <div key={i} className="escala">
            <input aria-label="Onde é a escala" placeholder="Ex.: Frankfurt" maxLength={80} value={e.local} onChange={(ev) => setEscalas(escalas.map((x, j) => (j === i ? { ...x, local: ev.target.value } : x)))} />
            <input aria-label="Chega na escala" type="datetime-local" value={e.chegada ?? ''} onChange={(ev) => setEscalas(escalas.map((x, j) => (j === i ? { ...x, chegada: ev.target.value } : x)))} />
            <input aria-label="Sai da escala" type="datetime-local" value={e.partida ?? ''} onChange={(ev) => setEscalas(escalas.map((x, j) => (j === i ? { ...x, partida: ev.target.value } : x)))} />
            <button type="button" className="botao-texto" aria-label="Tirar escala" onClick={() => setEscalas(escalas.filter((_, j) => j !== i))}>
              <Trash2 size={14} aria-hidden="true" />
            </button>
          </div>
        ))}
        {escalas.length < 4 && (
          <button type="button" className="botao-texto alinhar-inicio" onClick={() => setEscalas([...escalas, { local: '', chegada: '', partida: '' }])}>
            + Escala
          </button>
        )}
      </fieldset>

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

      {meioEscolhido === 'carro' && (
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="trajeto-motorista">
            Quem dirige
          </label>
          <select id="trajeto-motorista" value={motorista} onChange={(e) => setMotorista(e.target.value)}>
            <option value="">A combinar</option>
            {membros.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </select>
        </div>
      )}

      {membros.length > 1 && (
        <fieldset className="form-campo passageiros">
          <legend className="form-rotulo">Quem vai {passageiros.length === 0 && '(ninguém marcado = todo mundo)'}</legend>
          {membros.map((m) => (
            <label key={m.id}>
              <input
                type="checkbox"
                checked={passageiros.includes(m.id)}
                onChange={(e) => setPassageiros(e.target.checked ? [...passageiros, m.id] : passageiros.filter((p) => p !== m.id))}
              />
              {m.nome}
            </label>
          ))}
        </fieldset>
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

import { useEffect, useState, type FormEvent } from 'react'
import { consultaDeEstabelecimentos, estabelecimentosDaResposta, type Estabelecimento } from '@together/core'
import { Trash2 } from 'lucide-react'
import type { Tables } from '@together/core'
import { mensagemDeErro } from '../financeiro/api'
import { moedasDaViagem } from '../financeiro/categorias'
import { lerValor, paraCampo } from '@together/core'
import { linkValido } from '../hospedagem/regras'
import type { DadosDoLugar } from './api'
import { ICONE_DO_TIPO } from './icones'
import { TIPOS_DE_LUGAR, tipoDeLugar, type Lugar, type TipoDeLugar } from './regras'

type Props = {
  destinos: Tables<'destinos'>[]
  destinoId: string | null
  tipoInicial?: TipoDeLugar // ex.: a dica do guarda-volumes já abre no tipo certo
  moedaViagem: string
  lugar?: Lugar // editando
  podeApagar: boolean
  salvar: (dados: DadosDoLugar) => Promise<void>
  apagar?: () => Promise<void>
  aoTerminar: () => void
}

// Formulário de um lugar (spec 016): tipo primeiro (4 botões grandes), depois nome e o resto, tudo opcional menos o nome.
export default function FormLugar({ destinos, destinoId, tipoInicial, moedaViagem, lugar, podeApagar, salvar, apagar, aoTerminar }: Props) {
  const [tipo, setTipo] = useState<TipoDeLugar>(lugar?.tipo ?? tipoInicial ?? 'passeio')
  const [destino, setDestino] = useState(lugar ? (lugar.destinoId ?? '') : (destinoId ?? ''))
  const [nome, setNome] = useState(lugar?.nome ?? '')
  const [link, setLink] = useState(lugar?.link ?? '')
  const [horario, setHorario] = useState(lugar?.horario ?? '')
  const [valorTexto, setValorTexto] = useState(lugar?.preco != null ? paraCampo(lugar.preco) : '')
  const [moeda, setMoeda] = useState(lugar?.moeda ?? moedaViagem)
  const [observacao, setObservacao] = useState(lugar?.observacao ?? '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  // Spec 064: sugestões enquanto digita o nome (Photon, perto do destino)
  const [ponto, setPonto] = useState<{ latitude: number; longitude: number; endereco: string } | null>(
    lugar?.latitude != null && lugar?.longitude != null ? { latitude: lugar.latitude, longitude: lugar.longitude, endereco: lugar.endereco ?? '' } : null,
  )
  const [sugestoes, setSugestoes] = useState<Estabelecimento[]>([])
  const [digitando, setDigitando] = useState(false)
  const destinoEscolhido = destinos.find((d) => d.id === destino)

  useEffect(() => {
    if (!digitando || nome.trim().length < 3) return
    const controle = new AbortController()
    const espera = setTimeout(() => {
      fetch(consultaDeEstabelecimentos(`${nome} ${destinoEscolhido?.nome ?? ''}`, destinoEscolhido?.latitude ?? null, destinoEscolhido?.longitude ?? null), {
        signal: controle.signal,
      })
        .then((r) => (r.ok ? r.json() : { features: [] }))
        .then((j) => setSugestoes(estabelecimentosDaResposta(j)))
        .catch(() => {})
    }, 400)
    return () => {
      clearTimeout(espera)
      controle.abort()
    }
  }, [nome, digitando, destinoEscolhido])

  function escolher(e: Estabelecimento) {
    setNome(e.nome.slice(0, 120))
    setPonto({ latitude: e.latitude, longitude: e.longitude, endereco: e.endereco })
    if (!lugar && e.tipo !== 'outro') setTipo(e.tipo)
    setSugestoes([])
    setDigitando(false)
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    const nomeLimpo = nome.trim()
    if (!nomeLimpo) return setErro('Dê um nome pro lugar (ex.: "Duomo de Milão").')
    const linkLimpo = link.trim()
    if (linkLimpo && !linkValido(linkLimpo)) return setErro('O link precisa começar com https://')
    const preco = valorTexto.trim() ? lerValor(valorTexto) : null
    if (valorTexto.trim() && preco === null) return setErro('Preço inválido. Ex.: 6 ou 19,50')

    setSalvando(true)
    try {
      await salvar({
        destinoId: destino || null,
        tipo,
        nome: nomeLimpo.slice(0, 120),
        link: linkLimpo || null,
        horario: horario.trim().slice(0, 120) || null,
        preco,
        moeda,
        observacao: observacao.trim() || null,
        latitude: ponto?.latitude ?? null,
        longitude: ponto?.longitude ?? null,
        endereco: ponto?.endereco || null,
      })
      aoTerminar()
    } catch (erro) {
      console.error('Erro ao salvar lugar:', erro)
      setErro(mensagemDeErro(erro, 'Não deu pra salvar o lugar.'))
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
      console.error('Erro ao apagar lugar:', erro)
      setErro(mensagemDeErro(erro, 'Não deu pra apagar o lugar.'))
      setSalvando(false)
    }
  }

  return (
    <form className="form" onSubmit={enviar} noValidate>
      <fieldset className="lugar-tipos">
        <legend className="form-rotulo">Tipo</legend>
        {TIPOS_DE_LUGAR.map((t) => {
          const Icone = ICONE_DO_TIPO[t.chave]
          return (
            <label key={t.chave} className={tipo === t.chave ? 'lugar-tipo ativo' : 'lugar-tipo'}>
              <input type="radio" name="tipo" value={t.chave} checked={tipo === t.chave} onChange={() => setTipo(t.chave)} />
              <Icone size={20} aria-hidden="true" />
              {t.nome}
            </label>
          )
        })}
      </fieldset>

      <div className="form-campo">
        <label className="form-rotulo" htmlFor="lugar-nome">
          Nome
        </label>
        <input
          id="lugar-nome"
          maxLength={120}
          placeholder={tipoDeLugar(tipo).exemplo}
          value={nome}
          onChange={(e) => {
            setNome(e.target.value)
            setDigitando(true)
            setPonto(null)
          }}
          autoFocus={!lugar}
          autoComplete="off"
        />
        {digitando && sugestoes.length > 0 && nome.trim().length >= 3 && (
          <ul className="lugar-sugestoes" aria-label="Sugestões">
            {sugestoes.map((e) => (
              <li key={e.id}>
                <button type="button" onClick={() => escolher(e)}>
                  <strong>{e.nome}</strong>
                  {e.endereco && <small>{e.endereco}</small>}
                </button>
              </li>
            ))}
          </ul>
        )}
        {ponto && <p className="form-dica">📍 {ponto.endereco || 'Local no mapa salvo'}</p>}
      </div>

      <div className="form-campo">
        <label className="form-rotulo" htmlFor="lugar-link">
          Link (site, Instagram, TikTok…)
        </label>
        <input id="lugar-link" type="url" inputMode="url" placeholder="https://…" value={link} onChange={(e) => setLink(e.target.value)} />
      </div>

      <div className="form-campo">
        <label className="form-rotulo" htmlFor="lugar-horario">
          Horário
        </label>
        <input
          id="lugar-horario"
          maxLength={120}
          placeholder={tipo === 'guarda_volumes' ? 'Ex.: todo dia, 6h às 23h' : 'Ex.: 9h às 18h, fecha às segundas'}
          value={horario}
          onChange={(e) => setHorario(e.target.value)}
        />
      </div>

      <div className="form-linha">
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="lugar-preco">
            {tipo === 'guarda_volumes' ? 'Preço (por mala)' : 'Preço'}
          </label>
          <input id="lugar-preco" inputMode="decimal" placeholder="0,00" value={valorTexto} onChange={(e) => setValorTexto(e.target.value)} />
        </div>
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="lugar-moeda">
            Moeda
          </label>
          <select id="lugar-moeda" value={moeda} onChange={(e) => setMoeda(e.target.value)}>
            {moedasDaViagem(moedaViagem, [moeda]).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {destinos.length > 1 && (
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="lugar-destino">
            Destino
          </label>
          <select id="lugar-destino" value={destino} onChange={(e) => setDestino(e.target.value)}>
            {!destino && <option value="">Sem destino</option>}
            {destinos.map((d, i) => (
              <option key={d.id} value={d.id}>
                {i + 1}. {d.nome}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="form-campo">
        <label className="form-rotulo" htmlFor="lugar-obs">
          Observação
        </label>
        <textarea
          id="lugar-obs"
          maxLength={500}
          placeholder={tipo === 'guarda_volumes' ? 'Ex.: 3 min a pé da estação, armário grande cabe 2 malas.' : 'Ex.: chegar cedo, fila grande depois das 11h.'}
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
          {salvando ? 'Salvando…' : lugar ? 'Salvar alterações' : 'Adicionar lugar'}
        </button>
      </div>
      {lugar &&
        podeApagar &&
        (confirmando ? (
          <div className="form-rodape">
            <button type="button" className="botao secundario" onClick={() => setConfirmando(false)}>
              Manter
            </button>
            <button type="button" className="botao perigo" onClick={confirmarApagar} disabled={salvando}>
              Apagar lugar
            </button>
          </div>
        ) : (
          <button type="button" className="botao-texto" onClick={() => setConfirmando(true)}>
            <Trash2 size={16} aria-hidden="true" /> Apagar lugar
          </button>
        ))}
    </form>
  )
}

import { useState, type FormEvent } from 'react'
import { Check, Copy, KeyRound, MapPin, Pencil, ScrollText, Wifi } from 'lucide-react'
import { mensagemDeErro } from '../financeiro/api'
import { guiaVazio, type GuiaDaCasa as Guia } from './regras'

// Guia da casa (spec 026): endereço, Wi-Fi, código da porta e regras, na hospedagem escolhida.
export default function GuiaDaCasa({ guia, podeEditar, aoEditar }: { guia?: Guia; podeEditar: boolean; aoEditar: () => void }) {
  const [copiado, setCopiado] = useState(false)

  async function copiarSenha() {
    if (!guia?.wifiSenha) return
    try {
      await navigator.clipboard.writeText(guia.wifiSenha)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Sem permissão de copiar: a senha está na tela, dá pra copiar na mão
    }
  }

  if (guiaVazio(guia)) {
    return (
      <section className="guia-casa vazio" aria-label="Guia da casa">
        <p>Ninguém preencheu o guia da casa ainda.</p>
        {podeEditar && (
          <button type="button" className="botao-texto" onClick={aoEditar}>
            <Pencil size={14} aria-hidden="true" /> Preencher guia
          </button>
        )}
      </section>
    )
  }

  const { endereco, wifiRede, wifiSenha, codigoPorta, regras } = guia!
  return (
    <section className="guia-casa" aria-label="Guia da casa">
      <header className="guia-casa-topo">
        <h4>Guia da casa</h4>
        {podeEditar && (
          <button type="button" className="botao-texto" onClick={aoEditar} aria-label="Editar guia da casa">
            <Pencil size={14} aria-hidden="true" /> Editar
          </button>
        )}
      </header>
      <dl>
        {endereco && (
          <div>
            <dt>
              <MapPin size={14} aria-hidden="true" /> Endereço
            </dt>
            <dd>
              {endereco}{' '}
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`} target="_blank" rel="noreferrer noopener">
                Abrir no mapa
              </a>
            </dd>
          </div>
        )}
        {(wifiRede || wifiSenha) && (
          <div>
            <dt>
              <Wifi size={14} aria-hidden="true" /> Wi-Fi
            </dt>
            <dd>
              {wifiRede && <span>{wifiRede}</span>}
              {wifiRede && wifiSenha && ' · '}
              {wifiSenha && (
                <>
                  <code>{wifiSenha}</code>{' '}
                  <button type="button" className="guia-copiar" onClick={copiarSenha}>
                    {copiado ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
                    {copiado ? 'Copiado!' : 'Copiar senha'}
                  </button>
                </>
              )}
            </dd>
          </div>
        )}
        {codigoPorta && (
          <div>
            <dt>
              <KeyRound size={14} aria-hidden="true" /> Código da porta
            </dt>
            <dd>
              <code>{codigoPorta}</code>
            </dd>
          </div>
        )}
        {regras && (
          <div>
            <dt>
              <ScrollText size={14} aria-hidden="true" /> Regras da casa
            </dt>
            <dd className="guia-regras">{regras}</dd>
          </div>
        )}
      </dl>
    </section>
  )
}

// Formulário da gaveta "Guia da casa"
export function FormGuia({ guia, salvar, aoTerminar }: { guia?: Guia; salvar: (guia: Guia) => Promise<void>; aoTerminar: () => void }) {
  const [endereco, setEndereco] = useState(guia?.endereco ?? '')
  const [wifiRede, setWifiRede] = useState(guia?.wifiRede ?? '')
  const [wifiSenha, setWifiSenha] = useState(guia?.wifiSenha ?? '')
  const [codigoPorta, setCodigoPorta] = useState(guia?.codigoPorta ?? '')
  const [regras, setRegras] = useState(guia?.regras ?? '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    setErro(null)
    setSalvando(true)
    try {
      await salvar({ endereco, wifiRede, wifiSenha, codigoPorta, regras })
      aoTerminar()
    } catch (erro) {
      console.error('Erro ao salvar o guia da casa:', erro)
      setErro(mensagemDeErro(erro, 'Não deu pra salvar o guia.'))
      setSalvando(false)
    }
  }

  return (
    <form className="form" onSubmit={enviar} noValidate>
      <p className="form-dica">Só o comboio vê. Preencha o que tiver: dá pra completar depois.</p>
      <div className="form-campo">
        <label className="form-rotulo" htmlFor="guia-endereco">
          Endereço
        </label>
        <input
          id="guia-endereco"
          maxLength={300}
          autoComplete="off"
          placeholder="Ex.: Rue Droite 12, 06300 Nice"
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          autoFocus
        />
      </div>
      <div className="form-linha">
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="guia-wifi-rede">
            Rede do Wi-Fi
          </label>
          <input id="guia-wifi-rede" maxLength={100} autoComplete="off" value={wifiRede} onChange={(e) => setWifiRede(e.target.value)} />
        </div>
        <div className="form-campo">
          <label className="form-rotulo" htmlFor="guia-wifi-senha">
            Senha do Wi-Fi
          </label>
          <input id="guia-wifi-senha" maxLength={100} autoComplete="off" value={wifiSenha} onChange={(e) => setWifiSenha(e.target.value)} />
        </div>
      </div>
      <div className="form-campo">
        <label className="form-rotulo" htmlFor="guia-porta">
          Código da porta ou do cofre de chaves
        </label>
        <input id="guia-porta" maxLength={50} autoComplete="off" value={codigoPorta} onChange={(e) => setCodigoPorta(e.target.value)} />
      </div>
      <div className="form-campo">
        <label className="form-rotulo" htmlFor="guia-regras">
          Regras da casa
        </label>
        <textarea
          id="guia-regras"
          maxLength={1000}
          placeholder="Ex.: silêncio depois das 22h, lixo reciclável no pátio, deixar a chave na mesa."
          value={regras}
          onChange={(e) => setRegras(e.target.value)}
        />
      </div>
      {erro && (
        <p className="form-erro" role="alert">
          {erro}
        </p>
      )}
      <div className="form-rodape">
        <button type="submit" className="botao" disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar guia'}
        </button>
      </div>
    </form>
  )
}

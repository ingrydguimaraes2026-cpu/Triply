import { useState } from 'react'
import { lerListaDoGoogle, type LugarImportado, type Tables } from '@together/core'
import { importarLugares } from './api'
import { TIPOS_DE_LUGAR, type TipoDeLugar } from './regras'
import { mensagemDeErro } from '../financeiro/api'

type Props = { viagemId: string; destinos: Tables<'destinos'>[]; moeda: string; aoTerminar: () => void }

// Importar lista do Google Maps (spec 079): o arquivo CSV que o Google Takeout exporta
export default function ImportarDoMaps({ viagemId, destinos, moeda, aoTerminar }: Props) {
  const [lista, setLista] = useState<LugarImportado[] | null>(null)
  const [destino, setDestino] = useState(destinos[0]?.id ?? '')
  const [tipo, setTipo] = useState<TipoDeLugar>('passeio')
  const [erro, setErro] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  async function ler(arquivo: File | undefined) {
    setErro(null)
    if (!arquivo) return
    if (arquivo.size > 2_000_000) return setErro('Arquivo grande demais (máx. 2 MB).')
    const lidos = lerListaDoGoogle(await arquivo.text())
    if (lidos.length === 0) setErro('Não achei lugares nesse arquivo. Ele precisa ter a coluna "Title" (CSV do Google Takeout).')
    setLista(lidos)
  }

  async function importar() {
    if (!lista?.length) return
    setSalvando(true)
    try {
      await importarLugares(viagemId, destino || null, tipo, moeda, lista)
      aoTerminar()
    } catch (e) {
      setErro(mensagemDeErro(e, 'Não deu pra importar.'))
      setSalvando(false)
    }
  }

  return (
    <div className="form">
      <ol className="form-dica importar-passos">
        <li>
          Abra <a href="https://takeout.google.com/" target="_blank" rel="noreferrer noopener">takeout.google.com</a>, desmarque tudo e marque só <strong>Salvos</strong> (Saved).
        </li>
        <li>Baixe o arquivo: cada lista do Maps vem como um CSV.</li>
        <li>Escolha aqui o CSV da lista.</li>
      </ol>
      <input type="file" accept=".csv,text/csv" aria-label="Arquivo CSV da lista" onChange={(e) => ler(e.target.files?.[0])} />
      {lista && lista.length > 0 && (
        <>
          <p>
            <strong>{lista.length}</strong> {lista.length === 1 ? 'lugar' : 'lugares'}: {lista.slice(0, 5).map((l) => l.nome).join(', ')}
            {lista.length > 5 && '…'}
          </p>
          <div className="form-linha">
            <div className="form-campo">
              <label className="form-rotulo" htmlFor="imp-destino">
                Em qual destino
              </label>
              <select id="imp-destino" value={destino} onChange={(e) => setDestino(e.target.value)}>
                <option value="">Sem destino</option>
                {destinos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-campo">
              <label className="form-rotulo" htmlFor="imp-tipo">
                Tipo
              </label>
              <select id="imp-tipo" value={tipo} onChange={(e) => setTipo(e.target.value as TipoDeLugar)}>
                {TIPOS_DE_LUGAR.map((t) => (
                  <option key={t.chave} value={t.chave}>
                    {t.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-rodape">
            <button type="button" className="botao" onClick={importar} disabled={salvando}>
              {salvando ? 'Importando…' : `Importar ${lista.length} ${lista.length === 1 ? 'lugar' : 'lugares'}`}
            </button>
          </div>
        </>
      )}
      {erro && (
        <p className="form-erro" role="alert">
          {erro}
        </p>
      )}
    </div>
  )
}

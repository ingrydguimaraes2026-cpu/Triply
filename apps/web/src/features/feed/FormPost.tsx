import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { gpsDoJpeg, type Tables } from '@together/core'
import { ArquivoInvalido, comprimirFoto } from '../fotos/comprimir'
import { criarPost, MAX_FOTOS_POR_POST } from './api'

type Props = {
  viagemId: string
  destinos: Tables<'destinos'>[]
  destinoInicial: string | null
  membros?: { id: string; nome: string }[] // spec 100: quem dá pra marcar
  aoTerminar: (postId: string) => void
}

type Escolhida = { id: string; blob: Blob; previa: string; ponto: { latitude: number; longitude: number } | null }
type Etapa = { tipo: 'parado' } | { tipo: 'preparando'; feitas: number; total: number } | { tipo: 'enviando'; feitas: number }

// Novo post (spec 014): até 10 fotos, lugar e legenda. As fotos são comprimidas aqui mesmo, antes de enviar.
export default function FormPost({ viagemId, destinos, destinoInicial, membros = [], aoTerminar }: Props) {
  const [fotos, setFotos] = useState<Escolhida[]>([])
  const [destino, setDestino] = useState(destinoInicial ?? '') // lugar é opcional
  const [legenda, setLegenda] = useState('')
  const [marcados, setMarcados] = useState<string[]>([]) // spec 100
  const [noMapa, setNoMapa] = useState(false) // spec 108: desligado por padrão
  const [etapa, setEtapa] = useState<Etapa>({ tipo: 'parado' })
  const [erro, setErro] = useState<string | null>(null)

  // Libera as prévias da memória ao fechar
  const fotosAtuais = useRef(fotos)
  useEffect(() => {
    fotosAtuais.current = fotos
  })
  useEffect(() => () => fotosAtuais.current.forEach((f) => URL.revokeObjectURL(f.previa)), [])

  const cabem = MAX_FOTOS_POR_POST - fotos.length

  async function escolher(lista: FileList | null) {
    if (!lista || lista.length === 0) return
    setErro(null)
    const arquivos = Array.from(lista).slice(0, cabem)
    const novas: Escolhida[] = []
    let ruins = 0
    for (const [i, arquivo] of arquivos.entries()) {
      setEtapa({ tipo: 'preparando', feitas: i, total: arquivos.length })
      try {
        // Spec 108: o GPS sai do original (a compressão apaga o EXIF). Só vai pro banco se marcar.
        const ponto = arquivo.type === 'image/jpeg' ? gpsDoJpeg(new Uint8Array(await arquivo.slice(0, 256 * 1024).arrayBuffer())) : null
        const blob = await comprimirFoto(arquivo)
        novas.push({ id: crypto.randomUUID(), blob, previa: URL.createObjectURL(blob), ponto })
      } catch (e) {
        if (!(e instanceof ArquivoInvalido)) console.error('Erro ao preparar foto:', e)
        ruins++
      }
    }
    setFotos((atuais) => [...atuais, ...novas])
    setEtapa({ tipo: 'parado' })
    if (ruins > 0) setErro(ruins === 1 ? 'Uma das fotos não deu pra abrir e ficou de fora.' : `${ruins} fotos não deu pra abrir e ficaram de fora.`)
    else if (lista.length > arquivos.length) setErro(`Um post tem no máximo ${MAX_FOTOS_POR_POST} fotos. As extras ficaram de fora.`)
  }

  function tirar(id: string) {
    setFotos((atuais) => {
      const saindo = atuais.find((f) => f.id === id)
      if (saindo) URL.revokeObjectURL(saindo.previa)
      return atuais.filter((f) => f.id !== id)
    })
  }

  async function publicar(e: FormEvent) {
    e.preventDefault()
    if (fotos.length === 0) return setErro('Escolha pelo menos uma foto.')
    setErro(null)
    setEtapa({ tipo: 'enviando', feitas: 0 })
    try {
      const id = await criarPost(
        viagemId,
        destino || null,
        legenda,
        fotos.map((f) => f.blob),
        (feitas) => setEtapa({ tipo: 'enviando', feitas }),
        marcados,
        noMapa ? fotos.map((f) => f.ponto) : [],
      )
      aoTerminar(id)
    } catch (erro) {
      console.error('Erro ao publicar:', erro)
      setErro('Não deu pra publicar. Confira a internet e tente de novo.')
      setEtapa({ tipo: 'parado' })
    }
  }

  const ocupado = etapa.tipo !== 'parado'

  return (
    <form className="form" onSubmit={publicar} noValidate>
      {fotos.length > 0 && (
        <ul className="post-novo-fotos" aria-label="Fotos escolhidas">
          {fotos.map((f, i) => (
            <li key={f.id}>
              <img src={f.previa} alt={`Foto ${i + 1}`} />
              {!ocupado && (
                <button type="button" onClick={() => tirar(f.id)} aria-label={`Tirar a foto ${i + 1}`}>
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {cabem > 0 && (
        <label className={fotos.length ? 'foto-escolher pequeno' : 'foto-escolher'}>
          <ImagePlus size={fotos.length ? 22 : 32} aria-hidden="true" />
          <span>
            {etapa.tipo === 'preparando'
              ? `Preparando ${etapa.feitas + 1} de ${etapa.total}…`
              : fotos.length
                ? `Adicionar mais (até ${cabem})`
                : `Escolher fotos (até ${MAX_FOTOS_POR_POST})`}
          </span>
          <input type="file" accept="image/*" multiple className="visualmente-oculto" onChange={(e) => escolher(e.target.files)} disabled={ocupado} />
        </label>
      )}

      <div className="form-campo">
        <label className="form-rotulo" htmlFor="post-destino">
          Onde foi?
        </label>
        <select id="post-destino" value={destino} onChange={(e) => setDestino(e.target.value)} disabled={ocupado}>
          <option value="">Sem lugar</option>
          {destinos.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nome}
            </option>
          ))}
        </select>
      </div>

      {fotos.some((f) => f.ponto) && (
        <label className="post-no-mapa">
          <input type="checkbox" checked={noMapa} onChange={(e) => setNoMapa(e.target.checked)} disabled={ocupado} /> Mostrar pro comboio onde as fotos foram tiradas
        </label>
      )}

      {membros.length > 1 && (
        <fieldset className="form-campo post-marcar">
          <legend className="form-rotulo">Quem está nas fotos? (opcional)</legend>
          <div className="post-marcar-pessoas">
            {membros.map((m) => {
              const sim = marcados.includes(m.id)
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={sim}
                  className={sim ? 'ativo' : undefined}
                  disabled={ocupado}
                  onClick={() => setMarcados(sim ? marcados.filter((x) => x !== m.id) : [...marcados, m.id])}
                >
                  {m.nome.split(' ')[0]}
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      <div className="form-campo">
        <label className="form-rotulo" htmlFor="post-legenda">
          Legenda (opcional)
        </label>
        <textarea
          id="post-legenda"
          rows={3}
          maxLength={2200}
          placeholder="Conta como foi…"
          value={legenda}
          onChange={(e) => setLegenda(e.target.value)}
          disabled={ocupado}
        />
      </div>

      {etapa.tipo === 'enviando' && (
        <>
          <div className="barra-envio" role="progressbar" aria-label="Enviando as fotos">
            <span />
          </div>
          <p className="form-dica">
            Enviando {Math.min(etapa.feitas + 1, fotos.length)} de {fotos.length}…
          </p>
        </>
      )}
      {erro && (
        <p className="form-erro" role="alert">
          {erro}
        </p>
      )}
      <div className="form-rodape">
        <button type="submit" className="botao" disabled={fotos.length === 0 || ocupado}>
          {etapa.tipo === 'enviando' ? 'Publicando…' : 'Publicar'}
        </button>
      </div>
    </form>
  )
}

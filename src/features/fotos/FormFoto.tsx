import { useEffect, useState, type FormEvent } from 'react'
import { ImagePlus } from 'lucide-react'
import type { Tables } from '../../types/database'
import { enviarFoto, LIMITE_POR_DESTINO, LimiteDeFotos } from './api'
import { ArquivoInvalido, comprimirFoto } from './comprimir'

type Props = {
  viagemId: string
  destinos: Tables<'destinos'>[]
  contagem: Record<string, number> // fotos por destino
  destinoInicial: string | null
  aoTerminar: () => void
}

type Etapa = 'escolhendo' | 'comprimindo' | 'enviando'

// Adicionar foto (spec 005): escolher da galeria ou tirar na hora, comprimir e enviar.
export default function FormFoto({ viagemId, destinos, contagem, destinoInicial, aoTerminar }: Props) {
  const livre = (id: string) => (contagem[id] ?? 0) < LIMITE_POR_DESTINO
  const [destino, setDestino] = useState(
    destinoInicial && livre(destinoInicial) ? destinoInicial : (destinos.find((d) => livre(d.id))?.id ?? destinos[0]?.id ?? ''),
  )
  const [legenda, setLegenda] = useState('')
  const [foto, setFoto] = useState<Blob | null>(null)
  const [previa, setPrevia] = useState<string | null>(null)
  const [etapa, setEtapa] = useState<Etapa>('escolhendo')
  const [erro, setErro] = useState<string | null>(null)

  // Libera a prévia da memória quando trocar ou fechar
  useEffect(() => {
    if (!previa) return
    return () => URL.revokeObjectURL(previa)
  }, [previa])

  async function escolher(arquivo: File | undefined) {
    if (!arquivo) return
    setErro(null)
    setEtapa('comprimindo')
    try {
      const comprimida = await comprimirFoto(arquivo)
      setFoto(comprimida)
      setPrevia(URL.createObjectURL(comprimida))
    } catch (erro) {
      setFoto(null)
      setPrevia(null)
      setErro(erro instanceof ArquivoInvalido ? erro.message : 'Não consegui preparar essa foto.')
    } finally {
      setEtapa('escolhendo')
    }
  }

  const nomeDestino = destinos.find((d) => d.id === destino)?.nome ?? ''
  const cheio = destino && !livre(destino)

  async function enviar(e: FormEvent) {
    e.preventDefault()
    if (!foto) return setErro('Escolha uma foto primeiro.')
    if (!destino) return setErro('Escolha o lugar da foto.')
    if (cheio) return
    setErro(null)
    setEtapa('enviando')
    try {
      await enviarFoto(viagemId, destino, legenda, foto)
      aoTerminar()
    } catch (erro) {
      console.error('Erro ao enviar foto:', erro)
      setErro(
        erro instanceof LimiteDeFotos
          ? `${nomeDestino} já tem ${LIMITE_POR_DESTINO} fotos. Apague uma pra adicionar outra.`
          : 'Não deu pra enviar a foto. Confira a internet e tente de novo.',
      )
      setEtapa('escolhendo')
    }
  }

  if (destinos.length === 0) {
    return <p className="form-dica">Adicione destinos no roteiro pra poder postar fotos.</p>
  }

  return (
    <form className="form" onSubmit={enviar} noValidate>
      <label className={previa ? 'foto-escolher com-previa' : 'foto-escolher'}>
        {previa ? (
          <img src={previa} alt="Prévia da foto escolhida" />
        ) : (
          <>
            <ImagePlus size={32} aria-hidden="true" />
            <span>{etapa === 'comprimindo' ? 'Preparando a foto…' : 'Escolher da galeria ou tirar foto'}</span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          className="visualmente-oculto"
          onChange={(e) => escolher(e.target.files?.[0])}
          disabled={etapa !== 'escolhendo'}
        />
      </label>
      {previa && foto && (
        <p className="form-dica">
          Foto comprimida: {Math.round(foto.size / 1024)} KB · toque nela pra trocar
        </p>
      )}

      <div className="form-campo">
        <label className="form-rotulo" htmlFor="foto-destino">
          Onde foi?
        </label>
        <select id="foto-destino" value={destino} onChange={(e) => setDestino(e.target.value)}>
          {destinos.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nome} ({contagem[d.id] ?? 0}/{LIMITE_POR_DESTINO})
            </option>
          ))}
        </select>
      </div>
      {cheio && (
        <p className="form-aviso">
          {nomeDestino} já tem {LIMITE_POR_DESTINO} fotos. Troque uma pra adicionar outra: abra a foto no mural e apague.
        </p>
      )}

      <div className="form-campo">
        <label className="form-rotulo" htmlFor="foto-legenda">
          Legenda (opcional)
        </label>
        <input id="foto-legenda" maxLength={200} placeholder="Ex.: pôr do sol no porto" value={legenda} onChange={(e) => setLegenda(e.target.value)} />
      </div>

      {etapa === 'enviando' && (
        <div className="barra-envio" role="progressbar" aria-label="Enviando a foto">
          <span />
        </div>
      )}
      {erro && (
        <p className="form-erro" role="alert">
          {erro}
        </p>
      )}
      <div className="form-rodape">
        <button type="submit" className="botao" disabled={!foto || Boolean(cheio) || etapa !== 'escolhendo'}>
          {etapa === 'enviando' ? 'Enviando…' : 'Enviar foto'}
        </button>
      </div>
    </form>
  )
}

import { useEffect, useState } from 'react'
import { BellOff, BellRing, Check, Send } from 'lucide-react'
import { lerValor } from '../financeiro/dinheiro'
import { mensagemDeErro } from '../financeiro/api'
import { buscarMeta, desligarAvisos, ehIphone, ligarAvisos, salvarMeta, situacaoDoAviso, testarAviso, type SituacaoAviso } from './avisos'
import { bateuMeta } from './termometro'

type Props = {
  viagemId: string
  meuId: string
  moeda: string
  comercial: number // cotação comercial de agora
  comImposto: number // a mesma, já com IOF
  sugestao: number // pro placeholder (ex.: menor dos 90 dias com IOF)
}

const reais = (valor: number) => `R$ ${valor.toFixed(2).replace('.', ',')}`
const campo = (valor: number) => valor.toFixed(2).replace('.', ',')

// Meta de compra (salva no banco) + aviso no celular quando bater (spec 013)
export default function AvisoDeMeta({ viagemId, meuId, moeda, comercial, comImposto, sugestao }: Props) {
  const [metaTexto, setMetaTexto] = useState('')
  const [metaSalva, setMetaSalva] = useState<number | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [situacao, setSituacao] = useState<SituacaoAviso | null>(null)
  const [recado, setRecado] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    buscarMeta(viagemId, moeda)
      .then((m) => {
        if (!ativo || m === null) return
        setMetaSalva(m)
        setMetaTexto(campo(m))
      })
      .catch((e) => console.error('Erro ao buscar a meta:', e))
    situacaoDoAviso().then((s) => ativo && setSituacao(s))
    return () => {
      ativo = false
    }
  }, [viagemId, moeda])

  const metaDigitada = lerValor(metaTexto)
  const mudou = (metaDigitada ? metaDigitada / 100 : null) !== metaSalva
  const bateu = bateuMeta(metaSalva, comercial)

  async function guardar() {
    setErro(null)
    setRecado(null)
    if (metaTexto.trim() && !metaDigitada) return setErro('Valor inválido. Ex.: 5,85')
    setSalvando(true)
    try {
      const nova = metaDigitada ? metaDigitada / 100 : null
      await salvarMeta(viagemId, meuId, moeda, nova)
      setMetaSalva(nova)
      setRecado(nova ? 'Meta salva.' : 'Meta apagada.')
    } catch (e) {
      setErro(mensagemDeErro(e, 'Não deu pra salvar a meta.'))
    } finally {
      setSalvando(false)
    }
  }

  async function ligar() {
    setErro(null)
    setRecado(null)
    try {
      await ligarAvisos()
      setSituacao('ligado')
      setRecado('Avisos ligados neste aparelho. Toque em "Testar" pra ver como chega.')
    } catch (e) {
      const motivo = (e as Error).message
      if (motivo === 'negado') setSituacao('negado')
      else if (motivo === 'sem-app') setSituacao('sem-app')
      else setErro(mensagemDeErro(e, 'Não deu pra ligar os avisos.'))
    }
  }

  async function desligar() {
    setErro(null)
    await desligarAvisos().catch((e) => console.error(e))
    setSituacao('desligado')
    setRecado('Avisos desligados neste aparelho.')
  }

  async function testar() {
    setErro(null)
    setRecado(null)
    try {
      const n = await testarAviso()
      setRecado(n > 0 ? 'Notificação de teste enviada.' : 'Nenhum aparelho com aviso ligado.')
    } catch (e) {
      setErro(mensagemDeErro(e, 'O teste não foi. A função de avisos já está publicada no Supabase?'))
    }
  }

  return (
    <div className={bateu ? 'termometro-meta bateu' : 'termometro-meta'}>
      <div className="form-campo">
        <label className="form-rotulo" htmlFor="termo-meta">
          <BellRing size={14} aria-hidden="true" /> Minha meta: comprar com 1 {moeda} até (já com IOF)
        </label>
        <div className="termometro-meta-linha">
          <input
            id="termo-meta"
            inputMode="decimal"
            placeholder={`ex.: ${campo(sugestao)}`}
            value={metaTexto}
            onChange={(e) => setMetaTexto(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && mudou && guardar()}
          />
          <button type="button" className="botao pequeno" onClick={guardar} disabled={!mudou || salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>

      {metaSalva !== null && (
        <p role="status">
          {bateu
            ? `Bateu a meta: hoje sai ${reais(comImposto)} com IOF. Bom momento pra comprar!`
            : `Ainda não: hoje sai ${reais(comImposto)} com IOF. Faltam ${reais(comImposto - metaSalva)}.`}
        </p>
      )}

      {/* Aviso no celular */}
      <div className="termometro-aviso">
        {situacao === 'ligado' ? (
          <>
            <p>
              <Check size={14} aria-hidden="true" /> Este aparelho recebe aviso quando bater a meta (checagem a cada 30 min).
            </p>
            <div className="termometro-aviso-botoes">
              <button type="button" className="botao secundario pequeno" onClick={testar}>
                <Send size={14} aria-hidden="true" /> Testar
              </button>
              <button type="button" className="botao-texto" onClick={desligar}>
                <BellOff size={14} aria-hidden="true" /> Desligar
              </button>
            </div>
          </>
        ) : situacao === 'desligado' ? (
          <button type="button" className="botao pequeno" onClick={ligar} disabled={metaSalva === null}>
            <BellRing size={14} aria-hidden="true" /> {metaSalva === null ? 'Salve uma meta pra ligar o aviso' : 'Avisar no celular quando bater'}
          </button>
        ) : situacao === 'iphone-instalar' ? (
          <p>
            No iPhone, o aviso só funciona com o app instalado: no Safari, toque em Compartilhar → "Adicionar à Tela de Início" e abra o Together por lá.
          </p>
        ) : situacao === 'negado' ? (
          <p>
            As notificações estão bloqueadas pra este site. Libere nas configurações do {ehIphone() ? 'iPhone' : 'navegador'} e volte aqui.
          </p>
        ) : situacao === 'sem-app' ? (
          <p>O aviso no celular funciona no app publicado (ou instalado). Aqui, no modo de desenvolvimento, ele não liga.</p>
        ) : situacao === 'sem-suporte' ? (
          <p>Este navegador não recebe notificações. Tente pelo Chrome ou com o app instalado.</p>
        ) : null}
      </div>

      {recado && <p className="termometro-recado">{recado}</p>}
      {erro && (
        <p className="form-erro" role="alert">
          {erro}
        </p>
      )}
    </div>
  )
}

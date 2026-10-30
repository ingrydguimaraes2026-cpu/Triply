import { useState, type FormEvent } from 'react'
import { Settings, ShieldCheck, Trash2 } from 'lucide-react'
import { useViagemAtual } from '../../features/viagens/hooks'
import { editarViagem } from '../../features/viagens/api'
import ApagarViagem from '../../features/viagens/ApagarViagem'
import { moedasDaViagem } from '../../features/financeiro/categorias'
import CabecalhoPagina from '../../components/ui/CabecalhoPagina'
import Cartao from '../../components/ui/Cartao'
import EstadoVazio from '../../components/ui/EstadoVazio'
import './abas.css'

const PERMISSOES = [
  { campo: 'membro_edita_roteiro', nome: 'Roteiro', explica: 'Destinos, ordem e datas' },
  { campo: 'membro_edita_transportes', nome: 'Transportes', explica: 'Criar e editar trajetos' },
  { campo: 'membro_edita_orcamento', nome: 'Orçamento', explica: 'Quanto gastar por categoria' },
] as const

// Configurações da viagem (spec 008): nome, datas, moeda e apagar. Só o ADM.
export default function Configuracoes() {
  const { viagem, euSouAdm, atualizarViagem } = useViagemAtual()
  const [erroPermissao, setErroPermissao] = useState<string | null>(null)

  async function mudarPermissao(campo: (typeof PERMISSOES)[number]['campo'], ligado: boolean) {
    setErroPermissao(null)
    try {
      atualizarViagem(await editarViagem(viagem.id, { [campo]: ligado }))
    } catch {
      setErroPermissao('Não deu pra salvar.')
    }
  }
  const [nome, setNome] = useState(viagem.nome)
  const [inicio, setInicio] = useState(viagem.data_inicio ?? '')
  const [fim, setFim] = useState(viagem.data_fim ?? '')
  const [moeda, setMoeda] = useState(viagem.moeda_principal)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)

  if (!euSouAdm) {
    return (
      <EstadoVazio icone={Settings} titulo="Só quem organiza a viagem mexe aqui" texto="Peça pro ADM do comboio mudar o nome, as datas ou a moeda." />
    )
  }

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim()) return setMensagem({ tipo: 'erro', texto: 'A viagem precisa de um nome.' })
    if (inicio && fim && fim < inicio) return setMensagem({ tipo: 'erro', texto: 'A volta está antes da ida.' })
    setSalvando(true)
    setMensagem(null)
    try {
      atualizarViagem(
        await editarViagem(viagem.id, { nome: nome.trim(), data_inicio: inicio || null, data_fim: fim || null, moeda_principal: moeda }),
      )
      setMensagem({ tipo: 'ok', texto: 'Salvo.' })
    } catch (erro) {
      console.error('Erro ao salvar viagem:', erro)
      setMensagem({ tipo: 'erro', texto: 'Não deu pra salvar. Tente de novo.' })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <>
      <CabecalhoPagina titulo="Configurações" subtitulo="Nome, datas e moeda da viagem. Só o ADM vê esta página." />

      <Cartao titulo="Viagem" icone={Settings}>
        <form className="form" onSubmit={salvar} noValidate>
          <div className="form-campo">
            <label className="form-rotulo" htmlFor="config-nome">
              Nome da viagem
            </label>
            <input id="config-nome" maxLength={120} value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>
          <div className="form-linha">
            <div className="form-campo">
              <label className="form-rotulo" htmlFor="config-ida">
                Ida
              </label>
              <input id="config-ida" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} />
            </div>
            <div className="form-campo">
              <label className="form-rotulo" htmlFor="config-volta">
                Volta
              </label>
              <input id="config-volta" type="date" min={inicio || undefined} value={fim} onChange={(e) => setFim(e.target.value)} />
            </div>
          </div>
          <div className="form-campo">
            <label className="form-rotulo" htmlFor="config-moeda">
              Moeda principal dos gastos
            </label>
            <select id="config-moeda" value={moeda} onChange={(e) => setMoeda(e.target.value)}>
              {moedasDaViagem(viagem.moeda_principal).map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </div>
          {moeda !== viagem.moeda_principal && (
            <p className="form-aviso">
              Os gastos já lançados continuam na moeda em que foram lançados. Muda só a moeda dos totais e do orçamento.
            </p>
          )}
          {mensagem && (
            <p role="status" className={mensagem.tipo === 'ok' ? 'form-aviso' : 'form-erro'}>
              {mensagem.texto}
            </p>
          )}
          <div className="form-rodape">
            <button type="submit" className="botao" disabled={salvando}>
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </form>
      </Cartao>

      {/* Spec 078: o que o comboio também pode editar */}
      <Cartao titulo="O que o comboio pode editar" icone={ShieldCheck}>
        <p className="form-dica">Desligado = só quem é ADM edita. Ver e comentar continua liberado pra todo mundo.</p>
        {PERMISSOES.map((p) => (
          <label key={p.campo} className="interruptor">
            <span>
              <strong>{p.nome}</strong>
              <small>{p.explica}</small>
            </span>
            <input type="checkbox" checked={viagem[p.campo]} onChange={(e) => mudarPermissao(p.campo, e.target.checked)} />
          </label>
        ))}
        {erroPermissao && <p className="form-erro">{erroPermissao}</p>}
      </Cartao>

      <Cartao titulo="Apagar a viagem" icone={Trash2}>
        <ApagarViagem id={viagem.id} nome={viagem.nome} />
      </Cartao>
    </>
  )
}

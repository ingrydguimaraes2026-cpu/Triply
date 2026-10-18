import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react'
import { buscarCidades, type Cidade } from './buscarCidades'
import { useBuscaDeLugares } from './useBuscaDeLugares'
import { contarVinculos, type ItemRoteiro, type Vinculos } from './api'
import { datasForaDeOrdem, mover } from './ordem'
import './editor-roteiro.css'

type Props = {
  itens: ItemRoteiro[] // o rascunho (a mesma lista que o mapa está mostrando)
  aoMudar: (itens: ItemRoteiro[]) => void
  aoSalvar: () => void
  aoCancelar: () => void
  salvando: boolean
  erro: string | null
  acaoDoErro?: { rotulo: string; aoClicar: () => void } // ex.: "Recarregar roteiro" depois de um conflito
  abrirBusca?: boolean // já abre com o campo de busca aberto ("+ Adicionar lugar")
  // Dá pra trocar nos testes; no site usa as funções de verdade
  buscar?: typeof buscarCidades
  contar?: (destinoId: string) => Promise<Vinculos>
}

type Confirmacao =
  | { chave: string; status: 'verificando' }
  | { chave: string; status: 'pronta'; vinculos: Vinculos }
  | { chave: string; status: 'erro' }

// "2 trajetos e 1 foto"
function descreverVinculos({ trajetos, fotos }: Vinculos) {
  const partes = [
    trajetos > 0 && `${trajetos} ${trajetos === 1 ? 'trajeto' : 'trajetos'}`,
    fotos > 0 && `${fotos} ${fotos === 1 ? 'foto' : 'fotos'}`,
  ].filter(Boolean)
  return partes.join(' e ')
}

// Lista do roteiro em modo de edição: buscar e adicionar, mudar a ordem, remover.
// Nada vai pro banco até clicar em "Salvar alterações".
export default function EditorRoteiro({
  itens,
  aoMudar,
  aoSalvar,
  aoCancelar,
  salvando,
  erro,
  acaoDoErro,
  abrirBusca = false,
  buscar = buscarCidades,
  contar = contarVinculos,
}: Props) {
  const [buscaAberta, setBuscaAberta] = useState(abrirBusca)
  const [busca, setBusca] = useState('')
  const [confirmacao, setConfirmacao] = useState<Confirmacao | null>(null)
  const [aviso, setAviso] = useState('') // lido pelo leitor de tela
  const campoRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (buscaAberta) campoRef.current?.focus()
  }, [buscaAberta])

  // Mesma busca da criação da viagem
  const {
    sugestoes,
    buscando,
    valida: buscaValida,
    escolherComEnter,
  } = useBuscaDeLugares(busca, (cidade) => adicionar(cidade), buscar)

  function adicionar(cidade: Cidade) {
    const chave = `novo-${cidade.id}`
    // Mesmo lugar duas vezes seguidas não faz sentido; em pontos diferentes do roteiro pode (ida e volta)
    if (itens.at(-1)?.chave === chave) return
    const repetido = itens.some((item) => item.chave === chave)
    aoMudar([
      ...itens,
      {
        chave: repetido ? `${chave}-${Date.now()}` : chave,
        nome: cidade.nome,
        pais: cidade.pais || null,
        latitude: cidade.latitude,
        longitude: cidade.longitude,
      },
    ])
    setBusca('')
    setAviso(`${cidade.nome} adicionado na posição ${itens.length + 1}`)
    campoRef.current?.focus()
  }

  function moverItem(indice: number, direcao: -1 | 1) {
    aoMudar(mover(itens, indice, direcao))
    setAviso(`${itens[indice].nome} agora está na posição ${indice + direcao + 1}`)
  }

  // Antes de remover, confere no banco se há trajetos ou fotos ligados
  async function pedirRemocao(item: ItemRoteiro) {
    if (!item.id) {
      setConfirmacao({ chave: item.chave, status: 'pronta', vinculos: { trajetos: 0, fotos: 0 } })
      return
    }
    setConfirmacao({ chave: item.chave, status: 'verificando' })
    try {
      const vinculos = await contar(item.id)
      setConfirmacao((atual) => (atual?.chave === item.chave ? { chave: item.chave, status: 'pronta', vinculos } : atual))
    } catch {
      setConfirmacao((atual) => (atual?.chave === item.chave ? { chave: item.chave, status: 'erro' } : atual))
    }
  }

  function remover(item: ItemRoteiro) {
    aoMudar(itens.filter((i) => i.chave !== item.chave))
    setConfirmacao(null)
    setAviso(`${item.nome} removido do roteiro`)
  }

  const vazio = itens.length === 0
  const avisoDatas = datasForaDeOrdem(itens)

  return (
    <div className="editor-roteiro">
      <p className="visualmente-oculto" aria-live="polite">
        {aviso}
      </p>

      {itens.length > 1 && <p className="editor-dica">Use ↑ e ↓ para mudar a ordem</p>}

      {vazio ? (
        <p className="editor-vazio">O roteiro está vazio. Adicione pelo menos um lugar para salvar.</p>
      ) : (
        <ol className="roteiro-lista editor-lista">
          {itens.map((item, i) => {
            const confirmando = confirmacao?.chave === item.chave ? confirmacao : null
            return (
              <li key={item.chave} className={confirmando ? 'confirmando' : undefined}>
                <div className="editor-linha">
                  <span className="roteiro-numero">{i + 1}</span>
                  <span className="roteiro-nome">
                    <strong>{item.nome}</strong>
                    <small>
                      {item.pais}
                      {!item.id && <span className="editor-selo">novo</span>}
                    </small>
                  </span>
                  <span className="editor-acoes">
                    <button
                      type="button"
                      onClick={() => moverItem(i, -1)}
                      disabled={i === 0 || salvando}
                      aria-label={`Subir ${item.nome}`}
                    >
                      <ArrowUp size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moverItem(i, 1)}
                      disabled={i === itens.length - 1 || salvando}
                      aria-label={`Descer ${item.nome}`}
                    >
                      <ArrowDown size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => pedirRemocao(item)}
                      disabled={salvando}
                      aria-label={`Remover ${item.nome}`}
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  </span>
                </div>

                {confirmando && (
                  <div className="editor-confirmacao" role="alertdialog" aria-label={`Remover ${item.nome}?`}>
                    {confirmando.status === 'verificando' && <p>Verificando o que está ligado a {item.nome}…</p>}
                    {confirmando.status === 'erro' && (
                      <>
                        <p>Não consegui verificar se há trajetos ou fotos ligados a {item.nome}. Tente de novo.</p>
                        <div className="editor-confirmacao-botoes">
                          <button type="button" className="botao secundario" onClick={() => setConfirmacao(null)}>
                            Manter
                          </button>
                          <button type="button" className="botao" onClick={() => pedirRemocao(item)}>
                            Tentar de novo
                          </button>
                        </div>
                      </>
                    )}
                    {confirmando.status === 'pronta' && (
                      <>
                        <p>
                          <strong>Remover {item.nome} do roteiro?</strong>
                        </p>
                        {descreverVinculos(confirmando.vinculos) ? (
                          <p>
                            {item.nome} tem {descreverVinculos(confirmando.vinculos)}. Eles <strong>não serão apagados</strong>,
                            mas vão ficar sem esse lugar.
                          </p>
                        ) : null}
                        {item.id && <p className="editor-nota">A remoção só vale quando você salvar.</p>}
                        <div className="editor-confirmacao-botoes">
                          <button type="button" className="botao secundario" onClick={() => setConfirmacao(null)}>
                            Manter
                          </button>
                          <button type="button" className="botao" onClick={() => remover(item)}>
                            Remover
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      )}

      {avisoDatas && (
        <p className="editor-aviso">
          Atenção: a nova ordem não bate com as datas de chegada dos destinos. As datas não serão mudadas.
        </p>
      )}

      {/* Buscar e adicionar */}
      {buscaAberta ? (
        <div className="editor-busca">
          <label htmlFor="editor-busca" className="editor-rotulo">
            Buscar cidade, país ou lugar
          </label>
          <input
            ref={campoRef}
            id="editor-busca"
            type="search"
            autoComplete="off"
            placeholder="Ex.: Milão, Portugal, Lago de Como"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                escolherComEnter()
              }
              if (e.key === 'Escape') setBuscaAberta(false)
            }}
            aria-controls="editor-sugestoes"
            disabled={salvando}
          />
          {buscaValida && (sugestoes.length > 0 || buscando) && (
            <ul id="editor-sugestoes" className="editor-sugestoes">
              {buscando && sugestoes.length === 0 && <li className="editor-sugestao-info">Buscando…</li>}
              {sugestoes.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => adicionar(c)}>
                    <span className="editor-codigo">{c.codigoPais}</span>
                    <span>
                      <strong>{c.nome}</strong>
                      <small>{[c.tipo, [c.regiao, c.pais].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}</small>
                    </span>
                  </button>
                </li>
              ))}
              {buscando && sugestoes.length > 0 && <li className="editor-sugestao-info">Buscando mais lugares…</li>}
            </ul>
          )}
        </div>
      ) : (
        <button type="button" className="editor-adicionar" onClick={() => setBuscaAberta(true)} disabled={salvando}>
          <Plus size={16} aria-hidden="true" /> Adicionar lugar
        </button>
      )}

      {erro && (
        <div role="alert" className="aviso-erro editor-erro">
          <p>{erro}</p>
          {acaoDoErro && (
            <button type="button" className="botao secundario" onClick={acaoDoErro.aoClicar}>
              {acaoDoErro.rotulo}
            </button>
          )}
        </div>
      )}

      <div className="editor-rodape">
        <button type="button" className="botao secundario" onClick={aoCancelar} disabled={salvando}>
          Cancelar
        </button>
        <button type="button" className="botao" onClick={aoSalvar} disabled={vazio || salvando}>
          {salvando ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </div>
    </div>
  )
}

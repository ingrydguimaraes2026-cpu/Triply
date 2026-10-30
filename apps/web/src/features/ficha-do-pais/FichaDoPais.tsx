import { useState } from 'react'
import { Car, Coins, Languages, Plug, Wifi, Zap } from 'lucide-react'
import { avisoDeVoltagem, criarTarefa, fichaDoPais, precisaAdaptador, prazoDoEsim, type Tables } from '@together/core'
import { supabase } from '../../lib/supabase'
import { codigoDoPais, nomeDoPais } from '../documentos/paises'
import { moedaDoPais } from '../destinos/buscarCidades'
import './ficha-do-pais.css'

type Props = { viagem: Pick<Tables<'viagens'>, 'id' | 'data_inicio'>; destinos: Tables<'destinos'>[] }

const ADAPTADOR = {
  nao: 'O plugue do Brasil entra direto.',
  so_tres_pinos: 'Plugue redondinho de 2 pinos (tipo C) entra; o de 3 pinos do Brasil precisa de adaptador.',
  sim: 'Precisa de adaptador pro plugue do Brasil.',
}

// Ficha do país (spec 047): o básico de cada país do roteiro + lembrete do eSIM (I12)
export default function FichaDoPais({ viagem, destinos }: Props) {
  const paises = [...new Set(destinos.map((d) => codigoDoPais(d.pais)).filter((c): c is string => !!c && c !== 'BR'))]
  const [escolhido, setEscolhido] = useState<string | null>(null)
  const [recadoEsim, setRecadoEsim] = useState<string | null>(null)
  if (paises.length === 0) return <p className="resumo-vazio">Com um destino fora do Brasil, aparece aqui o básico do país: tomada, gorjeta, idioma e internet.</p>

  const pais = escolhido && paises.includes(escolhido) ? escolhido : paises[0]
  const ficha = fichaDoPais(pais)
  const algumUE = paises.some((p) => fichaDoPais(p)?.roamingUE)

  async function tarefaEsim() {
    setRecadoEsim(null)
    try {
      await criarTarefa(supabase, viagem.id, { titulo: 'Comprar e instalar o eSIM (internet) antes de embarcar', prazo: prazoDoEsim(viagem.data_inicio) })
      setRecadoEsim('Tarefa criada no checklist da viagem.')
    } catch {
      setRecadoEsim('Não deu pra criar a tarefa.')
    }
  }

  return (
    <div className="ficha-pais">
      {paises.length > 1 && (
        <div className="ficha-pais-abas" role="tablist">
          {paises.map((p) => (
            <button key={p} type="button" role="tab" aria-selected={p === pais} onClick={() => setEscolhido(p)}>
              {nomeDoPais(p)}
            </button>
          ))}
        </div>
      )}
      {!ficha ? (
        <p className="dica">Ainda não temos a ficha de {nomeDoPais(pais)}. Moeda: {moedaDoPais(pais)}.</p>
      ) : (
        <dl>
          <div>
            <dt>
              <Languages size={15} aria-hidden="true" /> Idioma
            </dt>
            <dd>{ficha.idioma}</dd>
          </div>
          <div>
            <dt>
              <Coins size={15} aria-hidden="true" /> Moeda e gorjeta
            </dt>
            <dd>
              {moedaDoPais(pais)} · {ficha.gorjeta}
            </dd>
          </div>
          <div>
            <dt>
              <Plug size={15} aria-hidden="true" /> Tomada
            </dt>
            <dd>
              Tipo {ficha.tomadas.join(', ')}. {ADAPTADOR[precisaAdaptador(ficha)]}
            </dd>
          </div>
          <div>
            <dt>
              <Zap size={15} aria-hidden="true" /> Voltagem
            </dt>
            <dd>{avisoDeVoltagem(ficha.volts)}</dd>
          </div>
          {ficha.maoInglesa && (
            <div>
              <dt>
                <Car size={15} aria-hidden="true" /> Trânsito
              </dt>
              <dd>Mão inglesa: os carros andam do lado esquerdo. Olhe pra direita antes de atravessar.</dd>
            </div>
          )}
        </dl>
      )}

      {/* I12: internet no destino (ideia do Holafly, docs/ideias-de-outros-apps.md) */}
      <div className="ficha-pais-internet">
        <p>
          <Wifi size={15} aria-hidden="true" /> <strong>Internet:</strong> compre um eSIM (chip virtual) antes de embarcar e chegue com internet.
          {algumUE && ' Na União Europeia, um eSIM europeu vale em todos os países sem roaming extra.'}
        </p>
        <button type="button" className="botao secundario pequeno" onClick={tarefaEsim}>
          Criar tarefa "comprar eSIM"
        </button>
        {recadoEsim && <small role="status">{recadoEsim}</small>}
      </div>
    </div>
  )
}

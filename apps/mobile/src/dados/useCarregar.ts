import { useCallback, useEffect, useRef, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import { supabase } from '../lib/supabase'

// Carrega algo do banco e devolve { status, dados, recarregar, atualizando }. Ignora a resposta
// se a tela já mudou de assunto (evita piscar dado velho).
// `recarregar` busca de novo sem apagar o que está na tela; `atualizando` fica true enquanto isso
// (é o que a bolinha do "puxar pra atualizar" usa).
//
// Guarda a última resposta na memória (por tela + parâmetros): voltar pra uma tela já vista
// mostra na hora o que ela tinha e atualiza por trás, sem "Carregando…" toda vez.
//
// Voltar pra tela (fechou outra por cima, trocou de aba) busca de novo em silêncio: sem bolinha
// de "puxar pra atualizar" e sem trocar a tela por erro se a rede falhar. Antes, a aba Viagem e o
// Hoje mostravam o hotel como não escolhido até puxar a tela (Android 17/11).
export type Carga<T> = { recarregar: () => void; atualizando: boolean } & (
  | { status: 'carregando' }
  | { status: 'erro' }
  | { status: 'pronto'; dados: T }
)

const guardado = new Map<string, unknown>()
const LIMITE = 60 // respostas guardadas; a mais antiga sai primeiro

// A chave é o `nome` dado pela tela + os parâmetros. Sem nome, usa o texto da função, mas só
// quando ele existe de verdade: no celular (Hermes) toda função vira "[bytecode]" e duas telas
// diferentes ficariam com a mesma chave (uma mostraria os dados da outra). Aí não guarda.
function chaveDe(buscar: (() => unknown) | null, deps: unknown[], nome?: string): string | null {
  if (!buscar) return null
  try {
    const texto = nome ?? buscar.toString()
    if (!nome && /\[(bytecode|native code)\]/.test(texto)) return null
    return `${texto}|${JSON.stringify(deps)}`
  } catch {
    return null // parâmetro que não vira texto: não guarda
  }
}

function guardar(chave: string, dados: unknown) {
  guardado.delete(chave)
  guardado.set(chave, dados)
  if (guardado.size > LIMITE) guardado.delete(guardado.keys().next().value as string)
}

// Trocou de conta (saiu, ou entrou outra): ninguém pode ver o que era da conta anterior
let ultimoUsuario: string | null | undefined
supabase.auth.onAuthStateChange((_evento, sessao) => {
  const usuario = sessao?.user.id ?? null
  if (ultimoUsuario !== undefined && usuario !== ultimoUsuario) guardado.clear()
  ultimoUsuario = usuario
})

// Reteste final (17/11): depois de "Salvar gasto", Contas mostrava a cópia guardada ("Nenhum gasto
// ainda") e o gasto só aparecia ~10 s depois, com a busca silenciosa. Quem acabou de mudar algo
// marca a tela como velha; ao voltar, ela mostra a cópia com a bolinha de "atualizando" até chegar
// o dado novo. As outras telas seguem silenciosas.
const velhos = new Map<string, number>() // nome → quando foi marcado
export function marcarVelho(...nomes: string[]) {
  nomes.forEach((n) => velhos.set(n, Date.now()))
}

// `nome`: identifica o que a tela busca (ex.: 'aba-contas'). Dê um nome nas telas que precisam
// abrir na hora ao voltar: é o que garante a memória também no celular.
export function useCarregar<T>(buscar: (() => Promise<T>) | null, deps: unknown[], nome?: string): Carga<T> {
  const chave = chaveDe(buscar, deps, nome)
  const [estado, setEstado] = useState<{ status: 'carregando' } | { status: 'erro' } | { status: 'pronto'; dados: T }>(() =>
    chave && guardado.has(chave) ? { status: 'pronto', dados: guardado.get(chave) as T } : { status: 'carregando' },
  )
  // Abriu com uma cópia marcada como velha: a 1ª busca já conta como "atualizando"
  const [vez, setVez] = useState(() => (nome && velhos.has(nome) && chave && guardado.has(chave) ? 1 : 0))
  const [vezPronta, setVezPronta] = useState(0)
  const recarregar = useCallback(() => setVez((v) => v + 1), [])

  // Ao voltar pra tela (não na primeira vez que ela abre, que já busca sozinha)
  const [vezDoFoco, setVezDoFoco] = useState(0)
  const jaFocou = useRef(false)
  const peloFoco = useRef(false)
  useFocusEffect(
    useCallback(() => {
      if (!jaFocou.current) {
        jaFocou.current = true
        return
      }
      // Marcada como velha: busca mostrando que está atualizando (não silenciosa)
      if (nome && velhos.has(nome)) return setVez((v) => v + 1)
      peloFoco.current = true
      setVezDoFoco((v) => v + 1)
    }, [nome]),
  )

  useEffect(() => {
    if (!buscar) return
    let vivo = true
    const silenciosa = peloFoco.current
    peloFoco.current = false
    const comecou = Date.now()
    // Parâmetro mudou: mostra o que já tinha desse novo assunto (ou "carregando")
    if (chave && guardado.has(chave)) setEstado({ status: 'pronto', dados: guardado.get(chave) as T })
    buscar()
      .then((dados) => {
        if (chave) guardar(chave, dados)
        // A cópia agora é a nova (só se a busca começou depois de marcar; uma busca antiga traz o velho)
        if (nome && (velhos.get(nome) ?? Infinity) <= comecou) velhos.delete(nome)
        if (vivo) setEstado({ status: 'pronto', dados })
      })
      .catch(() => {
        // Com algo guardado (ou já na tela, se foi a busca da volta), um erro de rede não apaga a tela
        if (vivo && !(chave && guardado.has(chave))) setEstado((s) => (silenciosa && s.status === 'pronto' ? s : { status: 'erro' }))
      })
      .finally(() => vivo && setVezPronta(vez))
    return () => {
      vivo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, vez, vezDoFoco])

  return { ...estado, recarregar, atualizando: vezPronta < vez }
}

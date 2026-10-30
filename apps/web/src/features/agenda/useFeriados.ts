import { useEffect, useMemo, useState } from 'react'
import { consultasDeFeriados, feriadosNaViagem, urlDosFeriados, type Feriado, type FeriadoDaApi, type Tables } from '@together/core'
import { codigoDoPais } from '../documentos/paises'

// Feriados nas datas da viagem (spec 095). Busca no Nager.Date uma vez por (ano, país) e guarda
// enquanto a página está aberta. Falhou? Fica sem feriados (não atrapalha a agenda).
const memoria = new Map<string, Promise<FeriadoDaApi[]>>()

function buscar(ano: number, codigo: string): Promise<FeriadoDaApi[]> {
  const chave = `${ano}|${codigo}`
  if (!memoria.has(chave)) {
    memoria.set(
      chave,
      fetch(urlDosFeriados(ano, codigo))
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
    )
  }
  return memoria.get(chave)!
}

export function useFeriados(destinos: Tables<'destinos'>[]): Feriado[] {
  const comCodigo = useMemo(
    () => destinos.map((d) => ({ nome: d.nome, codigo: codigoDoPais(d.pais), chegada: d.chegada, saida: d.saida })),
    [destinos],
  )
  const [feriados, setFeriados] = useState<Feriado[]>([])
  useEffect(() => {
    let ativo = true
    Promise.all(consultasDeFeriados(comCodigo).map((c) => buscar(c.ano, c.codigo))).then((listas) => {
      if (ativo) setFeriados(feriadosNaViagem(listas.flat(), comCodigo))
    })
    return () => {
      ativo = false
    }
  }, [comCodigo])
  return feriados
}

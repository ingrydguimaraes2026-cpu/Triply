// Álbum por dia e destino (spec 098, K2) e melhores fotos (K3). Puro, pra dar pra testar.

type PostBase = { id: string; criado_em: string; destino_id: string | null; curtidas: unknown[]; comentarios: unknown[] }

// "2026-11-20T18:30:00Z" → dia no fuso do aparelho (mesma regra da agenda)
function diaDe(horario: string): string {
  const d = new Date(horario)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Grupos por dia (na ordem da viagem). O destino do grupo é o do post (ou, se não tem, o do dia).
export function albumPorDia<P extends PostBase>(
  posts: P[],
  destinos: { id: string; nome: string; chegada: string | null; saida: string | null }[],
): { dia: string; destino: string | null; posts: P[] }[] {
  const grupos = new Map<string, P[]>()
  for (const p of [...posts].sort((a, b) => a.criado_em.localeCompare(b.criado_em))) {
    const dia = diaDe(p.criado_em)
    grupos.set(dia, [...(grupos.get(dia) ?? []), p])
  }
  return [...grupos.entries()].map(([dia, lista]) => {
    const doPost = lista.map((p) => destinos.find((d) => d.id === p.destino_id)?.nome).find(Boolean)
    const doDia = destinos.filter((d) => d.chegada && d.chegada <= dia && (d.saida ?? d.chegada) >= dia).pop()?.nome
    return { dia, destino: doPost ?? doDia ?? null, posts: lista }
  })
}

// Melhores: mais curtidas, depois mais comentários, depois o mais novo. Só quem tem curtida.
export function melhoresPosts<P extends PostBase>(posts: P[], quantos = 9): P[] {
  return posts
    .filter((p) => p.curtidas.length > 0)
    .sort((a, b) => b.curtidas.length - a.curtidas.length || b.comentarios.length - a.comentarios.length || b.criado_em.localeCompare(a.criado_em))
    .slice(0, quantos)
}

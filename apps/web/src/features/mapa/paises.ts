import { feature } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { Feature, Geometry } from 'geojson'
import mundoUrl from 'world-atlas/countries-50m.json?url'

export type Pais = Feature<Geometry>

// Carrega o desenho dos países uma vez só
let paisesEmCache: Promise<Pais[]> | null = null
export function carregarPaises() {
  paisesEmCache ??= fetch(mundoUrl)
    .then((r) => r.json())
    .then((topo: Topology) => {
      const colecao = feature(topo, topo.objects.countries as GeometryCollection)
      // Tira a Antártida pra sobrar mais espaço
      return colecao.features.filter((p) => p.id !== '010') as Pais[]
    })
  return paisesEmCache
}

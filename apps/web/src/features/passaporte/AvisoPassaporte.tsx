import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { AlertTriangle, BookUser, Check } from 'lucide-react'
import { buscarAlertasDePassaporte, buscarMeusDocumentos, situacaoDoPassaporte, temPassaporteEuropeu, type MeusDocumentos } from '@together/core'
import { supabase } from '../../lib/supabase'
import { hojeTexto } from '../destinos/datas'
import type { Membro } from '../viagens/hooks'

type Props = { viagemId: string; meuId: string; volta: string | null; membros: Membro[]; euSouAdm: boolean; temSchengen: boolean }

// Aviso do passaporte (spec 038) no topo do checklist de documentos:
// o meu (com a data, só eu vejo) e, pro ADM, quem do comboio precisa olhar o dele (sem a data).
export default function AvisoPassaporte({ viagemId, meuId, volta, membros, euSouAdm, temSchengen }: Props) {
  const [meus, setMeus] = useState<MeusDocumentos | null>(null)
  const [outros, setOutros] = useState<{ usuarioId: string; situacao: 'vence' | 'sem_data' }[]>([])

  useEffect(() => {
    let ativo = true
    buscarMeusDocumentos(supabase)
      .then((d) => ativo && setMeus(d))
      .catch((e) => console.error('Erro ao buscar o passaporte:', e))
    if (euSouAdm) {
      buscarAlertasDePassaporte(supabase, viagemId)
        .then((a) => ativo && setOutros(a.filter((x) => x.usuarioId !== meuId)))
        .catch((e) => console.error('Erro ao buscar alertas de passaporte:', e))
    }
    return () => {
      ativo = false
    }
  }, [viagemId, meuId, euSouAdm])

  if (!meus) return null
  const minha = situacaoDoPassaporte(meus.passaporteValidade, volta, hojeTexto())
  const vencendo = outros.filter((o) => o.situacao === 'vence')
  const nomes = (lista: typeof outros) => lista.map((o) => membros.find((m) => m.id === o.usuarioId)?.nome ?? 'Alguém').join(', ')

  return (
    <div className="aviso-passaporte">
      <p className={`aviso-passaporte-linha nivel-${minha.nivel}`}>
        {minha.nivel === 'ok' ? <Check size={16} aria-hidden="true" /> : minha.nivel === 'sem_data' ? <BookUser size={16} aria-hidden="true" /> : <AlertTriangle size={16} aria-hidden="true" />}
        <span>
          {minha.texto} {minha.nivel === 'sem_data' && <Link to="/perfil">Ir pro perfil</Link>}
        </span>
      </p>
      {temSchengen && temPassaporteEuropeu(meus.nacionalidades) && (
        <p className="aviso-passaporte-linha nivel-ok">
          <Check size={16} aria-hidden="true" />
          <span>Com seu passaporte europeu, visto Schengen e ETIAS não valem pra você.</span>
        </p>
      )}
      {euSouAdm && vencendo.length > 0 && (
        <p className="aviso-passaporte-linha nivel-renovar">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>Passaporte vencendo perto da viagem: {nomes(vencendo)}.</span>
        </p>
      )}
    </div>
  )
}

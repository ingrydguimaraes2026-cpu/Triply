import { useLocalSearchParams, type Href } from 'expo-router';

import { NavCard } from '@/components/ui/nav-card';
import { ScreenPlaceholder } from '@/components/ui/screen-placeholder';

const SECOES = [
  { rota: 'roteiro', titulo: 'Roteiro', subtitulo: 'Atividades organizadas por dia' },
  { rota: 'orcamento', titulo: 'Orçamento', subtitulo: 'Gastos, moedas e câmbio' },
  { rota: 'checklists', titulo: 'Checklists', subtitulo: 'Mala, documentos e tarefas' },
  { rota: 'calendario', titulo: 'Calendário', subtitulo: 'Visão mensal da viagem' },
  { rota: 'memorias', titulo: 'Memórias', subtitulo: 'Fotos e anotações' },
] as const;

/** Resumo de uma viagem, com atalhos para cada seção. */
export default function ViagemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScreenPlaceholder
      title="Resumo da viagem"
      description={`Aqui vão os destinos, os trajetos, as datas e o clima da viagem "${id}".`}>
      {SECOES.map((secao) => (
        <NavCard
          key={secao.rota}
          href={`/viagem/${id}/${secao.rota}` as Href}
          title={secao.titulo}
          subtitle={secao.subtitulo}
        />
      ))}
    </ScreenPlaceholder>
  );
}

import { NavCard } from '@/components/ui/nav-card';
import { ScreenPlaceholder } from '@/components/ui/screen-placeholder';

/** Aba Viagens: lista de todas as viagens. */
export default function ViagensScreen() {
  return (
    <ScreenPlaceholder
      title="Viagens"
      description="Aqui vai a lista das suas viagens, com o botão para criar uma nova.">
      <NavCard
        href="/viagem/exemplo"
        title="Viagem de exemplo"
        subtitle="Toque para ver as telas de uma viagem"
      />
    </ScreenPlaceholder>
  );
}

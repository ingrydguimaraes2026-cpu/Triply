import { NavCard } from '@/components/ui/nav-card';
import { ScreenPlaceholder } from '@/components/ui/screen-placeholder';

/** Aba Perfil: conta, moeda padrão e preferências. */
export default function PerfilScreen() {
  return (
    <ScreenPlaceholder
      title="Perfil"
      description="Aqui vão seus dados, sua moeda padrão e as preferências do app.">
      <NavCard href="/login" title="Entrar" subtitle="Tela de login (ainda sem funcionar)" />
    </ScreenPlaceholder>
  );
}

import { NavLink, Outlet } from 'react-router'

// Moldura de todas as telas de uma viagem: as abas + a tela da aba escolhida.
export default function ViagemLayout() {
  return (
    <>
      <nav className="abas" aria-label="Abas da viagem">
        <NavLink to="" end>
          Overview
        </NavLink>
        <NavLink to="transportes">Transportes</NavLink>
        <NavLink to="financeiro">Financeiro</NavLink>
        <NavLink to="fotos">Fotos</NavLink>
        <NavLink to="comboio">Comboio</NavLink>
      </nav>
      <Outlet />
    </>
  )
}

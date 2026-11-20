import { NavLink } from 'react-router-dom';

function Navbar() {
  const estiloLink = ({ isActive }) => ({
    color: 'white',
    textDecoration: 'none',
    fontWeight: isActive ? 700 : 400,
    padding: '6px 12px',
    borderRadius: 8,
    background: isActive ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
  });

  return (
    <nav
      style={{
        background: '#c0392b',
        color: 'white',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
      }}
    >
      <strong style={{ fontSize: 18 }}>Pokédex Kalos</strong>
      <div style={{ display: 'flex', gap: 12 }}>
        <NavLink to="/" style={estiloLink} end>
          Dex
        </NavLink>
        <NavLink to="/times" style={estiloLink}>
          Meus Times
        </NavLink>
      </div>
    </nav>
  );
}

export default Navbar;
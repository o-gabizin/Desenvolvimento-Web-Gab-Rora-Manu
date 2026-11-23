import { NavLink } from 'react-router-dom';
import logo from '../img/PPlogoFull.png'

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
      className="navbar"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: '#c0392b',
        color: 'white',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img
          src={logo}
          alt="Logo Pokédex"
          width="128"
          height="40"
        />
      </div>

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
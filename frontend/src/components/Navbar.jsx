import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        Analyzer App
      </Link>
      <div className="navbar-menu">
        <span style={{ color: '#bdc3c7' }}>
          {user.teamName} ({user.role})
        </span>
        
        {user.role === 'user' && (
          <>
            <Link to="/" className="navbar-link">
              Upload
            </Link>
            <Link to="/submissions" className="navbar-link">
              My Submissions
            </Link>
          </>
        )}
        
        {user.role === 'admin' && (
          <Link to="/admin" className="navbar-link">
            Admin Dashboard
          </Link>
        )}
        
        <Link to="/leaderboard" className="navbar-link">
          Leaderboard
        </Link>
        
        <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;

import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import '../styles/AdminNavbar.css';

const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to check if a link is active
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  // Only show navbar for authenticated admin users
  if (!user || !user.isAdmin) return null;

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        {/* Left side branding */}
        <div className="brand">
          <Link to="/admin" className="brand-name">GAS</Link>
        </div>

        {/* Middle navigation links */}
        <div className="nav-links">
          <Link to="/admin" className={isActive('/admin')}>Home</Link>
          <Link to="/admin/manage-menu" className={isActive('/admin/manage-menu')}>Manage Menu</Link>
          <Link to="/admin/manage-staff" className={isActive('/admin/manage-staff')}>Manage Staff</Link>
          <Link to="/admin/manage-tables" className={isActive('/admin/manage-tables')}>Manage Tables</Link>
          <Link to="/admin/manage-reservations" className={isActive('/admin/manage-reservations')}>Manage Reservations</Link>
          <Link to="/admin/reports" className={isActive('/admin/reports')}>Reports</Link>
          <Link to="/admin/manage-members" className={isActive('/admin/manage-members')}>Manage Members</Link>
        </div>
        
        {/* Right side three-dot menu */}
        <div className="dropdown-menu" ref={dropdownRef}>
          <button 
            className="menu-dots" 
            onClick={() => setShowDropdown(!showDropdown)}
            aria-label="Menu options"
          >
            <span className="dots">&#8226;&#8226;&#8226;</span>
          </button>
          
          {showDropdown && (
            <div className="dropdown-content">
              <Link 
                to="/admin/viewfeedbacks" 
                className={isActive('/admin/viewfeedbacks')}
                onClick={() => setShowDropdown(false)}
              >
                View Feedbacks
              </Link>
              <button onClick={() => {
                logout();
                setShowDropdown(false);
              }} className="logout-btn">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
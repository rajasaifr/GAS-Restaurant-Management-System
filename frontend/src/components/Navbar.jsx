import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import '../styles/navbar.css'; // Uncomment if styles are present

const Navbar = () => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation(); // Hook to get current location

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

  if (!user) return null; // No navbar for unauthenticated users

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        {/* Left side branding */}
        <div className="brand">
          <Link to="/user" className="brand-name">GAS</Link>
        </div>

        {/* Middle navigation links */}
        <div className="nav-links">
          <Link to="/user" className={isActive('/user')}>Home</Link>
          <Link to="/user/about" className={isActive('/user/about')}>About</Link> 
          <Link to="/user/Gallery" className={isActive('/user/Gallery')}>Gallery</Link> 
          <Link to="/user/make-reservation" className={isActive('/user/make-reservation')}>Make Reservation</Link>
          <Link to="/user/my-reservations" className={isActive('/user/my-reservations')}>My Reservations</Link>
          
          <Link to="/user/menu" className={isActive('/user/menu')}>Menu</Link>
          <Link to="/user/place-order" className={isActive('/user/place-order')}>Place Order</Link>
          <Link to="/user/buy-membership" className={isActive('/user/buy-membership')}>Buy Membership</Link>
          <Link to="/user/pending-payments" className={isActive('/user/pending-payments')}>Payment</Link>
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
                to="/user/your-profile" 
                className={isActive('/user/your-profile')}
                onClick={() => setShowDropdown(false)}
              >
                Your Profile
              </Link>
              <Link 
                to="/user/feedback" 
                className={isActive('/user/feedback')}
                onClick={() => setShowDropdown(false)}
              >
                Feedbacks
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

export default Navbar;
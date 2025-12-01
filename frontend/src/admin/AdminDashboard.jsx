import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../api/axios';
import AdminNavbar from '../components/AdminNavbar';
import styles from '../styles/adminDashboard2.module.css'; // CSS Modules import
import '../styles/dashboardStyles.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    reservations: 0,
    revenue: 0,
    menuItems: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user } = useAuth();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const usersRes = await api.get('/api/users');
        const usersCount = usersRes.data.data?.length || 0;

        const reservationsRes = await api.get('/reservations');
        const reservationsCount = reservationsRes.data.count || 0;

        const paymentsRes = await api.get('/payments');
        const revenue = paymentsRes.data.data?.reduce((sum, payment) => sum + payment.Amount, 0) || 0;

        const menuRes = await api.get('/api/menu');
        const menuItemsCount = menuRes.data.data?.length || 0;

        setStats({
          users: usersCount,
          reservations: reservationsCount,
          revenue: revenue,
          menuItems: menuItemsCount,
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
        setError('Failed to load dashboard statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className={styles['dashboard-loading']}>Loading dashboard...</div>;
  }

  if (error) {
    return <div className={styles['dashboard-error']}>{error}</div>;
  }
  return (
    <>
      <AdminNavbar />
      <div className="dashboard-container admin-dashboard">
        <div className="dashboard-header">
          <h1>Welcome {user?.Name}</h1>
          <p>These are the metrics you check daily to keep everything running smoothly.</p>
        </div>

        {user && (
          <div className="admin-info">
            <p>Email: {user.Email}</p>
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Users</h3>
            <p>{stats.users}</p>
          </div>
          <div className="stat-card">
            <h3>Reservations</h3>
            <p>{stats.reservations}</p>
          </div>
          <div className="stat-card">
            <h3>Total Revenue</h3>
            <p>${stats.revenue.toFixed(2)}</p>
          </div>
          <div className="stat-card">
            <h3>Menu Items</h3>
            <p>{stats.menuItems}</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
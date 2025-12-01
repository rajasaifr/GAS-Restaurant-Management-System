import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../api/axios';
import '../styles/admin.css';
const AdminHomePage = () => {
  const { user, token } = useAuth();
  const [adminData, setAdminData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        // Token is already set in api defaults via AuthContext
        const response = await api.get('/api/admin-info');
        
        if (response.data.success) {
          setAdminData(response.data.data);
        } else {
          throw new Error(response.data.error || 'Failed to fetch admin info');
        }
      } catch (err) {
        console.error('Error fetching admin info:', err);
        setError(err.message);
        // Fallback to context if available
        if (user) {
          setAdminData({
            name: user.name || user.Name,
            email: user.email || user.Email
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAdminInfo();
  }, [user, token]);

  if (loading) {
    return <div>Loading admin information...</div>;
  }

  if (!adminData) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        {error || 'No admin data available'}
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Welcome, {adminData.name}</h1>
      <p>Email: {adminData.email}</p>
      {error && (
        <div style={{ color: 'orange', marginTop: '10px' }}>
          Note: {error} - Displaying fallback data
        </div>
      )}
    </div>
  );
};

export default AdminHomePage;
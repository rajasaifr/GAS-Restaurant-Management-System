import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import '../styles/user.css';
import '../styles/dashboardStyles.css'

const UserDashboard = () => {
  const { user } = useAuth();
  const [upcomingReservations, setUpcomingReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Call the correct API endpoint
        const response = await api.get(`/reservationsByUserId/${user.UserID}`);
        
        // Debug log the full response
        console.log('Full API response:', response);
        
        // Verify the response structure
        if (!response.data?.success) {
          throw new Error(response.data?.message || 'Invalid response format');
        }

        // Get current date at midnight
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Process reservations with proper date handling
        const upcoming = response.data.data
          .map(reservation => {
            try {
              // Parse the date safely
              const date = reservation.Date ? new Date(reservation.Date) : null;
              return {
                ...reservation,
                parsedDate: date,
                isValidDate: date instanceof Date && !isNaN(date)
              };
            } catch (e) {
              console.error('Date parsing error:', e);
              return {
                ...reservation,
                parsedDate: null,
                isValidDate: false
              };
            }
          })
          .filter(reservation => {
            // Only include valid future dates
            if (!reservation.isValidDate) return false;
            
            const resDate = new Date(reservation.parsedDate);
            resDate.setHours(0, 0, 0, 0);
            return resDate >= today;
          })
          .sort((a, b) => a.parsedDate - b.parsedDate); // Sort ascending

        console.log('Upcoming reservations:', upcoming);
        
        // Show only the 3 nearest upcoming reservations
        setUpcomingReservations(upcoming.slice(0, 3));
      } catch (err) {
        console.error('Fetch error:', {
          message: err.message,
          response: err.response?.data,
          stack: err.stack
        });
        setError(err.response?.data?.message || 'Failed to load reservations');
      } finally {
        setLoading(false);
      }
    };

    if (user?.UserID) {
      fetchReservations();
    }
  }, [user]);

  if (loading) return <div className="loading">Loading reservations...</div>;
  if (error) return <div className="error">Error: {error}</div>;
 
  
    return (
      <>
        <Navbar />
        <div className="dashboard-container user-dashboard">
          <div className="dashboard-header">
            <h1>Welcome, {user?.Name || 'User'}</h1>
            <p>The dailies? You know – reservations, menus, payments – the essentials.</p>
          </div>
          
          <div className="dashboard-section">
            <h2>Upcoming Reservations</h2>
            {upcomingReservations.length > 0 ? (
              <div className="card-grid">
                {upcomingReservations.map(res => (
                  <div key={res.ReservationID} className="card">
                    <h3>Table #{res.TableID}</h3>
                    <p>Date: {res.parsedDate?.toLocaleDateString() || 'N/A'}</p>
                    <p>Time: {res.StartTime} - {res.EndTime}</p>
                    <p>Guests: {res.People}</p>
                    <p className={`status-${res.Status.toLowerCase()}`}>
                      Status: {res.Status}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-message">No upcoming reservations found</p>
            )}
          </div>
        </div>
      </>
    );
  };
  
  export default UserDashboard;
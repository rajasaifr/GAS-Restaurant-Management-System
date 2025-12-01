import { useState, useEffect } from 'react';
import api from '../api/axios';
//import '../styles/admin.css';
import AdminNavbar from '../components/AdminNavbar'; // Import the AdminNavbar component
import '../styles/ManageReservations.css'

const ManageReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await api.get('/reservations');
        setReservations(response.data.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch reservations:', err);
        setError('Failed to load reservations. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchReservations();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/reservation/${id}/status`, { status });
      setReservations(prev =>
        prev.map(res =>
          res.ReservationID === id ? { ...res, Status: status } : res
        )
      );
      setSuccessMessage('Reservation status updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to update status:', err);
      setError('Failed to update reservation status');
    }
  };

  const deleteReservation = async (id) => {
    try {
      await api.delete(`/reservation/${id}`);
      setReservations(prev =>
        prev.filter(res => res.ReservationID !== id)
      );
      setSuccessMessage('Reservation cancelled successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to delete reservation:', err);
      setError('Failed to cancel reservation');
    }
  };

  if (loading) return (
    <div>
      <AdminNavbar />
      <div className="loading">Loading reservations...</div>
    </div>
  );

  return (
    <div>
      <AdminNavbar />
      <div className="admin-container">
        <h2>Manage Reservations</h2>
        
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Date</th>
              <th>Time</th>
              <th>People</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reservations.length > 0 ? (
              reservations.map(res => (
                <tr key={res.ReservationID}>
                  <td>{res.ReservationID}</td>
                  <td>{res.UserID}</td>
                  <td>{new Date(res.Date).toLocaleDateString()}</td>
                  <td>{res.StartTime}:00 - {res.EndTime}:00</td>
                  <td>{res.People}</td>
                  <td>
                    <select
                      value={res.Status}
                      onChange={(e) => updateStatus(res.ReservationID, e.target.value)}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>
                  <td>
                    {res.Status === 'Pending' && (
                      <button
                        className="btn btn-danger"
                        onClick={() => deleteReservation(res.ReservationID)}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center">
                  No reservations found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageReservations;
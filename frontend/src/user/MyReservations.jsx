import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../api/axios';
import '../styles/user.css';
import Navbar from '../components/Navbar';


const MyReservations = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        const response = await api.get(`/reservationsByUserId/${user.UserID}`);
        setReservations(response.data.data || []);
      } catch (err) {
        console.error('Failed to fetch reservations:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.UserID) {
      fetchReservations();
    }
  }, [user]);

  const cancelReservation = async (id) => {
    try {
      await api.put(`/reservations/${id}`, { Status: 'Cancelled' });
      setReservations(prev =>
        prev.map(res =>
          res.ReservationID === id ? { ...res, Status: 'Cancelled' } : res
        )
      );
    } catch (err) {
      console.error('Failed to cancel reservation:', err);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
    <Navbar />
    <div className="user-container">
      <h2>My Reservations</h2>
      {reservations.length > 0 ? (
        <table className="user-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Table Location</th>
              <th>Capacity</th>
              <th>Guests</th>
              <th>Status</th>
              <th>Rating</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map(res => (
              <tr key={res.ReservationID}>
                <td>{new Date(res.Date).toLocaleDateString()}</td>
                <td>{res.StartTime}:00 - {res.EndTime}:00</td>
                <td>{res.TableLocation}</td>
                <td>{res.TableCapacity}</td>
                <td>{res.People}</td>
                <td>{res.Status}</td>
                <td>{res.SatisfactionRating ?? 'N/A'}</td>
                <td>
                  {(res.Status === 'Pending' || res.Status === 'Confirmed') && (
                    <button
                      onClick={() => cancelReservation(res.ReservationID)}
                      className="btn btn-danger"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>You have no reservations yet.</p>
      )}
    </div>
    </>
  );
};

export default MyReservations;

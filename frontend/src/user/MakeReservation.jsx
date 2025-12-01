import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import api from '../api/axios';
import '../styles/user.css';
import Navbar from '../components/Navbar';

const MakeReservation = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    people: '',
  });
  const [availableTables, setAvailableTables] = useState([]);
  const [message, setMessage] = useState('');
  const [selectedTableId, setSelectedTableId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckAvailability = async (e) => {
    e.preventDefault();
    setMessage('');
    setAvailableTables([]);
    setSelectedTableId(null);

    try {
      const response = await api.post('/available-tables', {
        date: formData.date,
        startTime: parseInt(formData.startTime),
        endTime: parseInt(formData.endTime),
        capacity: parseInt(formData.people)
      });
      setAvailableTables(response.data.data || []);
    } catch (err) {
      console.error('Failed to check availability:', err);
      setMessage('Error checking availability');
    }
  };

  const handleReservation = async () => {
    if (!selectedTableId) {
      setMessage('Please select a table to reserve.');
      return;
    }

    try {
      await api.post('/reservations', {
        UserID: user.UserID,
        TableID: selectedTableId,
        Date: formData.date,
        StartTime: parseInt(formData.startTime),
        EndTime: parseInt(formData.endTime),
        People: parseInt(formData.people)
      });
      setMessage('Reservation successful!');
      setAvailableTables([]);
      setSelectedTableId(null);
    } catch (err) {
      console.error('Reservation failed:', err);
      setMessage('Failed to make reservation');
    }
  };

  return (
    <>
    <Navbar />
    <div className="user-container">
      <h2>Make a Reservation</h2>

      <form onSubmit={handleCheckAvailability} className="availability-form">
        <div className="form-group">
          <label>Date:</label>
          <input type="date" name="date" value={formData.date} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Start Time (Hour):</label>
          <input type="number" name="startTime" value={formData.startTime} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>End Time (Hour):</label>
          <input type="number" name="endTime" value={formData.endTime} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>Number of People:</label>
          <input type="number" name="people" value={formData.people} onChange={handleChange} required />
        </div>
        <button type="submit" className="btn btn-primary">Check Availability</button>
      </form>

      {availableTables.length > 0 && (
        <>
          <h3>Available Tables</h3>
          <table className="user-table">
            <thead>
              <tr>
                <th>Select</th>
                <th>Table ID</th>
                <th>Location</th>
                <th>Capacity</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {availableTables.map((table) => (
                <tr key={table.TableID}>
                  <td>
                    <input
                      type="radio"
                      name="selectedTable"
                      value={table.TableID}
                      checked={selectedTableId === table.TableID}
                      onChange={() => setSelectedTableId(table.TableID)}
                    />
                  </td>
                  <td>{table.TableID}</td>
                  <td>{table.Location}</td>
                  <td>{table.Capacity}</td>
                  <td>{table.Type}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="btn btn-success" onClick={handleReservation}>Reserve Selected Table</button>
        </>
      )}

      {message && <p style={{ marginTop: '1rem', color: message.includes('success') ? 'green' : 'red' }}>{message}</p>}
    </div>
    </>
  );
};

export default MakeReservation;

import { useState, useEffect } from 'react';
import api from '../api/axios';
import AdminNavbar from '../components/AdminNavbar';
//import '../styles/admin.css';
//import '../styles/ManageStaff.css'

const ManageStaff = () => {
  const [staff, setStaff] = useState([]);
  const [formData, setFormData] = useState({
    Name: '',
    Role: '',
    ContactInfo: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchStaff = async () => {
    try {
      const response = await api.get('/staff');
      setStaff(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch staff:', err);
      setError('Failed to load staff data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/staff', formData);
      setStaff(prev => [...prev, response.data.data]);
      setFormData({ Name: '', Role: '', ContactInfo: '' });
      setSuccessMessage('Staff member added successfully!');
      setError(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to add staff:', err);
      setError(err.response?.data?.message || 'Error adding staff member');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;
    try {
      await api.delete(`/staff/${id}`);
      setStaff(prev => prev.filter(member => member.StaffID !== id));
      setSuccessMessage('Staff member deleted successfully!');
      setError(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to delete staff:', err);
      setError('Failed to delete staff member');
    }
  };

  if (loading) return (
    <div>
      <AdminNavbar />
      <div className="loading">Loading staff data...</div>
    </div>
  );

  return (
    <div>
      <AdminNavbar />
      <div className="admin-container">
        <h2>Manage Staff</h2>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <div className="form-container">
          <h3>Add New Staff Member</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="Name"
                value={formData.Name}
                onChange={handleInputChange}
                required
                placeholder="Enter full name"
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <input
                type="text"
                name="Role"
                value={formData.Role}
                onChange={handleInputChange}
                required
                placeholder="Enter role (e.g., Waiter, Chef)"
              />
            </div>
            <div className="form-group">
              <label>Contact Info</label>
              <input
                type="text"
                name="ContactInfo"
                value={formData.ContactInfo}
                onChange={handleInputChange}
                placeholder="Email or phone number"
              />
            </div>
            <button type="submit" className="btn btn-primary">Add Staff</button>
          </form>
        </div>

        <h3>Current Staff</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Role</th>
              <th>Contact Info</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.length === 0 ? (
              <tr><td colSpan="5" className="text-center">No staff members found</td></tr>
            ) : (
              staff.map(member => (
                <tr key={member.StaffID}>
                  <td>{member.StaffID}</td>
                  <td>{member.Name}</td>
                  <td>{member.Role}</td>
                  <td>{member.ContactInfo || 'N/A'}</td>
                  <td>
                    <button 
                      onClick={() => handleDelete(member.StaffID)}
                      className="btn btn-danger"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageStaff;
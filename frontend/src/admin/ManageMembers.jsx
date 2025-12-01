import { useState, useEffect } from 'react';
import api from '../api/axios';
//import '../styles/admin.css';
import AdminNavbar from '../components/AdminNavbar'; // Import the AdminNavbar component

const ManageMembers = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    Name: '',
    Email: ''
  });
  const [addMemberLoading, setAddMemberLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [removeLoading, setRemoveLoading] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [formError, setFormError] = useState(null);

  // Fetch members
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await api.get('/api/members');
        
        if (response.data.success) {
          setMembers(response.data.data);
        } else {
          setError(response.data.error || 'Failed to load members');
        }
      } catch (err) {
        console.error('Failed to fetch members:', err);
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (formError) setFormError(null);
  };

  // Add new member
  const addMember = async (e) => {
    e.preventDefault();
    setAddMemberLoading(true);
    setError(null);
    setSuccessMessage(null);
    setFormError(null);

    try {
      const response = await api.post('/api/members', {
        Name: formData.Name,
        Email: formData.Email
      });

      if (response.data.success) {
        setSuccessMessage(response.data.message || 'Member added successfully!');
        setFormData({ Name: '', Email: '' });
        const refreshResponse = await api.get('/api/members');
        setMembers(refreshResponse.data.data);
      } else {
        setFormError(response.data.error || 'Failed to add member');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message;
      if (err.response?.status === 400 || err.response?.status === 404) {
        setFormError(errorMessage);
      } else {
        setError(errorMessage);
      }
    } finally {
      setAddMemberLoading(false);
      setTimeout(() => {
        setSuccessMessage(null);
        setFormError(null);
      }, 3000);
    }
  };

  // Show confirmation dialog
  const confirmRemove = (id) => {
    setMemberToRemove(id);
    setShowConfirmDialog(true);
  };

  // Cancel removal
  const cancelRemove = () => {
    setShowConfirmDialog(false);
    setMemberToRemove(null);
  };

  // Remove member after confirmation
  const removeMember = async () => {
    try {
      setRemoveLoading(memberToRemove);
      setShowConfirmDialog(false);
      
      const response = await api.put(`/api/members/${memberToRemove}/remove`);
      
      if (response.data.success) {
        setMembers(prev => prev.filter(member => member.UserID !== memberToRemove));
        setSuccessMessage('Membership removed successfully!');
      } else {
        setError(response.data.error || 'Failed to remove membership');
      }
    } catch (err) {
      console.error('Failed to remove member:', err);
      setError(err.response?.data?.error || 'Failed to remove membership');
    } finally {
      setRemoveLoading(null);
      setMemberToRemove(null);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  if (loading) return (
    <div>
      <AdminNavbar />
      <div className="loading">Loading members...</div>
    </div>
  );
  
  if (error) return (
    <div>
      <AdminNavbar />
      <div className="error">Error: {error}</div>
    </div>
  );

  return (
    <div>
      <AdminNavbar />
      <div className="admin-container">
        <h2>Manage Members</h2>
        
        {/* Success message */}
        {successMessage && <div className="success-message">{successMessage}</div>}
        
        {/* Add Member Form */}
        <div className="add-member-form">
          <h3>Add New Member</h3>
          <form onSubmit={addMember}>
            {formError && <div className="form-error-message">{formError}</div>}
            <div className="form-group">
              <label>Name:</label>
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
              <label>Email:</label>
              <input
                type="email"
                name="Email"
                value={formData.Email}
                onChange={handleInputChange}
                required
                placeholder="Enter email address"
              />
            </div>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={addMemberLoading}
            >
              {addMemberLoading ? 'Adding...' : 'Add Member'}
            </button>
          </form>
        </div>

        {/* Members List */}
        <div className="member-count">Total Members: {members.length}</div>
        
        {members.length === 0 ? (
          <div>No members found</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Cancel Membership</th>
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
                <tr key={member.UserID}>
                  <td>{member.UserID}</td>
                  <td>{member.Name}</td>
                  <td>{member.Phone || 'N/A'}</td>
                  <td>{member.Email || 'N/A'}</td>
                  <td>
                    <button
                      className="btn btn-danger"
                      onClick={() => confirmRemove(member.UserID)}
                      disabled={removeLoading === member.UserID}
                    >
                      {removeLoading === member.UserID ? 'Removing...' : 'Remove Membership'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="confirmation-dialog-overlay">
            <div className="confirmation-dialog">
              <h3>Confirm Removal</h3>
              <p>Are you sure you want to remove this member's membership?</p>
              <div className="dialog-buttons">
                <button 
                  className="btn btn-cancel"
                  onClick={cancelRemove}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-confirm"
                  onClick={removeMember}
                >
                  Confirm Removal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageMembers;
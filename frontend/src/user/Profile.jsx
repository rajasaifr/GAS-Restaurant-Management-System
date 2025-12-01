import { useState, useEffect } from 'react';
import api from '../api/axios';
import '../styles/user.css';
import Navbar from '../components/Navbar';
import { useAuth } from '../auth/AuthContext';

const Profile = () => {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    Name: '',
    Phone: '',
    Email: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    OldPassword: '',
    NewPassword: '',
    ConfirmPassword: '',
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get(`/api/profile/${currentUser.UserID}`);
        if (response.data && response.data.success) {
          const userData = response.data.data;
          setProfile(userData);
          setForm({
            Name: userData.Name || '',
            Phone: userData.Phone || '',
            Email: userData.Email || '',
          });
        } else {
          setError(response.data?.message || 'Failed to load profile');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?.UserID) {
      fetchProfile();
    }
  }, [currentUser]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    try {
      const response = await api.put('/api/update-user', {
        UserId: currentUser.UserID,
        Name: form.Name,
        Phone: form.Phone,
        NewEmail: form.Email,
      });

      if (response.data.success) {
        setSuccess('Profile updated successfully');
        setProfile(prev => ({
          ...prev,
          Name: form.Name,
          Phone: form.Phone,
          Email: form.Email,
        }));
      } else {
        setError(response.data.message || 'Update failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (passwordForm.NewPassword !== passwordForm.ConfirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      const response = await api.put('/api/update-user', {
        UserId: currentUser.UserID,
        OldPassword: passwordForm.OldPassword,
        NewPassword: passwordForm.NewPassword,
      });

      if (response.data.success) {
        setSuccess('Password updated successfully');
        setPasswordForm({
          OldPassword: '',
          NewPassword: '',
          ConfirmPassword: '',
        });
        setShowPasswordForm(false);
      } else {
        setError(response.data.message || 'Password update failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="loading">Loading your profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div>
        <Navbar />
        <div className="error">Error: Profile not found</div>
      </div>
    );
  }
    return (
      <>
        <Navbar />
        <div className="profile-container">
          <h1 className="profile-title">Your Profile</h1>
  
          {success && (
            <div className="profile-success">
              <svg className="success-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
          )}
          
          {error && (
            <div className="profile-error">
              <svg className="error-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
  
          <div className="profile-card">
            <form className="profile-form" onSubmit={handleProfileSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="Name"
                  value={form.Name}
                  onChange={handleChange}
                  required
                  className="profile-input"
                />
              </div>
              
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="Phone"
                  value={form.Phone}
                  onChange={handleChange}
                  placeholder="+1 (123) 456-7890"
                  className="profile-input"
                />
              </div>
              
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="Email"
                  value={form.Email}
                  onChange={handleChange}
                  required
                  className="profile-input"
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" className="primary-button">
                  Save Profile Changes
                </button>
              </div>
            </form>
  
            {!showPasswordForm ? (
              <div className="password-toggle">
                <button 
                  className="secondary-button"
                  onClick={() => setShowPasswordForm(true)}
                >
                  Change Password
                </button>
              </div>
            ) : (
              <form className="password-form" onSubmit={handlePasswordSubmit}>
                <h3 className="password-title">Change Password</h3>
                
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    name="OldPassword"
                    value={passwordForm.OldPassword}
                    onChange={handlePasswordChange}
                    required
                    className="profile-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    name="NewPassword"
                    value={passwordForm.NewPassword}
                    onChange={handlePasswordChange}
                    minLength="6"
                    required
                    className="profile-input"
                  />
                </div>
                
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    name="ConfirmPassword"
                    value={passwordForm.ConfirmPassword}
                    onChange={handlePasswordChange}
                    minLength="6"
                    required
                    className="profile-input"
                  />
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="primary-button">
                    Update Password
                  </button>
                  <button 
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordForm({
                        OldPassword: '',
                        NewPassword: '',
                        ConfirmPassword: '',
                      });
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </>
    );
  };
  
  export default Profile;
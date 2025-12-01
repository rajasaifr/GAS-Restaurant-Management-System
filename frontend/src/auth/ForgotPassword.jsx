import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import '../styles/user.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1: verify, 2: reset password
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await api.post('/api/verify-user', {
        email,
        phone
      });

      if (response.data.success) {
        setStep(2);
        setMessage('');
      } else {
        setMessage(response.data.message || 'Verification failed');
        setIsSuccess(false);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'An error occurred during verification');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await api.put('/api/reset-password', {
        email,
        phone,
        newPassword
      });

      if (response.data.success) {
        setMessage('Password reset successfully! You can now login with your new password.');
        setIsSuccess(true);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setMessage(response.data.message || 'Password reset failed');
        setIsSuccess(false);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'An error occurred during password reset');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="user-container">
      <h2>Reset Your Password</h2>
      
      {step === 1 ? (
        <form onSubmit={handleVerify} className="password-form">
          <div className="form-group">
            <label>Email Address:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
              title="Please enter a valid email address"
            />
          </div>
          
          <div className="form-group">
            <label>Phone Number:</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify Account'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="password-form">
          <div className="form-group">
            <label>New Password:</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength="6"
            />
          </div>
          
          <div className="form-group">
            <label>Confirm New Password:</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength="6"
            />
          </div>
          
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      )}
      
      {message && (
        <p className={`message ${isSuccess ? 'success' : 'error'}`}>
          {message}
        </p>
      )}
      
      <button 
        onClick={() => navigate('/login')} 
        className="btn btn-secondary"
      >
        Back to Login
      </button>
    </div>
  );
};

export default ForgotPassword;
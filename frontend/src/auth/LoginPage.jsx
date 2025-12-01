import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import '../styles/login.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [formError, setFormError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (formError) {
      const timer = setTimeout(() => setFormError(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [formError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const result = await login({ email, password });
      
      if (result?.success) {
        const isAdmin = result.data?.user?.isAdmin || result.user?.isAdmin;
        if (isAdmin === true || isAdmin === 1) {
          navigate('/admin');
        } else {
          navigate('/user');
        }
      } else {
        setFormError(result?.message || "Login failed");
      }
    } catch (error) {
      setFormError(error.message || "Invalid credentials");
    }
  };

  return (
    <div className="login-container">
      <div className="login-left-panel">
        <div className="login-logo-container">
          <h1 className="login-logo">GAS</h1>
          <p className="login-tagline">Fine dining experiences</p>
        </div>
      </div>
      
      <div className="login-right-panel">
        <div className="login-form-container">
          <h2 className="login-welcome">Welcome Back</h2>
          <p className="login-subtitle">Sign in with your email address and password</p>
          
          {formError && (
            <div className="login-error">
              <span className="login-error-icon">⚠️</span>
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-input-group">
              <label className="login-label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="johndoe@example.com"
                className="login-input"
                required
              />
            </div>
            
            <div className="login-input-group">
              <label className="login-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="login-input"
                required
              />
            </div>
            
            <div className="login-options">
              <label className="login-remember-me">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="login-checkbox"
                />
                Remember me
              </label>
              
              <button 
                type="button"
                onClick={() => navigate('/reset-password')} 
                className="login-forgot-password"
              >
                Forgot Password?
              </button>
            </div>
            
            <button type="submit" className="login-signin-button">
              Sign In
            </button>
          </form>

          <div className="login-signup-container">
            <p className="login-signup-text">Don't have an account?</p>
            <button 
              onClick={() => navigate('/register')} 
              className="login-signup-button"
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
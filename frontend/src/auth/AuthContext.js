import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    user: null,
    token: localStorage.getItem('token') || null,
    loading: true
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Set auth header for all requests
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          const { data } = await api.get('/users/me');
          setAuthState({
            user: data,
            token,
            loading: false
          });
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        logout();
      } finally {
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    };
    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const res = await api.post('/login', credentials);
      
      if (!res.data.token) {
        throw new Error('No token received');
      }
      
      localStorage.setItem('token', res.data.token);
      // Set auth header for all requests
      api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
      
      setAuthState({
        user: res.data.user,
        token: res.data.token,
        loading: false
      });
      
      return { 
        success: true,
        user: res.data.user
      };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setAuthState({
      user: null,
      token: null,
      loading: false
    });
  };

  return (
    <AuthContext.Provider value={{
      user: authState.user,
      token: authState.token,
      loading: authState.loading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
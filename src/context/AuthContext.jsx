import { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for stored token and fetch user details on load
  useEffect(() => {
    const checkUserSession = async () => {
      const token = localStorage.getItem('hk_token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          if (response.data && response.data.success) {
            setCurrentUser(response.data.user);
          } else {
            // Invalid response, clear session
            localStorage.removeItem('hk_token');
            setCurrentUser(null);
          }
        } catch (error) {
          console.error('Session verification failed:', error);
          localStorage.removeItem('hk_token');
          setCurrentUser(null);
        }
      }
      setLoading(false);
    };

    checkUserSession();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data && response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('hk_token', token);
        setCurrentUser(user);
        return { success: true };
      }
      return { success: false, message: response.data?.message || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Login failed. Please check credentials.';
      return { success: false, message };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      if (response.data && response.data.success) {
        return { success: true };
      }
      return { success: false, message: response.data?.message || 'Registration failed' };
    } catch (error) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || 'Registration failed. Try again.';
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('hk_token');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

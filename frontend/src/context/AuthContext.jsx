import React, { createContext, useState, useEffect, useContext } from 'react';
import { apiFetch } from '../config'; // Ensure path matches your project structure

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('crave_customer_token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      apiFetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : Promise.reject(res)))
        .then((data) => setUser(data))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (phone, password) => {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Login failed');

    localStorage.setItem('crave_customer_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const signup = async (userData) => {
    const res = await apiFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Signup failed');

    localStorage.setItem('crave_customer_token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const updateUserLocation = async (latitude, longitude, current_address) => {
    if (!token) return;

    try {
      const res = await apiFetch('/api/auth/location', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ latitude, longitude, current_address }),
      });

      const updatedUser = await res.json();
      if (!res.ok) throw new Error(updatedUser.error || 'Failed to update location');

      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      console.error('Error updating location in Context:', err);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('crave_customer_token');
    localStorage.removeItem('crave_user_address');
    localStorage.removeItem('user_location');

    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout, updateUserLocation }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.warn('⚠️ useAuth was called outside of an <AuthProvider>. Ensure <AuthProvider> wraps your application in App.jsx or main.jsx.');
  }
  return context;
};
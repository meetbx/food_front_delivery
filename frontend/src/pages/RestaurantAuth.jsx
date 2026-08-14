import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { API_BASE } from '../config';

export default function RestaurantAuth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    cuisine: '',
    city: 'Ahmedabad'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isLogin ? '/api/restaurant/login' : '/api/restaurant/register';

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isLogin 
            ? { email: formData.email, password: formData.password }
            : formData
        ),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Save token and restaurant details in local storage
      localStorage.setItem('restaurantToken', data.token);
      localStorage.setItem('restaurantData', JSON.stringify(data.restaurant));

      // Redirect to Partner Dashboard
      navigate('/restaurant-panel/dashboard');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        {/* Header Section */}
        <div style={styles.header}>
          <div style={styles.brandBadge}>🍽️ Crave Partner Portal</div>
          <h2 style={styles.title}>
            {isLogin ? 'Welcome Back' : 'Join Crave Network'}
          </h2>
          <p style={styles.subtitle}>
            {isLogin ? 'Sign in to manage your kitchen orders and live menu' : 'Grow your restaurant business with seamless online orders'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={styles.tabContainer}>
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }}
            style={{ ...styles.tab, ...(isLogin ? styles.activeTab : {}) }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }}
            style={{ ...styles.tab, ...(!isLogin ? styles.activeTab : {}) }}
          >
            Register Restaurant
          </button>
        </div>

        {error && <div style={styles.errorAlert}>⚠️ {error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Restaurant Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Spice Symphony"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.row}>
                <div style={{ ...styles.inputGroup, flex: 1 }}>
                  <label style={styles.label}>Cuisine Type</label>
                  <input
                    type="text"
                    name="cuisine"
                    value={formData.cuisine}
                    onChange={handleChange}
                    placeholder="Italian, North Indian"
                    style={styles.input}
                  />
                </div>
                <div style={{ ...styles.inputGroup, flex: 1 }}>
                  <label style={styles.label}>City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="e.g. Ahmedabad"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Full Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street address, Shop #, Area"
                  style={styles.input}
                />
              </div>
            </>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="partner@restaurant.com"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.submitBtn, opacity: loading ? 0.75 : 1 }}
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In to Dashboard' : 'Complete Partner Registration'}
          </button>
        </form>

        {/* Footer Note */}
        <p style={styles.footerText}>
          {isLogin ? "Don't have a partner account yet? " : "Already registered? "}
          <span 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={styles.footerLink}
          >
            {isLogin ? 'Register now' : 'Sign in'}
          </span>
        </p>

      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    padding: '24px',
    fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    boxSizing: 'border-box'
  },
  card: {
    width: '100%',
    maxWidth: '460px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
    padding: '36px 32px',
    boxSizing: 'border-box',
    color: '#0f172a' // Forces all text inside the card to default dark
  },
  header: {
    textAlign: 'center',
    marginBottom: '28px'
  },
  brandBadge: {
    display: 'inline-block',
    padding: '6px 14px',
    backgroundColor: '#fff1f2',
    color: '#e11d48',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
    marginBottom: '12px'
  },
  title: {
    margin: '0 0 6px 0',
    fontSize: '24px',
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: '-0.5px'
  },
  subtitle: {
    margin: 0,
    fontSize: '13px',
    color: '#64748b',
    lineHeight: '1.5'
  },
  tabContainer: {
    display: 'flex',
    backgroundColor: '#f1f5f9',
    borderRadius: '10px',
    padding: '4px',
    marginBottom: '24px'
  },
  tab: {
    flex: 1,
    padding: '10px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  activeTab: {
    backgroundColor: '#ffffff',
    color: '#e11d48',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)'
  },
  errorAlert: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    padding: '12px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  row: {
    display: 'flex',
    gap: '12px'
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155'
  },
  input: {
    padding: '11px 14px',
    borderRadius: '8px',
    border: '1.5px solid #e2e8f0',
    fontSize: '14px',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    outline: 'none',
    transition: 'border-color 0.2s, background-color 0.2s'
  },
  submitBtn: {
    marginTop: '6px',
    padding: '13px',
    backgroundColor: '#e11d48',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(225, 29, 72, 0.25)',
    transition: 'all 0.2s ease'
  },
  footerText: {
    marginTop: '24px',
    marginBottom: 0,
    textAlign: 'center',
    fontSize: '13px',
    color: '#64748b'
  },
  footerLink: {
    color: '#e11d48',
    fontWeight: '700',
    cursor: 'pointer',
    textDecoration: 'underline'
  }
};

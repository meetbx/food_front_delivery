import React, { createContext, useState, useEffect, useContext } from 'react';
import { useAuth } from './AuthContext';
import { apiFetch } from '../config'; // Ensure path matches your project structure

export const LocationContext = createContext();

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const { token, loading } = useAuth() || {};

  const defaultActiveAddress = {
    id: null,
    tag: 'Home',
    house_no: '',
    address: 'Select Location',
    city: '',
    latitude: null,
    longitude: null,
  };

  const [addresses, setAddresses] = useState([]);
  const [activeAddress, setActiveAddress] = useState(defaultActiveAddress);

  const fetchCustomerAddresses = async () => {
    if (!token) return;

    try {
      const response = await apiFetch('/api/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) return;

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setAddresses(data);
        setActiveAddress(data[0]);
      }
    } catch (error) {
      console.warn('Backend API fetch error:', error);
    }
  };

  useEffect(() => {
    if (loading) return;

    if (token) {
      fetchCustomerAddresses();
    } else {
      setAddresses([]);
      setActiveAddress(defaultActiveAddress);
    }
  }, [token, loading]);

  const addAddress = async (newAddr) => {
    if (!newAddr || !newAddr.address) return false;

    if (token) {
      try {
        const response = await apiFetch('/api/addresses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newAddr),
        });

        if (response.ok) {
          const saved = await response.json();
          setAddresses((prev) => [saved, ...prev]);
          setActiveAddress(saved);
          return true;
        }
      } catch (err) {
        console.error('Failed to persist address:', err);
      }
    }

    const tempAddr = { ...newAddr, id: Date.now() };
    setAddresses((prev) => [tempAddr, ...prev]);
    setActiveAddress(tempAddr);
    return true;
  };

  const deleteAddress = async (id) => {
    if (token) {
      try {
        await apiFetch(`/api/addresses/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error('Failed to delete address:', err);
      }
    }
    setAddresses((prev) => prev.filter((item) => item.id !== id));
  };

  const activeLat = activeAddress?.latitude || activeAddress?.lat || null;
  const activeLng = activeAddress?.longitude || activeAddress?.lng || null;

  return (
    <LocationContext.Provider
      value={{
        addresses,
        activeAddress,
        setActiveAddress,
        addAddress,
        deleteAddress,
        fetchCustomerAddresses,
        activeLat,
        activeLng,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};
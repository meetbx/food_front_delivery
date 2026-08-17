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
      // Map API fields to UI field names
      const normalizedData = data.map((item) => ({
        id: item.id || item.address_id,
        tag: item.tag || item.address_type || 'Home',
        house_no: item.house_no || '',
        address: item.address || item.formatted_address,
        city: item.city || '',
        latitude: item.latitude || item.lat,
        longitude: item.longitude || item.lng,
      }));

      setAddresses(normalizedData);
      setActiveAddress(normalizedData[0]);
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

  const payload = {
    ...newAddr,
    address_type: newAddr.tag || newAddr.address_type || 'Home',
    lat: newAddr.latitude,
    lng: newAddr.longitude,
  };

  if (token) {
    try {
      const response = await apiFetch('/api/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const saved = await response.json();
        const normalized = {
          ...saved,
          tag: saved.tag || saved.address_type || 'Home',
          latitude: saved.latitude || saved.lat,
          longitude: saved.longitude || saved.lng,
        };
        setAddresses((prev) => [normalized, ...prev]);
        setActiveAddress(normalized);
        return true;
      }
    } catch (err) {
      console.error('Failed to persist address:', err);
    }
  }

  const tempAddr = { ...payload, id: Date.now() };
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

import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from '../context/LocationContext'; // Use custom location hook
import { useAuth } from '../context/AuthContext';         // Use custom auth hook
import { apiFetch } from '../config'; // Add this near top imports
export default function GoogleAddressModal({ isOpen, onClose }) {
  const { savedAddresses, selectAddress, fetchCustomerAddresses } = useLocation();
  const { token } = useAuth() || {};
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [addressType, setAddressType] = useState('Home');

  useEffect(() => {
    if (!isOpen || !window.google) return;

    // Initialize Google Places Autocomplete on input
    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['geocode', 'establishment'],
    });

    autocompleteRef.current.addListener('place_changed', async () => {
      const place = autocompleteRef.current.getPlace();
      if (!place.geometry) return;

      const newAddressData = {
        address: place.formatted_address || place.name,
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
        place_id: place.place_id,
        address_type: addressType,
        is_default: true,
      };

      // Save to Database if logged in
      if (token) {
        try {
          await apiFetch('/api/addresses', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(newAddressData),
          });
          await fetchCustomerAddresses();
        } catch (err) {
          console.error('Failed to save address:', err);
        }
      } else {
        // Unauthenticated fallback
        selectAddress(newAddressData);
      }

      onClose();
    });
  }, [isOpen, addressType, token]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Search & Select Delivery Address</h3>

        {/* Autocomplete Search Input */}
        <input
          ref={inputRef}
          type="text"
          placeholder="Type your area, building, or city..."
          className="address-autocomplete-input"
        />

        {/* Saved Addresses List */}
        {savedAddresses && savedAddresses.length > 0 && (
          <div className="saved-addresses-list">
            <h4>Your Saved Addresses</h4>
            {savedAddresses.map((item) => (
              <div
                key={item.id}
                className="saved-address-card"
                onClick={() => {
                  selectAddress(item);
                  onClose();
                }}
              >
                <span className="badge">{item.address_type}</span>
                <p>{item.address}</p>
              </div>
            ))}
          </div>
        )}

        <button className="close-btn" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
import React, { useEffect, useRef } from 'react';
import { useLocation } from '../context/LocationContext';

export default function AddressSearch() {
  const inputRef = useRef(null);
  const { setCurrentLocation, setSavedAddresses } = useLocation();

  useEffect(() => {
    // Check if Google Maps script loaded from index.html
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.error('Google Maps Places API not loaded yet.');
      return;
    }

    // Attach Google Places Autocomplete to input
    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['geocode', 'establishment'],
    });

    // Listen for place selection
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();

      if (!place.geometry || !place.geometry.location) {
        return;
      }

      const newAddress = {
        id: place.place_id || Date.now(),
        address: place.formatted_address || place.name,
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
        place_id: place.place_id,
      };

      // 1. Set as current active location
      setCurrentLocation(newAddress);

      // 2. Add to saved addresses array
      setSavedAddresses((prev) => {
        const list = Array.isArray(prev) ? prev : [];
        if (list.some((item) => item.place_id === newAddress.place_id)) {
          return list;
        }
        return [...list, newAddress];
      });
    });
  }, [setCurrentLocation, setSavedAddresses]);

  return (
    <div className="search-container">
      <input
        ref={inputRef}
        type="text"
        placeholder="Search address or landmark..."
        className="address-search-input"
        style={{ width: '100%', padding: '10px', fontSize: '15px' }}
      />
    </div>
  );
}
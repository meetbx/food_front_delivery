import React, { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../config'; // Ensure path matches your project structure

// Replace with your actual Google Maps API Key
const VITE_GOOGLE_MAPS_API_KEY = 'AIzaSyBtNMoXuYrWkz9dX-lOgQYwI9hkaFExurE';

export default function RestaurantAddressPicker({ restaurant, onAddressSaved }) {
  const addressInputRef = useRef(null);
  const mapContainerRef = useRef(null);

  const [address, setAddress] = useState(restaurant?.full_address || restaurant?.address || '');
  const [city, setCity] = useState(restaurant?.city || '');
  const [coords, setCoords] = useState({
    lat: restaurant?.latitude ? parseFloat(restaurant.latitude) : 23.0225, // Default latitude
    lng: restaurant?.longitude ? parseFloat(restaurant.longitude) : 72.5714   // Default longitude
  });

  const [saving, setSaving] = useState(false);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Helper function to extract city name from Google Address Components
  const extractCity = (addressComponents) => {
    if (!addressComponents) return '';
    for (let component of addressComponents) {
      if (component.types.includes('locality')) {
        return component.long_name;
      } else if (component.types.includes('administrative_area_level_2')) {
        return component.long_name;
      }
    }
    return '';
  };

  // 1. Dynamically Load Google Maps JS Script
  useEffect(() => {
    if (window.google && window.google.maps) {
      setIsScriptLoaded(true);
      return;
    }

    const existingScript = document.getElementById('google-maps-script');
    if (!existingScript) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsScriptLoaded(true);
      document.head.appendChild(script);
    } else {
      existingScript.addEventListener('load', () => setIsScriptLoaded(true));
    }
  }, []);

  // 2. Initialize Map, Marker, and Autocomplete when Script is Ready
  useEffect(() => {
    if (!isScriptLoaded || !mapContainerRef.current || !addressInputRef.current) return;

    // Initialize Map
    const map = new window.google.maps.Map(mapContainerRef.current, {
      center: coords,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false
    });
    mapRef.current = map;

    // Initialize Draggable Marker
    const marker = new window.google.maps.Marker({
      position: coords,
      map: map,
      draggable: true,
      title: 'Drag to refine restaurant location'
    });
    markerRef.current = marker;

    // Handle Drag End -> Reverse Geocode to update address and coordinates
    marker.addListener('dragend', () => {
      const newPos = marker.getPosition();
      const lat = newPos.lat();
      const lng = newPos.lng();

      setCoords({ lat, lng });

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const formattedAddress = results[0].formatted_address;
          setAddress(formattedAddress);

          const detectedCity = extractCity(results[0].address_components);
          if (detectedCity) setCity(detectedCity);
        }
      });
    });

    // Initialize Places Autocomplete
    const autocomplete = new window.google.maps.places.Autocomplete(addressInputRef.current, {
      types: ['geocode', 'establishment']
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const formattedAddress = place.formatted_address || place.name;

        setAddress(formattedAddress);
        setCoords({ lat, lng });

        const detectedCity = extractCity(place.address_components);
        if (detectedCity) setCity(detectedCity);

        // Update map position
        map.setCenter({ lat, lng });
        map.setZoom(17);
        marker.setPosition({ lat, lng });
      }
    });

  }, [isScriptLoaded]);

  // Sync state if restaurant prop updates externally
  useEffect(() => {
    if (restaurant) {
      if (restaurant.full_address || restaurant.address) {
        setAddress(restaurant.full_address || restaurant.address);
      }
      if (restaurant.city) {
        setCity(restaurant.city);
      }
      if (restaurant.latitude && restaurant.longitude) {
        const newCoords = {
          lat: parseFloat(restaurant.latitude),
          lng: parseFloat(restaurant.longitude)
        };
        setCoords(newCoords);

        if (mapRef.current && markerRef.current) {
          mapRef.current.setCenter(newCoords);
          markerRef.current.setPosition(newCoords);
        }
      }
    }
  }, [restaurant]);

  // 3. Save to Backend Database API
  const handleConfirmAndSave = async () => {
    if (!restaurant?.id) {
      alert('Restaurant ID missing. Please ensure the restaurant is loaded.');
      return;
    }

    setSaving(true);

    try {
      const response = await apiFetch(`/api/restaurants/${restaurant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: address,
          full_address: address,
          city: city,
          latitude: coords.lat,
          longitude: coords.lng
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert('✅ Location details saved successfully!');
        if (onAddressSaved) {
          onAddressSaved(data.restaurant);
        }
      } else {
        const errData = await response.json();
        alert(`Failed to save location: ${errData.message || 'Server error'}`);
      }
    } catch (err) {
      console.error('Error saving restaurant location:', err);
      alert('Network or server error while saving location.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>📍 Restaurant Location & Geocoding</h3>

      {/* Autocomplete Input */}
      <div style={styles.inputGroup}>
        <label style={styles.label}>Search Address (Google Autocomplete)</label>
        <input
          ref={addressInputRef}
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Start typing full restaurant street address..."
          style={styles.input}
        />
      </div>

      {/* Optional City Input */}
      <div style={styles.inputGroup}>
        <label style={styles.label}>City</label>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City name"
          style={styles.input}
        />
      </div>

      {/* Interactive Map Box */}
      <div style={styles.mapWrapper}>
        {!isScriptLoaded && (
          <div style={styles.loadingOverlay}>Loading Google Maps...</div>
        )}
        <div ref={mapContainerRef} style={styles.mapCanvas} />
      </div>

      <p style={styles.hint}>💡 Tip: Drag the red pin on the map to pinpoint your exact storefront entry.</p>

      {/* Readout Coordinates */}
      <div style={styles.coordsBadge}>
        <span><strong>Latitude:</strong> {coords.lat ? coords.lat.toFixed(8) : 'N/A'}</span>
        <span><strong>Longitude:</strong> {coords.lng ? coords.lng.toFixed(8) : 'N/A'}</span>
      </div>

      {/* Save Button */}
      <button 
        onClick={handleConfirmAndSave} 
        disabled={saving || !isScriptLoaded} 
        style={saving ? { ...styles.saveButton, opacity: 0.7 } : styles.saveButton}
      >
        {saving ? 'Saving to Database...' : 'Confirm & Save Address'}
      </button>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569'
  },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    color: '#1e293b',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    width: '100%'
  },
  mapWrapper: {
    position: 'relative',
    height: '280px',
    width: '100%',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #cbd5e1'
  },
  mapCanvas: {
    width: '100%',
    height: '100%'
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '500'
  },
  hint: {
    margin: 0,
    fontSize: '12px',
    color: '#64748b',
    fontStyle: 'italic'
  },
  coordsBadge: {
    display: 'flex',
    gap: '24px',
    fontSize: '13px',
    color: '#334155',
    backgroundColor: '#f1f5f9',
    padding: '10px 14px',
    borderRadius: '6px'
  },
  saveButton: {
    padding: '12px 20px',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }
};
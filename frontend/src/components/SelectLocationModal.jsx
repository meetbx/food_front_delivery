import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';

export default function SelectLocationModal({ onClose }) {
  const { addresses, setActiveAddress, addAddress } = useLocation();
  const { user } = useAuth() || {};

  const [showAddForm, setShowAddForm] = useState(false);
  const [loadingCurrent, setLoadingCurrent] = useState(false);

  // Form State
  const [tag, setTag] = useState('Home');
  const [houseNo, setHouseNo] = useState('');
  const [formattedAddress, setFormattedAddress] = useState('');
  const [city, setCity] = useState('');
  const [coords, setCoords] = useState({ latitude: null, longitude: null });

  const autocompleteInputRef = useRef(null);

  // Initialize Google Autocomplete on the area search input when "Add Address" form is open
  useEffect(() => {
    if (showAddForm && window.google && autocompleteInputRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(
        autocompleteInputRef.current,
        { types: ['geocode', 'establishment'] }
      );

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) return;

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const fullAddr = place.formatted_address || place.name;

        let extractedCity = '';
        if (place.address_components) {
          const cityObj = place.address_components.find(
            (comp) =>
              comp.types.includes('locality') ||
              comp.types.includes('administrative_area_level_2')
          );
          if (cityObj) extractedCity = cityObj.long_name;
        }

        setFormattedAddress(fullAddr);
        setCity(extractedCity);
        setCoords({ latitude: lat, longitude: lng });
      });
    }
  }, [showAddForm]);

  // 1. "Use current location": Reverse geocodes coordinates and saves address
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setLoadingCurrent(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        if (window.google) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat: latitude, lng: longitude } },
            async (results, status) => {
              if (status === 'OK' && results[0]) {
                const currentAddrText = results[0].formatted_address;

                let currentCity = '';
                const cityComp = results[0].address_components.find((c) =>
                  c.types.includes('locality')
                );
                if (cityComp) currentCity = cityComp.long_name;

                await addAddress({
                  tag: 'Current Location',
                  house_no: '',
                  address: currentAddrText,
                  city: currentCity,
                  latitude,
                  longitude,
                });
              }
              setLoadingCurrent(false);
              if (onClose) onClose();
            }
          );
        } else {
          setLoadingCurrent(false);
        }
      },
      (error) => {
        console.error('Error fetching position:', error);
        setLoadingCurrent(false);
        alert('Unable to retrieve current location.');
      }
    );
  };

  // 2. Save manual/autocomplete address
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!formattedAddress) {
      alert('Please select an area or street from Google suggestions.');
      return;
    }

    const fullFormattedAddress = houseNo
      ? `${houseNo}, ${formattedAddress}`
      : formattedAddress;

    await addAddress({
      tag,
      house_no: houseNo,
      address: fullFormattedAddress,
      city,
      latitude: coords.latitude,
      longitude: coords.longitude,
    });

    setShowAddForm(false);
    if (onClose) onClose();
  };

  // Render directly to document.body using React Portals
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] bg-[#121214] text-white overflow-y-auto font-sans p-4">
      <div className="max-w-md mx-auto">
        {/* Header Bar */}
        <div className="flex items-center gap-3 py-2 mb-3">
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-gray-300 hover:bg-gray-800"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">Select a location</h1>
        </div>

        {/* Top Search Input */}
        <div className="relative mb-4">
          <svg className="w-5 h-5 absolute left-3.5 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search for area, street name..."
            className="w-full bg-[#1e1e22] text-sm text-white pl-11 pr-4 py-3 rounded-xl focus:outline-none placeholder-gray-500"
          />
        </div>

        {/* Primary Action Buttons */}
        {!showAddForm ? (
          <div className="bg-[#1e1e22] rounded-2xl overflow-hidden mb-6">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={loadingCurrent}
              className="w-full flex items-center justify-between p-4 border-b border-gray-800 hover:bg-gray-800/50 transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-emerald-500 text-xl">🎯</span>
                <div className="text-left">
                  <span className="text-emerald-500 font-bold block text-sm">
                    {loadingCurrent ? 'Detecting current location...' : 'Use current location'}
                  </span>
                  <span className="text-xs text-gray-400">Fetch GPS location automatically</span>
                </div>
              </div>
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-800/50 transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-emerald-500 text-xl">+</span>
                <span className="text-emerald-500 font-bold text-sm">Add Address</span>
              </div>
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        ) : (
          /* Form for Adding Address with House No. */
          <form onSubmit={handleSaveAddress} className="bg-[#1e1e22] p-4 rounded-2xl mb-6 space-y-3 border border-gray-800">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-bold text-sm text-gray-200">New Address Details</h3>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-gray-400 text-xs">
                Cancel
              </button>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">House No. / Flat No. / Block</label>
              <input
                type="text"
                placeholder="e.g. Flat 101, Block A"
                value={houseNo}
                onChange={(e) => setHouseNo(e.target.value)}
                className="w-full bg-[#121214] border border-gray-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Area / Society / Street (Google Search)</label>
              <input
                ref={autocompleteInputRef}
                type="text"
                placeholder="Search area or society..."
                defaultValue={formattedAddress}
                className="w-full bg-[#121214] border border-gray-700 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Save Address As</label>
              <div className="flex gap-2">
                {['Home', 'Work', 'Other'].map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setTag(item)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      tag === item ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm mt-2 hover:bg-emerald-500 transition"
            >
              Save Address
            </button>
          </form>
        )}

        {/* Saved Addresses List */}
        <div>
          <h2 className="text-xs font-extrabold tracking-wider text-gray-400 uppercase mb-3">
            Saved Addresses
          </h2>

          <div className="space-y-3">
            {addresses.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setActiveAddress(item);
                  if (onClose) onClose();
                }}
                className="bg-[#1e1e22] p-4 rounded-2xl cursor-pointer border border-transparent hover:border-gray-700 transition"
              >
                <div className="flex items-start gap-3">
                  <span className="text-gray-400 text-lg">🏠</span>
                  <div className="flex-1">
                    <span className="font-bold text-white text-sm block mb-0.5">
                      {item.tag || 'Home'}
                    </span>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      {item.address}
                    </p>
                    {user?.phone && (
                      <p className="text-xs text-gray-400 mt-2 font-medium">
                        Phone number: +91-{user.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
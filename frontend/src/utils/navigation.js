/**
 * Opens Google Maps Navigation in a new tab or launches the native app on mobile.
 * @param {number|string} lat - Destination Latitude
 * @param {number|string} lng - Destination Longitude
 * @param {string} fallbackAddress - Address fallback if coordinates are missing
 */
export const openGoogleMaps = (lat, lng, fallbackAddress) => {
  let mapUrl = '';

  if (lat && lng) {
    mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  } else if (fallbackAddress) {
    mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(fallbackAddress)}&travelmode=driving`;
  } else {
    alert('Location coordinates or address are unavailable.');
    return;
  }

  window.open(mapUrl, '_blank');
};
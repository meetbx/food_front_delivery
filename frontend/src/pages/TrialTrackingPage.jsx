import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { API_BASE } from '../config';

// Linear interpolation helper for smooth marker movement
const lerp = (start, end, t) => start + (end - start) * t;

export default function TrialTrackingPage() {
  const { orderId } = useParams();

  const mapRef = useRef(null);
  const googleMapInstance = useRef(null);
  const socketRef = useRef(null);

  // Map markers and route renderer references
  const riderMarkerRef = useRef(null);
  const directionsRendererRef = useRef(null);

  // Animation frame references
  const animFrameIdRef = useRef(null);
  const prevPosRef = useRef(null);
  const targetPosRef = useRef(null);

  // Simulation state
  const simulationIntervalRef = useRef(null);
  const routePointsRef = useRef([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 1. Fetch real order details from crave_db via backend API
  useEffect(() => {
    const fetchTrialOrder = async () => {
      try {
        // REPLACE: const res = await fetch(`http://localhost:5000/api/orders/${orderId}`);
const res = await fetch(`${API_BASE}/api/orders/${orderId}`);
        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || 'Failed to fetch order');
        }

        // Extract and validate customer coordinates from backend payload
            const rawCustLat = data.delivery_latitude ?? data.customer_lat ?? data.customer?.lat;
            const rawCustLng = data.delivery_longitude ?? data.customer_lng ?? data.customer?.lng;

            const parsedCustLat = rawCustLat !== null && rawCustLat !== undefined ? parseFloat(rawCustLat) : null;
            const parsedCustLng = rawCustLng !== null && rawCustLng !== undefined ? parseFloat(rawCustLng) : null;

      // Extract restaurant details
const rawRestLat = data.restaurant?.lat ?? data.restaurant_latitude;
const rawRestLng = data.restaurant?.lng ?? data.restaurant_longitude;

// Ensure non-null, valid numeric parsing
const parsedRestLat = rawRestLat !== null && rawRestLat !== undefined && !isNaN(parseFloat(rawRestLat))
  ? parseFloat(rawRestLat)
  : 12.9716; // Bengaluru default lat fallback

const parsedRestLng = rawRestLng !== null && rawRestLng !== undefined && !isNaN(parseFloat(rawRestLng))
  ? parseFloat(rawRestLng)
  : 77.5946; // Bengaluru default lng fallback

const normalizedData = {
  ...data,
  restaurant: {
    name: data.restaurant?.name || data.restaurant_name || 'Restaurant',
    lat: parsedRestLat,
    lng: parsedRestLng,
  },
  customer: {
    address: data.delivery_address || 'Customer Location',
    lat: parsedCustLat,
    lng: parsedCustLng,
  },
};

        setOrderData(normalizedData);
      } catch (err) {
        console.error('Trial order fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTrialOrder();
  }, [orderId]);

  // 2. Setup Socket.IO connection
  useEffect(() => {
    if (!orderId) return;

// REPLACE: const socket = io('http://localhost:5000', { transports: ['websocket'] });
const socket = io(API_BASE, { transports: ['websocket'] });
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      socket.emit('join_trial_room', { orderId: String(orderId) });
    });

    socket.on('rider_location_updated', (data) => {
      const newPos = { lat: parseFloat(data.lat), lng: parseFloat(data.lng) };

      if (!prevPosRef.current) {
        prevPosRef.current = newPos;
      } else if (targetPosRef.current) {
        prevPosRef.current = { ...targetPosRef.current };
      }

      targetPosRef.current = newPos;
      animateMarker();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_trial_room', { orderId });
        socketRef.current.disconnect();
      }
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    };
  }, [orderId]);

  // 3. Render Google Map with Restaurant and Customer coordinates
  useEffect(() => {
    if (!orderData || !mapRef.current || googleMapInstance.current) return;



  if (!window.google || !window.google.maps) {
    console.error("Google Maps JS API is not loaded yet.");
    return;
  }

  // Safe to initialize map
  const google = window.google;

    const restLoc = { lat: orderData.restaurant.lat, lng: orderData.restaurant.lng };

    // Fallback if user coordinates in orders table are missing or invalid
    const hasValidCustCoords =
      typeof orderData.customer.lat === 'number' &&
      !isNaN(orderData.customer.lat) &&
      typeof orderData.customer.lng === 'number' &&
      !isNaN(orderData.customer.lng);

    const custLoc = hasValidCustCoords
      ? { lat: orderData.customer.lat, lng: orderData.customer.lng }
      : orderData.customer.address; // DirectionsService supports text address string as destination fallback

    const map = new google.maps.Map(mapRef.current, {
      zoom: 14,
      center: restLoc,
      disableDefaultUI: false,
    });
    googleMapInstance.current = map;

    // Restaurant Marker
    new google.maps.Marker({
      position: restLoc,
      map,
      title: orderData.restaurant.name,
      icon: {
        url: 'https://cdn-icons-png.flaticon.com/512/3448/3448609.png',
        scaledSize: new google.maps.Size(36, 36),
      },
    });

    // Customer Delivery Address Marker (Render marker only if explicit LatLng present)
    if (hasValidCustCoords) {
      new google.maps.Marker({
        position: custLoc,
        map,
        title: orderData.customer.address,
        icon: {
          url: 'https://cdn-icons-png.flaticon.com/512/1201/1201643.png',
          scaledSize: new google.maps.Size(36, 36),
        },
      });
    }

    // Live Animated Rider Marker
    riderMarkerRef.current = new google.maps.Marker({
      position: restLoc,
      map,
      title: 'Trial Rider',
      icon: {
        url: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 20),
      },
    });

    // Directions Service (Road Route Polyline)
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers: false, // Show default markers if customer marker skipped
      polylineOptions: { strokeColor: '#10b981', strokeWeight: 5 },
    });
    directionsRendererRef.current = directionsRenderer;

    directionsService.route(
      {
        origin: restLoc,
        destination: custLoc,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          directionsRenderer.setDirections(result);

          // Extract coordinates along the driving route for desk simulation
          const overviewPath = result.routes[0].overview_path;
          routePointsRef.current = overviewPath.map((pt) => ({
            lat: pt.lat(),
            lng: pt.lng(),
          }));
        } else {
          console.error('Directions request failed due to ' + status);
        }
      }
    );
  }, [orderData]);

  // Smooth Marker Animation (3-second interpolation)
  const animateMarker = () => {
    if (!prevPosRef.current || !targetPosRef.current || !riderMarkerRef.current) return;

    const startTime = performance.now();
    const duration = 3000;

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const currentLat = lerp(prevPosRef.current.lat, targetPosRef.current.lat, progress);
      const currentLng = lerp(prevPosRef.current.lng, targetPosRef.current.lng, progress);

      riderMarkerRef.current.setPosition(
        new window.google.maps.LatLng(currentLat, currentLng)
      );

      if (progress < 1) {
        animFrameIdRef.current = requestAnimationFrame(step);
      }
    };

    if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    animFrameIdRef.current = requestAnimationFrame(step);
  };

  // Start Desk Simulation: Emits coordinates every 3s over Socket.IO
  const startRouteSimulation = () => {
    if (routePointsRef.current.length === 0) {
      alert('Directions route is loading or could not be found.');
      return;
    }

    setIsSimulating(true);
    let stepIndex = 0;

    simulationIntervalRef.current = setInterval(() => {
      if (stepIndex >= routePointsRef.current.length) {
        clearInterval(simulationIntervalRef.current);
        setIsSimulating(false);
        alert('Simulation finished: Rider arrived at customer address!');
        return;
      }

      const point = routePointsRef.current[stepIndex];
      // 1. Direct update for local map marker (Guarantees movement locally)
    if (riderMarkerRef.current) {
      const newPos = new window.google.maps.LatLng(point.lat, point.lng);
      riderMarkerRef.current.setPosition(newPos);
      
      // Keep map centered on rider during simulation
      googleMapInstance.current?.panTo(newPos);
    }

// 2. Broadcast via Socket.IO to backend/other connected clients
    if (socketRef.current?.connected) {
      socketRef.current.emit('send_rider_location', {
        orderId: String(orderId), // Ensure string format
        lat: point.lat,
        lng: point.lng,
      });
    }

      stepIndex += 1;
    }, 3000);
  };

  const stopRouteSimulation = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
    }
    setIsSimulating(false);
  };

  if (loading) return <div style={{ padding: 20, color: '#fff' }}>Loading order tracking from database...</div>;
  if (error) return <div style={{ padding: 20, color: '#ef4444' }}>Error: {error}</div>;

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: '#111827' }}>
      {/* Control Header */}
      <div style={{ padding: '12px 20px', background: '#1f2937', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <div>
          <h3 style={{ margin: 0 }}>Trial Tracking - Order #{orderData.order_id || orderData.orderId}</h3>
          <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>
            Restaurant: <strong>{orderData.restaurant.name}</strong> | Status: <strong>{orderData.status}</strong>
          </p>
          {orderData.customer.lat && orderData.customer.lng && (
            <p style={{ margin: 0, fontSize: 11, color: '#10b981' }}>
              📍 Delivery GPS: {orderData.customer.lat}, {orderData.customer.lng}
            </p>
          )}
        </div>

        <div>
          {!isSimulating ? (
            <button
              onClick={startRouteSimulation}
              style={{ padding: '10px 18px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}
            >
              ▶ Start Desk Route Simulation
            </button>
          ) : (
            <button
              onClick={stopRouteSimulation}
              style={{ padding: '10px 18px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' }}
            >
              ⏹ Stop Simulation
            </button>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapRef} style={{ flex: 1, width: '100%' }} />
    </div>
  );
}
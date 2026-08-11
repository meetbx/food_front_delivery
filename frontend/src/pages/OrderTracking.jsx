import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { API_BASE } from '../config';

const lerp = (start, end, t) => start + (end - start) * t;

export default function OrderTracking() {
  const params = useParams();
  const id = params.id || params.orderId;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullMapOpen, setIsFullMapOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const miniMapRef = useRef(null);
  const fullMapRef = useRef(null);
  const miniGoogleMapInstance = useRef(null);
  const fullGoogleMapInstance = useRef(null);
  const socketRef = useRef(null);

  const miniRiderMarkerRef = useRef(null);
  const fullRiderMarkerRef = useRef(null);

  const animFrameIdRef = useRef(null);
  const prevPosRef = useRef(null);
  const targetPosRef = useRef(null);
  const routePointsRef = useRef([]);
  const simulationIntervalRef = useRef(null);

  const fetchOrderDetails = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/orders/${id}`);
      if (!res.ok) throw new Error('Order not found');
      const data = await res.json();

      const rawCustLat = data.delivery_latitude ?? data.customer?.lat;
      const rawCustLng = data.delivery_longitude ?? data.customer?.lng;
      const parsedCustLat = rawCustLat !== null && rawCustLat !== undefined ? parseFloat(rawCustLat) : null;
      const parsedCustLng = rawCustLng !== null && rawCustLng !== undefined ? parseFloat(rawCustLng) : null;

      const rawRestLat = data.restaurant?.lat ?? data.restaurant_latitude;
      const rawRestLng = data.restaurant?.lng ?? data.restaurant_longitude;
      const parsedRestLat = rawRestLat ? parseFloat(rawRestLat) : 22.3039;
      const parsedRestLng = rawRestLng ? parseFloat(rawRestLng) : 70.8022;

      let normalizedItems = [];
      if (Array.isArray(data.items)) {
        normalizedItems = data.items;
      } else if (typeof data.items === 'string') {
        try {
          normalizedItems = JSON.parse(data.items);
        } catch (e) {
          normalizedItems = [];
        }
      }

      setOrder({
        ...data,
        items: normalizedItems,
        restaurant: {
          name: data.restaurant?.name || data.restaurant_name || 'Ghar Se',
          address: data.restaurant?.address || 'Bhakti Nagar',
          city: data.restaurant?.city || 'Rajkot',
          lat: parsedRestLat,
          lng: parsedRestLng,
        },
        customer: {
          name: data.customer?.name || data.user_name || 'M1',
          phone: data.customer?.phone || data.user_phone || '701657XXXX',
          address: data.delivery_address || data.customer?.address || '103, shajaad duplex, Raghuveer Para, Rajkot',
          lat: parsedCustLat,
          lng: parsedCustLng,
        },
      });
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
    const interval = setInterval(fetchOrderDetails, 5000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const socket = io(API_BASE, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_trial_room', { orderId: String(id) });
    });

    socket.on('rider_location_updated', (data) => {
      const newPos = { lat: parseFloat(data.lat), lng: parseFloat(data.lng) };

      if (!prevPosRef.current) {
        prevPosRef.current = newPos;
      } else if (targetPosRef.current) {
        prevPosRef.current = { ...targetPosRef.current };
      }

      targetPosRef.current = newPos;
      animateMarkers();
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave_trial_room', { orderId: id });
        socketRef.current.disconnect();
      }
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    };
  }, [id]);

  const handlePayment = async () => {
    try {
      setIsProcessingPayment(true);

      const res = await fetch(`${API_BASE}/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Paid',
          payment_status: 'Completed',
        }),
      });

      if (res.ok) {
        alert('Payment successful!');
        fetchOrderDetails();
      } else {
        alert('Payment failed. Please try again.');
      }
    } catch (err) {
      console.error('Payment Error:', err);
      alert('An error occurred during payment.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const createMap = (containerRef, isFull = false) => {
    if (!containerRef.current || !order || !window.google) return null;
    const google = window.google;

    const restLoc = { lat: order.restaurant.lat, lng: order.restaurant.lng };
    const hasValidCust = typeof order.customer.lat === 'number' && !isNaN(order.customer.lat);
    const custLoc = hasValidCust ? { lat: order.customer.lat, lng: order.customer.lng } : order.customer.address;

    const map = new google.maps.Map(containerRef.current, {
      zoom: isFull ? 15 : 14,
      center: restLoc,
      disableDefaultUI: true,
      keyboardShortcuts: false,
      gestureHandling: isFull ? 'cooperative' : 'none',
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#171c24' }] },
        { elementType: 'labels', stylers: [{ visibility: 'off' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2b3342' }] },
        { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#12161d' }] },
        { featureType: 'poi', stylers: [{ visibility: 'off' }] },
        { featureType: 'transit', stylers: [{ visibility: 'off' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1117' }] },
      ],
    });

    const whiteCirclePin = {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: '#FFFFFF',
      fillOpacity: 1,
      strokeColor: '#000000',
      strokeWeight: 1.5,
      scale: isFull ? 8 : 6,
    };

    new google.maps.Marker({
      position: restLoc,
      map,
      icon: whiteCirclePin,
      title: order.restaurant.name,
    });

    if (hasValidCust) {
      new google.maps.Marker({
        position: custLoc,
        map,
        icon: whiteCirclePin,
        title: order.customer.address,
      });
    }

    const riderMarker = new google.maps.Marker({
      position: restLoc,
      map,
      icon: {
        url: '/fast-shipping.png',
        scaledSize: new google.maps.Size(isFull ? 32 : 22, isFull ? 32 : 22),
        anchor: new google.maps.Point(isFull ? 16 : 11, isFull ? 16 : 11),
      },
    });

    if (isFull) fullRiderMarkerRef.current = riderMarker;
    else miniRiderMarkerRef.current = riderMarker;

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      { origin: restLoc, destination: custLoc, travelMode: google.maps.TravelMode.DRIVING },
      (result, status) => {
        if (status === 'OK') {
          const pathPoints = result.routes[0].overview_path;

          const dashSymbol = {
            path: 'M 0,-1 0,1',
            strokeOpacity: 1,
            strokeColor: '#FFFFFF',
            scale: isFull ? 2.5 : 2,
          };

          new google.maps.Polyline({
            path: pathPoints,
            strokeOpacity: 0,
            icons: [
              {
                icon: dashSymbol,
                offset: '0',
                repeat: '10px',
              },
            ],
            map,
          });

          if (!isFull) {
            map.fitBounds(result.routes[0].bounds, { top: 20, bottom: 20, left: 20, right: 20 });
            routePointsRef.current = pathPoints.map((pt) => ({
              lat: pt.lat(),
              lng: pt.lng(),
            }));
          }
        }
      }
    );

    return map;
  };

  useEffect(() => {
    if (order && miniMapRef.current && !miniGoogleMapInstance.current) {
      miniGoogleMapInstance.current = createMap(miniMapRef, false);
    }
  }, [order]);

  useEffect(() => {
    if (isFullMapOpen && fullMapRef.current) {
      setTimeout(() => {
        fullGoogleMapInstance.current = createMap(fullMapRef, true);
      }, 100);
    }
  }, [isFullMapOpen]);

  const animateMarkers = () => {
    if (!prevPosRef.current || !targetPosRef.current) return;
    const startTime = performance.now();
    const duration = 2000;

    const step = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentLat = lerp(prevPosRef.current.lat, targetPosRef.current.lat, progress);
      const currentLng = lerp(prevPosRef.current.lng, targetPosRef.current.lng, progress);

      const pos = new window.google.maps.LatLng(currentLat, currentLng);
      miniRiderMarkerRef.current?.setPosition(pos);
      fullRiderMarkerRef.current?.setPosition(pos);

      if (progress < 1) animFrameIdRef.current = requestAnimationFrame(step);
    };

    if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    animFrameIdRef.current = requestAnimationFrame(step);
  };

  const startSimulation = () => {
    if (routePointsRef.current.length === 0) return alert('Route points not loaded yet');
    setIsSimulating(true);
    let idx = 0;

    simulationIntervalRef.current = setInterval(() => {
      if (idx >= routePointsRef.current.length) {
        clearInterval(simulationIntervalRef.current);
        return setIsSimulating(false);
      }
      const pt = routePointsRef.current[idx];
      const newPos = new window.google.maps.LatLng(pt.lat, pt.lng);

      miniRiderMarkerRef.current?.setPosition(newPos);
      fullRiderMarkerRef.current?.setPosition(newPos);

      if (socketRef.current?.connected) {
        socketRef.current.emit('send_rider_location', { orderId: String(id), lat: pt.lat, lng: pt.lng });
      }
      idx++;
    }, 1500);
  };

  const stopSimulation = () => {
    if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
    setIsSimulating(false);
  };

  if (loading) return <div className="min-h-screen bg-[#0f0f11] flex items-center justify-center text-gray-400 text-sm">Loading Order...</div>;
  if (error || !order) return <div className="min-h-screen bg-[#0f0f11] flex items-center justify-center text-red-500">Order #{id} not found</div>;

  const isPaid = order?.payment_status === 'Completed' || order?.payment_status === 'Paid';

  return (
    <div className="min-h-screen bg-[#0f0f11] text-white p-4 max-w-md mx-auto space-y-3 font-sans pb-10">
      <style>{`
        .mini-map-container button[title="Keyboard shortcuts"],
        .mini-map-container .gm-style-moc {
          display: none !important;
        }
      `}</style>

      {/* Top Banner */}
      <div className="relative bg-gradient-to-b from-[#101035] via-[#1a0845] to-[#0f0f2d] p-5 rounded-3xl border border-indigo-900/30 overflow-hidden shadow-xl text-center">
        <h1 className="text-xl font-black text-white tracking-wide">INSTA EMI CARD</h1>
        
        <div className="mt-2 inline-block bg-black/80 px-4 py-0.5 rounded-full border border-gray-700">
          <span className="text-[11px] font-semibold text-gray-200">Avail Benefits</span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1 bg-white/10 backdrop-blur-md rounded-lg p-2 border border-white/20 text-center">
          <div>
            <p className="text-sm font-extrabold text-white">₹3,00,000</p>
            <p className="text-[9px] text-gray-300 uppercase">Offer amount</p>
          </div>
          <div className="border-x border-white/20">
            <p className="text-sm font-extrabold text-white">Easy</p>
            <p className="text-[9px] text-gray-300 uppercase">EMIs</p>
          </div>
          <div>
            <p className="text-sm font-extrabold text-white">₹1,000*</p>
            <p className="text-[9px] text-gray-300 uppercase">Cashback</p>
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <button className="bg-white text-black font-bold text-xs px-5 py-1.5 rounded-lg shadow-md hover:bg-gray-100 transition">
            Apply now
          </button>
        </div>

        <div className="flex justify-center gap-1 mt-3">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
          <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
          <span className="w-4 h-1.5 rounded-full bg-white" />
          <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
        </div>
      </div>

      {/* Order Status & Mini Map Card */}
      <div className="bg-[#18181b] p-4 rounded-3xl flex justify-between items-center border border-zinc-800 shadow-md">
        <div>
          <p className="text-xs text-gray-400">{order.restaurant.name}</p>
          <h2 className="text-xl font-extrabold text-white mt-1">Preparing your order</h2>
          <div className="mt-3 inline-flex items-center gap-1.5 bg-[#032e18] text-[#10b981] border border-emerald-900/60 text-xs px-3 py-1.5 rounded-full font-semibold">
            <span>33 mins</span> • <span>On time</span>
          </div>
        </div>

        <div 
          onClick={() => setIsFullMapOpen(true)}
          className="mini-map-container relative w-32 h-24 bg-gray-900 rounded-2xl overflow-hidden cursor-pointer border border-zinc-700 shadow-inner group"
        >
          <div ref={miniMapRef} className="w-full h-full pointer-events-none" />
          <button className="absolute top-1.5 right-1.5 bg-black/80 text-white p-1 rounded-md z-10 flex items-center justify-center">
            <img src="/maximize.png" alt="Expand" className="w-3.5 h-3.5 invert" />
          </button>
        </div>
      </div>

      {/* Cashback Bar */}
      <div className="bg-[#18181b] p-3.5 rounded-2xl flex justify-between items-center text-xs border border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="bg-[#84cc16] text-black font-black text-xs p-1 rounded-lg">
            %
          </div>
          <span className="text-gray-200 font-medium">Cashback on UPI payments</span>
        </div>
        <span className="text-[#10b981] font-semibold cursor-pointer">Apply now ›</span>
      </div>

      {/* Payment Action Bar */}
      <div className="bg-[#18181b] p-4 rounded-3xl space-y-3.5 border border-zinc-800">
        <p className="text-xs text-gray-300">
          {isPaid 
            ? 'Your payment has been successfully completed.' 
            : 'Your payment is pending. Pay now for a smoother delivery experience.'}
        </p>
        <button 
          onClick={handlePayment}
          disabled={isProcessingPayment || isPaid}
          className="w-full bg-[#10b981] hover:bg-emerald-600 disabled:opacity-60 text-white font-bold text-sm py-3 rounded-full transition-all shadow-lg"
        >
          {isPaid 
            ? 'Payment Completed ✓' 
            : isProcessingPayment 
              ? 'Processing Payment...' 
              : `Pay ₹${order.final_total || order.total_amount || 215} now`}
        </button>
      </div>

      {/* All Delivery Details Card */}
      <div className="bg-[#18181b] rounded-3xl overflow-hidden border border-zinc-800 text-xs space-y-3">
        <div className="bg-[#2a1d17] text-[#eab308] text-center py-2 text-[11px] font-semibold flex items-center justify-center gap-1.5">
          <span>All your delivery details in one place</span>
          <span>👇</span>
        </div>

        <div className="p-4 space-y-4">
          {/* Contact Details */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-lg"><img src="/call.png" alt="Phone" className="w-4 h-4 opacity-70" /></span>
              <div>
                <p className="font-bold text-white text-xs">{order.customer.name}, {order.customer.phone}</p>
                <p className="text-[11px] text-gray-400">Delivery partner may call this number</p>
              </div>
            </div>
            <button className="text-[#10b981] font-bold text-xs">Edit</button>
          </div>

          <hr className="border-zinc-800" />

          {/* Delivery Address */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-lg"><img src="/home.png" alt="Address" className="w-4 h-4 opacity-70" /></span>
              <div>
                <p className="font-bold text-white text-xs">Delivery at Home</p>
                <p className="text-[11px] text-gray-400 max-w-[200px] leading-tight mt-0.5">{order.customer.address}</p>
              </div>
            </div>
            <button className="text-[#10b981] font-bold text-xs">Edit</button>
          </div>

          <hr className="border-zinc-800" />

          {/* Add Instructions */}
          <div className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <span className="text-gray-400 text-lg"><img src="/icons8-scooter-50.png" alt="Instructions" className="w-4 h-4 opacity-70" /></span>
              <span className="font-semibold text-white">Add delivery instructions</span>
            </div>
            <span className="text-gray-400">›</span>
          </div>
        </div>
      </div>

      {/* Restaurant Header & Ordered Items Card */}
      <div className="bg-[#18181b] p-4 rounded-3xl space-y-4 border border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-800/40 flex items-center justify-center overflow-hidden border border-amber-700/50 text-amber-500 font-bold">
              {order.restaurant.image_url ? (
                <img src={order.restaurant.image_url} alt="Rest" className="w-full h-full object-cover" />
              ) : (
                '🍲'
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm">{order.restaurant.name}</h3>
              <p className="text-[11px] text-gray-400">{order.restaurant.address}, {order.restaurant.city}</p>
            </div>
          </div>
          <button className="w-8 h-8 rounded-full border border-zinc-700 flex items-center justify-center text-gray-300">
            <img src="/call.png" alt="Phone" className="w-4 h-4 opacity-70" />
          </button>
        </div>

        <hr className="border-zinc-800" />

        {/* Order Details header */}
        <div className="flex items-center gap-2 text-xs text-gray-300 font-medium">
          <span><img src="/icons8-bill-48.png" alt="Bill" className="w-4 h-4 opacity-70" /></span>
          <span>Order #{order.id}</span>
        </div>

        {/* Items List */}
        <div className="space-y-3">
          {order.items && order.items.length > 0 ? (
            order.items.map((entry, idx) => {
              const name = entry.item_name || entry.name || entry.item?.name || 'Food Item';
              const qty = entry.quantity || entry.qty || 1;
              const isVeg = entry.is_veg ?? true;

              return (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 border flex items-center justify-center text-[8px] rounded-sm ${isVeg ? 'border-emerald-500 text-emerald-500' : 'border-red-500 text-red-500'}`}>
                      ●
                    </span>
                    <span className="text-gray-200 font-medium">{qty} x {name}</span>
                  </div>
                  <span className="text-gray-400">›</span>
                </div>
              );
            })
          ) : (
            <div className="text-xs text-gray-400">No items listed.</div>
          )}
        </div>

        <hr className="border-zinc-800" />

        {/* Add cooking requests */}
        <div className="flex items-center justify-between text-xs cursor-pointer pt-1">
          <div className="flex items-center gap-2.5 text-gray-300">
            <span className="text-base"><img src="/icons8-cooking-32.png" alt="Cooking" className="w-4 h-4 opacity-70" /></span>
            <span className="font-medium">Add cooking requests</span>
          </div>
          <span className="text-gray-400">›</span>
        </div>
      </div>

      {/* Need Help Card */}
      <div className="bg-[#18181b] p-4 rounded-3xl flex items-center justify-between border border-zinc-800 text-xs cursor-pointer">
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-lg">
            <img src="/icons8-helpdesk-50.png" alt="Help" className="w-4 h-4 opacity-70" />
          </span>
          <div>
            <p className="font-bold text-white">Need help with your order?</p>
            <p className="text-[11px] text-gray-400">Get help & support</p>
          </div>
        </div>
        <span className="text-gray-400 text-base">›</span>
      </div>

      {/* Simulation Toggle Controls */}
      <div className="p-2 flex justify-center pt-2">
        {!isSimulating ? (
          <button onClick={startSimulation} className="bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-bold px-4 py-2 rounded-xl shadow-md">
            ▶ Start Desk Simulation
          </button>
        ) : (
          <button onClick={stopSimulation} className="bg-red-600 hover:bg-red-500 text-xs text-white font-bold px-4 py-2 rounded-xl shadow-md">
            ⏹ Stop Simulation
          </button>
        )}
      </div>

      {/* Expanded Full Map Modal */}
      {isFullMapOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="p-4 bg-[#18181b] flex justify-between items-center text-white border-b border-zinc-800">
            <div>
              <h3 className="font-bold text-sm">{order.restaurant.name}</h3>
              <p className="text-xs text-emerald-400">Collecting your order • Arriving in 14 mins</p>
            </div>
            <button 
              onClick={() => setIsFullMapOpen(false)}
              className="bg-zinc-800 text-white w-8 h-8 rounded-full font-bold flex items-center justify-center hover:bg-zinc-700"
            >
              ✕
            </button>
          </div>

          <div ref={fullMapRef} className="flex-1 w-full h-full" />
        </div>
      )}
    </div>
  );
}

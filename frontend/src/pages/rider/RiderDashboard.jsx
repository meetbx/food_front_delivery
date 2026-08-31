import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  Phone, 
  MapPin, 
  Store, 
  CheckCircle2, 
  Clock, 
  Zap, 
  ChevronRight,
  ShieldCheck,
  Star,
  User,
  Settings,
  LogOut,
  X,
  Edit2,
  Check,
  TrendingUp,
  Bell
} from 'lucide-react';
import { io } from 'socket.io-client';
import { useRiderAuth } from '../../context/RiderAuthContext'; //

const STEPS = {
  ACCEPTED: { label: 'Arrived at Restaurant', next: 'Arrived_At_Restaurant', stepNum: 1 },
  Arrived_At_Restaurant: { label: 'Confirm Picked Up', next: 'Picked_Up', stepNum: 2 },
  Picked_Up: { label: 'Arrived at Customer', next: 'Arrived_At_Customer', stepNum: 3 },
  Arrived_At_Customer: { label: 'Complete Delivery', next: 'Delivered', stepNum: 4 },
};

const SOCKET_URL = process.env.REACT_APP_BACKEND_URL || 'https://food-delivery-rwor.onrender.com';


export default function RiderDashboard() {

  const { rider } = useRiderAuth();
  const activeRider = rider || JSON.parse(localStorage.getItem('rider_user') || '{}');

  
  const [isLoggedIn, setIsLoggedIn] = useState(true);
const [profile, setProfile] = useState({
    id: activeRider.id || null, // ✅ Dynamically uses logged-in rider ID
    name: activeRider.name || 'Rider Partner',
    phone: activeRider.phone || '',
    rating: '4.90',
    deliveries: 0,
    vehicle: 'Standard Vehicle',
    joinDate: '2026',
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ ...profile });

  const [isOnline, setIsOnline] = useState(true);
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [earnings, setEarnings] = useState({ today: 142.50, week: 680.00 });
  const [activeTab, setActiveTab] = useState('duty');
  const [recentHistory, setRecentHistory] = useState([
    { id: 'ORD-9912', restaurant: 'Burger King', earnings: '₹85', time: '12:40 PM' },
    { id: 'ORD-9884', restaurant: 'Pizza Hut', earnings: '₹120', time: '11:15 AM' }
  ]);

  // Helper to structure and set incoming offers cleanly
  const handleNewOffer = (data) => {
    console.log('[RIDER DASHBOARD] Received offer payload:', data);
    
    const rawOrder = data.order || data;
    if (!rawOrder) return;

    const normalizedOffer = {
      id: rawOrder.id || rawOrder.order_id || 'ORD-NEW',
      restaurant: rawOrder.restaurant || rawOrder.restaurant_name || 'Restaurant',
      restaurantAddress: rawOrder.restaurantAddress || rawOrder.restaurant_address || 'Nearby Location',
      deliveryAddress: rawOrder.deliveryAddress || rawOrder.delivery_address || rawOrder.address || 'Customer Location',
      earnings: rawOrder.earnings || (rawOrder.total_amount ? `₹${rawOrder.total_amount}` : '₹85.00'),
      pickupDistance: rawOrder.pickupDistance || '1.2 km',
      dropDistance: rawOrder.dropDistance || '3.5 km',
      ...rawOrder
    };

    setIncomingOffer(normalizedOffer);
  };
const handleLogin = async (e) => {
  e.preventDefault();
  // Inside handleLogin
localStorage.setItem('rider_token', userToken);
localStorage.setItem('rider_user', JSON.stringify(loggedInRider));
localStorage.setItem('driver_id', loggedInRider.id); // Save driver_id explicitly

  try {
    const response = await fetch('https://food-delivery-rwor.onrender.com/api/rider/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      // ❌ Do NOT reference 'rider' here
      throw new Error(data.message || 'Login failed');
    }

    // ✅ Declare local variables AFTER the fetch succeeds
    const loggedInRider = data.rider;
    const userToken = data.token;

    // Save session and redirect
    localStorage.setItem('rider_token', userToken);
    localStorage.setItem('rider_user', JSON.stringify(loggedInRider));

  } catch (err) {
    console.error('Login Error:', err.message);
  }
};
  // Fallback REST check to catch offers missed during socket drops
const fetchPendingOffers = (lat = null, lng = null) => {
  if (!profile?.id) return;

  let url = `${SOCKET_URL}/api/orders/pending-offers?driverId=${profile.id}`;
  if (lat && lng) {
    url += `&lat=${lat}&lng=${lng}`;
  }

  fetch(url)
    .then((res) => res.ok ? res.json() : null)
    .then((result) => {
      if (result?.data) {
        handleNewOffer(result.data);
      }
    })
    .catch((err) => console.warn('[PENDING OFFERS API WARNING]:', err.message));
};
// Sync profile when auth state updates
  useEffect(() => {
    if (activeRider?.id) {
      setProfile((prev) => ({
        ...prev,
        id: activeRider.id,
        name: activeRider.name || prev.name,
        phone: activeRider.phone || prev.phone,
      }));
    }
  }, [activeRider]);
  
useEffect(() => {
  const savedRider = JSON.parse(localStorage.getItem('rider_user') || '{}');
  const driverId = profile?.id || savedRider.id || localStorage.getItem('driver_id');
  if (!isOnline || !driverId) return;

  const socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000
  });

  let latestPosition = null;
  let locationInterval = null;
  let watchId = null;

  const registerDriver = () => {
    socket.emit('register_rider', { riderId: driverId, driverId });
    fetchPendingOffers();
  };

  const handleOrderTaken = ({ orderId }) => {
    setIncomingOffer(prev => {
      if (prev && String(prev.id) === String(orderId)) return null;
      return prev;
    });
  };

  socket.on('connect', registerDriver);
  socket.on('new_order_offer', handleNewOffer);
  socket.on('new_delivery_assignment', handleNewOffer);
  socket.on('order_taken', handleOrderTaken);

  // GPS is sampled continuously, but the server receives one authoritative
  // location update every 3 seconds.
  if ('geolocation' in navigator) {
    watchId = navigator.geolocation.watchPosition(
      (position) => {
        latestPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
      },
      (error) => console.warn('[GEOLOCATION ERROR]:', error.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
    );

    locationInterval = setInterval(() => {
      if (!latestPosition || !socket.connected) return;
      socket.emit('send_rider_location', {
        riderId: driverId,
        driverId,
        lat: latestPosition.lat,
        lng: latestPosition.lng
      });
      console.log(`[GPS 3s] rider=${driverId} lat=${latestPosition.lat} lng=${latestPosition.lng}`);
    }, 3000);
  }

  return () => {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    if (locationInterval) clearInterval(locationInterval);
    socket.off('connect', registerDriver);
    socket.off('new_order_offer', handleNewOffer);
    socket.off('new_delivery_assignment', handleNewOffer);
    socket.off('order_taken', handleOrderTaken);
    socket.disconnect();
  };
}, [isOnline, profile?.id]); // Safely depend on profile?.id

  const handleProfileSave = () => {
    setProfile(editForm);
    setIsEditingProfile(false);
  };

  const acceptOffer = () => {
    if (!incomingOffer?.id || !profile?.id) return;

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socket.emit('register_rider', { riderId: profile.id, driverId: profile.id });
    socket.emit('accept_order', {
      orderId: incomingOffer.id,
      riderId: profile.id,
      driverId: profile.id
    });

    socket.once('order_accept_success', ({ orderId }) => {
      setActiveDelivery({
        ...incomingOffer,
        id: orderId,
        status: 'ACCEPTED',
        acceptedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      setIncomingOffer(null);
      socket.disconnect();
    });

    socket.once('order_accept_failed', ({ message }) => {
      alert(message || 'This order is no longer available.');
      setIncomingOffer(null);
      socket.disconnect();
    });
  };

  const rejectOffer = () => {
    if (!incomingOffer?.id || !profile?.id) {
      setIncomingOffer(null);
      return;
    }

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socket.emit('register_rider', { riderId: profile.id, driverId: profile.id });
    socket.emit('decline_order', {
      orderId: incomingOffer.id,
      riderId: profile.id,
      driverId: profile.id
    });
    setIncomingOffer(null);
    setTimeout(() => socket.disconnect(), 500);
  };

const advanceStep = () => {
  if (!activeDelivery || !profile?.id) return;
  const currentStepConfig = STEPS[activeDelivery.status];
  if (!currentStepConfig) return;

  const nextStatus = currentStepConfig.next;

  try {
    // 1. Send DB update request to Express endpoint
    const response = await fetch(`${SOCKET_URL}/api/orders/${activeDelivery.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus })
    });

    if (!response.ok) {
      console.error('Database update failed');
      return;
    }

  if (nextStatus === 'Delivered' || nextStatus === 'DELIVERED')) {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    
    socket.emit('register_rider', { riderId: profile.id, driverId: profile.id });
    socket.emit('complete_delivery', {
      orderId: activeDelivery.id,
      riderId: profile.id,
      driverId: profile.id
    });

    const numericEarnings = parseFloat(String(activeDelivery.earnings).replace(/[^0-9.]/g, '')) || 65;
    setEarnings(prev => ({
      today: prev.today + numericEarnings,
      week: prev.week + numericEarnings
    }));

    setRecentHistory(prev => [
      {
        id: activeDelivery.id,
        restaurant: activeDelivery.restaurant,
        earnings: activeDelivery.earnings,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      ...prev
    ]);

    setActiveDelivery(null);
    setTimeout(() => socket.disconnect(), 500);
  } else {
    setActiveDelivery(prev => ({ ...prev, status: nextStatus }));
  }
};

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#1e1e1e] p-6 rounded-3xl border border-[#2a2a2a] text-center space-y-4">
          <div className="w-16 h-16 bg-[#00b259]/10 rounded-full flex items-center justify-center mx-auto text-[#00b259]">
            <Navigation className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">Rider Partner Portal</h2>
          <p className="text-xs text-gray-400">Log in to view active orders and start earning.</p>
          <button 
            onClick={() => setIsLoggedIn(true)}
            className="w-full py-3 bg-[#00b259] hover:bg-[#00964b] text-white font-bold rounded-2xl transition"
          >
            Log In as Rider
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white max-w-md mx-auto relative flex flex-col pb-20 border-x border-[#222]">
      {/* Top Header */}
      <header className="p-4 bg-[#181818] border-b border-[#2a2a2a] flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#282828] border border-[#333] flex items-center justify-center font-bold text-sm text-[#00b259]">
            {profile.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h1 className="text-sm font-bold flex items-center gap-1.5">
              {profile.name}
              <span className="flex items-center text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-md border border-amber-500/20">
                <Star className="w-2.5 h-2.5 fill-amber-400 mr-0.5" />
                {profile.rating}
              </span>
            </h1>
            <p className="text-[11px] text-gray-400">{profile.vehicle}</p>
          </div>
        </div>

        {/* Duty Toggle Button */}
        <button
          onClick={() => setIsOnline(!isOnline)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
            isOnline 
              ? 'bg-[#00b259]/10 text-[#00b259] border border-[#00b259]/30' 
              : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#00b259] animate-pulse' : 'bg-zinc-500'}`} />
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="p-4 flex-1 space-y-4">
        {/* Profile Tab View */}
        {activeTab === 'profile' ? (
          <div className="space-y-4">
            <div className="bg-[#1e1e1e] border border-[#2a2a2a] p-5 rounded-3xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-gray-200">Rider Profile</h3>
                {!isEditingProfile ? (
                  <button onClick={() => setIsEditingProfile(true)} className="text-xs text-[#00b259] font-bold flex items-center gap-1">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                ) : (
                  <button onClick={handleProfileSave} className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Save
                  </button>
                )}
              </div>

              {!isEditingProfile ? (
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between border-b border-[#282828] pb-2">
                    <span className="text-gray-400">Phone</span>
                    <span className="font-medium text-white">{profile.phone}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#282828] pb-2">
                    <span className="text-gray-400">Vehicle</span>
                    <span className="font-medium text-white">{profile.vehicle}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#282828] pb-2">
                    <span className="text-gray-400">Total Deliveries</span>
                    <span className="font-medium text-white">{profile.deliveries}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Partner Since</span>
                    <span className="font-medium text-white">{profile.joinDate}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-gray-400 block mb-1">Full Name</label>
                    <input 
                      type="text" 
                      value={editForm.name} 
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full bg-[#121212] border border-[#333] rounded-xl p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1">Phone</label>
                    <input 
                      type="text" 
                      value={editForm.phone} 
                      onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full bg-[#121212] border border-[#333] rounded-xl p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 block mb-1">Vehicle Details</label>
                    <input 
                      type="text" 
                      value={editForm.vehicle} 
                      onChange={e => setEditForm({ ...editForm, vehicle: e.target.value })}
                      className="w-full bg-[#121212] border border-[#333] rounded-xl p-2.5 text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => setIsLoggedIn(false)}
              className="w-full p-3 bg-red-500/10 text-red-400 border border-red-500/20 font-bold rounded-2xl text-xs flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" /> Log Out
            </button>
          </div>
        ) : (
          /* Duty Tab View */
          <>
            {/* Today Earnings Banner */}
            <div className="bg-gradient-to-r from-[#00b259]/20 to-emerald-900/10 border border-[#00b259]/30 p-4 rounded-3xl flex justify-between items-center">
              <div>
                <p className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">Today's Earnings</p>
                <h2 className="text-2xl font-black text-white mt-0.5">₹{earnings.today.toFixed(2)}</h2>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-gray-400">Weekly Total</p>
                <p className="text-sm font-bold text-gray-200">₹{earnings.week.toFixed(2)}</p>
              </div>
            </div>

            {/* Offline Notice */}
            {!isOnline && (
              <div className="bg-[#1e1e1e] border border-[#2a2a2a] p-6 rounded-3xl text-center space-y-2">
                <Zap className="w-8 h-8 text-gray-500 mx-auto" />
                <h3 className="text-sm font-bold text-gray-300">You are currently Offline</h3>
                <p className="text-xs text-gray-500">Toggle your status to Online to start receiving delivery requests.</p>
              </div>
            )}

            {/* Active Delivery Workflow Card */}
            {activeDelivery && (
              <div className="bg-[#1e1e1e] border border-[#00b259]/40 p-4 rounded-3xl space-y-4 relative overflow-hidden">
                <div className="flex justify-between items-center border-b border-[#2a2a2a] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00b259] animate-ping" />
                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Active Order</h3>
                  </div>
                  <span className="text-xs font-bold text-white bg-[#282828] px-2.5 py-1 rounded-lg">
                    {activeDelivery.id}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-3">
                    <Store className="w-4 h-4 text-[#00b259] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white text-sm">{activeDelivery.restaurant}</p>
                      <p className="text-gray-400 text-[11px]">{activeDelivery.restaurantAddress}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-white text-sm">Delivery Destination</p>
                      <p className="text-gray-400 text-[11px]">{activeDelivery.deliveryAddress}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#141414] p-3 rounded-2xl flex justify-between items-center text-xs">
                  <span className="text-gray-400">Estimated Payout</span>
                  <span className="font-bold text-emerald-400 text-sm">{activeDelivery.earnings}</span>
                </div>

                {/* Step Action Button */}
                <button
                  onClick={advanceStep}
                  className="w-full py-3.5 bg-[#00b259] hover:bg-[#00964b] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#00b259]/20 transition"
                >
                  <span>{STEPS[activeDelivery.status]?.label || 'Complete Step'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Completed Deliveries History */}
            <div className="bg-[#1e1e1e] border border-[#2a2a2a] p-4 rounded-3xl space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Completed Today</h3>
                <span className="text-[11px] text-gray-500">{recentHistory.length} deliveries</span>
              </div>

              {recentHistory.length === 0 ? (
                <p className="text-xs text-gray-500 py-2">No completed deliveries yet.</p>
              ) : (
                <div className="space-y-2">
                  {recentHistory.map((order, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-[#121212] border border-[#2a2a2a] rounded-2xl text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-[#282828] flex items-center justify-center text-gray-400">
                          <Store className="w-3.5 h-3.5 text-[#00b259]" />
                        </div>
                        <div>
                          <p className="font-bold text-white">{order.restaurant}</p>
                          <p className="text-[10px] text-gray-500">{order.id} • {order.time}</p>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-400">{order.earnings}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* INCOMING OFFER POPUP OVERLAY */}
      {incomingOffer && isOnline && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-4">
          <div className="w-full max-w-md bg-[#181818] border border-emerald-500/50 rounded-3xl p-5 space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#00b259] animate-ping" />
                <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">New Order Offer!</h3>
              </div>
              <button onClick={rejectOffer} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#222] p-4 rounded-2xl flex justify-between items-center">
              <div>
                <p className="text-[11px] text-gray-400">Total Earnings</p>
                <h2 className="text-2xl font-black text-emerald-400">{incomingOffer.earnings}</h2>
              </div>
              <div className="text-right text-xs text-gray-400">
                <p>{incomingOffer.pickupDistance} to pickup</p>
                <p>{incomingOffer.dropDistance} drop distance</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <Store className="w-4 h-4 text-[#00b259] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">{incomingOffer.restaurant}</p>
                  <p className="text-gray-400 text-[11px]">{incomingOffer.restaurantAddress}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white">Deliver to</p>
                  <p className="text-gray-400 text-[11px]">{incomingOffer.deliveryAddress}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={rejectOffer}
                className="py-3 bg-zinc-800 hover:bg-zinc-700 text-gray-300 font-bold rounded-2xl text-xs transition"
              >
                Decline
              </button>
              <button
                onClick={acceptOffer}
                className="py-3 bg-[#00b259] hover:bg-[#00964b] text-white font-bold rounded-2xl text-xs shadow-lg shadow-[#00b259]/20 transition"
              >
                Accept Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-[#181818] border-t border-[#2a2a2a] flex justify-around p-3 z-30">
        <button
          onClick={() => setActiveTab('duty')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold ${
            activeTab === 'duty' ? 'text-[#00b259]' : 'text-gray-500'
          }`}
        >
          <Navigation className="w-5 h-5" />
          <span>Duty</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold ${
            activeTab === 'profile' ? 'text-[#00b259]' : 'text-gray-500'
          }`}
        >
          <User className="w-5 h-5" />
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}

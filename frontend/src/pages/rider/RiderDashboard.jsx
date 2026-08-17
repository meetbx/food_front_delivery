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

const STEPS = {
  ACCEPTED: { label: 'Arrived at Restaurant', next: 'ARRIVED_RESTAURANT', stepNum: 1 },
  ARRIVED_RESTAURANT: { label: 'Confirm Picked Up', next: 'PICKED_UP', stepNum: 2 },
  PICKED_UP: { label: 'Arrived at Customer', next: 'ARRIVED_CUSTOMER', stepNum: 3 },
  ARRIVED_CUSTOMER: { label: 'Complete Delivery', next: 'DELIVERED', stepNum: 4 },
};
const SOCKET_URL = 'http://localhost:5000';
export default function RiderDashboard() {
  // USER PROFILE & LOGIN STATE
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [profile, setProfile] = useState({
    name: 'Alex Rivera',
    phone: '+91 98765 43210',
    monthlyRevenue: 28450,
    monthlyRides: 142,
  });

  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState({ ...profile });

  // DASHBOARD CONTROL STATES
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [stats, setStats] = useState({ todayEarnings: 450, completedOrders: 5, rating: 4.9 });
  const [incomingOrder, setIncomingOrder] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [currentStep, setCurrentStep] = useState('ACCEPTED');
  const [recentHistory, setRecentHistory] = useState([
    { id: 'ORD-1080', restaurant: 'Burger King', amount: 80, time: '20 mins ago' },
    { id: 'ORD-1075', restaurant: 'Pizza Paradise', amount: 120, time: '1 hour ago' },
  ]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Only set up socket if user is logged in
    if (!isLoggedIn) return;

    // Connect to backend Socket.IO server
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });
    setSocket(newSocket);

    // Get current rider ID (or pass rider object from props/auth context)
    const riderId = profile.id || 1; // Replace 1 with dynamic rider ID after login

    // Register rider into their private room (matches socket.on('register_rider') in initSocket)
    newSocket.emit('register_rider', { riderId });

    // Listen for live customer orders broadcast from backend
    newSocket.on('new_order_offer', (orderData) => {
      if (isOnline && !activeOrder) {
        setIncomingOrder(orderData); // Automatically shows popup modal
      }
    });

    // Send real-time GPS coordinates periodically
    let locationInterval;
    if (navigator.geolocation) {
      locationInterval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            newSocket.emit('send_rider_location', {
              riderId,
              orderId: activeOrder?.id || null,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
          },
          (err) => console.error('GPS tracking error:', err.message),
          { enableHighAccuracy: true }
        );
      }, 10000); // Sends update every 10 seconds
    }

    // Cleanup on unmount or logout
    return () => {
      if (locationInterval) clearInterval(locationInterval);
      newSocket.off('new_order_offer');
      newSocket.disconnect();
    };
  }, [isLoggedIn, isOnline, activeOrder, profile.id]);
  // PROFILE HANDLERS
  const handleSaveProfile = () => {
    setProfile({ ...tempProfile });
    setIsEditingProfile(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsProfileOpen(false);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  // ORDER HANDLERS
  const handleAcceptOrder = () => {
    setActiveOrder(incomingOrder);
    setIncomingOrder(null);
    setCurrentStep('ACCEPTED');
  };

  const handleDeclineOrder = () => {
    setIncomingOrder(null);
  };

  const handleNextStep = () => {
    const stepConfig = STEPS[currentStep];

    if (stepConfig.next === 'DELIVERED') {
      setStats((prev) => ({
        ...prev,
        todayEarnings: prev.todayEarnings + activeOrder.payout,
        completedOrders: prev.completedOrders + 1,
      }));

      setProfile((prev) => ({
        ...prev,
        monthlyRevenue: prev.monthlyRevenue + activeOrder.payout,
        monthlyRides: prev.monthlyRides + 1,
      }));

      setRecentHistory((prev) => [
        {
          id: activeOrder.id,
          restaurant: activeOrder.restaurantName,
          amount: activeOrder.payout,
          time: 'Just now',
        },
        ...prev,
      ]);

      setActiveOrder(null);
      setCurrentStep('ACCEPTED');
    } else {
      setCurrentStep(stepConfig.next);
    }
  };

  const openNavigation = (lat, lng, address) => {
    const url = lat && lng 
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
  };

  const triggerSimulatedOrder = () => {
    setIncomingOrder({
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      restaurantName: "Domino's Pizza",
      pickupAddress: 'MG Road, Sector 14, Near City Mall',
      restaurantLat: 23.0225,
      restaurantLng: 72.5714,
      customerName: 'Rahul Sharma',
      customerPhone: '+91 98765 43210',
      dropAddress: 'Flat 402, Green Valley Apartments',
      customerLat: 23.0300,
      customerLng: 72.5800,
      items: ['1x Large Pepperoni Pizza', '2x Garlic Bread', '1x Coke 500ml'],
      payout: 95,
      distance: '2.4 km',
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#121212] text-white font-sans max-w-md mx-auto flex flex-col items-center justify-center p-6 border-x border-[#2a2a2a]">
        <div className="w-16 h-16 rounded-full bg-[#1e1e1e] border border-[#333] flex items-center justify-center text-[#00b259] mb-4 shadow-xl">
          <User className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-1">Rider Logged Out</h2>
        <p className="text-xs text-gray-400 mb-6 text-center">You have been signed out of your delivery session.</p>
        <button
          onClick={handleLogin}
          className="w-full bg-[#00b259] hover:bg-[#009b4d] text-white py-3.5 rounded-2xl font-extrabold text-sm transition-all shadow-lg shadow-[#00b259]/20"
        >
          LOG IN TO DASHBOARD
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white font-sans max-w-md mx-auto pb-20 border-x border-[#2a2a2a] relative overflow-x-hidden">
      
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-[#121212]/95 backdrop-blur-md px-4 py-3.5 border-b border-[#242424] flex justify-between items-center">
        <div className="flex items-center gap-3">
          {/* PROFILE BUTTON AT TOP LEFT CORNER */}
          <button
            onClick={() => {
              setTempProfile({ ...profile });
              setIsEditingProfile(false);
              setIsProfileOpen(true);
            }}
            className="w-10 h-10 rounded-full bg-[#1e1e1e] border border-[#333] hover:border-[#00b259] flex items-center justify-center font-bold text-[#00b259] transition-all relative group"
            title="Open Profile"
          >
            {profile.name.charAt(0).toUpperCase()}
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#00b259] rounded-full border-2 border-[#121212] flex items-center justify-center text-[8px] text-white">
              <User className="w-2 h-2" />
            </span>
          </button>

          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-1">
              {profile.name}
              <ShieldCheck className="w-3.5 h-3.5 text-[#00b259]" />
            </h1>
            <p className="text-[11px] text-gray-400">{isOnline ? 'Online & Ready' : 'Offline'}</p>
          </div>
        </div>

        {/* ONLINE / OFFLINE TOGGLE */}
        <button
          onClick={() => setIsOnline(!isOnline)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
            isOnline 
              ? 'bg-[#00b259] text-white shadow-lg shadow-[#00b259]/20' 
              : 'bg-[#282828] text-gray-400 border border-[#3a3a3a]'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-gray-500'}`} />
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </button>
      </header>

      {/* PROFILE SLIDE-OVER DRAWER */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xs bg-[#1e1e1e] h-full p-5 space-y-5 overflow-y-auto border-l border-[#2a2a2a] animate-in slide-in-from-right duration-200">
            
            {/* DRAWER HEADER */}
            <div className="flex justify-between items-center pb-3 border-b border-[#2a2a2a]">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-[#00b259]" /> Profile & Account
              </h2>
              <button
                onClick={() => setIsProfileOpen(false)}
                className="p-1.5 bg-[#282828] hover:bg-[#333] text-gray-400 hover:text-white rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* EDIT PROFILE / VIEW PROFILE SECTION */}
            <div className="bg-[#121212] p-4 rounded-2xl border border-[#2a2a2a] space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-[#00b259] uppercase tracking-wider">Personal Info</span>
                {!isEditingProfile ? (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="text-[11px] text-[#00b259] font-bold flex items-center gap-1 hover:underline"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                ) : (
                  <button
                    onClick={handleSaveProfile}
                    className="text-[11px] text-[#00b259] font-bold flex items-center gap-1 hover:underline"
                  >
                    <Check className="w-3 h-3" /> Save
                  </button>
                )}
              </div>

              {!isEditingProfile ? (
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-500 block">Name</span>
                    <p className="font-bold text-white">{profile.name}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">Phone Number</span>
                    <p className="font-bold text-white">{profile.phone}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Full Name</label>
                    <input
                      type="text"
                      value={tempProfile.name}
                      onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                      className="w-full bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-2 text-white font-medium focus:outline-none focus:border-[#00b259]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={tempProfile.phone}
                      onChange={(e) => setTempProfile({ ...tempProfile, phone: e.target.value })}
                      className="w-full bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl p-2 text-white font-medium focus:outline-none focus:border-[#00b259]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* MONTHLY REVENUE & RIDES STATS */}
            <div className="bg-[#121212] p-4 rounded-2xl border border-[#2a2a2a] space-y-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Monthly Earnings</span>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-black text-[#00b259]">₹{profile.monthlyRevenue.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-500">This Month's Revenue</p>
                </div>
                <div className="p-2.5 bg-[#00b259]/10 border border-[#00b259]/20 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-[#00b259]" />
                </div>
              </div>

              <div className="border-t border-[#222] pt-2.5 flex justify-between items-center text-xs">
                <span className="text-gray-400">Total Monthly Rides:</span>
                <span className="font-bold text-white">{profile.monthlyRides} rides</span>
              </div>
            </div>

            {/* APP SETTINGS */}
            <div className="bg-[#121212] p-4 rounded-2xl border border-[#2a2a2a] space-y-3">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <Settings className="w-3 h-3 text-[#00b259]" /> App Settings
              </span>

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 flex items-center gap-2">
                  <Bell className="w-3.5 h-3.5 text-gray-400" /> Notifications
                </span>
                <button
                  onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-all ${
                    notificationsEnabled ? 'bg-[#00b259]' : 'bg-[#333]'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-all ${
                    notificationsEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>

            {/* LOGOUT BUTTON */}
            <button
              onClick={handleLogout}
              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}

      {/* DASHBOARD CONTENT */}
      <main className="p-4 space-y-4">
        
        {/* DEV TEST TRIGGER */}
        {!incomingOrder && !activeOrder && isOnline && (
          <button
            onClick={triggerSimulatedOrder}
            className="w-full py-2 px-3 bg-[#1e1e1e] hover:bg-[#252525] border border-[#333] text-[#00b259] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            <Zap className="w-3.5 h-3.5 fill-[#00b259]" />
            Simulate Incoming Order
          </button>
        )}

        {/* DAILY STATS CARDS */}
        <section className="grid grid-cols-3 gap-2.5">
          <div className="bg-[#1e1e1e] border border-[#2a2a2a] p-3 rounded-2xl text-center">
            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Earnings</span>
            <p className="text-base font-extrabold text-white">₹{stats.todayEarnings}</p>
          </div>

          <div className="bg-[#1e1e1e] border border-[#2a2a2a] p-3 rounded-2xl text-center">
            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Orders</span>
            <p className="text-base font-extrabold text-white">{stats.completedOrders}</p>
          </div>

          <div className="bg-[#1e1e1e] border border-[#2a2a2a] p-3 rounded-2xl text-center">
            <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Rating</span>
            <div className="flex items-center justify-center gap-1">
              <Star className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
              <p className="text-base font-extrabold text-white">{stats.rating}</p>
            </div>
          </div>
        </section>

        {/* INCOMING ORDER OFFER MODAL */}
        {incomingOrder && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center p-4">
            <div className="w-full max-w-md bg-[#1e1e1e] border border-[#333] rounded-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-flex items-center gap-1 bg-[#00b259]/15 text-[#00b259] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-[#00b259]/30">
                    <Clock className="w-3 h-3 animate-spin" /> New Order
                  </span>
                  <h2 className="text-lg font-bold text-white mt-2">{incomingOrder.restaurantName}</h2>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block">Payout</span>
                  <span className="text-xl font-black text-[#00b259]">₹{incomingOrder.payout}</span>
                </div>
              </div>

              {/* ROUTE PREVIEW */}
              <div className="bg-[#121212] p-3.5 rounded-2xl border border-[#2a2a2a] space-y-3">
                <div className="flex items-start gap-2.5">
                  <Store className="w-4 h-4 text-[#00b259] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium">Pickup</p>
                    <p className="text-xs font-semibold text-gray-200 line-clamp-1">{incomingOrder.pickupAddress}</p>
                  </div>
                </div>
                <div className="border-t border-[#222]" />
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#00b259] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium">Dropoff ({incomingOrder.distance})</p>
                    <p className="text-xs font-semibold text-gray-200 line-clamp-1">{incomingOrder.dropAddress}</p>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={handleDeclineOrder}
                  className="w-full bg-[#2a2a2a] hover:bg-[#333] text-gray-300 py-3 rounded-2xl font-bold text-xs transition-all"
                >
                  Decline
                </button>
                <button
                  onClick={handleAcceptOrder}
                  className="w-full bg-[#00b259] hover:bg-[#009b4d] text-white py-3 rounded-2xl font-black text-xs transition-all shadow-lg shadow-[#00b259]/20"
                >
                  ACCEPT ORDER
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE ORDER CARD */}
        {activeOrder && (
          <section className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-3xl p-4 space-y-4">
            
            {/* HEADER */}
            <div className="flex justify-between items-center pb-3 border-b border-[#2a2a2a]">
              <div>
                <span className="text-[10px] font-bold text-[#00b259] uppercase tracking-wider block">Active Order</span>
                <h2 className="text-base font-bold text-white">{activeOrder.id}</h2>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-400 block">Payout</span>
                <span className="text-base font-extrabold text-[#00b259]">₹{activeOrder.payout}</span>
              </div>
            </div>

            {/* STEP PROGRESS BAR */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-gray-400 font-medium">
                <span>Progress</span>
                <span className="text-[#00b259] font-bold">Step {STEPS[currentStep].stepNum} of 4</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-1.5 rounded-full transition-all ${
                      step <= STEPS[currentStep].stepNum ? 'bg-[#00b259]' : 'bg-[#2a2a2a]'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* ROUTE LIST */}
            <div className="space-y-3 pt-1">
              <div className="bg-[#121212] p-3 rounded-2xl border border-[#2a2a2a] flex justify-between items-start">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-[#00b259] uppercase">1. Pickup Restaurant</span>
                  <p className="text-xs font-bold text-white">{activeOrder.restaurantName}</p>
                  <p className="text-[11px] text-gray-400 line-clamp-1">{activeOrder.pickupAddress}</p>
                </div>
                <button
                  onClick={() => openNavigation(activeOrder.restaurantLat, activeOrder.restaurantLng, activeOrder.pickupAddress)}
                  className="p-2 bg-[#282828] text-white hover:bg-[#333] border border-[#3a3a3a] rounded-xl transition-all shrink-0"
                >
                  <Navigation className="w-3.5 h-3.5 text-[#00b259]" />
                </button>
              </div>

              <div className="bg-[#121212] p-3 rounded-2xl border border-[#2a2a2a] flex justify-between items-start">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-[#00b259] uppercase">2. Customer Dropoff</span>
                  <p className="text-xs font-bold text-white">{activeOrder.customerName}</p>
                  <p className="text-[11px] text-gray-400 line-clamp-1">{activeOrder.dropAddress}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <a
                    href={`tel:${activeOrder.customerPhone}`}
                    className="p-2 bg-[#282828] text-white hover:bg-[#333] border border-[#3a3a3a] rounded-xl transition-all"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#00b259]" />
                  </a>
                  <button
                    onClick={() => openNavigation(activeOrder.customerLat, activeOrder.customerLng, activeOrder.dropAddress)}
                    className="p-2 bg-[#282828] text-white hover:bg-[#333] border border-[#3a3a3a] rounded-xl transition-all"
                  >
                    <Navigation className="w-3.5 h-3.5 text-[#00b259]" />
                  </button>
                </div>
              </div>
            </div>

            {/* CHECKLIST */}
            <div className="bg-[#121212] p-3 rounded-2xl border border-[#2a2a2a]">
              <span className="text-[10px] font-bold text-gray-400 block mb-1.5 uppercase">Items to verify:</span>
              <div className="space-y-1">
                {activeOrder.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00b259] shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ACTION BUTTON */}
            <button
              onClick={handleNextStep}
              className="w-full py-3.5 bg-[#00b259] hover:bg-[#009b4d] text-white font-extrabold text-xs rounded-2xl transition-all shadow-lg shadow-[#00b259]/20 flex items-center justify-center gap-2"
            >
              <span>{STEPS[currentStep].label}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </section>
        )}

        {/* RECENT HISTORY */}
        <section className="bg-[#1e1e1e] border border-[#2a2a2a] p-4 rounded-3xl space-y-3">
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
                  <span className="font-extrabold text-[#00b259] text-xs">+₹{order.amount}</span>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

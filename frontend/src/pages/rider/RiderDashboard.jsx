import React, { useState } from 'react';

// Delivery Workflow Steps
const STEPS = {
  ACCEPTED: { label: 'Arrived at Restaurant', next: 'ARRIVED_RESTAURANT', color: 'bg-blue-600' },
  ARRIVED_RESTAURANT: { label: 'Confirm Picked Up', next: 'PICKED_UP', color: 'bg-indigo-600' },
  PICKED_UP: { label: 'Arrived at Customer', next: 'ARRIVED_CUSTOMER', color: 'bg-purple-600' },
  ARRIVED_CUSTOMER: { label: 'Complete Delivery', next: 'DELIVERED', color: 'bg-green-600' },
};

export default function RiderDashboard() {
  // 1. Rider Status State
  const [isOnline, setIsOnline] = useState(true);

  // 2. Performance Stats State
  const [stats, setStats] = useState({
    todayEarnings: 450,
    completedOrders: 5,
    rating: 4.9,
  });

  // 3. Live Order States
  const [incomingOrder, setIncomingOrder] = useState(null); // Populated via Socket.IO
  const [activeOrder, setActiveOrder] = useState(null);
  const [currentStep, setCurrentStep] = useState('ACCEPTED');

  // 4. Order History State
  const [recentHistory, setRecentHistory] = useState([
    { id: 'ORD-1080', restaurant: 'Burger King', amount: 80, time: '20 mins ago' },
    { id: 'ORD-1075', restaurant: 'Pizza Paradise', amount: 120, time: '1 hour ago' },
  ]);

  // --- HANDLERS ---

  // Handle Accepting Incoming Order
  const handleAcceptOrder = () => {
    setActiveOrder(incomingOrder);
    setIncomingOrder(null);
    setCurrentStep('ACCEPTED');
  };

  // Handle Declining Incoming Order
  const handleDeclineOrder = () => {
    setIncomingOrder(null);
  };

  // Progress Active Order through workflow steps
  const handleNextStep = () => {
    const stepConfig = STEPS[currentStep];

    if (stepConfig.next === 'DELIVERED') {
      // Complete Order: Update Stats & History
      setStats((prev) => ({
        ...prev,
        todayEarnings: prev.todayEarnings + activeOrder.payout,
        completedOrders: prev.completedOrders + 1,
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

      // Reset Active Order
      setActiveOrder(null);
      setCurrentStep('ACCEPTED');
      alert('🎉 Order Delivered Successfully!');
    } else {
      setCurrentStep(stepConfig.next);
    }
  };

  // Google Maps Deep Link Generator
  const openNavigation = (lat, lng, address) => {
    const url = lat && lng 
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
  };

  // Developer Test Trigger (Simulate incoming Socket.IO alert)
  const triggerSimulatedOrder = () => {
    setIncomingOrder({
      id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      restaurantName: 'Domino\'s Pizza',
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

  return (
    <div className="min-h-screen bg-slate-100 p-4 font-sans max-w-2xl mx-auto pb-24">
      
      {/* HEADER BAR */}
      <header className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center mb-4 border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-800">🛵 Rider Portal</h1>
          <p className="text-sm text-slate-500">Welcome back, Alex!</p>
        </div>

        {/* ONLINE / OFFLINE TOGGLE */}
        <button
          onClick={() => setIsOnline(!isOnline)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all shadow-sm ${
            isOnline ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-700'
          }`}
        >
          <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-slate-500'}`} />
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </button>
      </header>

      {/* DEV TESTING BUTTON (Will be replaced by Socket.IO listener) */}
      {!incomingOrder && !activeOrder && isOnline && (
        <button
          onClick={triggerSimulatedOrder}
          className="w-full mb-4 py-2 border-2 border-dashed border-indigo-400 text-indigo-600 bg-indigo-50 rounded-xl font-medium text-xs hover:bg-indigo-100 transition-all"
        >
          ⚡ Dev Mode: Simulate Incoming Order Alert
        </button>
      )}

      {/* 1. DAILY STATS SUMMARY */}
      <section className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-200 text-center">
          <span className="text-xs text-slate-500 block uppercase font-medium">Earnings</span>
          <span className="text-xl font-extrabold text-slate-800">₹{stats.todayEarnings}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-200 text-center">
          <span className="text-xs text-slate-500 block uppercase font-medium">Orders</span>
          <span className="text-xl font-extrabold text-slate-800">{stats.completedOrders}</span>
        </div>
        <div className="bg-white p-3.5 rounded-xl shadow-sm border border-slate-200 text-center">
          <span className="text-xs text-slate-500 block uppercase font-medium">Rating</span>
          <span className="text-xl font-extrabold text-amber-500">⭐ {stats.rating}</span>
        </div>
      </section>

      {/* 2. INCOMING ORDER REQUEST MODAL / CARD */}
      {incomingOrder && (
        <section className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-xl border-2 border-indigo-500 mb-6 animate-bounce-short">
          <div className="flex justify-between items-start mb-3">
            <div>
              <span className="bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                New Delivery Request
              </span>
              <h2 className="text-xl font-bold mt-2">{incomingOrder.restaurantName}</h2>
            </div>
            <span className="text-2xl font-black text-emerald-400">₹{incomingOrder.payout}</span>
          </div>

          <div className="space-y-2 text-sm text-slate-300 mb-5 bg-slate-800/60 p-3 rounded-lg border border-slate-700">
            <p>📍 <strong>Pickup:</strong> {incomingOrder.pickupAddress}</p>
            <p>🏠 <strong>Drop:</strong> {incomingOrder.dropAddress}</p>
            <p>📏 <strong>Est. Distance:</strong> {incomingOrder.distance}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDeclineOrder}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold transition-all"
            >
              Decline
            </button>
            <button
              onClick={handleAcceptOrder}
              className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/30"
            >
              ACCEPT ORDER
            </button>
          </div>
        </section>
      )}

      {/* 3. ACTIVE ORDER WORKFLOW TRACKER */}
      {activeOrder && (
        <section className="bg-white p-5 rounded-2xl shadow-md border border-slate-200 mb-6">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">Active Order</span>
              <h2 className="text-lg font-bold text-slate-800">{activeOrder.id}</h2>
            </div>
            <span className="text-lg font-bold text-emerald-600">Payout: ₹{activeOrder.payout}</span>
          </div>

          {/* PROGRESS STEP INDICATOR */}
          <div className="mb-5 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="text-xs font-semibold text-slate-500 mb-1">CURRENT STATUS:</div>
            <div className="text-sm font-bold text-indigo-600">
              {currentStep.replaceAll('_', ' ')}
            </div>
          </div>

          {/* PICKUP & DROP DETAILS */}
          <div className="space-y-4 mb-6">
            <div className="bg-slate-50 p-3 rounded-xl">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-bold text-slate-500">1. PICKUP RESTAURANT</span>
                <button
                  onClick={() => openNavigation(activeOrder.restaurantLat, activeOrder.restaurantLng, activeOrder.pickupAddress)}
                  className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-md font-bold hover:bg-indigo-200 transition-all flex items-center gap-1"
                >
                  🗺️ Navigate
                </button>
              </div>
              <p className="font-bold text-slate-800">{activeOrder.restaurantName}</p>
              <p className="text-xs text-slate-500">{activeOrder.pickupAddress}</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl">
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-bold text-slate-500">2. CUSTOMER DROP LOCATION</span>
                <button
                  onClick={() => openNavigation(activeOrder.customerLat, activeOrder.customerLng, activeOrder.dropAddress)}
                  className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-md font-bold hover:bg-indigo-200 transition-all flex items-center gap-1"
                >
                  🗺️ Navigate
                </button>
              </div>
              <p className="font-bold text-slate-800">{activeOrder.customerName}</p>
              <p className="text-xs text-slate-500 mb-2">{activeOrder.dropAddress}</p>
              <a
                href={`tel:${activeOrder.customerPhone}`}
                className="inline-block text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-md font-bold hover:bg-emerald-200"
              >
                📞 Call Customer
              </a>
            </div>

            {/* ORDER ITEMS CHECKLIST */}
            <div className="border-t border-slate-100 pt-3">
              <span className="text-xs font-bold text-slate-400 block mb-2">ITEMS TO PICKUP:</span>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                {activeOrder.items.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* DYNAMIC ACTION BUTTON */}
          <button
            onClick={handleNextStep}
            className={`w-full py-3.5 rounded-xl text-white font-extrabold text-base transition-all shadow-md ${
              STEPS[currentStep].color
            }`}
          >
            {STEPS[currentStep].label} →
          </button>
        </section>
      )}

      {/* 4. RECENT COMPLETED DELIVERIES */}
      <section className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-sm font-bold text-slate-800 mb-3">Recent Completed Deliveries</h3>
        
        {recentHistory.length === 0 ? (
          <p className="text-xs text-slate-400">No completed orders today.</p>
        ) : (
          <div className="space-y-2.5">
            {recentHistory.map((order, idx) => (
              <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-lg text-xs">
                <div>
                  <p className="font-bold text-slate-800">{order.restaurant}</p>
                  <p className="text-slate-400">{order.id} • {order.time}</p>
                </div>
                <span className="font-extrabold text-emerald-600 text-sm">+₹{order.amount}</span>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
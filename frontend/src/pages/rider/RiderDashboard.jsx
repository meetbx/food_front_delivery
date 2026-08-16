import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  Phone, 
  MapPin, 
  Store, 
  User, 
  CheckCircle2, 
  DollarSign, 
  ShoppingBag, 
  Star, 
  Zap, 
  ArrowRight,
  Clock,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

const STEPS = {
  ACCEPTED: { label: 'Arrived at Restaurant', next: 'ARRIVED_RESTAURANT', stepNum: 1, color: 'bg-blue-600 hover:bg-blue-700' },
  ARRIVED_RESTAURANT: { label: 'Confirm Picked Up', next: 'PICKED_UP', stepNum: 2, color: 'bg-indigo-600 hover:bg-indigo-700' },
  PICKED_UP: { label: 'Arrived at Customer', next: 'ARRIVED_CUSTOMER', stepNum: 3, color: 'bg-purple-600 hover:bg-purple-700' },
  ARRIVED_CUSTOMER: { label: 'Complete Delivery', next: 'DELIVERED', stepNum: 4, color: 'bg-emerald-600 hover:bg-emerald-700' },
};

export default function RiderDashboard() {
  const [isOnline, setIsOnline] = useState(true);
  const [stats, setStats] = useState({ todayEarnings: 450, completedOrders: 5, rating: 4.9 });
  const [incomingOrder, setIncomingOrder] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [currentStep, setCurrentStep] = useState('ACCEPTED');
  const [recentHistory, setRecentHistory] = useState([
    { id: 'ORD-1080', restaurant: 'Burger King', amount: 80, time: '20 mins ago' },
    { id: 'ORD-1075', restaurant: 'Pizza Paradise', amount: 120, time: '1 hour ago' },
  ]);

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
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans max-w-md mx-auto pb-20 border-x border-slate-800 shadow-2xl">
      
      {/* APP HEADER */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md px-5 py-4 border-b border-slate-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-emerald-400">
              AX
            </div>
            <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${isOnline ? 'bg-emerald-500' : 'bg-slate-500'}`} />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-1.5">
              Alex Rivera
              <ShieldCheck className="w-4 h-4 text-blue-400" />
            </h1>
            <p className="text-xs text-slate-400">{isOnline ? 'Ready for orders' : 'Currently offline'}</p>
          </div>
        </div>

        {/* ONLINE TOGGLE */}
        <button
          onClick={() => setIsOnline(!isOnline)}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 border ${
            isOnline 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-lg shadow-emerald-500/10' 
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
          {isOnline ? 'ONLINE' : 'OFFLINE'}
        </button>
      </header>

      <main className="p-4 space-y-4">
        
        {/* DEV SIMULATOR BUTTON */}
        {!incomingOrder && !activeOrder && isOnline && (
          <button
            onClick={triggerSimulatedOrder}
            className="w-full py-2.5 px-4 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 text-indigo-300 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Zap className="w-4 h-4 text-indigo-400 fill-indigo-400" />
            Simulate Incoming Delivery Alert
          </button>
        )}

        {/* STATS OVERVIEW CARDS */}
        <section className="grid grid-cols-3 gap-2.5">
          <div className="bg-slate-800/60 border border-slate-700/50 p-3 rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Earnings</span>
            </div>
            <p className="text-lg font-bold text-white">₹{stats.todayEarnings}</p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 p-3 rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <ShoppingBag className="w-3.5 h-3.5 text-blue-400" />
              <span>Orders</span>
            </div>
            <p className="text-lg font-bold text-white">{stats.completedOrders}</p>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 p-3 rounded-2xl">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Rating</span>
            </div>
            <p className="text-lg font-bold text-white">{stats.rating}</p>
          </div>
        </section>

        {/* INCOMING ORDER MODAL */}
        {incomingOrder && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-3xl p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-200">
              <div className="flex justify-between items-start">
                <div>
                  <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    <Clock className="w-3 h-3 animate-spin" /> New Order Offer
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1.5">{incomingOrder.restaurantName}</h2>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Payout</span>
                  <span className="text-2xl font-black text-emerald-400">₹{incomingOrder.payout}</span>
                </div>
              </div>

              {/* ROUTE INFO */}
              <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-700/60 space-y-3">
                <div className="flex items-start gap-3">
                  <Store className="w-4 h-4 text-indigo-400 mt-1 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Pickup</p>
                    <p className="text-xs font-semibold text-slate-200 line-clamp-1">{incomingOrder.pickupAddress}</p>
                  </div>
                </div>
                <div className="border-t border-slate-800" />
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Dropoff ({incomingOrder.distance})</p>
                    <p className="text-xs font-semibold text-slate-200 line-clamp-1">{incomingOrder.dropAddress}</p>
                  </div>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={handleDeclineOrder}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 py-3.5 rounded-xl font-bold text-sm transition-all"
                >
                  Decline
                </button>
                <button
                  onClick={handleAcceptOrder}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 py-3.5 rounded-xl font-extrabold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                >
                  ACCEPT ORDER
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE ORDER CARD */}
        {activeOrder && (
          <section className="bg-slate-800 border border-slate-700/80 rounded-3xl p-5 space-y-5 shadow-xl">
            
            {/* CARD HEADER */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-700/60">
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">Active Delivery</span>
                <h2 className="text-lg font-bold text-white">{activeOrder.id}</h2>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Earnings</span>
                <span className="text-lg font-extrabold text-emerald-400">₹{activeOrder.payout}</span>
              </div>
            </div>

            {/* PROGRESS STEP INDICATOR BAR */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>Progress Status</span>
                <span className="text-indigo-400 font-bold">Step {STEPS[currentStep].stepNum} of 4</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-2 rounded-full transition-all ${
                      step <= STEPS[currentStep].stepNum ? 'bg-indigo-500' : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* ROUTE DETAILS TIMELINE */}
            <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700">
              
              {/* RESTAURANT PICKUP */}
              <div className="relative">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-indigo-400 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase">Pickup Restaurant</span>
                    <p className="text-sm font-bold text-white">{activeOrder.restaurantName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{activeOrder.pickupAddress}</p>
                  </div>
                  <button
                    onClick={() => openNavigation(activeOrder.restaurantLat, activeOrder.restaurantLng, activeOrder.pickupAddress)}
                    className="p-2 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-xs font-semibold transition-all flex items-center gap-1"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* CUSTOMER DROPOFF */}
              <div className="relative">
                <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-emerald-400 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">Dropoff Customer</span>
                    <p className="text-sm font-bold text-white">{activeOrder.customerName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{activeOrder.dropAddress}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <a
                      href={`tel:${activeOrder.customerPhone}`}
                      className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => openNavigation(activeOrder.customerLat, activeOrder.customerLng, activeOrder.dropAddress)}
                      className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-all"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ORDER ITEMS CHECKLIST */}
            <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-700/50">
              <span className="text-xs font-bold text-slate-400 block mb-2">Item Checklist:</span>
              <div className="space-y-1.5">
                {activeOrder.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* DYNAMIC ACTION BUTTON */}
            <button
              onClick={handleNextStep}
              className={`w-full py-4 rounded-2xl text-white font-black text-sm transition-all shadow-xl flex items-center justify-center gap-2 ${
                STEPS[currentStep].color
              }`}
            >
              <span>{STEPS[currentStep].label}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </section>
        )}

        {/* RECENT HISTORY */}
        <section className="bg-slate-800/60 border border-slate-700/50 p-4 rounded-3xl space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Completed Today</h3>
            <span className="text-xs text-slate-500">{recentHistory.length} orders</span>
          </div>

          {recentHistory.length === 0 ? (
            <p className="text-xs text-slate-500 py-2">No completed deliveries yet today.</p>
          ) : (
            <div className="space-y-2">
              {recentHistory.map((order, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-slate-900/50 border border-slate-800 rounded-2xl text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-white">{order.restaurant}</p>
                      <p className="text-[10px] text-slate-500">{order.id} • {order.time}</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-emerald-400 text-sm">+₹{order.amount}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

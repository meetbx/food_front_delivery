import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ThumbsUp, 
  Info, 
  Edit3, 
  AlertCircle, 
  Accessibility, 
  Settings, 
  LogOut, 
  ChevronRight,
  LogIn,
  MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import CustomerAuthModal from './CustomerAuthModal';

const ProfileMenu = ({ onClose }) => {
  const { user, logout } = useAuth();
  const { addresses } = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [showAddresses, setShowAddresses] = useState(false);

  const handleOpenAuth = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const getInitial = () => {
    if (user && user.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return 'M';
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0f0f14] text-white flex flex-col justify-between font-sans overflow-y-auto animate-in fade-in duration-200">
      
      {/* TOP HEADER */}
      <div className="p-4 flex items-center">
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center hover:bg-gray-800 transition-colors"
          aria-label="Go Back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-200" />
        </button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="px-4 space-y-4 flex-1 max-w-md mx-auto w-full">
        
        {/* USER PROFILE CARD */}
        {user ? (
          <div className="bg-[#181820] border border-gray-800/80 rounded-2xl p-5 flex items-center gap-4 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-2xl font-bold text-white shadow-md">
              {getInitial()}
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white capitalize">{user.name || 'meet'}</h2>
              <button className="text-emerald-400 text-xs font-semibold flex items-center gap-1 mt-1 hover:underline">
                Edit profile <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#181820] border border-gray-800/80 rounded-2xl p-5 shadow-xl text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold text-white mx-auto shadow-md">
              M
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Guest Account</h2>
              <p className="text-xs text-gray-400 mt-0.5">Log in to view saved addresses & orders</p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => handleOpenAuth('login')}
                className="flex-1 py-2 bg-emerald-500 text-black font-bold text-xs rounded-xl hover:bg-emerald-400 transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => handleOpenAuth('signup')}
                className="flex-1 py-2 bg-gray-800 border border-gray-700 text-white font-bold text-xs rounded-xl hover:bg-gray-700 transition-colors"
              >
                Sign Up
              </button>
            </div>
          </div>
        )}

        {/* MORE SECTION CARD */}
        <div className="bg-[#181820] border border-gray-800/80 rounded-2xl p-4 shadow-xl">
          {/* Green accent vertical bar */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-emerald-500 rounded-full" />
            <h3 className="text-base font-bold text-white tracking-wide">More</h3>
          </div>

          <div className="divide-y divide-gray-800/50 text-sm">
            {/* Saved Addresses Dropdown */}
            <div className="py-0.5">
              <button 
                onClick={() => setShowAddresses(!showAddresses)}
                className="w-full flex items-center justify-between py-3 px-1 text-gray-200 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span className="font-medium text-xs">Saved Addresses</span>
                </div>
                <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${showAddresses ? 'rotate-90' : ''}`} />
              </button>

              {showAddresses && (
                <div className="pl-8 pr-2 py-2 space-y-1 bg-gray-900/60 rounded-xl my-1 border border-gray-800/40">
                  {addresses && addresses.length > 0 ? (
                    addresses.map((addr) => (
                      <div key={addr.id} className="text-xs py-1 border-b border-gray-800/40 last:border-none">
                        <p className="font-semibold text-emerald-400">{addr.tag || 'Home'}</p>
                        <p className="text-gray-400 truncate">{addr.address}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">No addresses saved yet</p>
                  )}
                </div>
              )}
            </div>

            {/* Menu options */}
            <button className="w-full flex items-center justify-between py-3 px-1 text-gray-200 hover:text-white transition-colors">
              <div className="flex items-center gap-3">
                <ThumbsUp className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-xs">Your feedback</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>

            <button className="w-full flex items-center justify-between py-3 px-1 text-gray-200 hover:text-white transition-colors">
              <div className="flex items-center gap-3">
                <Info className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-xs">About</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>

            <button className="w-full flex items-center justify-between py-3 px-1 text-gray-200 hover:text-white transition-colors">
              <div className="flex items-center gap-3">
                <Edit3 className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-xs">Send feedback</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>

            <button className="w-full flex items-center justify-between py-3 px-1 text-gray-200 hover:text-white transition-colors">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-xs">Report a safety emergency</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>

            <button className="w-full flex items-center justify-between py-3 px-1 text-gray-200 hover:text-white transition-colors">
              <div className="flex items-center gap-3">
                <Accessibility className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-xs">Accessibility</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>

            <button className="w-full flex items-center justify-between py-3 px-1 text-gray-200 hover:text-white transition-colors">
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-xs">Settings</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-500" />
            </button>

            {user ? (
              <button 
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full flex items-center justify-between py-3 px-1 text-gray-200 hover:text-red-400 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-xs">Log out</span>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            ) : (
              <button 
                onClick={() => handleOpenAuth('login')}
                className="w-full flex items-center justify-between py-3 px-1 text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <LogIn className="w-4 h-4" />
                  <span className="font-medium text-xs">Log in</span>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-500/60" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER BRANDING */}
      <div className="p-8 text-center text-gray-500">
        <p className="text-2xl font-black italic tracking-widest text-gray-500 lowercase">crave</p>
        <p className="text-[10px] text-gray-600 tracking-wider mt-0.5">v1.0.0(1)</p>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <CustomerAuthModal
          initialMode={authMode}
          onClose={() => setShowAuthModal(false)}
        />
      )}
    </div>
  );
};

export default ProfileMenu;
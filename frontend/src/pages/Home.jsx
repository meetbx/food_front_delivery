import { useState, useEffect } from 'react';
import RestaurantCard from '../components/RestaurantCard';
import LocationHeader from '../components/LocationHeader';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import CategoryMenu from '../components/CategoryMenu';
import BottomNav from '../components/BottomNav';
import BannerSlider from '../components/BannerSlider';
import ExploreMore from '../components/ExploreMore';
import LargeRestaurantCard from '../components/LargeRestaurantCard';
import ProfileMenu from '../components/ProfileMenu';
import { useLocation } from '../context/LocationContext';
import { apiFetch, API_BASE } from '../config';

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [sortBy, setSortBy] = useState('rating');
  const [vegOnly, setVegOnly] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const { activeAddress, activeLat, activeLng } = useLocation();
  
  // 👤 State to toggle full screen Profile View
  const [showProfile, setShowProfile] = useState(false);

  const { darkMode, toggleDarkMode } = useTheme();
  const { user, updateUserLocation } = useAuth() || {};

  const isFiltered = selectedCuisine !== 'All' || searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setSelectedCuisine('All');
    setSearchQuery('');
  };

  // Helper to get profile initial
  const getUserInitial = () => {
    if (user && user.name) {
      return user.name.charAt(0).toUpperCase();
    }
    return 'M';
  };

  // 📍 GPS Location Detector
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          if (updateUserLocation) {
            await updateUserLocation(
              lat,
              lng,
              `GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`
            );
          }
        } catch (err) {
          console.error('Failed to update user location:', err);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('Error getting GPS location:', error);
        setIsLocating(false);
        alert('Unable to retrieve location. Please grant location permissions in your browser.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // 📡 Fetch Restaurants with Address ID or GPS Coordinates
  useEffect(() => {
    setLoading(true);

    const debounceTimer = setTimeout(() => {
      let endpoint = '/api/restaurants';
      const params = new URLSearchParams();

      if (activeAddress?.id) {
        params.append('address_id', activeAddress.id);
      } else if (activeLat && activeLng) {
        params.append('lat', activeLat);
        params.append('lng', activeLng);
      }

      if (searchQuery.trim() !== '') {
        endpoint = '/api/search';
        params.append('q', searchQuery.trim());
      } else if (selectedCuisine && selectedCuisine !== 'All') {
        endpoint = `/api/categories/${encodeURIComponent(selectedCuisine)}/restaurants`;
      }

      const queryString = params.toString();
      const baseUrl = `${API_BASE}${endpoint}`;
      const fullUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;

      fetch(fullUrl)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setRestaurants(data);
          } else {
            console.error('API Error Response:', data);
            setRestaurants([]);
          }
        })
        .catch((err) => {
          console.error('Error fetching restaurants:', err);
          setRestaurants([]);
        })
        .finally(() => {
          setLoading(false);
        });
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, selectedCuisine, activeAddress, activeLat, activeLng]);

  const displayedRestaurants = restaurants
    .filter((res) => {
      if (vegOnly && !res.isVeg && res.type !== 'Veg') return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sortBy === 'price_low') return (a.price || 0) - (a.price || 0);
      if (sortBy === 'price_high') return (b.price || 0) - (a.price || 0);
      return 0;
    });

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-24">
      {/* ========================================================= */}
      {/* 1. STICKY HEADER & CATEGORY CONTAINER                    */}
      {/* ========================================================= */}
      <div className="sticky top-0 z-50 bg-[#121212]/98 backdrop-blur-md border-b border-white/10 shadow-2xl">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-3 pb-2 space-y-3">
          
          {/* TOP HEADER (LOCATION + PROFILE) - Hides on filter */}
          {!isFiltered && (
            <div className="flex items-center justify-between gap-2 pb-1">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <LocationHeader />
                <button
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  title="Click to update GPS coordinates"
                  className="bg-[#1c232d] hover:bg-[#25303f] border border-emerald-500/30 text-emerald-400 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition shrink-0"
                >
                  <span className="text-emerald-400 animate-pulse">🎯</span>
                  {isLocating ? (
                    <span>Locating...</span>
                  ) : user?.latitude && user?.longitude ? (
                    <span>
                      {parseFloat(user.latitude).toFixed(2)}, {parseFloat(user.longitude).toFixed(2)}
                    </span>
                  ) : (
                    <span>GPS</span>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="bg-gradient-to-r from-amber-200/20 to-amber-500/20 border border-amber-300/40 text-amber-200 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <span className="text-[10px] font-black tracking-wider text-amber-300">GOLD</span>
                  <span className="bg-amber-300 text-black px-1 py-0.5 rounded text-[10px] font-black leading-none">
                    ₹1
                  </span>
                </div>

                <button 
                  onClick={() => setShowProfile(true)}
                  className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center shadow-md transition-transform active:scale-95"
                >
                  {getUserInitial()}
                </button>
              </div>
            </div>
          )}

          {/* SEARCH BAR ROW */}
          <div className="flex items-center gap-2.5">
            {isFiltered && (
              <button
                onClick={handleResetFilters}
                aria-label="Back to home"
                className="w-10 h-10 rounded-full bg-[#1c232d] border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all shrink-0 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </button>
            )}

            <div className="flex-1 bg-[#18202e]/90 border border-white/10 rounded-full px-4 py-2 shadow-lg flex items-center">
              <svg className="w-5 h-5 text-white/80 shrink-0 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>

              <input
                type="text"
                placeholder={
                  selectedCuisine !== 'All'
                    ? `Search in ${selectedCuisine}...`
                    : 'Search "chaat" or dishes...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-white placeholder-white/60 text-sm font-medium"
              />

              <div className="h-5 w-[1px] bg-white/20 mx-3 shrink-0" />
              <button aria-label="Voice Search" className="text-white/80 hover:text-white transition shrink-0 focus:outline-none">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 003-3V6a3 3 0 116 0v6a3 3 0 003 3z" />
                </svg>
              </button>
            </div>

            {/* Veg Mode Toggle */}
            <div className="flex flex-col items-center shrink-0">
              <span className="text-[8px] font-black tracking-tighter text-zinc-300 uppercase leading-tight text-center">
                VEG<br />MODE
              </span>
              <button
                onClick={() => setVegOnly(!vegOnly)}
                aria-label="Toggle Veg Mode"
                className={`mt-1 w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors ${
                  vegOnly ? 'bg-emerald-500 justify-end' : 'bg-zinc-700 justify-start'
                }`}
              >
                <div className="w-3.5 h-3.5 bg-white rounded-full shadow-md" />
              </button>
            </div>
          </div>

          {/* DISH SELECTION CATEGORY MENU */}
          <div className="w-full">
            <CategoryMenu
              activeCategory={selectedCuisine}
              onSelectCategory={(categoryName) => {
                setSearchQuery('');
                setSelectedCuisine(categoryName);
              }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. SCROLLABLE BODY CONTENT                                */}
      {/* ========================================================= */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 space-y-4">
        
        {/* BANNER SLIDER */}
        {!isFiltered && (
          <div className="overflow-hidden">
            <BannerSlider />
          </div>
        )}

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-1">
          <button className="bg-[#242424] border border-[#333333] text-zinc-300 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 hover:border-zinc-500">
            <span>⚙️ Filters</span>
          </button>
          <button className="bg-[#242424] border border-[#333333] text-zinc-300 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 hover:border-zinc-500">
            Regular
          </button>
          <button className="bg-[#242424] border border-[#333333] text-zinc-300 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 hover:border-zinc-500">
            Paneer
          </button>
          <button className="bg-[#242424] border border-[#333333] text-zinc-300 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 hover:border-zinc-500">
            Near & Fast
          </button>
        </div>

        {/* Recommended Header */}
        <h3 className="text-xs font-extrabold tracking-wider text-zinc-400 uppercase pt-2">
          RECOMMENDED FOR YOU
        </h3>

        {/* Horizontal Cards */}
        {loading ? (
          <div className="grid grid-rows-2 grid-flow-col gap-3 overflow-hidden py-1">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="w-[140px] h-[170px] bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl animate-pulse shrink-0"
              />
            ))}
          </div>
        ) : displayedRestaurants.length === 0 ? (
          <div className="text-center py-12 bg-[#181818] rounded-2xl border border-dashed border-[#333333] p-8 shadow-sm">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-zinc-200 font-bold text-base mb-1">
              No restaurants found
            </p>
            <p className="text-xs text-zinc-500 mb-4">
              Try choosing another category or clearing your filter.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-rows-2 grid-flow-col auto-cols-max justify-start gap-3 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            {displayedRestaurants.slice(0, 24).map((res) => (
              <RestaurantCard key={`top-${res.id}`} restaurant={res} />
            ))}
          </div>
        )}

        {/* Explore More */}
        {!isFiltered && (
          <div className="overflow-hidden">
            <ExploreMore onSelect={(id) => console.log('Selected Explore Option:', id)} />
          </div>
        )}

        {/* Main Vertical Feed */}
        <div className="pt-2 space-y-3">
          <div>
            <h2 className="text-xs font-extrabold tracking-wider text-zinc-400 uppercase">
              {displayedRestaurants.length} RESTAURANTS DELIVERING TO YOU
            </h2>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">Featured</p>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-72 bg-[#1e1e1e] rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {displayedRestaurants.map((res) => (
                <LargeRestaurantCard key={`feed-${res.id}`} restaurant={res} />
              ))}
            </div>
          )}
        </div>

      </div>

      <BottomNav />

      {/* FULL-SCREEN PROFILE MENU OVERLAY */}
      {showProfile && (
        <ProfileMenu onClose={() => setShowProfile(false)} />
      )}
    </div>
  );
}

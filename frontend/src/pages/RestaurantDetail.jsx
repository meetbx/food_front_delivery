import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLocation } from '../context/LocationContext';
import { API_BASE } from '../config';

export default function RestaurantDetail() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. FIXED: Destructured activeAddress from useLocation
  const { activeAddress, activeLat, activeLng } = useLocation();
  const [estimatedTime, setEstimatedTime] = useState(restaurant?.delivery_time || '25-35 min');
  
  // Search & Filter state inside menu
  const [menuSearch, setMenuSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [bookmarkedItems, setBookmarkedItems] = useState({});

  // Safely extract cart context
  const cartContext = useCart() || {};
  const { cart = [], addToCart = () => {}, removeFromCart = () => {} } = cartContext;

  // Safe quantity checker checking both nested (i.item.id) and flat (i.id) structures
  const getItemQuantity = (itemId) => {
    try {
      const itemsList = Array.isArray(cart) ? cart : (cart?.items || []);
      const found = itemsList.find(
        (entry) =>
          (entry.item?.id || entry.item?.menu_item_id || entry.id || entry.item_id) === itemId
      );
      return found ? Number(found.quantity || found.qty || 1) : 0;
    } catch (e) {
      return 0;
    }
  };

  const toggleBookmark = (itemId) => {
    setBookmarkedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  useEffect(() => {
    setLoading(true);

    // Determine coordinates strictly from saved active address
    const targetLat = activeAddress?.latitude || activeAddress?.lat || activeLat;
    const targetLng = activeAddress?.longitude || activeAddress?.lng || activeLng;

    const params = new URLSearchParams();

    // Pass saved address ID if available, otherwise pass raw coordinates
    if (activeAddress?.id) {
      params.append('address_id', activeAddress.id);
    }
    if (targetLat) params.append('lat', targetLat);
    if (targetLng) params.append('lng', targetLng);

    const queryString = params.toString();
    // REPLACE: const url = `http://localhost:5000/api/restaurants/${id}${queryString ? `?${queryString}` : ''}`;
    const url = `${API_BASE}/api/restaurants/${id}${queryString ? `?${queryString}` : ''}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.restaurant) {
          setRestaurant(data.restaurant);
          setMenu(data.menu || []);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching restaurant detail:', err);
        setLoading(false);
      });
  }, [id, activeAddress, activeLat, activeLng]); // Re-fetch whenever saved address changes
  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] text-white p-4 sm:p-6 max-w-2xl mx-auto space-y-4 animate-pulse">
        <div className="flex justify-between items-center pt-2">
          <div className="w-9 h-9 bg-zinc-800 rounded-full" />
          <div className="w-24 h-9 bg-zinc-800 rounded-full" />
        </div>
        <div className="h-40 bg-zinc-800 rounded-2xl" />
        <div className="h-12 bg-zinc-800 rounded-xl" />
        <div className="h-44 bg-zinc-800 rounded-2xl" />
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-[#121212] text-white p-8 flex flex-col items-center justify-center text-center">
        <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-zinc-800 max-w-md w-full shadow-xl">
          <p className="text-red-400 font-bold text-lg mb-4">Restaurant not found</p>
          <Link
            to="/"
            className="inline-block px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition"
          >
            ← Back to All Restaurants
          </Link>
        </div>
      </div>
    );
  }

  // Filtered Menu Logic
  const filteredMenu = menu.filter((item) => {
    const matchesSearch = item.name?.toLowerCase().includes(menuSearch.toLowerCase()) ||
      item.description?.toLowerCase().includes(menuSearch.toLowerCase());
    
    if (activeFilter === 'Highly reordered') return matchesSearch && (item.is_bestseller || item.rating > 4);
    if (activeFilter === 'Veg') return matchesSearch && item.is_veg;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#121212] text-white pb-28">
      <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5">
        
        {/* TOP ACTION BAR */}
        <div className="flex items-center justify-between pt-1">
          <Link
            to="/"
            aria-label="Back"
            className="w-10 h-10 rounded-full bg-[#1c232d] border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="bg-[#1c232d] border border-white/10 text-zinc-300 hover:text-white px-3.5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition"
            >
              <svg className="w-4 h-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <span>Search</span>
            </button>

            <button aria-label="More Options" className="w-10 h-10 rounded-full bg-[#1c232d] border border-white/10 flex items-center justify-center text-zinc-300 hover:text-white transition">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Collapsible Search Input */}
        {showSearch && (
          <div className="bg-[#1a1a1a] p-2.5 rounded-2xl border border-zinc-800 flex items-center gap-2 transition-all">
            <svg className="w-5 h-5 text-zinc-400 ml-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder="Search within menu..."
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-white text-sm placeholder-zinc-500 font-medium"
              autoFocus
            />
            {menuSearch && (
              <button onClick={() => setMenuSearch('')} className="text-zinc-400 hover:text-white text-xs pr-2 font-bold">
                Clear
              </button>
            )}
          </div>
        )}

        {/* RESTAURANT HEADER INFO CARD */}
        <div className="bg-[#181818] rounded-3xl p-5 border border-zinc-800/80 shadow-2xl relative space-y-3">
          
          {/* Pure Veg / Non-Veg Tag */}
          <div className="inline-flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-600/40 text-emerald-400 text-[11px] font-extrabold px-2.5 py-1 rounded-md">
            <span>🍃</span>
            <span>{restaurant.type === 'Veg' || restaurant.isVeg ? 'Pure Veg' : 'Multi Cuisine'}</span>
          </div>

          {/* Restaurant Title & Rating */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight flex items-center gap-2">
                {restaurant.name}
                <span className="text-zinc-500 text-base cursor-pointer hover:text-zinc-300">ⓘ</span>
              </h1>
            </div>

            {/* Rating Badge */}
            <div className="flex flex-col items-end shrink-0">
              <div className="bg-emerald-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-md">
                <span>★</span>
                <span>{restaurant.rating || '4.0'}</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-semibold underline decoration-dotted mt-1">
                By 300+
              </span>
            </div>
          </div>

          {/* Location & Delivery Info */}
          <div className="space-y-1 text-xs text-zinc-300 font-medium">
            <div className="flex items-center gap-1.5">
              <span>📍</span>
              <span>{restaurant.distance || '5.3 km'} · {restaurant.address || restaurant.location || 'Adalaj'}</span>
              <span className="text-zinc-500 text-[10px]">▼</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span>🌧️</span>
              <span>{restaurant.delivery_time || '30-35 mins'} · Schedule for later</span>
              <span className="text-zinc-500 text-[10px]">▼</span>
            </div>
          </div>

          {/* Frequently Reordered Badge */}
          <div className="pt-1">
            <span className="inline-flex items-center gap-1.5 bg-[#222933] border border-emerald-500/30 text-emerald-400 text-[11px] font-bold px-3 py-1 rounded-full">
              <span className="text-emerald-400">✓</span> Frequently reordered
            </span>
          </div>

          <div className="border-t border-zinc-800/80 my-2" />

          {/* Offers Line */}
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-300 pt-0.5">
            <div className="flex items-center gap-2">
              <span className="text-blue-400 text-base">🉐</span>
              <span>Items up to 50% off</span>
            </div>
            <button className="text-zinc-400 hover:text-white flex items-center gap-1 text-[11px]">
              6 offers <span>▼</span>
            </button>
          </div>
        </div>

        {/* FILTER CHIPS */}
        <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-1">
          <button
            onClick={() => setActiveFilter('All')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 border transition ${
              activeFilter === 'All'
                ? 'bg-zinc-800 text-white border-zinc-600'
                : 'bg-[#181818] text-zinc-400 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <span>⚙️ Filters</span>
            <span className="text-[10px]">▼</span>
          </button>

          <button
            onClick={() => setActiveFilter(activeFilter === 'Highly reordered' ? 'All' : 'Highly reordered')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 border transition ${
              activeFilter === 'Highly reordered'
                ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                : 'bg-[#181818] text-zinc-300 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <span>🔄</span> Highly reordered
          </button>

          <button
            onClick={() => setActiveFilter(activeFilter === 'Veg' ? 'All' : 'Veg')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 border transition ${
              activeFilter === 'Veg'
                ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                : 'bg-[#181818] text-zinc-300 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <span>🌶️</span> Spicy
          </button>

          <button className="px-3.5 py-1.5 bg-[#181818] border border-zinc-800 text-zinc-300 rounded-xl text-xs font-bold shrink-0 hover:border-zinc-700">
            👶 Kids Special
          </button>
        </div>

        {/* MENU CATEGORY SECTION */}
        <div className="pt-2 space-y-4">
          <div className="flex items-center justify-between cursor-pointer border-b border-zinc-800 pb-3">
            <h2 className="text-lg font-extrabold text-white tracking-tight">
              Best in Menu ({filteredMenu.length})
            </h2>
            <span className="text-zinc-400 text-xs">▲</span>
          </div>

          {/* Menu Items List */}
          {filteredMenu.length === 0 ? (
            <div className="bg-[#181818] border border-dashed border-zinc-800 rounded-2xl p-8 text-center text-zinc-500 font-medium">
              No menu items match your selection.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60">
              {filteredMenu.map((item) => {
                const itemId = item.id || item.menu_item_id;
                const qty = getItemQuantity(itemId);
                const isBookmarked = !!bookmarkedItems[itemId];
                const originalPrice = item.original_price || (item.price ? Math.round(item.price * 1.5) : null);

                return (
                  <div
                    key={itemId || item.name}
                    className="py-5 flex justify-between gap-4 items-start first:pt-0"
                  >
                    {/* LEFT DETAILS COLUMN */}
                    <div className="flex-1 space-y-1.5 pr-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center p-0.5 ${
                            item.is_veg !== false
                              ? 'border-emerald-500'
                              : 'border-rose-500'
                          }`}
                        >
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.is_veg !== false
                                ? 'bg-emerald-500'
                                : 'bg-rose-500'
                            }`}
                          />
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-zinc-100 leading-snug">
                        {item.name}
                      </h3>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-extrabold text-white">
                          ₹{item.price}
                        </span>
                        {originalPrice && (
                          <span className="text-xs text-zinc-500 line-through font-semibold">
                            ₹{originalPrice}
                          </span>
                        )}
                        <span className="text-xs font-extrabold text-blue-400">
                          50% OFF
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}

                      <p className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase pt-0.5">
                        NOT ELIGIBLE FOR COUPONS
                      </p>

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => toggleBookmark(itemId)}
                          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark item'}
                          className={`p-1.5 rounded-full border transition ${
                            isBookmarked
                              ? 'bg-zinc-800 border-amber-500 text-amber-400'
                              : 'border-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                        >
                          <svg className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button>

                        <button aria-label="Share item" className="p-1.5 rounded-full border border-zinc-800 text-zinc-400 hover:text-white transition">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* RIGHT IMAGE & ADD BUTTON COLUMN */}
                    <div className="relative shrink-0 flex flex-col items-center">
                      <div className="w-32 h-32 rounded-2xl overflow-hidden bg-zinc-800 border border-zinc-800 shadow-md">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-zinc-600 font-bold">
                            No Photo
                          </div>
                        )}
                      </div>

                      {/* ADD / QUANTITY CONTROL OVERLAY BUTTON */}
                      <div className="absolute -bottom-2.5 z-10">
                        {qty === 0 ? (
                          <button
                            onClick={() => addToCart(item, restaurant)}
                            className="bg-[#0f241a] hover:bg-[#143324] text-emerald-400 border border-emerald-500/60 font-black text-sm px-6 py-1.5 rounded-xl shadow-xl transition active:scale-95 flex items-center gap-1"
                          >
                            <span>ADD</span>
                            <span className="text-xs text-emerald-500 font-normal">+</span>
                          </button>
                        ) : (
                          <div className="bg-emerald-600 text-white font-extrabold text-sm rounded-xl flex items-center shadow-xl border border-emerald-400 overflow-hidden">
                            <button
                              onClick={() => removeFromCart(itemId)}
                              className="px-3 py-1 hover:bg-emerald-700 transition"
                            >
                              −
                            </button>
                            <span className="px-2 text-xs">{qty}</span>
                            <button
                              onClick={() => addToCart(item, restaurant)}
                              className="px-3 py-1 hover:bg-emerald-700 transition"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>

                      <span className="text-[10px] text-zinc-500 font-medium pt-4">
                        customisable
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* FLOATING MENU BUTTON */}
      <div className="fixed bottom-6 right-6 z-50">
        <button className="bg-[#2a2d34] border border-white/20 text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 hover:bg-[#32363e] active:scale-95 transition">
          <span>🍴</span>
          <span>Menu</span>
        </button>
      </div>
    </div>
  );
}
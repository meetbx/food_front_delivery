import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function LargeRestaurantCard({ restaurant }) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Fallbacks for data properties
  const rating = restaurant.rating || 4.1;
  const deliveryTime = restaurant.delivery_time || '25-30 mins';
  const priceForTwo = restaurant.price_for_two || 350;
  const offerText = restaurant.offer || '40% OFF up to ₹80 above ₹99';
  const isVeg = restaurant.is_veg || restaurant.isVeg || false;

  return (
    <Link 
      to={`/restaurant/${restaurant.id}`} 
      className="block bg-[#1a1a1a] rounded-3xl overflow-hidden border border-white/5 hover:border-white/10 transition-all shadow-lg group"
    >
      {/* 1. Image Container with Overlays */}
      <div className="relative h-56 sm:h-64 w-full overflow-hidden">
        <img
          src={restaurant.image_url || 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600'}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Top-Left Featured Dish Tag */}
        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-white/10 shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-500 border border-emerald-300"></span>
          <span className="truncate max-w-[150px] sm:max-w-[200px]">
            {restaurant.name} Special
          </span>
          <span className="text-zinc-400">·</span>
          <span className="font-bold">₹{Math.round(priceForTwo / 2)}</span>
        </div>

        {/* Top-Right Bookmark Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            setIsBookmarked(!isBookmarked);
          }}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/40 backdrop-blur-md text-white hover:bg-black/60 transition-colors"
          aria-label="Bookmark restaurant"
        >
          <svg 
            className={`w-5 h-5 ${isBookmarked ? 'fill-white text-white' : 'fill-none stroke-white'}`} 
            viewBox="0 0 24 24" 
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>

        {/* Bottom Banner inside Image (Gold Delivery + Carousel Dots) */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-1.5 flex items-center justify-between text-white text-xs font-bold shadow-inner">
          <div className="flex items-center gap-1.5">
            <span>Free delivery with Gold</span>
          </div>

          {/* Pagination Dots */}
          <div className="flex items-center gap-1 opacity-80">
            <span className="w-2 h-1 bg-white rounded-full"></span>
            <span className="w-1 h-1 bg-white/50 rounded-full"></span>
            <span className="w-1 h-1 bg-white/50 rounded-full"></span>
            <span className="w-1 h-1 bg-white/50 rounded-full"></span>
          </div>
        </div>
      </div>

      {/* 2. Restaurant Info Section */}
      <div className="p-4 space-y-2">
        {/* Title and Rating Row */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-black text-white group-hover:text-amber-400 transition-colors tracking-tight">
            {restaurant.name}
          </h3>

          <div className="flex flex-col items-end shrink-0">
            <div className="bg-emerald-700 text-white px-2 py-0.5 rounded-lg flex items-center gap-1 text-xs font-bold shadow-sm">
              <span>★</span>
              <span>{rating}</span>
            </div>
            <span className="text-[10px] text-zinc-500 mt-0.5">By 100+</span>
          </div>
        </div>

        {/* Delivery Time & Distance */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-medium">
          <span className="text-emerald-400">⚡</span>
          <span>{deliveryTime}</span>
          <span className="text-zinc-600">|</span>
          <span>3.3 km</span>
        </div>

        {/* Offer Row */}
        <div className="flex items-center gap-1.5 text-xs text-blue-400 font-bold">
          <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 20 20">
            <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.57l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.57l7-10a1 1 0 011.12-.384z" />
          </svg>
          <span className="truncate">{offerText}</span>
        </div>

        {/* Pure Veg Badge (If applicable) */}
        {isVeg && (
          <div className="pt-1">
            <span className="inline-flex items-center gap-1.5 bg-white/5 text-zinc-300 text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-white/10">
              <span>🌱</span>
              <span>Pure Veg restaurant</span>
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
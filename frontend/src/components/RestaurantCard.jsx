import { Link } from 'react-router-dom';

export default function RestaurantCard({ restaurant }) {
  // Support both snake_case API data and fallback UI fields
  const imageUrl = restaurant.image_url || restaurant.image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80';
  const deliveryTime = restaurant.delivery_time || restaurant.deliveryTime || '30-35 mins';
  const offer = restaurant.offer || restaurant.discount || '₹125 OFF above ₹449';

  return (
    <Link 
      to={`/restaurant/${restaurant.id}`} 
      className="w-[140px] sm:w-[150px] shrink-0 block group cursor-pointer"
    >
      {/* Top Square Image with Badges */}
      <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#1e1e1e] border border-white/10 shadow-md">
        <img
          src={imageUrl}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Gradient Dark Overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

        {/* Top Offer Badge */}
        {offer && (
          <div className="absolute top-1.5 left-1.5 right-1.5 bg-black/60 backdrop-blur-md text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-md truncate text-center border border-white/10 shadow-sm">
            {offer}
          </div>
        )}

        {/* Bottom Left Rating Badge */}
        <div className="absolute bottom-1.5 left-1.5 bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5 shadow-md">
          <span>★</span>
          <span>{restaurant.rating || '4.0'}</span>
        </div>
      </div>

      {/* Details Below Image */}
      <div className="mt-2 space-y-0.5">
        <h3 className="font-bold text-xs text-white truncate group-hover:text-emerald-400 transition-colors leading-tight">
          {restaurant.name}
        </h3>

        <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-400">
          {restaurant.isNearFast ? (
            <span className="text-emerald-400 flex items-center gap-0.5">
              ⚡ Near & Fast
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <span className="text-[10px]">⏱️</span> {deliveryTime}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
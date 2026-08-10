import { useState, useEffect, useRef } from 'react';

const BANNERS = [
  {
    id: 1,
    title: 'PAYDAY PARTY',
    subtitle: 'Up to 60% OFF on Top Brands',
    buttonText: 'ORDER NOW',
    bgGradient: 'from-blue-600 via-indigo-700 to-purple-900',
    accentColor: 'bg-pink-500 hover:bg-pink-600',
    badge: 'LIMITED TIME',
    // Example image URL or replace with your banner artwork asset
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 2,
    title: 'CRAZY CRAVINGS',
    subtitle: 'Flat ₹120 Cashback on Burgers & Pizza',
    buttonText: 'EXPLORE DEALS',
    bgGradient: 'from-amber-600 via-orange-600 to-red-700',
    accentColor: 'bg-yellow-400 text-black hover:bg-yellow-300',
    badge: 'FEATURED',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
  },
];

export default function BannerSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Auto-slide every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Mobile Touch Gestures (Swipe support)
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;

    // Swipe left -> next slide
    if (distance > 50) {
      setCurrentIndex((prev) => (prev + 1) % BANNERS.length);
    }
    // Swipe right -> previous slide
    else if (distance < -50) {
      setCurrentIndex((prev) => (prev - 1 + BANNERS.length) % BANNERS.length);
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl shadow-xl">
      {/* Banner Container */}
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {BANNERS.map((banner) => (
          <div
            key={banner.id}
            className={`w-full shrink-0 relative bg-gradient-to-r ${banner.bgGradient} rounded-2xl p-4 sm:p-5 text-white flex items-center justify-between min-h-[160px] select-none`}
          >
            {/* Curtains / Decorative Background Elements */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Banner Left Content */}
            <div className="relative z-10 max-w-[60%] space-y-2">
              <span className="inline-block px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-md text-[9px] font-black tracking-widest uppercase">
                {banner.badge}
              </span>

              <h2 className="text-xl sm:text-2xl font-black italic tracking-tight leading-none drop-shadow-md">
                {banner.title}
              </h2>

              <p className="text-xs font-medium text-white/90 line-clamp-2">
                {banner.subtitle}
              </p>

              {/* Call to Action Button */}
              <button
                className={`mt-2 px-4 py-2 rounded-full font-black text-xs tracking-wider shadow-lg flex items-center gap-1 transition-transform active:scale-95 ${banner.accentColor}`}
              >
                <span>{banner.buttonText}</span>
                <span className="text-sm">›</span>
              </button>
            </div>

            {/* Banner Right Image Artwork */}
            <div className="relative z-10 w-28 h-28 sm:w-36 sm:h-36 shrink-0 rounded-xl overflow-hidden border-2 border-white/20 shadow-2xl transform rotate-2">
              <img
                src={banner.image}
                alt={banner.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Dots (Matches Zomato UI) */}
      <div className="absolute bottom-2.5 left-1/2 transform -translate-x-1/2 flex items-center gap-1.5 z-20">
        {BANNERS.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              currentIndex === index
                ? 'w-5 bg-white'
                : 'w-2 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
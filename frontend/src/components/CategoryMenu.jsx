import { useState, useEffect } from 'react';

const CATEGORIES = [
  { id: 'All', name: 'All', image: '/categories/all.webp' },
  { id: 'Pizza', name: 'Pizza', image: '/categories/pizza.webp' },
  { id: 'Burgers', name: 'Burger', image: '/categories/burger.webp' },
  { id: 'Cake', name: 'Cake', image: '/categories/cake.webp' },
  { id: 'Thali', name: 'Thali', image: '/categories/thali.webp' },
  { id: 'vadapav', name: 'Vadapav', image: '/categories/vadapav.webp' },
  { id: 'Sandwich', name: 'Sandwich', image: '/categories/sandwich.webp' },
  { id: 'Biryani', name: 'Biryani', image: '/categories/biryani.webp' },
  { id: 'Chinese', name: 'Chinese', image: '/categories/Chinese.webp' },
];

export default function CategoryMenu({ activeCategory = 'All', onSelectCategory }) {
  const [selected, setSelected] = useState(activeCategory);

  useEffect(() => {
    setSelected(activeCategory);
  }, [activeCategory]);

  const handleSelect = (catId) => {
    setSelected(catId);
    if (onSelectCategory) {
      onSelectCategory(catId);
    }
  };

  return (
    <div className="w-full py-2">
      <div className="flex items-center gap-6 overflow-x-auto px-2 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map((cat) => {
          const isActive = selected.toLowerCase() === cat.id.toLowerCase();

          return (
            <button
              key={cat.id}
              onClick={() => handleSelect(cat.id)}
              className="group flex flex-col items-center flex-shrink-0 cursor-pointer relative pb-2 focus:outline-none"
            >
              {/* Direct Dish Image (No Circle Wrapper Container) */}
              <div className="w-20 h-16 sm:w-24 sm:h-20 flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-contain filter drop-shadow-xl"
                />
              </div>

              {/* Category Title */}
              <span
                className={`text-xs sm:text-sm font-semibold mt-1 transition-colors ${
                  isActive ? 'text-white font-bold' : 'text-zinc-400 group-hover:text-zinc-200'
                }`}
              >
                {cat.name}
              </span>

              {/* Active Underline Indicator */}
              {isActive && (
                <span className="absolute bottom-0 left-2 right-2 h-[3px] bg-emerald-500 rounded-full transition-all" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

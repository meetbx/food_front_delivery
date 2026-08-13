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
    <div className="w-full py-3 bg-[#121212]">
      {/* Added classes below to hide scrollbars across Chrome, Safari, Firefox, and Edge */}
      <div className="flex items-center gap-5 overflow-x-auto px-4 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map((cat) => {
          const isActive = selected.toLowerCase() === cat.id.toLowerCase();

          return (
            <button
              key={cat.id}
              onClick={() => handleSelect(cat.id)}
              className="group flex flex-col items-center flex-shrink-0 cursor-pointer relative pb-3 transition-all focus:outline-none"
            >
              {/* Dark Circular Dish Plate */}
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#1e1e1e] border border-[#333333] flex items-center justify-center p-2 shadow-md transition-all duration-200 group-hover:scale-105 ${
                  isActive ? 'scale-105 border-emerald-500/50 shadow-emerald-950/30' : 'opacity-90 hover:opacity-100'
                }`}
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-110 transition-transform duration-200"
                />
              </div>

              {/* Category Title */}
              <span
                className={`text-xs font-semibold mt-2 transition-colors ${
                  isActive ? 'text-white font-bold' : 'text-zinc-400 group-hover:text-zinc-200'
                }`}
              >
                {cat.name}
              </span>

              {/* Active Emerald Underline Bar */}
              {isActive && (
                <span className="absolute bottom-0 left-1 right-1 h-[3px] bg-emerald-500 rounded-full transition-all" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

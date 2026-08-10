import React from 'react';

const EXPLORE_ITEMS = [
  {
    id: 'offers',
    title: 'Offers',
    badgeText: '%',
    badgeColor: 'bg-blue-600',
    icon: (
      <div className="relative w-11 h-11 flex items-center justify-center">
        {/* Blue Discount Tag */}
        <svg className="w-10 h-10 text-blue-500 drop-shadow-md transform -rotate-12" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.707 2.293a1 1 0 00-.707-.293H4a2 2 0 00-2 2v8a1 1 0 00.293.707l10 10a1 1 0 001.414 0l8-8a1 1 0 000-1.414l-10-10zM7 7a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
        </svg>
        <span className="absolute text-white font-black text-xs transform -rotate-12 top-2 left-2">%</span>
        {/* Sparkles */}
        <span className="absolute -top-1 -right-1 text-xs text-blue-300 animate-pulse">✨</span>
      </div>
    ),
  },
  {
    id: 'food-on-train',
    title: 'Food\non train',
    icon: (
      <div className="relative w-12 h-11 flex items-center justify-center">
        {/* Blue Speed Arrow Badge */}
        <div className="absolute inset-0 bg-blue-600/90 rounded-r-full rounded-l-md transform -skew-x-12 scale-90 shadow-sm" />
        {/* Train Icon */}
        <svg className="relative z-10 w-9 h-9 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-4-4-8-4zm0 2c3.71 0 5.88.35 6 1.83H6c.12-1.48 2.29-1.83 6-1.83zm-5 8c-.83 0-1.5-.67-1.5-1.5S6.17 9 7 9s1.5.67 1.5 1.5S7.83 12 7 12zm10 0c-.83 0-1.5-.67-1.5-1.5S16.17 9 17 9s1.5.67 1.5 1.5S17.83 12 17 12zm-5 5H7v-2h10v2z" />
        </svg>
      </div>
    ),
  },
  {
    id: 'plan-party',
    title: 'Plan\na party',
    icon: (
      <div className="relative w-11 h-11 flex items-center justify-center">
        {/* Disco Ball & Feast Elements */}
        <span className="text-3xl transform hover:rotate-12 transition-transform">🪩</span>
        <span className="absolute -bottom-1 -left-1 text-base">🥤</span>
        <span className="absolute -bottom-1 -right-1 text-base">🍱</span>
      </div>
    ),
  },
  {
    id: 'collections',
    title: 'Collections',
    icon: (
      <div className="relative w-11 h-11 flex items-center justify-center">
        {/* Stacked Cards with Burger Bookmark */}
        <div className="absolute w-8 h-9 bg-amber-100 border border-amber-300 rounded-md transform -rotate-6 shadow-xs" />
        <div className="relative z-10 w-9 h-10 bg-white rounded-md p-1 shadow-md border border-zinc-200 flex flex-col items-center justify-between">
          <div className="w-full h-2 bg-red-500 rounded-t-sm" />
          <span className="text-base leading-none mb-1">🍔</span>
        </div>
      </div>
    ),
  },
  {
    id: 'gift-cards',
    title: 'Gift\ncards',
    icon: (
      <div className="relative w-11 h-11 flex items-center justify-center">
        {/* Diamond Origami Envelope */}
        <div className="w-10 h-10 bg-gradient-to-tr from-rose-500 to-pink-500 rounded-lg transform rotate-45 shadow-md flex items-center justify-center border border-pink-300/40">
          <span className="text-white text-xs font-bold transform -rotate-45">🎁</span>
        </div>
      </div>
    ),
  },
];

export default function ExploreMore({ onSelect }) {
  return (
    <div className="my-5 space-y-3">
      {/* Header matching exact Zomato typography */}
      <h3 className="text-[11px] font-extrabold tracking-widest text-zinc-400 uppercase px-1">
        EXPLORE MORE
      </h3>

      {/* Horizontal Scroll Bar */}
      <div className="flex items-center gap-3 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 sm:mx-0 sm:px-0 py-1">
        {EXPLORE_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect && onSelect(item.id)}
            className="w-[98px] h-[105px] shrink-0 bg-[#1a1f29] hover:bg-[#222938] border border-[#2d3748]/60 rounded-2xl p-2.5 flex flex-col items-center justify-between shadow-lg active:scale-95 transition-all duration-150 cursor-pointer text-center group"
          >
            {/* Icon Graphic Container */}
            <div className="mt-1 flex items-center justify-center h-12 w-full group-hover:scale-105 transition-transform duration-200">
              {item.icon}
            </div>

            {/* Title (Supports multi-line text) */}
            <span className="text-[12px] font-bold text-zinc-200 group-hover:text-white leading-tight whitespace-pre-line mb-0.5">
              {item.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
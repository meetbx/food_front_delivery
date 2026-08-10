import React from 'react';

export default function BottomNav() {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[#1e1e1e]/90 backdrop-blur-md border border-[#333333] px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-2xl z-50">
      {/* Delivery Tab */}
      <button className="bg-[#2d2d2d] text-emerald-400 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 shadow">
        <span>🚚 Delivery</span>
      </button>

      {/* Quick Filter Tab */}
      <button className="text-zinc-400 hover:text-white px-3 py-2 rounded-full text-xs font-medium">
        Under ₹250
      </button>

      {/* Dining Tab */}
      <button className="text-zinc-400 hover:text-white px-3 py-2 rounded-full text-xs font-medium">
        🍽️ Dining
      </button>

      {/* External App Link */}
      <button className="bg-amber-400 text-black px-3.5 py-2 rounded-full text-xs font-black flex items-center gap-0.5 shadow-lg hover:bg-amber-300">
        <span>blinkit</span>
        <span className="text-sm">↗</span>
      </button>
    </div>
  );
}
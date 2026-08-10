import React, { useState } from 'react';
import { useLocation } from '../context/LocationContext';
import SelectLocationModal from './SelectLocationModal';

export default function LocationHeader() {
  const { activeAddress } = useLocation();
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex flex-col text-left p-0 bg-transparent focus:outline-none select-none cursor-pointer border-none max-w-[200px]"
      >
        <div className="flex items-center gap-1 font-bold text-base text-white">
          <span>{activeAddress?.tag || 'Home'}</span>
          <span className="text-xs text-gray-400">▼</span>
        </div>
        <p className="text-xs text-gray-400 truncate w-full">
          {activeAddress?.address || 'Select Location'}
        </p>
      </button>

      {showModal && <SelectLocationModal onClose={() => setShowModal(false)} />}
    </>
  );
}
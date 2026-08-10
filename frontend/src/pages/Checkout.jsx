import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLocation } from '../context/LocationContext';
import { useAuth } from '../context/AuthContext';
import CustomerAuthModal from '../components/CustomerAuthModal';
import GoogleAddressModal from '../components/GoogleAddressModal';
import { apiFetch } from '../config';

export default function Checkout() {
  const navigate = useNavigate();

  // Contexts
  const { user, token } = useAuth() || {};
  const { cart = [], clearCart, currentRestaurant, addToCart, removeFromCart } = useCart() || {};
  const locationCtx = useLocation ? useLocation() : {};
  const activeAddress = locationCtx?.activeAddress || null;

  // Address & Checkout States
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [address, setAddress] = useState('');
  const [deliveryCoords, setDeliveryCoords] = useState({ lat: null, lng: null });

  // Dynamic Delivery Time State
  const [deliveryTime, setDeliveryTime] = useState(
    currentRestaurant?.delivery_time || '25-35 min'
  );
  const [isCalculatingEta, setIsCalculatingEta] = useState(false);

  // UI & Modal States
  const [paymentMethod, setPaymentMethod] = useState('PhonePe UPI');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showBillSummary, setShowBillSummary] = useState(false);
  const [tipAmount, setTipAmount] = useState(0);

  // Normalize cart items array
  const cartList = Array.isArray(cart)
    ? cart
    : Array.isArray(cart?.items)
    ? cart.items
    : [];

  const activeRestaurantId =
    currentRestaurant?.id ||
    cartList[0]?.restaurant?.id ||
    cartList[0]?.restaurant_id ||
    1;

  // Helper function to safely extract formatted address without 'undefined'
  const getFormattedAddress = (addrObj) => {
    if (!addrObj) return '';
    if (typeof addrObj === 'string') return addrObj;

    const houseNo = addrObj.house_number || addrObj.house_no || addrObj.flat_no || addrObj.building || '';
    const mainAddress = 
      addrObj.full_address || 
      addrObj.address || 
      addrObj.address_line1 || 
      addrObj.street || 
      addrObj.formatted_address || 
      '';
    const city = addrObj.city || addrObj.district || '';

    const parts = [];
    if (houseNo) parts.push(houseNo);
    if (mainAddress) parts.push(mainAddress);
    if (city && !mainAddress.toLowerCase().includes(city.toLowerCase())) parts.push(city);

    return parts.join(', ');
  };

  // 1. Fetch saved addresses from backend
  useEffect(() => {
    if (token) {
      fetchSavedAddresses();
    }
  }, [token]);

  const fetchSavedAddresses = async () => {
    try {
      const response = await apiFetch('/api/addresses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const addressList = Array.isArray(data) ? data : data.addresses || [];
        setSavedAddresses(addressList);

        if (addressList.length > 0) {
          const defaultAddr = addressList.find((a) => a.is_default) || addressList[0];
          applySelectedAddress(defaultAddr);
        }
      }
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
    }
  };

  const applySelectedAddress = (addrObj) => {
    if (!addrObj) return;
    
    setSelectedAddressId(addrObj.id || addrObj._id || null);
    
    const formattedText = getFormattedAddress(addrObj);
    setAddress(formattedText);

    // Support all latitude/longitude property variants
    const rawLat = addrObj.latitude ?? addrObj.lat ?? addrObj.location?.lat ?? null;
    const rawLng = addrObj.longitude ?? addrObj.lng ?? addrObj.location?.lng ?? null;

    const parsedLat = rawLat !== null && rawLat !== undefined ? parseFloat(rawLat) : null;
    const parsedLng = rawLng !== null && rawLng !== undefined ? parseFloat(rawLng) : null;
    
    setDeliveryCoords({
      lat: !isNaN(parsedLat) ? parsedLat : null,
      lng: !isNaN(parsedLng) ? parsedLng : null
    });
  };

  // Sync active address fallback from Location Context
  useEffect(() => {
    if (!selectedAddressId && activeAddress && !address) {
      const formatted = getFormattedAddress(activeAddress);
      setAddress(formatted);
      if (activeAddress.lat && activeAddress.lng) {
        setDeliveryCoords({ 
          lat: parseFloat(activeAddress.lat), 
          lng: parseFloat(activeAddress.lng) 
        });
      }
    }
  }, [activeAddress, selectedAddressId]);

  // ⚡ AUTOMATICALLY RECALCULATE ETA WHEN ADDRESS / COORDINATES CHANGE
  useEffect(() => {
    const fetchUpdatedEta = async () => {
      // If coordinates or restaurant aren't available, keep current fallback
      if (!deliveryCoords.lat || !deliveryCoords.lng || !activeRestaurantId) {
        return;
      }

      setIsCalculatingEta(true);

      try {
        const response = await apiFetch(`/api/restaurants/${activeRestaurantId}?lat=${deliveryCoords.lat}&lng=${deliveryCoords.lng}`);


        if (response.ok) {
          const data = await response.json();
          const targetRestaurant = data.restaurant || data;
          if (targetRestaurant?.delivery_time) {
            const rawTime = targetRestaurant.delivery_time;
            const formattedTime = rawTime.toLowerCase().includes('min')
              ? rawTime
              : `${rawTime} mins`;
            setDeliveryTime(formattedTime);
          }
        }
      } catch (err) {
        console.error('Failed to recalculate ETA on address change:', err);
      } finally {
        setIsCalculatingEta(false);
      }
    };

    fetchUpdatedEta();
  }, [deliveryCoords.lat, deliveryCoords.lng, activeRestaurantId]);

  // Calculate totals
  const itemTotal = cartList.reduce((sum, entry) => {
    const itemObj = entry.item || entry.menu_item || entry;
    const rawPrice = entry.price ?? itemObj.price ?? 0;
    const numericPrice = typeof rawPrice === 'number'
      ? rawPrice
      : parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0;
    const quantity = Number(entry.quantity || entry.qty || entry.count || 1);
    return sum + numericPrice * quantity;
  }, 0);

  const deliveryFee = itemTotal > 0 ? 44 : 0;
  const platformFee = itemTotal > 0 ? 14.90 : 0;
  const gstTax = Math.round(itemTotal * 0.05 * 100) / 100;
  const finalTotal = (itemTotal + deliveryFee + platformFee + gstTax + tipAmount).toFixed(2);
const handlePlaceOrder = async (e) => {
  e?.preventDefault();

  const activeUser = user;
  if (!activeUser) {
    setIsAuthModalOpen(true);
    return;
  }

  // Validate address selection
  if (!address || !address.trim()) {
    alert('Please select or enter a delivery address.');
    return;
  }

  if (!cartList || cartList.length === 0) {
    alert('Your cart is empty!');
    return;
  }

  setIsSubmitting(true);

  // Send selectedAddressId, address string, and coordinates explicitly
  const orderPayload = {
    user_id: activeUser.id || activeUser.user_id,
    address_id: selectedAddressId || null,               // Explicitly passes selected ID (e.g., 1, 2, 3, or 4)
    restaurant_id: activeRestaurantId,
    delivery_address: address,                           // Passes selected address text
    delivery_latitude: deliveryCoords?.lat || null,       // Passes selected latitude
    delivery_longitude: deliveryCoords?.lng || null,     // Passes selected longitude
    payment_method: paymentMethod,
    payment_status: paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid',
    item_total: itemTotal,
    tax: gstTax,
    delivery_fee: deliveryFee,
    platform_fee: platformFee,
    tip_amount: tipAmount,
    final_total: parseFloat(finalTotal),
    items: cartList,
  };

  try {
    const response = await apiFetch('/api/orders', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(orderPayload),
    });

    const data = await response.json();

    if (response.ok) {
      if (clearCart) clearCart();
      const createdOrderId = data.order_id || data.orderId || data.order?.id || response.data.id;
      navigate(`/order-tracking/${createdOrderId}`);
    } else {
      alert(data.message || 'Failed to place order.');
    }
  } catch (error) {
    console.error('Order error:', error);
    alert('Error connecting to backend server.');
  } finally {
    setIsSubmitting(false);
  }
};

  if (cartList.length === 0) {
    return (
      <div className="min-h-screen bg-[#141418] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-[#222228] rounded-full flex items-center justify-center text-2xl mb-4">🛒</div>
        <h2 className="text-xl font-bold mb-1">Your cart is empty</h2>
        <p className="text-zinc-400 text-xs mb-6">Add items from a restaurant to proceed with checkout.</p>
        <Link 
          to="/" 
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs rounded-xl transition"
        >
          Browse Restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141418] text-white pb-36">
      {/* HEADER BAR */}
      <div className="sticky top-0 z-20 bg-[#141418]/95 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="w-8 h-8 rounded-full bg-[#222228] flex items-center justify-center text-zinc-300 hover:text-white"
          >
            ←
          </button>
          <div>
            <h1 className="text-sm font-bold leading-tight">
              {currentRestaurant?.name || cartList[0]?.restaurant?.name || 'Restaurant'}
            </h1>
            <p className="text-[11px] text-zinc-400 flex items-center gap-1">
              <span>{isCalculatingEta ? 'Calculating ETA...' : deliveryTime} to</span>
              <span className="font-bold text-white">Home</span>
              <span className="text-[9px]">▼</span>
            </p>
          </div>
        </div>
        <button className="w-8 h-8 rounded-full bg-[#222228] flex items-center justify-center text-zinc-300 hover:text-white text-xs">
          ↗
        </button>
      </div>

      {/* LOCATION WARNING BANNER */}
      <div className="bg-[#242010] text-amber-200 text-xs px-4 py-2 border-b border-amber-500/20 text-center font-medium">
        Selected address is active for delivery
      </div>

      <div className="max-w-md mx-auto p-4 space-y-3.5">

        {/* ITEMS IN CART CARD */}
        <div className="bg-[#1c1c22] rounded-2xl p-4 border border-white/5 space-y-3">
          {cartList.map((entry, idx) => {
            const itemObj = entry.item || entry.menu_item || entry;
            const itemId = itemObj.id || entry.id;
            const qty = Number(entry.quantity || entry.qty || 1);
            const price = Number(itemObj.price || entry.price || 0);

            return (
              <div key={idx} className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <div className="w-3.5 h-3.5 rounded-sm border border-emerald-500 flex items-center justify-center mt-1 shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight">{itemObj.name}</h3>
                    <button className="text-[11px] text-zinc-400 flex items-center gap-0.5 mt-0.5">
                      <span>Edit</span>
                      <span className="text-[9px]">▶</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-[#132a20] border border-emerald-600/50 text-emerald-400 font-bold text-xs rounded-lg flex items-center px-2 py-0.5">
                    <button onClick={() => removeFromCart && removeFromCart(itemId)} className="pr-1.5 text-sm">−</button>
                    <span className="px-1 text-white">{qty}</span>
                    <button onClick={() => addToCart && addToCart(itemObj, currentRestaurant)} className="pl-1.5 text-sm">+</button>
                  </div>
                  <span className="text-sm font-bold min-w-[50px] text-right">₹{price * qty}</span>
                </div>
              </div>
            );
          })}

          <div className="pt-2 flex items-center gap-3 border-t border-white/5">
            <button 
              onClick={() => navigate(-1)}
              className="flex-1 bg-[#25252e] text-emerald-400 border border-emerald-500/20 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 hover:bg-[#2c2c36] transition"
            >
              <span>+</span> Add more items
            </button>
            <button className="flex-1 bg-[#25252e] text-zinc-300 border border-white/5 text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-1.5 hover:bg-[#2c2c36] transition">
              <span>📄</span> Add note
            </button>
          </div>
        </div>

        {/* DYNAMIC DELIVERY ESTIMATE CARD */}
        <div className="bg-[#1c1c22] rounded-2xl p-4 border border-white/5 flex items-start gap-3">
          <span className="text-emerald-400 text-base mt-0.5">⚡</span>
          <div>
            <h4 className="text-xs font-bold text-white">
              {isCalculatingEta ? (
                <span className="animate-pulse text-emerald-400">Updating delivery time...</span>
              ) : (
                `Delivery in ${deliveryTime}`
              )}
            </h4>
            <p className="text-[11px] text-zinc-400 underline decoration-dotted mt-0.5 cursor-pointer">
              Want this later? Schedule it
            </p>
          </div>
        </div>

        {/* DELIVERY ADDRESS CARD */}
        <div 
          onClick={() => {
            if (!user) {
              setIsAuthModalOpen(true);
            } else {
              setShowAddressSelector(true);
            }
          }}
          className="bg-[#1c1c22] hover:bg-[#22222a] cursor-pointer transition rounded-2xl p-4 border border-white/5 space-y-3"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <span className="text-zinc-400 text-sm mt-0.5">📍</span>
              <div>
                <h4 className="text-xs font-bold text-white">
                  Delivery at <span className="text-emerald-400">Home</span>
                </h4>
                <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5 pr-2">
                  {address || 'Select delivery address'}
                </p>
              </div>
            </div>
            <span className="text-zinc-400 hover:text-white text-xs mt-0.5">❯</span>
          </div>

          <div className="border-t border-white/5 pt-2">
            <button className="text-[11px] text-zinc-300 font-semibold underline decoration-dotted">
              Add instructions for delivery partner
            </button>
          </div>

          <div className="border-t border-white/5 pt-2 flex items-center justify-between text-xs text-zinc-300">
            <div className="flex items-center gap-2">
              <span>📞</span>
              <span>Meet, {user?.phone || user?.name || user?.email || '+91-XXXXXXXXXX'}</span>
            </div>
            <span className="text-zinc-500">❯</span>
          </div>
        </div>

        {/* TOTAL BILL CARD */}
        <div 
          onClick={() => setShowBillSummary(true)}
          className="bg-[#1c1c22] hover:bg-[#22222a] cursor-pointer transition rounded-2xl p-4 border border-white/5 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="text-zinc-400 text-sm">🧾</span>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                Total Bill <span className="text-sm">₹{finalTotal}</span>
              </h4>
              <p className="text-[10px] text-zinc-400">Incl. taxes and charges</p>
            </div>
          </div>
          <span className="text-zinc-400 text-xs">❯</span>
        </div>

      </div>

      {/* STICKY BOTTOM PAY BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#16161c] border-t border-white/10 p-3 px-4 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-2 text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="bg-indigo-950/80 text-indigo-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-indigo-500/30">
              PAY USING
            </span>
            <select 
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="bg-transparent text-white font-bold text-xs outline-none cursor-pointer"
            >
              <option value="PhonePe UPI" className="bg-[#1c1c22]">PhonePe UPI</option>
              <option value="Google Pay" className="bg-[#1c1c22]">Google Pay</option>
              <option value="Cash on Delivery" className="bg-[#1c1c22]">Cash on Delivery</option>
            </select>
          </div>
          <span className="text-zinc-400 text-[10px]">▲</span>
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={isSubmitting || isCalculatingEta}
          className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-98 transition text-white font-extrabold text-sm py-3 px-4 rounded-xl flex items-center justify-between shadow-lg shadow-emerald-950/50 disabled:opacity-50"
        >
          <div className="text-left leading-tight">
            <div className="text-xs font-black">₹{finalTotal}</div>
            <div className="text-[9px] font-medium text-emerald-200">TOTAL</div>
          </div>
          <div className="flex items-center gap-1">
            <span>{isSubmitting ? 'Placing Order...' : 'Place Order'}</span>
            <span className="text-base">▶</span>
          </div>
        </button>
      </div>

      {/* SELECT AN ADDRESS BOTTOM SHEET MODAL */}
      {showAddressSelector && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-[#18181c] border-t border-white/10 rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-1">
              <h3 className="text-lg font-bold text-white">Select an address</h3>
              <button 
                onClick={() => setShowAddressSelector(false)}
                className="w-8 h-8 rounded-full bg-[#25252b] text-zinc-300 hover:text-white flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Add Address Action */}
            <div 
              onClick={() => {
                setShowAddressSelector(false);
                setEditingAddress(null);
                setIsAddressModalOpen(true);
              }}
              className="bg-[#212127] hover:bg-[#282830] transition rounded-2xl p-4 border border-white/5 flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3 text-emerald-400 font-bold text-sm">
                <span className="text-lg">+</span>
                <span>Add Address</span>
              </div>
              <span className="text-zinc-400 text-xs">❯</span>
            </div>

            {/* SAVED ADDRESSES LIST */}
            <div className="space-y-3 pt-2">
              <div className="text-[11px] font-bold text-zinc-400 tracking-wider uppercase">
                SAVED ADDRESSES
              </div>

              {savedAddresses.length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center">No saved addresses found.</p>
              ) : (
                savedAddresses.map((addr) => {
                  const addrId = addr.id || addr._id;
                  const isSelected = selectedAddressId === addrId;
                  const formattedText = getFormattedAddress(addr);

                  return (
                    <div
                      key={addrId || Math.random()}
                      onClick={() => {
                        applySelectedAddress(addr);
                        setShowAddressSelector(false);
                      }}
                      className={`bg-[#212127] hover:bg-[#282830] transition rounded-2xl p-4 border cursor-pointer relative space-y-2 ${
                        isSelected ? 'border-emerald-500/60' : 'border-white/5'
                      }`}
                    >
                      <div className="text-[10px] font-extrabold text-blue-400 tracking-wider uppercase">
                        DELIVERS TO
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="text-zinc-300 mt-0.5 text-base">🏠</div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-white capitalize">
                              {addr.label || addr.type || 'Home'}
                            </h4>
                            <span className="text-[10px] text-zinc-400">0 m</span>
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed">
                            {formattedText}
                          </p>
                          <p className="text-xs text-zinc-400 pt-0.5">
                            Phone number: {addr.phone || user?.phone || '+91-XXXXXXXXXX'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAddressSelector(false);
                            setEditingAddress(addr);
                            setIsAddressModalOpen(true);
                          }}
                          className="w-7 h-7 rounded-full bg-[#2a2a32] flex items-center justify-center text-zinc-300 text-xs hover:text-white"
                        >
                          ✏️
                        </button>
                        <button className="w-7 h-7 rounded-full bg-[#2a2a32] flex items-center justify-center text-zinc-300 text-xs hover:text-white">
                          ↗
                        </button>
                        <button className="w-7 h-7 rounded-full bg-[#2a2a32] flex items-center justify-center text-zinc-300 text-xs hover:text-white">
                          📷
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}

      {/* BILL SUMMARY MODAL */}
      {showBillSummary && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-[#18181c] border-t border-white/10 rounded-t-3xl p-5 space-y-5 max-h-[85vh] overflow-y-auto">
            
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Bill Summary</h3>
              <button 
                onClick={() => setShowBillSummary(false)}
                className="w-8 h-8 rounded-full bg-[#25252b] text-zinc-300 hover:text-white flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#212127] rounded-2xl p-4 border border-white/5 space-y-3 text-xs">
              <div className="flex justify-between text-zinc-200">
                <span>Item total</span>
                <span className="font-bold">₹{itemTotal}</span>
              </div>

              <div className="flex justify-between text-zinc-200">
                <div>
                  <div>Delivery partner fee for 1.2 km</div>
                  <div className="text-[10px] text-zinc-400">Goes to them for their time and effort</div>
                </div>
                <span className="font-bold">₹{deliveryFee}</span>
              </div>

              <div className="flex justify-between text-zinc-200 border-t border-white/5 pt-2">
                <span className="underline decoration-dotted">Platform fee</span>
                <span className="font-bold">₹{platformFee}</span>
              </div>

              <div className="flex justify-between text-zinc-200">
                <span className="underline decoration-dotted">GST (govt. taxes)</span>
                <span className="font-bold">₹{gstTax}</span>
              </div>

              {tipAmount > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold border-t border-white/5 pt-2">
                  <span>Delivery Tip</span>
                  <span>₹{tipAmount}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-extrabold text-white border-t border-white/10 pt-3">
                <span>To pay</span>
                <span>₹{finalTotal}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-[11px] font-bold text-zinc-400 tracking-wider text-center uppercase">
                GRATITUDE CORNER
              </div>

              <div className="bg-[#212127] rounded-2xl p-4 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Tip your delivery partner</h4>
                    <p className="text-[10px] text-zinc-400 max-w-[200px] mt-0.5">
                      They'll get notified instantly. The full tip is sent after delivery
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-[#2d1b22] rounded-full flex items-center justify-center text-xl shrink-0">
                    👨‍✈️
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-1">
                  {[20, 30, 50].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setTipAmount(tipAmount === amt ? 0 : amt)}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${
                        tipAmount === amt
                          ? 'bg-[#132a20] border-emerald-500 text-emerald-300'
                          : 'bg-[#2a2a32] border-white/5 text-zinc-300 hover:bg-[#32323c]'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      const val = prompt('Enter custom tip amount in ₹:');
                      if (val && !isNaN(val)) setTipAmount(Number(val));
                    }}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      tipAmount > 0 && ![20, 30, 50].includes(tipAmount)
                        ? 'bg-[#132a20] border-emerald-500 text-emerald-300'
                        : 'bg-[#2a2a32] border-white/5 text-zinc-300 hover:bg-[#32323c]'
                    }`}
                  >
                    Other
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODALS */}
      <CustomerAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => fetchSavedAddresses()}
      />

      <GoogleAddressModal
        isOpen={isAddressModalOpen}
        onClose={() => {
          setIsAddressModalOpen(false);
          setEditingAddress(null);
        }}
        onSaveAddress={(formData) => {
          applySelectedAddress(formData);
          setIsAddressModalOpen(false);
          fetchSavedAddresses();
        }}
        initialData={editingAddress}
      />
    </div>
  );
}

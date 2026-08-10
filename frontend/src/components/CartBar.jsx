import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export default function CartBar() {
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Pull clearCart along with cart state
  const { totalItems = 0, totalPrice = 0, currentRestaurant = null, clearCart } = useCart() || {};

  // 2. Hide CartBar if cart is empty OR user is on Checkout / Order Tracking pages
  const isCheckoutOrTrackingPage =
    location.pathname === '/checkout' || location.pathname.startsWith('/order-tracking');

  if (totalItems === 0 || isCheckoutOrTrackingPage) {
    return null;
  }

  // 3. Extract restaurant details
  const restName = currentRestaurant?.name || currentRestaurant?.restaurant_name || 'Restaurant';
  const restImage = currentRestaurant?.image_url || currentRestaurant?.image || currentRestaurant?.logo;
  const restId = currentRestaurant?.id || currentRestaurant?._id;

  // 4. Handle Cancel / Clear Cart
  const handleCancelCart = () => {
    if (window.confirm('Clear all items from your cart?')) {
      clearCart(); // 👈 Empty cart state and clear localStorage
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-xl mx-auto z-50">
      <div className="bg-[#18181b] border border-zinc-800 text-white rounded-2xl p-2.5 px-3.5 shadow-2xl flex items-center justify-between gap-3">
        
        {/* Left Side: Restaurant Image & Details */}
        <div 
          onClick={() => restId && navigate(`/restaurant/${restId}`)} 
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
        >
          {restImage ? (
            <img
              src={restImage}
              alt={restName}
              className="w-11 h-11 rounded-full object-cover border border-zinc-700 flex-shrink-0"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-sm text-emerald-400 flex-shrink-0">
              {restName.charAt(0)}
            </div>
          )}

          <div className="flex flex-col min-w-0">
            <h4 className="text-white font-bold text-sm sm:text-base truncate leading-tight">
              {restName}
            </h4>
            <span className="text-zinc-400 text-xs font-medium flex items-center gap-0.5 hover:text-white transition mt-0.5">
              View Menu <span className="text-[10px]">›</span>
            </span>
          </div>
        </div>

        {/* Right Side: View Cart Button & Clear (X) Button */}
        <div className="flex items-center gap-3 flex-shrink-0">
<button
  type="button"
  onClick={() => navigate('/checkout')}
  disabled={totalItems === 0}
  aria-label={`View cart with ${totalItems} items totaling ${totalPrice} rupees`}
  className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 text-white px-5 py-2 rounded-full flex flex-col items-center justify-center transition-all shadow-md"
>
  <span className="font-bold text-xs sm:text-sm leading-tight">View Cart</span>
  <span className="text-[10px] sm:text-xs font-medium text-emerald-100 opacity-90 leading-tight">
    {totalItems} {totalItems === 1 ? 'item' : 'items'} • ₹{totalPrice}
  </span>
</button>

          {/* Cancel / Clear Cart Button */}
          <button
            onClick={handleCancelCart}
            aria-label="Clear cart"
            title="Clear cart"
            className="text-zinc-400 hover:text-red-400 p-1 rounded-full hover:bg-zinc-800 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  );
}
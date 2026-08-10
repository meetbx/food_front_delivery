import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  // 1. Load initial cart safely from localStorage
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('crave_cart');
      const parsed = savedCart ? JSON.parse(savedCart) : [];
      console.log('🛒 Initialized Cart from LocalStorage:', parsed);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to load cart from localStorage:', e);
      return [];
    }
  });

  // 2. Persist cart changes with error handling
  useEffect(() => {
    try {
      localStorage.setItem('crave_cart', JSON.stringify(cart));
      console.log('💾 Cart saved to LocalStorage. Current items count:', cart.length);
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }, [cart]);

  // Helper to extract ID cleanly regardless of database field names (_id, id, menu_item_id)
  const getItemId = (item) => {
    if (!item) return null;
    return item.id || item._id || item.menu_item_id || item.itemId;
  };

  const addToCart = (item, restaurant = {}) => {
    if (!item) {
      console.warn('addToCart called without an item!');
      return;
    }

    const targetId = getItemId(item);
    console.log('➕ Adding item to cart:', { targetId, item, restaurant });

    // Clean restaurant metadata object (includes image_url for CartBar UI)
    const cleanRestaurant = {
      id: restaurant?.id || restaurant?._id || restaurant?.restaurant_id || item?.restaurant_id || 1,
      name: restaurant?.name || restaurant?.restaurant_name || item?.restaurant_name || 'Restaurant',
      image_url:
        restaurant?.image_url ||
        restaurant?.image ||
        restaurant?.restaurant_image ||
        restaurant?.logo ||
        restaurant?.img_url ||
        item?.restaurant_image ||
        item?.image_url ||
        '',
    };

    setCart((prevCart) => {
      // Check if switching restaurants
      if (
        prevCart.length > 0 &&
        prevCart[0]?.restaurant?.id &&
        cleanRestaurant.id &&
        String(prevCart[0].restaurant.id) !== String(cleanRestaurant.id)
      ) {
        const confirmReplace = window.confirm(
          `Your cart contains items from another restaurant. Replace it with items from "${cleanRestaurant.name}"?`
        );
        if (!confirmReplace) return prevCart;
        return [{ item, restaurant: cleanRestaurant, quantity: 1 }];
      }

      const existingIndex = prevCart.findIndex(
        (entry) => String(getItemId(entry.item || entry)) === String(targetId)
      );

      if (existingIndex > -1) {
        const updated = [...prevCart];
        const existingEntry = updated[existingIndex];
        updated[existingIndex] = {
          ...existingEntry,
          restaurant: cleanRestaurant, // Updates restaurant info (with image_url)
          quantity: (existingEntry.quantity || 1) + 1,
        };
        return updated;
      }

      return [...prevCart, { item, restaurant: cleanRestaurant, quantity: 1 }];
    });
  };

  const removeFromCart = (rawItemId) => {
    setCart((prevCart) => {
      const targetId = String(rawItemId);
      const existingIndex = prevCart.findIndex(
        (entry) => String(getItemId(entry.item || entry)) === targetId
      );

      if (existingIndex === -1) return prevCart;

      const updated = [...prevCart];
      const existingEntry = updated[existingIndex];

      if (existingEntry.quantity > 1) {
        updated[existingIndex] = {
          ...existingEntry,
          quantity: existingEntry.quantity - 1,
        };
        return updated;
      }

      return updated.filter(
        (entry) => String(getItemId(entry.item || entry)) !== targetId
      );
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('crave_cart');
  };

  const totalItems = cart.reduce((sum, c) => sum + (Number(c.quantity) || 0), 0);
  const totalPrice = cart.reduce((sum, c) => {
    const p = Number(c.item?.price) || 0;
    const q = Number(c.quantity) || 0;
    return sum + p * q;
  }, 0);
  
  // Derives restaurant details (including image_url) from the first cart item
  const currentRestaurant = cart.length > 0 ? cart[0].restaurant : null;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        totalItems,
        totalPrice,
        currentRestaurant,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
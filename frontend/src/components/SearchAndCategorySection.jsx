import React, { useState, useEffect } from 'react';
import { apiFetch } from '../config'; // Ensure path matches your project structure

const categories = ['All', 'Pizzas', 'Burgers', 'Biryani', 'Chinese', 'Desserts'];

export default function SearchAndCategorySection() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Fetch All Restaurants (Default view)
  const fetchAllRestaurants = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/restaurants');
      if (!res.ok) throw new Error('Failed to fetch restaurants');
      const data = await res.json();
      setRestaurants(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Restaurants by Category
  const fetchCategoryRestaurants = async (category) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/categories/${encodeURIComponent(category)}/restaurants`);
      if (!res.ok) throw new Error('Failed to fetch category results');
      const data = await res.json();
      setRestaurants(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Fetch Search Results (Query against dishes & restaurant names)
  const fetchSearchResults = async (query) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Failed to execute search');
      const data = await res.json();
      setRestaurants(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. DEBOUNCE EFFECT FOR LIVE SEARCH (300ms Delay)
  useEffect(() => {
    if (searchTerm.trim() !== '') {
      const debounceTimer = setTimeout(() => {
        fetchSearchResults(searchTerm.trim());
      }, 300);

      return () => clearTimeout(debounceTimer);
    } else {
      if (selectedCategory === 'All') {
        fetchAllRestaurants();
      } else {
        fetchCategoryRestaurants(selectedCategory);
      }
    }
  }, [searchTerm]);

  // Initial load
  useEffect(() => {
    fetchAllRestaurants();
  }, []);

  // Handler for category clicks
  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setSearchTerm('');

    if (category === 'All') {
      fetchAllRestaurants();
    } else {
      fetchCategoryRestaurants(category);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* --- SEARCH BAR --- */}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search for restaurants, dishes (e.g. pizza, burger)..."
          style={{
            width: '100%',
            padding: '12px 18px',
            fontSize: '16px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* --- CATEGORY PILLS --- */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '5px' }}>
        {categories.map((cat) => {
          const isActive = selectedCategory === cat && searchTerm === '';
          return (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              style={{
                padding: '8px 18px',
                borderRadius: '20px',
                border: 'none',
                backgroundColor: isActive ? '#ff4757' : '#e0e0e0',
                color: isActive ? '#ffffff' : '#333333',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* --- RESULTS SECTION --- */}
      {loading && <p style={{ color: '#666' }}>Loading restaurants...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {!loading && !error && restaurants.length === 0 && (
        <p style={{ color: '#777', fontSize: '18px' }}>No restaurants or dishes found matching your search.</p>
      )}

      {/* --- RESTAURANT CARDS GRID --- */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {!loading && restaurants.map((item) => {
          const restaurantId = item.restaurant_id || item.id;
          const restaurantName = item.restaurant_name || item.name;
          const image = item.restaurant_image || item.image_url;
          const matchingDishes = item.matching_dishes || [];

          return (
            <div
              key={restaurantId}
              style={{
                border: '1px solid #eee',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                backgroundColor: '#fff'
              }}
            >
              <img
                src={image || 'https://via.placeholder.com/300x180'}
                alt={restaurantName}
                style={{ width: '100%', height: '180px', objectFit: 'cover' }}
              />
              
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{restaurantName}</h3>
                  <span style={{ backgroundColor: '#2ed573', color: '#fff', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }}>
                    ★ {item.rating || '4.0'}
                  </span>
                </div>

                <p style={{ color: '#666', margin: '4px 0', fontSize: '14px' }}>
                  {item.cuisine_type || item.cuisine || 'Multi-Cuisine'} • {item.delivery_time || '30 mins'}
                </p>

                {matchingDishes.length > 0 && (
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed #ddd' }}>
                    <p style={{ fontSize: '12px', color: '#ff4757', fontWeight: 'bold', margin: '0 0 6px 0' }}>
                      Matching Dishes:
                    </p>
                    {matchingDishes.slice(0, 2).map((dish) => (
                      <div key={dish.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#444' }}>
                        <span>{dish.is_veg ? '🟢' : '🔴'} {dish.name}</span>
                        <strong>₹{dish.price}</strong>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
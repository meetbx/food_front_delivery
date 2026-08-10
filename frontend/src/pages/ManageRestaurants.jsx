import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../config';

export default function ManageRestaurants() {

  const [formData, setFormData] = useState({
  name: '',
  cuisine_type: '',
  address: '',
  city: '', // <--- Added city
  image_url: '',
  delivery_time: '30-40 min',
  cost_for_two: ''
    });

  const [restaurants, setRestaurants] = useState([]);
  const [resName, setResName] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [address, setAddress] = useState('');
  const [resImage, setResImage] = useState('');

  const [selectedResId, setSelectedResId] = useState('');
  const [dishName, setDishName] = useState('');
  const [dishDesc, setDishDesc] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [dishImage, setDishImage] = useState('');

  const fetchRestaurants = () => {
    apiFetch('/api/restaurants')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRestaurants(data);
          if (data.length > 0) {
            setSelectedResId(data[0].id);
          }
        } else {
          setRestaurants([]);
        }
      })
      .catch((err) => {
        console.error('Error loading restaurants:', err);
        setRestaurants([]);
      });
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleAddRestaurant = async (e) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/admin/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: resName,
          cuisine_type: cuisine,
          address,
          image_url: resImage,
        }),
      });

      if (res.ok) {
        alert('Restaurant created successfully!');
        setResName('');
        setCuisine('');
        setAddress('');
        setResImage('');
        fetchRestaurants();
      } else {
        alert('Failed to create restaurant');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend server');
    }
  };

  const handleAddDish = async (e) => {
    e.preventDefault();
    if (!selectedResId) {
      alert('Please select or create a restaurant first!');
      return;
    }

    try {
      // REPLACE: const res = await fetch(`http://localhost:5000/api/admin/restaurants/${selectedResId}/menu`, { ... });
        const res = await apiFetch(`/api/admin/restaurants/${selectedResId}/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: dishName,
          description: dishDesc,
          price: dishPrice,
          is_veg: isVeg,
          image_url: dishImage,
        }),
      });

      if (res.ok) {
        alert('Dish added successfully!');
        setDishName('');
        setDishDesc('');
        setDishPrice('');
        setDishImage('');
      } else {
        alert('Failed to add dish');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend server');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Restaurant & Menu Management</h1>
          <p className="text-xs text-gray-500">Onboard new restaurants and add menu items</p>
        </div>
        <div className="flex gap-4">
          <Link to="/admin" className="text-green-600 font-bold text-sm hover:underline">
            Order Admin
          </Link>
          <Link to="/" className="text-red-500 font-bold text-sm hover:underline">
            Customer View
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form 1: Add Restaurant */}
        <form onSubmit={handleAddRestaurant} className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
          <h2 className="font-bold text-lg text-gray-800 border-b pb-2">1. Add New Restaurant</h2>
          
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Restaurant Name</label>
            <input
              type="text"
              required
              value={resName}
              onChange={(e) => setResName(e.target.value)}
              placeholder="e.g., Spice Junction"
              className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Cuisine Type</label>
            <input
              type="text"
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              placeholder="e.g., North Indian, Fast Food"
              className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
            <div>
  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">City</label>
  <input
    type="text"
    placeholder="e.g. Ahmedabad, Mumbai"
    value={formData.city}
    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
    className="w-full border rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-500 outline-none"
    required
  />
        </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Address</label>
            <textarea
              required
              rows="2"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Full address..."
              className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Front Picture (Image URL)</label>
            <input
              type="url"
              value={resImage}
              onChange={(e) => setResImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white font-bold py-2.5 rounded-lg hover:bg-green-700 transition"
          >
            Create Restaurant
          </button>
        </form>

        {/* Form 2: Add Dish */}
        <form onSubmit={handleAddDish} className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
          <h2 className="font-bold text-lg text-gray-800 border-b pb-2">2. Add Dish to Restaurant</h2>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Select Restaurant</label>
            {restaurants.length === 0 ? (
              <p className="text-xs text-amber-600 font-medium p-2 bg-amber-50 rounded border border-amber-200">
                No restaurants yet. Create one first on the left!
              </p>
            ) : (
              <select
                value={selectedResId}
                onChange={(e) => setSelectedResId(e.target.value)}
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
              >
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Dish Name</label>
            <input
              type="text"
              required
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              placeholder="e.g., Paneer Butter Masala"
              className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Price (Rs.)</label>
              <input
                type="number"
                required
                value={dishPrice}
                onChange={(e) => setDishPrice(e.target.value)}
                placeholder="250"
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">Food Type</label>
              <select
                value={isVeg}
                onChange={(e) => setIsVeg(e.target.value === 'true')}
                className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="true">Veg 🟢</option>
                <option value="false">Non-Veg 🔴</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Description</label>
            <input
              type="text"
              value={dishDesc}
              onChange={(e) => setDishDesc(e.target.value)}
              placeholder="Rich gravy with paneer cubes..."
              className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">Dish Picture (Image URL)</label>
            <input
              type="url"
              value={dishImage}
              onChange={(e) => setDishImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full border rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <button
            type="submit"
            disabled={restaurants.length === 0}
            className={`w-full font-bold py-2.5 rounded-lg transition ${
              restaurants.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Add Dish to Menu
          </button>
        </form>
      </div>
    </div>
  );
}
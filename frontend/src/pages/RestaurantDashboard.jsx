import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import RestaurantAddressPicker from '../components/RestaurantAddressPicker';

import { API_BASE } from '../config';

export default function RestaurantDashboard() {
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  
  // Dashboard Navigation Tab ('orders' | 'menu')
  const [activeTab, setActiveTab] = useState('orders');

  // Address Picker Visibility Toggle
  const [showAddressPicker, setShowAddressPicker] = useState(false);

  // Restaurant Image Edit State
  const [isEditingRestImg, setIsEditingRestImg] = useState(false);
  const [restImgUrl, setRestImgUrl] = useState('');
  const [updatingRestImg, setUpdatingRestImg] = useState(false);

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [filter, setFilter] = useState('All');

  // Menu / Dish State
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [addingDish, setAddingDish] = useState(false);

  // New Dish Form State
  const [dishName, setDishName] = useState('');
  const [dishCategory, setDishCategory] = useState('Main Course');
  const [dishDesc, setDishDesc] = useState('');
  const [dishPrice, setDishPrice] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [dishImage, setDishImage] = useState('');

  // Edit Dish Modal State
  const [editingDish, setEditingDish] = useState(null);
  const [updatingDish, setUpdatingDish] = useState(false);

  const restaurantId = restaurant?.id;

  // 1. Verify authentication on load & populate state
  useEffect(() => {
    const storedData = localStorage.getItem('restaurantData');
    if (!storedData) {
      navigate('/restaurant-panel/auth');
      return;
    }
    const parsedData = JSON.parse(storedData);
    setRestaurant(parsedData);
    setRestImgUrl(parsedData.image_url || '');
  }, [navigate]);

  // 2. Fetch live orders
  const fetchOrders = useCallback(async () => {
    if (!restaurantId) return;

    try {
      const response = await fetch(`${API_BASE}/api/restaurant/${restaurantId}/orders`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Error fetching live orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  }, [restaurantId]);

  // 3. Fetch menu items
  const fetchMenu = useCallback(async () => {
    if (!restaurantId) return;
    setLoadingMenu(true);

    try {
      const response = await fetch(`${API_BASE}/api/restaurants/${restaurantId}`);
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data.menu || []);
        if (data.image_url) {
          setRestaurant((prev) => {
            if (prev && data.image_url !== prev.image_url) {
              const updated = { ...prev, image_url: data.image_url };
              localStorage.setItem('restaurantData', JSON.stringify(updated));
              return updated;
            }
            return prev;
          });
        }
      }
    } catch (err) {
      console.error('Error fetching menu items:', err);
    } finally {
      setLoadingMenu(false);
    }
  }, [restaurantId]);

  // Initial fetch + 5-second polling for orders
  useEffect(() => {
    if (!restaurantId) return;

    fetchOrders();
    fetchMenu();

    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [restaurantId, fetchOrders, fetchMenu]);

  // Handle address saved callback
  const handleAddressSaved = (updatedRestaurant) => {
    setRestaurant(updatedRestaurant);
    localStorage.setItem('restaurantData', JSON.stringify(updatedRestaurant));
    // Auto-hide main address box once saved
    setShowAddressPicker(false);
  };

  // Handle Restaurant Image Update
  const handleUpdateRestaurantImage = async (e) => {
    e.preventDefault();
    if (!restaurant?.id) return;

    setUpdatingRestImg(true);
    try {
      const response = await fetch(`${API_BASE}/api/restaurants/${restaurant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: restImgUrl })
      });

      if (response.ok) {
        const updatedRestaurant = { ...restaurant, image_url: restImgUrl };
        setRestaurant(updatedRestaurant);
        localStorage.setItem('restaurantData', JSON.stringify(updatedRestaurant));
        setIsEditingRestImg(false);
        alert('✅ Restaurant photo updated successfully!');
      } else {
        alert('Failed to update restaurant image. Check server endpoint.');
      }
    } catch (err) {
      console.error('Error updating restaurant image:', err);
      alert('Server error while updating image.');
    } finally {
      setUpdatingRestImg(false);
    }
  };

  // Update order status
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setOrders((prev) =>
          prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
        );
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Add Dish Handler
  const handleAddDish = async (e) => {
    e.preventDefault();
    if (!restaurant?.id) return;

    setAddingDish(true);
    try {
      const response = await fetch(`${API_BASE}/api/restaurants/${restaurant.id}/menu`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: dishName,
          category: dishCategory,
          description: dishDesc,
          price: parseFloat(dishPrice),
          is_veg: isVeg,
          image_url: dishImage
        })
      });

      if (response.ok) {
        alert('✅ Dish added successfully!');
        setDishName('');
        setDishDesc('');
        setDishPrice('');
        setDishImage('');
        fetchMenu();
      } else {
        alert('Failed to add dish. Please check your backend connection.');
      }
    } catch (err) {
      console.error('Error adding dish:', err);
      alert('Server error while adding dish.');
    } finally {
      setAddingDish(false);
    }
  };

  // Open Edit Modal for a Specific Dish
  const handleOpenEditModal = (dish) => {
    setEditingDish({ ...dish });
  };

  // Save Updated Dish
  const handleSaveEditDish = async (e) => {
    e.preventDefault();
    if (!editingDish?.id) return;

    setUpdatingDish(true);
    try {
      const response = await fetch(`${API_BASE}/api/menu-items/${editingDish.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingDish.name,
          category: editingDish.category,
          description: editingDish.description,
          price: parseFloat(editingDish.price),
          is_veg: editingDish.is_veg,
          image_url: editingDish.image_url
        })
      });

      if (response.ok) {
        alert('✅ Dish updated successfully!');
        setEditingDish(null);
        fetchMenu();
      } else {
        alert('Failed to update dish. Please check backend endpoint.');
      }
    } catch (err) {
      console.error('Error updating dish:', err);
      alert('Server error while updating dish.');
    } finally {
      setUpdatingDish(false);
    }
  };

  // Delete Dish Handler
  const handleDeleteDish = async (dishId) => {
    if (!window.confirm('Are you sure you want to remove this dish?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/menu-items/${dishId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMenuItems((prev) => prev.filter((item) => item.id !== dishId));
      } else {
        alert('Failed to delete dish.');
      }
    } catch (err) {
      console.error('Error deleting dish:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('restaurantToken');
    localStorage.removeItem('restaurantData');
    navigate('/restaurant-panel/auth');
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === 'All') return true;
    return (o.status || 'Pending').toLowerCase() === filter.toLowerCase();
  });

  if (!restaurant) return null;

  // Check if address is already saved
  const hasSavedAddress = Boolean(restaurant.address || restaurant.full_address || restaurant.location);

  return (
    <div style={styles.dashboard}>
      {/* Top Navigation & Profile Bar */}
      <header style={styles.topBar}>
        <div style={styles.restaurantProfileHeader}>
          <div style={styles.restImgWrapper}>
            <img
              src={restaurant.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'}
              alt={restaurant.name}
              style={styles.restHeaderImg}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4';
              }}
            />
            <button
              onClick={() => setIsEditingRestImg(!isEditingRestImg)}
              style={styles.editRestImgBadge}
              title="Change Restaurant Image"
            >
              📷 Edit
            </button>
          </div>

          <div>
            <h1 style={styles.brandTitle}>{restaurant.name}</h1>
            <p style={styles.brandSubtitle}>
              Partner Panel • {restaurant.city || 'Ahmedabad'}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={styles.navTabs}>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'orders' ? styles.activeTabBtn : {})
            }}
          >
            📋 Live Orders ({orders.filter(o => o.status === 'Pending' || o.status === 'Preparing').length})
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'menu' ? styles.activeTabBtn : {})
            }}
          >
            🍽️ Manage Menu ({menuItems.length})
          </button>
        </div>

        <div style={styles.headerRight}>
          <span style={styles.liveBadge}>● Live Sync Active</span>

          {/* Address Taskbar Button */}
          <button
            onClick={() => setShowAddressPicker((prev) => !prev)}
            style={{
              ...styles.addressTaskbarBtn,
              ...(hasSavedAddress ? styles.addressTaskbarBtnSaved : {})
            }}
            title={restaurant.address || restaurant.full_address || 'Manage Restaurant Location'}
          >
            📍 {hasSavedAddress ? 'Location Set' : 'Add Location'}
          </button>

          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </header>

      {/* Expandable Restaurant Image Modal / Banner Form */}
      {isEditingRestImg && (
        <div style={styles.restImgModal}>
          <form onSubmit={handleUpdateRestaurantImage} style={styles.restImgForm}>
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Update Restaurant Cover / Profile Image URL</label>
              <input
                type="url"
                required
                value={restImgUrl}
                onChange={(e) => setRestImgUrl(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                style={styles.input}
              />
            </div>
            <button type="submit" disabled={updatingRestImg} style={styles.saveRestImgBtn}>
              {updatingRestImg ? 'Saving...' : 'Save Photo'}
            </button>
            <button
              type="button"
              onClick={() => setIsEditingRestImg(false)}
              style={styles.cancelRestImgBtn}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Main Content Container */}
      <main style={styles.content}>
        {/* Address Picker Section - Rendered if unsaved OR explicitly toggled open */}
        {(!hasSavedAddress || showAddressPicker) && (
          <div style={{ marginBottom: '24px' }}>
            <RestaurantAddressPicker 
              restaurant={restaurant} 
              onAddressSaved={handleAddressSaved} 
            />
          </div>
        )}

        {/* ================= TAB 1: LIVE ORDERS ================= */}
        {activeTab === 'orders' && (
          <>
            <div style={styles.filterBar}>
              {['All', 'Pending', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled'].map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    style={{
                      ...styles.filterTab,
                      ...(filter === status ? styles.activeFilterTab : {})
                    }}
                  >
                    {status}
                  </button>
                )
              )}
            </div>

            {loadingOrders ? (
              <div style={styles.centeredMessage}>Loading live orders...</div>
            ) : filteredOrders.length === 0 ? (
              <div style={styles.centeredMessage}>No orders found under "{filter}".</div>
            ) : (
              <div style={styles.grid}>
                {filteredOrders.map((order) => {
                  const currentStatus = order.status || 'Pending';
                  return (
                    <div key={order.id} style={styles.orderCard}>
                      <div style={styles.cardHeader}>
                        <div>
                          <span style={styles.orderId}>Order #{order.id}</span>
                          <div style={styles.orderTime}>
                            {order.created_at
                              ? new Date(order.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : 'Just Now'}
                          </div>
                        </div>
                        <span
                          style={{
                            ...styles.statusTag,
                            ...getStatusBadgeStyle(currentStatus)
                          }}
                        >
                          {currentStatus}
                        </span>
                      </div>

                      <div style={styles.addressBox}>
                        <strong>Delivery Address:</strong>
                        <p style={styles.addressText}>{order.delivery_address || 'Walk-in / Standard'}</p>
                      </div>

                      <div style={styles.itemsList}>
                        <strong style={styles.itemsTitle}>Items Ordered:</strong>
                        {Array.isArray(order.items) && order.items.length > 0 ? (
                          order.items.map((entry, idx) => {
                            const item = entry.item || entry.menu_item || entry;
                            const qty = entry.quantity || entry.qty || 1;
                            const name = item.name || entry.item_name || 'Food Item';
                            return (
                              <div key={idx} style={styles.itemRow}>
                                <span>
                                  <strong style={styles.qtyText}>{qty}x</strong> {name}
                                </span>
                                <span>₹{Number(item.price || entry.price || 0) * qty}</span>
                              </div>
                            );
                          })
                        ) : (
                          <p style={styles.addressText}>Items details available in system.</p>
                        )}
                      </div>

                      <div style={styles.cardFooter}>
                        <div>
                          <div style={styles.totalLabel}>Total Amount</div>
                          <div style={styles.totalValue}>
                            ₹{order.final_total || order.item_total || 0}
                          </div>
                        </div>
                        <span style={styles.paymentMethod}>
                          {order.payment_method || 'COD'} ({order.payment_status || 'Pending'})
                        </span>
                      </div>

                      <div style={styles.actionsBox}>
                        {currentStatus === 'Pending' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'Preparing')}
                            style={{ ...styles.actionBtn, backgroundColor: '#059669' }}
                          >
                            Accept & Prepare
                          </button>
                        )}

                        {currentStatus === 'Preparing' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'Out for Delivery')}
                            style={{ ...styles.actionBtn, backgroundColor: '#0284c7' }}
                          >
                            Send Out for Delivery
                          </button>
                        )}

                        {currentStatus === 'Out for Delivery' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'Delivered')}
                            style={{ ...styles.actionBtn, backgroundColor: '#16a34a' }}
                          >
                            Mark Delivered
                          </button>
                        )}

                        {currentStatus !== 'Delivered' && currentStatus !== 'Cancelled' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'Cancelled')}
                            style={styles.cancelBtn}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ================= TAB 2: MENU & DISH MANAGEMENT ================= */}
        {activeTab === 'menu' && (
          <div style={styles.menuLayout}>
            {/* Left Box: Add Dish Form */}
            <div style={styles.formContainer}>
              <h2 style={styles.sectionHeader}>➕ Add New Dish</h2>
              <form onSubmit={handleAddDish} style={styles.form}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Dish Name *</label>
                  <input
                    type="text"
                    required
                    value={dishName}
                    onChange={(e) => setDishName(e.target.value)}
                    placeholder="e.g. Butter Paneer / Chicken Biryani"
                    style={styles.input}
                  />
                </div>

                <div style={styles.rowTwo}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={dishPrice}
                      onChange={(e) => setDishPrice(e.target.value)}
                      placeholder="299"
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Food Type *</label>
                    <select
                      value={isVeg}
                      onChange={(e) => setIsVeg(e.target.value === 'true')}
                      style={styles.select}
                    >
                      <option value="true">🟢 Veg</option>
                      <option value="false">🔴 Non-Veg</option>
                    </select>
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Category</label>
                  <select
                    value={dishCategory}
                    onChange={(e) => setDishCategory(e.target.value)}
                    style={styles.select}
                  >
                    <option value="Starters">Starters</option>
                    <option value="Main Course">Main Course</option>
                    <option value="Pizzas">Pizzas</option>
                    <option value="Burgers">Burgers</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Description</label>
                  <textarea
                    rows="3"
                    value={dishDesc}
                    onChange={(e) => setDishDesc(e.target.value)}
                    placeholder="Brief description of the ingredients or taste..."
                    style={styles.textarea}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Dish Image URL</label>
                  <input
                    type="url"
                    value={dishImage}
                    onChange={(e) => setDishImage(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    style={styles.input}
                  />
                </div>

                {dishImage && (
                  <div style={styles.imagePreviewBox}>
                    <span style={styles.previewLabel}>Dish Image Preview</span>
                    <img
                      src={dishImage}
                      alt="Preview"
                      style={styles.previewImg}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c';
                      }}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={addingDish}
                  style={styles.submitBtn}
                >
                  {addingDish ? 'Adding Dish...' : '+ Add Dish to Customer Menu'}
                </button>
              </form>
            </div>

            {/* Right Box: Active Dishes List */}
            <div style={styles.menuListContainer}>
              <div style={styles.menuListHeader}>
                <h2 style={styles.sectionHeader}>Active Dishes</h2>
                <span style={styles.badgeCount}>{menuItems.length} items</span>
              </div>

              {loadingMenu ? (
                <div style={styles.centeredMessage}>Loading menu items...</div>
              ) : menuItems.length === 0 ? (
                <div style={styles.emptyMenuBox}>
                  <p style={{ margin: 0, fontWeight: '700', color: '#64748b' }}>No dishes added yet</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
                    Use the form on the left to add your first dish!
                  </p>
                </div>
              ) : (
                <div style={styles.dishListScroll}>
                  {menuItems.map((dish) => (
                    <div key={dish.id} style={styles.dishCard}>
                      <img
                        src={dish.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'}
                        alt={dish.name}
                        style={styles.dishImg}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c';
                        }}
                      />
                      <div style={styles.dishDetails}>
                        <div style={styles.dishHeaderRow}>
                          <span style={{ fontSize: '12px' }}>{dish.is_veg ? '🟢' : '🔴'}</span>
                          <h4 style={styles.dishTitle}>{dish.name}</h4>
                        </div>
                        <span style={styles.dishCategoryTag}>{dish.category || 'Main Course'}</span>
                        <div style={styles.dishPrice}>₹{dish.price}</div>
                        {dish.description && (
                          <p style={styles.dishDescText}>{dish.description}</p>
                        )}
                      </div>

                      <div style={styles.dishControlBtns}>
                        <button
                          onClick={() => handleOpenEditModal(dish)}
                          style={styles.editDishBtn}
                          title="Edit Dish Details"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteDish(dish.id)}
                          style={styles.deleteDishBtn}
                          title="Delete Dish"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* ================= EDIT DISH MODAL ================= */}
      {editingDish && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>✏️ Edit Dish</h3>
              <button onClick={() => setEditingDish(null)} style={styles.closeModalBtn}>✕</button>
            </div>

            <form onSubmit={handleSaveEditDish} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Dish Name *</label>
                <input
                  type="text"
                  required
                  value={editingDish.name || ''}
                  onChange={(e) => setEditingDish({ ...editingDish, name: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.rowTwo}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editingDish.price || ''}
                    onChange={(e) => setEditingDish({ ...editingDish, price: e.target.value })}
                    style={styles.input}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Food Type *</label>
                  <select
                    value={editingDish.is_veg ? 'true' : 'false'}
                    onChange={(e) => setEditingDish({ ...editingDish, is_veg: e.target.value === 'true' })}
                    style={styles.select}
                  >
                    <option value="true">🟢 Veg</option>
                    <option value="false">🔴 Non-Veg</option>
                  </select>
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Category</label>
                <select
                  value={editingDish.category || 'Main Course'}
                  onChange={(e) => setEditingDish({ ...editingDish, category: e.target.value })}
                  style={styles.select}
                >
                  <option value="Starters">Starters</option>
                  <option value="Main Course">Main Course</option>
                  <option value="Pizzas">Pizzas</option>
                  <option value="Burgers">Burgers</option>
                  <option value="Desserts">Desserts</option>
                  <option value="Beverages">Beverages</option>
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  rows="3"
                  value={editingDish.description || ''}
                  onChange={(e) => setEditingDish({ ...editingDish, description: e.target.value })}
                  style={styles.textarea}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Dish Image URL</label>
                <input
                  type="url"
                  value={editingDish.image_url || ''}
                  onChange={(e) => setEditingDish({ ...editingDish, image_url: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setEditingDish(null)} style={styles.cancelRestImgBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={updatingDish} style={styles.saveRestImgBtn}>
                  {updatingDish ? 'Saving...' : 'Update Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// Helper for Status Badge Styling
const getStatusBadgeStyle = (status) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return { backgroundColor: '#fef3c7', color: '#92400e' };
    case 'preparing':
      return { backgroundColor: '#e0f2fe', color: '#075985' };
    case 'out for delivery':
      return { backgroundColor: '#fae8ff', color: '#86198f' };
    case 'delivered':
      return { backgroundColor: '#dcfce7', color: '#166534' };
    case 'cancelled':
      return { backgroundColor: '#fee2e2', color: '#991b1b' };
    default:
      return { backgroundColor: '#f3f4f6', color: '#374151' };
  }
};

const styles = {
  dashboard: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: 'Inter, system-ui, sans-serif'
  },
  topBar: {
    backgroundColor: '#ffffff',
    padding: '16px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0',
    flexWrap: 'wrap',
    gap: '16px'
  },
  restaurantProfileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px'
  },
  restImgWrapper: {
    position: 'relative',
    width: '48px',
    height: '48px'
  },
  restHeaderImg: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    objectFit: 'cover',
    border: '1px solid #cbd5e1'
  },
  editRestImgBadge: {
    position: 'absolute',
    bottom: '-6px',
    right: '-10px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    border: 'none',
    fontSize: '9px',
    padding: '2px 5px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '700'
  },
  brandTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a'
  },
  brandSubtitle: {
    margin: 0,
    fontSize: '12px',
    color: '#64748b'
  },
  restImgModal: {
    backgroundColor: '#f1f5f9',
    padding: '12px 32px',
    borderBottom: '1px solid #e2e8f0'
  },
  restImgForm: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '12px',
    maxWidth: '800px'
  },
  saveRestImgBtn: {
    padding: '10px 16px',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer'
  },
  cancelRestImgBtn: {
    padding: '10px 14px',
    backgroundColor: '#ffffff',
    color: '#64748b',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer'
  },
  navTabs: {
    display: 'flex',
    gap: '8px',
    backgroundColor: '#f1f5f9',
    padding: '4px',
    borderRadius: '8px'
  },
  tabBtn: {
    padding: '8px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  activeTabBtn: {
    backgroundColor: '#ffffff',
    color: '#0f172a',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  addressTaskbarBtn: {
    padding: '8px 12px',
    border: '1px solid #0284c7',
    backgroundColor: '#f0f9ff',
    color: '#0369a1',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    transition: 'all 0.2s ease'
  },
  addressTaskbarBtnSaved: {
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    color: '#334155'
  },
  liveBadge: {
    fontSize: '13px',
    color: '#16a34a',
    fontWeight: '600',
    backgroundColor: '#f0fdf4',
    padding: '4px 10px',
    borderRadius: '12px'
  },
  logoutBtn: {
    padding: '8px 14px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155'
  },
  content: {
    padding: '24px 32px'
  },
  filterBar: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    overflowX: 'auto',
    paddingBottom: '4px'
  },
  filterTab: {
    padding: '8px 16px',
    border: 'none',
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    color: '#64748b',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  activeFilterTab: {
    backgroundColor: '#0f172a',
    color: '#ffffff'
  },
  centeredMessage: {
    textAlign: 'center',
    padding: '60px',
    color: '#64748b',
    fontSize: '16px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px'
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  orderId: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a'
  },
  orderTime: {
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '2px'
  },
  statusTag: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '700'
  },
  addressBox: {
    backgroundColor: '#f8fafc',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '13px'
  },
  addressText: {
    margin: '4px 0 0 0',
    color: '#475569'
  },
  itemsList: {
    fontSize: '13px',
    borderTop: '1px dashed #e2e8f0',
    paddingTop: '10px'
  },
  itemsTitle: {
    display: 'block',
    marginBottom: '6px',
    color: '#334155'
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px',
    color: '#475569'
  },
  qtyText: {
    color: '#e11d48'
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #e2e8f0',
    paddingTop: '10px'
  },
  totalLabel: {
    fontSize: '11px',
    color: '#64748b',
    textTransform: 'uppercase'
  },
  totalValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a'
  },
  paymentMethod: {
    fontSize: '12px',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    padding: '4px 8px',
    borderRadius: '4px'
  },
  actionsBox: {
    display: 'flex',
    gap: '8px',
    marginTop: '4px'
  },
  actionBtn: {
    flex: 1,
    padding: '10px',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer'
  },
  cancelBtn: {
    padding: '10px 14px',
    backgroundColor: '#ffffff',
    color: '#dc2626',
    border: '1px solid #fca5a5',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer'
  },
  menuLayout: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '24px',
    alignItems: 'start'
  },
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
  },
  sectionHeader: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  rowTwo: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  label: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#475569'
  },
  input: {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none'
  },
  select: {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    outline: 'none',
    cursor: 'pointer'
  },
  textarea: {
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
    resize: 'vertical'
  },
  imagePreviewBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  previewLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase'
  },
  previewImg: {
    width: '100%',
    height: '120px',
    objectFit: 'cover',
    borderRadius: '6px',
    border: '1px solid #e2e8f0'
  },
  submitBtn: {
    padding: '12px',
    backgroundColor: '#16a34a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '6px'
  },
  menuListContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
  },
  menuListHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  badgeCount: {
    fontSize: '12px',
    backgroundColor: '#f1f5f9',
    padding: '4px 10px',
    borderRadius: '12px',
    color: '#475569',
    fontWeight: '600'
  },
  emptyMenuBox: {
    padding: '40px',
    textAlign: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px dashed #cbd5e1'
  },
  dishListScroll: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '600px',
    overflowY: 'auto',
    paddingRight: '4px'
  },
  dishCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  dishImg: {
    width: '64px',
    height: '64px',
    borderRadius: '6px',
    objectFit: 'cover',
    flexShrink: 0
  },
  dishDetails: {
    flex: 1,
    minWidth: 0
  },
  dishHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  dishTitle: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '700',
    color: '#0f172a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  dishCategoryTag: {
    fontSize: '11px',
    color: '#64748b',
    backgroundColor: '#e2e8f0',
    padding: '2px 6px',
    borderRadius: '4px',
    display: 'inline-block',
    marginTop: '2px'
  },
  dishPrice: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#16a34a',
    marginTop: '2px'
  },
  dishDescText: {
    margin: '2px 0 0 0',
    fontSize: '11px',
    color: '#94a3b8',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  dishControlBtns: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center'
  },
  editDishBtn: {
    padding: '6px 10px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    color: '#334155'
  },
  deleteDishBtn: {
    padding: '6px 10px',
    border: '1px solid #fee2e2',
    backgroundColor: '#fef2f2',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '16px'
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '12px'
  },
  closeModalBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#64748b'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '8px'
  }
};

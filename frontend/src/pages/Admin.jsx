import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, API_BASE } from '../config';

const STATUSES = ['Placed', 'Preparing', 'Out for Delivery', 'Delivered'];

export default function Admin() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    apiFetch('/api/admin/orders')
      .then((res) => res.json())
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Admin fetch error:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setOrders((prev) =>
          prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
        );
      } else {
        alert('Failed to update order status');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to server');
    }
  };

  const parseAddress = (addr) => {
    if (!addr) return 'N/A';
    if (typeof addr === 'object') return addr.address || JSON.stringify(addr);
    try {
      const parsed = JSON.parse(addr);
      return typeof parsed === 'object' ? parsed.address || addr : addr;
    } catch (e) {
      return addr;
    }
  };

  const parseItems = (items) => {
    if (!items) return [];
    if (Array.isArray(items)) return items;
    try {
      return JSON.parse(items);
    } catch (e) {
      return [];
    }
  };

  if (loading) return <p className="text-center py-10 text-gray-400 text-xs font-semibold">Loading Admin Dashboard...</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Admin Dashboard</h1>
          <p className="text-xs text-gray-500">Live order status management</p>
        </div>
        <Link to="/" className="text-red-500 font-bold text-xs hover:underline">
          Customer View
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 p-6">
          <p className="text-gray-500 font-bold text-sm">No orders placed yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const itemsList = parseItems(order.items);
            const addressString = parseAddress(order.delivery_address);
            const currentStatus = order.status || 'Placed';

            return (
              <div key={order.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex flex-wrap justify-between items-center pb-3 border-b mb-3 gap-2">
                  <div>
                    <span className="font-black text-base text-gray-800">Order #{order.id}</span>
                    <span className="text-xs text-gray-500 ml-2">({order.restaurant_name})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">Status:</span>
                    <select
                      value={currentStatus}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="text-xs font-bold bg-green-50 text-green-700 border border-green-300 rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
                    >
                      {STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="font-bold text-gray-700 mb-1">Items:</p>
                    <ul className="space-y-1 text-gray-600">
                      {itemsList.map((entry, idx) => {
                        const name = entry.item?.name || entry.item_name || entry.name || 'Item';
                        const price = entry.item?.price || entry.price || 0;
                        const qty = entry.quantity || entry.qty || 1;
                        return (
                          <li key={idx}>
                            {qty}x {name} - Rs. {price * qty}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <div>
                    <p className="font-bold text-gray-700 mb-1">Address:</p>
                    <p className="text-gray-600 mb-2">{addressString}</p>
                    <p className="font-black text-sm text-green-600">Total: Rs. {order.final_total}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
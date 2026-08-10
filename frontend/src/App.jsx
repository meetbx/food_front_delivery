import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { LocationProvider } from './context/LocationContext';
import { ThemeProvider } from './context/ThemeContext';
import { RiderAuthProvider } from './context/RiderAuthContext';
import { AuthProvider } from './context/AuthContext';
import TrialTrackingPage from './pages/TrialTrackingPage'; // <-- 1. Import component
// Customer Pages
import Home from './pages/Home';
import RestaurantDetail from './pages/RestaurantDetail';
import Checkout from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';


// Admin & Restaurant Panel Pages
import Admin from './pages/Admin';
import ManageRestaurants from './pages/ManageRestaurants';
import RestaurantAuth from './pages/RestaurantAuth';
import RestaurantDashboard from './pages/RestaurantDashboard';

// Rider Pages
import RiderAuth from './pages/rider/RiderAuth';
import RiderDashboard from './pages/rider/RiderDashboard';

// Global Components
import CartBar from './components/CartBar';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LocationProvider>
          <CartProvider>
            <RiderAuthProvider>
              <Router>
                <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 transition-colors duration-300">
                  <Routes>
                    {/* Customer Routes */}
                    <Route path="/" element={<Home />} />
                    <Route path="/restaurant/:id" element={<RestaurantDetail />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/order-tracking/:id" element={<OrderTracking />} />
                    <Route path="/test-track/:orderId" element={<TrialTrackingPage />} />
                    {/* Rider Routes */}
                    <Route path="/rider/auth" element={<RiderAuth />} />
                    <Route path="/rider/login" element={<RiderAuth />} />
                    <Route path="/rider/register" element={<RiderAuth />} />
                    <Route path="/rider/dashboard" element={<RiderDashboard />} />

                    {/* System Admin Routes */}
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/manage-restaurants" element={<ManageRestaurants />} />

                    {/* Restaurant Partner Panel Routes */}
                    <Route path="/restaurant-panel/auth" element={<RestaurantAuth />} />
                    <Route path="/restaurant-panel/dashboard" element={<RestaurantDashboard />} />
                  </Routes>

                  <CartBar />
                </div>
              </Router>
            </RiderAuthProvider>
          </CartProvider>
        </LocationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
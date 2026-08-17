import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRiderAuth } from '../../context/RiderAuthContext';
import { apiFetch } from '../config'; 

export default function RiderLogin() {
  const navigate = useNavigate();
  const { login } = useRiderAuth();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await apiFetch('/api/rider/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid mobile number or password.');
      }

      // Store context session & redirect
      login(data.rider, data.token);
      navigate('/rider/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white flex items-center justify-center p-4">
      <div className="bg-[#18181b] border border-zinc-800 w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-2xl">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-emerald-400 font-bold text-xl">🛵</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Rider Login</h2>
          <p className="text-zinc-400 text-sm mt-1">Welcome back! Sign in to start delivering</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Mobile Phone Number
            </label>
            <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden focus-within:border-emerald-500 transition">
              <span className="px-3 text-zinc-400 text-sm border-r border-zinc-700 font-medium">+91</span>
              <input
                type="tel"
                maxLength="10"
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-transparent px-3 py-3 text-white placeholder-zinc-500 text-sm outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm outline-none focus:border-emerald-500 transition"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold py-3 rounded-xl transition shadow-lg disabled:opacity-50 mt-2"
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        {/* Switch to Register */}
        <div className="mt-6 text-center text-xs text-zinc-400">
          Don't have a rider account?{' '}
          <Link to="/rider/register" className="text-emerald-400 hover:underline font-semibold">
            Register here
          </Link>
        </div>

      </div>
    </div>
  );
}

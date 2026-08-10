import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRiderAuth } from '../../context/RiderAuthContext';
import { apiFetch } from '../config'; // adjust path as needed

export default function RiderAuth() {
  const navigate = useNavigate();
  const { login } = useRiderAuth();

  // Active Tab: 'login' | 'register'
  const [activeTab, setActiveTab] = useState('login');

  // Login form state
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register multi-step state (1 = Phone, 2 = OTP, 3 = Name/Password)
  const [regStep, setRegStep] = useState(1);
  const [regPhone, setRegPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Status feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Switch tabs reset
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setError('');
    setRegStep(1);
  };

  // ---------------- LOGIN HANDLER (PostgreSQL API) ----------------
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (loginPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!loginPassword) {
      setError('Please enter your password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await apiFetch('/api/rider/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: loginPhone,
          password: loginPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Invalid phone number or password.');
      }

      // Save rider profile and token into React context
      login(data.rider, data.token);
      navigate('/rider/dashboard');
    } catch (err) {
      setError(err.message || 'Connection failed. Ensure backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  // ---------------- REGISTER HANDLERS ----------------
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (regPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // Demo OTP flow - advances to OTP step
      console.log('🔑 [TEST MODE] Default verification OTP is: 1234');
      await new Promise((res) => setTimeout(res, 400));
      setRegStep(2);
    } catch (err) {
      setError('Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value, index) => {
    if (isNaN(value)) return;
    const updatedOtp = [...otp];
    updatedOtp[index] = value.slice(-1);
    setOtp(updatedOtp);

    if (value && index < 3) {
      const nextInput = document.getElementById(`unified-otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`unified-otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.join('').length < 4) {
      setError('Please enter the full 4-digit OTP.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await new Promise((res) => setTimeout(res, 400));
      setRegStep(3);
    } catch (err) {
      setError('Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // ---------------- REGISTER SUBMIT (PostgreSQL API) ----------------
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regName.trim() || regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setError('');
    setLoading(true);

    try {
    const res = await apiFetch('/api/rider/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          phone: regPhone,
          password: regPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

      // Save rider profile and token into React context
      login(data.rider, data.token);
      navigate('/rider/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f12] text-white flex items-center justify-center p-4">
      <div className="bg-[#18181b] border border-zinc-800 w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-2xl">
        {/* Header Icon & Title */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-emerald-400 font-bold text-xl">🛵</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Rider Portal</h2>
          <p className="text-zinc-400 text-xs mt-1">Access your delivery account</p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 mb-6">
          <button
            type="button"
            onClick={() => handleTabSwitch('login')}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'login'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('register')}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'register'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        {/* ================= TAB 1: LOGIN ================= */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Mobile Number
              </label>
              <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden focus-within:border-emerald-500 transition">
                <span className="px-3 text-zinc-400 text-sm border-r border-zinc-700 font-medium">+91</span>
                <input
                  type="tel"
                  maxLength="10"
                  placeholder="9876543210"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ''))}
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
                placeholder="Enter password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm outline-none focus:border-emerald-500 transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold py-3 rounded-xl transition shadow-lg disabled:opacity-50 mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* ================= TAB 2: REGISTER ================= */}
        {activeTab === 'register' && (
          <div>
            {/* Step Progress Dots */}
            <div className="flex items-center justify-between mb-6 px-8">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] transition ${
                      regStep >= s ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-500'
                    }`}
                  >
                    {s}
                  </div>
                  {s < 3 && (
                    <div className={`w-8 sm:w-12 h-0.5 ${regStep > s ? 'bg-emerald-600' : 'bg-zinc-800'}`} />
                  )}
                </div>
              ))}
            </div>

            {/* Step 1: Send OTP */}
            {regStep === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-4">
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
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-transparent px-3 py-3 text-white placeholder-zinc-500 text-sm outline-none"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold py-3 rounded-xl transition shadow-lg disabled:opacity-50"
                >
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            )}

            {/* Step 2: Verify OTP */}
            {regStep === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 text-center">
                    Enter OTP sent to +91 {regPhone}
                  </label>
                  <div className="flex justify-center gap-3">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`unified-otp-${index}`}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleOtpChange(e.target.value, index)}
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        className="w-12 h-14 bg-zinc-900 border border-zinc-700 rounded-xl text-center text-xl font-bold text-emerald-400 focus:border-emerald-500 outline-none transition"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold py-3 rounded-xl transition shadow-lg disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>

                <button
                  type="button"
                  onClick={() => setRegStep(1)}
                  className="w-full text-zinc-400 text-xs hover:text-white transition text-center block"
                >
                  ← Back to phone number
                </button>
              </form>
            )}

            {/* Step 3: Name & Password */}
            {regStep === 3 && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm outline-none focus:border-emerald-500 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Create Password
                  </label>
                  <input
                    type="password"
                    placeholder="Min 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm outline-none focus:border-emerald-500 transition"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold py-3 rounded-xl transition shadow-lg disabled:opacity-50 mt-2"
                >
                  {loading ? 'Saving Profile...' : 'Complete & Start Delivering'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
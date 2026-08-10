import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useRiderAuth } from '../../context/RiderAuthContext';
import { apiFetch } from '../../config'; // Import apiFetch

export default function RiderRegister() {
  const navigate = useNavigate();
  const { login } = useRiderAuth();

  // Step state: 1 = Phone, 2 = OTP, 3 = Name & Password
  const [step, setStep] = useState(1);

  // Form input states
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  // UI status states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Send OTP Handler
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      // Optional: replace with real apiFetch call if backend supports send-otp
      // await apiFetch('/api/rider/send-otp', { method: 'POST', body: JSON.stringify({ phone }) });
      await new Promise((res) => setTimeout(res, 400));
      setStep(2);
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
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
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  // 2. Verify OTP Handler
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 4) {
      setError('Please enter the full 4-digit OTP.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      await new Promise((res) => setTimeout(res, 400));
      setStep(3);
    } catch (err) {
      setError('Invalid OTP code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Complete Registration Handler
  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    if (!name.trim() || password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await apiFetch('/api/rider/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed.');
      }

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
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <span className="text-emerald-400 font-bold text-xl">🛵</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Rider Registration</h2>
          <p className="text-zinc-400 text-sm mt-1">
            {step === 1 && 'Enter your mobile number to get started'}
            {step === 2 && `Enter the OTP sent to +91 ${phone}`}
            {step === 3 && 'Complete your profile details'}
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="flex items-center justify-between mb-8 px-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  step >= s
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                }`}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={`w-12 sm:w-16 h-0.5 transition-all ${
                    step > s ? 'bg-emerald-600' : 'bg-zinc-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        {/* STEP 1: Phone Input */}
        {step === 1 && (
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
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-transparent px-3 py-3 text-white placeholder-zinc-500 text-sm outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold py-3 rounded-xl transition shadow-lg flex items-center justify-center disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Send Verification OTP'}
            </button>
          </form>
        )}

        {/* STEP 2: OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 text-center">
                Enter 4-Digit Security Code
              </label>
              <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-input-${index}`}
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
              onClick={() => setStep(1)}
              className="w-full text-zinc-400 text-xs hover:text-white transition text-center block"
            >
              ← Change Phone Number
            </button>
          </form>
        )}

        {/* STEP 3: Rider Name & Password */}
        {step === 3 && (
          <form onSubmit={handleCompleteRegistration} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm outline-none focus:border-emerald-500 transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold py-3 rounded-xl transition shadow-lg mt-2 disabled:opacity-50"
            >
              {loading ? 'Saving Profile...' : 'Complete & Start Delivering'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-zinc-400">
          Already registered as a rider?{' '}
          <Link to="/rider/login" className="text-emerald-400 hover:underline font-semibold">
            Log in here
          </Link>
        </div>

      </div>
    </div>
  );
}

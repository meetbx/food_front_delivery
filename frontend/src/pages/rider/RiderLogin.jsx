import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://food-delivery-rwor.onrender.com';

export default function RiderLogin() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/rider/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      // Save token and profile locally
      localStorage.setItem(`rider_token_${data.rider.id}`, data.token);
      localStorage.setItem(`rider_profile_${data.rider.id}`, JSON.stringify(data.rider));

      // Redirect specifically to this rider's distinct URL endpoint
      navigate(`/rider/dashboard/${data.rider.id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="w-full max-w-sm bg-[#1e1e1e] p-6 rounded-3xl space-y-4">
        <h2 className="text-xl font-bold text-center">Rider Login</h2>
        {error && <p className="text-red-400 text-xs text-center">{error}</p>}
        
        <input
          type="text"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full bg-[#121212] border border-[#333] rounded-xl p-3 text-xs text-white"
          required
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-[#121212] border border-[#333] rounded-xl p-3 text-xs text-white"
          required
        />

        <button type="submit" className="w-full py-3 bg-[#00b259] font-bold rounded-2xl text-xs">
          Log In
        </button>
      </form>
    </div>
  );
}

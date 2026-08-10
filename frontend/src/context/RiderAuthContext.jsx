import { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../config';

const RiderAuthContext = createContext(null);

export function RiderAuthProvider({ children }) {
  const [rider, setRider] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('rider_token'));
  const [loading, setLoading] = useState(true);

  // 1. Verify saved token on initial app load (Persistent Login)
  useEffect(() => {
    const verifySavedToken = async () => {
      const savedToken = localStorage.getItem('rider_token');

      if (!savedToken) {
        setLoading(false);
        return;
      }

      try {
        // TODO: Update URL to match your backend endpoint (e.g. /api/rider/me)
        const response = await apiFetch('/api/rider/me', {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        });

        if (response.ok) {
          const riderData = await response.json();
          setRider(riderData.rider || riderData);
          setToken(savedToken);
        } else {
          // Token is expired or invalid -> clear storage
          console.warn('Rider token expired or invalid');
          logout();
        }
      } catch (error) {
        console.error('Error verifying rider session:', error);
      } finally {
        setLoading(false);
      }
    };

    verifySavedToken();
  }, []);

  // 2. Login function (Stores token in localStorage & state)
  const login = (riderData, authToken) => {
    localStorage.setItem('rider_token', authToken);
    setToken(authToken);
    setRider(riderData);
  };

  // 3. Logout function (Removes token & resets state)
  const logout = () => {
    localStorage.removeItem('rider_token');
    setToken(null);
    setRider(null);
  };

  // 4. Helper to update rider details (e.g., toggling online status or updating profile)
  const updateRiderState = (updatedFields) => {
    setRider((prev) => (prev ? { ...prev, ...updatedFields } : null));
  };

  return (
    <RiderAuthContext.Provider
      value={{
        rider,
        token,
        loading,
        isAuthenticated: !!rider,
        login,
        logout,
        updateRiderState,
      }}
    >
      {/* Block rendering children until initial token check completes */}
      {loading ? (
        <div className="min-h-screen bg-[#0f0f12] text-emerald-500 flex items-center justify-center font-bold">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs tracking-wider text-zinc-400">Verifying Rider Session...</span>
          </div>
        </div>
      ) : (
        children
      )}
    </RiderAuthContext.Provider>
  );
}

// Custom Hook for accessing rider auth state anywhere
export const useRiderAuth = () => {
  const context = useContext(RiderAuthContext);
  if (!context) {
    throw new Error('useRiderAuth must be used within a RiderAuthProvider');
  }
  return context;
};
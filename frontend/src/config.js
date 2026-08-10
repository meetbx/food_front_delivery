
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://food-delivery-rwor.onrender.com';

// 2. Helper fetch wrapper so you don't repeat headers in 20 files
export const apiFetch = async (endpoint, options = {}) => {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  return response;
};
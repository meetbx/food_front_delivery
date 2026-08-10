import { Navigate } from 'react-router-dom';
import { useRiderAuth } from '../context/RiderAuthContext';

export default function RiderProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useRiderAuth();

  if (loading) return null; // Loading spinner handled in RiderAuthProvider

  if (!isAuthenticated) {
    // Redirect to registration page if not logged in
    return <Navigate to="/rider/register" replace />;
  }

  return children;
}
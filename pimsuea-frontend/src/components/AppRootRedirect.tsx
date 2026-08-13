import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/** App subdomain `/` → dashboard when signed in, otherwise login. */
export function AppRootRedirect() {
  const { user, loading, profile, profileLoading } = useAuth();
  const awaitingInitialProfile = Boolean(user && profileLoading && !profile);

  if (loading || awaitingInitialProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
}

import { Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/** Pages anyone can use (catalog, product, studio). Waits for auth + any guest claim, never redirects. */
export function GuestOkRoute() {
  const { loading } = useAuth();
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" aria-label="Loading" />
      </div>
    );
  }
  return <Outlet />;
}

import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { withNext } from "@/lib/nextPath";

/**
 * Account-only pages (orders, saved designs, checkout, settings).
 * Signed-out visitors and guests go to sign-up and come back here afterwards.
 * Catalog, product pages and the studio are NOT behind this — guests can design.
 */
export function ProtectedRoute() {
  const { user, isGuest, loading, profile, profileLoading } = useAuth();
  const location = useLocation();

  const awaitingInitialProfile = Boolean(user && !isGuest && profileLoading && !profile);
  if (loading || awaitingInitialProfile) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || isGuest) {
    return <Navigate to={withNext('/register', location.pathname + location.search)} replace />;
  }

  return <Outlet />;
}

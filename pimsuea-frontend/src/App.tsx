import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// All non-root routes redirect to / until this date
export const LAUNCH_DATE = new Date('2026-03-27T12:00:00+07:00');
import { Analytics } from '@vercel/analytics/react';
import { Sidebar } from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Catalog from './pages/Catalog';
import ProductDetails from './pages/ProductDetails';
import DesignStudio from './pages/DesignStudio';
import MyOrders from './pages/MyOrders';
import MyProducts from './pages/MyProducts';
import Wallet from './pages/Wallet';
import Order from './pages/Order';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import NewsDetails from './pages/NewsDetails';
import Landing from './pages/Landing';
import NewLanding from './pages/NewLanding';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { RedirectToApp } from './components/RedirectToApp';
import { AppRootRedirect } from './components/AppRootRedirect';
import { isAppHost } from './lib/site';

function MarketingLayout() {
  const preLaunch = !import.meta.env.DEV && new Date() < LAUNCH_DATE;

  return (
    <Routes>
      <Route
        path="/"
        element={preLaunch ? <Landing /> : <NewLanding />}
      />
      <Route path="/home" element={<Navigate to="/" replace />} />
      {preLaunch ? (
        <Route path="*" element={<Navigate to="/" replace />} />
      ) : (
        <Route path="*" element={<RedirectToApp />} />
      )}
    </Routes>
  );
}

function AppLayout() {
  const location = useLocation();
  const hideSidebarRoutes = ['/login', '/register', '/reset-password', '/', '/home', '/onboarding'];
  const shouldShowSidebar = !hideSidebarRoutes.includes(location.pathname)
    && !location.pathname.startsWith('/studio/');
  const preLaunch = !import.meta.env.DEV && new Date() < LAUNCH_DATE;

  if (preLaunch) {
    return (
      <Routes>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {shouldShowSidebar && <Sidebar />}
      <main className={`flex-1 min-w-0 transition-all duration-300 ${shouldShowSidebar ? 'md:ml-0' : ''}`}>
        {shouldShowSidebar && <div className="h-16 md:hidden"></div>}

        <Routes>
          <Route path="/" element={<AppRootRedirect />} />
          <Route path="/home" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/news/:id" element={<NewsDetails />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/studio/:id" element={<DesignStudio />} />
            <Route path="/orders" element={<MyOrders />} />
            <Route path="/my-products" element={<MyProducts />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/checkout" element={<Order />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function Layout() {
  return isAppHost() ? <AppLayout /> : <MarketingLayout />;
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
       <Router>
         <Layout />
         <Analytics />
       </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;

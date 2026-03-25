import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// All non-root routes redirect to / until this date
export const LAUNCH_DATE = new Date('2026-03-27T12:00:00+07:00');
import { Analytics } from '@vercel/analytics/react';
import { Sidebar } from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Catalog from './pages/Catalog';
import ProductDetails from './pages/ProductDetails';
import DesignCanvas from './pages/DesignCanvas';
import CanvasTest from './pages/CanvasTest';
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

function Layout() {
  const location = useLocation();
  const hideSidebarRoutes = ['/login', '/register', '/reset-password', '/', '/onboarding', '/home'];
  const shouldShowSidebar = !hideSidebarRoutes.includes(location.pathname) && !location.pathname.startsWith('/design/');

  return (
    <div className="min-h-screen flex bg-slate-50">
      {shouldShowSidebar && <Sidebar />}
      <main className={`flex-1 min-w-0 transition-all duration-300 ${shouldShowSidebar ? 'md:ml-0' : ''}`}>
        {/* Mobile header spacer — not needed on full-screen pages like DesignCanvas */}
        {shouldShowSidebar && <div className="h-16 md:hidden"></div>}
        
        <Routes>
          {/* Waitlist gate: before launch date only / is accessible */}
          <Route path="/" element={<Landing />} />
          {!import.meta.env.DEV && new Date() < LAUNCH_DATE ? (
            <Route path="*" element={<Navigate to="/" replace />} />
          ) : (
            <>
              <Route path="/home" element={<NewLanding />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/news/:id" element={<NewsDetails />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/product/:id" element={<ProductDetails />} />
                <Route path="/design/:id" element={<DesignCanvas />} />
                <Route path="/test-canvas/:id" element={<CanvasTest />} />
                <Route path="/orders" element={<MyOrders />} />
                <Route path="/my-products" element={<MyProducts />} />
                <Route path="/wallet" element={<Wallet />} />
                <Route path="/order" element={<Order />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </>
          )}
        </Routes>
      </main>
    </div>
  );
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

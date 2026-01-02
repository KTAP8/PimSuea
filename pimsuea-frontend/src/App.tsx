import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Catalog from './pages/Catalog';
import ProductDetails from './pages/ProductDetails';
import DesignCanvas from './pages/DesignCanvas';
import MyOrders from './pages/MyOrders';
import MyProducts from './pages/MyProducts';
import Wallet from './pages/Wallet';
import Order from './pages/Order';
import Login from './pages/Login';
import Register from './pages/Register';
import NewsDetails from './pages/NewsDetails';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

function Layout() {
  const location = useLocation();
  const hideSidebarRoutes = ['/login', '/register'];
  const shouldShowSidebar = !hideSidebarRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen flex bg-slate-50">
      {shouldShowSidebar && <Sidebar />}
      <main className={`flex-1 min-w-0 transition-all duration-300 ${shouldShowSidebar ? 'md:ml-0' : ''}`}>
        {/* Mobile header spacer */}
        <div className="h-16 md:hidden"></div>
        
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
             <Route path="/" element={<Dashboard />} />
             <Route path="/news/:id" element={<NewsDetails />} />
             <Route path="/catalog" element={<Catalog />} />
             <Route path="/product/:id" element={<ProductDetails />} />
             <Route path="/design/:id" element={<DesignCanvas />} />
             <Route path="/orders" element={<MyOrders />} />
             <Route path="/my-products" element={<MyProducts />} />
             <Route path="/wallet" element={<Wallet />} />
             <Route path="/order" element={<Order />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
       <Router>
         <Layout />
       </Router>
    </AuthProvider>
  );
}

export default App;

import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages Client
import ProductsPage from './pages/ProductsPage';
import Home from './pages/Home';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import CheckoutPage from './pages/CheckoutPage';
import SuccessPage from './pages/SuccessPage'; // <--- IMPORTACIÓN AÑADIDA
import ResetPasswordRequestPage from './pages/ResetPasswordRequestPage';
import ResetPasswordConfirmPage from './pages/ResetPasswordConfirmPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
// Pages Admin (Dashboard)
import AdminPanelPage from './pages/AdminPanelPage';

// Pages Admin (Lists & Forms)
import AdminProductListPage from './pages/admin/AdminProductListPage';
import AdminProductFormPage from './pages/admin/AdminProductFormPage';
import AdminProductImageManagerPage from './pages/admin/AdminProductImageManagerPage';
import AdminCategoryListPage from './pages/admin/AdminCategoryListPage';
import AdminCategoryFormPage from './pages/admin/AdminCategoryFormPage';
import AdminUserListPage from './pages/admin/AdminUserListPage';
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage';

// Layouts & Components
import Header from './components/Header';
import AdminLayout from './layouts/AdminLayout';

// Stores
import { useThemeStore } from './store/useThemeStore';
import { useAuthStore } from './store/useAuthStore';
import { useCartStore } from './store/useCartStore';


const LayoutWithHeader = ({ children }) => (
  <>
    <Header />
    <main className="flex-grow w-full">{children}</main>
  </>
);

const App = () => {
  const theme = useThemeStore((state) => state.theme);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const fetchCart = useCartStore((state) => state.fetchCart);
  
  const isDark = theme === 'dark';

  // INICIALIZACIÓN DE LA APP
  useEffect(() => {
    checkAuth();
    fetchCart();
  }, [checkAuth, fetchCart]);

  return (
    <div className={`min-h-screen flex flex-col w-full font-sans ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        theme={isDark ? "dark" : "light"}
      />
      <Routes>
        {/* Rutas Públicas / Cliente */}
        <Route path="/" element={<LayoutWithHeader><Home /></LayoutWithHeader>} />
        <Route path="/products" element={<LayoutWithHeader><ProductsPage /></LayoutWithHeader>} />
        <Route path="/cart" element={<LayoutWithHeader><CartPage /></LayoutWithHeader>} />
        <Route path="/login" element={<LayoutWithHeader><LoginPage /></LayoutWithHeader>} />
        <Route path="/register" element={<LayoutWithHeader><RegisterPage /></LayoutWithHeader>} />
        <Route path="/profile" element={<LayoutWithHeader><ProfilePage /></LayoutWithHeader>} />
        
        {/* Rutas de Pago (Sin Header para evitar distracciones) */}
        <Route path="/checkout" element={<CheckoutPage />} /> 
        <Route path="/success" element={<SuccessPage />} /> {/* <--- RUTA AÑADIDA */}
        <Route path="/change-password" element={<LayoutWithHeader><ChangePasswordPage /></LayoutWithHeader>} />
        <Route path="/request-password-reset" element={<LayoutWithHeader><ResetPasswordRequestPage /></LayoutWithHeader>} />
        <Route path="/reset-password-confirm" element={<LayoutWithHeader><ResetPasswordConfirmPage /></LayoutWithHeader>} />

        {/* Rutas Admin */}
        <Route path="/admin-panel" element={<AdminLayout />}>
            <Route index element={<AdminPanelPage />} />
            
            {/* Productos */}
            <Route path="products" element={<AdminProductListPage />} />
            <Route path="productos" element={<AdminProductListPage />} />
            <Route path="productos/new" element={<AdminProductFormPage />} />
            <Route path="productos/edit/:slug" element={<AdminProductFormPage />} />
            <Route path="productos/:slug/imagenes" element={<AdminProductImageManagerPage />} />

            {/* Categorías */}
            <Route path="categories" element={<AdminCategoryListPage />} />
            <Route path="categorias" element={<AdminCategoryListPage />} />
            <Route path="categorias/new" element={<AdminCategoryFormPage />} />
            <Route path="categorias/edit/:slug" element={<AdminCategoryFormPage />} />

            {/* Usuarios */}
            <Route path="users" element={<AdminUserListPage />} />
            <Route path="usuarios" element={<AdminUserListPage />} />
            <Route path="usuarios/:id" element={<AdminUserDetailPage />} />

            {/* Fallback */}
            <Route path="*" element={<AdminPanelPage />} />
        </Route>
        
      </Routes>
    </div>
  );
};

export default App;
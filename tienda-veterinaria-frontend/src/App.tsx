import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import HomePage from './pages/HomePage';
import { ProductsPage, ProductDetailPage } from './features/products';
import { CartPage, CheckoutPage, SuccessPage } from './features/cart';
import { LoginPage, RegisterPage, ResetPasswordRequestPage, ResetPasswordConfirmPage, ChangePasswordPage, ProfilePage, PrivateRoute, useAuthStore } from './features/auth';
import NotFoundPage from './pages/NotFoundPage'; // <--- 404

import { 
  AdminPanelPage, 
  AdminProductListPage, 
  AdminProductFormPage, 
  AdminProductImageManagerPage, 
  AdminCategoryListPage, 
  AdminCategoryFormPage, 
  AdminUserListPage, 
  AdminUserDetailPage,
  AdminLayout
} from './features/admin';

// Layouts & Components
import { Header, Footer, ScrollToTop, useThemeStore } from './shared';
import { useCartStore } from './features/cart';





// --- CONFIGURACIÓN REACT QUERY ---
// Se define fuera del componente para evitar recreación en re-renders
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Evita recargas molestas al cambiar de ventana en desarrollo
      staleTime: 1000 * 60 * 5,    // Los datos se consideran frescos por 5 minutos (Caché agresivo)
      retry: 1,                    // Si falla, reintenta 1 vez antes de dar error
    },
  },
});

// Layout Wrapper para asegurar que el Footer quede al final
interface LayoutProps {
  children: React.ReactNode;
}

const LayoutWithHeader = ({ children }: LayoutProps) => (
  <div className="flex flex-col min-h-screen">
    <Header />
    <main className="flex-grow w-full">{children}</main>
    <Footer />
  </div>
);

const App = () => {
  const theme = useThemeStore((state: any) => state.theme);
  const checkAuth = useAuthStore((state: any) => state.checkAuth);
  const fetchCart = useCartStore((state: any) => state.fetchCart);
  
  const isDark = theme === 'dark';

  // INICIALIZACIÓN DE LA APP
  useEffect(() => {
    checkAuth();
    fetchCart();
  }, [checkAuth, fetchCart]);

  return (
    <QueryClientProvider client={queryClient}>
      <div className={`min-h-screen flex flex-col w-full font-sans ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <ScrollToTop />
        <ToastContainer 
          position="top-right" 
          autoClose={3000} 
          theme={isDark ? "dark" : "light"}
        />
        <Routes>
          {/* --- RUTAS PÚBLICAS --- */}
          <Route path="/" element={<LayoutWithHeader><HomePage /></LayoutWithHeader>} />
          <Route path="/products" element={<LayoutWithHeader><ProductsPage /></LayoutWithHeader>} />
          <Route path="/products/:id" element={<LayoutWithHeader><ProductDetailPage /></LayoutWithHeader>} />
          <Route path="/cart" element={<LayoutWithHeader><CartPage /></LayoutWithHeader>} />
          
          {/* Auth Public */}
          <Route path="/login" element={<LayoutWithHeader><LoginPage /></LayoutWithHeader>} />
          <Route path="/register" element={<LayoutWithHeader><RegisterPage /></LayoutWithHeader>} />
          <Route path="/request-password-reset" element={<LayoutWithHeader><ResetPasswordRequestPage /></LayoutWithHeader>} />
          <Route path="/reset-password-confirm" element={<LayoutWithHeader><ResetPasswordConfirmPage /></LayoutWithHeader>} />

          {/* --- RUTAS PRIVADAS (USUARIOS LOGUEADOS) --- */}
          <Route element={<PrivateRoute />}>
              <Route path="/profile" element={<LayoutWithHeader><ProfilePage /></LayoutWithHeader>} />
              <Route path="/change-password" element={<LayoutWithHeader><ChangePasswordPage /></LayoutWithHeader>} />
              {/* Rutas de Pago (Sin Header para evitar distracciones) */}
              <Route path="/checkout" element={<CheckoutPage />} /> 
              <Route path="/success" element={<SuccessPage />} />
          </Route>

          {/* --- RUTAS ADMIN (SOLO STAFF) --- */}
          <Route element={<PrivateRoute requireStaff={true} />}>
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

                  {/* Fallback Admin */}
                  <Route path="*" element={<AdminPanelPage />} />
              </Route>
          </Route>
          
          {/* --- 404 NOT FOUND (Cualquier ruta no definida) --- */}
          <Route path="*" element={<LayoutWithHeader><NotFoundPage /></LayoutWithHeader>} />

        </Routes>
      </div>
    </QueryClientProvider>
  );
};

export default App;

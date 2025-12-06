// src/App.jsx
import { Routes, Route, Link } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useEffect,useState } from 'react';
import { Helmet } from 'react-helmet-async';
// Stores
import { useAuthStore } from './store/useAuthStore';
import { useCartStore } from './store/useCartStore';
import { useThemeStore } from './store/useThemeStore';

// Layouts
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';

// Protección de Rutas
import PrivateRoute from './components/PrivateRoute';

// Páginas Públicas
import Home from './pages/Home';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import SuccessPage from './pages/SuccessPage';


// Páginas Auth
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import ResetPasswordRequestPage from './pages/ResetPasswordRequestPage';
import ResetPasswordConfirmPage from './pages/ResetPasswordConfirmPage';

// Páginas Admin
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminCategoryListPage from './pages/admin/AdminCategoryListPage';
import AdminCategoryFormPage from './pages/admin/AdminCategoryFormPage';
import AdminProductListPage from './pages/admin/AdminProductListPage';
import AdminProductFormPage from './pages/admin/AdminProductFormPage';
import AdminProductImageManagerPage from './pages/admin/AdminProductImageManagerPage';
import AdminUserListPage from './pages/admin/AdminUserListPage'; 
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage';
import NotFoundPage from './pages/NotFoundPage';



// Agrupador de rutas MainLayout
const MainAppRoutes = () => {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/success" element={<SuccessPage />} />
        

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/request-password-reset" element={<ResetPasswordRequestPage />} />
        <Route path="/reset-password" element={<ResetPasswordConfirmPage />} />

        <Route element={<PrivateRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MainLayout>
  );
};

function App() {


  // Hooks
  const theme = useThemeStore((state) => state.theme);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const fetchCart = useCartStore((state) => state.fetchCart)
  
  // EFECTO DE INICIALIZACIÓN GLOBAL
  useEffect(() => {
    // 1. Auth: Verificar token
    checkAuth();
    
    // 2. Carrito: Hidratar
    fetchCart();
    
    // 3. Tema: Aplicar clase al HTML
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [checkAuth, fetchCart, theme]); // Dependencias correctas


  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);



  return (
    <>
    <Helmet>
         <title>VetShop</title> {/* Título base por si acaso */}
      </Helmet>
      <Routes>
        {/* Rutas Admin */}
        <Route element={<PrivateRoute requireStaff={true} />}>
          <Route path="/admin-panel/*" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="categorias" element={<AdminCategoryListPage />} />
            <Route path="categorias/new" element={<AdminCategoryFormPage />} />
            <Route path="categorias/edit/:slug" element={<AdminCategoryFormPage />} />
            <Route path="productos" element={<AdminProductListPage />} />
            <Route path="productos/new" element={<AdminProductFormPage />} />
            <Route path="productos/edit/:slug" element={<AdminProductFormPage />} />
            <Route path="productos/:slug/imagenes" element={<AdminProductImageManagerPage />} />
            <Route path="usuarios" element={<AdminUserListPage />} />
            <Route path="*" element={<NotFoundPage />} />
            <Route path="usuarios/:id" element={<AdminUserDetailPage />} />
          </Route>
        </Route>

        {/* Rutas App Principal */}
        <Route path="/*" element={<MainAppRoutes />} />
      </Routes>

      {/* Toast Global */}
            <ToastContainer 
        position={isMobile ? "top-center" : "top-right"}
        autoClose={3000} 
        hideProgressBar={false} 
        newestOnTop 
        closeOnClick 
        rtl={false} 
        pauseOnFocusLoss 
        draggable 
        pauseOnHover 
        theme={theme}
        // 👇 AQUÍ ESTÁ LA MAGIA DEL DISEÑO COMPACTO 👇
        toastClassName={() => 
            `relative flex p-3 rounded-lg justify-between overflow-hidden cursor-pointer shadow-2xl mb-3 transition-all
            ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} 
            font-sans text-sm 
             w-fit max-w-[90vw] md:max-w-md mx-auto md:mx-0 md:ml-auto` // w-fit ajusta al contenido
        }
        bodyClassName={() => "flex items-center gap-2"} // Flex para icono y texto juntos
      />
    </>
  );
}

export default App;
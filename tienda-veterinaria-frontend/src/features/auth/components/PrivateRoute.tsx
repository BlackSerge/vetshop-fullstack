import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import LoadingSpinner from '@/shared';

// Stores
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '@/shared';

const PrivateRoute = ({ requireStaff = false }) => {
  // Obtenemos estados del store
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isStaff = useAuthStore((state) => state.isStaff);
  
  // CRÍTICO: Leemos isLoading. Si es true, significa que "checkAuth" aún no termina.
  const isLoading = useAuthStore((state) => state.isLoading);

  // Tema para el fondo del spinner
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === "dark";
  const bgPageLoading = isDark ? "bg-gray-900 text-white" : "bg-white text-gray-900";

  const location = useLocation();

  // 1. ESTADO DE CARGA: Si aún estamos verificando el token, mostramos Spinner y PARAMOS aquí.
  // Esto evita que se ejecute la lógica de abajo (redirección) antes de tiempo.
  if (isLoading) {
    return (
      <div className={`min-h-screen flex justify-center items-center ${bgPageLoading}`}>
        <LoadingSpinner />
      </div>
    );
  }

  // 2. VERIFICACIÓN DE AUTH: Si ya cargó y no hay usuario -> Login
  if (!isAuthenticated) {
    // 'state={{ from: location }}' guarda la URL actual para volver después de loguearse
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. VERIFICACIÓN DE ROL (Solo si es requerida)
  if (requireStaff && !isStaff) {
    return <Navigate to="/" replace />;
  }

  // 4. TODO OK: Renderiza la página hija (Checkout, Profile, etc.)
  return <Outlet />;
};

export default PrivateRoute;

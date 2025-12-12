import React, { useState } from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { Menu, X, Sun, Moon, Store, User } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import AdminSidebar from '../components/AdminSidebar';

import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';

export default function AdminLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isStaff = useAuthStore((state) => state.isStaff);
  const loading = useAuthStore((state) => state.isLoading);
  const user = useAuthStore((state) => state.user);

  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isDark = theme === 'dark';
  
  // Header Admin (Glassmorphism effect heavy)
  const headerClass = isDark 
    ? 'bg-gray-900/60 border-gray-700/50 text-white backdrop-blur-xl' 
    : 'bg-white/60 border-gray-200/50 text-gray-900 backdrop-blur-xl';

  if (loading) return <div className="min-h-screen flex justify-center items-center"><LoadingSpinner /></div>;
  
  // Protección de ruta
  if (!isAuthenticated || !isStaff) return <Navigate to="/login" replace />;

  return (
    <div className={`min-h-screen font-sans relative overflow-x-hidden transition-colors duration-300 ${isDark ? 'text-white' : 'text-gray-900'}`}>
      
      {/* --- FONDOS GLOBALES (CRUCIAL PARA GLASSMORPHISM) --- */}
      {/* Capa 1: Gradiente base fijo */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 -z-30"></div>
      {/* Capa 2: Oscura para Dark Mode (transición suave) */}
      <div className={`fixed inset-0 bg-gradient-to-br from-gray-900 via-indigo-950 to-black transition-opacity duration-700 ease-in-out -z-20 ${isDark ? 'opacity-100' : 'opacity-0'}`}></div>

      {/* --- OVERLAY PARA CERRAR SIDEBAR (Móvil) --- */}
      {sidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* SIDEBAR */}
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* CONTENEDOR PRINCIPAL - Margen izquierdo en desktop para el sidebar */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 lg:pl-64`}>
        
        {/* HEADER SUPERIOR ADMIN */}
        <header className={`sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 border-b shadow-sm transition-all ${headerClass}`}>
          
          {/* IZQUIERDA */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl lg:hidden hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link 
              to="/" 
              className="flex items-center gap-2 px-3 py-2 rounded-xl font-bold text-sm transition-colors bg-purple-600 text-white hover:bg-purple-700 shadow-md shadow-purple-500/30 active:scale-95"
            >
              <Store size={18} /> 
              <span className="hidden sm:inline">Ir a Tienda</span>
            </Link>
          </div>

          {/* DERECHA */}
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                 <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-sm font-bold text-white shadow-inner ring-2 ring-white/20">
                    {user?.username?.charAt(0).toUpperCase()}
                 </div>
                 <span className="text-sm font-medium opacity-90 hidden sm:block">{user?.username}</span>
             </div>
             
             <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                title={isDark ? "Modo Claro" : "Modo Oscuro"}
             >
                {isDark ? <Moon size={20} /> : <Sun size={20} className="text-yellow-500" />}
             </button>
          </div>
        </header>

        {/* CONTENIDO - Padding bottom extra para móviles */}
        <main className="flex-1 p-4 sm:p-6 overflow-x-hidden w-full pb-32 md:pb-10 relative z-10">
           <Outlet />
        </main>
      </div>
    </div>
  );
}
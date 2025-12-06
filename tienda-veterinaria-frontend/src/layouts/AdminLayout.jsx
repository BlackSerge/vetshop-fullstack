// src/layouts/AdminLayout.jsx
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
  
  // --- COLORES UNIFICADOS CON TIENDA ---
  const bgColor = isDark ? 'bg-gray-900' : 'bg-gray-50';
  const textColor = isDark ? 'text-white' : 'text-gray-900';
  
  // Header Admin (Igual al Header Cliente: Morado en light, Índigo en dark)
  const headerBg = isDark ? 'bg-indigo-950 border-indigo-900' : 'bg-purple-700 border-purple-800';
  const headerText = 'text-white'; // Siempre blanco sobre morado/índigo

  if (loading) return <div className={`min-h-screen flex justify-center items-center ${bgColor}`}><LoadingSpinner /></div>;
  if (!isAuthenticated || !isStaff) return <Navigate to="/login" replace />;

  return (
    <div className={`min-h-screen ${bgColor} ${textColor}`}>
      
      {/* --- NUEVO: OVERLAY PARA CERRAR SIDEBAR (Solo visible en móvil cuando está abierto) --- */}
      {sidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* SIDEBAR */}
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* CONTENEDOR PRINCIPAL */}
      <div className={`flex flex-col min-h-screen transition-all duration-300 lg:pl-64`}>
        
        {/* HEADER SUPERIOR ADMIN */}
        <header className={`sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b shadow-md transition-colors duration-500 ${headerBg} ${headerText}`}>
          
          {/* IZQUIERDA */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-md lg:hidden hover:bg-white/10 transition-colors"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <Link 
              to="/" 
              className="flex items-center gap-2 px-3 py-2 rounded-md font-bold text-sm transition-colors bg-white/10 hover:bg-white/20 text-white"
            >
              <Store size={18} /> 
              <span className="hidden sm:inline">Ir a Tienda</span>
            </Link>
            
          </div>

          {/* DERECHA */}
          <div className="flex items-center gap-4">
             <span className="text-sm font-medium opacity-80 hidden sm:block">Admin {user.username} </span>
             <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors"
                title={isDark ? "Modo Claro" : "Modo Oscuro"}
             >
                {isDark ? <Moon size={20} /> : <Sun size={20} className="text-yellow-300" />}
             </button>
          </div>
        </header>

        {/* CONTENIDO */}
        <main className="flex-1 p-6 overflow-x-hidden">
           <Outlet />
        </main>
      </div>
    </div>
  );
}
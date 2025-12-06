// src/components/Header.jsx
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { 
  Sun, Moon, ShoppingCart, User, LogOut, LogIn, UserPlus, 
  Settings, Menu, X, ShoppingBag 
} from "lucide-react";

import { useThemeStore } from "../store/useThemeStore";
import { useAuthStore } from "../store/useAuthStore";
import { useCartStore } from "../store/useCartStore";
import ConfirmModal from "./ConfirmModal";

export default function Header() {
  const { theme, toggleTheme } = useThemeStore();
  const { user, isAuthenticated, logout, isStaff } = useAuthStore();
  const cartCount = useCartStore((state) => state.count);
  const isAnimating = useCartStore((state) => state.isAnimating);
  
  const navigate = useNavigate();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isDark = theme === 'dark';

  // --- COLORES DINÁMICOS HEADER ---
  // Claro: Azul Vibrante | Oscuro: Índigo/Morado Profundo (match con gradiente Home)
  const headerBgClass = isDark 
    ? "bg-indigo-950 border-indigo-900" 
    : "bg-blue-600 border-blue-700";

    const buttonThemeClass = "bg-black/20 hover:bg-black/30 text-white"; 

  const mobileMenuBg = isDark 
    ? "bg-gray-900 border-gray-800 text-white" 
    : "bg-white border-gray-100 text-gray-900";

  const mobileItemClass = isDark
    ? "hover:bg-gray-800 text-gray-200"
    : "hover:bg-blue-50 text-gray-700 hover:text-blue-700";

  const handleOpenLogoutModal = () => {
    setIsMobileMenuOpen(false);
    setIsLogoutModalOpen(true);
  };
  
  const handleCloseLogoutModal = () => setIsLogoutModalOpen(false);

  const handleConfirmLogout = () => {
    logout(); 
    navigate('/'); 
    setIsLogoutModalOpen(false);
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className={`${headerBgClass} text-white shadow-lg sticky top-0 z-50 border-b transition-colors duration-500`}>
      <div className="container mx-auto flex justify-between items-center py-3 px-4 md:py-4 md:px-6 relative">
        
        {/* 1. LOGO */}
        <Link
          to="/"
          className="text-xl md:text-2xl font-bold tracking-wide hover:text-yellow-300 transition-all flex items-center gap-2"
          onClick={closeMenu}
        >
          <span className="text-2xl">🐾</span> 
          <span>VetShop</span>
        </Link>

        {/* --- NAVEGACIÓN DESKTOP --- */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/products" className="hover:text-yellow-300 transition-colors font-medium">Tienda</Link>
          
          {isStaff && (
            <Link to="/admin-panel" className="hover:text-yellow-300 transition-colors flex items-center gap-1">
              <Settings className="w-5 h-5" /> Admin
            </Link>
          )}

          <div className="relative">
            <Link to="/cart" className={`hover:text-yellow-300 transition-colors flex items-center ${isAnimating ? 'animate-bounce' : ''}`}>
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce shadow-sm border-2 border-white/20">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          {isAuthenticated ? (
            <>
              <Link to="/profile" className="hover:text-yellow-300 transition-colors flex items-center gap-1 font-medium">
                <User className="w-5 h-5" /> {user?.username}
              </Link>
              <button onClick={handleOpenLogoutModal} className="hover:text-red-300 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-yellow-300 transition-colors font-medium">Ingresar</Link>
              <Link to="/register" className="bg-yellow-400 text-blue-900 px-4 py-1.5 rounded-full font-bold hover:bg-yellow-300 transition-colors shadow-sm">
                Registro
              </Link>
            </>
          )}

        <button 
            onClick={toggleTheme} 
            className={`p-2 rounded-full transition-colors ${buttonThemeClass}`}
            title={isDark ? "Modo Claro" : "Modo Oscuro"}
          >
            {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-yellow-300" />}
          </button>
        </nav>

        {/* --- CONTROLES MÓVIL --- */}
        <div className="flex items-center gap-3 md:hidden">
            
            <button onClick={toggleTheme} className="p-2 text-white/80 hover:text-white">
                {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            <Link 
                to="/cart" 
                className={`relative p-2 ${isAnimating ? 'animate-bounce' : ''}`} 
                onClick={closeMenu}
            >
                <ShoppingCart className="w-6 h-6" />
                {cartCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] flex justify-center border border-white shadow-sm">
                        {cartCount}
                    </span>
                )}
            </Link>

            <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-1 focus:outline-none hover:bg-white/10 rounded transition-colors"
                aria-label="Abrir menú"
            >
                {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
            </button>
        </div>

        {/* --- MENÚ DESPLEGABLE MÓVIL --- */}
        {isMobileMenuOpen && (
            <div className={`absolute top-full left-0 w-full shadow-2xl border-t ${isDark ? 'border-indigo-900' : 'border-blue-700'} z-50 md:hidden flex flex-col p-4 space-y-2 ${mobileMenuBg} animate-fadeIn`}>
                
                <Link to="/products" className={`flex items-center gap-3 py-3 px-3 rounded-lg font-bold text-lg transition-colors ${mobileItemClass}`} onClick={closeMenu}>
                    <ShoppingBag className={`w-5 h-5 ${isDark ? "text-indigo-400" : "text-blue-600"}`} /> Ir a la Tienda
                </Link>
                
                {isStaff && (
                    <Link to="/admin-panel" className={`flex items-center gap-3 py-3 px-3 font-bold rounded-lg transition-colors ${isDark ? "bg-purple-900/20 text-purple-400" : "bg-purple-50 text-purple-700"}`} onClick={closeMenu}>
                        <Settings className="w-5 h-5" /> Panel Admin
                    </Link>
                )}

                <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                {isAuthenticated ? (
                    <>
                        <Link to="/profile" className={`flex items-center gap-3 py-3 px-3 rounded-lg font-medium transition-colors ${mobileItemClass}`} onClick={closeMenu}>
                            <User className="w-5 h-5" /> Mi Perfil ({user?.username})
                        </Link>
                        <button onClick={handleOpenLogoutModal} className="flex items-center gap-3 py-3 px-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg w-full text-left font-medium transition-colors">
                            <LogOut className="w-5 h-5" /> Cerrar Sesión
                        </button>
                    </>
                ) : (
                    <div className="grid grid-cols-1 gap-3 pt-2">
                        <Link 
                            to="/login" 
                            className="py-3 text-center bg-yellow-400 text-blue-900 rounded-lg font-bold shadow-md hover:bg-yellow-300 transition-colors"
                            onClick={closeMenu}
                        >
                            Iniciar Sesión
                        </Link>
                        
                        <Link 
                            to="/register" 
                            className="py-3 text-center bg-blue-600 text-white rounded-lg font-bold shadow-md hover:bg-blue-700 transition-colors"
                            onClick={closeMenu}
                        >
                            ¡Regístrate Gratis!
                        </Link>
                    </div>
                )}
            </div>
        )}

      </div>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={handleCloseLogoutModal}
        onConfirm={handleConfirmLogout}
        message="¿Cerrar sesión?"
      />
    </header>
  );
}
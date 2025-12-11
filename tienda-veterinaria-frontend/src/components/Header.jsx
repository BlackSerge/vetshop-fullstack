import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { 
  Sun, Moon, ShoppingCart, User, LogOut, UserPlus, 
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

  const isDark = theme === "dark";

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
    navigate("/");
    setIsLogoutModalOpen(false);
  };

  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    // PY-4 y px-3 en móvil para pegar iconos a la derecha
    <header
      className={`${headerBgClass} text-white shadow-2xl sticky top-0 z-50 border-b transition-colors duration-500`}
    >
      <div className="container mx-auto flex justify-between items-center py-4 px-3 md:py-4 md:px-6 relative">
        
        {/* LOGO GIGANTE */}
        <Link
          to="/"
          className="text-3xl md:text-2xl font-black tracking-tighter hover:text-yellow-300 transition-all flex items-center gap-2 transform active:scale-95"
          onClick={closeMenu}
        >
          <span className="text-3xl">🐾</span>
          <span>VetShop</span>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden lg:flex items-center space-x-6">
          <Link
            to="/products"
            className="hover:text-yellow-300 transition-colors font-medium"
          >
            Tienda
          </Link>

          {isStaff && (
            <Link
              to="/admin-panel"
              className="hover:text-yellow-300 transition-colors flex items-center gap-1"
            >
              <Settings className="w-5 h-5" /> Admin
            </Link>
          )}

          <div className="relative">
            <Link
              to="/cart"
              className={`hover:text-yellow-300 transition-colors flex items-center ${
                isAnimating ? "animate-bounce" : ""
              }`}
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce shadow-md">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className="hover:text-yellow-300 transition-colors flex items-center gap-1 font-medium"
              >
                <User className="w-5 h-5" /> {user?.username}
              </Link>
              <button
                onClick={handleOpenLogoutModal}
                className="hover:text-red-300 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hover:text-yellow-300 transition-colors font-medium"
              >
                Ingresar
              </Link>
              <Link
                to="/register"
                className="bg-yellow-400 text-blue-900 px-4 py-1.5 rounded-full font-bold hover:bg-yellow-300 transition-colors shadow-sm"
              >
                Registro
              </Link>
            </>
          )}

          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-colors ${buttonThemeClass}`}
            title={isDark ? "Modo Claro" : "Modo Oscuro"}
          >
            {isDark ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5 text-yellow-300" />
            )}
          </button>
        </nav>

        {/* MOBILE CONTROLS — GRANDES Y TOTALMENTE A LA DERECHA */}
        <div className="flex items-center gap-5 lg:hidden ml-auto">
          
          {/* TEMA - ICONO GRANDE */}
          <button
            onClick={toggleTheme}
            className="text-white/90 hover:text-white transition-transform active:rotate-45"
          >
            {isDark ? <Moon className="w-7 h-7" /> : <Sun className="w-7 h-7" />}
          </button>

          {/* CARRITO - ICONO GRANDE */}
          <Link
            to="/cart"
            className={`relative ${isAnimating ? "animate-bounce" : ""}`}
            onClick={closeMenu}
          >
            <ShoppingCart className="w-8 h-8" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-md animate-bounce">
                {cartCount}
              </span>
            )}
          </Link>

          {/* HAMBURGUESA - ICONO GRANDE */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="focus:outline-none transition-transform active:scale-90"
          >
            {isMobileMenuOpen ? (
              <X className="w-9 h-9" />
            ) : (
              <Menu className="w-9 h-9" />
            )}
          </button>
        </div>

        {/* MOBILE MENU - INMERSIVO */}
        {isMobileMenuOpen && (
          <div
            className={`absolute top-full left-0 w-full min-h-screen shadow-2xl border-t-2 ${
              isDark ? "border-indigo-900" : "border-blue-500"
            } z-50 lg:hidden flex flex-col p-6 space-y-4 ${mobileMenuBg} animate-fadeIn`}
          >
            <Link
              to="/products"
              className={`flex items-center gap-4 py-5 px-4 rounded-2xl font-black text-2xl transition-all active:scale-95 shadow-sm border border-transparent ${mobileItemClass} ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}
              onClick={closeMenu}
            >
              <ShoppingBag
                className={`w-8 h-8 ${
                  isDark ? "text-indigo-400" : "text-blue-600"
                }`}
              />
              Tienda
            </Link>

            {isStaff && (
              <Link
                to="/admin-panel"
                className={`flex items-center gap-4 py-5 px-4 font-bold text-xl rounded-2xl transition-colors ${
                  isDark
                    ? "bg-purple-900/30 text-purple-300"
                    : "bg-purple-50 text-purple-700"
                }`}
                onClick={closeMenu}
              >
                <Settings className="w-8 h-8" /> Panel Admin
              </Link>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 my-4 opacity-50"></div>

            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className={`flex items-center gap-4 py-5 px-4 rounded-2xl font-bold text-xl transition-colors ${mobileItemClass}`}
                  onClick={closeMenu}
                >
                  <User className="w-8 h-8" /> Mi Perfil
                </Link>

                <button
                  onClick={handleOpenLogoutModal}
                  className="flex items-center gap-4 py-5 px-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl w-full text-left font-bold text-xl transition-colors mt-auto"
                >
                  <LogOut className="w-8 h-8" /> Cerrar Sesión
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-4 pt-4">
                <Link
                  to="/login"
                  className="py-5 text-center bg-yellow-400 text-blue-900 rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-transform"
                  onClick={closeMenu}
                >
                  Iniciar Sesión
                </Link>

                <Link
                  to="/register"
                  className="py-5 text-center bg-blue-600 text-white rounded-2xl font-black text-xl shadow-lg active:scale-95 transition-transform"
                  onClick={closeMenu}
                >
                  Registro Gratis
                </Link>
              </div>
            )}
            
            <div className="text-center text-sm opacity-50 pt-10 pb-20">
                VetShop v1.0
            </div>
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
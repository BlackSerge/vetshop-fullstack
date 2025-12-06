// src/layouts/MainLayout.jsx
import { useThemeStore } from "../store/useThemeStore";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function MainLayout({ children }) {
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';

  return (
    <div 
      className={`
        flex flex-col min-h-screen w-full
        transition-colors duration-500 ease-in-out 
        ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}
      `}
    >
      <Header />
      
      {/* flex-grow hace que este div ocupe todo el espacio disponible */}
      {/* Esto empuja el Footer hacia abajo, eliminando el hueco blanco */}
      <main className="flex-grow flex flex-col w-full"> 
        {children}
      </main>
      
      <Footer />
    </div>
  );
}
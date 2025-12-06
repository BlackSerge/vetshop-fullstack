import { Link } from "react-router-dom";
import { Home, Search } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";

export default function NotFoundPage() {
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === "dark";

  return (
    <div className={`flex flex-col items-center justify-center min-h-[70vh] px-6 text-center ${isDark ? "text-white" : "text-gray-900"}`}>
      
      {/* Ilustración (Emoji grande o puedes usar una imagen real en /public) */}
      <div className="text-9xl mb-6 animate-bounce">
        🐶❓
      </div>

      <h1 className="text-6xl font-extrabold mb-4 text-purple-600">404</h1>
      <h2 className="text-2xl font-bold mb-4">¡Ups! Nos hemos perdido.</h2>
      
      <p className={`text-lg mb-8 max-w-md ${isDark ? "text-gray-400" : "text-gray-600"}`}>
        Parece que la página que buscas se fue a pasear y no volvió. ¿Quizás te equivocaste de dirección?
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link 
          to="/" 
          className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-full font-bold hover:bg-purple-700 transition-transform hover:scale-105 shadow-lg"
        >
          <Home size={20} /> Volver al Inicio
        </Link>
        
        <Link 
          to="/products" 
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold border transition-transform hover:scale-105 ${isDark ? "border-gray-600 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-100"}`}
        >
          <Search size={20} /> Buscar Productos
        </Link>
      </div>
    </div>
  );
}
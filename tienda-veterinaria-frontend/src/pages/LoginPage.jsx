import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import { Helmet } from 'react-helmet-async';

// Zustand Stores
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const login = useAuthStore((state) => state.login);
  // **Aseguramos que isAuthenticated se importe del store**
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const theme = useThemeStore((state) => state.theme);
  const navigate = useNavigate();

  // -----------------------------------------------------------------------
  // 1. EFECTO: MANEJO DE NOTIFICACIONES PENDIENTES (POST-RECARGA)
  // Se ejecuta solo una vez al cargar la página
  // -----------------------------------------------------------------------
  useEffect(() => {
    const savedError = sessionStorage.getItem('pendingToastMessage');

    if (savedError) {
      // Damos un pequeño respiro (100ms) para asegurar que el ToastContainer
      // esté completamente listo después de la recarga de la página.
      setTimeout(() => {
        toast.error(savedError, {
            position: "top-right", // Tu configuración global de ToastContainer aplica
            autoClose: 5000,
        });
      }, 100); 

      // Eliminamos el error de la memoria temporal para que no vuelva a salir
      sessionStorage.removeItem('pendingToastMessage');
    }
  }, []);

  // -----------------------------------------------------------------------
  // 2. EFECTO: REDIRECCIÓN (Si el usuario ya está autenticado)
  // -----------------------------------------------------------------------
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Estilos según tema
  const isDark = theme === 'dark';
  const textColor = isDark ? "text-gray-400" : "text-gray-600";
  const inputBg = isDark 
    ? "bg-gray-800 border-gray-600 text-white focus:border-purple-500 focus:ring-1" 
    : "bg-white border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-1";
  const btnPrimary = isDark ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-purple-700 hover:bg-purple-800 text-white";

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación inicial
    if (!username.trim() || !password.trim()) {
      toast.warning('⚠️ Por favor completa todos los campos.');
      return;
    }

    setLoading(true);

    try {
      await login(username, password);
      
      // Si el login es exitoso, lanzamos el toast de bienvenida ANTES de la redirección.
      // El useEffect de arriba detectará el cambio y redirigirá.
      toast.success(`¡Hola de nuevo, ${username}! 👋`);

    } catch (err) {
      console.error("Login error object:", err);
      
      let msg = '❌ Error inesperado. Intenta de nuevo.';

      // Lógica de manejo de errores del backend
      if (err.response) {
        const status = err.response.status;
        
        if (status === 401 || status === 400) {
          msg = '❌ Credenciales incorrectas. Revisa usuario y contraseña.';
        } else if (status === 404) {
          msg = '❌ El usuario no existe.';
        } else if (status === 429) {
          msg = '⏱️ Demasiados intentos. Espera unos minutos.';
        } else {
          msg = `❌ Error del servidor (${status}).`;
        }
      } else if (err.request) {
        msg = '🌐 No se pudo conectar con el servidor.';
      }
      
      // -----------------------------------------------------------------------
      // GUARDA EL ERROR Y RECARGA LA PÁGINA
      // -----------------------------------------------------------------------
      sessionStorage.setItem('pendingToastMessage', msg);
      
      // Forzamos la recarga para que el useEffect de arriba capture el error
      window.location.reload(); 
      
    } finally {
      // Nota: El finally solo se ejecuta si NO se lanza el window.location.reload() en algunos navegadores.
      // Si el reload se lanza, el estado 'loading' se reinicia en el nuevo montaje.
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col flex-grow w-full items-center justify-center py-12 px-4 overflow-hidden">
      <Helmet>
        <title>Iniciar Sesión | VetShop</title>
      </Helmet>
      
      {/* CAPA 1: FONDO GRADIENTE CLARO */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-indigo-200 z-0"></div>

      {/* CAPA 2: FONDO GRADIENTE OSCURO (Controlamos opacidad para el tema oscuro) */}
      <div 
        className={`absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 z-0 transition-opacity duration-700 ease-in-out ${isDark ? 'opacity-100' : 'opacity-0'}`}
      ></div>

      {/* CONTENIDO (Encima de los fondos, z-10) */}
      <div className={`relative z-10 max-w-md w-full space-y-8 p-10 rounded-xl shadow-2xl transition-colors duration-500 
        ${isDark ? "bg-gray-700 text-white" : "bg-white text-gray-900"}`}
      >
        <div className="text-center">
          <Link to="/" className="text-4xl font-extrabold text-purple-700 dark:text-purple-400 transition-colors duration-500">
            🐶 Tienda Vet 🐱
          </Link>
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-extrabold transition-colors duration-500">Inicia Sesión</h2>
        <p className={`mt-2 text-center text-sm transition-colors duration-500 ${textColor}`}>
          ¿No tienes una cuenta?{' '}
          <Link to="/register" className="font-medium text-purple-600 hover:text-purple-500 transition-colors">
            Regístrate
          </Link>
        </p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">Usuario</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className={`appearance-none rounded-t-md relative block w-full px-3 py-3 border placeholder-gray-500 focus:outline-none focus:ring-1 focus:z-10 sm:text-sm transition-colors duration-500 ${inputBg}`}
                placeholder="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={`appearance-none rounded-b-md relative block w-full px-3 py-3 border placeholder-gray-500 focus:outline-none focus:ring-1 focus:z-10 sm:text-sm transition-colors duration-500 ${inputBg}`}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <div className="text-sm">
              <Link to="/request-password-reset" className="font-medium text-purple-600 hover:text-purple-500 transition-colors">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md ${btnPrimary} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={loading}
            >
              {loading ? <LoadingSpinner /> : 'Iniciar Sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
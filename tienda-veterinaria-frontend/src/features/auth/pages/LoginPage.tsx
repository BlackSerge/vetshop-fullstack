import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { LoadingSpinner } from '@/shared';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { User, Lock, PawPrint, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '@/shared';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const theme = useThemeStore((state) => state.theme);
  const navigate = useNavigate();

  useEffect(() => {
    const savedError = sessionStorage.getItem('pendingToastMessage');
    if (savedError) {
      setTimeout(() => {
        toast.error(savedError, { position: "top-right", autoClose: 5000 });
      }, 100); 
      sessionStorage.removeItem('pendingToastMessage');
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const isDark = theme === 'dark';
  const inputContainerClass = isDark 
    ? "bg-gray-800/50 border-gray-600 focus-within:border-purple-400 focus-within:ring-purple-400/30" 
    : "bg-white/80 border-gray-200 focus-within:border-purple-500 focus-within:ring-purple-200";
    
  const inputTextClass = isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast.warning(' Por favor completa todos los campos.');
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
      toast.success(`¡Hola de nuevo, ${username}! `);
    } catch (err) {
      console.error("Login error object:", err);
      let msg = ' Error inesperado. Intenta de nuevo.';
      if (err.response) {
        const status = err.response.status;
        if (status === 401 || status === 400) msg = ' Credenciales incorrectas.';
        else if (status === 404) msg = ' El usuario no existe.';
        else if (status === 429) msg = ' Demasiados intentos.';
        else msg = ` Error del servidor (${status}).`;
      } else if (err.request) {
        msg = ' No se pudo conectar con el servidor.';
      }
      sessionStorage.setItem('pendingToastMessage', msg);
      window.location.reload(); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-sans">
      <Helmet>
        <title>Iniciar Sesión | VetShop</title>
      </Helmet>
      
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 z-0"></div>
      <div 
        className={`absolute inset-0 bg-gradient-to-br from-gray-900 via-indigo-950 to-black z-0 transition-opacity duration-700 ease-in-out ${isDark ? 'opacity-100' : 'opacity-0'}`}
      ></div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div 
            animate={{ y: [0, -20, 0], opacity: [0.1, 0.3, 0.1] }} 
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute top-10 left-10 ${isDark ? 'text-white' : 'text-purple-900'}`}
          >
             <PawPrint size={120} className="opacity-10 rotate-12" />
          </motion.div>
          <motion.div 
            animate={{ y: [0, 30, 0], opacity: [0.1, 0.2, 0.1] }} 
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className={`absolute bottom-20 right-10 ${isDark ? 'text-white' : 'text-purple-900'}`}
          >
             <PawPrint size={180} className="opacity-10 -rotate-12" />
          </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-lg px-6 py-8 md:p-0"
      >
        <div className={`
            w-full rounded-3xl md:shadow-2xl md:p-10 p-6 backdrop-blur-xl border
            ${isDark 
                ? "bg-gray-900/60 border-gray-700/50 shadow-black/40" 
                : "bg-white/70 border-white/50 shadow-purple-200/50"
            }
        `}>

            <div className="text-center mb-8">
                <Link to="/" className="inline-block mb-4 transform transition-transform hover:scale-105">
                    <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center shadow-lg mb-3 ${isDark ? 'bg-indigo-600' : 'bg-white'}`}>
                        <span className="text-5xl">🐶</span>
                    </div>
                </Link>
                <h2 className={`text-3xl font-black tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                    Bienvenido
                </h2>
                <p className={`mt-2 text-base ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    Ingresa a tu cuenta VetShop
                </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
                
                <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all duration-300 group ${inputContainerClass}`}>
                    <User className={`w-6 h-6 ${isDark ? "text-gray-400 group-focus-within:text-purple-400" : "text-gray-400 group-focus-within:text-purple-600"}`} />
                    <div className="flex-1">
                        <label htmlFor="username" className="sr-only">Usuario</label>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            required
                            className={`w-full bg-transparent border-none outline-none text-lg font-medium focus:ring-0 p-0 ${inputTextClass}`}
                            placeholder="Usuario"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all duration-300 group ${inputContainerClass}`}>
                    <Lock className={`w-6 h-6 ${isDark ? "text-gray-400 group-focus-within:text-purple-400" : "text-gray-400 group-focus-within:text-purple-600"}`} />
                    <div className="flex-1">
                        <label htmlFor="password" className="sr-only">Contraseña</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className={`w-full bg-transparent border-none outline-none text-lg font-medium focus:ring-0 p-0 ${inputTextClass}`}
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end">
                    <Link to="/request-password-reset" className="text-sm font-semibold text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 transition-colors">
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>

                <button
                    type="submit"
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xl shadow-lg shadow-purple-500/30 transform transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={loading}
                >
                    {loading ? <LoadingSpinner /> : (
                        <>
                            Ingresar <ArrowRight size={20} />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-8 text-center">
                <p className={`text-base ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    ¿Aún no tienes cuenta?{' '}
                    <Link to="/register" className="font-bold text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 transition-colors">
                        Regístrate gratis
                    </Link>
                </p>
            </div>
        </div>
      </motion.div>
    </div>
  );
}

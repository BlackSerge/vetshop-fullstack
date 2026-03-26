import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import { LoadingSpinner } from '@/shared';
import { useThemeStore } from '@/shared';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Lock, PawPrint, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';

export default function ResetPasswordConfirmPage() {
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // Obtener uidb64 y token de la URL
  const queryParams = new URLSearchParams(window.location.search);
  const uidb64 = queryParams.get('uidb64');
  const token = queryParams.get('token');

  const { theme } = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';

  // --- ESTILOS ---
  const inputContainerClass = isDark 
    ? "bg-gray-800/50 border-gray-600 focus-within:border-purple-400 focus-within:ring-purple-400/30" 
    : "bg-white/60 border-gray-200 focus-within:border-purple-500 focus-within:ring-purple-200";
    
  const inputTextClass = isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400";

  useEffect(() => {
    if (!uidb64 || !token) {
      setError('Enlace de restablecimiento inválido o incompleto.');
    }
  }, [uidb64, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    if (newPassword !== newPasswordConfirm) {
      setError('Las nuevas contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    if (!uidb64 || !token) {
        setError('Enlace de restablecimiento inválido.');
        setLoading(false);
        return;
    }

    try {
      await authService.confirmPasswordReset(uidb64, token, newPassword, newPasswordConfirm);
      setMessage('¡Contraseña restablecida con éxito! Redirigiendo...');
      setTimeout(() => {
        navigate('/login');
      }, 3000); // Redirigir después de 3 segundos
    } catch (err) {
      console.error("Error confirming password reset:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.new_password?.[0] || err.response?.data?.detail || 'Error al restablecer. El enlace puede haber caducado.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-sans">
       <Helmet>
        <title>Restablecer Contraseña | VetShop</title>
      </Helmet>
      
      {/* BACKGROUNDS */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 z-0"></div>
      <div className={`absolute inset-0 bg-gradient-to-br from-gray-900 via-indigo-950 to-black z-0 transition-opacity duration-700 ease-in-out ${isDark ? 'opacity-100' : 'opacity-0'}`}></div>

       {/* DECORATION */}
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg px-6 py-8 md:p-0"
      >
         <div className={`
            w-full rounded-3xl md:shadow-2xl md:p-10 p-6 backdrop-blur-xl border
            ${isDark 
                ? "bg-gray-900/60 border-gray-700/50 shadow-black/40" 
                : "bg-white/70 border-white/50 shadow-purple-200/50"
            }
        `}>
            {/* Header */}
            <div className="text-center mb-8">
                <Link to="/" className="inline-block mb-4 transform transition-transform hover:scale-105">
                     <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center shadow-lg mb-2 ${isDark ? 'bg-indigo-600' : 'bg-white'}`}>
                        <span className="text-4xl">🔐</span>
                    </div>
                </Link>
                <h2 className={`text-3xl font-black tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                    Nueva Contraseña
                </h2>
                <p className={`mt-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                   Ingresa tu nueva contraseña segura.
                </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
                
                {/* Password Input */}
                 <div className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl border-2 transition-all duration-300 group ${inputContainerClass}`}>
                    <Lock className={`w-5 h-5 ${isDark ? "text-gray-400 group-focus-within:text-purple-400" : "text-gray-400 group-focus-within:text-purple-600"}`} />
                    <div className="flex-1">
                        <label htmlFor="new_password" class="sr-only">Nueva contraseña</label>
                        <input
                            id="new_password"
                            type="password"
                            required
                            className={`w-full bg-transparent border-none outline-none text-lg font-medium focus:ring-0 p-0 ${inputTextClass}`}
                            placeholder="Nueva contraseña"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </div>
                </div>

                {/* Confirm Input */}
                <div className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl border-2 transition-all duration-300 group ${inputContainerClass}`}>
                    <Lock className={`w-5 h-5 ${isDark ? "text-gray-400 group-focus-within:text-purple-400" : "text-gray-400 group-focus-within:text-purple-600"}`} />
                    <div className="flex-1">
                        <label htmlFor="new_password_confirm" class="sr-only">Confirmar contraseña</label>
                        <input
                            id="new_password_confirm"
                            type="password"
                            required
                            className={`w-full bg-transparent border-none outline-none text-lg font-medium focus:ring-0 p-0 ${inputTextClass}`}
                            placeholder="Confirmar contraseña"
                            value={newPasswordConfirm}
                            onChange={(e) => setNewPasswordConfirm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Messages */}
                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                        <AlertCircle size={18} /> {error}
                    </motion.div>
                )}
                {message && (
                     <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm flex items-center gap-2">
                        <CheckCircle size={18} /> {message}
                    </motion.div>
                )}

                <button
                    type="submit"
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-lg shadow-lg shadow-purple-500/30 transform transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={loading || (!!error && !message)} 
                >
                    {loading ? <LoadingSpinner /> : <>Restablecer <ArrowRight size={20} /></>}
                </button>
            </form>

            <div className="mt-8 text-center">
                <Link to="/login" className="text-sm font-bold text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 transition-colors">
                    ← Volver al inicio de sesión
                </Link>
            </div>
        </div>
      </motion.div>
    </div>
  );
}

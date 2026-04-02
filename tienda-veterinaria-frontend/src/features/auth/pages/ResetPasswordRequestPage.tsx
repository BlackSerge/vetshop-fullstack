import  { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../services/authService';
import { LoadingSpinner } from '@/shared';
import { useThemeStore } from '@/shared';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Mail, PawPrint, ArrowRight, CheckCircle } from 'lucide-react';

export default function ResetPasswordRequestPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';

  const inputContainerClass = isDark 
    ? "bg-gray-800/50 border-gray-600 focus-within:border-purple-400 focus-within:ring-purple-400/30" 
    : "bg-white/60 border-gray-200 focus-within:border-purple-500 focus-within:ring-purple-200";
    
  const inputTextClass = isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.requestPasswordReset(email);
      setIsSent(true);
      toast.success('Si el email existe, recibirás un enlace.');
      setEmail('');
    } catch (err) {
      toast.success('Si el email existe, recibirás un enlace.');
      setIsSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-sans">
      <Helmet>
        <title>Recuperar Contraseña | VetShop</title>
      </Helmet>
      
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 z-0"></div>
      <div className={`absolute inset-0 bg-gradient-to-br from-gray-900 via-indigo-950 to-black z-0 transition-opacity duration-700 ease-in-out ${isDark ? 'opacity-100' : 'opacity-0'}`}></div>
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
          <div className="text-center mb-8">
            <Link to="/" className="inline-block mb-4 transform transition-transform hover:scale-105">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center shadow-lg mb-2 ${isDark ? 'bg-indigo-600' : 'bg-white'}`}>
                    <span className="text-4xl">📧</span>
                </div>
            </Link>
            <h2 className={`text-3xl font-black tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                Recuperar Clave
            </h2>
            <p className={`mt-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                Ingresa tu email para recibir el enlace de recuperación.
            </p>
          </div>

          {!isSent ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all duration-300 group ${inputContainerClass}`}>
                  <Mail className={`w-6 h-6 ${isDark ? "text-gray-400 group-focus-within:text-purple-400" : "text-gray-400 group-focus-within:text-purple-600"}`} />
                  <div className="flex-1">
                      <label htmlFor="email" className="sr-only">Email</label>
                      <input
                          id="email"
                          type="email"
                          required
                          className={`w-full bg-transparent border-none outline-none text-lg font-medium focus:ring-0 p-0 ${inputTextClass}`}
                          placeholder="tucorreo@ejemplo.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                      />
                  </div>
              </div>

              <button
                  type="submit"
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-lg shadow-lg shadow-purple-500/30 transform transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={loading}
              >
                  {loading ? <LoadingSpinner /> : <>Enviar Enlace <ArrowRight size={20} /></>}
              </button>
            </form>
          ) : (
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-center p-6 rounded-2xl ${isDark ? 'bg-green-900/20 text-green-200' : 'bg-green-50 text-green-800'}`}
            >
                <div className="flex justify-center mb-4">
                    <CheckCircle size={56} className="text-green-500 drop-shadow-md" />
                </div>
                <h3 className="text-xl font-bold mb-2">¡Revisa tu correo!</h3>
                <p className="text-sm opacity-90 mb-4">
                    Si la cuenta existe, hemos enviado un enlace para restablecer tu contraseña.
                </p>
                <button 
                    onClick={() => setIsSent(false)}
                    className="text-sm font-bold underline decoration-2 underline-offset-2 opacity-80 hover:opacity-100 transition-opacity"
                >
                    Intentar con otro correo
                </button>
            </motion.div>
          )}

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

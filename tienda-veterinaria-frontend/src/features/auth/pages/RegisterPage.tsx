import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; 
import { LoadingSpinner } from '@/shared';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '@/shared';
import { getErrorMessage } from '@/utils/errorHandler';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { User, Mail, Lock, PawPrint, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();
  const theme = useThemeStore((state) => state.theme);

  const isDark = theme === 'dark';

  // --- STYLES ---
  // Estilos de Inputs (Coincidentes con Login Page para consistencia)
  const inputContainerClass = isDark 
    ? "bg-gray-800/50 border-gray-600 focus-within:border-purple-400 focus-within:ring-purple-400/30" 
    : "bg-white/60 border-gray-200 focus-within:border-purple-500 focus-within:ring-purple-200";
    
  const inputTextClass = isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400";

  const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      if (password !== password2) {
          toast.error('Las contraseñas no coinciden.');
          setLoading(false);
          return;
      }
      try {
          await register(username, email, password, password2);
          navigate('/');
          toast.success('¡Registro exitoso! Bienvenido.');
      } catch (err) {
          console.error(err);
          // Helper de error existente
          const msg = getErrorMessage(err);
          toast.error(msg); 
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden font-sans">
      <Helmet>
            <title>Crear Cuenta | VetShop</title>
      </Helmet>

      {/* --- BACKGROUNDS ANIMADOS --- */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 z-0"></div>
      <div 
        className={`absolute inset-0 bg-gradient-to-br from-gray-900 via-indigo-950 to-black z-0 transition-opacity duration-700 ease-in-out ${isDark ? 'opacity-100' : 'opacity-0'}`}
      ></div>

      {/* Elementos decorativos flotantes (Patas) */}
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
        className="relative z-10 w-full max-w-lg px-4 py-8 md:p-0"
      >
         <div className={`
            w-full rounded-3xl md:shadow-2xl md:p-10 p-6 backdrop-blur-xl border
            ${isDark 
                ? "bg-gray-900/60 border-gray-700/50 shadow-black/40" 
                : "bg-white/70 border-white/50 shadow-purple-200/50"
            }
        `}>
            {/* Header */}
            <div className="text-center mb-6">
                <Link to="/" className="inline-block mb-4 transform transition-transform hover:scale-105">
                     <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center shadow-lg mb-2 ${isDark ? 'bg-indigo-600' : 'bg-white'}`}>
                        <span className="text-4xl">🐱</span>
                    </div>
                </Link>
                <h2 className={`text-3xl font-black tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                    Crea tu cuenta
                </h2>
                <p className={`mt-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                   Únete a nuestra comunidad de amantes de mascotas
                </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
                
                {/* Username */}
                <div className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl border-2 transition-all duration-300 group ${inputContainerClass}`}>
                    <User className={`w-5 h-5 ${isDark ? "text-gray-400 group-focus-within:text-purple-400" : "text-gray-400 group-focus-within:text-purple-600"}`} />
                    <div className="flex-1">
                        <label htmlFor="username" className="sr-only">Usuario</label>
                        <input id="username" name="username" type="text" required 
                            className={`w-full bg-transparent border-none outline-none text-base font-medium focus:ring-0 p-0 ${inputTextClass}`} 
                            placeholder="Nombre de usuario" 
                            value={username} onChange={(e) => setUsername(e.target.value)} 
                        />
                    </div>
                </div>

                {/* Email */}
                <div className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl border-2 transition-all duration-300 group ${inputContainerClass}`}>
                    <Mail className={`w-5 h-5 ${isDark ? "text-gray-400 group-focus-within:text-purple-400" : "text-gray-400 group-focus-within:text-purple-600"}`} />
                    <div className="flex-1">
                        <label htmlFor="email" className="sr-only">Email</label>
                        <input id="email" name="email" type="email" required 
                            className={`w-full bg-transparent border-none outline-none text-base font-medium focus:ring-0 p-0 ${inputTextClass}`} 
                            placeholder="Correo electrónico" 
                            value={email} onChange={(e) => setEmail(e.target.value)} 
                        />
                    </div>
                </div>

                {/* Password */}
                <div className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl border-2 transition-all duration-300 group ${inputContainerClass}`}>
                    <Lock className={`w-5 h-5 ${isDark ? "text-gray-400 group-focus-within:text-purple-400" : "text-gray-400 group-focus-within:text-purple-600"}`} />
                    <div className="flex-1">
                        <label htmlFor="password" className="sr-only">Contraseña</label>
                        <input id="password" name="password" type="password" required 
                            className={`w-full bg-transparent border-none outline-none text-base font-medium focus:ring-0 p-0 ${inputTextClass}`} 
                            placeholder="Contraseña" 
                            value={password} onChange={(e) => setPassword(e.target.value)} 
                        />
                    </div>
                </div>

                {/* Confirm Password */}
                <div className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl border-2 transition-all duration-300 group ${inputContainerClass}`}>
                    <Lock className={`w-5 h-5 ${isDark ? "text-gray-400 group-focus-within:text-purple-400" : "text-gray-400 group-focus-within:text-purple-600"}`} />
                    <div className="flex-1">
                        <label htmlFor="password2" className="sr-only">Confirmar</label>
                        <input id="password2" name="password2" type="password" required 
                             className={`w-full bg-transparent border-none outline-none text-base font-medium focus:ring-0 p-0 ${inputTextClass}`} 
                            placeholder="Confirmar contraseña" 
                            value={password2} onChange={(e) => setPassword2(e.target.value)} 
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <button type="submit" 
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-lg shadow-lg shadow-purple-500/30 transform transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2" 
                        disabled={loading}
                    >
                    {loading ? <LoadingSpinner /> : <>Registrarse <ArrowRight size={20} /></>}
                    </button>
                </div>
            </form>
            
             <div className="mt-6 text-center">
                <p className={`text-base ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login" className="font-bold text-purple-600 hover:text-purple-500 dark:text-purple-400 dark:hover:text-purple-300 transition-colors">
                        Inicia Sesión
                    </Link>
                </p>
            </div>

        </div>
      </motion.div>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Lock, ArrowLeft, Save, ShieldCheck } from 'lucide-react';
import authService from '../services/authService';
import LoadingSpinner from '../components/LoadingSpinner';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

// ZUSTAND
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';

export default function ChangePasswordPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const theme = useThemeStore((state) => state.theme);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  // --- STYLES ---
  const isDark = theme === 'dark';
  
  // Glassmorphism Card
  const glassCard = isDark 
    ? "bg-gray-900/60 border-gray-700/50 shadow-black/40 backdrop-blur-xl" 
    : "bg-white/70 border-white/50 shadow-purple-200/50 backdrop-blur-xl";

  // Inputs Style (Consistent with Login/Register)
  const inputContainerClass = isDark 
    ? "bg-gray-800/50 border-gray-600 focus-within:border-purple-400 focus-within:ring-purple-400/30" 
    : "bg-white/60 border-gray-200 focus-within:border-purple-500 focus-within:ring-purple-200";
    
  const inputTextClass = isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (newPassword !== newPasswordConfirm) {
      toast.error('Las nuevas contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    try {
      await authService.changePassword(oldPassword, newPassword, newPasswordConfirm);
      toast.success('¡Contraseña actualizada con éxito!');
      setOldPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
    } catch (err) {
      console.error("Error changing password:", err);
      let msg = 'Error al cambiar la contraseña.';
      if (err.response && err.response.data) {
          const data = err.response.data;
          if (data.old_password) msg = `Contraseña actual: ${data.old_password[0]}`;
          else if (data.new_password) msg = `Nueva contraseña: ${data.new_password[0]}`;
          else if (data.new_password_confirm) msg = `Confirmación: ${data.new_password_confirm[0]}`;
          else if (data.detail) msg = data.detail;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="text-center p-8 bg-red-100 dark:bg-red-900/20 rounded-2xl text-red-700 dark:text-red-300 max-w-sm w-full">
            <p className="font-bold text-lg mb-2">Acceso Denegado</p>
            <p className="mb-4 text-sm">Debes iniciar sesión para ver esta página.</p>
            <Link to="/login" className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors inline-block w-full">Ir al Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col flex-grow w-full items-center justify-center py-12 px-4 overflow-hidden min-h-screen font-sans">
      <Helmet>
        <title>Cambiar Contraseña | VetShop</title>
      </Helmet>
      
      {/* --- BACKGROUNDS --- */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 z-0"></div>
      <div className={`absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 z-0 transition-opacity duration-700 ease-in-out ${isDark ? 'opacity-100' : 'opacity-0'}`}></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className={`p-8 md:p-10 rounded-3xl border ${glassCard}`}>
          
          <div className="text-center mb-8">
            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg ${isDark ? 'bg-indigo-600 text-white' : 'bg-white text-purple-600'}`}>
                <ShieldCheck size={32} />
            </div>
            <h1 className={`text-3xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Seguridad</h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Actualiza tu contraseña periódicamente.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Old Password */}
            <div className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl border-2 transition-all duration-300 group ${inputContainerClass}`}>
                <Lock className={`w-5 h-5 flex-shrink-0 ${isDark ? "text-gray-400 group-focus-within:text-purple-400" : "text-gray-400 group-focus-within:text-purple-600"}`} />
                <div className="flex-1 min-w-0">
                    <label className="sr-only">Contraseña Actual</label>
                    <input
                        type="password"
                        required
                        placeholder="Contraseña Actual"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className={`w-full bg-transparent border-none outline-none text-base font-medium focus:ring-0 p-0 ${inputTextClass}`}
                    />
                </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 my-2 opacity-50"></div>

            {/* New Password */}
            <div className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl border-2 transition-all duration-300 group ${inputContainerClass}`}>
                <Lock className={`w-5 h-5 flex-shrink-0 ${isDark ? "text-gray-400 group-focus-within:text-purple-400" : "text-gray-400 group-focus-within:text-purple-600"}`} />
                <div className="flex-1 min-w-0">
                    <label className="sr-only">Nueva Contraseña</label>
                    <input
                        type="password"
                        required
                        placeholder="Nueva Contraseña"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className={`w-full bg-transparent border-none outline-none text-base font-medium focus:ring-0 p-0 ${inputTextClass}`}
                    />
                </div>
            </div>

            {/* Confirm New Password */}
            <div className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl border-2 transition-all duration-300 group ${inputContainerClass}`}>
                <Lock className={`w-5 h-5 flex-shrink-0 ${isDark ? "text-gray-400 group-focus-within:text-purple-400" : "text-gray-400 group-focus-within:text-purple-600"}`} />
                <div className="flex-1 min-w-0">
                    <label className="sr-only">Confirmar Nueva Contraseña</label>
                    <input
                        type="password"
                        required
                        placeholder="Confirmar Nueva"
                        value={newPasswordConfirm}
                        onChange={(e) => setNewPasswordConfirm(e.target.value)}
                        className={`w-full bg-transparent border-none outline-none text-base font-medium focus:ring-0 p-0 ${inputTextClass}`}
                    />
                </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-lg shadow-lg shadow-purple-500/30 transform transition-all active:scale-95 flex justify-center items-center gap-2 mt-4"
              disabled={loading}
            >
              {loading ? <LoadingSpinner /> : <><Save size={20} /> Actualizar Contraseña</>}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link to="/profile" className={`inline-flex items-center gap-2 text-sm font-bold hover:underline transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}>
              <ArrowLeft size={18} /> Volver a Mi Perfil
            </Link>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
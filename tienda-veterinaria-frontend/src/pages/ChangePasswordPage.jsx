// src/pages/ChangePasswordPage.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Lock, ArrowLeft, Save } from 'lucide-react';
import authService from '../services/authService';
import LoadingSpinner from '../components/LoadingSpinner';

// ZUSTAND
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';

export default function ChangePasswordPage() {
  // Usamos el Store
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const theme = useThemeStore((state) => state.theme);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  // Estilos
  const isDark = theme === 'dark';
  const cardBg = isDark ? "bg-gray-800/90 backdrop-blur-sm border-gray-700 text-white" : "bg-white/90 backdrop-blur-sm border-gray-200 text-gray-900";
  const inputBg = isDark ? "bg-gray-700 border-gray-600 text-white focus:border-purple-500" : "bg-white border-gray-300 text-gray-900 focus:border-purple-500";
  const labelColor = isDark ? "text-gray-300" : "text-gray-700";
  const btnPrimary = "bg-purple-600 hover:bg-purple-700 text-white shadow-md transition-all transform active:scale-95";

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
      
      // Lógica Adaptativa: Intenta leer errores específicos primero
      let msg = 'Error al cambiar la contraseña.';

      if (err.response && err.response.data) {
          const data = err.response.data;
          
          // 1. Errores de validación de campos específicos (Django Validators)
          if (data.old_password) {
              msg = `Contraseña actual: ${data.old_password[0]}`;
          } 
          else if (data.new_password) {
              // Aquí caerán los errores de complejidad ("Falta mayúscula", etc.)
              msg = `Nueva contraseña: ${data.new_password[0]}`;
          }
          else if (data.new_password_confirm) {
              msg = `Confirmación: ${data.new_password_confirm[0]}`;
          }
          // 2. Errores genéricos (detail, non_field_errors)
          else if (data.detail) {
              msg = data.detail;
          }
          else if (data.non_field_errors) {
              msg = data.non_field_errors[0];
          }
      } else if (err.message) {
          // Error de red o sin respuesta
          msg = err.message;
      }

    

      toast.error(msg);
    } finally {
      setLoading(false);
    }

  }

  // Si por alguna razón extraña llegas aquí sin auth (aunque el router lo impide), mostramos esto:
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center p-8 bg-red-100 rounded-lg text-red-700">
            <p>Debes iniciar sesión para ver esta página.</p>
            <Link to="/login" className="underline font-bold mt-2 block">Ir al Login</Link>
        </div>
      </div>
    );
  }

  return (
    // Usamos la estructura de Gradientes para consistencia
    <div className="relative flex flex-col flex-grow w-full items-center justify-center py-16 px-4 overflow-hidden">
      
      {/* FONDOS CROSS-FADE */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 z-0"></div>
      <div className={`absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 z-0 transition-opacity duration-700 ease-in-out ${isDark ? 'opacity-100' : 'opacity-0'}`}></div>

      <div className="relative z-10 container mx-auto max-w-xl">
        <div className={`p-8 rounded-2xl shadow-2xl border transition-colors duration-500 ${cardBg}`}>
          
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
                <Lock size={32} />
            </div>
            <h1 className="text-3xl font-bold mb-2">Cambiar Contraseña</h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Asegura tu cuenta con una contraseña fuerte.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${labelColor}`}>Contraseña Actual</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className={`block w-full rounded-lg border shadow-sm py-3 px-4 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors ${inputBg}`}
                
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${labelColor}`}>Nueva Contraseña</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`block w-full rounded-lg border shadow-sm py-3 px-4 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors ${inputBg}`}
                
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${labelColor}`}>Confirmar Nueva Contraseña</label>
              <input
                type="password"
                required
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                className={`block w-full rounded-lg border shadow-sm py-3 px-4 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-colors ${inputBg}`}
                
              />
            </div>

            <button
              type="submit"
              className={`w-full py-3 px-4 rounded-lg font-bold text-lg flex justify-center items-center gap-2 ${btnPrimary}`}
              disabled={loading}
            >
              {loading ? <LoadingSpinner /> : <><Save size={20} /> Actualizar Contraseña</>}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link to="/profile" className={`inline-flex items-center gap-2 text-sm font-medium hover:underline transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}>
              <ArrowLeft size={16} /> Volver a Mi Perfil
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
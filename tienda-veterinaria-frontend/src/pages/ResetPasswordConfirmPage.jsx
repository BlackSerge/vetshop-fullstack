// src/pages/ResetPasswordConfirmPage.jsx
import { useState, useEffect } from 'react'; // Asegúrate de importar useContext
import {  useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import LoadingSpinner from '../components/LoadingSpinner';
import { useThemeStore } from '../store/useThemeStore';


export default function ResetPasswordConfirmPage() {
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  // const { uidb64, token } = useParams(); // No se usa useParams, se obtiene de URLSearchParams
  
  // Obtener uidb64 y token de la URL (queryParams, no useParams)
  const queryParams = new URLSearchParams(window.location.search);
  const uidb64 = queryParams.get('uidb64');
  const token = queryParams.get('token');

  const { theme } = useThemeStore((state) => state.theme);

  // <--- MANTENER 'isDark' y DEFINIR VARIABLES DE ESTILO DINÁMICAS ---
  const isDark = theme === 'dark';
  const bgGradientClass = isDark ? "bg-gradient-to-br from-gray-800 to-gray-900" : "bg-gradient-to-br from-purple-100 to-indigo-200";
  const cardBgClass = isDark ? "bg-gray-700 text-white" : "bg-white text-gray-900";
  const mutedTextColor = isDark ? "text-gray-400" : "text-gray-600";
  const inputBgClass = isDark ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900";
  const btnPrimaryClass = isDark ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-purple-700 hover:bg-purple-800 text-white";
  const logoAccentColor = "text-purple-700 dark:text-purple-400"; // Se mantiene fijo para el logo
  const linkAccentColor = "text-purple-600 hover:text-purple-500"; // Se mantiene fijo para el acento
  // -------------------------------------------------------------------


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
      setMessage('Contraseña restablecida con éxito! Serás redirigido al login.');
      setTimeout(() => {
        navigate('/login');
      }, 3000); // Redirigir después de 3 segundos
    } catch (err) {
      console.error("Error confirming password reset:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.new_password?.[0] || err.response?.data?.detail || 'Error al restablecer la contraseña. El enlace puede haber caducado o ser inválido.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    // <--- Contenedor principal que actúa como el layout de autenticación ---
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-500 ${bgGradientClass}`}>
      <div className={`max-w-md w-full space-y-8 p-10 rounded-xl shadow-2xl ${cardBgClass}`}>
        <div className="text-center">
          <Link to="/" className={`text-4xl font-extrabold ${logoAccentColor}`}>
            🐶 Tienda Vet 🐱
          </Link>
        </div>

        <h2 className="mt-6 text-center text-3xl font-extrabold">
          Establece tu Nueva Contraseña
        </h2>
        <p className={`mt-2 text-center text-sm ${mutedTextColor}`}>
          Ingresa tu nueva contraseña para tu cuenta.
        </p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="new_password" className="sr-only">
              Nueva Contraseña
            </label>
            <input
              id="new_password"
              name="new_password"
              type="password"
              autoComplete="new-password"
              required
              className={`appearance-none relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm ${inputBgClass}`}
              placeholder="Nueva Contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="new_password_confirm" className="sr-only">
              Confirmar Nueva Contraseña
            </label>
            <input
              id="new_password_confirm"
              name="new_password_confirm"
              type="password"
              autoComplete="new-password"
              required
              className={`appearance-none relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500 focus:z-10 sm:text-sm ${inputBgClass}`}
              placeholder="Confirmar Nueva Contraseña"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {message && <p className="text-green-500 text-sm text-center">{message}</p>}

          <div>
            <button
              type="submit"
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md ${btnPrimaryClass} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500`}
              disabled={loading || !!error}
            >
              {loading ? <LoadingSpinner /> : 'Restablecer Contraseña'}
            </button>
          </div>
          <div className="text-center text-sm">
              <Link to="/login" className={`font-medium ${linkAccentColor}`}>
                Volver al inicio de sesión
              </Link>
            </div>
        </form>
      </div>
    </div>
  );
}
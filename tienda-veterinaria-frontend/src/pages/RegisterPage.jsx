// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; // Importar toast si lo usas aquí también
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { getErrorMessage } from '../utils/errorHandler'; 
import { Helmet } from 'react-helmet-async';


export default function RegisterPage() {
  // ... (lógica de estados y submit igual que antes) ...
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();
  const theme = useThemeStore((state) => state.theme);

  const isDark = theme === 'dark';
  const cardBgClass = isDark ? "bg-gray-700 text-white" : "bg-white text-gray-900";
  const inputBgClass = isDark ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900";
  const btnPrimaryClass = isDark ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-purple-700 hover:bg-purple-800 text-white";
  const linkAccentColor = "text-purple-600 hover:text-purple-500";

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
          toast.success('¡Registro exitoso!');
      } catch (err) {
          console.error(err);
          // USAR EL HELPER AQUÍ
          const msg = getErrorMessage(err);
          toast.error(msg); 
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="relative flex flex-col flex-grow w-full items-center justify-center py-12 px-4 overflow-hidden">
      <Helmet>
            <title>Crear Cuenta | VetShop</title>
        </Helmet>
      {/* --- FONDO CROSS-FADE --- */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-indigo-200 z-0"></div>
      <div className={`absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 z-0 transition-opacity duration-700 ease-in-out ${isDark ? 'opacity-100' : 'opacity-0'}`}></div>
      {/* ----------------------- */}

      <div className={`relative z-10 max-w-md w-full space-y-8 p-10 rounded-xl shadow-2xl transition-colors duration-500 ${cardBgClass}`}>
        <div className="text-center">
          <Link to="/" className="text-4xl font-extrabold text-purple-700 dark:text-purple-400 transition-colors duration-500">
            🐶 Tienda Vet 🐱
          </Link>
        </div>

        <h2 className="mt-6 text-center text-3xl font-extrabold transition-colors duration-500">Crea tu cuenta</h2>
        <p className={`mt-2 text-center text-sm transition-colors duration-500 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className={`font-medium ${linkAccentColor} transition-colors`}>Inicia Sesión</Link>
        </p>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* ... Inputs (igual que antes, solo asegúrate de usar inputBgClass) ... */}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">Usuario</label>
              <input id="username" name="username" type="text" required className={`appearance-none rounded-t-md relative block w-full px-3 py-3 border placeholder-gray-500 focus:outline-none focus:ring-1 sm:text-sm transition-colors duration-500 ${inputBgClass}`} placeholder="Usuario" value={username} onChange={(e) => setUsername(e.target.value)} />
            </div>
            {/* ... Repetir inputs email, password, password2 con el estilo nuevo ... */}
             <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input id="email" name="email" type="email" required className={`appearance-none relative block w-full px-3 py-3 border placeholder-gray-500 focus:outline-none focus:ring-1 sm:text-sm transition-colors duration-500 ${inputBgClass}`} placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
             <div>
              <label htmlFor="password" className="sr-only">Contraseña</label>
              <input id="password" name="password" type="password" required className={`appearance-none relative block w-full px-3 py-3 border placeholder-gray-500 focus:outline-none focus:ring-1 sm:text-sm transition-colors duration-500 ${inputBgClass}`} placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
             <div>
              <label htmlFor="password2" className="sr-only">Confirmar</label>
              <input id="password2" name="password2" type="password" required className={`appearance-none rounded-b-md relative block w-full px-3 py-3 border placeholder-gray-500 focus:outline-none focus:ring-1 sm:text-sm transition-colors duration-500 ${inputBgClass}`} placeholder="Confirmar" value={password2} onChange={(e) => setPassword2(e.target.value)} />
            </div>
          </div>

          <div>
            <button type="submit" className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md ${btnPrimaryClass} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300`} disabled={loading}>
              {loading ? <LoadingSpinner /> : 'Registrarse'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
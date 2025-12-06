// src/pages/ResetPasswordRequestPage.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import authService from '../services/authService';
import LoadingSpinner from '../components/LoadingSpinner';
import { useThemeStore } from '../store/useThemeStore';

export default function ResetPasswordRequestPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';

  const cardBg = isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900";
  const inputClass = isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900";
  const btnPrimary = isDark ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-purple-700 hover:bg-purple-800 text-white";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authService.requestPasswordReset(email);
      toast.success('Si el email existe, recibirás un enlace.');
      setEmail('');
    } catch (err) {
      toast.success('Si el email existe, recibirás un enlace.'); // Mensaje seguro
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col flex-grow w-full items-center justify-center py-12 px-4 overflow-hidden">
      
      {/* FONDO CROSS-FADE */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-indigo-200 z-0"></div>
      <div className={`absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 z-0 transition-opacity duration-700 ease-in-out ${isDark ? 'opacity-100' : 'opacity-0'}`}></div>

      <div className={`relative z-10 max-w-md w-full space-y-8 p-10 rounded-xl shadow-2xl transition-colors duration-500 ${cardBg}`}>
        <div className="text-center">
            <Link to="/" className="text-4xl font-extrabold text-purple-700 dark:text-purple-400">🐶 Tienda Vet 🐱</Link>
            <h2 className="mt-6 text-3xl font-extrabold">Recuperar Clave</h2>
            <p className={`mt-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}>Ingresa tu email para recibir el enlace.</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <input
            type="email" required className={`block w-full px-3 py-3 border rounded-md focus:outline-none focus:ring-1 sm:text-sm transition-colors duration-500 ${inputClass}`}
            placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit" className={`w-full py-3 px-4 rounded-md font-bold ${btnPrimary} transition-all duration-300`} disabled={loading}>
            {loading ? <LoadingSpinner /> : 'Enviar Enlace'}
          </button>
          <div className="text-center text-sm">
            <Link to="/login" className="font-medium text-purple-600 hover:text-purple-500">Volver al login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
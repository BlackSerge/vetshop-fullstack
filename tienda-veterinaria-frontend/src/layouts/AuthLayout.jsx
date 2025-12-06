// src/layouts/AuthLayout.jsx

import { Link } from 'react-router-dom';

export default function AuthLayout({ children }) {
  const theme = localStorage.getItem("theme") || "light";
  const bgClass = theme === "light" ? "bg-gradient-to-br from-purple-100 to-indigo-200" : "bg-gradient-to-br from-gray-800 to-gray-900";
  const cardClass = theme === "light" ? "bg-white text-gray-900" : "bg-gray-700 text-white";

  return (
    <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-500 ${bgClass}`}>
      <div className={`max-w-md w-full space-y-8 p-10 rounded-xl shadow-2xl ${cardClass}`}>
        <div className="text-center">
          <Link to="/" className="text-4xl font-extrabold text-purple-700 dark:text-purple-400">
            🐶 Tienda Vet 🐱
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
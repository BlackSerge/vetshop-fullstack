// src/pages/AdminPanelPage.jsx
import { Navigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';

export default function AdminPanelPage() {
  const { currentUser, isAuthenticated, isStaff, loading } = useAuthStore((state) => state.user);

  const theme = useThemeStore((state) => state.theme);
  const bgPage = theme === "light" ? "bg-gray-50 text-gray-900" : "bg-gray-900 text-white";
  const cardClass = theme === "light" ? "bg-white" : "bg-gray-800";

  if (loading) {
    return (
      <MainLayout>
        <div className={`py-16 min-h-screen flex justify-center items-center ${bgPage}`}>
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  // Proteger la ruta: solo usuarios autenticados Y que sean staff/superusuario
  if (!isAuthenticated || !isStaff) {
    // Si no está autenticado o no es staff, redirige al login o a una página de acceso denegado
    return <Navigate to="/login" replace />;
  }

  return (
      <section className={`py-16 min-h-screen ${bgPage}`}>
        <div className="container mx-auto px-6 max-w-4xl">
          <h1 className="text-4xl font-bold text-center mb-10">Panel de Administración</h1>
          <p className="text-center text-lg mb-8">
            Bienvenido, {currentUser?.username}. Tienes acceso a funciones administrativas.
          </p>

          <div className={`p-8 rounded-xl shadow-lg ${cardClass} space-y-6`}>
            <h2 className="text-2xl font-semibold mb-4">Gestión de la Tienda</h2>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => alert("Ir a gestionar productos")}
                  className="w-full text-left py-3 px-4 rounded-md bg-purple-100 dark:bg-purple-900 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                >
                  Gestionar Productos
                </button>
              </li>
              <li>
                <button
                  onClick={() => alert("Ir a gestionar categorías")}
                  className="w-full text-left py-3 px-4 rounded-md bg-purple-100 dark:bg-purple-900 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                >
                  Gestionar Categorías
                </button>
              </li>
              {/* Añade más enlaces aquí para gestionar pedidos, usuarios, etc. */}
              <li>
                <button
                  onClick={() => window.open('http://127.0.0.1:8000/admin/', '_blank')}
                  className="w-full text-left py-3 px-4 rounded-md bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  Acceder al Admin de Django (Directo)
                </button>
              </li>
            </ul>
          </div>
        </div>
      </section>
  );
}
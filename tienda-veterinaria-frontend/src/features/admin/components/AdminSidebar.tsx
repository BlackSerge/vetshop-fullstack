import { Link, NavLink } from 'react-router-dom';
import { Home, Package, Box, Users, X } from 'lucide-react';
import { useThemeStore } from '@/shared';
interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const theme = useThemeStore((state: any) => state.theme);
  const isDark = theme === 'dark';
  const sidebarBg = isDark ? 'bg-gray-800' : 'bg-white';
  const textColor = isDark ? 'text-gray-100' : 'text-gray-800';
  const linkHoverClass = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
  const activeLinkClass = 'bg-purple-700 text-white'; 

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex-col w-64 ${sidebarBg} shadow-lg transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} lg:flex`} 
    >
      <div className={`px-6 py-4 flex items-center justify-between border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <Link to="/admin-panel" className="text-2xl font-bold text-purple-700 dark:text-purple-400">
          Admin VetShop
        </Link>
        <button onClick={onClose} className="p-1 rounded-md lg:hidden">
          <X size={20} className={textColor} />
        </button>
      </div>

    
      <nav className={`flex-1 px-4 py-6 space-y-2 ${textColor}`}>
        <NavLink
          to="/admin-panel"
          end 
          className={({ isActive }) =>
            `flex items-center p-3 rounded-lg transition-colors duration-200 ${linkHoverClass} ${
              isActive ? activeLinkClass : ''
            }`
          }
        >
          <Home size={20} className="mr-3" />
          Dashboard
        </NavLink>

        <NavLink
          to="/admin-panel/productos"
          className={({ isActive }) =>
            `flex items-center p-3 rounded-lg transition-colors duration-200 ${linkHoverClass} ${
              isActive ? activeLinkClass : ''
            }`
          }
        >
          <Package size={20} className="mr-3" />
          Productos
        </NavLink>

        <NavLink
          to="/admin-panel/categorias"
          className={({ isActive }) =>
            `flex items-center p-3 rounded-lg transition-colors duration-200 ${linkHoverClass} ${
              isActive ? activeLinkClass : ''
            }`
          }
        >
          <Box size={20} className="mr-3" />
          Categorías
        </NavLink>

        <NavLink
          to="/admin-panel/usuarios" 
          className={({ isActive }) =>
            `flex items-center p-3 rounded-lg transition-colors duration-200 ${linkHoverClass} ${
              isActive ? activeLinkClass : ''
            }`
          }
        >
          <Users size={20} className="mr-3" />
          Usuarios
        </NavLink>
      </nav>
    </aside>
  );
}



import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import AdminTable from '../../components/admin/AdminTable';
import { useThemeStore } from '../../store/useThemeStore';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === "dark";

  const btnPrimary = "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30";

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/productos/categorias/');
      // Manejar respuesta paginada o lista directa
      const data = response.data.results || response.data;
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories", error);
    } finally {
      setIsLoading(false);
    }
  };

  const headers = [
    { label: "ID", field: "id" },
    { label: "Nombre", field: "nombre" },
    { label: "Slug", field: "slug" },
  ];

  const renderActions = (row) => (
      <div className="flex gap-2 justify-end">
          <button className={`p-2 rounded-xl transition-colors ${isDark ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
              <Edit size={16} />
          </button>
          <button className={`p-2 rounded-xl transition-colors ${isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
              <Trash2 size={16} />
          </button>
      </div>
  );

  return (
    <div className="w-full space-y-8 animate-fadeIn">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Categorías</h1>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Organiza los departamentos de la tienda</p>
            </div>
            <button className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all active:scale-95 ${btnPrimary}`}>
                <Plus size={20} /> Nueva Categoría
            </button>
        </div>

        <AdminTable 
            headers={headers} 
            data={categories} 
            renderRowActions={renderActions}
            isLoading={isLoading}
        />
    </div>
  );
}
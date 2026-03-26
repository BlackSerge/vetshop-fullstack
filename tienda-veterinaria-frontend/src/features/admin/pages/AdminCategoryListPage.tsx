import  { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import adminService from '../services/adminService';
import AdminTable from '../components/AdminTable';
import { ConfirmModal } from '@/shared';
import { useThemeStore } from '@/shared';

export default function AdminCategoriesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === "dark";

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await adminService.getCategories();
      const data = response.results || response;
      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories", error);
      toast.error("No se pudieron cargar las categorías.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (category) => {
      setCategoryToDelete(category);
      setIsModalOpen(true);
  };

  const confirmDelete = async () => {
      if (!categoryToDelete) return;
      try {
          await adminService.deleteCategory(categoryToDelete.slug);
          toast.success("Categoría eliminada correctamente.");
          fetchCategories();
      } catch (error) {
          console.error("Error deleting category", error);
          toast.error("No se pudo eliminar la categoría.");
      } finally {
          setIsModalOpen(false);
          setCategoryToDelete(null);
      }
  };

  const headers = [
    { label: "ID", field: "id" },
    { label: "Nombre", field: "nombre" },
    { label: "Slug", field: "slug" },
    { label: "Activa", field: "is_active" },
  ];

  const renderActions = (row) => (
      <div className="flex gap-2 justify-end">
          <button 
            onClick={() => navigate(`/admin-panel/categorias/edit/${row.slug}`)}
            className={`p-2 rounded-xl transition-colors ${isDark ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
            title="Editar categoría"
          >
              <Edit size={16} />
          </button>
          <button 
            onClick={() => handleDeleteClick(row)}
            className={`p-2 rounded-xl transition-colors ${isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
            title="Eliminar categoría"
          >
              <Trash2 size={16} />
          </button>
      </div>
  );

  return (
    <div className="w-full space-y-8 animate-fadeIn min-h-screen">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
                <h1 className={`text-3xl sm:text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Categorías</h1>
                <p className={`text-sm sm:text-base mt-2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Organiza los departamentos de la tienda</p>
            </div>
            <button 
                onClick={() => navigate('/admin-panel/categorias/new')}
                className="inline-flex items-center justify-center px-6 py-3 rounded-2xl font-bold bg-purple-600 text-white shadow-lg shadow-purple-500/30 hover:bg-purple-700 active:scale-95 transition-all w-full sm:w-auto gap-2"
            >
                <Plus size={20} /> Nueva Categoría
            </button>
        </div>

        <AdminTable 
            headers={headers} 
            data={categories} 
            renderRowActions={renderActions}
            isLoading={isLoading}
        />

        <ConfirmModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onConfirm={confirmDelete}
            title="Eliminar Categoría"
            message={`¿Estás seguro de que deseas eliminar la categoría "${categoryToDelete?.nombre}"? Esta acción no se puede deshacer.`}
        />
    </div>
  );
}




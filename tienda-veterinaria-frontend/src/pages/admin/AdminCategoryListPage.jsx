// src/pages/admin/AdminCategoryListPage.jsx
import  { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, PlusCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService';
import AdminTable from '../../components/admin/AdminTable';
import ConfirmModal from '../../components/ConfirmModal';
import { useThemeStore } from '../../store/useThemeStore';


export default function AdminCategoryListPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';

  const btnPrimary = isDark ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-700 hover:bg-purple-800 text-white';
  const btnEdit = 'bg-blue-500 hover:bg-blue-600 text-white';
  const btnDelete = 'bg-red-500 hover:bg-red-600 text-white';

  const fetchCategories = async () => {
    setLoading(true);
    try {
    const response = await adminService.getCategories(); // Endpoint de categorías
    const categoriesData = response.results || response; // <--- CAMBIO CLAVE AQUÍ: Extraer 'results' o usar la respuesta completa
    setCategories(categoriesData); // Establecer el array de categorías
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError("No se pudieron cargar las categorías.");
      toast.error("Error al cargar categorías.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (categoryToDelete) {
      try {
        await adminService.deleteCategory(categoryToDelete.slug);
        toast.success(`Categoría "${categoryToDelete.nombre}" eliminada.`);
        fetchCategories(); // Recargar la lista
      } catch (err) {
        console.error("Error deleting category:", err.response?.data || err.message);
        toast.error(`Error al eliminar categoría: ${err.response?.data?.detail || err.message}`);
      } finally {
        setIsModalOpen(false);
        setCategoryToDelete(null);
      }
    }
  };

const categoryHeaders = [
    { field: 'id', label: 'ID' },
    { field: 'nombre', label: 'Nombre' },
    { field: 'slug', label: 'Slug' },
    { field: 'is_active', label: 'Activa' },
  ];


  const renderCategoryActions = (category) => (
    <>
      <Link
        to={`/admin-panel/categorias/edit/${category.slug}`}
        className={`inline-flex items-center p-2 rounded-md ${btnEdit} text-sm`}
      >
        <Edit size={16} />
      </Link>
      <button
        onClick={() => handleDeleteClick(category)}
        className={`inline-flex items-center p-2 rounded-md ${btnDelete} text-sm ml-2`}
      >
        <Trash2 size={16} />
      </button>
    </>
  );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Gestión de Categorías</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="flex justify-end mb-6">
        <Link
          to="/admin-panel/categorias/new"
          className={`inline-flex items-center px-4 py-2 rounded-md font-semibold ${btnPrimary} transition-colors`}
        >
          <PlusCircle size={20} className="mr-2" />
          Nueva Categoría
        </Link>
      </div>

      <AdminTable
        headers={categoryHeaders}
        data={categories.map(cat => ({
            id: cat.id,
            nombre: cat.nombre,
            slug: cat.slug,
            is_active: cat.is_active,
        }))} // Adaptar data para la tabla
        renderRowActions={renderCategoryActions}
        isLoading={loading}
      />

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        message={`¿Estás seguro de que quieres eliminar la categoría "${categoryToDelete?.nombre}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}
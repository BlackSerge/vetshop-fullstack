// src/pages/admin/AdminProductListPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, PlusCircle, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import { useThemeStore } from '../../store/useThemeStore';
import adminService from '../../services/adminService';
import AdminTable from '../../components/admin/AdminTable';
import ConfirmModal from '../../components/ConfirmModal';

export default function AdminProductListPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Filtros y Paginación
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [categoriesOptions, setCategoriesOptions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [productsCount, setProductsCount] = useState(0);
  
  const PAGE_SIZE = 12;

  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';

  const btnPrimary = isDark ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-700 hover:bg-purple-800 text-white';
  const btnEdit = 'bg-blue-500 hover:bg-blue-600 text-white';
  const btnDelete = 'bg-red-500 hover:bg-red-600 text-white';
  const btnImage = 'bg-green-500 hover:bg-green-600 text-white';
  const inputClass = isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300';
  const paginationBtn = isDark ? "bg-gray-700 hover:bg-purple-500 text-gray-200" : "bg-gray-200 hover:bg-purple-300 text-gray-800";
  const paginationBtnActive = isDark ? "bg-purple-600 text-white" : "bg-purple-700 text-white";

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        page_size: PAGE_SIZE,
        search: searchQuery,
        categoria: filterCategory === '' ? undefined : filterCategory,
      };

      const data = await adminService.getProducts(params);
      
      
      let productsArray = [];
      let totalCount = 0;

      if (data.results && Array.isArray(data.results)) {
        productsArray = data.results;
        totalCount = data.count;
        setTotalPages(Math.ceil(data.count / PAGE_SIZE));
      } else if (Array.isArray(data)) {
        productsArray = data;
        totalCount = data.length;
        setTotalPages(1);
      } else {
        console.error("DEBUG: Formato de respuesta desconocido:", data);
        productsArray = [];
      }

      setProducts(productsArray);
      setProductsCount(totalCount);

    } catch (err) {
      console.error("Error fetching products:", err);
      setError("No se pudieron cargar los productos.");
      toast.error("Error al cargar productos.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, filterCategory, PAGE_SIZE]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const fetchCategoriesOptions = async () => {
      try {
        const response = await adminService.getCategories();
        const categoriesData = response.results || response.data || response; 
        const list = Array.isArray(categoriesData) ? categoriesData : [];
        setCategoriesOptions([
          { value: '', label: 'Todas las categorías' },
          ...list.map(cat => ({ value: cat.slug, label: cat.nombre }))
        ]);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategoriesOptions();
  }, []);

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setIsModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await adminService.deleteProduct(productToDelete.slug);
      toast.success(`Producto "${productToDelete.nombre}" eliminado.`);
      fetchProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error("Error al eliminar el producto.");
    } finally {
      setIsModalOpen(false);
      setProductToDelete(null);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const productHeaders = [
    { field: 'id', label: 'ID' },
    { field: 'nombre', label: 'Nombre' },
    { field: 'categoria_display_name', label: 'Categoría' },
    { field: 'precio_formateado', label: 'Precio' },
    { field: 'stock', label: 'Stock' },
    { field: 'is_active', label: 'Activo' },
    { field: 'is_featured', label: 'Destacado' },
  ];

  const renderProductActions = (product) => {
    
    const editLink = `/admin-panel/productos/edit/${product.slug}`;
    const imagesLink = `/admin-panel/productos/${product.slug}/imagenes`;
    
    
    
    if (!product.slug) {
        console.error("   ⚠️ ALERTA: El slug es undefined o vacío. El enlace fallará.");
    }
    // ----------------------------------------

    return (
        <>
        <Link
            to={editLink}
            className={`inline-flex items-center p-2 rounded-md ${btnEdit} text-sm`}
            title="Editar"
        >
            <Edit size={16} />
        </Link>
        <Link
            to={imagesLink}
            className={`inline-flex items-center p-2 rounded-md ${btnImage} text-sm ml-2`}
            title="Gestionar Imágenes"
        >
            <ImageIcon size={16} />
        </Link>
        <button
            onClick={() => handleDeleteClick(product)}
            className={`inline-flex items-center p-2 rounded-md ${btnDelete} text-sm ml-2`}
            title="Eliminar"
        >
            <Trash2 size={16} />
        </button>
        </>
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Gestión de Productos</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <Link
          to="/admin-panel/productos/new"
          className={`inline-flex items-center px-4 py-2 rounded-md font-semibold ${btnPrimary} transition-colors`}
        >
          <PlusCircle size={20} className="mr-2" />
          Nuevo Producto
        </Link>
        <div className="flex gap-4">
            <input
                type="text"
                placeholder="Buscar por nombre o SKU..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1); 
                }}
                className={`w-full p-2 rounded-lg border ${inputClass} focus:ring-2 focus:ring-purple-500 transition-all`}
            />
            <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className={`w-full p-2 rounded-lg border ${inputClass} focus:ring-2 focus:ring-purple-500 transition-all`}
            >
                {categoriesOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
        </div>
      </div>

      <AdminTable
        headers={productHeaders}
        data={products.map(prod => ({
            id: prod.id,
            nombre: prod.nombre,
            categoria_display_name: prod.categoria_info?.nombre || 'Sin categoría',
            precio_formateado: `$${(parseFloat(prod.precio_oferta) || parseFloat(prod.precio)).toFixed(2)}`,
            stock: prod.stock,
            is_active: prod.is_active,
            is_featured: prod.is_featured,
            slug: prod.slug  // Asegurarse de pasar el slug aquí
        }))}
        renderRowActions={renderProductActions}
        isLoading={loading}
      />

      {totalPages > 1 && (
        <div className="flex justify-center mt-8 gap-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`py-2 px-4 rounded-lg ${paginationBtn} ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Anterior
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              onClick={() => handlePageChange(i + 1)}
              className={`py-2 px-4 rounded-lg ${currentPage === i + 1 ? paginationBtnActive : paginationBtn}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`py-2 px-4 rounded-lg ${paginationBtn} ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Siguiente
          </button>
        </div>
      )}
       
       {productsCount > 0 && (
          <p className="text-center mt-4 text-sm text-gray-500 dark:text-gray-400">
              Mostrando {products.length} de {productsCount} productos.
          </p>
      )}

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        message={`¿Estás seguro de que quieres eliminar el producto "${productToDelete?.nombre}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
}
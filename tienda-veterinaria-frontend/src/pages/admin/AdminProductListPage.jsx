import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, Plus, Image as ImageIcon, Search, Filter } from 'lucide-react';
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

  const btnAction = isDark ? "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600" : "bg-white hover:bg-gray-50 text-gray-600 border border-gray-200";

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
      toast.success(`Producto eliminado correctamente.`);
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
    { field: 'nombre', label: 'Producto' },
    { field: 'categoria_display_name', label: 'Categoría' },
    { field: 'precio_formateado', label: 'Precio' },
    { field: 'stock', label: 'Stock' },
    { field: 'is_active', label: 'Estado' },
  ];

  const renderProductActions = (product) => {
    const editLink = `/admin-panel/productos/edit/${product.slug}`;
    const imagesLink = `/admin-panel/productos/${product.slug}/imagenes`;

    return (
        <div className="flex gap-2 justify-end">
            <Link
                to={editLink}
                className={`p-2 rounded-xl transition-colors ${isDark ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                title="Editar"
            >
                <Edit size={18} />
            </Link>
            <Link
                to={imagesLink}
                className={`p-2 rounded-xl transition-colors ${isDark ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                title="Imágenes"
            >
                <ImageIcon size={18} />
            </Link>
            <button
                onClick={() => handleDeleteClick(product)}
                className={`p-2 rounded-xl transition-colors ${isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                title="Eliminar"
            >
                <Trash2 size={18} />
            </button>
        </div>
    );
  };

  return (
    <div className="w-full pb-32 animate-fadeIn">
      
      {/* Header Mobile-First */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className={`text-3xl sm:text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Productos</h1>
            <p className={`text-sm sm:text-base mt-2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Gestiona el inventario de tu tienda</p>
          </div>
          
          <Link
            to="/admin-panel/productos/new"
            className="inline-flex items-center justify-center px-6 py-3 rounded-2xl font-bold bg-purple-600 text-white shadow-lg shadow-purple-500/30 hover:bg-purple-700 active:scale-95 transition-all w-full sm:w-auto gap-2"
          >
            <Plus size={20} />
            Nuevo Producto
          </Link>
      </div>

      {error && <div className="p-4 mb-6 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-xl">{error}</div>}

      {/* Filters Bar - Fixed Colors */}
      <div className={`p-2 rounded-3xl mb-8 border flex flex-col md:flex-row gap-3 shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
          <div className={`flex-1 flex items-center gap-3 p-2 rounded-2xl border transition-all focus-within:ring-2 focus-within:ring-purple-500/20 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-50 shadow-inner'}`}>
              <Search className="text-gray-400 ml-2" size={18} />
              <input
                  type="text"
                  placeholder="Buscar por nombre, SKU..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent w-full text-sm font-bold outline-none text-gray-900 dark:text-white placeholder-gray-400/60"
              />
          </div>
          
          <div className={`relative md:w-72 flex items-center gap-2 p-2 rounded-2xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-50 shadow-inner'}`}>
              <Filter className="text-gray-400 ml-2" size={18} />
              <select
                  value={filterCategory}
                  onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                  className={`bg-transparent w-full text-sm font-bold outline-none cursor-pointer appearance-none pr-8 ${isDark ? 'text-white' : 'text-gray-900'}`}
              >
                  {categoriesOptions.map(option => (
                      <option key={option.value} value={option.value} className={isDark ? "bg-gray-800 text-white" : "bg-white text-gray-900"}>{option.label}</option>
                  ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
              </div>
          </div>
      </div>

      <AdminTable
        headers={productHeaders}
        data={products.map(prod => ({
            id: prod.id,
            nombre: (
                <div className="font-medium">{prod.nombre}</div>
            ),
            nombre_text: prod.nombre, // <--- Texto plano para el modal
            categoria_display_name: (
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wide border ${isDark ? 'bg-gray-800 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                    {prod.categoria_info?.nombre || '—'}
                </span>
            ),
            precio_formateado: <span className="font-mono font-bold text-purple-500">{`$${(parseFloat(prod.precio_oferta) || parseFloat(prod.precio)).toFixed(2)}`}</span>,
            stock: (
                <span className={`font-bold ${prod.stock < 5 ? 'text-red-500' : isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {prod.stock || 0}
                </span>
            ),
            is_active: prod.is_active, 
            is_featured: prod.is_featured,
            slug: prod.slug
        }))}
        renderRowActions={renderProductActions}
        isLoading={loading}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-8 gap-3">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-xl font-bold transition-colors ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : ''} ${btnAction}`}
          >
            ←
          </button>
          
          <div className="flex gap-2 overflow-x-auto max-w-[200px] sm:max-w-none scrollbar-hide p-1">
            {[...Array(totalPages)].map((_, i) => (
                <button
                key={i + 1}
                onClick={() => handlePageChange(i + 1)}
                className={`w-10 h-10 rounded-xl font-bold flex-shrink-0 transition-colors shadow-sm ${
                    currentPage === i + 1 
                    ? 'bg-purple-600 text-white shadow-purple-500/30' 
                    : btnAction
                }`}
                >
                {i + 1}
                </button>
            ))}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-xl font-bold transition-colors ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : ''} ${btnAction}`}
          >
            →
          </button>
        </div>
      )}
       
       {productsCount > 0 && (
          <p className={`text-center mt-6 text-xs font-bold uppercase tracking-widest opacity-50 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {products.length} de {productsCount} productos
          </p>
      )}

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDelete}
        message={`¿Eliminar "${productToDelete?.nombre_text}"? Esta acción es irreversible.`}
      />
    </div>
  );
}
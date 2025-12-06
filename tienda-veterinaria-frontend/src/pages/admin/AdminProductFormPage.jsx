// src/pages/admin/AdminProductFormPage.jsx
import  { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import adminService from '../../services/adminService';
import { useThemeStore } from '../../store/useThemeStore';
import AdminFormInput from '../../components/admin/AdminFormInput';
import AdminFormSelect from '../../components/admin/AdminFormSelect';
import AdminFormCheckbox from '../../components/admin/AdminFormCheckbox';
import LoadingSpinner from '../../components/LoadingSpinner';

const PET_TYPE_OPTIONS = [
  { value: '', label: '— Seleccionar —' },
  { value: 'perro', label: 'Perro' },
  { value: 'gato', label: 'Gato' },
  { value: 'ave', label: 'Ave' },
  { value: 'roedor', label: 'Roedor' },
  { value: 'reptil', label: 'Reptil' },
  { value: 'otros', label: 'Otros' },
];

export default function AdminProductFormPage() {
  const { slug } = useParams(); // Para modo edición
  const navigate = useNavigate();
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';

  const [productData, setProductData] = useState({
    nombre: '',
    descripcion_corta: '',
    descripcion_larga: '',
    precio: '',
    precio_oferta: '',
    categoria: '', // ID de la categoría
    sku: '',
    stock: '',
    is_active: true,
    is_featured: false,
    marca: '',
    tipo_mascota: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [categoriesOptions, setCategoriesOptions] = useState([]);

  const isEditing = !!slug;

  const btnPrimary = isDark ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-700 hover:bg-purple-800 text-white';
  const btnSecondary = isDark ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allCategoriesResponse = await adminService.getCategories(); // Obtener respuesta completa
        const categoriesData = allCategoriesResponse.results || allCategoriesResponse;
        setCategoriesOptions([{ value: '', label: '— Seleccionar —' }, ...categoriesData.map(cat => ({ value: cat.id, label: cat.nombre }))]);

        if (isEditing) {
          const data = await adminService.getProduct(slug);
          setProductData({
            nombre: data.nombre,
            descripcion_corta: data.descripcion_corta || '',
            descripcion_larga: data.descripcion_larga || '',
            precio: data.precio || '',
            precio_oferta: data.precio_oferta || '',
            categoria: data.categoria || '',
            sku: data.sku || '',
            stock: data.stock || '',
            is_active: data.is_active,
            is_featured: data.is_featured,
            marca: data.marca || '',
            tipo_mascota: data.tipo_mascota || '',
          });
        }
      } catch (err) {
        console.error("Error fetching product data:", err);
        setError("No se pudo cargar el producto o las opciones.");
        toast.error("Error al cargar datos.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, isEditing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const dataToSend = { ...productData };
    // Asegurarse de enviar null si no hay categoria seleccionada
    if (dataToSend.categoria === '') {
      dataToSend.categoria = null;
    }
    // Convertir precios y stock a números si vienen como string del input
    dataToSend.precio = parseFloat(dataToSend.precio);
    dataToSend.precio_oferta = dataToSend.precio_oferta ? parseFloat(dataToSend.precio_oferta) : null;
    dataToSend.stock = parseInt(dataToSend.stock);

    try {
      if (isEditing) {
        await adminService.updateProduct(slug, dataToSend);
        toast.success("Producto actualizado con éxito!");
      } else {
        await adminService.createProduct(dataToSend);
        toast.success("Producto creado con éxito!");
      }
      navigate('/admin-panel/productos');
    } catch (err) {
      console.error("Error saving product:", err.response?.data || err.message);
      const errMessages = err.response?.data;
      let displayError = "Error al guardar el producto.";
      if (errMessages) {
          if (errMessages.nombre) displayError = `Nombre: ${errMessages.nombre[0]}`;
          else if (errMessages.precio) displayError = `Precio: ${errMessages.precio[0]}`;
          else if (errMessages.stock) displayError = `Stock: ${errMessages.stock[0]}`;
          else if (errMessages.sku) displayError = `SKU: ${errMessages.sku[0]}`;
          else if (errMessages.detail) displayError = errMessages.detail;
      }
      setError(displayError);
      toast.error(`Error: ${displayError}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-[500px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">{isEditing ? `Editar Producto: ${productData.nombre}` : 'Crear Nuevo Producto'}</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className={`p-8 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} space-y-6`}>
        <AdminFormInput
          label="Nombre del Producto"
          name="nombre"
          value={productData.nombre}
          onChange={handleChange}
          placeholder="Ej: Alimento para cachorros"
          required
        />
        <AdminFormInput
          label="Descripción Corta"
          name="descripcion_corta"
          value={productData.descripcion_corta}
          onChange={handleChange}
          textarea
          placeholder="Breve resumen del producto"
        />
        <AdminFormInput
          label="Descripción Larga"
          name="descripcion_larga"
          value={productData.descripcion_larga}
          onChange={handleChange}
          textarea
          placeholder="Descripción completa del producto"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AdminFormInput
            label="Precio"
            name="precio"
            type="number"
            value={productData.precio}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            required
          />
          <AdminFormInput
            label="Precio de Oferta (opcional)"
            name="precio_oferta"
            type="number"
            value={productData.precio_oferta}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminFormSelect
                label="Categoría"
                name="categoria"
                options={categoriesOptions}
                value={productData.categoria}
                onChange={handleChange}
            />
            <AdminFormInput
                label="SKU (código de stock, opcional)"
                name="sku"
                value={productData.sku}
                onChange={handleChange}
                placeholder="SKU-12345"
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminFormInput
                label="Stock"
                name="stock"
                type="number"
                value={productData.stock}
                onChange={handleChange}
                placeholder="0"
                required
            />
            <AdminFormInput
                label="Marca (opcional)"
                name="marca"
                value={productData.marca}
                onChange={handleChange}
                placeholder="Ej: Purina, Royal Canin"
            />
        </div>
        <AdminFormSelect
            label="Tipo de Mascota"
            name="tipo_mascota"
            options={PET_TYPE_OPTIONS}
            value={productData.tipo_mascota}
            onChange={handleChange}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminFormCheckbox
                label="Producto Activo"
                name="is_active"
                checked={productData.is_active}
                onChange={handleChange}
            />
            <AdminFormCheckbox
                label="Producto Destacado"
                name="is_featured"
                checked={productData.is_featured}
                onChange={handleChange}
            />
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin-panel/productos')}
            className={`py-2 px-4 rounded-md font-semibold ${btnSecondary} transition-colors`}
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={`py-2 px-4 rounded-md font-semibold ${btnPrimary} transition-colors`}
            disabled={saving}
          >
            {saving ? <LoadingSpinner /> : (isEditing ? 'Guardar Cambios' : 'Crear Producto')}
          </button>
        </div>
      </form>
    </div>
  );
}
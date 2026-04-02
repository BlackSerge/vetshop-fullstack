import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import adminService from '../services/adminService';
import AdminFormInput from '../components/AdminFormInput';
import AdminFormCheckbox from '../components/AdminFormCheckbox';
import { LoadingSpinner } from '@/shared';
import { useThemeStore } from '@/shared';
import type { CategoryFormState, FormError } from '../types';

export default function AdminCategoryFormPage(): JSX.Element {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const theme = useThemeStore((state) => state.theme) as string;
  const isDark = theme === 'dark';

  const [categoryData, setCategoryData] = useState<CategoryFormState>({
    nombre: '',
    slug: '',
    descripcion: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!slug;

  const btnPrimary = isDark ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-700 hover:bg-purple-800 text-white';
  const btnSecondary = isDark ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800';

  useEffect(() => {
    const fetchCategoryData = async (): Promise<void> => {
      try {
        if (isEditing && slug) {
          const data = await adminService.getCategory(slug);
          setCategoryData({
            nombre: data.nombre,
            slug: data.slug || '',
            descripcion: data.descripcion || '',
            is_active: data.is_active ?? true,
          });
        }
      } catch (err) {
        console.error("Error fetching category data:", err);
        setError("No se pudo cargar la categoría.");
        toast.error("Error al cargar datos.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryData();
  }, [slug, isEditing]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, type } = e.target;
    const value = type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;

    setCategoryData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const dataToSend = { ...categoryData };

    try {
      if (isEditing && slug) {
        await adminService.updateCategory(slug, dataToSend);
        toast.success("Categoría actualizada con éxito!");
      } else {
        await adminService.createCategory(dataToSend);
        toast.success("Categoría creada con éxito!");
      }
      navigate('/admin-panel/categorias');
    } catch (err: any) {
      console.error("Error saving category:", err.response?.data || err.message);
      const errData = err.response?.data as FormError;
      let errMessage = "Error al guardar la categoría.";
      
      if (errData) {
        if (Array.isArray(errData.nombre)) {
          errMessage = errData.nombre[0];
        } else if (Array.isArray(errData.slug)) {
          errMessage = errData.slug[0];
        } else if (typeof errData.detail === 'string') {
          errMessage = errData.detail;
        }
      }
      
      setError(errMessage);
      toast.error(`Error: ${errMessage}`);
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
      <h1 className="text-3xl font-bold mb-6">{isEditing ? `Editar Categoría: ${categoryData.nombre}` : 'Crear Nueva Categoría'}</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className={`p-8 rounded-xl shadow-lg ${isDark ? 'bg-gray-800' : 'bg-white'} space-y-6`}>
        <AdminFormInput
          label="Nombre de la Categoría"
          name="nombre"
          value={categoryData.nombre}
          onChange={handleChange}
          error={null} 
          placeholder="Ej: Alimentos, Juguetes"
          required
        />
        <AdminFormInput
          label="Slug de la Categoría (URL amigable)"
          name="slug"
          value={categoryData.slug}
          onChange={handleChange}
          error={null}
          placeholder="Ej: alimentos-perro"
        />
        <AdminFormInput
          label="Descripción"
          name="descripcion"
          value={categoryData.descripcion}
          onChange={handleChange}
          textarea
          error={null}
          placeholder="Breve descripción de la categoría"
        />
      
        <AdminFormCheckbox
          label="Categoría Activa"
          name="is_active"
          checked={categoryData.is_active}
          onChange={handleChange}
        />

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/admin-panel/categorias')}
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
            {saving ? <LoadingSpinner /> : (isEditing ? 'Guardar Cambios' : 'Crear Categoría')}
          </button>
        </div>
      </form>
    </div>
  );
}



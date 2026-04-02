import { useState, useEffect, useCallback, ChangeEvent, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Image as ImageIcon, Plus, ArrowLeft, UploadCloud, Trash2 } from 'lucide-react';
import { useThemeStore } from '@/shared';
import adminService from '../services/adminService';
import { LoadingSpinner } from '@/shared';
import ImageUploader from '../components/ImageUploader';
import AdminFormInput from '../components/AdminFormInput';
import { ConfirmModal } from '@/shared';
import type { ProductoCreateUpdate, ImagenProductoAdmin } from '../types';

interface ProductWithImages extends ProductoCreateUpdate {
  imagenes?: ImagenProductoAdmin[];
}

export default function AdminProductImageManagerPage(): JSX.Element {
  const { slug } = useParams<{ slug?: string }>();
  const theme = useThemeStore((state) => state.theme) as string;
  const isDark = theme === 'dark';

  const [product, setProduct] = useState<ProductWithImages | null>(null);
  const [featuredImage, setFeaturedImage] = useState<ImagenProductoAdmin | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImageAltText, setNewImageAltText] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [imageToDelete, setImageToDelete] = useState<ImagenProductoAdmin | null>(null);

  const cardBgClass = isDark ? 'bg-gray-800' : 'bg-white';
  const btnPrimary = isDark ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-700 hover:bg-purple-800 text-white';
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200'; 


  const fetchProductAndImage = useCallback(async (): Promise<void> => {
    if (!slug) return;
    setLoading(true);
    try {
      // Fetch product and images in parallel
      const [productData, imagesResponse] = await Promise.all([
        adminService.getProduct(slug),
        adminService.getProductImages(slug)
      ]);
      
      // Combine product data with images
      const productWithImages: ProductWithImages = {
        ...productData,
        imagenes: imagesResponse.results || []
      };
      
      setProduct(productWithImages);
      
      const images = productWithImages.imagenes || [];
      let mainImg = images.find((img: ImagenProductoAdmin) => img.is_feature);
      if (!mainImg && images.length > 0) {
          mainImg = images.sort((a: ImagenProductoAdmin, b: ImagenProductoAdmin) => b.id - a.id)[0];
      }
      setFeaturedImage(mainImg || null);

    } catch (err) {
      console.error("Error fetching product:", err);
      setError("No se pudo cargar el producto.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchProductAndImage();
  }, [fetchProductAndImage]);

  const handleUploadImage = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!newImageFile) {
      toast.error("Selecciona una imagen.");
      return;
    }
    
    if (!product?.id) {
      toast.error("Error de ID.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('imagen', newImageFile);
      formData.append('producto', String(product.id));
      formData.append('is_feature', 'true');
      
      if (newImageAltText) formData.append('alt_text', newImageAltText);

      await adminService.uploadProductImage(formData);
      toast.success("Imagen actualizada correctamente");
      
      setNewImageFile(null);
      setNewImageAltText('');
      await fetchProductAndImage(); 
      
    } catch (err) {
      console.error(err);
      toast.error("Error al subir imagen.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteClick = (image: ImagenProductoAdmin | null): void => {
    if (!image) return;
    setImageToDelete(image);
    setIsModalOpen(true);
  };

  const confirmDeleteImage = async () => {
    if (imageToDelete) {
      try {
        await adminService.deleteProductImage(imageToDelete.id);
        toast.success("Imagen eliminada.");
        setFeaturedImage(null); 
        await fetchProductAndImage(); 
      } catch (err) {
        toast.error("Error al eliminar imagen.");
      } finally {
        setIsModalOpen(false);
        setImageToDelete(null);
      }
    }
  };

  if (loading) return <div className="p-12 flex justify-center"><LoadingSpinner /></div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;
  if (!product) return <div className="p-6">Producto no encontrado.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center mb-8 border-b pb-4 dark:border-gray-700">
        <Link to="/admin-panel/productos" className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <ArrowLeft size={24} />
        </Link>
        <div>
            <h1 className="text-2xl font-bold">Imagen del Producto</h1>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Editando: <span className="font-semibold text-purple-500">{product.nombre}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

        <div className={`p-6 rounded-xl shadow-lg ${cardBgClass} border ${borderClass} flex flex-col items-center text-center relative group`}>
            <h2 className="text-lg font-semibold mb-4 text-gray-500 uppercase tracking-wider text-xs">Foto Actual</h2>
            
            <div className={`relative w-full aspect-square max-w-xs rounded-lg overflow-hidden border-2 border-dashed flex items-center justify-center mb-4 group-hover:border-purple-400 transition-colors ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                {featuredImage && featuredImage.imagen ? (
                    <>
                        <img 
                            src={featuredImage.imagen} 
                            alt={featuredImage.alt_text || "Imagen del producto"} 
                            className="w-full h-full object-contain p-2"
                        />
                        
                        <button
                            onClick={() => handleDeleteClick(featuredImage)}
                            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-700 transform hover:scale-110"
                            title="Eliminar imagen"
                        >
                            <Trash2 size={18} />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center text-gray-400">
                        <ImageIcon size={48} className="mb-2 opacity-50" />
                        <span>Sin imagen</span>
                    </div>
                )}
            </div>

            {featuredImage && featuredImage.imagen && (
                <div className="w-full flex justify-between items-center mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded text-sm">
                    <div className="text-left overflow-hidden pr-2">
                        <p className="truncate font-medium">{featuredImage.imagen.split('/').pop()}</p>
                        <p className="text-xs text-gray-500 truncate">{featuredImage.alt_text || "Sin descripción"}</p>
                    </div>
                    
                    <button 
                        onClick={() => handleDeleteClick(featuredImage)}
                        className="text-red-500 hover:text-red-700 text-xs font-bold uppercase flex items-center gap-1 px-2 py-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    >
                        <Trash2 size={14} /> Eliminar
                    </button>
                </div>
            )}
        </div>

        <div className={`p-6 rounded-xl shadow-lg ${cardBgClass} border ${borderClass}`}>
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
                <UploadCloud size={20} className="text-purple-500" /> Cambiar Imagen
            </h2>
            
            <form onSubmit={handleUploadImage} className="space-y-6">
                <ImageUploader
                    onImageSelect={setNewImageFile}
                    onImageRemove={() => setNewImageFile(null)}
                    currentImageUrl={featuredImage?.imagen || null}
                    label="Seleccionar nuevo archivo"
                    error={null}
                />
                
                <AdminFormInput
                    label="Texto Alternativo (SEO)"
                    name="alt_text"
                    value={newImageAltText}
                    onChange={(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setNewImageAltText(e.target.value)}
                    placeholder="Descripción de la imagen..."
                />

                <button
                    type="submit"
                    className={`w-full py-3 px-4 rounded-lg font-bold shadow-md transform active:scale-95 transition-all flex justify-center items-center gap-2 ${btnPrimary}`}
                    disabled={isUploading || !newImageFile}
                >
                    {isUploading ? <LoadingSpinner /> : <><Plus size={20} /> Actualizar Foto</>}
                </button>
            </form>
            
            <p className="text-xs text-center mt-4 text-gray-400">
                Al subir una nueva imagen, esta reemplazará a la actual.
            </p>
        </div>

      </div>

      <ConfirmModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={confirmDeleteImage}
        message="¿Estás seguro de que quieres eliminar la imagen actual? El producto se quedará sin foto."
      />
    </div>
  );
}



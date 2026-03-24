import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Check, AlertCircle, Truck, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { Helmet } from 'react-helmet-async';

// Queries
import { useProductDetail } from '../hooks/useProductQueries';

import LoadingSpinner from '../components/LoadingSpinner';
import ProductReviews from '../components/ProductReviews';
import { useCartStore } from '../store/useCartStore';
import { useThemeStore } from '../store/useThemeStore';
import { formatPrice } from "../utils/format";

export default function ProductDetailPage() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';

  const [selectedImage, setSelectedImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);

  // --- REACT QUERY ---
  const { data: product, isLoading, isError, refetch } = useProductDetail(id);

  // Estilos
  const bgPage = isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900";
  const cardBg = isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textMuted = isDark ? "text-gray-400" : "text-gray-500";

  // Efecto para setear imagen inicial cuando llega el producto
  useEffect(() => {
    if (product) {
        // Encontra la imagen destacada o la primera disponible
        const mainImg = (product.imagenes && product.imagenes.find(img => img.is_feature)) || 
                        (product.imagenes && product.imagenes[0]);
        
        if (mainImg) {
            setSelectedImage(mainImg.imagen);
        } else {
            setSelectedImage(product.imagen || '/placeholder.jpg');
        }
    }
  }, [product]);

  useEffect(() => {
      setImageLoaded(false);
  }, [selectedImage]);

  // Manejo de error
  useEffect(() => {
      if (isError) {
          toast.error("Producto no encontrado.");
          navigate('/products');
      }
  }, [isError, navigate]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity);
  };

  if (isLoading) return <div className={`min-h-screen flex justify-center items-center ${bgPage}`}><LoadingSpinner /></div>;
  if (!product) return null;

  // Adaptación de datos
  const stock = product.stock !== undefined ? product.stock : 50;
  const isOutOfStock = stock <= 0;
  const currentPrice = product.effective_price || product.get_precio_actual || product.precio;
  const categoryName = product.categoria_info?.nombre || product.categoria || "General";
  const description = product.descripcion_larga || product.descripcion || "Descripción detallada no disponible para este producto.";

  return (
    <div className={`min-h-screen py-12 px-4 ${bgPage}`}>
      
      <Helmet>
        <title>{product.nombre} | VetShop</title>
        <meta name="description" content={product.descripcion || `Compra ${product.nombre} al mejor precio.`} />
      </Helmet>
      
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-6">
            <Link to="/products" className={`inline-flex items-center gap-2 text-sm font-medium hover:underline ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <ArrowLeft size={16} /> Volver a la tienda
            </Link>
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 p-6 md:p-10 rounded-3xl shadow-xl border ${cardBg}`}>
            
            {/* COLUMNA IZQUIERDA: IMAGEN PRINCIPAL (Sin Galería) */}
            <div className="flex items-center justify-center">
                <div className="w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 relative min-h-[300px] bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center shadow-inner">
                    
                    {!imageLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                             <div className="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded-full opacity-20"></div>
                        </div>
                    )}

                    <img 
                        src={selectedImage} 
                        alt={product.nombre} 
                        className={`w-full h-auto max-h-[600px] block object-contain transition-opacity duration-500 p-4 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => setImageLoaded(true)}
                    />
                </div>
            </div>

            {/* COLUMNA DERECHA: INFO */}
            <div>
                {categoryName && (
                    <span className="text-purple-600 font-bold text-sm tracking-wider uppercase bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-full">
                        {categoryName}
                    </span>
                )}
                
                <h1 className="text-3xl md:text-4xl font-extrabold mt-4 mb-2">{product.nombre}</h1>
                
                <div className="flex items-end gap-4 mb-6 border-b border-gray-200 dark:border-gray-700 pb-6">
                    <p className="text-4xl font-bold text-purple-600">
                        {formatPrice(currentPrice)}
                    </p>
                    
                    {product.precio > currentPrice && (
                        <p className="text-xl text-gray-400 line-through mb-1">
                            {formatPrice(product.precio)}
                        </p>
                    )}
                    
                    <div className="ml-auto">
                        {isOutOfStock ? (
                            <span className="flex items-center gap-1 text-red-500 font-bold bg-red-100 px-3 py-1 rounded-full">
                                <AlertCircle size={16}/> Agotado
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-green-600 font-bold bg-green-100 px-3 py-1 rounded-full">
                                <Check size={16}/> En Stock ({stock})
                            </span>
                        )}
                    </div>
                </div>

                <p className={`text-lg leading-relaxed mb-8 ${textMuted}`}>
                    {product.descripcion || product.nombre}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden w-fit">
                        <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50" disabled={isOutOfStock}>-</button>
                        <span className="px-4 font-bold w-12 text-center">{quantity}</span>
                        <button onClick={() => setQuantity(q => Math.min(stock, q + 1))} className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50" disabled={isOutOfStock || quantity >= stock}>+</button>
                    </div>

                    <button
                        onClick={handleAddToCart}
                        disabled={isOutOfStock}
                        className={`flex-1 py-3 px-8 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 ${isOutOfStock ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                    >
                        <ShoppingCart size={20} /> Añadir al Carrito
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <Truck className="text-blue-500" />
                        <span className="text-sm font-medium">Envío Rápido</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <ShieldCheck className="text-green-500" />
                        <span className="text-sm font-medium">Garantía de Calidad</span>
                    </div>
                </div>

                <div className="prose dark:prose-invert max-w-none mb-12">
                    <h3 className="text-xl font-bold mb-2">Detalles del Producto</h3>
                    <p className={`whitespace-pre-line ${textMuted}`}>
                        {description}
                    </p>
                </div>

                <ProductReviews 
                   productId={product.id} 
                   reviews={product.reviews} 
                   onReviewAdded={refetch} // React Query refetch
                /> 

            </div>
        </div>

      </div>
    </div>
  );
}
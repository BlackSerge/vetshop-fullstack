import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Check, AlertCircle, Truck, ShieldCheck } from 'lucide-react';
import { toast } from 'react-toastify';
import { Helmet } from 'react-helmet-async';

import api from '../api/axios';
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

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  
  const [imageLoaded, setImageLoaded] = useState(false);

  // Estilos
  const bgPage = isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900";
  const cardBg = isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textMuted = isDark ? "text-gray-400" : "text-gray-500";

  useEffect(() => {
      setImageLoaded(false);
  }, [selectedImage]);

  const fetchProduct = async () => {
      try {
        // Intentamos obtener el producto específico por ID
        // Esto funcionará tanto con el Mock actualizado como con un Backend real
        const response = await api.get(`/productos/items/${id}/`);
        const foundProduct = response.data;

        if (!foundProduct) {
            throw new Error("Datos de producto vacíos");
        }

        setProduct(foundProduct);
        
        // Configurar imagen inicial
        if (!selectedImage) {
            if (foundProduct.imagenes && foundProduct.imagenes.length > 0) {
                const mainImg = foundProduct.imagenes.find(img => img.is_feature) || foundProduct.imagenes[0];
                setSelectedImage(mainImg.imagen);
            } else {
                setSelectedImage(foundProduct.imagen || '/placeholder.jpg');
            }
        }
      } catch (error) {
        console.error("Error cargando producto:", error);
        toast.error("Producto no encontrado o error de conexión.");
        navigate('/products');
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    setLoading(true);
    fetchProduct();
  }, [id, navigate]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity);
  };

  if (loading) return <div className={`min-h-screen flex justify-center items-center ${bgPage}`}><LoadingSpinner /></div>;
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
            
            {/* COLUMNA IZQUIERDA: GALERÍA */}
            <div className="space-y-4">
                
                <div className="w-full rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 relative min-h-[300px] bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center">
                    
                    {!imageLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center animate-pulse">
                             <div className="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded-full opacity-20"></div>
                        </div>
                    )}

                    <img 
                        src={selectedImage} 
                        alt={product.nombre} 
                        className={`w-full h-auto max-h-[600px] block object-contain transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                        onLoad={() => setImageLoaded(true)}
                    />
                </div>
                
                {/* Miniaturas */}
                {product.imagenes && product.imagenes.length > 1 && (
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide justify-center lg:justify-start">
                        {product.imagenes.map((img) => (
                            <button 
                                key={img.id}
                                onClick={() => setSelectedImage(img.imagen)}
                                className={`w-16 h-16 flex-shrink-0 rounded-lg border-2 overflow-hidden p-1 bg-white dark:bg-gray-700 transition-all ${selectedImage === img.imagen ? 'border-purple-600 ring-2 ring-purple-200 dark:ring-purple-900' : 'border-transparent hover:border-gray-300'}`}
                            >
                                <img src={img.imagen} alt="" className="w-full h-full object-contain" />
                            </button>
                        ))}
                    </div>
                )}
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
                   onReviewAdded={fetchProduct} 
                /> 

            </div>
        </div>

      </div>
    </div>
  );
}
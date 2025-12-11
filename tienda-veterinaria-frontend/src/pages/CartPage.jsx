import { useNavigate, Link } from 'react-router-dom';
import { Plus, Minus, ShoppingBag, Trash2, ArrowRight, ArrowLeft, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

// Stores
import { useCartStore } from '../store/useCartStore';
import { useThemeStore } from '../store/useThemeStore';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatPrice } from "../utils/format";

export default function CartPage() {
  const navigate = useNavigate();
  
  // Zustand Cart
  const cartItems = useCartStore((state) => state.items);
  const cartTotalPrice = useCartStore((state) => state.totalPrice);
  const loadingCart = useCartStore((state) => state.isLoading);
  const updateItemQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);

  // Zustand Theme
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';

  // --- ORDENAR ITEMS PARA EVITAR SALTOS ---
  // Ordenamos por ID para mantener la consistencia visual al cambiar cantidades
  const sortedItems = [...cartItems].sort((a, b) => a.id - b.id);

  // --- STYLES ---
  const glassContainer = isDark 
    ? "bg-gray-900/60 border-gray-700/50 shadow-black/40" 
    : "bg-white/80 border-white/50 shadow-purple-200/50";
    
  const itemCardClass = isDark
    ? "bg-gray-800/40 border-gray-700 hover:bg-gray-800/60"
    : "bg-white/60 border-gray-100 hover:bg-white/80";

  const handleUpdateQuantity = async (itemId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity <= 0) {
      if (window.confirm("¿Eliminar este producto del carrito?")) {
        await removeItem(itemId);
      }
    } else {
      await updateItemQuantity(itemId, newQuantity);
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (window.confirm("¿Eliminar producto?")) await removeItem(itemId);
  };

  const handleClearCart = async () => {
    if (window.confirm("¿Estás seguro de vaciar todo el carrito?")) await clearCart();
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (loadingCart && cartItems.length === 0) {
    return (
      <div className={`min-h-screen flex justify-center items-center bg-gray-50 dark:bg-gray-900`}>
        <LoadingSpinner />
      </div>
    );
  }

  // --- EMPTY CART STATE ---
  if (cartItems.length === 0) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center overflow-hidden relative font-sans">
             <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 z-0"></div>
             <div className={`absolute inset-0 bg-gradient-to-br from-gray-900 via-indigo-950 to-black z-0 transition-opacity duration-700 ease-in-out ${isDark ? 'opacity-100' : 'opacity-0'}`}></div>
             
             <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className={`relative z-10 p-10 rounded-3xl border backdrop-blur-xl max-w-md w-full ${glassContainer}`}
             >
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <ShoppingBag size={48} className="text-purple-400 opacity-80" />
                </div>
                <h2 className={`text-3xl font-black mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Tu carrito está vacío</h2>
                <p className={`mb-8 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Parece que aún no has agregado nada.</p>
                <Link to="/products" className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-lg shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 transition-all active:scale-95">
                    <ArrowLeft size={20} /> Ir a la Tienda
                </Link>
             </motion.div>
        </div>
    );
  }

  return (
    <section className="relative min-h-screen w-full py-8 px-4 md:py-12 overflow-x-hidden font-sans">
        <Helmet>
            <title>Mi Carrito | VetShop</title>
        </Helmet>

        {/* BACKGROUNDS */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 z-0 fixed"></div>
        <div className={`absolute inset-0 bg-gradient-to-br from-gray-900 via-indigo-950 to-black z-0 transition-opacity duration-700 ease-in-out fixed ${isDark ? 'opacity-100' : 'opacity-0'}`}></div>

        <div className="relative z-10 container mx-auto max-w-5xl">
            <div className="flex items-center justify-between mb-8">
                <h1 className={`text-3xl md:text-4xl font-black tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                    Tu Carrito <span className="text-purple-500">.</span>
                </h1>
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${isDark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-600'}`}>
                    {cartItems.length} items
                </span>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 items-start">
                
                {/* --- CART ITEMS LIST (Left Column Animation) --- */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ duration: 0.5 }}
                    className="lg:col-span-2 space-y-4"
                >
                    <AnimatePresence mode="popLayout" initial={false}>
                        {sortedItems.map((item) => (
                            <motion.div
                                key={item.id}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className={`group relative flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl border backdrop-blur-sm transition-all shadow-sm ${itemCardClass}`}
                            >
                                {/* Imagen */}
                                <div className="w-full sm:w-24 h-24 rounded-xl overflow-hidden bg-white flex-shrink-0 border border-gray-200 dark:border-gray-700">
                                    <img
                                        src={item.product_main_image || '/placeholder.jpg'}
                                        alt={item.product_name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Info */}
                                <div className="flex-1 w-full">
                                    <div className="flex justify-between items-start mb-2">
                                        <h2 className={`text-lg font-bold leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {item.product_name}
                                        </h2>
                                        <button
                                            onClick={() => handleRemoveItem(item.id)}
                                            className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-2">
                                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {formatPrice(item.price)}
                                        </div>
                                        
                                        {/* Controls - FIXED STYLES */}
                                        <div className={`flex items-center rounded-lg p-1 border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                                            <button
                                                onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                                                className={`w-8 h-8 flex items-center justify-center rounded-md shadow-sm border transition-colors ${
                                                    isDark 
                                                    ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700' 
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className={`w-10 text-center font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                                                className={`w-8 h-8 flex items-center justify-center rounded-md shadow-sm border transition-colors ${
                                                    isDark 
                                                    ? 'bg-gray-800 text-purple-400 border-gray-700 hover:bg-gray-700' 
                                                    : 'bg-white text-purple-600 border-gray-300 hover:bg-gray-50'
                                                }`}
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-gray-700 flex justify-end">
                                        <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            Subtotal: <span className="text-purple-600 dark:text-purple-400 ml-1">{formatPrice(item.subtotal)}</span>
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>

                {/* --- SUMMARY CARD (Right Column Animation) --- */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="lg:col-span-1"
                >
                    <div className={`sticky top-24 rounded-3xl border backdrop-blur-xl overflow-hidden ${glassContainer}`}>
                        <div className="p-6">
                            <h3 className={`text-xl font-black mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                <Package size={24} className="text-purple-500" /> Resumen
                            </h3>
                            
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Subtotal</span>
                                    <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{formatPrice(cartTotalPrice)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Envío</span>
                                    <span className="text-green-500 font-bold">Gratis</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Impuestos</span>
                                    <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>Calculados en pago</span>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-dashed border-gray-300 dark:border-gray-600 mb-8">
                                <div className="flex justify-between items-end">
                                    <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Total</span>
                                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-500">
                                        {formatPrice(cartTotalPrice)}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckout}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-lg shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 transition-transform active:scale-95 mb-3"
                            >
                                Pagar Ahora <ArrowRight size={20} />
                            </button>

                            <button 
                                onClick={handleClearCart} 
                                className={`w-full py-3 rounded-xl font-bold border transition-colors flex items-center justify-center gap-2 ${isDark ? 'border-red-900/50 text-red-400 hover:bg-red-900/20' : 'border-red-200 text-red-600 hover:bg-red-50'}`}
                            >
                                <Trash2 size={18} /> Vaciar Carrito
                            </button>
                            
                            <p className="text-center text-xs opacity-50 mt-4">
                                Transacciones seguras y encriptadas.
                            </p>
                        </div>
                    </div>
                </motion.div>

            </div>
        </div>
    </section>
  );
}
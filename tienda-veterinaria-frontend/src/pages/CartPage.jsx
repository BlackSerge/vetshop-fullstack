import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Minus, ShoppingBag, Trash2, ArrowRight, ArrowLeft, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

// Stores
import { useCartStore } from '../store/useCartStore';
import { useThemeStore } from '../store/useThemeStore';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmModal from '../components/ConfirmModal';
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

  // --- MODAL STATES ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);

  // --- ORDENAR ITEMS ---
  const sortedItems = [...cartItems].sort((a, b) => a.id - b.id);

  // --- STYLES ---
  const glassContainer = isDark 
    ? "bg-gray-900/60 border-gray-700/50 shadow-black/40" 
    : "bg-white/80 border-white/50 shadow-purple-200/50";
    
  const itemCardClass = isDark
    ? "bg-gray-800/40 border-gray-700 hover:bg-gray-800/60"
    : "bg-white/60 border-gray-100 hover:bg-white/80";

  // --- HANDLERS ---
  const handleUpdateQuantity = async (itemId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity <= 0) {
      openDeleteModal(itemId);
    } else {
      await updateItemQuantity(itemId, newQuantity);
    }
  };

  const openDeleteModal = (itemId) => {
    setItemToDelete(itemId);
    setIsDeleteModalOpen(true);
  };

  const confirmRemoveItem = async () => {
    if (itemToDelete) {
      await removeItem(itemToDelete);
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const confirmClearCart = async () => {
    await clearCart();
    setIsClearModalOpen(false);
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  if (loadingCart && cartItems.length === 0) {
    return (
      <div className={`min-h-[100dvh] flex justify-center items-center bg-gray-50 dark:bg-gray-900`}>
        <LoadingSpinner />
      </div>
    );
  }

  // --- EMPTY CART STATE ---
  if (cartItems.length === 0) {
    return (
        <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 text-center overflow-hidden relative font-sans">
             <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 -z-10"></div>
             <div className={`fixed inset-0 bg-gradient-to-br from-gray-900 via-indigo-950 to-black transition-opacity duration-700 ease-in-out -z-10 ${isDark ? 'opacity-100' : 'opacity-0'}`}></div>
             
             <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className={`relative z-10 p-8 rounded-3xl border backdrop-blur-xl w-full max-w-sm mx-auto ${glassContainer}`}
             >
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <ShoppingBag size={40} className="text-purple-400 opacity-80" />
                </div>
                <h2 className={`text-2xl font-black mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Tu carrito está vacío</h2>
                <p className={`mb-8 text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Parece que aún no has agregado nada.</p>
                <Link to="/products" className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-lg shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 transition-all active:scale-95">
                    <ArrowLeft size={20} /> Ir a la Tienda
                </Link>
             </motion.div>
        </div>
    );
  }

  return (
    <section className="relative min-h-[100dvh] w-full pt-6 pb-40 md:py-12 overflow-x-hidden font-sans">
        <Helmet>
            <title>Mi Carrito | VetShop</title>
        </Helmet>

        {/* BACKGROUNDS FIX: fixed inset-0 and z-index to avoid layout shifts */}
        <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 -z-10"></div>
        <div className={`fixed inset-0 bg-gradient-to-br from-gray-900 via-indigo-950 to-black transition-opacity duration-700 ease-in-out -z-10 ${isDark ? 'opacity-100' : 'opacity-0'}`}></div>

        {/* CONTENEDOR FLUIDO: w-full max-w-5xl mx-auto px-4 evita cortes laterales */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className={`text-2xl md:text-4xl font-black tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                    Tu Carrito <span className="text-purple-500">.</span>
                </h1>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${isDark ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-600'}`}>
                    {cartItems.length} items
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* --- CART ITEMS LIST --- */}
                <motion.div 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ duration: 0.4 }}
                    className="lg:col-span-2 space-y-4"
                >
                    <AnimatePresence mode="popLayout" initial={false}>
                        {sortedItems.map((item) => (
                            <motion.div
                                key={item.id}
                                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                transition={{ duration: 0.2 }}
                                className={`group relative flex flex-row items-stretch gap-3 p-3 rounded-2xl border backdrop-blur-sm transition-all shadow-sm ${itemCardClass}`}
                            >
                                {/* Imagen: w-20 (80px) es seguro para móviles pequeños */}
                                <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-white flex-shrink-0 border border-gray-200 dark:border-gray-700 self-center">
                                    <img
                                        src={item.product_main_image || '/placeholder.jpg'}
                                        alt={item.product_name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Info */}
                                <div className="flex-1 w-full min-w-0 flex flex-col justify-between py-0.5">
                                    
                                    {/* Top: Nombre y Trash */}
                                    <div className="flex justify-between items-start gap-2">
                                        <h2 className={`text-sm sm:text-lg font-bold leading-tight line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {item.product_name}
                                        </h2>
                                        <button
                                            onClick={() => openDeleteModal(item.id)}
                                            className="p-2 -mr-2 -mt-2 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 active:scale-90"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                    
                                    {/* Bottom: Precio y Controles */}
                                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mt-2">
                                        <div className="flex flex-col">
                                            <span className={`text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase`}>Precio</span>
                                            <span className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                                                {formatPrice(item.price)}
                                            </span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center w-full sm:w-auto gap-4">
                                             {/* Controls */}
                                            <div className={`flex items-center rounded-lg p-0.5 border ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-200'}`}>
                                                <button
                                                    onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                                                    className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-md shadow-sm border transition-colors ${
                                                        isDark 
                                                        ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700' 
                                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <Minus size={12} />
                                                </button>
                                                <span className={`min-w-[2rem] text-center font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                                                    className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-md shadow-sm border transition-colors ${
                                                        isDark 
                                                        ? 'bg-gray-800 text-purple-400 border-gray-700 hover:bg-gray-700' 
                                                        : 'bg-white text-purple-600 border-gray-300 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    <Plus size={12} />
                                                </button>
                                            </div>

                                            {/* Subtotal en Móvil a la derecha */}
                                            <div className="text-right sm:hidden">
                                                 <span className={`text-[10px] block ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Total</span>
                                                 <span className="text-base font-black text-purple-600 dark:text-purple-400">{formatPrice(item.subtotal)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Subtotal Desktop */}
                                    <div className="hidden sm:block mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700 text-right">
                                        <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            Subtotal: <span className="text-purple-600 dark:text-purple-400 ml-1">{formatPrice(item.subtotal)}</span>
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>

                {/* --- SUMMARY CARD --- */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="lg:col-span-1"
                >
                    <div className={`rounded-3xl border backdrop-blur-xl overflow-hidden ${glassContainer}`}>
                        <div className="p-5 sm:p-6">
                            <h3 className={`text-lg font-black mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                <Package size={20} className="text-purple-500" /> Resumen
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
                            </div>

                            <div className="pt-4 border-t border-dashed border-gray-300 dark:border-gray-600 mb-6">
                                <div className="flex justify-between items-end">
                                    <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Total</span>
                                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-500">
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
                                onClick={() => setIsClearModalOpen(true)}
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

             {/* DIVISOR EXTRA PARA SCROLL MÓVIL */}
             <div className="h-12 w-full"></div>
        </div>

        {/* --- MODALS --- */}
        <ConfirmModal 
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={confirmRemoveItem}
            message="¿Estás seguro de que deseas eliminar este producto del carrito?"
        />

        <ConfirmModal 
            isOpen={isClearModalOpen}
            onClose={() => setIsClearModalOpen(false)}
            onConfirm={confirmClearCart}
            message="¿Estás seguro de que deseas vaciar todo el carrito? Esta acción no se puede deshacer."
        />
    </section>
  );
}
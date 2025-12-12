import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Minus, ShoppingBag, Trash2, ArrowRight, ArrowLeft, Package, CreditCard, PawPrint } from 'lucide-react';
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

  // --- STYLES (Glassmorphism más transparente para que se note el fondo) ---
  const glassContainer = isDark 
    ? "bg-gray-900/60 border-gray-700/50 shadow-black/40 backdrop-blur-xl" 
    : "bg-white/60 border-white/60 shadow-purple-200/50 backdrop-blur-xl";
    
  const itemCardClass = isDark
    ? "bg-gray-800/40 border-gray-700 hover:bg-gray-800/60"
    : "bg-white/40 border-white/60 hover:bg-white/60";

  const btnSecondary = isDark 
    ? "border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white" 
    : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900";

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
      <div className={`min-h-[100dvh] flex justify-center items-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <LoadingSpinner />
      </div>
    );
  }

  // --- EMPTY CART STATE ---
  if (cartItems.length === 0) {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 text-center overflow-hidden relative font-sans">
             {/* BACKGROUNDS (z-0 para sobreescribir el fondo de App) */}
             <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 z-0"></div>
             <div className={`fixed inset-0 bg-gradient-to-br from-gray-900 via-indigo-950 to-black transition-opacity duration-700 ease-in-out z-0 ${isDark ? 'opacity-100' : 'opacity-0'}`}></div>
             
             {/* Decoración Flotante */}
             <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <motion.div 
                    animate={{ y: [0, -20, 0], opacity: [0.1, 0.3, 0.1] }} 
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className={`absolute top-10 left-10 ${isDark ? 'text-white' : 'text-purple-900'}`}
                >
                    <PawPrint size={120} className="opacity-10 rotate-12" />
                </motion.div>
                <motion.div 
                    animate={{ y: [0, 30, 0], opacity: [0.1, 0.2, 0.1] }} 
                    transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className={`absolute bottom-20 right-10 ${isDark ? 'text-white' : 'text-purple-900'}`}
                >
                    <PawPrint size={180} className="opacity-10 -rotate-12" />
                </motion.div>
             </div>

             <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className={`relative z-10 p-10 rounded-3xl border w-full max-w-md mx-auto ${glassContainer}`}
             >
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <ShoppingBag size={48} className="text-purple-500 opacity-80" />
                </div>
                <h2 className={`text-3xl font-black mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>Tu carrito está vacío</h2>
                <p className={`mb-8 text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    ¡Dale alegría a tu mascota! Encuentra los mejores productos en nuestra tienda.
                </p>
                <Link to="/products" className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-lg shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 transition-transform active:scale-95">
                    <ArrowLeft size={20} /> Ir a la Tienda
                </Link>
             </motion.div>
        </div>
    );
  }

  return (
    <section className="relative min-h-screen w-full pt-8 pb-32 md:py-12 overflow-x-hidden font-sans">
        <Helmet>
            <title>Mi Carrito | VetShop</title>
        </Helmet>

        {/* BACKGROUNDS (z-0 para que se vean sobre el bg de App) */}
        <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 z-0"></div>
        <div className={`fixed inset-0 bg-gradient-to-br from-gray-900 via-indigo-950 to-black transition-opacity duration-700 ease-in-out z-0 ${isDark ? 'opacity-100' : 'opacity-0'}`}></div>

        {/* Elementos Decorativos Flotantes */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            <motion.div 
                animate={{ y: [0, -30, 0], opacity: [0.05, 0.15, 0.05] }} 
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute top-20 -left-10 ${isDark ? 'text-white' : 'text-purple-900'}`}
            >
                <PawPrint size={200} className="opacity-5 rotate-12" />
            </motion.div>
            <motion.div 
                animate={{ y: [0, 40, 0], opacity: [0.05, 0.1, 0.05] }} 
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                className={`absolute top-1/2 -right-10 ${isDark ? 'text-white' : 'text-indigo-900'}`}
            >
                <PawPrint size={250} className="opacity-5 -rotate-12" />
            </motion.div>
        </div>

        {/* CONTENEDOR FLUIDO (z-10 para estar sobre el fondo) */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${isDark ? 'bg-gray-800 text-purple-400' : 'bg-white text-purple-600 shadow-sm'}`}>
                        <ShoppingBag size={28} />
                    </div>
                    <h1 className={`text-3xl md:text-4xl font-black tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                        Tu Carrito
                    </h1>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold border backdrop-blur-md ${isDark ? 'bg-gray-800/50 border-gray-700 text-gray-300' : 'bg-white/50 border-gray-200 text-gray-700'}`}>
                    {cartItems.length} {cartItems.length === 1 ? 'producto' : 'productos'}
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* --- CART ITEMS LIST --- */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ duration: 0.5 }}
                    className="lg:col-span-8 space-y-4"
                >
                    <AnimatePresence mode="popLayout" initial={false}>
                        {sortedItems.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                className={`group relative flex flex-row items-center gap-4 p-4 rounded-3xl border backdrop-blur-md transition-all shadow-sm ${itemCardClass}`}
                            >
                                {/* Imagen */}
                                <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-2xl overflow-hidden flex-shrink-0 border ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-100 bg-white'}`}>
                                    <img
                                        src={item.product_main_image || '/placeholder.jpg'}
                                        alt={item.product_name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-1">
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <h2 className={`text-base sm:text-xl font-bold leading-tight line-clamp-2 ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                                                {item.product_name}
                                            </h2>
                                            <p className={`text-sm mt-1 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                Precio unitario: {formatPrice(item.price)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => openDeleteModal(item.id)}
                                            className={`p-2 rounded-xl transition-colors flex-shrink-0 ${isDark ? 'text-gray-500 hover:bg-red-900/30 hover:text-red-400' : 'text-gray-400 hover:bg-red-50 hover:text-red-500'}`}
                                            title="Eliminar producto"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                    
                                    {/* Bottom Row */}
                                    <div className="flex flex-wrap items-end justify-between gap-4 mt-3">
                                        {/* Quantity Controls */}
                                        <div className={`flex items-center rounded-xl p-1 border shadow-sm ${isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-white border-gray-200'}`}>
                                            <button
                                                onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                                                    isDark 
                                                    ? 'hover:bg-gray-700 text-gray-400' 
                                                    : 'hover:bg-gray-100 text-gray-600'
                                                }`}
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className={`w-8 text-center font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                                                    isDark 
                                                    ? 'bg-gray-800 text-purple-400 shadow-sm' 
                                                    : 'bg-gray-100 text-purple-600'
                                                }`}
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>

                                        {/* Subtotal */}
                                        <div className="text-right">
                                            <span className={`text-xs block font-bold uppercase tracking-wider mb-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Total</span>
                                            <span className={`text-xl font-black ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                                                {formatPrice(item.subtotal)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>

                {/* --- SUMMARY CARD --- */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="lg:col-span-4 sticky top-24"
                >
                    <div className={`rounded-3xl border overflow-hidden ${glassContainer}`}>
                        <div className="p-6 md:p-8">
                            <h3 className={`text-xl font-black mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                <Package size={24} className="text-purple-500" /> Resumen de Compra
                            </h3>
                            
                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center text-base">
                                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Subtotal</span>
                                    <span className={`font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{formatPrice(cartTotalPrice)}</span>
                                </div>
                                <div className="flex justify-between items-center text-base">
                                    <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Envío</span>
                                    <span className="px-2 py-1 rounded bg-green-500/10 text-green-500 text-xs font-black uppercase tracking-wide border border-green-500/20">Gratis</span>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-dashed border-gray-300 dark:border-gray-600 mb-8">
                                <div className="flex justify-between items-end">
                                    <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Total a Pagar</span>
                                    <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-500">
                                        {formatPrice(cartTotalPrice)}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckout}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-lg shadow-lg shadow-purple-500/30 flex items-center justify-center gap-3 transition-transform active:scale-95 mb-4 group"
                            >
                                <CreditCard size={20} className="group-hover:scale-110 transition-transform" />
                                Proceder al Pago
                            </button>

                            <button 
                                onClick={() => setIsClearModalOpen(true)}
                                className={`w-full py-3 rounded-2xl font-bold border transition-colors flex items-center justify-center gap-2 text-sm ${btnSecondary}`}
                            >
                                <Trash2 size={16} /> Vaciar Carrito
                            </button>
                            
                            <p className="text-center text-xs opacity-50 mt-6 flex items-center justify-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span> Pagos seguros y encriptados.
                            </p>
                        </div>
                    </div>
                </motion.div>

            </div>
        </div>

        {/* --- MODALS --- */}
        <ConfirmModal 
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={confirmRemoveItem}
            message="¿Eliminar este producto del carrito?"
        />

        <ConfirmModal 
            isOpen={isClearModalOpen}
            onClose={() => setIsClearModalOpen(false)}
            onConfirm={confirmClearCart}
            message="¿Estás seguro de que deseas vaciar todo el carrito?"
        />
    </section>
  );
}
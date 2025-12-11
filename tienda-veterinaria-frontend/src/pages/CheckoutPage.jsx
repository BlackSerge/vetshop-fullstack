import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from 'react-helmet-async';
import { ShoppingBag, CreditCard, ShieldCheck, ArrowLeft, Package, Lock } from 'lucide-react';

import api from "../api/axios";
import CheckoutForm from "../components/CheckoutForm";
import LoadingSpinner from "../components/LoadingSpinner";
import { useCartStore } from "../store/useCartStore";
import { useThemeStore } from "../store/useThemeStore";
import { formatPrice } from "../utils/format";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState("");
  const cartItems = useCartStore((state) => state.items || []);
  // Fallback safe calculation if totalPrice is not in store yet
  const storeTotal = useCartStore((state) => state.totalPrice);
  const cartTotal = storeTotal || cartItems.reduce((acc, item) => acc + (Number(item.effective_price || item.price) * (item.quantity || 1)), 0);

  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === "dark";
  const navigate = useNavigate();

  useEffect(() => {
    if (cartItems.length > 0) {
      // Create PaymentIntent as soon as the page loads
      api.post("/pedidos/create-payment-intent/")
        .then((res) => setClientSecret(res.data.clientSecret))
        .catch((err) => console.error("Error creating payment intent:", err));
    }
  }, [cartItems]);

  const appearance = { 
    theme: isDark ? 'night' : 'stripe', 
    variables: {
      colorPrimary: '#9333ea', // purple-600
      colorBackground: isDark ? '#1f2937' : '#ffffff',
      colorText: isDark ? '#f3f4f6' : '#1f2937',
      borderRadius: '12px',
    }
  };
  const options = { clientSecret, appearance };

  // --- STYLES ---
  const glassContainer = isDark 
    ? "bg-gray-900/60 border-gray-700/50 shadow-black/40" 
    : "bg-white/80 border-white/50 shadow-purple-200/50";
  
  const cardClass = isDark ? "bg-gray-800/50 border-gray-700" : "bg-white/60 border-gray-200";

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
                <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag size={40} className="text-gray-400" />
                </div>
                <h2 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Tu carrito está vacío</h2>
                <p className={`mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Parece que aún no has agregado productos para comprar.</p>
                <Link to="/products" className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2 transition-all active:scale-95">
                    <ArrowLeft size={20} /> Volver a la Tienda
                </Link>
             </motion.div>
        </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full py-8 px-4 md:py-12 overflow-x-hidden font-sans">
      <Helmet>
        <title>Finalizar Compra | VetShop</title>
      </Helmet>

      {/* BACKGROUNDS */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 z-0 fixed"></div>
      <div className={`absolute inset-0 bg-gradient-to-br from-gray-900 via-indigo-950 to-black z-0 transition-opacity duration-700 ease-in-out fixed ${isDark ? 'opacity-100' : 'opacity-0'}`}></div>

      <div className="relative z-10 container mx-auto max-w-6xl">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
            <button 
                onClick={() => navigate(-1)} 
                className={`p-2 rounded-full border transition-colors ${isDark ? 'bg-gray-800/50 border-gray-700 text-white hover:bg-gray-700' : 'bg-white/50 border-gray-200 text-gray-900 hover:bg-white'}`}
            >
                <ArrowLeft size={24} />
            </button>
            <h1 className={`text-3xl font-black tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                Finalizar Compra
            </h1>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
            
            {/* --- COLUMN 1: ORDER SUMMARY (Left) --- */}
            <motion.div 
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
                className="lg:col-span-5 space-y-6"
            >
                <div className={`rounded-3xl border overflow-hidden backdrop-blur-xl ${glassContainer}`}>
                    <div className={`p-6 border-b flex items-center gap-3 ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
                        <ShoppingBag className="text-purple-500" size={24} />
                        <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Resumen del Pedido</h2>
                        <span className={`ml-auto text-xs font-bold px-3 py-1 rounded-full ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                            {cartItems.length} items
                        </span>
                    </div>

                    <div className="p-6 max-h-[500px] overflow-y-auto custom-scrollbar">
                        <div className="space-y-4">
                            {cartItems.map((item) => (
                                <div key={item.id} className="flex gap-4 items-center group">
                                    <div className={`w-16 h-16 rounded-xl overflow-hidden border flex-shrink-0 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                                        <img 
                                            src={item.product_main_image || item.imagen} 
                                            alt={item.product_name || item.nombre} 
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-bold text-sm truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                            {item.product_name || item.nombre}
                                        </h3>
                                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Cantidad: <span className="font-semibold">{item.quantity || 1}</span>
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {formatPrice((item.effective_price || item.price) * (item.quantity || 1))}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={`p-6 border-t ${isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-50/50 border-gray-100'}`}>
                         <div className="flex justify-between items-center mb-2">
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Subtotal</span>
                            <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{formatPrice(cartTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-4">
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Envío</span>
                            <span className="text-sm font-bold text-green-500">GRATIS</span>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-dashed border-gray-300 dark:border-gray-700">
                            <span className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Total</span>
                            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{formatPrice(cartTotal)}</span>
                        </div>
                    </div>
                </div>

                {/* Security Badge */}
                <div className={`flex items-center justify-center gap-3 p-4 rounded-2xl border ${isDark ? 'bg-green-900/10 border-green-900/30 text-green-400' : 'bg-green-50 border-green-200 text-green-700'}`}>
                    <ShieldCheck size={24} />
                    <span className="text-sm font-bold">Pago 100% Seguro y Encriptado</span>
                </div>
            </motion.div>

            {/* --- COLUMN 2: PAYMENT FORM (Right) --- */}
            <motion.div 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                className="lg:col-span-7"
            >
                <div className={`rounded-3xl border backdrop-blur-xl p-6 md:p-8 ${glassContainer}`}>
                    <div className="mb-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
                            <CreditCard className="text-white" size={20} />
                        </div>
                        <div>
                            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Detalles de Pago</h2>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Complete la transacción con seguridad Stripe</p>
                        </div>
                    </div>

                    {clientSecret ? (
                        <Elements options={options} stripe={stripePromise}>
                            <CheckoutForm />
                        </Elements>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <LoadingSpinner />
                            <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Iniciando pago seguro...</p>
                        </div>
                    )}
                    
                    <div className="mt-6 flex items-center justify-center gap-2 text-xs opacity-60">
                         <Lock size={12} />
                         <span>Powered by <strong>Stripe</strong></span>
                    </div>
                </div>
            </motion.div>

        </div>
      </div>
    </div>
  );
}
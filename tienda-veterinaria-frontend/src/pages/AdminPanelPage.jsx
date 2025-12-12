import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from 'react-helmet-async';
import { ShoppingBag, CreditCard, ShieldCheck, ArrowLeft, Lock, Truck, PawPrint } from 'lucide-react';

import api from "../api/axios";
import CheckoutForm from "../components/CheckoutForm";
import SkeletonLoader from "../components/ProductCardSkeleton";
import { useCartStore } from "../store/useCartStore";
import { useThemeStore } from "../store/useThemeStore";
import { formatPrice } from "../utils/format";

// Inicializar Stripe fuera del render para evitar re-creación
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function CheckoutPage() {
  const [clientSecret, setClientSecret] = useState("");
  const cartItems = useCartStore((state) => state.items || []);
  const storeTotal = useCartStore((state) => state.totalPrice);
  const cartTotal = storeTotal || cartItems.reduce((acc, item) => acc + (Number(item.effective_price || item.price) * (item.quantity || 1)), 0);

  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === "dark";
  const navigate = useNavigate();

  useEffect(() => {
    // Solo crear PaymentIntent si hay items y aún no tenemos el secret
    if (cartItems.length > 0 && !clientSecret) {
      api.post("/pedidos/create-payment-intent/")
        .then((res) => {
            if (res.data.clientSecret) {
                setClientSecret(res.data.clientSecret);
            }
        })
        .catch((err) => console.error("Error creating payment intent:", err));
    }
  }, [cartItems, clientSecret]);

  // Stripe Appearance API para coincidir con Glassmorphism
  const appearance = { 
    theme: isDark ? 'night' : 'stripe', 
    variables: {
      colorPrimary: '#9333ea', // purple-600
      colorBackground: isDark ? '#1f2937' : '#ffffff', // bg-gray-800 : white
      colorText: isDark ? '#f3f4f6' : '#1f2937',
      fontFamily: '"Inter", sans-serif',
      borderRadius: '16px',
      spacingUnit: '5px',
    },
    rules: {
        '.Input': {
            border: isDark ? '1px solid #4b5563' : '1px solid #e5e7eb',
            backgroundColor: isDark ? 'rgba(31, 41, 55, 0.5)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
        }
    }
  };
  
  // Options memoization
  const options = { clientSecret, appearance };

  // --- STYLES (More Transparent for Glass Effect) ---
  const glassContainer = isDark 
    ? "bg-gray-900/60 border-gray-700/50 shadow-black/40 backdrop-blur-xl" 
    : "bg-white/60 border-white/60 shadow-purple-200/50 backdrop-blur-xl";
  
  if (cartItems.length === 0) {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 text-center overflow-hidden relative font-sans">
             <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 -z-50"></div>
             <div className={`fixed inset-0 bg-gradient-to-br from-gray-900 via-indigo-950 to-black transition-opacity duration-700 ease-in-out -z-50 ${isDark ? 'opacity-100' : 'opacity-0'}`}></div>
             
             {/* Decoración Flotante */}
             <div className="fixed inset-0 overflow-hidden pointer-events-none -z-40">
                <motion.div 
                    animate={{ y: [0, -20, 0], opacity: [0.1, 0.3, 0.1] }} 
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    className={`absolute top-10 left-10 ${isDark ? 'text-white' : 'text-purple-900'}`}
                >
                    <PawPrint size={120} className="opacity-10 rotate-12" />
                </motion.div>
             </div>

             <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className={`relative z-10 p-10 rounded-3xl border w-full max-w-sm mx-auto ${glassContainer}`}
             >
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <ShoppingBag size={40} className="text-purple-400 opacity-80" />
                </div>
                <h2 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Carrito Vacío</h2>
                <Link to="/products" className="w-full py-4 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg mt-6 flex items-center justify-center gap-2">
                    <ArrowLeft size={20} /> Volver a Tienda
                </Link>
             </motion.div>
        </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full pt-8 pb-32 md:py-12 overflow-x-hidden font-sans">
      <Helmet>
        <title>Finalizar Compra | VetShop</title>
      </Helmet>

      {/* BACKGROUNDS - FIXED (z-50 negative to sit behind everything but allow App bg to be covered) */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 -z-50"></div>
      <div className={`fixed inset-0 bg-gradient-to-br from-gray-900 via-indigo-950 to-black transition-opacity duration-700 ease-in-out -z-50 ${isDark ? 'opacity-100' : 'opacity-0'}`}></div>

      {/* Elementos Decorativos Flotantes (Background) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-40">
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
                className={`absolute bottom-20 -right-10 ${isDark ? 'text-white' : 'text-indigo-900'}`}
            >
                <PawPrint size={250} className="opacity-5 -rotate-12" />
            </motion.div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
            <button 
                onClick={() => navigate(-1)} 
                className={`p-3 rounded-full border transition-all hover:scale-105 active:scale-95 ${isDark ? 'bg-gray-800/50 border-gray-700 text-white hover:bg-gray-700' : 'bg-white/50 border-gray-200 text-gray-900 hover:bg-white'}`}
            >
                <ArrowLeft size={24} />
            </button>
            <div>
                <h1 className={`text-3xl font-black tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                    Pago Seguro
                </h1>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Completa tu compra con seguridad</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* --- RESUMEN (IZQUIERDA) --- */}
            <motion.div 
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
                className="lg:col-span-5 space-y-6 order-2 lg:order-1"
            >
                <div className={`rounded-3xl border overflow-hidden ${glassContainer}`}>
                    <div className={`p-6 border-b flex items-center gap-3 ${isDark ? 'border-gray-700/50' : 'border-gray-100'}`}>
                        {/* ICONO CON ALTO CONTRASTE EN MODO CLARO */}
                        <div className={`p-2.5 rounded-xl shadow-sm ${isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-600 text-white'}`}>
                            <ShoppingBag size={22} />
                        </div>
                        <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Resumen del Pedido</h2>
                    </div>

                    <div className="p-6 md:max-h-[600px] overflow-y-auto custom-scrollbar">
                        <div className="space-y-6">
                            {cartItems.map((item) => (
                                <div key={item.id} className="flex gap-4 items-center">
                                    <div className={`w-20 h-20 rounded-2xl overflow-hidden border flex-shrink-0 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                                        <img 
                                            src={item.product_main_image || item.imagen} 
                                            alt={item.product_name} 
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-bold text-base leading-tight mb-1 ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                                            {item.product_name}
                                        </h3>
                                        <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            Cant: {item.quantity}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-black text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {formatPrice((item.effective_price || item.price) * (item.quantity || 1))}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={`p-6 border-t ${isDark ? 'bg-gray-800/30 border-gray-700/50' : 'bg-gray-50/50 border-gray-100'}`}>
                         <div className="space-y-3 mb-6">
                            <div className="flex justify-between items-center text-sm">
                                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Subtotal</span>
                                <span className={`font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{formatPrice(cartTotal)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Envío</span>
                                <span className="flex items-center gap-1.5 text-green-500 font-bold bg-green-500/10 px-2 py-0.5 rounded text-xs border border-green-500/20">
                                    <Truck size={12}/> GRATIS
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-dashed border-gray-300 dark:border-gray-600">
                            <span className={`text-lg font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Total</span>
                            <span className="text-3xl font-black text-purple-600 dark:text-purple-400">{formatPrice(cartTotal)}</span>
                        </div>
                    </div>
                </div>

                {/* Security Badge */}
                <div className={`flex items-center justify-center gap-3 p-4 rounded-2xl border ${isDark ? 'bg-green-900/10 border-green-900/30 text-green-400' : 'bg-green-50 border-green-200 text-green-700'}`}>
                    <ShieldCheck size={24} />
                    <div className="flex flex-col">
                        <span className="text-sm font-bold">Pago 100% Seguro</span>
                        <span className="text-xs opacity-80">Tus datos están encriptados con SSL</span>
                    </div>
                </div>
            </motion.div>

            {/* --- FORMULARIO DE PAGO (DERECHA) --- */}
            <motion.div 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                className="lg:col-span-7 order-1 lg:order-2"
            >
                {/* PADDING REDUCIDO EN MOBILE PARA QUE STRIPE QUEPA (p-4 en vez de p-6) */}
                <div className={`rounded-3xl border p-4 md:p-10 ${glassContainer}`}>
                    <div className="mb-8 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg text-white">
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Método de Pago</h2>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Tarjetas de Crédito / Débito</p>
                        </div>
                    </div>

                    {clientSecret ? (
                        <Elements options={options} stripe={stripePromise}>
                            <CheckoutForm />
                        </Elements>
                    ) : (
                        <div className="flex flex-col gap-6 py-8">
                            <SkeletonLoader type="text" className="h-12 w-full rounded-xl" />
                            <div className="grid grid-cols-2 gap-4">
                                <SkeletonLoader type="text" className="h-12 w-full rounded-xl" />
                                <SkeletonLoader type="text" className="h-12 w-full rounded-xl" />
                            </div>
                            <SkeletonLoader type="text" className="h-16 w-full rounded-xl mt-4" />
                        </div>
                    )}
                    
                    <div className="mt-8 pt-6 border-t border-gray-200/20 flex items-center justify-center gap-2 text-xs opacity-50 font-medium">
                         <Lock size={12} />
                         <span>Procesado por <strong>Stripe</strong>. No almacenamos tus datos de tarjeta.</span>
                    </div>
                </div>
            </motion.div>
        </div>
      </div>
    </div>
  );
}
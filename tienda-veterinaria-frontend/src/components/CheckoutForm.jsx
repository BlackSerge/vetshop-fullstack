import React, { useState } from "react";
import {
  PaymentElement,
  LinkAuthenticationElement,
  AddressElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import { motion } from "framer-motion";
import { Lock, ArrowRight, AlertCircle } from "lucide-react";
import { useCartStore } from "../store/useCartStore";
import { useThemeStore } from "../store/useThemeStore";
import SkeletonLoader from "./ProductCardSkeleton";
import { toast } from "react-toastify";

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { clearCart, totalPrice } = useCartStore();
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === "dark";

  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados de carga individual para cada elemento de Stripe
  const [readyStates, setReadyStates] = useState({
    payment: false,
    address: false,
    auth: false
  });

  // El formulario solo se muestra cuando TODO está listo
  const isFullyReady = readyStates.payment && readyStates.address && readyStates.auth;

  // Handlers para marcar cada elemento como listo
  const handleElementReady = (elementName) => {
    setReadyStates(prev => ({ ...prev, [elementName]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/#/success`, // Ajustado para HashRouter si es necesario
      },
    });

    if (error.type === "card_error" || error.type === "validation_error") {
      setMessage(error.message);
      toast.error(error.message);
    } else {
      setMessage("Ocurrió un error inesperado.");
      toast.error("Error inesperado en el pago.");
    }

    setIsLoading(false);
  };

  // Estilos
  const btnClass = "w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 mt-6";
  const btnPrimary = "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-500/30";
  const btnDisabled = "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed opacity-70";

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="w-full relative min-h-[400px]">
      
      {/* --- SKELETON LOADING (Visible mientras Stripe carga) --- */}
      {!isFullyReady && (
        <div className="absolute inset-0 z-20 space-y-6 bg-transparent">
            {/* Simula Email */}
            <SkeletonLoader type="text" className="h-12 w-full rounded-xl" />
            
            {/* Simula Dirección (más grande) */}
            <SkeletonLoader type="text" className="h-24 w-full rounded-xl" />
            
            {/* Simula Tarjeta */}
            <div className="space-y-3 pt-2">
                <SkeletonLoader type="text" className="h-12 w-full rounded-xl" />
                <div className="grid grid-cols-2 gap-4">
                    <SkeletonLoader type="text" className="h-12 w-full rounded-xl" />
                    <SkeletonLoader type="text" className="h-12 w-full rounded-xl" />
                </div>
            </div>
            
            {/* Simula Botón */}
            <SkeletonLoader type="text" className="h-14 w-full rounded-xl mt-8" />
        </div>
      )}

      {/* --- CONTENIDO REAL (Oculto hasta estar listo) --- */}
      <div className={`transition-opacity duration-500 ${isFullyReady ? 'opacity-100 relative z-10' : 'opacity-0 absolute top-0 left-0 w-full pointer-events-none'}`}>
        
        <div className="space-y-5">
            {/* 1. Email (Link Authentication) */}
            <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Contacto
                </label>
                <LinkAuthenticationElement
                    id="link-authentication-element"
                    onReady={() => handleElementReady('auth')}
                    options={{}}
                />
            </div>

            {/* 2. Dirección de Envío */}
            <div className="space-y-2">
                <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Dirección de Envío
                </label>
                <AddressElement 
                    options={{ mode: 'shipping' }} 
                    onReady={() => handleElementReady('address')}
                />
            </div>

            {/* 3. Método de Pago */}
            <div className="space-y-2 pt-2">
                <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Detalles de Tarjeta
                </label>
                <PaymentElement 
                    id="payment-element" 
                    options={{ layout: "tabs" }} 
                    onReady={() => handleElementReady('payment')}
                />
            </div>
        </div>

        {/* Mensajes de Error de Stripe */}
        {message && (
            <motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm flex items-center gap-2 border border-red-200 dark:border-red-800"
            >
                <AlertCircle size={18} /> {message}
            </motion.div>
        )}

        <button 
            disabled={isLoading || !stripe || !elements || !isFullyReady} 
            id="submit" 
            className={`${btnClass} ${isLoading || !stripe || !elements ? btnDisabled : btnPrimary}`}
        >
            <span id="button-text">
            {isLoading ? (
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Procesando...
                </div>
            ) : (
                <span className="flex items-center gap-2">
                    <Lock size={18} /> Pagar Ahora
                </span>
            )}
            </span>
        </button>
      </div>
    </form>
  );
}
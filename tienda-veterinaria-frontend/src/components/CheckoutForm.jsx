import React, { useState } from "react";
import {
  PaymentElement,
  LinkAuthenticationElement,
  AddressElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import { motion } from "framer-motion";
import { Lock, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom"; 
import { useThemeStore } from "../store/useThemeStore";
import SkeletonLoader from "./ProductCardSkeleton";
import { toast } from "react-toastify";

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate(); 
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === "dark";

  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados de carga individual
  const [readyStates, setReadyStates] = useState({
    payment: false,
    address: false,
    auth: false
  });

  const isFullyReady = readyStates.payment && readyStates.address && readyStates.auth;

  const handleElementReady = (elementName) => {
    setReadyStates(prev => ({ ...prev, [elementName]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsLoading(true);
    setMessage(null);

    try {
        // Redirección manual: "if_required" evita que Stripe redirija si no es necesario
        // Usamos return_url como fallback
        const { error, paymentIntent } = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/#/success`, 
          },
          redirect: "if_required",
        });

        if (error) {
          if (error.type === "card_error" || error.type === "validation_error") {
            setMessage(error.message);
            toast.error(error.message);
          } else {
            setMessage("Ocurrió un error inesperado en el pago.");
            toast.error("Error inesperado.");
          }
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
          // ÉXITO: Navegar manualmente a la Success Page
          navigate(`/success?payment_intent=${paymentIntent.id}&redirect_status=succeeded`);
        }
    } catch (err) {
        console.error(err);
        setMessage("Error de conexión con la pasarela de pago.");
        toast.error("Error de conexión.");
    }

    setIsLoading(false);
  };

  // Estilos
  const btnClass = "w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 mt-6";
  const btnPrimary = "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-500/30";
  const btnDisabled = "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed opacity-70";

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="w-full relative min-h-[400px]">
      
      {/* SKELETON LOADING */}
      {!isFullyReady && (
        <div className="absolute inset-0 z-20 space-y-6 bg-transparent">
            <SkeletonLoader type="text" className="h-12 w-full rounded-xl" />
            <SkeletonLoader type="text" className="h-24 w-full rounded-xl" />
            <div className="space-y-3 pt-2">
                <SkeletonLoader type="text" className="h-12 w-full rounded-xl" />
                <div className="grid grid-cols-2 gap-4">
                    <SkeletonLoader type="text" className="h-12 w-full rounded-xl" />
                    <SkeletonLoader type="text" className="h-12 w-full rounded-xl" />
                </div>
            </div>
            <SkeletonLoader type="text" className="h-14 w-full rounded-xl mt-8" />
        </div>
      )}

      {/* CONTENIDO REAL */}
      <div className={`transition-opacity duration-500 ${isFullyReady ? 'opacity-100 relative z-10' : 'opacity-0 absolute top-0 left-0 w-full pointer-events-none'}`}>
        
        <div className="space-y-6">
            <div className="space-y-2">
                <LinkAuthenticationElement
                    id="link-authentication-element"
                    onReady={() => handleElementReady('auth')}
                    options={{}}
                />
            </div>

            <div className="space-y-2">
                <AddressElement 
                    options={{ mode: 'shipping' }} 
                    onReady={() => handleElementReady('address')}
                />
            </div>

            <div className="space-y-2 pt-2">
                <PaymentElement 
                    id="payment-element" 
                    options={{ layout: "tabs" }} 
                    onReady={() => handleElementReady('payment')}
                />
            </div>
        </div>

        {/* MENSAJE DE ERROR CON ALTO CONTRASTE EN LIGHT MODE */}
        {message && (
            <motion.div 
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className={`mt-6 p-4 rounded-xl text-sm flex items-center gap-3 border-2 font-bold shadow-sm ${
                    isDark 
                    ? "bg-red-900/40 text-red-200 border-red-800" 
                    : "bg-red-100 text-red-800 border-red-200"
                }`}
            >
                <AlertCircle size={24} className="flex-shrink-0" /> 
                <span>{message}</span>
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
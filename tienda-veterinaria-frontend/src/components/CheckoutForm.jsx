// src/components/CheckoutForm.jsx
import { useState, useEffect } from "react";
import { 
  PaymentElement, 
  AddressElement, // <--- IMPORTAR ESTO
  useStripe, 
  useElements 
} from "@stripe/react-stripe-js";
import { toast } from "react-toastify";
import LoadingSpinner from "./LoadingSpinner";
import { useCartStore } from "../store/useCartStore";
import { useThemeStore } from "../store/useThemeStore";

export default function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { clearCart } = useCartStore();
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === "dark";

  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe) return;
    const clientSecret = new URLSearchParams(window.location.search).get("payment_intent_client_secret");
    if (!clientSecret) return;

    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent.status) {
        case "succeeded":
          toast.success("¡Pago realizado con éxito!");
          clearCart();
          break;
        case "processing":
          setMessage("Procesando pago...");
          break;
        case "requires_payment_method":
          setMessage("El pago falló, intente de nuevo.");
          break;
        default:
          setMessage("Algo salió mal.");
          break;
      }
    });
  }, [stripe]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success`,
      },
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message);
      } else {
        setMessage("Ocurrió un error inesperado.");
      }
    }
    setIsLoading(false);
  };

  const btnClass = isDark ? "bg-purple-600 hover:bg-purple-700" : "bg-purple-700 hover:bg-purple-800";

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6">
      
      {/* 1. SECCIÓN ENVÍO (Stripe Address Element) */}
      <h3 className="text-lg font-semibold">Dirección de Envío</h3>
      <AddressElement options={{ mode: 'shipping' }} />
      
      {/* 2. SECCIÓN PAGO (Stripe Payment Element) */}
      <h3 className="text-lg font-semibold mt-4">Datos de Pago</h3>
      <PaymentElement id="payment-element" options={{ layout: "tabs" }} />
      
      <button 
        disabled={isLoading || !stripe || !elements} 
        id="submit"
        className={`w-full py-3 px-4 rounded-md font-bold text-white shadow-md transition-all ${btnClass} mt-6`}
      >
        {isLoading ? <LoadingSpinner /> : "Pagar Ahora"}
      </button>
      
      {message && <div className="text-red-500 text-sm text-center mt-2">{message}</div>}
    </form>
  );
}
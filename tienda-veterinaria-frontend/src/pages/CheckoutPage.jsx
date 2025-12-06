// src/pages/CheckoutPage.jsx
import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
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
  const cartTotal = useCartStore((state) => state.totalPrice);
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === "dark";
  const bgPage = isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900";
  const cardBg = isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";

  useEffect(() => {
    if (cartItems.length > 0) {
      api.post("/pedidos/create-payment-intent/")
        .then((res) => setClientSecret(res.data.clientSecret))
        .catch((err) => console.error(err));
    }
  }, [cartItems]);

  const appearance = { theme: isDark ? 'night' : 'stripe', labels: 'floating' };
  const options = { clientSecret, appearance };

  if (cartItems.length === 0) return <div className={`py-20 text-center ${bgPage}`}>Carrito vacío.</div>;

  return (
    <div className={`min-h-screen py-12 px-4 ${bgPage}`}>
      <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12">
        
        {/* COLUMNA 1: RESUMEN (Izquierda) */}
        <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-4">Resumen del Pedido</h2>
            <div className={`p-6 rounded-xl shadow-lg border ${cardBg}`}>
                {cartItems.map(item => (
                    <div key={item.id} className="flex justify-between text-sm mb-3">
                        <div className="flex items-center gap-3">
                            <img src={item.product_main_image} alt="" className="w-12 h-12 object-cover rounded"/>
                            <span>{item.quantity}x {item.product_name}</span>
                        </div>
                        <span className="font-mono">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                ))}
                <div className="border-t border-gray-600 pt-4 mt-4 flex justify-between font-bold text-xl">
                    <span>Total:</span>
                    <span className="text-purple-500">${formatPrice(cartTotal)}</span>
                </div>
            </div>
        </div>

        {/* COLUMNA 2: FORMULARIO STRIPE (Derecha) */}
        <div>
            <h2 className="text-2xl font-bold mb-4">Pago y Envío</h2>
            <div className={`p-6 rounded-xl shadow-lg border ${cardBg}`}>
                {clientSecret ? (
                    <Elements options={options} stripe={stripePromise}>
                        <CheckoutForm /> {/* Ya no pasamos props, Stripe maneja todo */}
                    </Elements>
                ) : (
                    <div className="flex justify-center py-10"><LoadingSpinner /></div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}
// src/pages/SuccessPage.jsx
import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, Home } from 'lucide-react';
import confetti from 'canvas-confetti'; // Efecto opcional pro
import { useCartStore } from '../store/useCartStore';
import { useThemeStore } from '../store/useThemeStore';
import { Helmet } from 'react-helmet-async';

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const paymentIntent = searchParams.get('payment_intent'); // Stripe lo añade al redirigir
  const { clearCart } = useCartStore();
  
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';
  
  const bgPage = isDark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900";
  const cardBg = isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";

  useEffect(() => {
    // Limpiar carrito si venimos de un pago exitoso
    clearCart(true);
    // Lanzar confeti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, []);

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${bgPage}`}>
      <Helmet>
            <title>¡Gracias por tu compra! | VetShop</title>
        </Helmet>
      <div className={`max-w-md w-full text-center p-8 rounded-2xl shadow-xl border ${cardBg}`}>
        
        <div className="flex justify-center mb-6">
            <div className="rounded-full bg-green-100 p-4">
                <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
        </div>

        <h1 className="text-3xl font-bold mb-2">¡Pago Exitoso!</h1>
        <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Gracias por tu compra. Tu pedido está siendo procesado.
        </p>

        <div className={`text-left p-4 rounded-lg mb-8 ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
            <p className="text-sm opacity-70 mb-1">Referencia de Pago:</p>
            <p className="font-mono text-sm break-all">{paymentIntent || 'Pendiente...'}</p>
            <p className="text-xs mt-2 text-purple-500 font-medium">
                Te hemos enviado un correo con los detalles.
            </p>
        </div>

        <div className="space-y-3">
            <Link to="/profile" className="flex items-center justify-center gap-2 w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-all">
                <Package size={20} /> Ver Mis Pedidos
            </Link>
            
            <Link to="/" className={`flex items-center justify-center gap-2 w-full py-3 rounded-lg font-medium transition-all ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
                <Home size={20} /> Volver al Inicio
            </Link>
        </div>

      </div>
    </div>
  );
}
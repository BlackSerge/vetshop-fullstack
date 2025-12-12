import { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, Home, Copy } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useCartStore } from '../store/useCartStore';
import { useThemeStore } from '../store/useThemeStore';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const paymentIntent = searchParams.get('payment_intent');
  const { clearCart } = useCartStore();
  
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';
  
  // --- STYLES ---
  const glassCard = isDark 
    ? "bg-gray-900/60 border-gray-700/50 shadow-black/40 backdrop-blur-xl" 
    : "bg-white/70 border-white/50 shadow-purple-200/50 backdrop-blur-xl";

  useEffect(() => {
    clearCart(true);
    
    // Confetti Burst Animation
    const duration = 3000;
    const end = Date.now() + duration;

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#9333ea', '#2563eb', '#fbbf24']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#9333ea', '#2563eb', '#fbbf24']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }, []);

  const copyToClipboard = () => {
      if(paymentIntent) {
          navigator.clipboard.writeText(paymentIntent);
          toast.success("ID copiado al portapapeles");
      }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden font-sans">
      <Helmet>
            <title>¡Compra Exitosa! | VetShop</title>
      </Helmet>

      {/* --- BACKGROUNDS --- */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-blue-50 to-purple-100 z-0"></div>
      <div className={`absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black z-0 transition-opacity duration-700 ease-in-out ${isDark ? 'opacity-100' : 'opacity-0'}`}></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: "spring", bounce: 0.5 }}
        className={`relative z-10 max-w-md w-full text-center p-8 md:p-10 rounded-3xl border ${glassCard}`}
      >
        
        <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="flex justify-center mb-6"
        >
            <div className={`rounded-full p-6 shadow-xl ${isDark ? 'bg-green-500/20 shadow-green-500/10' : 'bg-green-100 shadow-green-200'}`}>
                <CheckCircle className={`w-20 h-20 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
            </div>
        </motion.div>

        <h1 className={`text-4xl font-black mb-3 tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>¡Pago Exitoso!</h1>
        <p className={`mb-8 text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Gracias por confiar en nosotros. Tu pedido está siendo preparado con cuidado. 🐾
        </p>

        {paymentIntent && (
            <div className={`text-left p-5 rounded-2xl mb-8 border relative group ${isDark ? 'bg-black/30 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Referencia de Pago</p>
                <div className="flex items-center justify-between">
                    <p className={`font-mono text-sm break-all ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{paymentIntent}</p>
                    <button onClick={copyToClipboard} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors" title="Copiar">
                        <Copy size={14} className="text-gray-500"/>
                    </button>
                </div>
                <div className="absolute -top-3 -right-3">
                    <span className="flex h-6 w-6">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-6 w-6 bg-green-500 items-center justify-center">
                            <CheckCircle size={12} className="text-white"/>
                        </span>
                    </span>
                </div>
            </div>
        )}

        <div className="space-y-4">
            <Link to="/profile" className="flex items-center justify-center gap-2 w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-purple-500/30 transition-transform active:scale-95">
                <Package size={22} /> Ver Mis Pedidos
            </Link>
            
            <Link to="/" className={`flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold transition-colors ${isDark ? 'text-gray-300 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
                <Home size={20} /> Volver al Inicio
            </Link>
        </div>

      </motion.div>
    </div>
  );
}
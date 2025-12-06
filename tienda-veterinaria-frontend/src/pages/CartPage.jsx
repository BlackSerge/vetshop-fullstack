// src/pages/CartPage.jsx
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus } from 'lucide-react';

// Stores
import { useCartStore } from '../store/useCartStore';
import { useThemeStore } from '../store/useThemeStore';
import { Helmet } from 'react-helmet-async';
import LoadingSpinner from '../components/LoadingSpinner';
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

  const cardBg = isDark ? "bg-gray-800" : "bg-white";
  const textColor = isDark ? "text-gray-200" : "text-gray-700";
  const textMuted = isDark ? "text-gray-400" : "text-gray-500";
  const btnPrimary = isDark ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-purple-700 hover:bg-purple-800 text-white";
  const btnDanger = isDark ? "bg-red-700 hover:bg-red-800 text-white" : "bg-red-500 hover:bg-red-600 text-white";
  const btnSecondary = isDark ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-800";

  const handleUpdateQuantity = async (itemId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity <= 0) {
      if (window.confirm("¿Eliminar producto?")) {
        await removeItem(itemId);
      }
    } else {
      await updateItemQuantity(itemId, newQuantity);
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (window.confirm("¿Eliminar producto?")) await removeItem(itemId);
  };

  const handleClearCart = async () => {
    if (window.confirm("¿Vaciar carrito?")) await clearCart();
  };

  const handleCheckout = () => {
    // Si no está logueado, redirigir a login con state para volver
    // O permitir checkout anónimo si tu backend lo soporta
    navigate('/checkout');
  };

  if (loadingCart && cartItems.length === 0) {
    return (
      <div className={`py-16 min-h-screen flex justify-center items-center `}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <section className="py-16 w-full"> 
     <Helmet>
            <title>Finalizar Compra | VetShop</title>
        </Helmet>
      <div className="container mx-auto px-6 max-w-4xl">
        <h1 className="text-4xl font-bold text-center mb-10">Tu Carrito</h1>

        {cartItems.length === 0 ? (
          <div className={`p-8 rounded-xl shadow-lg text-center ${cardBg} ${textColor}`}>
            <p className="text-xl mb-4">Tu carrito está vacío 😿</p>
            <button onClick={() => navigate('/products')} className={`py-2 px-6 rounded-md ${btnPrimary}`}>
              Ir a comprar
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {cartItems.map((item) => (
              <div key={item.id} className={`flex items-center p-4 rounded-xl shadow-md ${cardBg} ${textColor}`}>
                <img
                  src={item.product_main_image || '/placeholder.jpg'}
                  alt={item.product_name}
                  className="w-24 h-24 object-cover rounded-md mr-4"
                />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">{item.product_name}</h2>
                  <p className={textMuted}>{formatPrice(item.price)} c/u</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleUpdateQuantity(item.id, item.quantity, -1)}
                    className={`p-2 rounded-full ${btnSecondary}`}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button
                    onClick={() => handleUpdateQuantity(item.id, item.quantity, 1)}
                    className={`p-2 rounded-full ${btnSecondary}`}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <p className="ml-4 font-bold text-lg">{formatPrice(item.subtotal)}</p>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className={`ml-4 p-2 rounded-full ${btnDanger}`}
                >
                  <X size={20} />
                </button>
              </div>
            ))}

            <div className={`p-6 rounded-xl shadow-lg ${cardBg} flex flex-col items-end space-y-4`}>
              <div className="text-xl font-bold">
                Total: <span className="text-purple-700 dark:text-purple-400">{formatPrice(cartTotalPrice)}</span>
              </div>
              <div className="flex space-x-4">
                <button onClick={handleClearCart} className={`py-2 px-6 rounded-md ${btnDanger}`}>
                  Vaciar
                </button>
                <button onClick={handleCheckout} className={`py-2 px-6 rounded-md ${btnPrimary}`}>
                  Proceder al Pago
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
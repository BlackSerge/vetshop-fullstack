import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Truck, ShieldCheck, HeartHandshake, AlertTriangle } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";
import { useCartStore } from "../store/useCartStore";
import api from "../api/axios";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";
import { Helmet } from 'react-helmet-async';

export default function Home() {
  const theme = useThemeStore((state) => state.theme);
  const addItem = useCartStore((state) => state.addItem);
  const isDark = theme === "dark";

  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- ESTADO DE ERROR ---
  const [error, setError] = useState(false);

  // --- VARIABLES DE DISEÑO ---
  const gradientLight = "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600";
  const gradientDark = "bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900";
  const productsSectionClass = isDark ? "bg-gray-900" : "bg-white";
  const textTitle = isDark ? "text-white" : "text-gray-900";
  const ctaBtnBg = "bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-bold shadow-lg shadow-yellow-400/20";

  const MY_PHONE_NUMBER = "5358430189";
  const homeMessage = "Hola, tengo una consulta sobre la tienda VetShop.";
  const homeWhatsappUrl = `https://wa.me/${MY_PHONE_NUMBER}?text=${encodeURIComponent(homeMessage)}`;

  // --- FUNCIÓN DE CARGA ROBUSTA (Con Reintento) ---
  const fetchFeatured = useCallback(async () => {
    setLoading(true);
    setError(false); // Resetear error antes de intentar
    try {
      const response = await api.get('/productos/items/?featured=true&page_size=8');
      setFeaturedProducts(response.data.results || []);
    } catch (error) {
      console.error("Error cargando destacados:", error);
      setError(true); // Activar UI de error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatured();
  }, [fetchFeatured]);

  const handleAddToCart = (product) => addItem(product);

  const marqueeProducts = featuredProducts.length > 0 
    ? [...featuredProducts, ...featuredProducts, ...featuredProducts] 
    : [];

  return (
    <div className="flex flex-col flex-grow w-full overflow-x-hidden">
      <Helmet>
      <title>VetShop - Todo para tu mascota</title>
        <meta name="description" content="La mejor tienda de alimentos y accesorios para perros, gatos y más." />
      </Helmet>
      
      {/* 1. HERO SUPERIOR */}
      <section id="home" className="relative text-center py-16 md:py-32 text-white overflow-hidden">
         <div className={`absolute inset-0 ${gradientLight} z-0`}></div>
         <div className={`absolute inset-0 ${gradientDark} z-0 transition-opacity duration-700 ease-in-out ${isDark ? 'opacity-100' : 'opacity-0'}`}></div>

         <div className="relative z-10 px-4 max-w-5xl mx-auto flex flex-col items-center">
            {/* Texto ajustado: text-3xl en movil para que se lea bien, 6xl en desktop */}
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold mb-6 drop-shadow-xl tracking-tight leading-tight">
              Bienestar total para tu <br className="md:hidden" /><span className="text-yellow-400">mejor amigo</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl mb-8 md:mb-10 text-blue-100 font-medium max-w-2xl mx-auto px-2">
              Alimentos premium, juguetes y accesorios seleccionados por expertos veterinarios.
            </p>
            <Link to="/products" className={`inline-flex items-center justify-center px-6 py-3 md:px-8 md:py-4 rounded-full text-base md:text-lg transition-transform hover:scale-105 active:scale-95 ${ctaBtnBg}`}>
              Explorar Tienda <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
         </div>
      </section>

      {/* 2. CARRUSEL PRODUCTOS (Con Manejo de Errores) */}
      <section className={`py-12 md:py-20 ${productsSectionClass} overflow-hidden transition-colors duration-500`}>
          <div className="container mx-auto px-4 mb-8 md:mb-10 text-center">
              <h2 className={`text-2xl md:text-3xl font-bold ${textTitle} mb-2`}>Destacados</h2>
              <p className={isDark ? "text-gray-400 text-sm md:text-base" : "text-gray-600 text-sm md:text-base"}>Lo favorito de nuestros clientes</p>
          </div>

          {loading ? (
              <div className="flex justify-center py-10"><LoadingSpinner /></div>
          ) : error ? (
              // --- UI DE ERROR (REINTENTAR) ---
              <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                  <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full mb-3 text-red-500">
                      <AlertTriangle size={32} />
                  </div>
                  <p className={isDark ? "text-gray-300" : "text-gray-600"}>No pudimos cargar los destacados.</p>
                  <button 
                    onClick={fetchFeatured} 
                    className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-full font-bold hover:bg-purple-700 transition-colors shadow-lg"
                  >
                      Reintentar
                  </button>
              </div>
          ) : featuredProducts.length > 0 ? (
              <div className="relative w-full overflow-hidden">
                  <div className="flex gap-4 md:gap-6 animate-scroll w-max hover:cursor-grab py-4 px-4">
                      {marqueeProducts.map((product, index) => (
                          // CLAVE: w-[85vw] hace que la tarjeta ocupe el 85% del ancho en movil (grande)
                          <div key={`${product.id}-${index}`} className="w-[85vw] sm:w-80 flex-shrink-0 transform transition-transform hover:scale-105">
                              <ProductCard product={product} onAdd={handleAddToCart} />
                          </div>
                      ))}
                  </div>
              </div>
          ) : (
              <p className="text-center text-gray-500">No hay productos destacados.</p>
          )}
      </section>

      {/* 3. BLOQUE INFERIOR */}
      <section className="relative text-white py-16 md:py-24 overflow-hidden">
        {/* ... (Igual que antes) ... */}
        <div className={`absolute inset-0 ${gradientLight} z-0`}></div>
        <div className={`absolute inset-0 ${gradientDark} z-0 transition-opacity duration-700 ease-in-out ${isDark ? 'opacity-100' : 'opacity-0'}`}></div>

        <div className="relative z-10 container mx-auto px-4 md:px-6">
            <div className="text-center mb-16 md:mb-20">
                <h2 className="text-2xl md:text-4xl font-bold mb-8 md:mb-12">¿Por qué elegirnos?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
                    <FeatureCard 
                        icon={<Truck className="w-8 h-8 md:w-10 md:h-10 text-blue-300" />} 
                        title="Envío Rápido" 
                        desc="Recibe tus productos en 24-48 horas en la puerta de tu casa." 
                    />
                    <FeatureCard 
                        icon={<ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-green-300" />} 
                        title="Calidad Garantizada" 
                        desc="Solo trabajamos con marcas certificadas y seguras." 
                    />
                    <FeatureCard 
                        icon={<HeartHandshake className="w-8 h-8 md:w-10 md:h-10 text-pink-300" />} 
                        title="Atención Veterinaria" 
                        desc="Soporte especializado para dudas sobre cuidados." 
                    />
                </div>
            </div>

            <div className="text-center max-w-2xl mx-auto px-4">
                <h2 className="text-2xl md:text-4xl font-bold mb-4 md:mb-6">¿Listo para consentirlos?</h2>
                <p className="mb-8 md:mb-10 text-base md:text-lg text-blue-100 leading-relaxed">Únete a nuestra comunidad de amantes de las mascotas y recibe ofertas exclusivas directamente en tu correo.</p>
                <Link to="/register" className="inline-block w-full sm:w-auto bg-blue-600 text-white font-bold py-3 px-8 md:py-4 md:px-10 rounded-full hover:bg-blue-500 transition-all shadow-xl transform hover:-translate-y-1 hover:shadow-2xl border-2 border-blue-400/30">
                    Crear Cuenta Gratis
                </Link>
            </div>
        </div>
      </section>
      
      {/* WhatsApp - Posicionamiento optimizado para movil */}
      <a 
        href={homeWhatsappUrl} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 p-3 md:p-4 rounded-full shadow-lg bg-green-500 hover:bg-green-600 text-white transition-transform hover:scale-110 active:scale-95 z-50 flex items-center justify-center w-12 h-12 md:w-14 md:h-14"
        aria-label="Contactar por WhatsApp"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-7 md:h-7"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
      </a>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
    return (
        <div className="p-6 md:p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 flex flex-col items-center">
            <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 md:mb-6 rounded-full flex items-center justify-center bg-white/10 shadow-inner">
                {icon}
            </div>
            <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-white text-center">{title}</h3>
            <p className="text-sm md:text-base leading-relaxed text-blue-100/90 text-center">{desc}</p>
        </div>
    );
}
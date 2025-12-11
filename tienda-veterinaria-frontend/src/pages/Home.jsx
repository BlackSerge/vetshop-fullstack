import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Truck, ShieldCheck, HeartHandshake, AlertTriangle, ChevronDown } from "lucide-react";
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
  
  const ctaBtnBg = "bg-yellow-400 hover:bg-yellow-300 text-blue-900 font-extrabold shadow-xl shadow-yellow-400/20";

  const MY_PHONE_NUMBER = "5358430189";
  const homeMessage = "Hola, tengo una consulta sobre la tienda VetShop.";
  const homeWhatsappUrl = `https://wa.me/${MY_PHONE_NUMBER}?text=${encodeURIComponent(homeMessage)}`;

  // --- FUNCIÓN DE CARGA ---
  const fetchFeatured = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await api.get('/productos/items/?featured=true&page_size=8');
      setFeaturedProducts(response.data.results || []);
    } catch (error) {
      console.error("Error cargando destacados:", error);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatured();
  }, [fetchFeatured]);

  const handleAddToCart = (product) => addItem(product);

  const carouselItems = featuredProducts.length > 0 
    ? [...featuredProducts, ...featuredProducts, ...featuredProducts, ...featuredProducts] 
    : [];

  return (
    <div className="flex flex-col flex-grow w-full overflow-x-hidden font-sans">
      <Helmet>
        <title>VetShop - Todo para tu mascota</title>
        <meta name="description" content="La mejor tienda de alimentos y accesorios para perros, gatos y más." />
      </Helmet>

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); } 
        }
        .animate-scroll {
          animation: scroll 40s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
      
      {/* 1. HERO SUPERIOR - INMERSIVO */}
      {/* min-h-[90vh] asegura que ocupe el 90% de la pantalla del móvil. 
          flex flex-col justify-center centra el contenido verticalmente. */}
      <section id="home" className="relative text-center min-h-[90vh] flex flex-col justify-center items-center text-white overflow-hidden py-10">
         <div className={`absolute inset-0 ${gradientLight} z-0`}></div>
         <div className={`absolute inset-0 ${gradientDark} z-0 transition-opacity duration-700 ease-in-out ${isDark ? 'opacity-100' : 'opacity-0'}`}></div>

         <div className="relative z-10 px-6 max-w-6xl mx-auto flex flex-col items-center justify-center flex-1">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold mb-8 drop-shadow-2xl tracking-tight leading-[1.1]">
              Bienestar total para tu <br className="md:hidden" /><span className="text-yellow-400">mejor amigo</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-12 text-blue-100 font-medium max-w-2xl mx-auto leading-relaxed px-2">
              Alimentos premium, juguetes y accesorios seleccionados por expertos veterinarios.
            </p>
            
            <Link 
              to="/products" 
              className={`w-full md:w-auto inline-flex items-center justify-center px-8 py-5 md:px-12 md:py-4 rounded-full text-xl md:text-lg font-bold transition-transform hover:scale-105 active:scale-95 ${ctaBtnBg}`}
            >
              Explorar Tienda <ArrowRight className="ml-3 w-6 h-6 md:w-5 md:h-5 stroke-[3]" />
            </Link>
         </div>

         {/* Indicador de scroll para invitar a bajar */}
         <div className="relative z-10 pb-8 animate-bounce opacity-80">
            <ChevronDown size={32} />
         </div>
      </section>

      {/* 2. CARRUSEL PRODUCTOS */}
      <section className={`py-16 md:py-24 ${productsSectionClass} overflow-hidden transition-colors duration-500`}>
          <div className="container mx-auto px-6 mb-10 text-center">
              <h2 className={`text-4xl md:text-5xl font-bold ${textTitle} mb-3`}>Destacados</h2>
              <p className={isDark ? "text-gray-300 text-lg" : "text-gray-600 text-lg"}>Lo favorito de nuestros clientes</p>
          </div>

          {loading ? (
              <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                  <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full mb-4 text-red-500">
                      <AlertTriangle size={40} />
                  </div>
                  <p className={`text-lg mb-6 ${isDark ? "text-gray-300" : "text-gray-600"}`}>No pudimos cargar los destacados.</p>
                  <button onClick={fetchFeatured} className="w-full md:w-auto px-8 py-4 bg-purple-600 text-white rounded-full font-bold text-lg hover:bg-purple-700 transition-colors shadow-lg">
                      Reintentar
                  </button>
              </div>
          ) : featuredProducts.length > 0 ? (
              <div className="relative w-full overflow-hidden">
                  <div className={`absolute left-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-r ${isDark ? 'from-gray-900' : 'from-white'} to-transparent pointer-events-none`}></div>
                  <div className={`absolute right-0 top-0 bottom-0 w-8 z-10 bg-gradient-to-l ${isDark ? 'from-gray-900' : 'from-white'} to-transparent pointer-events-none`}></div>

                  <div className="flex w-max animate-scroll">
                      {carouselItems.map((product, index) => (
                          <div 
                              key={`${product.id}-${index}`} 
                              // TARJETAS GRANDES EN MÓVIL: w-[85vw]
                              className="flex-shrink-0 px-4 w-[85vw] md:w-80"
                          >
                             <div className="transform transition-transform hover:scale-[1.02] h-full">
                                <ProductCard product={product} onAdd={handleAddToCart} />
                             </div>
                          </div>
                      ))}
                  </div>
              </div>
          ) : (
              <p className="text-center text-gray-500 text-lg">No hay productos destacados.</p>
          )}
          
          <div className="text-center mt-12">
               <Link to="/products" className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-lg hover:underline decoration-2 underline-offset-4">
                  Ver todo el catálogo <ArrowRight size={20} />
               </Link>
          </div>
      </section>

      {/* 3. CARACTERÍSTICAS */}
      <section className="relative text-white py-20 md:py-24 overflow-hidden">
        <div className={`absolute inset-0 ${gradientLight} z-0`}></div>
        <div className={`absolute inset-0 ${gradientDark} z-0 transition-opacity duration-700 ease-in-out ${isDark ? 'opacity-100' : 'opacity-0'}`}></div>

        <div className="relative z-10 container mx-auto px-6">
            <div className="text-center mb-20">
                <h2 className="text-4xl md:text-5xl font-extrabold mb-12">¿Por qué elegirnos?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    <FeatureCard 
                        icon={<Truck className="w-12 h-12 md:w-12 md:h-12 text-blue-300" />} 
                        title="Envío Rápido" 
                        desc="Recibe tus productos en 24-48 horas en la puerta de tu casa." 
                    />
                    <FeatureCard 
                        icon={<ShieldCheck className="w-12 h-12 md:w-12 md:h-12 text-green-300" />} 
                        title="Calidad Garantizada" 
                        desc="Solo trabajamos con marcas certificadas y seguras." 
                    />
                    <FeatureCard 
                        icon={<HeartHandshake className="w-12 h-12 md:w-12 md:h-12 text-pink-300" />} 
                        title="Atención Veterinaria" 
                        desc="Soporte especializado para dudas sobre cuidados." 
                    />
                </div>
            </div>

            <div className="text-center max-w-3xl mx-auto px-2">
                <h2 className="text-4xl md:text-5xl font-extrabold mb-6">¿Listo para consentirlos?</h2>
                <p className="mb-10 text-xl md:text-2xl text-blue-100 leading-relaxed">Únete a nuestra comunidad y recibe ofertas exclusivas.</p>
                <Link to="/register" className="inline-block w-full md:w-auto bg-blue-600 text-white font-bold text-xl py-5 px-10 md:py-4 md:px-12 rounded-full hover:bg-blue-500 transition-all shadow-xl transform hover:-translate-y-1 hover:shadow-2xl border-2 border-blue-400/30">
                    Crear Cuenta Gratis
                </Link>
            </div>
        </div>
      </section>
      
      {/* WhatsApp */}
      <a 
        href={homeWhatsappUrl} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="fixed bottom-6 right-6 p-4 rounded-full shadow-2xl bg-green-500 hover:bg-green-600 text-white transition-transform hover:scale-110 active:scale-95 z-50 flex items-center justify-center w-16 h-16 md:w-14 md:h-14"
        aria-label="Contactar por WhatsApp"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
      </a>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
    return (
        <div className="p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:-translate-y-2 flex flex-col items-center shadow-lg">
            <div className="w-24 h-24 md:w-20 md:h-20 mx-auto mb-6 rounded-full flex items-center justify-center bg-white/10 shadow-inner">
                {icon}
            </div>
            <h3 className="text-2xl md:text-xl font-bold mb-3 text-white text-center">{title}</h3>
            <p className="text-lg md:text-base leading-relaxed text-blue-100/90 text-center">{desc}</p>
        </div>
    );
}
// src/components/ProductCard.jsx
import { Link } from "react-router-dom";
import { useThemeStore } from "@/shared/store/useThemeStore";
import { ShoppingCart, MessageCircle } from "lucide-react";
import { formatPrice } from '@/utils/format';

export default function ProductCard({ product, onAdd }) {

  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === "dark";


  if (!product) return null;

  // Datos
  const featuredImage = product.imagenes?.find(img => img.is_feature) || product.imagenes?.[0];
  const imageUrl = featuredImage?.imagen || '/placeholder.jpg';
  const altText = featuredImage?.alt_text || product.nombre;
  const productBadges = product.is_featured ? ["Destacado"] : [];
  const productRating = product.rating || 0;
  
  // --- WHATSAPP MEJORADO ---
  const MY_PHONE_NUMBER = "5358430189"; // Reemplazar con tu número real
  const message = `Hola, estoy interesado en el producto: ${product.nombre}. `;
  const whatsappUrl = `https://wa.me/${MY_PHONE_NUMBER}?text=${encodeURIComponent(message)}`;

  // --- ESTILOS ---
  const cardBg = isDark ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-100 text-gray-900";
  const titleColor = isDark ? "text-gray-100" : "text-gray-800";
  const mutedTextColor = isDark ? "text-gray-400" : "text-gray-500";
  const badgeBg = isDark ? "bg-purple-900/50 text-purple-200 border border-purple-700" : "bg-purple-50 text-purple-700 border border-purple-100";
  
  const btnAddToCart = "bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg transition-all active:scale-95";
  
  const btnWhatsApp = isDark 
    ? "border border-gray-700 hover:bg-gray-800 text-gray-300" 
    : "border border-gray-200 hover:bg-gray-50 text-gray-600";

  return (
    <div className={`group relative flex flex-col justify-between h-full rounded-2xl border transition-all duration-300 hover:shadow-2xl ${cardBg}`}>
      
      {/* 1. IMAGEN (Clean) */}
      <Link to={`/products/${product.slug}`} className="block relative w-full aspect-[4/3] overflow-hidden rounded-t-2xl p-4 cursor-pointer">
        <img
          src={imageUrl}
          alt={altText}
          loading="lazy"
          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
        />
        
        {productBadges.length > 0 && (
          <div className="absolute top-3 left-3 flex gap-1">
            {productBadges.map((badge, index) => (
              <span key={index} className={`text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-md ${badgeBg}`}>
                {badge}
              </span>
            ))}
          </div>
        )}
      </Link>

      {/* 2. INFO */}
      <div className="flex flex-col flex-grow p-4 pt-2">
        <div className="mb-1 flex justify-between items-start">
            {product.categoria_info && (
            <p className={`text-[10px] uppercase tracking-wider font-bold ${mutedTextColor}`}>
                {product.categoria_info.nombre}
            </p>
            )}
            {productRating > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-yellow-500 font-bold">★ {formatPrice(productRating)}</div>
            )}
        </div>

        <Link to={`/products/${product.slug}`} className="hover:text-purple-500 transition-colors block mb-3">
            <h3 className={`font-bold text-base md:text-lg leading-tight line-clamp-2 ${titleColor}`}>
            {product.nombre}
            </h3>
        </Link>

        <div className="mt-auto flex items-end justify-between">
            <div className="flex flex-col">
                {product.precio_oferta && (
                    <span className={`text-xs line-through ${mutedTextColor}`}>${formatPrice(product.precio)}</span>
                )}
                <span className={`text-lg md:text-xl font-extrabold ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
                    ${formatPrice(product.get_precio_actual)}
                </span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${product.stock > 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700"}`}>
                {product.stock > 0 ? "En Stock" : "Agotado"}
            </span>
        </div>
      </div>

      {/* 3. BOTONES */}
      <div className="p-4 pt-0 grid grid-cols-5 gap-2">
        <button
          onClick={() => { if (onAdd) onAdd(product); }}
          disabled={product.stock === 0}
          className={`col-span-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 ${btnAddToCart} disabled:opacity-50 disabled:bg-gray-400`}
        >
            <ShoppingCart size={18} />
            <span>Añadir</span>
        </button>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`col-span-1 py-2.5 rounded-xl flex items-center justify-center transition-all active:scale-95 ${btnWhatsApp}`}
        >
          <MessageCircle size={20} />
        </a>
      </div>
    </div>
  );
}

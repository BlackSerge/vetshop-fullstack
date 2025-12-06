// src/components/ProductCardSkeleton.jsx
import { useThemeStore } from '../store/useThemeStore';

export default function ProductCardSkeleton() {
  // ARREGLO: Extraer correctamente el theme del store
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === "dark";

  // <--- DEFINIR VARIABLES DE ESTILO DINÁMICAS ---
  const skeletonBg = isDark ? "bg-gray-700" : "bg-gray-200";
  const cardBg = isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-100";
  const pulseAnim = "animate-pulse";
  // ---------------------------------------------

  return (
    <div
      className={`rounded-2xl shadow-lg border p-5 w-full h-72 flex flex-col justify-between ${cardBg}`}
    >
      {/* Imagen */}
      <div className="flex flex-col items-center mb-4">
        <div className={`w-36 h-36 rounded-lg ${skeletonBg} ${pulseAnim}`}></div>
      </div>
      {/* Título */}
      <div className={`h-4 w-3/4 rounded ${skeletonBg} ${pulseAnim} mb-2 mx-auto`}></div>
      {/* Categoría/Marca */}
      <div className={`h-3 w-1/2 rounded ${skeletonBg} ${pulseAnim} mb-4 mx-auto`}></div>
      {/* Precio */}
      <div className={`h-4 w-1/3 rounded ${skeletonBg} ${pulseAnim} mb-4 mx-auto`}></div>
      {/* Botón */}
      <div className={`h-10 w-full rounded-xl ${skeletonBg} ${pulseAnim}`}></div>
    </div>
  );
}
import React from 'react';
import { useThemeStore } from '../store/useThemeStore';

/**
 * Componente Reutilizable de Carga (Skeleton)
 */
export default function SkeletonLoader({ type = 'product', count = 1, className = "" }) {
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === "dark";

  // Variables de estilo dinámicas - Colores más suaves
  const shimmer = "animate-pulse";
  const bgBase = isDark ? "bg-gray-700" : "bg-gray-200"; // Más oscuro en dark
  const bgCard = isDark ? "bg-gray-800/60 border-gray-700/50" : "bg-white border-gray-100";
  
  // Renderizadores por tipo
  const renderProduct = (key) => (
    <div key={key} className={`rounded-2xl border p-3 w-full h-full flex flex-col gap-3 ${bgCard} ${className}`}>
      <div className={`aspect-square w-full rounded-xl ${bgBase} ${shimmer} opacity-70`}></div>
      <div className="space-y-2 flex-1 pt-2">
        <div className={`h-4 w-3/4 rounded-full ${bgBase} ${shimmer}`}></div>
        <div className={`h-3 w-1/2 rounded-full ${bgBase} ${shimmer} opacity-60`}></div>
      </div>
      <div className="mt-auto flex justify-between items-center pt-2 border-t border-gray-200/10">
        <div className={`h-6 w-16 rounded-full ${bgBase} ${shimmer}`}></div>
        <div className={`h-9 w-9 rounded-full ${bgBase} ${shimmer}`}></div>
      </div>
    </div>
  );

  const renderTable = (key) => (
    <div key={key} className={`flex items-center gap-4 py-4 px-6 border-b ${isDark ? 'border-gray-700/50' : 'border-gray-100'} ${className}`}>
        <div className={`h-4 w-4 rounded ${bgBase} ${shimmer}`}></div>
        <div className={`h-10 w-10 rounded-lg ${bgBase} ${shimmer}`}></div>
        <div className={`h-4 flex-1 rounded-full ${bgBase} ${shimmer} max-w-xs`}></div>
        <div className={`h-4 w-20 rounded-full ${bgBase} ${shimmer} hidden sm:block`}></div>
        <div className={`h-8 w-24 rounded-lg ${bgBase} ${shimmer}`}></div>
    </div>
  );

  const renderCheckout = (key) => (
    <div key={key} className={`space-y-6 ${className}`}>
        <div className="flex gap-4 mb-6">
            <div className={`h-10 w-full rounded-xl ${bgBase} ${shimmer}`}></div>
        </div>
        <div className={`h-40 w-full rounded-2xl ${bgBase} ${shimmer} opacity-50`}></div>
        <div className="flex justify-between mt-4">
             <div className={`h-4 w-24 rounded ${bgBase} ${shimmer}`}></div>
             <div className={`h-4 w-16 rounded ${bgBase} ${shimmer}`}></div>
        </div>
        <div className={`h-14 w-full mt-6 rounded-2xl ${bgBase} ${shimmer}`}></div>
    </div>
  );

  const renderAdminDashboard = (key) => (
    <div key={key} className={`p-6 rounded-3xl border h-44 flex flex-col justify-between ${bgCard} ${className}`}>
        <div className={`h-10 w-10 rounded-xl ${bgBase} ${shimmer}`}></div>
        <div className="space-y-2">
            <div className={`h-8 w-1/2 rounded-lg ${bgBase} ${shimmer}`}></div>
            <div className={`h-4 w-1/3 rounded-full ${bgBase} ${shimmer} opacity-60`}></div>
        </div>
    </div>
  );

  const renderText = (key) => (
     <div key={key} className={`h-4 w-full rounded ${bgBase} ${shimmer} ${className}`}></div>
  );

  // Selector
  return (
    <>
      {Array(count).fill(0).map((_, index) => {
        switch (type) {
            case 'table': return renderTable(index);
            case 'checkout': return renderCheckout(index);
            case 'admin-dashboard': return renderAdminDashboard(index);
            case 'text': return renderText(index);
            case 'product':
            default: 
                return renderProduct(index);
        }
      })}
    </>
  );
}
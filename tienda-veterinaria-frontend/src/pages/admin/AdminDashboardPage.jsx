// src/pages/admin/AdminDashboardPage.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Users, DollarSign, ShoppingBag, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import adminService from '../../services/adminService';
import { useThemeStore } from '../../store/useThemeStore';
import LoadingSpinner from '../../components/LoadingSpinner';


export default function AdminDashboardPage() {
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estilos
  const cardBg = isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900 shadow-sm";
  const textMuted = isDark ? "text-gray-400" : "text-gray-500";

  useEffect(() => {
    adminService.getDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-96 flex items-center justify-center"><LoadingSpinner /></div>;
  if (!stats) return <p>Error cargando estadísticas.</p>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className={`text-3xl font-bold mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>

      {/* 1. TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
            icon={<DollarSign className="text-green-600" />} 
            title="Ventas Totales" 
            value={`$${stats.total_sales}`} 
            sub="Ingresos históricos" 
            isDark={isDark} 
        />
        <StatCard 
            icon={<TrendingUp className="text-blue-600" />} 
            title="Ventas Mes" 
            value={`$${stats.month_sales}`} 
            sub="Últimos 30 días" 
            isDark={isDark} 
        />
        <StatCard 
            icon={<ShoppingBag className="text-purple-600" />} 
            title="Pedidos Totales" 
            value={stats.total_orders} 
            sub="Órdenes recibidas" 
            isDark={isDark} 
        />
        <StatCard 
            icon={<Users className="text-orange-600" />} 
            title="Nuevos Pedidos" 
            value={stats.month_orders} 
            sub="Últimos 30 días" 
            isDark={isDark} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 2. GRÁFICO DE VENTAS (Ocupa 2 columnas) */}
        <div className={`lg:col-span-2 p-6 rounded-xl border ${cardBg}`}>
            <h3 className="text-lg font-bold mb-6">Ventas últimos 7 días</h3>
            <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.chart_data}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#374151" : "#e5e7eb"} />
                        <XAxis dataKey="date" stroke={isDark ? "#9ca3af" : "#4b5563"} />
                        <YAxis stroke={isDark ? "#9ca3af" : "#4b5563"} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            itemStyle={{ color: isDark ? '#fff' : '#000' }}
                        />
                        <Bar dataKey="sales" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Ventas ($)" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* 3. TOP PRODUCTOS (Ocupa 1 columna) */}
        <div className={`p-6 rounded-xl border ${cardBg}`}>
            <h3 className="text-lg font-bold mb-6">Top Productos</h3>
            <div className="space-y-4">
                {stats.top_products.map((prod, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0">
                        <span className="text-sm font-medium truncate pr-2">{prod.product__nombre}</span>
                        <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                            {prod.total_sold} vendidos
                        </span>
                    </div>
                ))}
                {stats.top_products.length === 0 && <p className={textMuted}>No hay datos aún.</p>}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                <Link to="/admin-panel/productos" className="text-sm text-purple-600 hover:underline font-medium flex items-center gap-1">
                    Gestionar Inventario &rarr;
                </Link>
            </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ icon, title, value, sub, isDark }) {
    return (
        <div className={`p-6 rounded-xl border flex items-start justify-between ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow-sm"}`}>
            <div>
                <p className={`text-sm font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{title}</p>
                <h3 className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>{value}</h3>
                <p className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>{sub}</p>
            </div>
            <div className={`p-3 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-50"}`}>
                {icon}
            </div>
        </div>
    );
}
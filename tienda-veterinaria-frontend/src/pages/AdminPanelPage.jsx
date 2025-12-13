import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from 'recharts';
import { 
    Package, Users, DollarSign, ShoppingBag, TrendingUp, 
    ArrowUpRight, ArrowDownRight, Activity 
} from 'lucide-react';

import SkeletonLoader from '../components/ProductCardSkeleton';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import adminService from '../services/adminService';
import { formatPrice } from '../utils/format';

export default function AdminPanelPage() {
  const { user } = useAuthStore();
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === "dark";
  const navigate = useNavigate();

  // --- REACT QUERY: Dashboard Stats ---
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: adminService.getDashboardStats,
    refetchInterval: 30000, // Actualizar cada 30 segundos automáticamente
  });
  
  // --- GLASS STYLES RESTORED ---
  const cardStyle = isDark 
    ? "bg-gray-900/60 border-gray-700/50 shadow-black/20 backdrop-blur-xl" 
    : "bg-white/60 border-white/60 shadow-purple-100/50 backdrop-blur-xl";
    
  const textTitle = isDark ? "text-white" : "text-gray-900";
  const textMuted = isDark ? "text-gray-400" : "text-gray-600";

  // --- COMPONENTS ---
  const StatCard = ({ title, value, icon: Icon, trend, colorClass, subTitle }) => (
      <div className={`p-5 sm:p-6 rounded-3xl border flex flex-col justify-between h-40 sm:h-44 relative overflow-hidden transition-all hover:shadow-xl group ${cardStyle}`}>
          <div className={`absolute -top-4 -right-4 p-4 opacity-10 rounded-bl-full transform group-hover:scale-110 transition-transform duration-500 rotate-12 ${colorClass.bgText}`}>
              <Icon size={100} />
          </div>
          
          <div className="flex justify-between items-start z-10">
              <div className={`p-3.5 rounded-2xl shadow-sm ${colorClass.bg} ${colorClass.text}`}>
                  <Icon size={24} />
              </div>
              {trend && (
                  <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${trend > 0 ? 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400' : 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400'}`}>
                      {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {Math.abs(trend)}%
                  </div>
              )}
          </div>
          
          <div className="z-10 mt-4">
              <h3 className={`text-2xl sm:text-3xl font-black tracking-tight ${textTitle}`}>{value}</h3>
              <p className={`text-xs font-bold uppercase tracking-widest ${textMuted}`}>{title}</p>
              {subTitle && <p className={`text-xs mt-1 font-medium opacity-70 ${textTitle}`}>{subTitle}</p>}
          </div>
      </div>
  );

  if (isLoading) {
      return (
          <div className="w-full space-y-8 p-2">
              <div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => <SkeletonLoader key={i} type="admin-dashboard" />)}
              </div>
          </div>
      );
  }

  if (!stats) return <div className="p-10 text-center opacity-60">No se pudieron cargar los datos.</div>;

  return (
      <section className="w-full space-y-8 animate-fadeIn pb-24">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className={`text-3xl md:text-4xl font-black flex items-center gap-3 ${textTitle}`}>
                    Dashboard 
                </h1>
                <p className={`text-sm sm:text-base mt-2 ${textMuted}`}>
                    Resumen de actividad en tiempo real.
                </p>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
                <button className={`flex-1 md:flex-none px-5 py-3 rounded-2xl text-sm font-bold border flex items-center justify-center gap-2 transition-colors ${cardStyle}`}>
                    <Activity size={18} /> <span className="hidden sm:inline">Reportes</span>
                </button>
            </div>
        </div>

        {/* 1. KPIs Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard 
                title="Ingresos" 
                value={formatPrice(stats.total_sales)} 
                icon={DollarSign} 
                trend={12.5}
                subTitle="Este mes"
                colorClass={{ bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', bgText: 'text-green-500' }}
            />
            <StatCard 
                title="Pedidos" 
                value={stats.total_orders} 
                icon={ShoppingBag} 
                trend={8.2}
                subTitle="Procesados"
                colorClass={{ bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', bgText: 'text-blue-500' }}
            />
            <StatCard 
                title="Usuarios" 
                value={stats.total_users} 
                icon={Users} 
                trend={-2.4}
                subTitle="Registrados"
                colorClass={{ bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', bgText: 'text-orange-500' }}
            />
            <StatCard 
                title="Inventario" 
                value={stats.total_products} 
                icon={Package} 
                trend={0}
                subTitle="Productos activos"
                colorClass={{ bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', bgText: 'text-purple-500' }}
            />
        </div>

        {/* 2. Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Main Chart: Sales Over Time */}
            <div className={`lg:col-span-2 p-6 rounded-3xl border shadow-lg ${cardStyle}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h3 className={`text-xl font-bold ${textTitle}`}>Resumen de Ingresos</h3>
                        <p className={`text-xs uppercase tracking-wider font-bold ${textMuted}`}>Últimos 30 días</p>
                    </div>
                    <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg border ${isDark ? 'bg-purple-900/20 text-purple-300 border-purple-800' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
                        <TrendingUp size={14} /> +15% Crecimiento
                    </div>
                </div>
                
                <div className="h-64 sm:h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"} vertical={false} />
                            <XAxis 
                                dataKey="date" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12, fontWeight: 700 }} 
                                dy={10}
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 12, fontWeight: 700 }} 
                                tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip 
                                contentStyle={{ 
                                    backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                                    borderColor: isDark ? '#374151' : '#e5e7eb',
                                    borderRadius: '16px',
                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                    padding: '12px',
                                }}
                                itemStyle={{ color: isDark ? '#fff' : '#1f2937', fontWeight: 'bold' }}
                                formatter={(value) => [`$${value}`, 'Ventas']}
                                labelStyle={{ color: isDark ? '#9ca3af' : '#6b7280', marginBottom: '4px' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="sales" 
                                stroke="#9333ea" 
                                strokeWidth={4}
                                fillOpacity={1} 
                                fill="url(#colorSales)" 
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#9333ea', stroke: '#fff' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Side Panel: Top Products */}
            <div className={`p-6 rounded-3xl border shadow-lg flex flex-col ${cardStyle}`}>
                <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${textTitle}`}>
                    <Package size={20} className="text-purple-500" /> Productos Top
                </h3>
                
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 max-h-80 lg:max-h-none">
                    {stats.top_products && stats.top_products.length > 0 ? (
                        stats.top_products.map((prod, index) => (
                            <div key={index} className={`flex items-center gap-4 group p-3 rounded-2xl transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${
                                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                    index === 1 ? 'bg-gray-100 text-gray-600' :
                                    index === 2 ? 'bg-orange-100 text-orange-700' : 
                                    'bg-purple-50 text-purple-600'
                                }`}>
                                    #{index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-bold truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                                        {prod.name}
                                    </p>
                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                        {prod.sales} ventas
                                    </p>
                                </div>
                                <div className={`text-sm font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    ${prod.revenue}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-sm opacity-50 py-10">No hay datos suficientes.</p>
                    )}
                </div>

                <Link 
                    to="/admin-panel/productos" 
                    className={`mt-6 w-full py-3.5 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-all active:scale-95 ${isDark ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                >
                    Ver Inventario <TrendingUp size={16} />
                </Link>
            </div>
        </div>

        {/* 3. Orders Chart */}
        <div className={`p-6 rounded-3xl border shadow-lg ${cardStyle}`}>
            <div className="flex justify-between items-center mb-6">
                <h3 className={`text-lg font-bold ${textTitle}`}>Pedidos por Día</h3>
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                    <BarChart size={20} className="w-5 h-5"/>
                </div>
            </div>
            <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.chart_data}>
                        <Tooltip 
                            cursor={{fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}}
                            contentStyle={{ 
                                backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                                borderRadius: '12px', 
                                border: isDark ? '1px solid #374151' : '1px solid #e5e7eb', 
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                fontWeight: 'bold'
                            }}
                        />
                        <Bar dataKey="orders" fill="#3b82f6" radius={[6, 6, 6, 6]} barSize={32} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

      </section>
  );
}
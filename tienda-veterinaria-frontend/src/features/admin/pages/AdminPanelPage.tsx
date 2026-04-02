import  { useState, useEffect, ElementType } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
     Cell, 
} from 'recharts';
import { 
    Package, Users, DollarSign, ShoppingBag, TrendingUp, 
    ArrowUpRight, ArrowDownRight, Activity 
} from 'lucide-react';

import SkeletonLoader from '@/features/products/components/ProductCardSkeleton';
import { useThemeStore } from '@/shared';
import adminService from '../services/adminService';
import { formatPrice } from '@/utils/format';
import type { AdminDashboardStatsResponse } from '../types';

interface ColorClass {
  bg: string;
  text: string;
  bgText: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ElementType;
  trend?: number;
  colorClass: ColorClass;
  subTitle?: string;
}

interface OrderByStatus {
  status: string;
  count: number;
  total?: number;
}

interface ProductData {
  product__nombre: string;
  total_quantity: number;
  total_revenue: string | number;
}

interface SalesByCategory {
  category: string;
  total_revenue: number;
}

export default function AdminPanelPage(): JSX.Element {
  const theme = useThemeStore((state) => state.theme) as string;
  const isDark = theme === "dark";
  const [period, setPeriod] = useState<string>(() => {
    return localStorage.getItem('adminDashboardPeriod') || '30d';
  });
  
  const [activeIndex, setActiveIndex] = useState<number>(0);
  
  useEffect(() => {
    localStorage.setItem('adminDashboardPeriod', period);
  }, [period]);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats', period],
    queryFn: () => adminService.getDashboardStats(period),
    refetchInterval: 30000,
  }) as { data?: AdminDashboardStatsResponse; isLoading: boolean };

  useEffect(() => {
    if (stats?.sales_by_category && Array.isArray(stats.sales_by_category) && stats.sales_by_category.length > 1) {
      const interval = setInterval(() => {
        setActiveIndex((current) => (current + 1) % (stats.sales_by_category?.length || 1));
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [stats?.sales_by_category]);
  
  const cardStyle = isDark 
    ? "bg-gray-900 border-gray-700/50 shadow-black/20" 
    : "bg-white border-gray-100 shadow-xl shadow-gray-200/50";
    
  const textTitle = isDark ? "text-white" : "text-gray-900";
  const textMuted = isDark ? "text-gray-400" : "text-gray-600";

  const StatCard = ({ title, value, icon, trend, colorClass, subTitle }: StatCardProps): JSX.Element => {
    const IconComponent = icon;
    return (
      <div className={`p-5 sm:p-6 rounded-3xl border flex flex-col justify-between h-40 sm:h-44 relative overflow-hidden transition-all hover:shadow-xl group ${cardStyle}`}>
          <div className={`absolute -top-4 -right-4 p-4 opacity-10 rounded-bl-full transform group-hover:scale-110 transition-transform duration-500 rotate-12 ${colorClass.bgText}`}>
              <IconComponent size={100} />
          </div>
          
          <div className="flex justify-between items-start z-10">
              <div className={`p-3.5 rounded-2xl shadow-sm ${colorClass.bg} ${colorClass.text}`}>
                  <IconComponent size={24} />
              </div>
              {trend !== undefined && (
                  <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${trend >= 0 ? 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400' : 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400'}`}>
                      {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
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
  };

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

  const totalOrdersInPeriod: number = (stats.orders_by_status as OrderByStatus[] || [])?.reduce((acc, curr) => acc + (curr.count || 0), 0) || 0;

  return (
      <section className="w-full space-y-8 animate-fadeIn pb-24">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
                <h1 className={`text-3xl sm:text-4xl font-black flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Dashboard 
                </h1>
                <p className={`text-sm sm:text-base mt-2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Resumen de actividad en tiempo real.
                </p>
            </div>
            
            <div className={`flex p-1.5 rounded-3xl border shadow-sm transition-all ${isDark ? 'bg-gray-950 border-gray-800' : 'bg-white border-gray-100'}`}>
                {[
                    { id: '7d', label: '7D' },
                    { id: '30d', label: '30D' },
                    { id: '90d', label: '3M' },
                    { id: '1y', label: '1A' }
                ].map((p) => (
                    <button
                        key={p.id}
                        onClick={() => setPeriod(p.id)}
                        className={`
                            px-5 py-2 rounded-2xl text-[11px] font-black transition-all duration-300 relative
                            ${period === p.id 
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/40 scale-105 z-10' 
                                : `text-gray-400 hover:text-purple-600 active:scale-95 ${isDark ? 'hover:bg-gray-800' : 'hover:bg-purple-50'}`
                            }
                        `}
                    >
                        {p.label}
                    </button>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCard 
                title="Ingresos" 
                value={formatPrice(stats.period_sales)} 
                icon={DollarSign} 
                trend={stats.trends?.sales_trend as number | undefined}
                subTitle={`Últimos ${stats.period_days} días`}
                colorClass={{ bg: 'bg-green-500/10', text: 'text-green-600 dark:text-green-400', bgText: 'text-green-500' }}
            />
            <StatCard 
                title="Pedidos" 
                value={stats.period_orders} 
                icon={ShoppingBag} 
                trend={stats.trends?.items_trend as number | undefined}
                subTitle="Unidades vendidas"
                colorClass={{ bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', bgText: 'text-blue-500' }}
            />
            <StatCard 
                title="Clientes" 
                value={stats.active_customers} 
                icon={Users} 
                trend={stats.trends?.customers_trend as number | undefined}
                subTitle="Activos"
                colorClass={{ bg: 'bg-orange-500/10', text: 'text-orange-600 dark:text-orange-400', bgText: 'text-orange-500' }}
            />
            <StatCard 
                title="Inventario" 
                value={stats.total_products} 
                icon={Package} 
                trend={undefined}
                subTitle="Productos totales"
                colorClass={{ bg: 'bg-purple-500/10', text: 'text-purple-600 dark:text-purple-400', bgText: 'text-purple-500' }}
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className={`lg:col-span-2 p-6 rounded-3xl border shadow-lg ${cardStyle}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div>
                        <h3 className={`text-xl font-bold ${textTitle}`}>Resumen de Ingresos</h3>
                        <p className={`text-xs uppercase tracking-wider font-bold ${textMuted}`}>Evolución en el periodo</p>
                    </div>
                    <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg border ${((stats.trends?.sales_trend as number | undefined) || 0) >= 0 ? (isDark ? 'bg-green-900/20 text-green-300 border-green-800' : 'bg-green-50 text-green-600 border-green-100') : (isDark ? 'bg-red-900/20 text-red-300 border-red-800' : 'bg-red-50 text-red-600 border-red-100')}`}>
                        <TrendingUp size={14} className={((stats.trends?.sales_trend as number | undefined) || 0) < 0 ? 'rotate-180' : ''} /> {stats.trends?.sales_trend as number | undefined}% Crecimiento
                    </div>
                </div>
                
                <div className="h-64 sm:h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={(stats.chart_data as unknown as any[]) || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"} vertical={false} />
                            <XAxis 
                                dataKey="label" 
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
                                name="Ventas"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className={`p-6 rounded-3xl border shadow-lg flex flex-col ${cardStyle}`}>
                <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${textTitle}`}>
                    <Package size={20} className="text-purple-500" /> Productos Top
                </h3>
                
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 max-h-80 lg:max-h-none">
                    {stats.top_products && Array.isArray(stats.top_products) && stats.top_products.length > 0 ? (
                        stats.top_products.map((prod: any, index: number) => (
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
                                        {(prod as ProductData).product__nombre}
                                    </p>
                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                        {(prod as ProductData).total_quantity} ventas
                                    </p>
                                </div>
                                <div className={`text-sm font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {formatPrice((prod as ProductData).total_revenue)}
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

        <div className={`p-6 rounded-3xl border shadow-lg ${cardStyle}`}>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className={`text-lg font-bold ${textTitle}`}>Ventas por Categoría</h3>
                    <p className="text-[10px] uppercase tracking-wider font-bold opacity-50">Exploración dinámica</p>
                </div>
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                    <TrendingUp size={20} className="w-5 h-5"/>
                </div>
            </div>
            
            <div className="h-64 w-full">
                {stats.sales_by_category && stats.sales_by_category.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                            data={stats.sales_by_category} 
                            layout="vertical" 
                            margin={{ left: 10, right: 30, top: 0, bottom: 0 }}
                        >
                            <XAxis type="number" hide />
                            <YAxis 
                                dataKey="product__categoria__nombre" 
                                type="category" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{ fill: isDark ? '#9ca3af' : '#6b7280', fontSize: 10, fontWeight: 700 }}
                                width={80}
                                interval={0}
                            />
                            <Tooltip 
                                cursor={{fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}}
                                contentStyle={{ 
                                    backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                                    borderRadius: '16px', 
                                    border: 'none',
                                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                                }}
                                formatter={(value) => [formatPrice(value), 'Total']}
                            />
                            <Bar 
                                dataKey="total_sales" 
                                fill="#8b5cf6" 
                                radius={[0, 20, 20, 0]} 
                                barSize={14} 
                            >
                                {(stats.sales_by_category as SalesByCategory[]).map((_entry: any, index: number) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={index === activeIndex ? '#8b5cf6' : (isDark ? '#4b5563' : '#f3f4f6')} 
                                        className="transition-all duration-700"
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                        <Activity size={48} className="mb-2" />
                        <p className="text-xs font-bold">Sin datos de categorías</p>
                    </div>
                )}
            </div>

            {totalOrdersInPeriod > 0 && (stats.orders_by_status as OrderByStatus[] | undefined)?.length && (stats.orders_by_status as OrderByStatus[]).length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center px-2 animate-in fade-in slide-in-from-bottom-2 duration-1000">
                    {(stats.orders_by_status as OrderByStatus[]).map((status: OrderByStatus, i: number) => (
                        <div key={i} className="text-center group cursor-help" title={`Total bruto: ${formatPrice(status.total)}`}>
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>{status.status}</p>
                            <p className={`text-base font-black ${
                                status.status === 'PAID' ? 'text-green-500' : 
                                status.status === 'PENDING' ? 'text-yellow-500' : 
                                'text-blue-500'
                            }`}>{status.count}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>

      </section>
  );
}



import  { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
     Users, DollarSign, ShoppingBag, TrendingUp, Activity,ChevronRight, Award, Clock
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer
} from 'recharts';
import adminService from '../services/adminService';
import { useThemeStore } from '@/shared';
import { LoadingSpinner } from '@/shared';
import { formatPrice } from '@/utils/format';

export default function AdminDashboardPage() {
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const cardBg = isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900 shadow-sm";
  const accentColor = "#8b5cf6"; 

  const fetchStats = useCallback(async (selectedPeriod) => {
    setIsRefreshing(true);
    try {
      const data = await adminService.getDashboardStats(selectedPeriod);
      setStats(data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(period);
  }, [period, fetchStats]);

  if (loading) return (
    <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <LoadingSpinner />
        <p className="text-gray-500 animate-pulse font-medium">Cargando analíticas...</p>
    </div>
  );
  
  if (!stats) return (
    <div className="p-12 text-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl inline-block border border-red-100">
            Error cargando estadísticas. Por favor intenta de nuevo.
        </div>
    </div>
  );

  const periods = [
    { id: '7d', label: 'Última Semana' },
    { id: '30d', label: 'Últimos 30 Días' },
    { id: '90d', label: 'Último Trimestre' },
    { id: '1y', label: 'Último Año' },
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
            <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm mt-1`}>
                Bienvenido al panel de control de <span className="text-purple-500 font-bold">VetShop</span>.
            </p>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border dark:border-gray-700">
            {periods.map((p) => (
                <button
                    key={p.id}
                    onClick={() => setPeriod(p.id)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                        period === p.id 
                        ? "bg-white dark:bg-gray-700 shadow-sm text-purple-600 dark:text-purple-400" 
                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                >
                    {p.label}
                </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
            title="Ventas del Periodo"
            value={formatPrice(stats.period_sales)}
            icon={<DollarSign size={20} />}
            trend={`${stats.period_days} días`}
            color="purple"
            isDark={isDark}
            isLoading={isRefreshing}
        />
        <MetricCard 
            title="Pedidos Recibidos"
            value={stats.period_orders}
            icon={<ShoppingBag size={20} />}
            trend="Órdenes"
            color="blue"
            isDark={isDark}
            isLoading={isRefreshing}
        />
        <MetricCard 
            title="Ticket Promedio"
            value={formatPrice(stats.period_avg_value)}
            icon={<TrendingUp size={20} />}
            trend="AOV"
            color="green"
            isDark={isDark}
            isLoading={isRefreshing}
        />
        <MetricCard 
            title="Clientes Activos"
            value={stats.active_customers}
            icon={<Users size={20} />}
            trend="Engagement"
            color="orange"
            isDark={isDark}
            isLoading={isRefreshing}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className={`lg:col-span-2 p-6 rounded-2xl border ${cardBg} transition-all hover:shadow-lg`}>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-lg font-bold">Evolución de Ventas ($)</h3>
                    <p className="text-xs text-gray-500">Representación visual del rendimiento económico</p>
                </div>
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <Activity size={18} className="text-purple-500" />
                </div>
            </div>

            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.chart_data}>
                        <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={accentColor} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={accentColor} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#374151" : "#f3f4f6"} />
                        <XAxis 
                            dataKey="label" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280' }}
                            dy={10}
                        />
                        <YAxis 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: isDark ? '#9ca3af' : '#6b7280' }}
                        />
                        <Tooltip 
                            content={<CustomTooltip isDark={isDark} />}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="sales" 
                            stroke={accentColor} 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorSales)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className={`p-6 rounded-2xl border ${cardBg} transition-all hover:shadow-lg flex flex-col`}>
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Award size={20} className="text-yellow-500" /> Top Productos
                </h3>
            </div>
            
            <div className="space-y-5 flex-grow">
                {stats.top_products.map((prod, i) => (
                    <div key={i} className="group flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-500 group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                            {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{prod.product__nombre}</p>
                            <p className="text-[10px] text-gray-500">{prod.total_quantity} unidades vendidas</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-black text-purple-600">{formatPrice(prod.total_revenue || 0)}</p>
                        </div>
                    </div>
                ))}

                {stats.top_products.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-40 opacity-40">
                        <Clock size={48} className="mb-2" />
                        <p className="text-sm">Sin datos para este periodo</p>
                    </div>
                )}
            </div>
            
            <div className="mt-8">
                <Link 
                    to="/admin-panel/productos" 
                    className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 dark:bg-gray-700 hover:bg-purple-600 hover:text-white transition-all rounded-xl text-sm font-bold"
                >
                    Ver Inventario <ChevronRight size={16} />
                </Link>
            </div>
        </div>

      </div>
    </div>
  );
}


function MetricCard({ title, value, icon, trend, color, isDark, isLoading }) {
    const colorClasses = {
        purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
        blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
        green: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400",
        orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    };

    return (
        <div className={`p-6 rounded-2xl border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow-sm"} transition-all hover:-translate-y-1 relative overflow-hidden group`}>
            {isLoading && (
                <div className="absolute top-0 left-0 w-full h-1 bg-purple-500/10 overflow-hidden">
                    <div className="w-full h-full bg-purple-500 animate-[shimmer_1.5s_infinite]"></div>
                </div>
            )}
            
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${colorClasses[color]}`}>
                    {icon}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {trend}
                </div>
            </div>
            
            <div>
                <p className={`text-xs font-bold mb-1 uppercase tracking-tight ${isDark ? "text-gray-500" : "text-gray-400"}`}>{title}</p>
                <h3 className={`text-2xl font-black ${isDark ? "text-white" : "text-gray-900"}`}>{value}</h3>
            </div>
            
            <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-gray-400/5 group-hover:bg-purple-500/5 rounded-full transition-colors"></div>
        </div>
    );
}

function CustomTooltip({ active, payload, label, isDark }) {
    if (active && payload && payload.length) {
        return (
            <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-xl'} border p-3 rounded-xl`}>
                <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">{label}</p>
                <p className="text-sm font-black text-purple-600">{formatPrice(payload[0].value)}</p>
                <p className="text-[10px] text-gray-400 mt-1">Ventas Generadas</p>
            </div>
        );
    }
    return null;
}



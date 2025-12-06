// src/pages/admin/AdminUserDetailPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
    ArrowLeft, User, Mail, Shield, Activity, Clock, MapPin, 
    ShoppingBag, DollarSign, Calendar, Package 
} from 'lucide-react'; // <--- AÑADIDO: Package icon
import adminService from '../../services/adminService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useThemeStore } from '../../store/useThemeStore';

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('activity');
  
  // --- NUEVO ESTADO PARA PEDIDOS ---
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Estilos
  const cardBg = isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900";
  const subText = isDark ? "text-gray-400" : "text-gray-500";
  const statCardBg = isDark ? "bg-gray-700" : "bg-blue-50";

  const fetchUser = useCallback(async () => {
    try {
      const data = await adminService.getUser(id);
      setUser(data);
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar usuario.");
      navigate('/admin-panel/usuarios');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // --- NUEVA LÓGICA: CARGAR PEDIDOS AL CAMBIAR DE TAB ---
  const fetchOrders = useCallback(async () => {
    // Solo cargamos si estamos en la tab 'orders' y no tenemos datos aún
    if (activeTab === 'orders' && orders.length === 0) {
        setLoadingOrders(true);
        try {
            const data = await adminService.getUserOrders(id);
            // Manejar si viene paginado o array directo
            const ordersData = data.results || data || [];
            setOrders(ordersData);
        } catch (err) {
            console.error("Error pedidos:", err);
            // No bloqueamos la UI con toast, solo log
        } finally {
            setLoadingOrders(false);
        }
    }
  }, [activeTab, id, orders.length]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);


  if (loading) return <div className="min-h-screen flex justify-center items-center"><LoadingSpinner /></div>;
  if (!user) return null;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Link to="/admin-panel/usuarios" className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <ArrowLeft size={24} />
        </Link>
        <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
                {user.username}
                {user.is_vip && <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full border border-yellow-200">VIP</span>}
            </h1>
            <p className={`text-sm ${subText}`}>ID: {user.id} • {user.email}</p>
        </div>
      </div>

      {/* KPIs / Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`p-6 rounded-xl border shadow-sm flex items-center gap-4 ${cardBg}`}>
              <div className={`p-3 rounded-full ${statCardBg} text-blue-600`}>
                  <ShoppingBag size={24} />
              </div>
              <div>
                  <p className={`text-xs uppercase font-bold ${subText}`}>Total Pedidos</p>
                  <p className="text-2xl font-bold">{user.total_orders || 0}</p>
              </div>
          </div>
          <div className={`p-6 rounded-xl border shadow-sm flex items-center gap-4 ${cardBg}`}>
              <div className={`p-3 rounded-full ${statCardBg} text-green-600`}>
                  <DollarSign size={24} />
              </div>
              <div>
                  <p className={`text-xs uppercase font-bold ${subText}`}>Gasto Total</p>
                  <p className="text-2xl font-bold">${user.total_spent || '0.00'}</p>
              </div>
          </div>
          <div className={`p-6 rounded-xl border shadow-sm flex items-center gap-4 ${cardBg}`}>
              <div className={`p-3 rounded-full ${statCardBg} text-purple-600`}>
                  <Clock size={24} />
              </div>
              <div>
                  <p className={`text-xs uppercase font-bold ${subText}`}>Última Conexión</p>
                  <p className="text-sm font-medium">{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Nunca'}</p>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUMNA IZQUIERDA: Perfil */}
        <div className="lg:col-span-1 space-y-6">
            <div className={`p-6 rounded-xl shadow-md border ${cardBg}`}>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><User size={20}/> Perfil</h2>
                
                <div className="space-y-4">
                    <div>
                        <label className={`text-xs uppercase font-bold ${subText}`}>Nombre Completo</label>
                        <p className="font-medium">{user.first_name} {user.last_name || '—'}</p>
                    </div>
                    <div>
                        <label className={`text-xs uppercase font-bold ${subText}`}>Rol</label>
                        <p className="flex items-center gap-2">
                            <Shield size={14}/> 
                            {user.is_superuser ? "Super Admin" : user.is_staff ? "Staff" : "Cliente"}
                        </p>
                    </div>
                    <div>
                        <label className={`text-xs uppercase font-bold ${subText}`}>Estado</label>
                        <p className={user.is_active ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
                            {user.is_active ? "Activo" : "Bloqueado"}
                        </p>
                    </div>
                    <div>
                        <label className={`text-xs uppercase font-bold ${subText}`}>Registrado</label>
                        <p className="flex items-center gap-2"><Calendar size={14}/> {new Date(user.date_joined).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* COLUMNA DERECHA: Pestañas */}
        <div className="lg:col-span-2">
            {/* Tabs Header */}
            <div className="flex gap-4 mb-4 border-b border-gray-200 dark:border-gray-700">
                <button 
                    onClick={() => setActiveTab('activity')}
                    className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'activity' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Historial de Actividad
                </button>
                <button 
                    onClick={() => setActiveTab('orders')}
                    className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'orders' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Pedidos
                </button>
            </div>

            <div className={`p-6 rounded-xl shadow-md border ${cardBg} min-h-[400px]`}>
                
                {/* TAB ACTIVIDAD */}
                {activeTab === 'activity' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className={`border-b ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                                <tr>
                                    <th className="pb-3 pl-2">Acción</th>
                                    <th className="pb-3">Detalle</th>
                                    <th className="pb-3">IP</th>
                                    <th className="pb-3">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
                                {user.activity_logs && user.activity_logs.length > 0 ? (
                                    user.activity_logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="py-3 pl-2 font-bold text-xs uppercase tracking-wider text-gray-500">{log.action}</td>
                                            <td className={`py-3 ${subText}`}>{log.details || '—'}</td>
                                            <td className="py-3 flex items-center gap-1 text-xs font-mono text-gray-400">
                                                <MapPin size={10}/> {log.ip_address || 'Unknown'}
                                            </td>
                                            <td className={`py-3 ${subText} text-xs`}>
                                                {new Date(log.timestamp).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="py-12 text-center text-gray-500">No hay actividad registrada.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* --- NUEVA TAB PEDIDOS (IMPLEMENTADA) --- */}
                {activeTab === 'orders' && (
                    <div className="space-y-4">
                        {loadingOrders ? (
                            <div className="flex justify-center py-8"><LoadingSpinner /></div>
                        ) : orders.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <ShoppingBag size={48} className="mx-auto mb-2 opacity-50"/>
                                <p>Este usuario no ha realizado pedidos.</p>
                            </div>
                        ) : (
                            orders.map(order => (
                                <div key={order.id} className={`p-4 rounded-lg border ${isDark ? 'border-gray-700 bg-gray-700/30' : 'border-gray-200 bg-gray-50'} hover:shadow-md transition-shadow`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-bold flex items-center gap-2 text-purple-600">
                                                <Package size={18}/> Pedido #{order.id}
                                            </p>
                                            <p className={`text-xs ${subText} flex items-center gap-1 mt-1`}>
                                                <Calendar size={12}/> {new Date(order.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                                                order.status === 'PAID' ? 'bg-green-100 text-green-700' : 
                                                order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                                {order.status}
                                            </span>
                                            <p className="font-bold text-lg mt-1">${order.total}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Lista breve de items */}
                                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 text-sm">
                                        <p className={`text-xs uppercase font-bold mb-2 ${subText}`}>Productos:</p>
                                        <ul className="space-y-1">
                                            {order.items && order.items.map(item => (
                                                <li key={item.id} className="flex justify-between">
                                                    <span>{item.quantity}x {item.product_name}</span>
                                                    <span className={subText}>${item.price}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

            </div>
        </div>

      </div>
    </div>
  );
}
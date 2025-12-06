// src/pages/ProfilePage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
    User, Mail, Save, Key, Package, Calendar, ChevronRight, 
    Trash2, AlertTriangle, ShoppingBag 
} from 'lucide-react';
import authService from '../services/authService';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmModal from '../components/ConfirmModal';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import { Helmet } from 'react-helmet-async';
import { formatPrice } from "../utils/format";

export default function ProfilePage() {
  const { user, updateProfileLocal, logout } = useAuthStore();
  const theme = useThemeStore((state) => state.theme);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Modal Eliminar Cuenta
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // --- ESTILOS MEJORADOS ---
  const isDark = theme === 'dark';
  
  const cardBg = isDark 
    ? "bg-gray-800 border-gray-700 text-white shadow-2xl" 
    : "bg-white border-gray-100 text-gray-900 shadow-xl";

  const headerBg = isDark 
    ? "bg-gray-700/50 border-gray-600" 
    : "bg-gray-50 border-gray-200";

  const inputBg = isDark 
    ? "bg-gray-900 border-gray-600 text-white focus:border-purple-500 focus:ring-purple-500" 
    : "bg-white border-gray-300 text-gray-900 focus:border-purple-500 focus:ring-purple-500";
  
  const labelColor = isDark ? "text-gray-300" : "text-gray-700";
  const btnPrimary = "bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30 transition-all transform active:scale-95";
  const dangerZoneBg = isDark ? "bg-red-900/10 border-red-900/30" : "bg-red-50 border-red-100";

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
      });
      setLoading(false);
    } else {
      const fetchProfile = async () => {
        try {
          const data = await authService.getProfile();
          updateProfileLocal(data);
          setProfileData({
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            email: data.email || '',
          });
        } catch (err) {
          toast.error("No se pudo cargar el perfil.");
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    }
  }, [user, updateProfileLocal]);

  useEffect(() => {
    if (activeTab === 'orders' && orders.length === 0) {
        setLoadingOrders(true);
        authService.getMyOrders()
            .then(data => setOrders(data.results || data))
            .catch(() => toast.error("Error al cargar pedidos"))
            .finally(() => setLoadingOrders(false));
    }
  }, [activeTab]);

  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedUser = await authService.updateProfile(profileData);
      updateProfileLocal(updatedUser);
      toast.success('¡Perfil actualizado correctamente!');
    } catch (err) {
      toast.error("Error al actualizar.");
    } finally {
      setSaving(false);
    }
  };

  const toggleOrder = (id) => {
      setExpandedOrderId(expandedOrderId === id ? null : id);
  };

  const handleDeleteAccount = async () => {
      try {
          await authService.deleteAccount(); 
          toast.success("Tu cuenta ha sido eliminada.");
          logout(); 
          navigate('/');
      } catch (err) {
          toast.error("Error al eliminar cuenta.");
          setIsDeleteModalOpen(false);
      }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center"><LoadingSpinner /></div>;
  if (!user) return null;

  return (
    <div className="relative flex flex-col flex-grow w-full items-center justify-start py-12 px-4 overflow-hidden min-h-screen">
        <Helmet>
            <title>Mi Perfil | VetShop</title>
        </Helmet>
      
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 z-0"></div>
      <div className={`absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-black z-0 transition-opacity duration-700 ease-in-out ${isDark ? 'opacity-100' : 'opacity-0'}`}></div>

      <div className="relative z-10 container mx-auto max-w-4xl">
        
        <div className={`rounded-3xl border overflow-hidden transition-colors duration-500 ${cardBg}`}>
            
            {/* HEADER PERFIL */}
            <div className={`p-8 flex flex-col md:flex-row items-center gap-6 border-b transition-colors duration-500 ${headerBg}`}>
                <div className="relative">
                    <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-3xl font-bold uppercase shadow-lg ring-4 ring-white dark:ring-gray-800">
                        {user.username?.charAt(0) || 'U'}
                    </div>
                    {user.is_vip && (
                        <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-sm border-2 border-white dark:border-gray-800">
                            VIP
                        </div>
                    )}
                </div>
                
                <div className="text-center md:text-left flex-1">
                    <h1 className="text-3xl font-bold tracking-tight"> {user.username}</h1>
                    <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>{user.email}</p>
                    
                    <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
                        {user.is_staff && <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-bold border border-blue-200">🛡️ STAFF</span>}
                        {user.is_vip && <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-bold border border-yellow-200">👑 CLIENTE VIP</span>}
                        {!user.is_vip && !user.is_staff && <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-bold border border-gray-200">CLIENTE</span>}
                    </div>
                </div>
            </div>

            {/* CUERPO DE LA TARJETA */}
            <div className="p-8">
                
                {/* Tabs */}
                <div className="flex gap-6 mb-8 border-b border-gray-200 dark:border-gray-700">
                    <button 
                        onClick={() => setActiveTab('profile')} 
                        className={`pb-3 font-medium transition-all relative ${activeTab === 'profile' ? 'text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Mis Datos
                        {activeTab === 'profile' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 rounded-t-full"></span>}
                    </button>
                    <button 
                        onClick={() => setActiveTab('orders')} 
                        className={`pb-3 font-medium transition-all relative ${activeTab === 'orders' ? 'text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Mis Pedidos
                        {activeTab === 'orders' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 rounded-t-full"></span>}
                    </button>
                </div>

                {/* CONTENIDO TAB PERFIL */}
                {activeTab === 'profile' && (
                    <div className="animate-fadeIn">
                        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className={`block text-sm font-semibold mb-2 ${labelColor}`}>Nombre</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <input type="text" name="first_name" value={profileData.first_name} onChange={handleChange} className={`pl-10 block w-full rounded-xl border shadow-sm py-3 transition-colors ${inputBg}`} placeholder="Tu nombre" />
                                    </div>
                                </div>
                                <div>
                                    <label className={`block text-sm font-semibold mb-2 ${labelColor}`}>Apellido</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <input type="text" name="last_name" value={profileData.last_name} onChange={handleChange} className={`pl-10 block w-full rounded-xl border shadow-sm py-3 transition-colors ${inputBg}`} placeholder="Tu apellido" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className={`block text-sm font-semibold mb-2 ${labelColor}`}>Correo Electrónico</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <input type="email" name="email" value={profileData.email} onChange={handleChange} className={`pl-10 block w-full rounded-xl border shadow-sm py-3 transition-colors ${inputBg}`} placeholder="tucorreo@ejemplo.com" />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-6">
                                <button type="submit" className={`flex-1 py-3 px-6 rounded-xl font-bold flex justify-center items-center gap-2 ${btnPrimary}`} disabled={saving}>
                                    {saving ? <LoadingSpinner /> : <><Save size={20} /> Guardar Cambios</>}
                                </button>
                                
                                <Link to="/change-password" className={`flex-1 py-3 px-6 rounded-xl font-bold flex justify-center items-center gap-2 border transition-colors ${isDark ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-50 text-gray-700'}`}>
                                    <Key size={20} /> Cambiar Contraseña
                                </Link>
                            </div>
                        </form>

                        {/* --- ZONA DE PELIGRO (MANTENIDA) --- */}
                        <div className={`mt-12 p-6 rounded-xl border max-w-2xl mx-auto ${dangerZoneBg}`}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-red-100 rounded-full text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                    <AlertTriangle size={24} />
                                </div>
                                <h3 className={`text-lg font-bold ${isDark ? "text-red-300" : "text-red-700"}`}>Eliminar Cuenta</h3>
                            </div>
                            
                            <p className={`text-sm mb-6 ${isDark ? "text-red-200/70" : "text-red-600/80"}`}>
                                Esta acción es permanente. Se eliminarán tus datos personales y tu historial de pedidos. No podrás recuperar tu cuenta.
                            </p>
                            
                            <button 
                                onClick={() => setIsDeleteModalOpen(true)}
                                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm text-sm"
                            >
                                <Trash2 size={18} /> Eliminar mi cuenta permanentemente
                            </button>
                        </div>
                    </div>
                )}

                {/* CONTENIDO TAB PEDIDOS */}
                {activeTab === 'orders' && (
                    <div className="space-y-4 animate-fadeIn">
                        {loadingOrders ? (
                            <div className="flex justify-center py-10"><LoadingSpinner /></div>
                        ) : orders.length === 0 ? (
                            <div className="text-center py-16 text-gray-500">
                                <Package size={48} className="mx-auto mb-4 opacity-30"/>
                                <p className="text-lg font-medium">Aún no tienes pedidos.</p>
                                <Link to="/products" className="text-purple-600 font-bold hover:underline mt-2 inline-block">¡Ir a comprar!</Link>
                            </div>
                        ) : (
                            orders.map((order, index) => { // <--- AÑADIDO INDEX
                                
                                // --- CÁLCULO NÚMERO DE PEDIDO ---
                                // El más reciente (index 0) es el número más alto.
                                const orderNumber = orders.length - index;
                                
                                return (
                                    <div key={order.id} className={`rounded-xl border overflow-hidden transition-all ${isDark ? 'border-gray-700 bg-gray-700/20' : 'border-gray-100 bg-gray-50 hover:bg-white hover:shadow-md'}`}>
                                        
                                        <div 
                                          onClick={() => toggleOrder(order.id)}
                                          className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center cursor-pointer select-none"
                                        >
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="font-bold text-lg text-purple-600 flex items-center gap-2">
                                                        {/* AHORA MUESTRA EL NÚMERO RELATIVO */}
                                                        <ShoppingBag size={18}/> Pedido #{orderNumber}
                                                    </span>
                                                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${order.status === 'PAID' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <div className={`text-sm flex gap-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    <span className="flex items-center gap-1"><Calendar size={14}/> {new Date(order.created_at).toLocaleDateString()}</span>
                                                    <span>{order.items?.length || 0} productos</span>
                                                    {/* (Opcional) Mostrar ID real si el usuario lo necesita */}
                                                    <span className="opacity-50 text-xs mt-0.5">Ref: {order.id}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="text-right flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end mt-4 sm:mt-0">
                                                <p className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-800"}`}>{formatPrice(order.total)}</p>
                                                <div className={`p-1 rounded-full transition-transform duration-300 ${expandedOrderId === order.id ? 'rotate-90 bg-purple-100 text-purple-600' : 'text-gray-400'}`}>
                                                    <ChevronRight size={20} />
                                                </div>
                                            </div>
                                        </div>

                                        {expandedOrderId === order.id && (
                                          <div className={`border-t px-5 py-4 ${isDark ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-white'}`}>
                                              <h4 className="text-xs font-bold uppercase tracking-wider mb-3 opacity-60">Resumen de Productos</h4>
                                              <ul className="space-y-3">
                                                  {order.items && order.items.map((item) => (
                                                      <li key={item.id} className="flex justify-between items-center text-sm">
                                                          <div className="flex items-center gap-3">
                                                              <span className={`font-bold px-2 py-1 rounded text-xs ${isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"}`}>
                                                                  {item.quantity}x
                                                              </span>
                                                              <span className="font-medium">{item.product_name}</span>
                                                          </div>
                                                          <span className="font-mono font-medium opacity-80">{formatPrice(item.price)}</span>
                                                      </li>
                                                  ))}
                                              </ul>
                                          </div>
                                        )}
                                    </div>
                                )
                            })
                        )}
                    </div>
                )}

            </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        message="¿Estás completamente seguro? Tu cuenta y historial de pedidos se perderán para siempre."
      />
    </div>
  );
}
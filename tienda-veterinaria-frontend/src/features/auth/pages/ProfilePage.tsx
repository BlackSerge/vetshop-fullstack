import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
    User, Mail, Save, Key, Package, Calendar, ChevronRight, 
    Trash2, AlertTriangle, ShoppingBag, ChevronDown 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import authService from '../services/authService';
import { LoadingSpinner } from '@/shared';
import { ConfirmModal } from '@/shared';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '@/shared';
import { Helmet } from 'react-helmet-async';
import { formatPrice } from '@/utils/format';

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

  // --- LOGIC ---
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

  // --- STYLES ---
  const isDark = theme === 'dark';

  // Glassmorphism Container
  const glassContainer = isDark 
    ? "bg-gray-900/60 border-gray-700/50 shadow-black/40" 
    : "bg-white/80 border-white/50 shadow-purple-200/50";

  // Input Styles (Matching Login Page)
  const inputContainerClass = isDark 
    ? "bg-gray-800/50 border-gray-600 focus-within:border-purple-400 focus-within:ring-purple-400/30" 
    : "bg-white/60 border-gray-200 focus-within:border-purple-500 focus-within:ring-purple-200";
  const inputTextClass = isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400";
  const labelColor = isDark ? "text-gray-300" : "text-gray-700";

  if (loading) return <div className="min-h-screen flex justify-center items-center"><LoadingSpinner /></div>;
  if (!user) return null;

  return (
    <div className="relative flex flex-col flex-grow w-full items-center justify-start py-8 px-4 md:py-12 overflow-hidden min-h-screen font-sans">
        <Helmet>
            <title>Mi Perfil | VetShop</title>
        </Helmet>
      
      {/* Backgrounds */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 z-0"></div>
      <div className={`absolute inset-0 bg-gradient-to-br from-gray-900 via-indigo-950 to-black z-0 transition-opacity duration-700 ease-in-out ${isDark ? 'opacity-100' : 'opacity-0'}`}></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 container mx-auto max-w-4xl"
      >
        
        <div className={`rounded-3xl border overflow-hidden backdrop-blur-xl ${glassContainer}`}>
            
            {/* HEADER PERFIL */}
            <div className={`p-8 flex flex-col md:flex-row items-center gap-6 border-b transition-colors duration-500 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="relative group">
                    <div className="w-28 h-28 bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-full flex items-center justify-center text-4xl font-bold uppercase shadow-xl ring-4 ring-white/20 dark:ring-black/20 transform transition-transform group-hover:scale-105">
                        {user.username?.charAt(0) || 'U'}
                    </div>
                    {user.is_vip && (
                        <div className="absolute -bottom-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-black px-3 py-1 rounded-full shadow-lg border-2 border-white dark:border-gray-800 animate-bounce">
                            VIP
                        </div>
                    )}
                </div>
                
                <div className="text-center md:text-left flex-1 space-y-2">
                    <h1 className={`text-3xl md:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {user.username}
                    </h1>
                    <p className={`text-base font-medium ${isDark ? "text-indigo-300" : "text-indigo-600"}`}>{user.email}</p>
                    
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-1">
                        {user.is_staff && <span className="text-xs bg-blue-500/20 text-blue-600 dark:text-blue-300 px-3 py-1 rounded-lg font-bold border border-blue-500/30">🛡️ STAFF</span>}
                        {user.is_vip && <span className="text-xs bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 px-3 py-1 rounded-lg font-bold border border-yellow-500/30">👑 CLIENTE VIP</span>}
                        {!user.is_vip && !user.is_staff && <span className="text-xs bg-purple-500/10 text-purple-600 dark:text-purple-300 px-3 py-1 rounded-lg font-bold border border-purple-500/20">CLIENTE</span>}
                    </div>
                </div>
            </div>

            {/* CUERPO DE LA TARJETA */}
            <div className="p-6 md:p-8">
                
                {/* Tabs Modernas */}
                <div className={`flex p-1 rounded-xl mb-8 max-w-md mx-auto md:mx-0 ${isDark ? 'bg-gray-800/50' : 'bg-white border border-gray-200 shadow-sm'}`}>
                    <button 
                        onClick={() => setActiveTab('profile')} 
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                            activeTab === 'profile' 
                            ? isDark ? 'bg-gray-700 text-purple-300 shadow-sm' : 'bg-purple-50 text-purple-700 shadow-none'
                            : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Mis Datos
                    </button>
                    <button 
                        onClick={() => setActiveTab('orders')} 
                        className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                            activeTab === 'orders' 
                            ? isDark ? 'bg-gray-700 text-purple-300 shadow-sm' : 'bg-purple-50 text-purple-700 shadow-none'
                            : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Mis Pedidos
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {/* CONTENIDO TAB PERFIL */}
                    {activeTab === 'profile' && (
                        <motion.div 
                            key="profile"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Nombre */}
                                    <div className={`flex items-center gap-4 px-4 py-3 rounded-2xl border-2 transition-all duration-300 group ${inputContainerClass}`}>
                                        <User className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-400"}`} />
                                        <div className="flex-1">
                                            <label className={`text-xs font-bold uppercase tracking-wide mb-0.5 block ${labelColor}`}>Nombre</label>
                                            <input 
                                                type="text" 
                                                name="first_name" 
                                                value={profileData.first_name} 
                                                onChange={handleChange} 
                                                className={`w-full bg-transparent border-none outline-none text-base font-medium p-0 focus:ring-0 ${inputTextClass}`} 
                                                placeholder="Tu nombre" 
                                            />
                                        </div>
                                    </div>
                                    {/* Apellido */}
                                    <div className={`flex items-center gap-4 px-4 py-3 rounded-2xl border-2 transition-all duration-300 group ${inputContainerClass}`}>
                                        <User className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-400"}`} />
                                        <div className="flex-1">
                                            <label className={`text-xs font-bold uppercase tracking-wide mb-0.5 block ${labelColor}`}>Apellido</label>
                                            <input 
                                                type="text" 
                                                name="last_name" 
                                                value={profileData.last_name} 
                                                onChange={handleChange} 
                                                className={`w-full bg-transparent border-none outline-none text-base font-medium p-0 focus:ring-0 ${inputTextClass}`} 
                                                placeholder="Tu apellido" 
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Email */}
                                <div className={`flex items-center gap-4 px-4 py-3 rounded-2xl border-2 transition-all duration-300 group ${inputContainerClass}`}>
                                    <Mail className={`w-5 h-5 ${isDark ? "text-gray-400" : "text-gray-400"}`} />
                                    <div className="flex-1">
                                        <label className={`text-xs font-bold uppercase tracking-wide mb-0.5 block ${labelColor}`}>Email</label>
                                        <input 
                                            type="email" 
                                            name="email" 
                                            value={profileData.email} 
                                            onChange={handleChange} 
                                            className={`w-full bg-transparent border-none outline-none text-base font-medium p-0 focus:ring-0 ${inputTextClass}`} 
                                            placeholder="tucorreo@ejemplo.com" 
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                    <button 
                                        type="submit" 
                                        className="flex-1 py-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg shadow-lg shadow-purple-500/30 transition-all transform active:scale-95 flex justify-center items-center gap-2" 
                                        disabled={saving}
                                    >
                                        {saving ? <LoadingSpinner /> : <><Save size={20} /> Guardar Cambios</>}
                                    </button>
                                    
                                    <Link 
                                        to="/change-password" 
                                        className={`flex-1 py-4 rounded-xl font-bold flex justify-center items-center gap-2 border transition-all active:scale-95 ${isDark ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700 shadow-sm'}`}
                                    >
                                        <Key size={20} /> Cambiar Contraseña
                                    </Link>
                                </div>
                            </form>

                            {/* --- ZONA DE PELIGRO --- */}
                            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                                <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${isDark ? "text-red-400" : "text-red-600"}`}>
                                    <AlertTriangle size={16} /> Zona de Peligro
                                </h3>
                                <div className={`p-6 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 ${isDark ? "bg-red-900/10 border-red-900/30" : "bg-red-50 border-red-100"}`}>
                                    <p className={`text-sm text-center md:text-left ${isDark ? "text-red-200/80" : "text-red-800/80"}`}>
                                        Esta acción eliminará permanentemente tu cuenta y pedidos.
                                    </p>
                                    <button 
                                        onClick={() => setIsDeleteModalOpen(true)}
                                        className="whitespace-nowrap px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20 active:scale-95 text-sm flex items-center gap-2"
                                    >
                                        <Trash2 size={18} /> Eliminar Cuenta
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* CONTENIDO TAB PEDIDOS */}
                    {activeTab === 'orders' && (
                        <motion.div 
                            key="orders"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                        >
                            {loadingOrders ? (
                                <div className="flex justify-center py-10"><LoadingSpinner /></div>
                            ) : orders.length === 0 ? (
                                <div className="text-center py-16 opacity-60">
                                    <Package size={64} className="mx-auto mb-4 text-purple-400"/>
                                    <p className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>Aún no tienes pedidos</p>
                                    <p className="text-sm mt-1 mb-6">¡Explora nuestra tienda y mima a tu mascota!</p>
                                    <Link to="/products" className="text-purple-500 font-bold hover:underline">Ir a comprar →</Link>
                                </div>
                            ) : (
                                orders.map((order, index) => {
                                    const orderNumber = orders.length - index;
                                    const isExpanded = expandedOrderId === order.id;
                                    
                                    return (
                                        <motion.div 
                                            key={order.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={`rounded-2xl border overflow-hidden transition-all ${isDark ? 'border-gray-700 bg-gray-800/40' : 'border-gray-200 bg-white shadow-sm hover:shadow-md'}`}
                                        >
                                            
                                            <div 
                                              onClick={() => toggleOrder(order.id)}
                                              className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center cursor-pointer select-none group"
                                            >
                                                <div className="flex-1 w-full sm:w-auto">
                                                    <div className="flex items-center justify-between sm:justify-start gap-3 mb-2">
                                                        <span className="font-black text-lg text-purple-600 dark:text-purple-400 flex items-center gap-2">
                                                            <ShoppingBag size={20}/> #{orderNumber}
                                                        </span>
                                                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold border uppercase tracking-wider ${order.status === 'PAID' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'}`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                    <div className={`text-sm flex gap-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        <span className="flex items-center gap-1.5"><Calendar size={14}/> {new Date(order.created_at).toLocaleDateString()}</span>
                                                        <span>•</span>
                                                        <span>{order.items?.length || 0} items</span>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center justify-between w-full sm:w-auto mt-4 sm:mt-0 gap-6">
                                                    <p className={`text-xl font-black ${isDark ? "text-white" : "text-gray-800"}`}>{formatPrice(order.total)}</p>
                                                    <div className={`p-2 rounded-full transition-all duration-300 border ${isExpanded ? 'bg-purple-600 text-white border-purple-600 rotate-180' : isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-white border-gray-200 text-gray-600 shadow-sm'}`}>
                                                        <ChevronDown size={20} />
                                                    </div>
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                                {isExpanded && (
                                                  <motion.div 
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className={`border-t px-6 py-5 ${isDark ? 'border-gray-700 bg-gray-900/30' : 'border-gray-100 bg-gray-50/50'}`}
                                                  >
                                                      <h4 className="text-xs font-bold uppercase tracking-widest mb-4 opacity-50">Detalle del Pedido</h4>
                                                      <ul className="space-y-4">
                                                          {order.items && order.items.map((item) => (
                                                              <li key={item.id} className="flex justify-between items-center text-sm">
                                                                  <div className="flex items-center gap-4">
                                                                      <span className={`font-bold px-2.5 py-1 rounded-lg text-xs ${isDark ? "bg-gray-700 text-gray-200" : "bg-white border text-gray-700"}`}>
                                                                          {item.quantity}x
                                                                      </span>
                                                                      <span className="font-medium text-base">{item.product_name}</span>
                                                                  </div>
                                                                  <span className="font-mono font-medium opacity-80">{formatPrice(item.price)}</span>
                                                              </li>
                                                          ))}
                                                      </ul>
                                                      <div className="mt-6 pt-4 border-t border-dashed border-gray-300 dark:border-gray-700 flex justify-between items-center">
                                                          <span className="text-sm font-medium opacity-60">Total Pagado</span>
                                                          <span className="text-lg font-black text-purple-600 dark:text-purple-400">{formatPrice(order.total)}</span>
                                                      </div>
                                                  </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    )
                                })
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
      </motion.div>

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        message="¿Estás completamente seguro? Tu cuenta y historial de pedidos se perderán para siempre."
      />
    </div>
  );
}

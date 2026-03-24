// src/pages/admin/AdminUserListPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Edit, Trash2, UserCheck, UserX, Shield, ShieldOff, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import AdminTable from '../../components/admin/AdminTable';
import ConfirmModal from '../../components/ConfirmModal';
import { useThemeStore } from '../../store/useThemeStore';

export default function AdminUserListPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 10;

  // Modals state
  const [modalConfig, setModalConfig] = useState({ 
    isOpen: false, 
    type: null, // 'delete', 'vip', 'staff', 'status'
    user: null 
  });

  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';
  

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, page_size: PAGE_SIZE, search: searchQuery };
      const data = await adminService.getUsers(params);
      
      if (data.results) {
          setUsers(data.results);
          setTotalPages(Math.ceil(data.count / PAGE_SIZE));
      } else if (Array.isArray(data)) {
          setUsers(data);
      } else {
          setUsers([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar usuarios.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // --- ACTIONS ---
  const handleAction = async () => {
      const { type, user } = modalConfig;
      if (!user) return;

      try {
          if (type === 'delete') {
              await adminService.deleteUser(user.id);
              toast.success("Usuario eliminado.");
          } else if (type === 'vip') {
              await adminService.updateUser(user.id, { is_vip: !user.is_vip });
              toast.success(`VIP ${user.is_vip ? 'quitado' : 'otorgado'}.`);
          } else if (type === 'staff') {
              await adminService.updateUser(user.id, { is_staff: !user.is_staff });
              toast.success("Permisos de Staff actualizados.");
          } else if (type === 'status') {
              await adminService.updateUser(user.id, { is_active: !user.is_active });
              toast.success(`Usuario ${user.is_active ? 'bloqueado' : 'activado'}.`);
          }
          fetchUsers();
      } catch {
          toast.error("Error al procesar la acción.");
      } finally {
          setModalConfig({ isOpen: false, type: null, user: null });
      }
  };

  const openModal = (type, user) => {
      setModalConfig({ isOpen: true, type, user });
  };

  // --- TABLE CONFIG ---
  const headers = [
      { field: 'id', label: 'ID' },
      { field: 'username', label: 'Usuario' },
      { field: 'email', label: 'Email' },
      { field: 'role_display', label: 'Rol' },
      { field: 'status_display', label: 'Estado' },
      { field: 'date_joined', label: 'Registro' },
  ];

  const tableData = users.map(u => ({
      ...u,
      username_text: u.username || u.email, 
      username: (
        <Link 
            to={`/admin-panel/usuarios/${u.id}`} 
            className="text-purple-600 hover:text-purple-800 hover:underline font-medium cursor-pointer transition-colors"
        >
            {u.username || u.email}
        </Link>
      ),
      role_display: (
        <div className="flex flex-col gap-1">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase text-center w-fit ${u.is_staff ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-gray-100 text-gray-600'}`}>
                {u.is_staff ? '🛡️ Staff' : '👤 Cliente'}
            </span>
            {u.is_vip && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full border border-yellow-200 w-fit font-black uppercase">👑 VIP</span>}
        </div>
      ),
      status_display: u.is_active 
        ? <span className="text-green-600 font-bold text-xs uppercase tracking-wider">Activo</span> 
        : <span className="text-red-500 font-bold text-xs uppercase tracking-wider">Bloqueado</span>,
      date_joined: new Date(u.date_joined).toLocaleDateString()
  }));

  const renderActions = (user) => (
      <div className="flex gap-2 justify-end">
          {/* VIP BUTTON */}
          <button 
            onClick={() => openModal('vip', user)} 
            className={`p-2 rounded-xl transition-all border ${user.is_vip 
               ? 'bg-yellow-500 text-white border-yellow-500 shadow-md hover:bg-yellow-600 hover:border-yellow-600 hover:scale-110' 
               : (isDark 
                    ? 'bg-gray-800 border-gray-700 text-gray-500 hover:bg-yellow-500/10 hover:text-yellow-500 hover:border-yellow-500/30' 
                    : 'bg-white border-gray-100 text-gray-400 hover:bg-yellow-50 hover:text-yellow-500 hover:border-yellow-200 shadow-sm'
                 )} active:scale-95`} 
            title="Cambiar VIP"
          >
              <Crown size={18} />
          </button>
          
          {/* STAFF BUTTON */}
          <button 
            onClick={() => openModal('staff', user)} 
            className={`p-2 rounded-xl transition-all border ${user.is_staff 
              ? 'bg-purple-600 text-white border-purple-600 shadow-md hover:bg-purple-700 hover:border-purple-700 hover:scale-110' 
              : (isDark 
                   ? 'bg-gray-800 border-gray-700 text-gray-500 hover:bg-purple-600/10 hover:text-purple-600 hover:border-purple-600/30' 
                   : 'bg-white border-gray-100 text-gray-400 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 shadow-sm'
                )} active:scale-95`} 
            title="Cambiar Staff"
          >
              {user.is_staff ? <Shield size={18} /> : <ShieldOff size={18} />}
          </button>
          
          {/* STATUS BUTTON */}
          <button 
            onClick={() => openModal('status', user)} 
            className={`p-2 rounded-xl transition-all border ${user.is_active 
              ? 'bg-green-500 text-white border-green-500 hover:bg-red-500 hover:border-red-500 shadow-md hover:scale-110' 
              : 'bg-red-500 text-white border-red-500 hover:bg-green-500 hover:border-green-500 shadow-md hover:scale-110'
            } active:scale-95`} 
            title={user.is_active ? "Bloquear" : "Activar"}
          >
              {user.is_active ? <UserCheck size={18} /> : <UserX size={18} />}
          </button>
          
          {/* DELETE BUTTON */}
          <button 
            onClick={() => openModal('delete', user)} 
            className={`p-2 rounded-xl transition-all border ${isDark 
              ? 'bg-gray-800 border-gray-700 text-gray-500 hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/40' 
              : 'bg-white border-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 shadow-sm'
            } active:scale-95 hover:scale-110`} 
            title="Eliminar"
          >
              <Trash2 size={18} />
          </button>
      </div>
  );

  const getModalMessage = () => {
    const { type, user } = modalConfig;
    if (!user) return "";
    const name = user.username_text || user.email; // <--- RAW TEXT, avoid JSX [object Object]
    
    switch(type) {
        case 'delete': return `¿Estás seguro de que quieres eliminar al usuario "${name}"? Esta acción es irreversible.`;
        case 'vip': return `¿${user.is_vip ? 'Quitar' : 'Otorgar'} estatus VIP a "${name}"?`;
        case 'staff': return `¿${user.is_staff ? 'Quitar' : 'Otorgar'} permisos de Staff a "${name}"?`;
        case 'status': return `¿Deseas ${user.is_active ? 'bloquear' : 'activar'} el acceso a "${name}"?`;
        default: return "";
    }
  };

  return (
    <div className="w-full space-y-8 animate-fadeIn pb-24 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className={`text-3xl sm:text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>Usuarios</h1>
            <p className={`text-sm sm:text-base mt-2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Control de accesos y perfiles de clientes</p>
          </div>
      </div>
      
      <div className="mb-8 w-full max-w-lg">
          <div className={`p-2 rounded-3xl border flex items-center gap-3 shadow-sm ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100'}`}>
              <div className={`flex-1 flex items-center gap-3 p-2 rounded-2xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-50 shadow-inner'}`}>
                  <Edit size={18} className="text-gray-400 flex-shrink-0" />
                  <input 
                    type="text" 
                    placeholder="Buscar por nombre, email, apodo..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent w-full text-sm font-bold outline-none text-gray-900 dark:text-white placeholder-gray-400/60"
                  />
              </div>
          </div>
      </div>

      <div className={`rounded-3xl border overflow-hidden ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200 shadow-xl shadow-purple-100/20'}`}>
        <AdminTable 
            headers={headers} 
            data={tableData} 
            renderRowActions={renderActions} 
            isLoading={loading} 
        />
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-10 gap-2 items-center">
            <button 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => p - 1)} 
                className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center transition-all ${currentPage === 1 ? 'opacity-30' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 border border-gray-200 dark:border-gray-700'}`}
            >
                ←
            </button>
            <span className="px-6 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-black uppercase text-gray-500 tracking-widest">
                Pág {currentPage} / {totalPages}
            </span>
            <button 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(p => p + 1)} 
                className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center transition-all ${currentPage === totalPages ? 'opacity-30' : 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'}`}
            >
                →
            </button>
        </div>
      )}

      <ConfirmModal 
        isOpen={modalConfig.isOpen} 
        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} 
        onConfirm={handleAction} 
        message={getModalMessage()} 
        title={modalConfig.type === 'delete' ? "Eliminar Cuenta" : "Gestión de Estado"}
      />
    </div>
  );
}
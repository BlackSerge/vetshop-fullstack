// src/pages/admin/AdminUserListPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Edit, Trash2, UserCheck, UserX, Shield, ShieldOff, Crown } from 'lucide-react';
import { Link } from 'react-router-dom'; // <--- IMPORTAR LINK
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const theme = useThemeStore((state) => state.theme);
  const isDark = theme === 'dark';
  
  const inputClass = isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300';

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

  // --- ACCIONES DE NEGOCIO ---
  const toggleStatus = async (user) => {
      try {
          await adminService.updateUser(user.id, { is_active: !user.is_active });
          toast.success(`Usuario ${user.is_active ? 'bloqueado' : 'activado'}.`);
          fetchUsers();
      } catch (err) { toast.error("Error al cambiar estado."); }
  };

  const toggleStaff = async (user) => {
      if (window.confirm(`¿Cambiar permisos de Staff para ${user.username}?`)) {
        try {
            await adminService.updateUser(user.id, { is_staff: !user.is_staff });
            toast.success(`Permisos actualizados.`);
            fetchUsers();
        } catch (err) { toast.error("Error al cambiar permisos."); }
      }
  };

  const toggleVip = async (user) => {
      const action = user.is_vip ? "Quitar" : "Otorgar";
      if (window.confirm(`¿${action} estatus VIP a ${user.username}?`)) {
        try {
            await adminService.updateUser(user.id, { is_vip: !user.is_vip });
            toast.success(`Usuario ${user.is_vip ? 'ya no es VIP' : 'ahora es VIP 👑'}.`);
            fetchUsers();
        } catch (err) { toast.error("Error al cambiar VIP."); }
      }
  };

  const handleDeleteClick = (user) => {
      setUserToDelete(user);
      setIsModalOpen(true);
  };

  const confirmDelete = async () => {
      if (!userToDelete) return;
      try {
          await adminService.deleteUser(userToDelete.id);
          toast.success("Usuario eliminado.");
          fetchUsers();
      } catch (err) { toast.error("Error al eliminar."); }
      finally { setIsModalOpen(false); }
  };

  // --- CONFIGURACIÓN TABLA ---
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
      // 👇 AQUÍ ESTÁ EL CAMBIO: Username ahora es un Link cliqueable
      username: (
        <Link 
            to={`/admin-panel/usuarios/${u.id}`} 
            className="text-purple-600 hover:text-purple-800 hover:underline font-bold cursor-pointer transition-colors"
        >
            {u.username}
        </Link>
      ),
      role_display: (
        <div className="flex flex-col gap-1">
            <span className="font-medium">{u.is_staff ? '🛡️ Staff' : '👤 Cliente'}</span>
            {u.is_vip && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full border border-yellow-200 w-fit">👑 VIP</span>}
        </div>
      ),
      status_display: u.is_active 
        ? <span className="text-green-600 font-semibold">Activo</span> 
        : <span className="text-red-500 font-semibold">Bloqueado</span>,
      date_joined: new Date(u.date_joined).toLocaleDateString()
  }));

  const renderActions = (user) => (
      <div className="flex gap-2 justify-end">
          <button onClick={() => toggleVip(user)} className={`p-2 rounded transition-colors ${user.is_vip ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' : 'bg-gray-100 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50'}`} title="Cambiar VIP">
              <Crown size={18} />
          </button>
          <button onClick={() => toggleStaff(user)} className={`p-2 rounded transition-colors ${user.is_staff ? 'bg-purple-100 text-purple-600 hover:bg-purple-200' : 'bg-gray-100 text-gray-400 hover:text-purple-500 hover:bg-purple-50'}`} title="Cambiar Staff">
              {user.is_staff ? <Shield size={18} /> : <ShieldOff size={18} />}
          </button>
          <button onClick={() => toggleStatus(user)} className={`p-2 rounded transition-colors ${user.is_active ? 'bg-green-100 text-green-600 hover:bg-red-100 hover:text-red-600' : 'bg-red-100 text-red-600 hover:bg-green-100 hover:text-green-600'}`} title={user.is_active ? "Bloquear" : "Activar"}>
              {user.is_active ? <UserCheck size={18} /> : <UserX size={18} />}
          </button>
          <button onClick={() => handleDeleteClick(user)} className="p-2 rounded bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600 transition-colors" title="Eliminar">
              <Trash2 size={18} />
          </button>
      </div>
  );

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Gestión de Usuarios</h1>
      
      <div className="mb-6">
          <input 
            type="text" 
            placeholder="Buscar por nombre o email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`p-2 rounded border ${inputClass} w-full max-w-md focus:ring-2 focus:ring-purple-500 outline-none transition-all`}
          />
      </div>

      <AdminTable 
        headers={headers} 
        data={tableData} 
        renderRowActions={renderActions} 
        isLoading={loading} 
      />

      {totalPages > 1 && (
        <div className="flex justify-center mt-6 gap-4 items-center">
            <button disabled={currentPage===1} onClick={() => setCurrentPage(p=>p-1)} className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition">Anterior</button>
            <span className="font-medium text-gray-600 dark:text-gray-300">Página {currentPage} de {totalPages}</span>
            <button disabled={currentPage===totalPages} onClick={() => setCurrentPage(p=>p+1)} className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300 transition">Siguiente</button>
        </div>
      )}

      <ConfirmModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onConfirm={confirmDelete} 
        message={`¿Estás seguro de que quieres eliminar al usuario "${userToDelete?.username}"? Esta acción es irreversible.`} 
      />
    </div>
  );
}
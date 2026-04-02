import { Navigate, Outlet, useLocation } from 'react-router-dom';
import LoadingSpinner from '@/shared';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '@/shared';

const PrivateRoute = ({ requireStaff = false }) => {
const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
const isStaff = useAuthStore((state) => state.isStaff);
const isLoading = useAuthStore((state) => state.isLoading);

 const theme = useThemeStore((state) => state.theme);
const isDark = theme === "dark";
const bgPageLoading = isDark ? "bg-gray-900 text-white" : "bg-white text-gray-900";

const location = useLocation();

 
  if (isLoading) {
    return (
      <div className={`min-h-screen flex justify-center items-center ${bgPageLoading}`}>
        <LoadingSpinner />
      </div>
    );
  }


  if (!isAuthenticated) {
    
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireStaff && !isStaff) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;

import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const GeneralAdminRoute = ({ children }) => {
  const { admin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (admin?.role !== 'general') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default GeneralAdminRoute;

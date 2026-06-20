import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
import ProtectedRoute from './components/ProtectedRoute';
import GeneralAdminRoute from './components/GeneralAdminRoute';
import Login from './components/Login';
import DashboardLayout from './components/Dashboard/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Admins from './pages/Admins';
import Omborlar from './pages/Omborlar';
import Omborchilar from './pages/Omborchilar';
import Maxsulotlar from './pages/Maxsulotlar';
import Statistika from './pages/Statistika';
import Arizalar from './pages/Arizalar';

function App() {
  return (
    <SnackbarProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <DashboardLayout />
                  </SidebarProvider>
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route
                path="admins"
                element={
                  <GeneralAdminRoute>
                    <Admins />
                  </GeneralAdminRoute>
                }
              />
              <Route
                path="omborlar"
                element={
                  <GeneralAdminRoute>
                    <Omborlar />
                  </GeneralAdminRoute>
                }
              />
              <Route
                path="omborchilar"
                element={
                  <GeneralAdminRoute>
                    <Omborchilar />
                  </GeneralAdminRoute>
                }
              />
              <Route path="maxsulotlar" element={<Maxsulotlar />} />
              <Route path="statistika" element={<Statistika />} />
              <Route path="arizalar" element={<Arizalar />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </SnackbarProvider>
  );
}

export default App;

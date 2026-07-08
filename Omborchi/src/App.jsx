import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { OmborProvider } from './contexts/OmborContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import DashboardLayout from './components/Dashboard/DashboardLayout';
import Kirimlar from './pages/Kirimlar';
import Chiqimlar from './pages/Chiqimlar';
import KelayotganKirimlar from './pages/KelayotganKirimlar';
import Statistika from './pages/Statistika';

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
                  <OmborProvider>
                    <SidebarProvider>
                      <DashboardLayout />
                    </SidebarProvider>
                  </OmborProvider>
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="kirimlar" replace />} />
              <Route path="kirimlar" element={<Kirimlar />} />
              <Route path="kelayotgan-kirimlar" element={<KelayotganKirimlar />} />
              <Route path="chiqimlar" element={<Chiqimlar />} />
              <Route path="statistika" element={<Statistika />} />
              <Route path="*" element={<Navigate to="kirimlar" replace />} />
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

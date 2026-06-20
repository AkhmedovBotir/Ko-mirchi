import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SidebarProvider } from './contexts/SidebarContext';
import { SnackbarProvider } from './contexts/SnackbarContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/Login';
import DashboardLayout from './components/Dashboard/DashboardLayout';
import Kirimlar from './pages/Kirimlar';
import Chiqimlar from './pages/Chiqimlar';
import KelayotganKirimlar from './pages/KelayotganKirimlar';
import Statistika from './pages/Statistika';
import Omborlarim from './pages/Omborlarim';
import BoshSahifa from './pages/BoshSahifa';

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
              <Route index element={<BoshSahifa />} />
              <Route path="kirimlar" element={<Kirimlar />} />
              <Route path="kelayotgan-kirimlar" element={<KelayotganKirimlar />} />
              <Route path="chiqimlar" element={<Chiqimlar />} />
              <Route path="statistika" element={<Statistika />} />
              <Route path="omborlarim" element={<Omborlarim />} />
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

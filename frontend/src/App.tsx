import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import ProviderLayout from './layouts/ProviderLayout';
import AdminLayout from './layouts/AdminLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import GoogleCallbackPage from './pages/auth/GoogleCallbackPage';
import ProviderDashboard from './pages/provider/ProviderDashboard';
import ProviderProfilePage from './pages/provider/ProviderProfilePage';
import ProviderDocumentsPage from './pages/provider/ProviderDocumentsPage';
import ProviderApplicationPage from './pages/provider/ProviderApplicationPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProvidersPage from './pages/admin/AdminProvidersPage';
import AdminProviderDetailPage from './pages/admin/AdminProviderDetailPage';
import NotFoundPage, { ForbiddenPage } from './pages/ErrorPages';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/403" element={<ForbiddenPage />} />

              <Route element={<ProtectedRoute allowedRoles={['provider']} />}>
                <Route element={<ProviderLayout />}>
                  <Route path="/provider/dashboard" element={<ProviderDashboard />} />
                  <Route path="/provider/profile" element={<ProviderProfilePage />} />
                  <Route path="/provider/documents" element={<ProviderDocumentsPage />} />
                  <Route path="/provider/application" element={<ProviderApplicationPage />} />
                </Route>
              </Route>

              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/providers" element={<AdminProvidersPage />} />
                  <Route path="/admin/providers/:id" element={<AdminProviderDetailPage />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

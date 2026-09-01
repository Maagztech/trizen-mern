import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authApi } from '../../api/auth.api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'sonner';

export default function GoogleCallbackPage() {
  const [params] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    const redirect = params.get('redirect') || '/provider/dashboard';

    if (!token) {
      toast.error('Google authentication failed');
      navigate('/login');
      return;
    }

    localStorage.setItem('token', token);

    authApi.me()
      .then((res) => {
        if (res.data.data) {
          login(token, res.data.data);
          navigate(redirect);
        }
      })
      .catch(() => {
        toast.error('Failed to complete Google login');
        navigate('/login');
      });
  }, [params, login, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-500">Completing Google sign in...</p>
      </div>
    </div>
  );
}

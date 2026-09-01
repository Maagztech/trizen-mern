import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-8xl font-bold text-primary-600">404</p>
      <h1 className="mt-4 text-2xl font-bold">Page Not Found</h1>
      <p className="mt-2 text-gray-500">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link to="/" className="btn-primary mt-6 inline-flex items-center gap-2">
        <Home className="h-4 w-4" /> Go Home
      </Link>
    </div>
  );
}

export function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-8xl font-bold text-red-600">403</p>
      <h1 className="mt-4 text-2xl font-bold">Access Denied</h1>
      <p className="mt-2 text-gray-500">You don&apos;t have permission to access this page.</p>
      <Link to="/" className="btn-primary mt-6">Go Home</Link>
    </div>
  );
}

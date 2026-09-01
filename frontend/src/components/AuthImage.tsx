import { useEffect, useState, ReactNode } from 'react';
import api from '../api/axios';
import LoadingSpinner from './LoadingSpinner';
import { cn } from '../utils/helpers';
import { getProfilePhotoFilename } from '../utils/media';

interface AuthImageProps {
  /** Stored profilePhoto path from API, or a local blob: preview URL */
  profilePhoto?: string;
  localPreview?: string | null;
  alt: string;
  className?: string;
  fallback?: ReactNode;
}

/**
 * Loads protected profile photos via axios (JWT header).
 * Plain <img src="api/..."> cannot authenticate.
 */
export default function AuthImage({ profilePhoto, localPreview, alt, className, fallback }: AuthImageProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function load() {
      if (localPreview) {
        setBlobUrl(localPreview);
        setError(false);
        setLoading(false);
        return;
      }

      const filename = getProfilePhotoFilename(profilePhoto);
      if (!filename) {
        setBlobUrl(null);
        setError(false);
        return;
      }

      setLoading(true);
      setError(false);

      try {
        const response = await api.get(`/uploads/profile/${filename}`, { responseType: 'blob' });
        if (cancelled) return;
        objectUrl = URL.createObjectURL(response.data);
        setBlobUrl(objectUrl);
      } catch {
        if (!cancelled) {
          setError(true);
          setBlobUrl(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [profilePhoto, localPreview]);

  if (localPreview || blobUrl) {
    if (loading && !localPreview) {
      return (
        <div className={cn('flex items-center justify-center bg-gray-100 dark:bg-gray-800', className)}>
          <LoadingSpinner size="sm" />
        </div>
      );
    }
    return <img src={localPreview || blobUrl!} alt={alt} className={className} />;
  }

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center bg-gray-100 dark:bg-gray-800', className)}>
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (error || !profilePhoto) return <>{fallback ?? null}</>;

  return <>{fallback ?? null}</>;
}

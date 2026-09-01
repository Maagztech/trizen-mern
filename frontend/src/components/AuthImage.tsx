import { ReactNode } from 'react';

interface AuthImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallback?: ReactNode;
}

/**
 * Profile/document URLs include ?token= for JWT auth (img tags cannot send Authorization headers).
 */
export default function AuthImage({ src, alt, className, fallback }: AuthImageProps) {
  if (!src) return <>{fallback ?? null}</>;
  return <img src={src} alt={alt} className={className} />;
}

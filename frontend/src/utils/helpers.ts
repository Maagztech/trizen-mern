import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date?: string) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date?: string) {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getStatusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    under_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  };
  return colors[status] || colors.draft;
}

function getAuthToken(): string | null {
  return localStorage.getItem('token');
}

function getApiBase(): string {
  return (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
}

export function getProfilePhotoUrl(profilePhoto?: string): string | undefined {
  if (!profilePhoto) return undefined;
  const filename = profilePhoto.split(/[/\\]/).pop();
  if (!filename) return undefined;

  const params = new URLSearchParams();
  const token = getAuthToken();
  if (token) params.set('token', token);

  const qs = params.toString();
  return `${getApiBase()}/uploads/profile/${filename}${qs ? `?${qs}` : ''}`;
}

export function getDocumentUrl(documentId: string, profileId?: string, download = false): string {
  const params = new URLSearchParams();
  if (profileId) params.set('profileId', profileId);
  if (download) params.set('download', 'true');
  const token = getAuthToken();
  if (token) params.set('token', token);
  const qs = params.toString();
  return `${getApiBase()}/uploads/document/${documentId}${qs ? `?${qs}` : ''}`;
}

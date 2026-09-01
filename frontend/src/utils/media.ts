import api from '../api/axios';

function buildUploadPath(
  type: 'profile' | 'document',
  id: string,
  options?: { profileId?: string; download?: boolean }
): string {
  const params = new URLSearchParams();
  if (options?.profileId) params.set('profileId', options.profileId);
  if (options?.download) params.set('download', 'true');
  const qs = params.toString();
  return `/uploads/${type}/${id}${qs ? `?${qs}` : ''}`;
}

/** Fetch a protected upload as a Blob (JWT sent via axios interceptor). */
export async function fetchProtectedFile(
  type: 'profile' | 'document',
  id: string,
  options?: { profileId?: string; download?: boolean }
): Promise<Blob> {
  const path = buildUploadPath(type, id, options);
  const response = await api.get(path, { responseType: 'blob' });
  return response.data;
}

/** Open a protected document in a new browser tab. */
export async function viewDocument(documentId: string, profileId?: string): Promise<void> {
  const blob = await fetchProtectedFile('document', documentId, { profileId });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
  setTimeout(() => URL.revokeObjectURL(url), 120_000);
}

/** Download a protected document. */
export async function downloadDocument(
  documentId: string,
  filename: string,
  profileId?: string
): Promise<void> {
  const blob = await fetchProtectedFile('document', documentId, { profileId, download: true });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Resolve profile photo filename from stored path. */
export function getProfilePhotoFilename(profilePhoto?: string): string | undefined {
  if (!profilePhoto) return undefined;
  return profilePhoto.split(/[/\\]/).pop() || undefined;
}

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload, Trash2, FileText, Camera, Image } from 'lucide-react';
import { providerApi } from '../../api/provider.api';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import AuthImage from '../../components/AuthImage';
import { formatDate, getProfilePhotoUrl, getDocumentUrl } from '../../utils/helpers';
import { ProviderProfile } from '../../types';

const docTypes = [
  { value: 'id_proof', label: 'ID Proof' },
  { value: 'address_proof', label: 'Address Proof' },
  { value: 'certificate', label: 'Certificate / Experience Proof' },
  { value: 'other', label: 'Other' },
];

export default function ProviderDocumentsPage() {
  const queryClient = useQueryClient();
  const photoRef = useRef<HTMLInputElement>(null);
  const docRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState('id_proof');
  const [photoProgress, setPhotoProgress] = useState(0);
  const [docProgress, setDocProgress] = useState(0);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['provider-profile'],
    queryFn: async () => {
      const res = await providerApi.getProfile();
      return res.data.data!;
    },
  });

  const profile = data?.profile as ProviderProfile | undefined;
  const canEdit = ['draft', 'rejected'].includes(profile?.applicationStatus ?? 'draft');
  const photoUrl = getProfilePhotoUrl(profile?.profilePhoto);

  const uploadPhoto = useMutation({
    mutationFn: (file: File) => providerApi.uploadPhoto(file, setPhotoProgress),
    onSuccess: () => {
      toast.success('Photo uploaded');
      setPhotoProgress(0);
      setLocalPreview(null);
      queryClient.invalidateQueries({ queryKey: ['provider-profile'] });
    },
    onError: () => { toast.error('Upload failed'); setPhotoProgress(0); },
  });

  const handlePhotoSelect = (file: File) => {
    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);
    uploadPhoto.mutate(file);
  };

  const uploadDoc = useMutation({
    mutationFn: (file: File) => providerApi.uploadDocument(file, docType, setDocProgress),
    onSuccess: () => {
      toast.success('Document uploaded');
      setDocProgress(0);
      queryClient.invalidateQueries({ queryKey: ['provider-profile'] });
    },
    onError: () => { toast.error('Upload failed'); setDocProgress(0); },
  });

  const deleteDoc = useMutation({
    mutationFn: (id: string) => providerApi.deleteDocument(id),
    onSuccess: () => {
      toast.success('Document deleted');
      queryClient.invalidateQueries({ queryKey: ['provider-profile'] });
    },
  });

  if (isLoading) return <LoadingSpinner className="mx-auto mt-20" size="lg" />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Documents</h1>
        <p className="text-gray-500">Upload your profile photo and verification documents</p>
      </div>

      <div className="card">
        <h2 className="mb-4 text-lg font-semibold">Profile Photo</h2>
        <div className="flex items-center gap-6">
          <AuthImage
            src={localPreview || photoUrl}
            alt="Profile"
            className="h-24 w-24 rounded-xl object-cover"
            fallback={
              <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
                <Camera className="h-8 w-8 text-gray-400" />
              </div>
            }
          />
          {canEdit && (
            <div>
              <input
                ref={photoRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handlePhotoSelect(e.target.files[0])}
              />
              <button onClick={() => photoRef.current?.click()} disabled={uploadPhoto.isPending} className="btn-primary">
                <Upload className="mr-2 h-4 w-4" />
                {uploadPhoto.isPending ? 'Uploading...' : 'Upload Photo'}
              </button>
              <p className="mt-1 text-xs text-gray-500">JPG, PNG, WEBP. Max 5MB</p>
              {photoProgress > 0 && (
                <div className="mt-2 h-2 w-48 overflow-hidden rounded-full bg-gray-200">
                  <div className="h-full bg-primary-600 transition-all" style={{ width: `${photoProgress}%` }} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 text-lg font-semibold">Verification Documents</h2>
        {canEdit && (
          <div className="mb-6 flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Document Type</label>
              <select value={docType} onChange={(e) => setDocType(e.target.value)} className="input-field">
                {docTypes.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <input
              ref={docRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && uploadDoc.mutate(e.target.files[0])}
            />
            <button onClick={() => docRef.current?.click()} disabled={uploadDoc.isPending} className="btn-primary">
              <Upload className="mr-2 h-4 w-4" />
              {uploadDoc.isPending ? 'Uploading...' : 'Upload Document'}
            </button>
            {docProgress > 0 && (
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div className="h-full bg-primary-600 transition-all" style={{ width: `${docProgress}%` }} />
              </div>
            )}
          </div>
        )}

        {profile?.verificationDocuments?.length ? (
          <div className="space-y-3">
            {profile.verificationDocuments.map((doc) => (
              <div key={doc._id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-primary-600" />
                  <div>
                    <p className="font-medium">{doc.fileName}</p>
                    <p className="text-xs text-gray-500 capitalize">{doc.documentType.replace('_', ' ')} · {formatDate(doc.uploadedAt)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href={getDocumentUrl(doc._id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-xs"
                  >
                    View
                  </a>
                  {canEdit && (
                    <button onClick={() => deleteDoc.mutate(doc._id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Image className="h-8 w-8 text-gray-400" />}
            title="No documents uploaded"
            description="Upload your ID proof and address proof to complete verification."
          />
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, FileText, Download, Eye } from 'lucide-react';
import { adminApi } from '../../api/admin.api';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import AuthImage from '../../components/AuthImage';
import { formatDateTime, getStatusLabel } from '../../utils/helpers';
import { downloadDocument, viewDocument } from '../../utils/media';
import { ProviderProfile, ServiceCategory, StatusHistoryItem } from '../../types';

export default function AdminProviderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [docAction, setDocAction] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-provider', id],
    queryFn: async () => {
      const res = await adminApi.getProvider(id!);
      return res.data.data!;
    },
    enabled: !!id,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-provider', id] });
    queryClient.invalidateQueries({ queryKey: ['admin-providers'] });
    queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
  };

  const reviewMutation = useMutation({
    mutationFn: () => adminApi.updateStatus(id!, { status: 'under_review' }),
    onSuccess: () => { toast.success('Moved to under review'); invalidate(); },
    onError: () => toast.error('Failed to update status'),
  });

  const approveMutation = useMutation({
    mutationFn: () => adminApi.approve(id!),
    onSuccess: () => { toast.success('Provider approved'); setApproveOpen(false); invalidate(); },
    onError: () => toast.error('Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => adminApi.reject(id!, remarks),
    onSuccess: () => { toast.success('Provider rejected'); setRejectOpen(false); setRemarks(''); invalidate(); },
    onError: () => toast.error('Failed to reject'),
  });

  if (isLoading) return <LoadingSpinner className="mx-auto mt-20" size="lg" />;
  if (!data) return <p>Provider not found</p>;

  const profile = data.profile as ProviderProfile;
  const history = data.history as StatusHistoryItem[];
  const categories = (profile.serviceCategories ?? []) as ServiceCategory[];
  const user = profile.userId as { name?: string; email?: string };
  const canReview = ['submitted', 'under_review'].includes(profile.applicationStatus);

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/admin/providers')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Back to providers
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{profile.fullName}</h1>
          <p className="text-gray-500">{user?.email}</p>
        </div>
        <StatusBadge status={profile.applicationStatus} className="text-sm" />
      </div>

      {canReview && (
        <div className="sticky top-20 z-20 flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <button onClick={() => reviewMutation.mutate()} disabled={reviewMutation.isPending || profile.applicationStatus === 'under_review'} className="btn-secondary">
            Move to Review
          </button>
          <button onClick={() => setApproveOpen(true)} className="btn-primary bg-green-600 hover:bg-green-700">
            Approve
          </button>
          <button onClick={() => setRejectOpen(true)} className="btn-primary bg-red-600 hover:bg-red-700">
            Reject
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card space-y-4">
          <h2 className="font-semibold">Personal Information</h2>
          <AuthImage
            profilePhoto={profile.profilePhoto}
            alt="Profile"
            className="h-20 w-20 rounded-xl object-cover"
          />
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-gray-500">Phone</dt><dd>{profile.phone}</dd></div>
            <div><dt className="text-gray-500">DOB</dt><dd>{profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : '—'}</dd></div>
            <div><dt className="text-gray-500">Gender</dt><dd className="capitalize">{profile.gender || '—'}</dd></div>
            <div className="sm:col-span-2"><dt className="text-gray-500">Bio</dt><dd>{profile.bio || '—'}</dd></div>
          </dl>
        </div>

        <div className="card space-y-4">
          <h2 className="font-semibold">Services & Experience</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <span
                key={c._id}
                className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
              >
                {c.name}
              </span>
            ))}
          </div>
          <p className="text-sm"><strong>Skills:</strong> {profile.skills?.join(', ') || '—'}</p>
          <p className="text-sm"><strong>Experience:</strong> {profile.experienceYears} years</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{profile.experienceDescription}</p>
        </div>

        <div className="card space-y-2">
          <h2 className="font-semibold">Location</h2>
          <p className="text-sm">{profile.serviceLocation?.address}</p>
          <p className="text-sm">{profile.serviceLocation?.city}, {profile.serviceLocation?.state} - {profile.serviceLocation?.pincode}</p>
        </div>

        <div className="card">
          <h2 className="mb-4 font-semibold">Documents</h2>
          <div className="space-y-3">
            {profile.verificationDocuments?.map((doc) => (
              <div key={doc._id} className="flex items-center justify-between rounded-lg border p-3 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary-600" />
                  <div>
                    <p className="text-sm font-medium">{doc.fileName}</p>
                    <p className="text-xs text-gray-500 capitalize">{doc.documentType.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    title="View"
                    disabled={docAction === `view-${doc._id}`}
                    className="btn-secondary px-2 py-1 text-xs"
                    onClick={async () => {
                      setDocAction(`view-${doc._id}`);
                      try {
                        await viewDocument(doc._id, profile._id);
                      } catch {
                        toast.error('Failed to open document');
                      } finally {
                        setDocAction(null);
                      }
                    }}
                  >
                    <Eye className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    title="Download"
                    disabled={docAction === `dl-${doc._id}`}
                    className="btn-secondary px-2 py-1 text-xs"
                    onClick={async () => {
                      setDocAction(`dl-${doc._id}`);
                      try {
                        await downloadDocument(doc._id, doc.fileName, profile._id);
                      } catch {
                        toast.error('Failed to download document');
                      } finally {
                        setDocAction(null);
                      }
                    }}
                  >
                    <Download className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 font-semibold">Application History</h2>
        <div className="space-y-4">
          {history.map((item) => (
            <div key={item._id} className="flex gap-4 border-l-2 border-primary-600 pl-4">
              <div>
                <p className="font-medium">{getStatusLabel(item.newStatus)}</p>
                {item.remarks && <p className="text-sm text-gray-500">{item.remarks}</p>}
                <p className="text-xs text-gray-400">{formatDateTime(item.timestamp)} · {item.changedBy?.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject Application">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Rejection Reason</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="input-field min-h-[100px]"
              placeholder="Please upload a clearer identity document."
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setRejectOpen(false)} className="btn-secondary">Cancel</button>
            <button
              onClick={() => rejectMutation.mutate()}
              disabled={remarks.length < 10 || rejectMutation.isPending}
              className="btn-primary bg-red-600 hover:bg-red-700"
            >
              Reject Application
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={approveOpen} onClose={() => setApproveOpen(false)} title="Approve Application">
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Are you sure you want to approve this provider? They will be notified via email.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setApproveOpen(false)} className="btn-secondary">Cancel</button>
          <button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending} className="btn-primary bg-green-600 hover:bg-green-700">
            Confirm Approval
          </button>
        </div>
      </Modal>
    </div>
  );
}

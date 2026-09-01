import { useQuery } from '@tanstack/react-query';
import { providerApi } from '../../api/provider.api';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatDateTime, getStatusLabel } from '../../utils/helpers';
import { ProviderProfile, ServiceCategory, StatusHistoryItem } from '../../types';

export default function ProviderApplicationPage() {
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['provider-profile'],
    queryFn: async () => {
      const res = await providerApi.getProfile();
      return res.data.data!;
    },
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['application-history'],
    queryFn: async () => {
      const res = await providerApi.getHistory();
      return res.data.data ?? [];
    },
  });

  if (profileLoading) return <LoadingSpinner className="mx-auto mt-20" size="lg" />;

  const profile = profileData?.profile as ProviderProfile | undefined;
  const categories = (profile?.serviceCategories ?? []) as ServiceCategory[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Application</h1>
        <p className="text-gray-500">View your application details and status history</p>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Current Status</h2>
          <StatusBadge status={profile?.applicationStatus ?? 'draft'} />
        </div>
        <dl className="grid gap-3 sm:grid-cols-2 text-sm">
          <div><dt className="text-gray-500">Full Name</dt><dd className="font-medium">{profile?.fullName || '—'}</dd></div>
          <div><dt className="text-gray-500">Phone</dt><dd className="font-medium">{profile?.phone || '—'}</dd></div>
          <div><dt className="text-gray-500">Categories</dt><dd className="font-medium">{categories.map((c) => c.name).join(', ') || '—'}</dd></div>
          <div><dt className="text-gray-500">Experience</dt><dd className="font-medium">{profile?.experienceYears ?? 0} years</dd></div>
          <div><dt className="text-gray-500">Location</dt><dd className="font-medium">{profile?.serviceLocation?.city}, {profile?.serviceLocation?.state}</dd></div>
          <div><dt className="text-gray-500">Submitted</dt><dd className="font-medium">{formatDateTime(profile?.submittedAt)}</dd></div>
        </dl>
        {profile?.rejectionRemarks && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
            <strong>Rejection Reason:</strong> {profile.rejectionRemarks}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="mb-6 text-lg font-semibold">Status Timeline</h2>
        {historyLoading ? (
          <LoadingSpinner className="mx-auto" />
        ) : history && history.length > 0 ? (
          <div className="relative space-y-0">
            {(history as StatusHistoryItem[]).map((item, i) => (
              <div key={item._id} className="relative flex gap-4 pb-8 last:pb-0">
                {i < history.length - 1 && (
                  <div className="absolute left-[11px] top-6 h-full w-0.5 bg-gray-200 dark:bg-gray-700" />
                )}
                <div className="relative z-10 mt-1 h-6 w-6 shrink-0 rounded-full bg-primary-600" />
                <div>
                  <p className="font-medium">{getStatusLabel(item.newStatus)}</p>
                  {item.remarks && <p className="text-sm text-gray-500">{item.remarks}</p>}
                  <p className="text-xs text-gray-400">{formatDateTime(item.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No status changes yet. Submit your application to begin.</p>
        )}
      </div>
    </div>
  );
}

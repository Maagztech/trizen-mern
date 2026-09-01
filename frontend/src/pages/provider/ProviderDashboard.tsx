import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  CheckCircle, Clock, FileText, MapPin, AlertTriangle, ArrowRight, User,
} from 'lucide-react';
import { providerApi } from '../../api/provider.api';
import StatusBadge from '../../components/StatusBadge';
import { CardSkeleton } from '../../components/EmptyState';
import AuthImage from '../../components/AuthImage';
import { formatDate, getProfilePhotoUrl } from '../../utils/helpers';
import { ServiceCategory } from '../../types';

const steps = ['Profile', 'Documents', 'Review', 'Approved'];

function getStepIndex(status: string): number {
  switch (status) {
    case 'draft': return 0;
    case 'submitted': return 2;
    case 'under_review': return 2;
    case 'rejected': return 2;
    case 'approved': return 3;
    default: return 0;
  }
}

export default function ProviderDashboard() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['provider-profile'],
    queryFn: async () => {
      const res = await providerApi.getProfile();
      return res.data.data!;
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => providerApi.submitApplication(),
    onSuccess: () => {
      toast.success('Application submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['provider-profile'] });
    },
    onError: (err: unknown) => {
      const errors = (err as { response?: { data?: { errors?: string[]; message?: string } } })?.response?.data;
      if (errors?.errors?.length) {
        errors.errors.forEach((e) => toast.error(e));
      } else {
        toast.error(errors?.message || 'Submission failed');
      }
    },
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  const profile = data?.profile;
  const completion = data?.completionPercentage ?? 0;
  const status = profile?.applicationStatus ?? 'draft';
  const stepIndex = getStepIndex(status);
  const categories = (profile?.serviceCategories ?? []) as ServiceCategory[];
  const photoUrl = getProfilePhotoUrl(profile?.profilePhoto);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Welcome back, {profile?.fullName || 'Provider'}</p>
      </div>

      {status === 'rejected' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-800 dark:text-red-300">Application Rejected</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                Reason: {profile?.rejectionRemarks}
              </p>
              <div className="mt-3 flex gap-2">
                <Link to="/provider/profile" className="btn-primary text-sm">Edit Application</Link>
                <button
                  onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isPending}
                  className="btn-secondary text-sm"
                >
                  {submitMutation.isPending ? 'Submitting...' : 'Resubmit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {status === 'approved' && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-300">Your application is approved!</h3>
              <p className="text-sm text-green-700 dark:text-green-400">You are now a verified service provider.</p>
            </div>
          </div>
        </div>
      )}

      {status === 'under_review' && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-yellow-600" />
            <p className="font-medium text-yellow-800 dark:text-yellow-300">Your application is under review.</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="card">
          <h3 className="mb-4 text-sm font-medium text-gray-500">Profile Completion</h3>
          <div className="relative mx-auto h-32 w-32">
            <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8" className="text-gray-200 dark:text-gray-700" />
              <circle
                cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8"
                strokeDasharray={`${completion * 3.39} 339`}
                className="text-primary-600"
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold">{completion}%</span>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-2 text-sm font-medium text-gray-500">Application Status</h3>
          <StatusBadge status={status} className="mb-4 text-sm" />
          {profile?.submittedAt && (
            <p className="text-sm text-gray-500">Submitted: {formatDate(profile.submittedAt)}</p>
          )}
          {['draft', 'rejected'].includes(status) && completion >= 80 && (
            <button
              onClick={() => submitMutation.mutate()}
              disabled={submitMutation.isPending}
              className="btn-primary mt-4 w-full text-sm"
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>

        <div className="card">
          <h3 className="mb-4 text-sm font-medium text-gray-500">Quick Info</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span>{profile?.fullName || '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{profile?.serviceLocation?.city || '—'}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <span>{profile?.verificationDocuments?.length ?? 0} documents</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-6 font-semibold">Application Progress</h3>
        <div className="flex w-full items-start">
          {steps.map((step, i) => (
            <div key={step} className="flex min-w-0 flex-1 items-start last:flex-none last:w-auto">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    i <= stepIndex
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }`}
                >
                  {i < stepIndex ? <CheckCircle className="h-5 w-5" /> : i + 1}
                </div>
                <span className="mt-2 max-w-[4.5rem] text-center text-xs font-medium leading-tight">{step}</span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`mt-5 h-0.5 min-w-0 flex-1 ${
                    i < stepIndex ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <h3 className="mb-3 font-semibold">Service Categories</h3>
          {categories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <span key={c._id} className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                  {c.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No categories selected</p>
          )}
        </div>

        <div className="card">
          <h3 className="mb-3 font-semibold">Experience</h3>
          <p className="text-2xl font-bold">{profile?.experienceYears ?? 0} years</p>
          <p className="mt-1 text-sm text-gray-500">{profile?.experienceDescription || 'No description'}</p>
        </div>
      </div>

      {photoUrl && (
        <div className="card">
          <h3 className="mb-3 font-semibold">Profile Photo</h3>
          <AuthImage src={photoUrl} alt="Profile" className="h-24 w-24 rounded-xl object-cover" />
        </div>
      )}

      {status === 'draft' && (
        <Link to="/provider/profile" className="btn-primary inline-flex items-center gap-2">
          Complete Profile <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

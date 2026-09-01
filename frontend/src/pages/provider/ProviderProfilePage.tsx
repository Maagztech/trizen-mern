import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { providerApi } from '../../api/provider.api';
import { categoryApi } from '../../api/category.api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ProviderProfile } from '../../types';

const schema = z.object({
  fullName: z.string().min(2, 'Required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone'),
  dateOfBirth: z.string().min(1, 'Required'),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']),
  bio: z.string().max(1000).optional(),
  serviceCategories: z.array(z.string()).min(1, 'Select at least one'),
  skills: z.string().min(1, 'Enter skills comma-separated'),
  experienceYears: z.coerce.number().min(0),
  experienceDescription: z.string().min(10, 'Min 10 characters'),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/),
});

type FormData = z.infer<typeof schema>;

export default function ProviderProfilePage() {
  const queryClient = useQueryClient();

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['provider-profile'],
    queryFn: async () => {
      const res = await providerApi.getProfile();
      return res.data.data!;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await categoryApi.list();
      return res.data.data ?? [];
    },
  });

  const profile = profileData?.profile as ProviderProfile | undefined;
  const canEdit = ['draft', 'rejected'].includes(profile?.applicationStatus ?? 'draft');

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: profile ? {
      fullName: profile.fullName || '',
      phone: profile.phone || '',
      dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : '',
      gender: (profile.gender as FormData['gender']) || 'male',
      bio: profile.bio || '',
      serviceCategories: (profile.serviceCategories as { _id: string }[]).map((c) => c._id || c as unknown as string),
      skills: profile.skills?.join(', ') || '',
      experienceYears: profile.experienceYears ?? 0,
      experienceDescription: profile.experienceDescription || '',
      address: profile.serviceLocation?.address || '',
      city: profile.serviceLocation?.city || '',
      state: profile.serviceLocation?.state || '',
      pincode: profile.serviceLocation?.pincode || '',
    } : undefined,
  });

  const selectedCategories = watch('serviceCategories') || [];

  const mutation = useMutation({
    mutationFn: (data: FormData) => providerApi.updateProfile({
      fullName: data.fullName,
      phone: data.phone,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      bio: data.bio,
      serviceCategories: data.serviceCategories,
      skills: data.skills.split(',').map((s) => s.trim()).filter(Boolean),
      experienceYears: data.experienceYears,
      experienceDescription: data.experienceDescription,
      serviceLocation: {
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
      },
    }),
    onSuccess: () => {
      toast.success('Profile saved');
      queryClient.invalidateQueries({ queryKey: ['provider-profile'] });
    },
    onError: () => toast.error('Failed to save profile'),
  });

  const toggleCategory = (id: string) => {
    const current = selectedCategories;
    const updated = current.includes(id) ? current.filter((c) => c !== id) : [...current, id];
    setValue('serviceCategories', updated, { shouldValidate: true });
  };

  if (isLoading) return <LoadingSpinner className="mx-auto mt-20" size="lg" />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-gray-500">Complete your onboarding information</p>
        {!canEdit && (
          <p className="mt-2 text-sm text-yellow-600">Profile is locked while application is being processed.</p>
        )}
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-8">
        <section className="card space-y-4">
          <h2 className="text-lg font-semibold">Personal Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Full Name</label>
              <input className="input-field" disabled={!canEdit} {...register('fullName')} />
              {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Phone</label>
              <input className="input-field" disabled={!canEdit} {...register('phone')} />
              {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Date of Birth</label>
              <input type="date" className="input-field" disabled={!canEdit} {...register('dateOfBirth')} />
              {errors.dateOfBirth && <p className="mt-1 text-xs text-red-500">{errors.dateOfBirth.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Gender</label>
              <select className="input-field" disabled={!canEdit} {...register('gender')}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Bio</label>
            <textarea className="input-field min-h-[80px]" disabled={!canEdit} {...register('bio')} />
          </div>
        </section>

        <section className="card space-y-4">
          <h2 className="text-lg font-semibold">Services</h2>
          <div>
            <label className="mb-2 block text-sm font-medium">Service Categories</label>
            <div className="flex flex-wrap gap-2">
              {categories?.map((cat) => (
                <button
                  key={cat._id}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => toggleCategory(cat._id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    selectedCategories.includes(cat._id)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            {errors.serviceCategories && <p className="mt-1 text-xs text-red-500">{errors.serviceCategories.message}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Skills (comma-separated)</label>
            <input className="input-field" disabled={!canEdit} placeholder="e.g. Deep cleaning, Sanitization" {...register('skills')} />
            {errors.skills && <p className="mt-1 text-xs text-red-500">{errors.skills.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Experience (years)</label>
              <input type="number" min="0" className="input-field" disabled={!canEdit} {...register('experienceYears')} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Experience Description</label>
            <textarea className="input-field min-h-[80px]" disabled={!canEdit} {...register('experienceDescription')} />
            {errors.experienceDescription && <p className="mt-1 text-xs text-red-500">{errors.experienceDescription.message}</p>}
          </div>
        </section>

        <section className="card space-y-4">
          <h2 className="text-lg font-semibold">Location</h2>
          <div>
            <label className="mb-1 block text-sm font-medium">Address</label>
            <input className="input-field" disabled={!canEdit} {...register('address')} />
            {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">City</label>
              <input className="input-field" disabled={!canEdit} {...register('city')} />
              {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">State</label>
              <input className="input-field" disabled={!canEdit} {...register('state')} />
              {errors.state && <p className="mt-1 text-xs text-red-500">{errors.state.message}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Pincode</label>
              <input className="input-field" disabled={!canEdit} {...register('pincode')} />
              {errors.pincode && <p className="mt-1 text-xs text-red-500">{errors.pincode.message}</p>}
            </div>
          </div>
        </section>

        {canEdit && (
          <button type="submit" disabled={mutation.isPending} className="btn-primary">
            {mutation.isPending ? 'Saving...' : 'Save Profile'}
          </button>
        )}
      </form>
    </div>
  );
}

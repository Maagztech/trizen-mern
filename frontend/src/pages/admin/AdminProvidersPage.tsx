import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { adminApi } from '../../api/admin.api';
import { categoryApi } from '../../api/category.api';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { formatDate } from '../../utils/helpers';
import { ProviderProfile, ServiceCategory } from '../../types';

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function AdminProvidersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const debouncedSearch = useDebounce(search, 400);

  const page = Number(searchParams.get('page') || 1);
  const limit = Number(searchParams.get('limit') || 10);
  const status = searchParams.get('status') || '';
  const category = searchParams.get('category') || '';
  const city = searchParams.get('city') || '';

  const updateParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    updateParams({ search: debouncedSearch, page: '1' });
  }, [debouncedSearch]);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await categoryApi.list();
      return res.data.data ?? [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-providers', page, limit, status, category, city, debouncedSearch],
    queryFn: async () => {
      const res = await adminApi.listProviders({
        page, limit, search: debouncedSearch || undefined,
        status: status || undefined, category: category || undefined, city: city || undefined,
      });
      return res.data.data!;
    },
  });

  const providers = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Providers</h1>
        <p className="text-gray-500">Search and manage provider applications</p>
      </div>

      <div className="card space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, phone..."
              className="input-field pl-10"
            />
          </div>
          <select
            value={status}
            onChange={(e) => updateParams({ status: e.target.value, page: '1' })}
            className="input-field w-auto"
          >
            <option value="">All Status</option>
            {['draft', 'submitted', 'under_review', 'approved', 'rejected'].map((s) => (
              <option key={s} value={s}>{s.replace('_', ' ')}</option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => updateParams({ category: e.target.value, page: '1' })}
            className="input-field w-auto"
          >
            <option value="">All Categories</option>
            {categories?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <input
            value={city}
            onChange={(e) => updateParams({ city: e.target.value, page: '1' })}
            placeholder="City"
            className="input-field w-32"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>
        ) : providers.length === 0 ? (
          <EmptyState
            icon={<Search className="h-8 w-8 text-gray-400" />}
            title="No providers found"
            description="Try adjusting your search or filters."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    {['Name', 'Phone', 'Categories', 'Experience', 'Location', 'Status', 'Submitted', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 font-medium text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {providers.map((p: ProviderProfile & { email?: string; name?: string }) => {
                    const cats = (p.serviceCategories as ServiceCategory[]) ?? [];
                    return (
                      <tr key={p._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <p className="font-medium">{p.fullName || p.name}</p>
                          <p className="text-xs text-gray-500">{p.email}</p>
                        </td>
                        <td className="px-4 py-3">{p.phone || '—'}</td>
                        <td className="px-4 py-3">{cats.map((c) => c.name).join(', ') || '—'}</td>
                        <td className="px-4 py-3">{p.experienceYears ?? 0} yrs</td>
                        <td className="px-4 py-3">{p.serviceLocation?.city || '—'}</td>
                        <td className="px-4 py-3"><StatusBadge status={p.applicationStatus} /></td>
                        <td className="px-4 py-3">{formatDate(p.submittedAt)}</td>
                        <td className="px-4 py-3">
                          <Link to={`/admin/providers/${p._id}`} className="btn-secondary text-xs">
                            <Eye className="mr-1 h-3 w-3" /> View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pagination && (
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
                <p className="text-sm text-gray-500">
                  Showing {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => updateParams({ page: String(pagination.page - 1) })}
                    className="btn-secondary px-3 py-1.5"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm">Page {pagination.page} of {pagination.totalPages}</span>
                  <button
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => updateParams({ page: String(pagination.page + 1) })}
                    className="btn-secondary px-3 py-1.5"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <select
                    value={limit}
                    onChange={(e) => updateParams({ limit: e.target.value, page: '1' })}
                    className="input-field w-auto py-1.5"
                  >
                    {[10, 20, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
                  </select>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

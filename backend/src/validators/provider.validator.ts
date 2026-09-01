import { z } from 'zod';

export const serviceLocationSchema = z.object({
  address: z.string().min(5, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/).optional(),
  dateOfBirth: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  bio: z.string().max(1000).optional(),
  serviceCategories: z.array(z.string()).min(1, 'Select at least one category').optional(),
  skills: z.array(z.string().min(1)).optional(),
  experienceYears: z.number().min(0).optional(),
  experienceDescription: z.string().max(2000).optional(),
  serviceLocation: serviceLocationSchema.optional(),
});

export const uploadDocumentSchema = z.object({
  documentType: z.enum(['id_proof', 'address_proof', 'certificate', 'other']),
});

export const providerListQuerySchema = z.object({
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
  search: z.string().optional(),
  status: z.enum(['draft', 'submitted', 'under_review', 'approved', 'rejected']).optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  minExperience: z.coerce.number().min(0).optional(),
  maxExperience: z.coerce.number().min(0).optional(),
  sortBy: z.enum(['createdAt', 'submittedAt', 'fullName', 'experienceYears']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const statusUpdateSchema = z.object({
  status: z.enum(['under_review', 'approved', 'rejected', 'submitted']),
  remarks: z.string().optional(),
});

export const rejectSchema = z.object({
  remarks: z.string().min(10, 'Rejection remarks must be at least 10 characters'),
});

export const categorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

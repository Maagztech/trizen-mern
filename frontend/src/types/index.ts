export type UserRole = 'provider' | 'admin';

export type ApplicationStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
}

export interface ServiceCategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

export interface VerificationDocument {
  _id: string;
  documentType: 'id_proof' | 'address_proof' | 'certificate' | 'other';
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface ServiceLocation {
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
}

export interface ProviderProfile {
  _id: string;
  userId: string | User;
  fullName: string;
  phone: string;
  profilePhoto?: string;
  dateOfBirth?: string;
  gender?: string;
  bio?: string;
  serviceCategories: ServiceCategory[] | string[];
  skills: string[];
  experienceYears: number;
  experienceDescription?: string;
  serviceLocation: ServiceLocation;
  verificationDocuments: VerificationDocument[];
  applicationStatus: ApplicationStatus;
  rejectionRemarks?: string;
  submittedAt?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
}

export interface StatusHistoryItem {
  _id: string;
  previousStatus: ApplicationStatus | null;
  newStatus: ApplicationStatus;
  remarks?: string;
  timestamp: string;
  changedBy: { name: string; email: string; role: string };
}

export interface DashboardStats {
  totals: {
    totalProviders: number;
    draft: number;
    submitted: number;
    underReview: number;
    approved: number;
    rejected: number;
    pendingReview: number;
  };
  statusDistribution: { status: string; count: number }[];
  applicationsOverTime: { date: string; count: number }[];
  providersByCategory: { category: string; count: number }[];
}

import { FilterQuery, Types } from 'mongoose';
import { ProviderProfile, IProviderProfile } from '../models/ProviderProfile';
import { ApplicationStatusHistory } from '../models/ApplicationStatusHistory';
import { AuditLog } from '../models/AuditLog';
import { User } from '../models/User';
import { ServiceCategory } from '../models/ServiceCategory';
import { AppError } from '../middleware/error.middleware';
import { ApplicationStatus, VALID_STATUS_TRANSITIONS } from '../types';
import { parsePagination, buildPagination } from '../utils/pagination';
import { emailService } from './email.service';
import { notificationService } from './notification.service';
import { recordStatusChange } from './provider.service';

interface ProviderListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: ApplicationStatus;
  category?: string;
  city?: string;
  minExperience?: number;
  maxExperience?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
}

async function updateStatus(
  profileId: string,
  adminId: string,
  newStatus: ApplicationStatus,
  remarks?: string,
  action?: string
) {
  const profile = await ProviderProfile.findById(profileId);
  if (!profile) throw new AppError('Provider not found', 404);

  const currentStatus = profile.applicationStatus;
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus];

  if (!allowed.includes(newStatus)) {
    throw new AppError(`Invalid status transition from ${currentStatus} to ${newStatus}`, 400);
  }

  if (newStatus === 'rejected' && !remarks) {
    throw new AppError('Rejection remarks are required', 400);
  }

  profile.applicationStatus = newStatus;
  profile.reviewedAt = new Date();
  profile.reviewedBy = new Types.ObjectId(adminId);

  if (newStatus === 'rejected') {
    profile.rejectionRemarks = remarks;
  } else if (newStatus === 'approved') {
    profile.rejectionRemarks = undefined;
  }

  await profile.save();

  await recordStatusChange(profile._id, currentStatus, newStatus, adminId, remarks);

  await AuditLog.create({
    actor: adminId,
    action: action || `status_${newStatus}`,
    targetProvider: profile._id,
    previousStatus: currentStatus,
    newStatus,
    remarks,
  });

  const user = await User.findById(profile.userId);
  if (user) {
    const notifications: Record<ApplicationStatus, { title: string; message: string; type: 'info' | 'success' | 'warning' | 'error' }> = {
      draft: { title: 'Draft', message: 'Application saved as draft.', type: 'info' },
      submitted: { title: 'Submitted', message: 'Application submitted.', type: 'info' },
      under_review: { title: 'Under Review', message: 'Your application is now under review.', type: 'info' },
      approved: { title: 'Approved!', message: 'Congratulations! Your application has been approved.', type: 'success' },
      rejected: { title: 'Rejected', message: `Your application was rejected. Reason: ${remarks}`, type: 'error' },
    };

    const n = notifications[newStatus];
    await notificationService.create(profile.userId, n.title, n.message, n.type);

    switch (newStatus) {
      case 'under_review':
        await emailService.sendUnderReview(user.name, user.email);
        break;
      case 'approved':
        await emailService.sendApproved(user.name, user.email);
        break;
      case 'rejected':
        await emailService.sendRejected(user.name, user.email, remarks || '');
        break;
    }
  }

  return profile;
}

export const adminService = {
  async listProviders(query: ProviderListQuery): Promise<{ data: unknown[]; pagination: ReturnType<typeof buildPagination> }> {
    const { page, limit, skip } = parsePagination(query);
    const filter: FilterQuery<IProviderProfile> = {};

    if (query.status) filter.applicationStatus = query.status;
    if (query.city) filter['serviceLocation.city'] = new RegExp(query.city, 'i');
    if (query.category) filter.serviceCategories = new Types.ObjectId(query.category);
    if (query.minExperience !== undefined || query.maxExperience !== undefined) {
      filter.experienceYears = {};
      if (query.minExperience !== undefined) filter.experienceYears.$gte = query.minExperience;
      if (query.maxExperience !== undefined) filter.experienceYears.$lte = query.maxExperience;
    }
    if (query.dateFrom || query.dateTo) {
      filter.submittedAt = {};
      if (query.dateFrom) filter.submittedAt.$gte = new Date(query.dateFrom);
      if (query.dateTo) filter.submittedAt.$lte = new Date(query.dateTo);
    }

    if (query.search) {
      const searchRegex = new RegExp(query.search, 'i');
      const users = await User.find({
        role: 'provider',
        $or: [{ name: searchRegex }, { email: searchRegex }],
      }).select('_id');
      const userIds = users.map((u) => u._id as Types.ObjectId);
      filter.$or = [
        { fullName: searchRegex },
        { phone: searchRegex },
        ...(userIds.length ? [{ userId: { $in: userIds } }] : []),
      ];
    }

    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };

    const [profiles, total] = await Promise.all([
      ProviderProfile.find(filter)
        .select('-verificationDocuments.filePath')
        .populate('userId', 'name email')
        .populate('serviceCategories', 'name')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      ProviderProfile.countDocuments(filter),
    ]);

    const data = profiles.map((p) => ({
      ...p,
      email: (p.userId as { email?: string })?.email,
      name: (p.userId as { name?: string })?.name || p.fullName,
    }));

    return { data, pagination: buildPagination(page, limit, total) };
  },

  async getProvider(id: string) {
    const profile = await ProviderProfile.findById(id)
      .populate('userId', 'name email avatar')
      .populate('serviceCategories', 'name slug description')
      .populate('reviewedBy', 'name email');

    if (!profile) throw new AppError('Provider not found', 404);

    const history = await ApplicationStatusHistory.find({ applicationId: profile._id })
      .populate('changedBy', 'name email role')
      .sort({ timestamp: 1 });

    const auditLogs = await AuditLog.find({ targetProvider: profile._id })
      .populate('actor', 'name email')
      .sort({ timestamp: -1 });

    return { profile, history, auditLogs };
  },

  async updateStatus(profileId: string, adminId: string, status: ApplicationStatus, remarks?: string) {
    return updateStatus(profileId, adminId, status, remarks, `move_to_${status}`);
  },

  async approve(profileId: string, adminId: string) {
    return updateStatus(profileId, adminId, 'approved', undefined, 'approve');
  },

  async reject(profileId: string, adminId: string, remarks: string) {
    return updateStatus(profileId, adminId, 'rejected', remarks, 'reject');
  },

  async getStatistics() {
    const [
      totalProviders,
      draft,
      submitted,
      underReview,
      approved,
      rejected,
      statusOverTime,
      byCategory,
    ] = await Promise.all([
      ProviderProfile.countDocuments(),
      ProviderProfile.countDocuments({ applicationStatus: 'draft' }),
      ProviderProfile.countDocuments({ applicationStatus: 'submitted' }),
      ProviderProfile.countDocuments({ applicationStatus: 'under_review' }),
      ProviderProfile.countDocuments({ applicationStatus: 'approved' }),
      ProviderProfile.countDocuments({ applicationStatus: 'rejected' }),
      ProviderProfile.aggregate([
        { $match: { submittedAt: { $exists: true } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$submittedAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
      ProviderProfile.aggregate([
        { $unwind: '$serviceCategories' },
        { $group: { _id: '$serviceCategories', count: { $sum: 1 } } },
        {
          $lookup: {
            from: 'servicecategories',
            localField: '_id',
            foreignField: '_id',
            as: 'category',
          },
        },
        { $unwind: '$category' },
        { $project: { name: '$category.name', count: 1 } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return {
      totals: {
        totalProviders,
        draft,
        submitted,
        underReview,
        approved,
        rejected,
        pendingReview: submitted + underReview,
      },
      statusDistribution: [
        { status: 'Draft', count: draft },
        { status: 'Submitted', count: submitted },
        { status: 'Under Review', count: underReview },
        { status: 'Approved', count: approved },
        { status: 'Rejected', count: rejected },
      ],
      applicationsOverTime: statusOverTime.map((item: { _id: string; count: number }) => ({
        date: item._id,
        count: item.count,
      })),
      providersByCategory: byCategory.map((item: { name: string; count: number }) => ({
        category: item.name,
        count: item.count,
      })),
    };
  },

  async manageCategories() {
    return ServiceCategory.find().sort({ name: 1 });
  },

  async createCategory(data: { name: string; description?: string }) {
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = await ServiceCategory.findOne({ $or: [{ name: data.name }, { slug }] });
    if (existing) throw new AppError('Category already exists', 409);
    return ServiceCategory.create({ ...data, slug });
  },

  async updateCategory(id: string, data: Partial<{ name: string; description: string; isActive: boolean }>) {
    const category = await ServiceCategory.findByIdAndUpdate(id, data, { new: true });
    if (!category) throw new AppError('Category not found', 404);
    return category;
  },

  async deleteCategory(id: string) {
    const inUse = await ProviderProfile.countDocuments({ serviceCategories: id });
    if (inUse > 0) throw new AppError('Category is in use and cannot be deleted', 400);
    const category = await ServiceCategory.findByIdAndDelete(id);
    if (!category) throw new AppError('Category not found', 404);
    return category;
  },
};

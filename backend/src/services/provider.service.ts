import { Types } from 'mongoose';
import { ProviderProfile, IProviderProfile } from '../models/ProviderProfile';
import { ApplicationStatusHistory } from '../models/ApplicationStatusHistory';
import { User } from '../models/User';
import { AppError } from '../middleware/error.middleware';
import { ApplicationStatus, VALID_STATUS_TRANSITIONS } from '../types';
import { emailService } from './email.service';
import { notificationService } from './notification.service';
import { uploadService } from './upload.service';

function calculateCompletion(profile: IProviderProfile): number {
  let score = 0;
  if (profile.fullName && profile.phone && profile.dateOfBirth && profile.gender) score += 20;
  if (profile.serviceCategories?.length > 0) score += 25;
  if (profile.skills?.length > 0 && profile.experienceYears >= 0 && profile.experienceDescription) score += 20;
  const loc = profile.serviceLocation;
  if (loc?.address && loc?.city && loc?.state && loc?.pincode) score += 15;
  if (profile.profilePhoto) score += 10;
  const docTypes = profile.verificationDocuments.map((d) => d.documentType);
  if (docTypes.includes('id_proof') && docTypes.includes('address_proof')) score += 10;
  return Math.min(100, score);
}

function validateSubmission(profile: IProviderProfile): string[] {
  const errors: string[] = [];
  if (!profile.fullName) errors.push('Full name is required');
  if (!profile.phone) errors.push('Phone is required');
  if (!profile.dateOfBirth) errors.push('Date of birth is required');
  if (!profile.gender) errors.push('Gender is required');
  if (!profile.serviceCategories?.length) errors.push('At least one service category is required');
  if (!profile.skills?.length) errors.push('At least one skill is required');
  if (profile.experienceYears < 0) errors.push('Experience years must be >= 0');
  if (!profile.experienceDescription) errors.push('Experience description is required');
  const loc = profile.serviceLocation;
  if (!loc?.address || !loc?.city || !loc?.state || !loc?.pincode) {
    errors.push('Complete service location is required');
  }
  if (!profile.profilePhoto) errors.push('Profile photo is required');
  const docTypes = profile.verificationDocuments.map((d) => d.documentType);
  if (!docTypes.includes('id_proof')) errors.push('ID proof document is required');
  if (!docTypes.includes('address_proof')) errors.push('Address proof document is required');
  return errors;
}

async function recordStatusChange(
  applicationId: Types.ObjectId,
  previousStatus: ApplicationStatus | null,
  newStatus: ApplicationStatus,
  changedBy: string,
  remarks?: string
) {
  await ApplicationStatusHistory.create({
    applicationId,
    previousStatus,
    newStatus,
    changedBy,
    remarks,
  });
}

export const providerService = {
  calculateCompletion,

  async getProfile(userId: string) {
    const profile = await ProviderProfile.findOne({ userId })
      .populate('serviceCategories', 'name slug')
      .populate('reviewedBy', 'name email');
    if (!profile) throw new AppError('Profile not found', 404);

    const user = await User.findById(userId).select('name email avatar');
    const completion = calculateCompletion(profile);

    return { profile, user, completionPercentage: completion };
  },

  async updateProfile(userId: string, data: Record<string, unknown>) {
    const profile = await ProviderProfile.findOne({ userId });
    if (!profile) throw new AppError('Profile not found', 404);

    if (!['draft', 'rejected'].includes(profile.applicationStatus)) {
      throw new AppError('Profile cannot be edited in current status', 400);
    }

    const allowed = [
      'fullName', 'phone', 'dateOfBirth', 'gender', 'bio',
      'serviceCategories', 'skills', 'experienceYears', 'experienceDescription', 'serviceLocation',
    ];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        if (key === 'dateOfBirth' && typeof data[key] === 'string') {
          profile.dateOfBirth = new Date(data[key] as string);
        } else if (key === 'serviceCategories' && Array.isArray(data[key])) {
          profile.serviceCategories = (data[key] as string[]).map((id) => new Types.ObjectId(id));
        } else if (key === 'serviceLocation' && typeof data[key] === 'object') {
          profile.serviceLocation = data[key] as typeof profile.serviceLocation;
        } else if (key === 'skills' && Array.isArray(data[key])) {
          profile.skills = data[key] as string[];
        } else if (key === 'fullName') {
          profile.fullName = data[key] as string;
        } else if (key === 'phone') {
          profile.phone = data[key] as string;
        } else if (key === 'gender') {
          profile.gender = data[key] as typeof profile.gender;
        } else if (key === 'bio') {
          profile.bio = data[key] as string;
        } else if (key === 'experienceYears') {
          profile.experienceYears = data[key] as number;
        } else if (key === 'experienceDescription') {
          profile.experienceDescription = data[key] as string;
        }
      }
    }

    await profile.save();
    return this.getProfile(userId);
  },

  async uploadProfilePhoto(userId: string, filename: string, filePath: string) {
    const profile = await ProviderProfile.findOne({ userId });
    if (!profile) throw new AppError('Profile not found', 404);

    if (!['draft', 'rejected'].includes(profile.applicationStatus)) {
      throw new AppError('Profile cannot be edited in current status', 400);
    }

    if (profile.profilePhoto) {
      uploadService.deleteFile(profile.profilePhoto);
    }

    profile.profilePhoto = filePath;
    await profile.save();
    return profile;
  },

  async uploadDocument(
    userId: string,
    doc: { documentType: string; fileName: string; filePath: string; mimeType: string; size: number }
  ) {
    const profile = await ProviderProfile.findOne({ userId });
    if (!profile) throw new AppError('Profile not found', 404);

    if (!['draft', 'rejected'].includes(profile.applicationStatus)) {
      throw new AppError('Profile cannot be edited in current status', 400);
    }

    profile.verificationDocuments.push({
      documentType: doc.documentType as 'id_proof' | 'address_proof' | 'certificate' | 'other',
      fileName: doc.fileName,
      filePath: doc.filePath,
      mimeType: doc.mimeType,
      size: doc.size,
      uploadedAt: new Date(),
    });

    await profile.save();
    return profile;
  },

  async deleteDocument(userId: string, documentId: string) {
    const profile = await ProviderProfile.findOne({ userId });
    if (!profile) throw new AppError('Profile not found', 404);

    if (!['draft', 'rejected'].includes(profile.applicationStatus)) {
      throw new AppError('Profile cannot be edited in current status', 400);
    }

    const docIndex = profile.verificationDocuments.findIndex(
      (d) => d._id?.toString() === documentId
    );
    if (docIndex === -1) throw new AppError('Document not found', 404);

    const doc = profile.verificationDocuments[docIndex];
    uploadService.deleteFile(doc.filePath);
    profile.verificationDocuments.splice(docIndex, 1);
    await profile.save();
    return profile;
  },

  async submitApplication(userId: string) {
    const profile = await ProviderProfile.findOne({ userId });
    if (!profile) throw new AppError('Profile not found', 404);

    if (!['draft', 'rejected'].includes(profile.applicationStatus)) {
      throw new AppError('Application cannot be submitted in current status', 400);
    }

    const errors = validateSubmission(profile);
    if (errors.length > 0) {
      throw new AppError('Application validation failed', 400, errors);
    }

    const previousStatus = profile.applicationStatus;
    profile.applicationStatus = 'submitted';
    profile.submittedAt = new Date();
    profile.rejectionRemarks = undefined;
    await profile.save();

    await recordStatusChange(
      profile._id,
      previousStatus,
      'submitted',
      userId,
      previousStatus === 'rejected' ? 'Resubmitted after rejection' : 'Initial submission'
    );

    const user = await User.findById(userId);
    if (user) {
      if (previousStatus === 'rejected') {
        await emailService.sendResubmitted(user.name, user.email);
      } else {
        await emailService.sendApplicationSubmitted(user.name, user.email);
      }

      await notificationService.create(
        userId,
        'Application Submitted',
        'Your application has been submitted and is pending review.',
        'success'
      );

      const admins = await User.find({ role: 'admin', isActive: true });
      for (const admin of admins) {
        await notificationService.create(
          admin._id,
          'New Application',
          `${user.name} has submitted an application for review.`,
          'info'
        );
        await emailService.notifyAdminNewApplication(user.name, admin.email);
      }
    }

    return profile;
  },

  async getApplication(userId: string) {
    return this.getProfile(userId);
  },

  async getApplicationHistory(userId: string) {
    const profile = await ProviderProfile.findOne({ userId });
    if (!profile) throw new AppError('Profile not found', 404);

    const history = await ApplicationStatusHistory.find({ applicationId: profile._id })
      .populate('changedBy', 'name email role')
      .sort({ timestamp: 1 });

    return history;
  },
};

export { validateSubmission, recordStatusChange };

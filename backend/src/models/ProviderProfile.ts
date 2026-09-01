import mongoose, { Document, Schema, Types } from 'mongoose';
import { ApplicationStatus, DocumentType, Gender } from '../types';

export interface IVerificationDocument {
  _id?: Types.ObjectId;
  documentType: DocumentType;
  fileName: string;
  filePath: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
}

export interface IServiceLocation {
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
}

export interface IProviderProfile extends Document {
  userId: Types.ObjectId;
  fullName: string;
  phone: string;
  profilePhoto?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  bio?: string;
  serviceCategories: Types.ObjectId[];
  skills: string[];
  experienceYears: number;
  experienceDescription?: string;
  serviceLocation: IServiceLocation;
  verificationDocuments: IVerificationDocument[];
  applicationStatus: ApplicationStatus;
  rejectionRemarks?: string;
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const verificationDocumentSchema = new Schema<IVerificationDocument>(
  {
    documentType: {
      type: String,
      enum: ['id_proof', 'address_proof', 'certificate', 'other'],
      required: true,
    },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const serviceLocationSchema = new Schema<IServiceLocation>(
  {
    address: { type: String, default: '' },
    city: { type: String, default: '', index: true },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  { _id: false }
);

const providerProfileSchema = new Schema<IProviderProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    fullName: { type: String, default: '' },
    phone: { type: String, default: '' },
    profilePhoto: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
    bio: { type: String, maxlength: 1000 },
    serviceCategories: [{ type: Schema.Types.ObjectId, ref: 'ServiceCategory', index: true }],
    skills: [{ type: String }],
    experienceYears: { type: Number, default: 0, min: 0 },
    experienceDescription: { type: String, maxlength: 2000 },
    serviceLocation: { type: serviceLocationSchema, default: () => ({}) },
    verificationDocuments: [verificationDocumentSchema],
    applicationStatus: {
      type: String,
      enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected'],
      default: 'draft',
      index: true,
    },
    rejectionRemarks: { type: String },
    submittedAt: { type: Date, index: true },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

providerProfileSchema.index({ 'serviceLocation.city': 1, applicationStatus: 1 });
providerProfileSchema.index({ experienceYears: 1 });
providerProfileSchema.index({ createdAt: -1 });

export const ProviderProfile = mongoose.model<IProviderProfile>('ProviderProfile', providerProfileSchema);

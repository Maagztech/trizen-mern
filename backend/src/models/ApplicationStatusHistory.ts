import mongoose, { Document, Schema, Types } from 'mongoose';
import { ApplicationStatus } from '../types';

export interface IApplicationStatusHistory extends Document {
  applicationId: Types.ObjectId;
  previousStatus: ApplicationStatus | null;
  newStatus: ApplicationStatus;
  changedBy: Types.ObjectId;
  remarks?: string;
  timestamp: Date;
}

const applicationStatusHistorySchema = new Schema<IApplicationStatusHistory>({
  applicationId: { type: Schema.Types.ObjectId, ref: 'ProviderProfile', required: true, index: true },
  previousStatus: { type: String, enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected', null] },
  newStatus: { type: String, enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected'], required: true },
  changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  remarks: { type: String },
  timestamp: { type: Date, default: Date.now },
});

export const ApplicationStatusHistory = mongoose.model<IApplicationStatusHistory>(
  'ApplicationStatusHistory',
  applicationStatusHistorySchema
);

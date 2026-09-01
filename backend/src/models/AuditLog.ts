import mongoose, { Document, Schema, Types } from 'mongoose';
import { ApplicationStatus } from '../types';

export interface IAuditLog extends Document {
  actor: Types.ObjectId;
  action: string;
  targetProvider: Types.ObjectId;
  previousStatus?: ApplicationStatus;
  newStatus?: ApplicationStatus;
  remarks?: string;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>({
  actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  targetProvider: { type: Schema.Types.ObjectId, ref: 'ProviderProfile', required: true, index: true },
  previousStatus: { type: String, enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected'] },
  newStatus: { type: String, enum: ['draft', 'submitted', 'under_review', 'approved', 'rejected'] },
  remarks: { type: String },
  timestamp: { type: Date, default: Date.now },
});

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

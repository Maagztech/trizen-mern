import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import { connectDB } from '../config/db';
import { User } from '../models/User';
import { ProviderProfile } from '../models/ProviderProfile';
import { ServiceCategory } from '../models/ServiceCategory';
import { hashPassword } from '../utils/password';

describe('Service Provider Portal API', () => {
  let providerToken: string;
  let adminToken: string;
  let categoryId: string;
  let profileId: string;

  beforeAll(async () => {
    await connectDB();
    await ServiceCategory.create({ name: 'Cleaning', slug: 'cleaning', isActive: true });
    const cat = await ServiceCategory.findOne({ slug: 'cleaning' });
    categoryId = cat!._id.toString();

    const adminHash = await hashPassword('Admin@123456');
    await User.create({
      name: 'Admin',
      email: 'admin@test.com',
      password: adminHash,
      role: 'admin',
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
  });

  describe('Auth', () => {
    it('should register a provider', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Provider',
          email: 'john@test.com',
          phone: '9876543210',
          password: 'Test@1234',
          confirmPassword: 'Test@1234',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      providerToken = res.body.data.token;
    });

    it('should login provider', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@test.com', password: 'Test@1234' });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
      providerToken = res.body.data.token;
    });

    it('should login admin', async () => {
      const res = await request(app)
        .post('/api/auth/admin/login')
        .send({ email: 'admin@test.com', password: 'Admin@123456' });

      expect(res.status).toBe(200);
      adminToken = res.body.data.token;
    });

    it('should reject unauthenticated protected endpoint', async () => {
      const res = await request(app).get('/api/providers/profile');
      expect(res.status).toBe(401);
    });
  });

  describe('Provider Profile', () => {
    it('should update provider profile', async () => {
      const res = await request(app)
        .put('/api/providers/profile')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          fullName: 'John Provider',
          phone: '9876543210',
          dateOfBirth: '1990-01-15',
          gender: 'male',
          bio: 'Experienced cleaner',
          serviceCategories: [categoryId],
          skills: ['Deep cleaning', 'Sanitization'],
          experienceYears: 5,
          experienceDescription: '5 years of professional cleaning',
          serviceLocation: {
            address: '123 Main Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.data.profile.fullName).toBe('John Provider');
    });

    it('should fail submission without required documents', async () => {
      const res = await request(app)
        .post('/api/providers/application/submit')
        .set('Authorization', `Bearer ${providerToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('Admin Authorization', () => {
    it('should reject provider from admin endpoints', async () => {
      const res = await request(app)
        .get('/api/admin/providers')
        .set('Authorization', `Bearer ${providerToken}`);

      expect(res.status).toBe(403);
    });

    it('should list providers as admin', async () => {
      const res = await request(app)
        .get('/api/admin/providers')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.pagination).toBeDefined();
      profileId = res.body.data.data[0]._id;
    });
  });

  describe('Admin Review', () => {
    it('should reject invalid status transition', async () => {
      const res = await request(app)
        .patch(`/api/admin/providers/${profileId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    it('should move to under review', async () => {
      // First submit with minimal - will fail, so manually set status
      await ProviderProfile.findByIdAndUpdate(profileId, {
        applicationStatus: 'submitted',
        submittedAt: new Date(),
        profilePhoto: 'test.jpg',
        verificationDocuments: [
          { documentType: 'id_proof', fileName: 'id.pdf', filePath: '/tmp/id.pdf', mimeType: 'application/pdf', size: 1000, uploadedAt: new Date() },
          { documentType: 'address_proof', fileName: 'addr.pdf', filePath: '/tmp/addr.pdf', mimeType: 'application/pdf', size: 1000, uploadedAt: new Date() },
        ],
      });

      const res = await request(app)
        .patch(`/api/admin/providers/${profileId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'under_review' });

      expect(res.status).toBe(200);
    });

    it('should reject with remarks', async () => {
      const res = await request(app)
        .patch(`/api/admin/providers/${profileId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ remarks: 'Please upload a clearer identity document.' });

      expect(res.status).toBe(200);
      expect(res.body.data.applicationStatus).toBe('rejected');
    });

    it('should approve after resubmit flow', async () => {
      await ProviderProfile.findByIdAndUpdate(profileId, { applicationStatus: 'under_review' });

      const res = await request(app)
        .patch(`/api/admin/providers/${profileId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.applicationStatus).toBe('approved');
    });
  });

  describe('Health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

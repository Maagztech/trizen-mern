import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import { ServiceCategory } from '../models/ServiceCategory';
import { logger } from '../utils/logger';

dotenv.config();

const categories = [
  { name: 'Cleaning', description: 'Home and office cleaning services' },
  { name: 'Plumbing', description: 'Plumbing repair and installation' },
  { name: 'Electrician', description: 'Electrical repair and wiring' },
  { name: 'Carpentry', description: 'Furniture and woodwork services' },
  { name: 'Painting', description: 'Interior and exterior painting' },
  { name: 'Appliance Repair', description: 'Home appliance repair services' },
  { name: 'Beauty & Salon', description: 'Beauty and salon at home services' },
  { name: 'AC Repair', description: 'Air conditioning repair and maintenance' },
  { name: 'Home Maintenance', description: 'General home maintenance services' },
  { name: 'Gardening', description: 'Garden and lawn care services' },
  { name: 'Pest Control', description: 'Pest control and fumigation' },
  { name: 'Moving & Packing', description: 'Relocation and packing services' },
  { name: 'Driver', description: 'Professional driving services' },
  { name: 'Tutor', description: 'Private tutoring services' },
  { name: 'Other', description: 'Other service categories' },
];

async function seedCategories() {
  await connectDB();

  for (const cat of categories) {
    const slug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await ServiceCategory.findOneAndUpdate(
      { slug },
      { ...cat, slug, isActive: true },
      { upsert: true, new: true }
    );
  }

  logger.info(`Seeded ${categories.length} service categories`);
  process.exit(0);
}

seedCategories().catch((error) => {
  logger.error('Category seed failed', error);
  process.exit(1);
});

import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '', trim: true },
    password: { type: String, default: '' },
    role: { type: String, enum: ['super_admin', 'company_user'], required: true },
    // Distinguishes company personnel: accountant logs in and works on submissions,
    // supervisor is a reporting-only contact with no application access.
    personnelType: { type: String, enum: ['accountant', 'supervisor', null], default: null },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    lastLoginAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);

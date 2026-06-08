import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    legalName: { type: String, required: true, trim: true },
    ntn: { type: String, required: true, trim: true },
    strn: { type: String, default: '', trim: true },
    province: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    contactPersonName: { type: String, required: true, trim: true },
    contactPersonEmail: { type: String, required: true, trim: true },
    contactPersonPhone: { type: String, default: '', trim: true },
    status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
    settings: {
      defaultInvoiceType: { type: String, default: '' },
      defaultTaxRate: { type: Number, default: 0 },
      allowSubmission: { type: Boolean, default: true },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Company || mongoose.model('Company', CompanySchema);

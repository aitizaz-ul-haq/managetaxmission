import mongoose from 'mongoose';

const BranchSchema = new mongoose.Schema(
  {
    name: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true },
    principalActivity: { type: String, default: '', trim: true },
  },
  { _id: false }
);

const CompanySchema = new mongoose.Schema(
  {
    // FBR Registration details
    registrationNo: { type: String, default: '', trim: true },
    referenceNo: { type: String, default: '', trim: true },
    salesTaxRegistered: { type: Boolean, default: false },
    salesTaxRegisteredDate: { type: String, default: '', trim: true },
    category: { type: String, default: '', trim: true },
    ppRegIncNo: { type: String, default: '', trim: true },
    registeredOn: { type: String, default: '', trim: true },
    taxOffice: { type: String, default: '', trim: true },
    incomeTaxStatus: { type: String, default: '', trim: true },
    salesTaxStatus: { type: String, default: '', trim: true },

    // Company information
    companyName: { type: String, required: true, trim: true },
    legalName: { type: String, required: true, trim: true },
    ntn: { type: String, required: true, trim: true },
    strn: { type: String, default: '', trim: true },
    province: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    email: { type: String, default: '', trim: true },
    cell: { type: String, default: '', trim: true },

    // FBR sandbox token — issued per seller NTN by FBR. Attached to this company's
    // invoices when calling the bridge so FBR accepts the seller/token pairing.
    fbrSandboxToken: { type: String, default: '', trim: true },

    // Business / branches
    branches: { type: [BranchSchema], default: [] },

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

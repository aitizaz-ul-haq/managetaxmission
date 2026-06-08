import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema({
  itemSNo: { type: Number },
  itemDescription: { type: String, required: true, trim: true },
  hsCode: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  saleValue: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  uom: { type: String, default: '' },
  saleType: { type: String, default: '' },
  sroScheduleNo: { type: String, default: '' },
  sroItemSerialNo: { type: String, default: '' },
});

const SubmissionSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    submissionType: { type: String, default: 'sales_tax_fed' },
    taxPeriodMonth: { type: Number, required: true },
    taxPeriodYear: { type: Number, required: true },
    invoiceType: { type: String, default: '' },
    invoiceDate: { type: String, default: '' },
    invoiceNumber: { type: String, default: '' },
    sellerBusinessName: { type: String, default: '' },
    sellerNTN: { type: String, default: '' },
    sellerProvince: { type: String, default: '' },
    sellerAddress: { type: String, default: '' },
    buyerBusinessName: { type: String, default: '' },
    buyerNTN: { type: String, default: '' },
    buyerCNIC: { type: String, default: '' },
    buyerProvince: { type: String, default: '' },
    buyerAddress: { type: String, default: '' },
    buyerType: { type: String, default: '' },
    totalSaleValue: { type: Number, default: 0 },
    totalTaxAmount: { type: Number, default: 0 },
    totalBillAmount: { type: Number, default: 0 },
    itemList: [ItemSchema],
    status: {
      type: String,
      enum: ['draft', 'validated', 'ready_for_submission', 'submitted', 'failed'],
      default: 'draft',
    },
    validationStatus: {
      type: String,
      enum: ['pending', 'valid', 'invalid'],
      default: 'pending',
    },
    validationErrors: [{ type: String }],
    fbrPayload: { type: mongoose.Schema.Types.Mixed, default: null },
    fbrResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.Submission || mongoose.model('Submission', SubmissionSchema);

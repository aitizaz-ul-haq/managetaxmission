import mongoose from 'mongoose';

const InvoiceItemSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    itemDescription: { type: String, required: true, trim: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

InvoiceItemSchema.index({ companyId: 1, status: 1 });

export default mongoose.models.InvoiceItem || mongoose.model('InvoiceItem', InvoiceItemSchema);

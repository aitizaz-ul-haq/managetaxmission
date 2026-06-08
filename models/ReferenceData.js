import mongoose from 'mongoose';

const ReferenceDataSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: [
        'province',
        'invoice_type',
        'buyer_type',
        'tax_rate',
        'hs_code',
        'sale_type',
        'document_type',
        'uom',
        'sro_schedule',
      ],
    },
    label: { type: String, required: true, trim: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    extraData: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default mongoose.models.ReferenceData || mongoose.model('ReferenceData', ReferenceDataSchema);

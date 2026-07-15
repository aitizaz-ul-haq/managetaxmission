import mongoose from 'mongoose';

/**
 * Stores the result of an FBR bridge validate/submit call.
 * Field shape of `fbrResponse` is intentionally Mixed — we do not yet know the
 * exact receipt fields the real FBR API returns, so we keep the full envelope.
 */
const FbrReceiptSchema = new mongoose.Schema(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    submissionRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', default: null },

    // What we sent to the bridge
    submissionId: { type: String, default: '' },
    action: { type: String, enum: ['validate', 'submit'], default: 'submit' },
    invoicePayload: { type: mongoose.Schema.Types.Mixed, default: null },

    // What the bridge returned
    success: { type: Boolean, default: false },
    mock: { type: Boolean, default: false },
    environment: { type: String, default: '' },
    requestId: { type: String, default: '' },
    httpStatus: { type: Number, default: null },
    fbrResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    errorCode: { type: String, default: '' },
    errorMessage: { type: String, default: '' },

    // Full unmodified envelope for future field extraction
    rawEnvelope: { type: mongoose.Schema.Types.Mixed, default: null },
    receivedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.models.FbrReceipt || mongoose.model('FbrReceipt', FbrReceiptSchema);

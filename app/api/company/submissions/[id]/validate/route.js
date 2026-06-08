import { NextResponse } from 'next/server';
import connectDB from '../../../../../../lib/mongodb';
import Submission from '../../../../../../models/Submission';
import { requireCompanyUser } from '../../../../../../lib/auth/requireCompanyUser';
import { validateSubmission } from '../../../../../../lib/validators/submissionValidator';
import { calculateInvoiceTotals } from '../../../../../../lib/taxmission/calculateInvoiceTotals';

export async function POST(request, { params }) {
  const { error, user } = await requireCompanyUser(request);
  if (error) return error;

  await connectDB();

  const submission = await Submission.findOne({ _id: params.id, companyId: user.companyId });
  if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });

  // Recalculate to ensure totals are correct
  const { itemList, totalSaleValue, totalTaxAmount, totalBillAmount } = calculateInvoiceTotals(submission.itemList);
  submission.itemList = itemList;
  submission.totalSaleValue = totalSaleValue;
  submission.totalTaxAmount = totalTaxAmount;
  submission.totalBillAmount = totalBillAmount;

  // Run validation
  const errors = validateSubmission(submission.toObject());

  // Check for duplicate invoice number within same company
  if (!errors.length && submission.invoiceNumber) {
    const duplicate = await Submission.findOne({
      companyId: user.companyId,
      invoiceNumber: submission.invoiceNumber,
      _id: { $ne: submission._id },
    });
    if (duplicate) errors.push('Invoice number must be unique per company');
  }

  if (errors.length) {
    submission.validationStatus = 'invalid';
    submission.validationErrors = errors;
    submission.status = 'draft';
  } else {
    submission.validationStatus = 'valid';
    submission.validationErrors = [];
    submission.status = 'validated';
  }

  await submission.save();

  return NextResponse.json({
    submission: submission.toObject(),
    valid: !errors.length,
    errors,
  });
}

import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import Submission from '../../../../../models/Submission';
import { requireCompanyUser } from '../../../../../lib/auth/requireCompanyUser';
import { calculateInvoiceTotals } from '../../../../../lib/taxmission/calculateInvoiceTotals';

export async function GET(request, { params }) {
  const { error, user } = await requireCompanyUser(request);
  if (error) return error;

  await connectDB();
  const submission = await Submission.findOne({
    _id: params.id,
    companyId: user.companyId,
  }).lean();

  if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  return NextResponse.json({ submission });
}

export async function PUT(request, { params }) {
  const { error, user } = await requireCompanyUser(request);
  if (error) return error;

  const body = await request.json();

  // Recalculate totals on backend
  const { itemList, totalSaleValue, totalTaxAmount, totalBillAmount } = calculateInvoiceTotals(body.itemList || []);

  await connectDB();
  const submission = await Submission.findOneAndUpdate(
    { _id: params.id, companyId: user.companyId },
    {
      ...body,
      companyId: user.companyId,
      itemList,
      totalSaleValue,
      totalTaxAmount,
      totalBillAmount,
    },
    { new: true, runValidators: true }
  ).lean();

  if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  return NextResponse.json({ submission });
}

export async function DELETE(request, { params }) {
  const { error, user } = await requireCompanyUser(request);
  if (error) return error;

  await connectDB();
  const submission = await Submission.findOneAndDelete({
    _id: params.id,
    companyId: user.companyId,
  });

  if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}

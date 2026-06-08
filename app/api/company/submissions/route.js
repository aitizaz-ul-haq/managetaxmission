import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Submission from '../../../../models/Submission';
import { requireCompanyUser } from '../../../../lib/auth/requireCompanyUser';
import { calculateInvoiceTotals } from '../../../../lib/taxmission/calculateInvoiceTotals';

export async function GET(request) {
  const { error, user } = await requireCompanyUser(request);
  if (error) return error;

  await connectDB();
  const submissions = await Submission.find({ companyId: user.companyId })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ submissions });
}

export async function POST(request) {
  const { error, user } = await requireCompanyUser(request);
  if (error) return error;

  const body = await request.json();

  // Always recalculate totals on backend
  const { itemList, totalSaleValue, totalTaxAmount, totalBillAmount } = calculateInvoiceTotals(body.itemList || []);

  await connectDB();

  const submission = await Submission.create({
    ...body,
    companyId: user.companyId, // Always from JWT, never from body
    createdBy: user.userId,
    itemList,
    totalSaleValue,
    totalTaxAmount,
    totalBillAmount,
    status: body.status || 'draft',
  });

  return NextResponse.json({ submission }, { status: 201 });
}

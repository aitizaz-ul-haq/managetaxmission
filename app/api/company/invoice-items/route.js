import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import InvoiceItem from '../../../../models/InvoiceItem';
import { requireCompanyUser } from '../../../../lib/auth/requireCompanyUser';

// GET  /api/company/invoice-items  — list all active items for this company
export async function GET(request) {
  const { error, user } = await requireCompanyUser(request);
  if (error) return error;

  await connectDB();
  const items = await InvoiceItem.find({ companyId: user.companyId, status: 'active' })
    .sort({ itemDescription: 1 })
    .lean();

  return NextResponse.json({ items });
}

// POST /api/company/invoice-items  — create a new invoice item
export async function POST(request) {
  const { error, user } = await requireCompanyUser(request);
  if (error) return error;

  const { itemDescription } = await request.json();
  if (!itemDescription?.trim()) {
    return NextResponse.json({ error: 'Item name is required' }, { status: 400 });
  }

  await connectDB();

  const existing = await InvoiceItem.findOne({
    companyId: user.companyId,
    itemDescription: { $regex: `^${itemDescription.trim()}$`, $options: 'i' },
    status: 'active',
  });
  if (existing) {
    return NextResponse.json({ error: 'An item with this name already exists' }, { status: 409 });
  }

  const item = await InvoiceItem.create({
    companyId: user.companyId,
    createdBy: user.userId,
    itemDescription: itemDescription.trim(),
  });

  return NextResponse.json({ item }, { status: 201 });
}

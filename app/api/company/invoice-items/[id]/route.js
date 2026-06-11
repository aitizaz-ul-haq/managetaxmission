import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import InvoiceItem from '../../../../../models/InvoiceItem';
import { requireCompanyUser } from '../../../../../lib/auth/requireCompanyUser';

// PUT /api/company/invoice-items/[id]  — update item description
export async function PUT(request, { params }) {
  const { error, user } = await requireCompanyUser(request);
  if (error) return error;

  const { itemDescription } = await request.json();
  if (!itemDescription?.trim()) {
    return NextResponse.json({ error: 'Item name is required' }, { status: 400 });
  }

  await connectDB();
  const item = await InvoiceItem.findOneAndUpdate(
    { _id: params.id, companyId: user.companyId },
    { itemDescription: itemDescription.trim() },
    { new: true }
  ).lean();

  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  return NextResponse.json({ item });
}

// DELETE /api/company/invoice-items/[id]  — soft-delete (set inactive)
export async function DELETE(request, { params }) {
  const { error, user } = await requireCompanyUser(request);
  if (error) return error;

  await connectDB();
  const item = await InvoiceItem.findOne({ _id: params.id, companyId: user.companyId });
  if (!item) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  item.status = 'inactive';
  await item.save();

  return NextResponse.json({ message: 'Item deleted' });
}

import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import InvoiceItem from '../../../../../models/InvoiceItem';
import { requireCompanyUser } from '../../../../../lib/auth/requireCompanyUser';

const VALID_TYPES = ['Unregistered', 'Registered', 'Unrecognised', 'Retail Consumer'];

// PUT /api/company/invoice-items/[id]  — update item
export async function PUT(request, { params }) {
  const { error, user } = await requireCompanyUser(request);
  if (error) return error;

  const { registrationNo, itemDescription, productDescription, buyerAddress, type } = await request.json();

  if (!registrationNo?.trim()) {
    return NextResponse.json({ error: 'Registration No is required' }, { status: 400 });
  }
  if (!itemDescription?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  const itemType = type?.trim() || 'Unregistered';
  if (!VALID_TYPES.includes(itemType)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  await connectDB();
  const item = await InvoiceItem.findOneAndUpdate(
    { _id: params.id, companyId: user.companyId },
    {
      registrationNo: registrationNo.trim(),
      itemDescription: itemDescription.trim(),
      productDescription: productDescription?.trim() || '',
      buyerAddress: buyerAddress?.trim() || '',
      type: itemType,
    },
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

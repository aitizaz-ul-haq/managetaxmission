import { NextResponse } from 'next/server';
import connectDB from '../../../../../lib/mongodb';
import InvoiceItem from '../../../../../models/InvoiceItem';
import { requireCompanyUser } from '../../../../../lib/auth/requireCompanyUser';

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

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

const VALID_TYPES = ['Unregistered', 'Registered', 'Unrecognised', 'Retail Consumer'];
const PROVINCE_OPTIONS = ['Capital Territory', 'Punjab', 'Sindh', 'KPK', 'Balochistan', 'AJK', 'Gilgit-Baltistan'];

// POST /api/company/invoice-items  — create a new invoice item
export async function POST(request) {
  const { error, user } = await requireCompanyUser(request);
  if (error) return error;

  const {
    registrationNo,
    itemDescription,
    productDescription,
    buyerAddress,
    type,
    saleOriginProvinceOfSupplier,
    destinationOfSupply,
  } = await request.json();

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
  const saleProvince = saleOriginProvinceOfSupplier?.trim() || '';
  const destinationProvince = destinationOfSupply?.trim() || '';
  if (saleProvince && !PROVINCE_OPTIONS.includes(saleProvince)) {
    return NextResponse.json({ error: 'Invalid sale origin province of supplier' }, { status: 400 });
  }
  if (destinationProvince && !PROVINCE_OPTIONS.includes(destinationProvince)) {
    return NextResponse.json({ error: 'Invalid destination of supply' }, { status: 400 });
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
    registrationNo: registrationNo.trim(),
    itemDescription: itemDescription.trim(),
    productDescription: productDescription?.trim() || '',
    buyerAddress: buyerAddress?.trim() || '',
    saleOriginProvinceOfSupplier: saleProvince,
    destinationOfSupply: destinationProvince,
    type: itemType,
  });

  return NextResponse.json({ item }, { status: 201 });
}

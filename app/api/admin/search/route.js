import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Company from '../../../../models/Company';
import User from '../../../../models/User';
import Submission from '../../../../models/Submission';
import { requireAdmin } from '../../../../lib/auth/requireAdmin';

export const dynamic = 'force-dynamic';

function searchJson(body, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(request) {
  try {
    const { error } = await requireAdmin(request);
    if (error) {
      error.headers.set('Cache-Control', 'no-store');
      return error;
    }

    const query = (new URL(request.url).searchParams.get('q') || '').trim();
    if (query.length > 100) return searchJson({ error: 'Search must contain at most 100 characters' }, 400);
    if (query.length < 2) return searchJson({ results: [] });

    // Search user text literally, including characters that have regex meaning.
    const literalQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchFields = (fields) => ({
      $or: fields.map((field) => ({ [field]: { $regex: literalQuery, $options: 'i' } })),
    });

    await connectDB();
    const [companies, users, submissions] = await Promise.all([
      Company.find(searchFields(['companyName', 'legalName', 'ntn']))
        .sort({ companyName: 1, _id: 1 })
        .limit(5)
        .select('companyName legalName ntn')
        .lean(),
      User.find({ role: 'company_user', ...searchFields(['fullName', 'email']) })
        .sort({ fullName: 1, _id: 1 })
        .limit(5)
        .select('fullName email')
        .lean(),
      Submission.find(searchFields(['invoiceNumber', 'buyerBusinessName', 'sellerBusinessName']))
        .sort({ updatedAt: -1, _id: 1 })
        .limit(5)
        .select('invoiceNumber buyerBusinessName sellerBusinessName')
        .lean(),
    ]);

    return searchJson({
      results: [
        ...companies.map((company) => ({
          id: String(company._id),
          type: 'company',
          title: company.companyName || company.legalName || 'Unnamed company',
          description: company.ntn ? `NTN: ${company.ntn}` : company.legalName || 'Company',
          href: `/admin/companies/${company._id}`,
        })),
        ...users.map((user) => ({
          id: String(user._id),
          type: 'user',
          title: user.fullName || user.email || 'User',
          description: user.email || 'Company user',
          href: `/admin/users/${user._id}`,
        })),
        ...submissions.map((submission) => ({
          id: String(submission._id),
          type: 'submission',
          title: submission.invoiceNumber || `Submission ${String(submission._id).slice(-8)}`,
          description: [submission.sellerBusinessName, submission.buyerBusinessName].filter(Boolean).join(' → ') || 'Tax submission',
          href: `/admin/submissions/${submission._id}`,
        })),
      ],
    });
  } catch (error) {
    console.error('Failed to search admin records:', error);
    return searchJson({ error: 'Unable to search records' }, 500);
  }
}

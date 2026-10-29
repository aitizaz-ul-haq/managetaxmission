import connectDB from '../../../../lib/mongodb';
import Company from '../../../../models/Company';
import { getSupervisorAccess, supervisorJson } from '../../../../lib/supervisor/readAccess';

export const dynamic = 'force-dynamic';

// Allowlist company information so current and future integration secrets stay server-side.
const PROFILE_FIELDS = [
  'registrationNo', 'referenceNo', 'salesTaxRegistered', 'salesTaxRegisteredDate',
  'category', 'ppRegIncNo', 'registeredOn', 'taxOffice', 'incomeTaxStatus', 'salesTaxStatus',
  'companyName', 'legalName', 'ntn', 'strn', 'province', 'address', 'email', 'cell',
  'branches', 'status', 'createdAt', 'updatedAt',
].join(' ');

export async function GET(request) {
  try {
    const { error, companyId } = await getSupervisorAccess(request);
    if (error) return error;

    await connectDB();
    const company = await Company.findById(companyId).select(PROFILE_FIELDS).lean();
    if (!company) return supervisorJson({ error: 'Company not found' }, 404);

    return supervisorJson({ company });
  } catch (error) {
    console.error('Failed to load supervisor profile:', error);
    return supervisorJson({ error: 'Unable to load profile' }, 500);
  }
}

import User from '../../models/User';
import { hashPassword } from '../auth/hashPassword';

/**
 * Ensures a company has exactly one accountant (login user) and one supervisor
 * (reporting-only contact) user record. Creates them if missing, otherwise
 * updates the existing records. Returns { errors } when an email collides with
 * another user.
 *
 * @param {string} companyId - The company these personnel belong to.
 * @param {object} data - { accountant, supervisor } objects from the request.
 * @param {string|null} adminUserId - Id of the admin performing the action.
 */
export async function syncCompanyPersonnel(companyId, data, adminUserId = null) {
  const errors = [];
  const accountant = data.accountant || {};
  const supervisor = data.supervisor || {};

  async function emailTakenByOther(email, excludeId) {
    if (!email) return false;
    const query = { email: email.toLowerCase().trim() };
    if (excludeId) query._id = { $ne: excludeId };
    const found = await User.findOne(query).lean();
    return Boolean(found);
  }

  // Locate any existing personnel for this company.
  const existingAccountant = await User.findOne({ companyId, personnelType: 'accountant' });
  const existingSupervisor = await User.findOne({ companyId, personnelType: 'supervisor' });

  if (await emailTakenByOther(accountant.email, existingAccountant?._id)) {
    errors.push('Accountant email is already in use by another user');
  }
  if (await emailTakenByOther(supervisor.email, existingSupervisor?._id)) {
    errors.push('Supervisor email is already in use by another user');
  }
  if (errors.length) return { errors };

  // --- Accountant (can log in) ---
  if (existingAccountant) {
    existingAccountant.fullName = accountant.fullName;
    existingAccountant.email = accountant.email.toLowerCase().trim();
    existingAccountant.phone = accountant.phone || '';
    if (accountant.status) existingAccountant.status = accountant.status;
    if (accountant.password && accountant.password.trim()) {
      existingAccountant.password = await hashPassword(accountant.password);
    }
    await existingAccountant.save();
  } else {
    await User.create({
      fullName: accountant.fullName,
      email: accountant.email.toLowerCase().trim(),
      phone: accountant.phone || '',
      password: accountant.password ? await hashPassword(accountant.password) : '',
      role: 'company_user',
      personnelType: 'accountant',
      companyId,
      status: accountant.status || 'active',
      createdBy: adminUserId,
    });
  }

  // --- Supervisor (reporting only, no login) ---
  if (existingSupervisor) {
    existingSupervisor.fullName = supervisor.fullName;
    existingSupervisor.email = supervisor.email.toLowerCase().trim();
    existingSupervisor.phone = supervisor.phone || '';
    if (supervisor.status) existingSupervisor.status = supervisor.status;
    await existingSupervisor.save();
  } else {
    await User.create({
      fullName: supervisor.fullName,
      email: supervisor.email.toLowerCase().trim(),
      phone: supervisor.phone || '',
      password: '',
      role: 'company_user',
      personnelType: 'supervisor',
      companyId,
      status: supervisor.status || 'active',
      createdBy: adminUserId,
    });
  }

  return { errors: [] };
}

export function isSupervisor(user) {
  return user?.role === 'company_user' && user.personnelType === 'supervisor';
}

export function getDashboardPath(user) {
  if (!user) return '/login';
  if (user.role === 'super_admin') return '/admin/dashboard';
  if (isSupervisor(user)) return '/supervisor/dashboard';
  return '/company/dashboard';
}

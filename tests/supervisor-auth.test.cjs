const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert/strict');
const test = require('node:test');
const root = path.resolve(__dirname, '..');
let checks = 0;

async function load(file, dependencies = {}, globals = {}) {
  const context = vm.createContext({ console, process: { env: { NODE_ENV: 'test' } }, ...globals });
  const module = new vm.SourceTextModule(fs.readFileSync(`${root}/${file}`, 'utf8'), { context });
  await module.link((specifier) => {
    if (!(specifier in dependencies)) throw new Error(`Unexpected import: ${specifier}`);
    const exports = dependencies[specifier];
    return new vm.SyntheticModule(Object.keys(exports), function () {
      for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
    }, { context });
  });
  await module.evaluate();
  return module.namespace;
}

function check(condition, message) { assert.ok(condition, message); checks++; }
const response = (body, options = {}) => ({ body, status: options.status || 200, headers: new Map(Object.entries(options.headers || {})), cookies: { set() {} } });

test('supervisor authentication, current identity, guards, and credential provisioning', async () => {
  const { validateUser } = await load('lib/validators/userValidator.js');
  const person = { fullName: 'Supervisor', email: 'supervisor@example.test', role: 'company_user', personnelType: 'supervisor', companyId: 'company-1' };
  check(validateUser(person, true).includes('Password is required'), 'New supervisors must have a password');
  check(validateUser({ ...person, password: 'short' }, true).includes('Password must be at least 8 characters'), 'Short new supervisor passwords fail');
  check(validateUser({ ...person, password: 'safe-password' }, true).length === 0, 'A valid supervisor account passes');
  check(validateUser({ ...person, password: 'short' }, false).includes('Password must be at least 8 characters'), 'Short updated passwords fail');
  check(validateUser({ ...person, password: '' }, false).length === 0, 'Blank updated passwords preserve existing credentials');

  const { validateCompany } = await load('lib/validators/companyValidator.js');
  const companyForm = { companyName: 'Company', legalName: 'Company', ntn: '1234567', province: 'Punjab', address: 'Address', accountant: { fullName: 'Accountant', email: 'accountant@example.test' }, supervisor: { fullName: 'Supervisor', email: 'supervisor@example.test' } };
  check(validateCompany({ ...companyForm, supervisor: { ...companyForm.supervisor, password: 'short' } }).includes('Supervisor password must be at least 8 characters'), 'Company supervisor password validation is enforced');
  check(validateCompany(companyForm).length === 0, 'Company edits allow unchanged passwords');

  let current = { userId: 'user-1', role: 'company_user', personnelType: 'supervisor', companyId: 'company-1' };
  const guardDependencies = { 'next/server': { NextResponse: { json: response } }, './getCurrentUser': { getCurrentUser: async () => current } };
  const { requireCompanyUser } = await load('lib/auth/requireCompanyUser.js', guardDependencies);
  const { requireSupervisor } = await load('lib/auth/requireSupervisor.js', guardDependencies);
  check((await requireCompanyUser()).error?.status === 403, 'Supervisors cannot use accountant APIs');
  check((await requireSupervisor()).user === current, 'Company supervisors can use reporting APIs');
  current = { ...current, personnelType: 'accountant' };
  check((await requireSupervisor()).error?.status === 403, 'Accountants cannot use supervisor APIs');
  check((await requireCompanyUser()).user === current, 'Accountant APIs remain accessible');
  current = { ...current, personnelType: null };
  check((await requireCompanyUser()).user === current, 'Legacy company users remain accessible');
  current = { ...current, personnelType: 'supervisor', companyId: null };
  check((await requireSupervisor()).error?.status === 403, 'Supervisors must be company scoped');
  current = null;
  check((await requireSupervisor()).error?.status === 403, 'Anonymous supervisor requests fail');

  let token = 'token';
  let databaseError = null;
  let dbUser = { _id: 'user-1', fullName: 'Supervisor', email: 'supervisor@example.test', role: 'company_user', personnelType: 'supervisor', companyId: 'company-1', status: 'active', password: 'must-not-leak' };
  let dbCompany = { companyName: 'Company', status: 'active', fbrProductionToken: 'must-not-leak' };
  const { getCurrentUser } = await load('lib/auth/getCurrentUser.js', {
    'next/headers': { cookies: async () => ({ get: () => token ? { value: token } : undefined }) },
    './jwt': { verifyToken: () => ({ userId: 'user-1', role: 'super_admin', personnelType: 'accountant' }) },
    '../mongodb': { default: async () => { if (databaseError) throw databaseError; } },
    '../../models/User': { default: { findById: () => ({ select: () => ({ lean: async () => dbUser }) }) } },
    '../../models/Company': { default: { findById: () => ({ select: () => ({ lean: async () => dbCompany }) }) } },
  });
  const identity = await getCurrentUser();
  check(identity.role === 'company_user' && identity.personnelType === 'supervisor', 'Current DB roles override stale token claims');
  check(!('password' in identity) && !('fbrProductionToken' in identity), 'Current identity contains no credentials');
  databaseError = new Error('Database unavailable');
  await assert.rejects(getCurrentUser, databaseError, 'Operational database failures propagate instead of appearing unauthenticated');
  checks++;
  databaseError = null;
  dbUser = { ...dbUser, status: 'inactive' };
  check(await getCurrentUser() === null, 'Disabled users lose session access');
  dbUser = { ...dbUser, status: 'active' };
  dbCompany = { ...dbCompany, status: 'suspended' };
  check(await getCurrentUser() === null, 'Suspended companies lose session access');
  dbCompany = null;
  check(await getCurrentUser() === null, 'Deleted companies lose session access');
  dbUser = null;
  check(await getCurrentUser() === null, 'Deleted users lose session access');
  token = null;
  check(await getCurrentUser() === null, 'Missing sessions return no identity');

  let sessionIdentity = identity;
  let sessionError = null;
  let sessionErrorLogged = false;
  const { GET: currentUserResponse } = await load('app/api/auth/me/route.js', {
    'next/server': { NextResponse: { json: response } },
    '../../../../lib/auth/getCurrentUser': { getCurrentUser: async () => {
      if (sessionError) throw sessionError;
      return sessionIdentity;
    } },
  }, { console: { error: () => { sessionErrorLogged = true; } } });
  let sessionResponse = await currentUserResponse();
  check(sessionResponse.status === 200 && sessionResponse.body.user === identity && sessionResponse.headers.get('Cache-Control') === 'no-store', 'Valid identity responses are not cached');
  sessionIdentity = null;
  sessionResponse = await currentUserResponse();
  check(sessionResponse.status === 401 && sessionResponse.headers.get('Cache-Control') === 'no-store', 'Missing sessions remain unauthorized and uncached');
  sessionError = new Error('Private database connection details');
  sessionResponse = await currentUserResponse();
  check(sessionResponse.status === 503 && sessionErrorLogged && sessionResponse.headers.get('Cache-Control') === 'no-store' && !JSON.stringify(sessionResponse.body).includes('Private database'), 'Session database failures return a logged, uncached generic service error');

  let records = {};
  let writes = [];
  const { syncCompanyPersonnel } = await load('lib/personnel/syncCompanyPersonnel.js', {
    '../../models/User': { default: {
      findOne: (query) => query.personnelType ? Promise.resolve(records[query.personnelType] || null) : { lean: async () => null },
      create: async (data) => { writes.push(data); return data; },
    } },
    '../auth/hashPassword': { hashPassword: async (password) => `hashed:${password}` },
  });
  let personnel = { accountant: { ...companyForm.accountant, password: 'accountant-pass' }, supervisor: companyForm.supervisor };
  check((await syncCompanyPersonnel('company-1', personnel)).errors.includes('Supervisor password is required') && writes.length === 0, 'Missing new supervisor password fails before personnel writes');
  personnel = { ...personnel, supervisor: { ...personnel.supervisor, password: 'short' } };
  check((await syncCompanyPersonnel('company-1', personnel)).errors.includes('Supervisor password must be at least 8 characters') && writes.length === 0, 'Short password fails before personnel writes');
  personnel.supervisor.password = 'supervisor-pass';
  check((await syncCompanyPersonnel('company-1', personnel)).errors.length === 0 && writes[1].password === 'hashed:supervisor-pass', 'New supervisor passwords are hashed');
  records = {
    accountant: { _id: 'accountant-1', password: 'old-accountant-hash', save: async () => {} },
    supervisor: { _id: 'supervisor-1', password: '', save: async () => {} },
  };
  await syncCompanyPersonnel('company-1', personnel);
  check(records.supervisor.password === 'hashed:supervisor-pass', 'Existing reporting contacts can receive login credentials');
  personnel.supervisor.password = '';
  await syncCompanyPersonnel('company-1', personnel);
  check(records.supervisor.password === 'hashed:supervisor-pass', 'Blank supervisor password edits preserve the hash');

  let loginUser = { _id: 'supervisor-1', fullName: 'Supervisor', email: 'supervisor@example.test', role: 'company_user', personnelType: 'supervisor', companyId: 'company-1', status: 'active', password: 'existing-hash' };
  let loginCompany = { companyName: 'Company', status: 'active' };
  let validPassword = true;
  const { POST } = await load('app/api/auth/login/route.js', {
    'next/server': { NextResponse: { json: response } },
    '../../../../lib/mongodb': { default: async () => {} },
    '../../../../models/User': { default: { findOne: async () => loginUser, findByIdAndUpdate: async () => {} } },
    '../../../../models/Company': { default: { findById: () => ({ select: () => ({ lean: async () => loginCompany }) }) } },
    '../../../../lib/auth/hashPassword': { verifyPassword: async () => validPassword },
    '../../../../lib/auth/jwt': { signToken: () => 'signed-token' },
  });
  const request = { json: async () => ({ email: 'supervisor@example.test', password: 'supervisor-pass' }) };
  const login = await POST(request);
  check(login.status === 200 && login.body.user.personnelType === 'supervisor' && !('password' in login.body.user), 'Supervisor login returns safe routing identity');
  loginUser.password = '';
  check((await POST(request)).status === 401, 'Legacy supervisors without admin-set passwords cannot log in');
  loginUser.password = 'existing-hash';
  validPassword = false;
  check((await POST(request)).status === 401, 'Invalid supervisor passwords fail');
  validPassword = true;
  loginCompany.status = 'inactive';
  check((await POST(request)).status === 403, 'Inactive companies cannot log in');
  console.log(`Passed ${checks} supervisor auth and provisioning checks.`);
});

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const { NextResponse } = require('next/server');

const ROUTE = path.resolve(__dirname, '../app/api/admin/search/route.js');

async function createHarness(options = {}) {
  const calls = [];
  const state = {
    access: { user: { role: 'super_admin' } },
    companies: [{
      _id: 'company-1', companyName: 'Acme Tax Services', legalName: 'Acme Legal', ntn: '1234567',
      fbrProductionToken: 'private-production-token', futureSecret: 'private-secret',
    }],
    users: [
      { _id: 'user-1', fullName: 'Acme Supervisor', email: 'supervisor@acme.test', role: 'company_user', passwordHash: 'private-password-hash' },
      { _id: 'admin-1', fullName: 'Acme Admin', email: 'admin@acme.test', role: 'super_admin' },
    ],
    submissions: [{
      _id: 'submission-1', invoiceNumber: 'ACME-001', buyerBusinessName: 'Buyer', sellerBusinessName: 'Acme Seller',
      updatedAt: '2026-10-19T12:00:00Z', fbrPayload: { token: 'private-payload' },
    }],
    ...options,
  };
  const context = vm.createContext({ console: { error() {} }, URL });
  const externalModules = new Map();
  function external(name, exports) {
    if (!externalModules.has(name)) externalModules.set(name, new vm.SyntheticModule(Object.keys(exports), function () {
      for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
    }, { context }));
    return externalModules.get(name);
  }
  function matches(record, filter) {
    return Object.entries(filter).every(([field, expected]) => {
      if (field === '$or') return expected.some((condition) => matches(record, condition));
      if (expected && typeof expected === 'object' && '$regex' in expected) {
        return new RegExp(expected.$regex, expected.$options).test(record[field] || '');
      }
      return record[field] === expected;
    });
  }
  function find(model, filter) {
    const call = { model, filter };
    calls.push(call);
    let records = state[{ Company: 'companies', User: 'users', Submission: 'submissions' }[model]].filter((record) => matches(record, filter));
    const query = {
      sort(fields) {
        call.sort = fields;
        records.sort((a, b) => {
          for (const [key, direction] of Object.entries(fields)) {
            if (a[key] > b[key]) return direction;
            if (a[key] < b[key]) return -direction;
          }
          return 0;
        });
        return query;
      },
      limit(value) { call.limit = value; records = records.slice(0, value); return query; },
      select(fields) { call.selection = fields; return query; },
      async lean() {
        const fields = ['_id', ...call.selection.split(/\s+/)];
        return records.map((record) => Object.fromEntries(fields.filter((field) => Object.hasOwn(record, field)).map((field) => [field, record[field]])));
      },
    };
    return query;
  }

  const route = new vm.SourceTextModule(fs.readFileSync(ROUTE, 'utf8'), { identifier: ROUTE, context });
  await route.link((specifier) => {
    if (specifier === 'next/server') return external('next/server', { NextResponse });
    if (specifier.endsWith('/auth/requireAdmin')) return external('auth', { requireAdmin: async () => state.access });
    if (specifier.endsWith('/mongodb')) return external('db', { default: async () => {
      calls.push({ connect: true });
      if (state.databaseError) throw state.databaseError;
    } });
    for (const model of ['Company', 'User', 'Submission']) {
      if (specifier.endsWith(`/models/${model}`)) return external(model, { default: {
        find(filter) { return find(model, filter); },
      } });
    }
    throw new Error(`Unexpected dependency: ${specifier}`);
  });
  await route.evaluate();
  return {
    state, calls, route: route.namespace,
    get(query = '') { return route.namespace.GET(new Request(`http://localhost/api/admin/search?q=${encodeURIComponent(query)}`)); },
  };
}

function assertNoStore(response) {
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
}

test('admin search is GET-only, dynamic, and rejects unauthorized requests before searching', async () => {
  for (const status of [401, 403]) {
    const harness = await createHarness({ access: { error: NextResponse.json({ error: 'Denied' }, { status }) } });
    assert.deepEqual(Object.keys(harness.route).filter((key) => /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/.test(key)), ['GET']);
    assert.equal(harness.route.dynamic, 'force-dynamic');
    const response = await harness.get('acme');
    assert.equal(response.status, status);
    assertNoStore(response);
    assert.deepEqual(harness.calls, []);
  }
});

test('empty, whitespace, and single-character searches return no results without database queries', async () => {
  for (const query of ['', '  ', 'a', '  a  ']) {
    const harness = await createHarness();
    const response = await harness.get(query);
    assert.equal(response.status, 200);
    assertNoStore(response);
    assert.deepEqual(await response.json(), { results: [] });
    assert.deepEqual(harness.calls, []);
  }
});

test('queries above 100 characters are rejected before database access', async () => {
  const harness = await createHarness();
  const response = await harness.get('a'.repeat(101));
  assert.equal(response.status, 400);
  assertNoStore(response);
  assert.deepEqual(harness.calls, []);
});

test('search trims text, matches case-insensitively, and returns navigable safe summaries', async () => {
  const harness = await createHarness();
  const response = await harness.get('  aCMe  ');
  assert.equal(response.status, 200);
  assertNoStore(response);
  const responseText = await response.text();
  assert.deepEqual(JSON.parse(responseText).results, [
    { id: 'company-1', type: 'company', title: 'Acme Tax Services', description: 'NTN: 1234567', href: '/admin/companies/company-1' },
    { id: 'user-1', type: 'user', title: 'Acme Supervisor', description: 'supervisor@acme.test', href: '/admin/users/user-1' },
    { id: 'submission-1', type: 'submission', title: 'ACME-001', description: 'Acme Seller → Buyer', href: '/admin/submissions/submission-1' },
  ]);
  assert.doesNotMatch(responseText, /private-|passwordHash|fbrProductionToken|fbrPayload|futureSecret/);
  const queries = harness.calls.filter((call) => call.model);
  assert.equal(queries.length, 3);
  for (const query of queries) {
    assert.equal(query.limit, 5);
    assert.ok(query.selection, 'Every query must explicitly project safe fields');
    assert.ok(query.sort._id, 'Every result group must have a stable tie-breaker');
  }
  const userQuery = queries.find((query) => query.model === 'User');
  assert.equal(userQuery.filter.role, 'company_user');
  assert.equal(userQuery.selection, 'fullName email');
});

test('all intended company and submission fields participate in literal search', async () => {
  for (const [query, expectedType] of [
    ['Tax Services', 'company'], ['Acme Legal', 'company'], ['1234567', 'company'],
    ['supervisor@', 'user'], ['Acme Supervisor', 'user'],
    ['ACME-001', 'submission'], ['Buyer', 'submission'], ['Acme Seller', 'submission'],
  ]) {
    const harness = await createHarness();
    const response = await harness.get(query);
    const body = await response.json();
    assert.ok(body.results.some((result) => result.type === expectedType), query);
  }
});

test('regex characters are escaped and treated as literal input', async () => {
  for (const query of ['.*', 'a+b', '(tax)', '[x]', '^acme$', '\\d+', 'hello?', 'a|b', '{2}']) {
    const harness = await createHarness({ companies: [
      { _id: 'literal', companyName: `Literal ${query} text` },
      { _id: 'other', companyName: 'acme aaab tax x 12345 hello bbb' },
    ], users: [], submissions: [] });
    const response = await harness.get(query);
    assert.equal(response.status, 200, query);
    const body = await response.json();
    assert.deepEqual(body.results.map((result) => result.id), ['literal'], query);
  }
});

test('each type is stably sorted and capped at five, with no more than fifteen results', async () => {
  const harness = await createHarness({
    companies: Array.from({ length: 8 }, (_, index) => ({ _id: `company-${7 - index}`, companyName: 'Matching company' })),
    users: Array.from({ length: 8 }, (_, index) => ({ _id: `user-${7 - index}`, fullName: 'Matching user', role: 'company_user' })),
    submissions: Array.from({ length: 8 }, (_, index) => ({ _id: `submission-${7 - index}`, invoiceNumber: 'Matching invoice', updatedAt: '2026-10-19' })),
  });
  const response = await harness.get('matching');
  const { results } = await response.json();
  assert.equal(results.length, 15);
  for (const type of ['company', 'user', 'submission']) {
    assert.deepEqual(results.filter((result) => result.type === type).map((result) => result.id),
      Array.from({ length: 5 }, (_, index) => `${type}-${index}`));
  }
});

test('no matches produce an empty uncached result list', async () => {
  const harness = await createHarness();
  const response = await harness.get('NoMatchingRecord');
  assert.equal(response.status, 200);
  assertNoStore(response);
  assert.deepEqual(await response.json(), { results: [] });
});

test('database failures return an uncached generic error', async () => {
  const harness = await createHarness({ databaseError: new Error('database password private-password') });
  const response = await harness.get('acme');
  assert.equal(response.status, 500);
  assertNoStore(response);
  assert.deepEqual(await response.json(), { error: 'Unable to search records' });
});

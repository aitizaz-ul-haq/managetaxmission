const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const { NextResponse } = require('next/server');

const ROOT = path.resolve(__dirname, '..');
const COMPANY_A = '640000000000000000000001';
const COMPANY_B = '640000000000000000000002';

function createHarness(options = {}) {
  const now = new Date(options.now || '2026-10-31T19:00:00Z');
  const calls = [];
  const state = {
    access: { user: { role: 'super_admin' } },
    companies: [
      { _id: COMPANY_A, companyName: 'Alpha', status: 'active', createdAt: new Date('2026-10-31T18:59:59Z'), fbrProductionToken: 'private-company-token' },
      { _id: COMPANY_B, companyName: 'Beta', status: 'inactive', createdAt: new Date('2026-10-31T19:00:00Z') },
    ],
    users: [
      { role: 'super_admin', createdAt: new Date('2026-11-01T00:00:00Z') },
      { role: 'company_user', createdAt: new Date('2026-10-31T18:59:59Z') },
      { role: 'company_user', createdAt: new Date('2026-10-31T19:00:00Z') },
    ],
    submissions: [
      [COMPANY_A, 2026, 1, 'draft', 100],
      [COMPANY_A, 2026, 10, 'submitted', 200],
      [COMPANY_B, 2026, 11, 'ready_for_submission', 300],
      [COMPANY_B, 2026, 11, 'failed', 400],
      [COMPANY_A, 2026, 11, 'validated', 500],
      [COMPANY_A, 2025, 12, 'submitted', 600],
      [COMPANY_B, 2027, 2, 'draft', 700],
    ].map(([companyId, taxPeriodYear, taxPeriodMonth, status, sale], index) => ({
      _id: `submission-${index + 1}`, companyId, taxPeriodYear, taxPeriodMonth, status,
      submissionType: 'sale_tax_fed', invoiceNumber: `INV-${index + 1}`,
      totalSaleValue: sale, totalTaxAmount: sale * 0.16, totalBillAmount: sale * 1.16,
      submittedAt: status === 'submitted' ? `2026-11-0${index + 1}T00:00:00Z` : null,
      updatedAt: `2026-11-0${index + 1}T00:00:00Z`,
      fbrPayload: { secret: 'private-submission-payload' },
    })),
    ...options,
  };

  const matches = (row, filter = {}) => Object.entries(filter).every(([key, value]) => {
    if (key === '$or') return value.some((condition) => matches(row, condition));
    if (value && typeof value === 'object') return Object.entries(value).every(([operator, boundary]) => {
      if (operator === '$gte') return row[key] >= boundary;
      if (operator === '$lt') return row[key] < boundary;
      throw new Error(`Unsupported query operator: ${operator}`);
    });
    return row[key] === value;
  });
  const readPath = (row, field) => field.split('.').reduce((value, key) => (
    Array.isArray(value) ? value.map((entry) => entry?.[key]) : value?.[key]
  ), row);
  function expression(value, row) {
    if (typeof value === 'string' && value.startsWith('$')) return readPath(row, value.slice(1));
    if (!value || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map((entry) => expression(entry, row));
    if (value.$eq) {
      const [left, right] = expression(value.$eq, row);
      return left === right;
    }
    if (value.$and) return expression(value.$and, row).every(Boolean);
    if (value.$cond) {
      const [condition, yes, no] = value.$cond;
      return expression(condition, row) ? expression(yes, row) : expression(no, row);
    }
    if (value.$arrayElemAt) {
      const [array, index] = expression(value.$arrayElemAt, row);
      return array[index];
    }
    if (value.$dateToString) {
      assert.equal(value.$dateToString.format, '%Y-%m');
      const date = expression(value.$dateToString.date, row);
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: value.$dateToString.timezone, year: 'numeric', month: '2-digit',
      }).formatToParts(date);
      return `${parts.find((part) => part.type === 'year').value}-${parts.find((part) => part.type === 'month').value}`;
    }
    if (!Object.keys(value).some((key) => key.startsWith('$'))) {
      return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, expression(entry, row)]));
    }
    throw new Error(`Unsupported aggregate expression: ${JSON.stringify(value)}`);
  }

  function sorted(rows, fields) {
    return [...rows].sort((a, b) => {
      for (const [field, direction] of Object.entries(fields)) {
        if (a[field] > b[field]) return direction;
        if (a[field] < b[field]) return -direction;
      }
      return 0;
    });
  }

  // Evaluate the route's actual read pipelines against fixture records. Unsupported
  // stages fail so accidental mutations or unsupported query changes are visible.
  async function aggregate(model, pipeline) {
      calls.push({ model, pipeline });
      const source = { Company: 'companies', User: 'users', Submission: 'submissions' }[model];
      let rows = state[source].map((row) => ({ ...row }));
      for (const stage of pipeline) {
        if (stage.$match) rows = rows.filter((row) => matches(row, stage.$match));
        else if (stage.$group) {
          const groups = new Map();
          for (const row of rows) {
            const id = expression(stage.$group._id, row);
            const groupKey = JSON.stringify(id);
            if (!groups.has(groupKey)) groups.set(groupKey, { _id: id });
            const group = groups.get(groupKey);
            for (const [field, operation] of Object.entries(stage.$group)) {
              if (field === '_id') continue;
              assert.ok(Object.hasOwn(operation, '$sum'), 'Only numeric aggregation is expected');
              const amount = expression(operation.$sum, row);
              group[field] = (group[field] || 0) + (typeof amount === 'number' ? amount : 0);
            }
          }
          rows = [...groups.values()];
        } else if (stage.$sort) rows = sorted(rows, stage.$sort);
        else if (stage.$limit) rows = rows.slice(0, stage.$limit);
        else if (stage.$lookup) {
          assert.equal(stage.$lookup.from, 'companies');
          rows = rows.map((row) => ({ ...row, [stage.$lookup.as]: state.companies.filter((company) => (
            company[stage.$lookup.foreignField] === row[stage.$lookup.localField]
          )) }));
        } else if (stage.$project) {
          rows = rows.map((row) => Object.fromEntries([
            ['_id', row._id],
            ...Object.entries(stage.$project).map(([key, value]) => [key, value === 1 ? row[key] : expression(value, row)]),
          ]));
        } else throw new Error(`Unsupported aggregate stage: ${JSON.stringify(stage)}`);
      }
      return rows;
  }

  const Submission = {
    aggregate: (pipeline) => aggregate('Submission', pipeline),
    find(filter) {
      const call = { model: 'Submission', filter };
      calls.push(call);
      let rows = state.submissions.filter((row) => matches(row, filter));
      const query = {
        sort(fields) { call.sort = fields; rows = sorted(rows, fields); return query; },
        limit(value) { call.limit = value; rows = rows.slice(0, value); return query; },
        select(fields) { call.selection = fields; return query; },
        populate(field, selection) { call.populate = { field, selection }; return query; },
        async lean() {
          const fields = ['_id', ...call.selection.split(/\s+/)];
          return rows.map((row) => {
            const selected = Object.fromEntries(fields.filter((field) => Object.hasOwn(row, field)).map((field) => [field, row[field]]));
            const company = state.companies.find((company) => company._id === row.companyId);
            selected.companyId = company ? { _id: company._id, companyName: company.companyName } : null;
            return selected;
          });
        },
      };
      return query;
    },
  };

  const context = vm.createContext({
    console: { error() {} }, URL, Intl,
    Date: class extends Date {
      constructor(...args) { super(...(args.length ? args : [now])); }
      static now() { return now.getTime(); }
    },
  });
  const modules = new Map();
  function synthetic(key, exports) {
    if (!modules.has(key)) modules.set(key, new vm.SyntheticModule(Object.keys(exports), function () {
      for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
    }, { context }));
    return modules.get(key);
  }
  function source(filename) {
    if (!modules.has(filename)) modules.set(filename, new vm.SourceTextModule(fs.readFileSync(filename, 'utf8'), { identifier: filename, context }));
    return modules.get(filename);
  }
  async function load(filename) {
    const module = source(path.join(ROOT, filename));
    if (module.status === 'unlinked') await module.link((specifier, referencing) => {
      if (specifier === 'next/server') return synthetic('next/server', { NextResponse });
      if (specifier.endsWith('/auth/requireAdmin')) return synthetic('auth', { requireAdmin: async () => state.access });
      if (specifier.endsWith('/mongodb')) return synthetic('db', { default: async () => {
        calls.push({ connect: true });
        if (state.databaseError) throw state.databaseError;
      } });
      if (specifier.endsWith('/models/Submission')) return synthetic('Submission', { default: Submission });
      for (const model of ['Company', 'User']) {
        if (specifier.endsWith(`/models/${model}`)) return synthetic(model, { default: {
          collection: { name: 'companies' },
          aggregate: (pipeline) => aggregate(model, pipeline),
          async countDocuments(filter = {}) {
            calls.push({ model, filter });
            return state[model === 'Company' ? 'companies' : 'users'].filter((row) => matches(row, filter)).length;
          },
        } });
      }
      const resolved = path.resolve(path.dirname(referencing.identifier), specifier);
      return source(resolved.endsWith('.js') ? resolved : `${resolved}.js`);
    });
    if (module.status === 'linked') await module.evaluate();
    return module.namespace;
  }
  return {
    state, calls, load,
    async get(query = '') {
      const route = await load('app/api/admin/stats/route.js');
      return route.GET(new Request(`http://localhost/api/admin/stats${query}`));
    },
  };
}

function assertNoStore(response) {
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
}

test('admin dashboard remains GET-only and rejects non-admin requests before database access', async () => {
  for (const status of [401, 403]) {
    const harness = createHarness({ access: { error: NextResponse.json({ error: 'Denied' }, { status }) } });
    const route = await harness.load('app/api/admin/stats/route.js');
    assert.deepEqual(Object.keys(route).filter((key) => /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/.test(key)), ['GET']);
    assert.equal(route.dynamic, 'force-dynamic');
    const response = await harness.get();
    assert.equal(response.status, status);
    assertNoStore(response);
    assert.deepEqual(harness.calls, []);
  }
});

test('invalid reporting years fail before database access', async () => {
  for (const year of ['', '0', '1899', '10000', '2026.5', '2026abc', '-2026', 'Infinity', '{"$gt":0}']) {
    const harness = createHarness();
    const response = await harness.get(`?year=${encodeURIComponent(year)}`);
    assert.equal(response.status, 400, year);
    assertNoStore(response);
    assert.deepEqual(harness.calls, []);
  }
});

test('aggregate headline totals include every period and all five statuses', async () => {
  const harness = createHarness();
  const response = await harness.get();
  assert.equal(response.status, 200);
  assertNoStore(response);
  const body = await response.json();
  assert.equal(body.totalCompanies, 2);
  assert.equal(body.activeCompanies, 1);
  assert.equal(body.totalUsers, 2);
  assert.equal(body.totalSubmissions, 7);
  assert.equal(body.totalSaleValue, 2800);
  assert.equal(body.totalTaxAmount, 448);
  assert.equal(body.totalBillAmount, 3248);
  assert.deepEqual(body.statusBreakdown, { draft: 2, validated: 1, ready_for_submission: 1, submitted: 2, failed: 1 });
  assert.deepEqual(body.statusBreakdowns.all, body.statusBreakdown);
  assert.deepEqual(body.statusBreakdowns.currentMonth, { draft: 0, validated: 1, ready_for_submission: 1, submitted: 0, failed: 1 });
  assert.equal(body.readySubmissions, 1);
  assert.equal(body.submittedSubmissions, 2);
  assert.deepEqual(body.currentPeriod, { year: 2026, month: 11 });
  assert.equal(body.year, 2026);
  assert.equal(body.monthlyTrend.length, 12);
  assert.deepEqual(body.monthlyTrend[0], { label: 'Jan', month: 1, saleValue: 100, taxAmount: 16, count: 1 });
  assert.deepEqual(body.monthlyTrend[1], { label: 'Feb', month: 2, saleValue: 0, taxAmount: 0, count: 0 });
  assert.deepEqual(body.monthlyTrend[10], { label: 'Nov', month: 11, saleValue: 1200, taxAmount: 192, count: 3 });
  assert.deepEqual(body.companyPerformance, [
    { id: COMPANY_A, name: 'Alpha', saleValue: 800, taxAmount: 128, count: 3 },
    { id: COMPANY_B, name: 'Beta', saleValue: 700, taxAmount: 112, count: 2 },
  ]);
});

test('summary card trends use six real months while preserving all-time headline totals', async () => {
  const harness = createHarness();
  const body = await (await harness.get()).json();
  assert.deepEqual(body.cardTrendPeriods, [
    { year: 2026, month: 6, label: 'Jun 2026' },
    { year: 2026, month: 7, label: 'Jul 2026' },
    { year: 2026, month: 8, label: 'Aug 2026' },
    { year: 2026, month: 9, label: 'Sep 2026' },
    { year: 2026, month: 10, label: 'Oct 2026' },
    { year: 2026, month: 11, label: 'Nov 2026' },
  ]);
  assert.deepEqual(body.cardTrends.totalCompanies, {
    values: [0, 0, 0, 0, 1, 1], current: 1, previous: 1, percentChange: 0,
    basis: 'New company registrations',
  });
  assert.deepEqual(body.cardTrends.activeCompanies, {
    values: [0, 0, 0, 0, 1, 0], current: 0, previous: 1, percentChange: -100,
    basis: 'New registrations currently active',
  });
  assert.deepEqual(body.cardTrends.totalUsers.values, [0, 0, 0, 0, 1, 1]);
  assert.equal(body.cardTrends.totalUsers.basis, 'New company user accounts');
  assert.deepEqual(body.cardTrends.totalSubmissions, {
    values: [0, 0, 0, 0, 1, 3], current: 3, previous: 1, percentChange: 200,
    basis: 'Submissions by tax period',
  });
  assert.deepEqual(body.cardTrends.totalSaleValue, {
    values: [0, 0, 0, 0, 200, 1200], current: 1200, previous: 200, percentChange: 500,
    basis: 'Sale value by tax period',
  });
  assert.deepEqual(body.cardTrends.totalTaxAmount.values, [0, 0, 0, 0, 32, 192]);
  assert.equal(body.cardTrends.submittedSubmissions.percentChange, -100);
  for (const field of ['validatedSubmissions', 'readySubmissions', 'failedSubmissions']) {
    assert.equal(body.cardTrends[field].current, 1);
    assert.equal(body.cardTrends[field].previous, 0);
    assert.equal(body.cardTrends[field].percentChange, null, 'New activity must not invent a percentage against zero');
  }
  assert.deepEqual(body.cardTrends.draftSubmissions.values, [0, 0, 0, 0, 0, 0]);
  assert.equal(body.cardTrends.draftSubmissions.percentChange, 0);
  assert.equal(body.draftSubmissions, 2, 'Existing headlines continue to include past and future tax periods');
  assert.equal(body.totalSaleValue, 2800);
  const selectedYear = await (await createHarness().get('?year=2025')).json();
  assert.deepEqual(selectedYear.cardTrends, body.cardTrends, 'Annual chart selection must not change current card comparisons');
});

test('registration mini charts follow Karachi boundaries and submission charts follow tax periods across years', async () => {
  const companies = [
    '2026-07-31T18:59:59Z', // Before the first reporting month.
    '2026-07-31T19:00:00Z', // August starts in Karachi.
    '2026-12-31T18:59:59Z', // Still December in Karachi.
    '2026-12-31T19:00:00Z', // January starts in Karachi.
    '2027-01-31T19:00:00Z', // February is outside the series.
  ].map((createdAt, index) => ({ _id: `company-${index}`, status: 'active', createdAt: new Date(createdAt) }));
  const harness = createHarness({
    now: '2026-12-31T19:00:00Z', companies,
    users: [
      ...companies.map(({ createdAt }) => ({ role: 'company_user', createdAt })),
      { role: 'super_admin', createdAt: new Date('2027-01-01T00:00:00Z') },
      { role: 'company_user' }, // A legacy record without a creation date is not assigned a made-up month.
    ],
    submissions: [
      { taxPeriodYear: 2026, taxPeriodMonth: 7, status: 'submitted', totalSaleValue: 10 },
      { taxPeriodYear: 2026, taxPeriodMonth: 8, status: 'draft', totalSaleValue: 20 },
      { taxPeriodYear: 2026, taxPeriodMonth: 12, status: 'submitted', totalSaleValue: 30 },
      { taxPeriodYear: 2027, taxPeriodMonth: 1, status: 'submitted', totalSaleValue: 40 },
      { taxPeriodYear: 2027, taxPeriodMonth: 2, status: 'failed', totalSaleValue: 50 },
    ],
  });
  const body = await (await harness.get()).json();
  assert.equal(body.totalCompanies, 5);
  assert.equal(body.totalUsers, 6);
  assert.deepEqual(body.cardTrendPeriods.map(({ year, month }) => [year, month]), [
    [2026, 8], [2026, 9], [2026, 10], [2026, 11], [2026, 12], [2027, 1],
  ]);
  for (const field of ['totalCompanies', 'activeCompanies', 'totalUsers']) {
    assert.deepEqual(body.cardTrends[field].values, [1, 0, 0, 0, 1, 1]);
  }
  assert.deepEqual(body.cardTrends.totalSubmissions.values, [1, 0, 0, 0, 1, 1]);
  assert.deepEqual(body.cardTrends.totalSaleValue.values, [20, 0, 0, 0, 30, 40]);
  assert.equal(body.cardTrends.totalSaleValue.percentChange, 33.3);
  assert.equal(body.cardTrends.failedSubmissions.current, 0);
  assert.equal(body.cardTrends.submittedSubmissions.current, 1);
});

test('year selection narrows annual reports while preserving all-time headlines and current-month status', async () => {
  const harness = createHarness();
  const response = await harness.get(`?year=2025&status=submitted&companyId=${COMPANY_B}`);
  const body = await response.json();
  assert.equal(body.year, 2025);
  assert.equal(body.totalSubmissions, 7);
  assert.equal(body.totalSaleValue, 2800);
  assert.equal(body.statusBreakdowns.currentMonth.ready_for_submission, 1);
  assert.deepEqual(body.monthlyTrend[11], { label: 'Dec', month: 12, saleValue: 600, taxAmount: 96, count: 1 });
  assert.ok(body.monthlyTrend.slice(0, 11).every((point) => point.count === 0));
  assert.deepEqual(body.companyPerformance, [{ id: COMPANY_A, name: 'Alpha', saleValue: 600, taxAmount: 96, count: 1 }]);
  const aggregates = harness.calls.filter((call) => call.model === 'Submission' && call.pipeline);
  assert.equal(aggregates.length, 4);
  assert.ok(aggregates[0].pipeline[0].$group, 'Headline group must not be narrowed by the annual filter');
  for (const { pipeline } of aggregates.slice(1, 3)) assert.deepEqual(JSON.parse(JSON.stringify(pipeline[0].$match)), { taxPeriodYear: 2025 });
});

test('recent records are bounded, sorted, and projected without company or submission secrets', async () => {
  const harness = createHarness();
  const response = await harness.get();
  const text = await response.text();
  const body = JSON.parse(text);
  assert.equal(body.recentSubmissions.length, 5);
  assert.equal(body.recentSubmissions[0].id, 'submission-7');
  assert.equal(body.recentSubmissions.at(-1).id, 'submission-3');
  assert.equal(body.recentSubmissions[0].companyId, COMPANY_B);
  assert.equal(body.recentSubmissions[0].companyName, 'Beta');
  assert.equal(body.recentSubmissions[0].invoiceNumber, 'INV-7');
  assert.equal(body.recentSubmissions[0].submittedAt, null);
  assert.equal(body.recentSubmissions[1].submittedAt, '2026-11-06T00:00:00Z');
  assert.doesNotMatch(text, /private-|fbrPayload|fbrProductionToken/);
  const query = harness.calls.find((call) => call.selection);
  assert.equal(query.limit, 5);
  assert.deepEqual(JSON.parse(JSON.stringify(query.sort)), { updatedAt: -1, _id: -1 });
  assert.deepEqual(JSON.parse(JSON.stringify(query.populate)), { field: 'companyId', selection: 'companyName' });
});

test('company ranking is limited to five after sorting annual sale totals', async () => {
  const harness = createHarness({
    companies: Array.from({ length: 6 }, (_, index) => ({ _id: `company-${index}`, companyName: `Company ${index}` })),
    submissions: Array.from({ length: 6 }, (_, index) => ({
      _id: `submission-${index}`, companyId: `company-${index}`, taxPeriodYear: 2026,
      taxPeriodMonth: 11, totalSaleValue: index + 1, totalTaxAmount: 1, status: 'submitted',
    })),
  });
  const response = await harness.get();
  const body = await response.json();
  assert.equal(body.companyPerformance.length, 5);
  assert.deepEqual(body.companyPerformance.map((company) => company.saleValue), [6, 5, 4, 3, 2]);
});

test('missing and deleted companies remain visible without exposing unsupported profile data', async () => {
  const harness = createHarness({ companies: [] });
  const response = await harness.get();
  const body = await response.json();
  assert.equal(body.recentSubmissions[0].companyId, null);
  assert.equal(body.recentSubmissions[0].companyName, 'Unavailable company');
  assert.ok(body.companyPerformance.every((company) => company.name === 'Unavailable company'));
});

test('empty databases return complete zero-valued analytics', async () => {
  const harness = createHarness({ companies: [], users: [], submissions: [] });
  const response = await harness.get();
  const body = await response.json();
  assert.equal(body.totalSubmissions, 0);
  assert.equal(body.totalSaleValue, 0);
  assert.equal(body.totalTaxAmount, 0);
  assert.equal(body.totalBillAmount, 0);
  assert.equal(body.readySubmissions, 0);
  assert.deepEqual(body.statusBreakdowns.currentMonth, { draft: 0, validated: 0, ready_for_submission: 0, submitted: 0, failed: 0 });
  assert.equal(body.monthlyTrend.length, 12);
  assert.ok(body.monthlyTrend.every((point) => point.count === 0 && point.saleValue === 0 && point.taxAmount === 0));
  assert.deepEqual(body.companyPerformance, []);
  assert.deepEqual(body.recentSubmissions, []);
  assert.equal(body.cardTrendPeriods.length, 6);
  assert.equal(Object.keys(body.cardTrends).length, 11);
  for (const trend of Object.values(body.cardTrends)) {
    assert.deepEqual(trend.values, [0, 0, 0, 0, 0, 0]);
    assert.equal(trend.current, 0);
    assert.equal(trend.previous, 0);
    assert.equal(trend.percentChange, 0);
  }
});

test('database failures return an uncached generic error', async () => {
  const harness = createHarness({ databaseError: new Error('database password private-password') });
  const response = await harness.get();
  assert.equal(response.status, 500);
  assertNoStore(response);
  assert.deepEqual(await response.json(), { error: 'Unable to load dashboard statistics' });
});

test('reporting periods follow Karachi month and year boundaries', async () => {
  const harness = createHarness();
  const { getCurrentTaxPeriod } = await harness.load('lib/admin/dashboardStats.js');
  const plain = (value) => JSON.parse(JSON.stringify(value));
  assert.deepEqual(plain(getCurrentTaxPeriod(new Date('2026-10-31T18:59:59Z'))), { year: 2026, month: 10 });
  assert.deepEqual(plain(getCurrentTaxPeriod(new Date('2026-10-31T19:00:00Z'))), { year: 2026, month: 11 });
  assert.deepEqual(plain(getCurrentTaxPeriod(new Date('2026-12-31T19:00:00Z'))), { year: 2027, month: 1 });
  const january = createHarness({ now: '2026-12-31T19:00:00Z' });
  const response = await january.get();
  const body = await response.json();
  assert.equal(body.year, 2027);
  assert.deepEqual(body.currentPeriod, { year: 2027, month: 1 });
  assert.equal(body.monthlyTrend[1].saleValue, 700);
  assert.ok(Object.values(body.statusBreakdowns.currentMonth).every((count) => count === 0));
});

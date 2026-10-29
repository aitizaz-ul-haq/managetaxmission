const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { NextResponse } = require('next/server');

const ROOT = path.resolve(__dirname, '..');
const COMPANY = '640000000000000000000001';
const OTHER_COMPANY = '640000000000000000000002';

async function harness({ denied = false, databaseError = false } = {}) {
  const calls = [];
  const context = vm.createContext({
    Intl,
    console: { error() {} },
    Date: class extends Date {
      constructor(...args) { super(...(args.length ? args : ['2026-10-31T19:00:00Z'])); }
    },
  });
  const modules = new Map();
  const synthetic = (key, exports) => {
    if (!modules.has(key)) modules.set(key, new vm.SyntheticModule(Object.keys(exports), function () {
      for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
    }, { context }));
    return modules.get(key);
  };
  const Submission = {
    async countDocuments(filter) {
      calls.push({ kind: 'count', filter });
      if (filter.status) return { draft: 1, validated: 2, ready_for_submission: 3, submitted: 4, failed: 5 }[filter.status];
      return filter.taxPeriodMonth ? 3 : 15;
    },
    async aggregate(pipeline) {
      calls.push({ kind: 'aggregate', pipeline });
      const group = pipeline[1].$group;
      if (group.totalSaleValue) return [{ totalSaleValue: 300, totalTaxAmount: 48, totalBillAmount: 348 }];
      if (group._id.year) return [
        { _id: { year: 2026, month: 10 }, count: 2, saleValue: 100, taxAmount: 16, billAmount: 116, draft: 1, submitted: 1 },
        { _id: { year: 2026, month: 11 }, count: 3, saleValue: 200, taxAmount: 32, billAmount: 232, ready_for_submission: 2, submitted: 1 },
      ];
      return [{ _id: 'Own buyer', count: 2, billAmount: 348, taxAmount: 48 }];
    },
    find(filter) {
      const call = { kind: 'find', filter };
      calls.push(call);
      const query = {
        sort(value) { call.sort = value; return query; },
        limit(value) { call.limit = value; return query; },
        select(value) { call.select = value; return query; },
        async lean() { return [{ _id: 'own-submission', itemList: [{ buyerBusinessName: 'Own buyer' }], taxPeriodMonth: 11, taxPeriodYear: 2026, totalBillAmount: 232, status: 'ready_for_submission' }]; },
      };
      return query;
    },
  };
  function source(filename) {
    if (!modules.has(filename)) modules.set(filename, new vm.SourceTextModule(fs.readFileSync(filename, 'utf8'), { context, identifier: filename }));
    return modules.get(filename);
  }
  const route = source(path.join(ROOT, 'app/api/company/stats/route.js'));
  await route.link((specifier, referencing) => {
    if (specifier === 'next/server') return synthetic('next/server', { NextResponse });
    if (specifier === 'mongoose') return synthetic('mongoose', { default: { Types: { ObjectId: { createFromHexString: (id) => id } } } });
    if (specifier.endsWith('/mongodb')) return synthetic('db', { default: async () => { calls.push({ kind: 'connect' }); if (databaseError) throw new Error('private database address'); } });
    if (specifier.endsWith('/models/Submission')) return synthetic('Submission', { default: Submission });
    if (specifier.endsWith('/auth/requireCompanyUser')) return synthetic('auth', { requireCompanyUser: async () => denied ? { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) } : { user: { companyId: COMPANY } } });
    const filename = path.resolve(path.dirname(referencing.identifier), `${specifier}.js`);
    return source(filename);
  });
  await route.evaluate();
  return { route: route.namespace, calls, helpers: modules.get(path.join(ROOT, 'lib/company/dashboardStats.js')).namespace };
}

const request = () => new Request(`http://localhost/api/company/stats?companyId=${OTHER_COMPANY}`);

test('company dashboard scopes every query to authenticated company and retains totals', async () => {
  const { route, calls } = await harness();
  const response = await route.GET(request());
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store, max-age=0');
  for (const call of calls.filter((entry) => entry.filter || entry.pipeline)) {
    assert.equal(String((call.filter || call.pipeline[0].$match).companyId), COMPANY);
  }
  assert.equal(body.totalSubmissions, 15);
  assert.equal(body.totalBillAmount, 348);
  assert.deepEqual(body.statusBreakdown, { draft: 1, validated: 2, ready_for_submission: 3, submitted: 4, failed: 5 });
  assert.equal(body.recent[0].buyer, 'Own buyer');
  const recent = calls.find((call) => call.kind === 'find');
  assert.equal(recent.limit, 6);
  assert.ok(!recent.select.includes('fbrPayload'));
});

test('company dashboard uses Karachi month boundaries, fills gaps, and derives real trends', async () => {
  const { route, calls } = await harness();
  const body = await (await route.GET(request())).json();
  const monthQuery = calls.find((call) => call.filter?.taxPeriodMonth);
  assert.equal(monthQuery.filter.taxPeriodMonth, 11);
  assert.equal(monthQuery.filter.taxPeriodYear, 2026);
  assert.deepEqual(body.monthlyTrend.map((entry) => entry.label), ['Jun 26', 'Jul 26', 'Aug 26', 'Sep 26', 'Oct 26', 'Nov 26']);
  assert.equal(body.monthlyTrend[0].count, 0);
  assert.equal(body.currentMonthStatusBreakdown.ready_for_submission, 2);
  assert.equal(body.cardTrends.totalSubmissions.percentChange, 50);
  assert.equal(body.cardTrends.totalBillAmount.percentChange, 100);
  assert.equal(body.cardTrends.submittedSubmissions.percentChange, 0);
  assert.deepEqual(body.cardTrends.totalBillAmount.values, [0, 0, 0, 0, 116, 232]);
  const monthly = calls.find((call) => call.pipeline?.[1].$group?._id?.year);
  assert.ok(monthly.pipeline[1].$group.ready_for_submission);
});

test('company dashboard does not read records when access is denied', async () => {
  const { route, calls } = await harness({ denied: true });
  assert.equal((await route.GET(request())).status, 403);
  assert.equal(calls.length, 0);
});

test('company trend comparisons cover new activity, decreases, empty months and year rollover', async () => {
  const { helpers } = await harness();
  const trend = helpers.buildCompanyTrend([
    { _id: { year: 2026, month: 12 }, count: 0, saleValue: 100, taxAmount: 0, billAmount: 0 },
    { _id: { year: 2027, month: 1 }, count: 2, saleValue: 50, taxAmount: 0, billAmount: 50 },
  ], new Date('2026-12-31T19:00:00Z'));
  assert.equal(trend.monthlyTrend.at(-1).label, 'Jan 27');
  assert.equal(trend.monthlyTrend[0].label, 'Aug 26');
  assert.equal(trend.cardTrends.totalSubmissions.percentChange, null);
  assert.equal(trend.cardTrends.totalSaleValue.percentChange, -50);
  assert.equal(trend.cardTrends.totalTaxAmount.percentChange, 0);
});

test('company dashboard returns a safe uncached error when the database fails', async () => {
  const { route } = await harness({ databaseError: true });
  const response = await route.GET(request());
  assert.equal(response.status, 500);
  assert.equal(response.headers.get('cache-control'), 'no-store, max-age=0');
  assert.equal((await response.json()).error, 'Unable to load your dashboard. Please try again.');
});

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const vm = require('node:vm');
const mongoose = require('mongoose');
const { NextResponse } = require('next/server');

const ROOT = path.resolve(__dirname, '..');
const COMPANY_ID = '640000000000000000000001';
const OTHER_COMPANY_ID = '640000000000000000000002';
const ROUTES = ['stats', 'submissions', 'fbr-invoices', 'profile'];

// Load the actual route/helper modules while replacing only external auth and DB boundaries.
function createHarness(options = {}) {
  const calls = [];
  const now = new Date(options.now || '2026-10-31T19:00:00.000Z');
  const state = {
    access: { user: { userId: 'supervisor-id', companyId: COMPANY_ID } },
    companies: [
      {
        _id: COMPANY_ID,
        companyName: 'Own company',
        ntn: '1234567',
        fbrSandboxToken: 'sandbox-secret',
        fbrProductionToken: 'production-secret',
        futureIntegrationSecret: 'future-secret',
      },
      { _id: OTHER_COMPANY_ID, companyName: 'Other company' },
    ],
    submissions: [
      {
        _id: 'own-submission', companyId: COMPANY_ID, status: 'ready_for_submission',
        itemList: [{ buyerBusinessName: 'Own buyer', itemDescription: 'Own item' }],
        taxPeriodMonth: 11, taxPeriodYear: 2026, totalBillAmount: 116,
        updatedAt: '2026-11-01T00:00:00.000Z',
      },
      { _id: 'foreign-submission', companyId: OTHER_COMPANY_ID, itemList: [] },
    ],
    receipts: [
      {
        _id: 'own-receipt', companyId: COMPANY_ID, success: true,
        invoicePayload: { buyerBusinessName: 'Own buyer', items: [{ productDescription: 'Own item' }] },
        fbrResponse: { invoiceNumber: 'FBR-123' },
      },
      { _id: 'foreign-receipt', companyId: OTHER_COMPANY_ID },
    ],
    ...options,
  };

  function queryFor(records, filter, model, single = false) {
    const call = { model, filter, selection: null, limit: null };
    calls.push(call);
    let scoped = records.filter((record) =>
      Object.entries(filter).every(([key, value]) => String(record[key]) === String(value))
    );
    const query = {
      sort() { return query; },
      limit(count) { call.limit = count; scoped = scoped.slice(0, count); return query; },
      select(fields) { call.selection = fields; return query; },
      async lean() {
        let results = scoped;
        if (call.selection) {
          // Preserve the projected array container for dotted Mongoose selections.
          const selectedFields = [...new Set(['_id', ...call.selection.split(/\s+/).map((field) => field.split('.')[0])])];
          results = results.map((record) => Object.fromEntries(
            selectedFields.filter((field) => Object.hasOwn(record, field)).map((field) => [field, record[field]])
          ));
        }
        return single ? results[0] || null : results;
      },
    };
    return query;
  }

  const submissionModel = {
    find(filter) { return queryFor(state.submissions, filter, 'Submission'); },
    async aggregate(pipeline) {
      calls.push({ model: 'Submission', pipeline });
      if (state.emptyStats) return [];
      if (pipeline[1]?.$group?.totalSubmissions) {
        return [{
          totalSubmissions: 5, currentMonthSubmissions: 3,
          draftSubmissions: 1, validatedSubmissions: 1, readySubmissions: 1,
          submittedSubmissions: 1, failedSubmissions: 1,
          totalSaleValue: 500, totalTaxAmount: 80, totalBillAmount: 580,
        }];
      }
      if (pipeline[1]?.$group?.saleValue) {
        return [{ _id: { year: 2026, month: 11 }, count: 3, saleValue: 300, taxAmount: 48, billAmount: 348 }];
      }
      return [{ _id: 'Own buyer', count: 5, billAmount: 580, taxAmount: 80 }];
    },
  };

  const context = vm.createContext({
    console: { error() {} },
    Intl,
    Date: class extends Date {
      constructor(...args) { super(...(args.length ? args : [now])); }
      static now() { return now.getTime(); }
    },
  });
  const moduleCache = new Map();

  function synthetic(key, exports) {
    if (!moduleCache.has(key)) {
      moduleCache.set(key, new vm.SyntheticModule(Object.keys(exports), function () {
        for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
      }, { context }));
    }
    return moduleCache.get(key);
  }

  function sourceModule(filename) {
    if (!moduleCache.has(filename)) {
      moduleCache.set(filename, new vm.SourceTextModule(fs.readFileSync(filename, 'utf8'), {
        identifier: filename,
        context,
      }));
    }
    return moduleCache.get(filename);
  }

  async function load(relativeFile) {
    const loadedModule = sourceModule(path.join(ROOT, relativeFile));
    if (loadedModule.status === 'unlinked') {
      await loadedModule.link((specifier, referencingModule) => {
        if (specifier === 'mongoose') return synthetic('mongoose', { default: mongoose });
        if (specifier === 'next/server') return synthetic('next/server', { NextResponse });
        if (specifier.endsWith('/auth/requireSupervisor')) {
          return synthetic('auth', { requireSupervisor: async () => state.access });
        }
        if (specifier.endsWith('/mongodb')) {
          return synthetic('db', { default: async () => {
            calls.push({ connect: true });
            if (state.databaseError) throw state.databaseError;
          } });
        }
        if (specifier.endsWith('/models/Submission')) return synthetic('Submission', { default: submissionModel });
        if (specifier.endsWith('/models/FbrReceipt')) {
          return synthetic('FbrReceipt', { default: {
            find(filter) { return queryFor(state.receipts, filter, 'FbrReceipt'); },
          } });
        }
        if (specifier.endsWith('/models/Company')) {
          return synthetic('Company', { default: {
            findById(id) { return queryFor(state.companies, { _id: id }, 'Company', true); },
          } });
        }
        const resolved = path.resolve(path.dirname(referencingModule.identifier), specifier);
        return sourceModule(resolved.endsWith('.js') ? resolved : `${resolved}.js`);
      });
    }
    if (loadedModule.status === 'linked') await loadedModule.evaluate();
    return loadedModule.namespace;
  }

  return {
    state,
    calls,
    load,
    route(name) { return load(`app/api/supervisor/${name}/route.js`); },
  };
}

function spoofedRequest(route) {
  return new Request(`http://localhost/api/supervisor/${route}?companyId=${OTHER_COMPANY_ID}&status=submitted`);
}

function assertNoStore(response) {
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
}

for (const routeName of ROUTES) {
  test(`${routeName}: exports only GET and forwards authorization rejections before database access`, async () => {
    for (const status of [401, 403]) {
      const harness = createHarness();
      harness.state.access = { error: NextResponse.json({ error: 'Denied' }, { status }) };
      const route = await harness.route(routeName);
      const methods = Object.keys(route).filter((key) => /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/.test(key));
      assert.deepEqual(methods, ['GET']);
      const response = await route.GET(spoofedRequest(routeName));
      assert.equal(response.status, status);
      assertNoStore(response);
      assert.deepEqual(harness.calls, []);
    }
  });

  test(`${routeName}: rejects invalid authenticated company IDs before database access`, async () => {
    const harness = createHarness({ access: { user: { companyId: 'invalid-id' } } });
    const route = await harness.route(routeName);
    const response = await route.GET(spoofedRequest(routeName));
    assert.equal(response.status, 403);
    assertNoStore(response);
    assert.deepEqual(harness.calls, []);
  });

  test(`${routeName}: hides internal database failure details`, async () => {
    const harness = createHarness({ databaseError: new Error('database password private-secret') });
    const route = await harness.route(routeName);
    const response = await route.GET(spoofedRequest(routeName));
    assert.equal(response.status, 500);
    assertNoStore(response);
    assert.doesNotMatch(await response.text(), /password|private-secret/);
  });
}

test('submissions and FBR invoices ignore client tenant filters and return own full view details', async () => {
  for (const [routeName, key, expectedId] of [
    ['submissions', 'submissions', 'own-submission'],
    ['fbr-invoices', 'receipts', 'own-receipt'],
  ]) {
    const harness = createHarness();
    const route = await harness.route(routeName);
    const response = await route.GET(spoofedRequest(routeName));
    assert.equal(response.status, 200);
    assertNoStore(response);
    const body = await response.json();
    assert.equal(body[key].length, 1);
    assert.equal(body[key][0]._id, expectedId);
    if (key === 'submissions') assert.equal(body[key][0].itemList[0].itemDescription, 'Own item');
    else assert.equal(body[key][0].invoicePayload.items[0].productDescription, 'Own item');
    const query = harness.calls.find((call) => call.filter);
    assert.equal(String(query.filter.companyId), COMPANY_ID);
    assert.deepEqual(Object.keys(query.filter), ['companyId']);
  }
});

test('profile scopes the company lookup and excludes present and future integration secrets', async () => {
  const harness = createHarness();
  const route = await harness.route('profile');
  const response = await route.GET(spoofedRequest('profile'));
  assert.equal(response.status, 200);
  assertNoStore(response);
  const { company } = await response.json();
  assert.equal(company.companyName, 'Own company');
  assert.equal(company.ntn, '1234567');
  assert.equal(Object.hasOwn(company, 'fbrSandboxToken'), false);
  assert.equal(Object.hasOwn(company, 'fbrProductionToken'), false);
  assert.equal(Object.hasOwn(company, 'futureIntegrationSecret'), false);
  const query = harness.calls.find((call) => call.model === 'Company');
  assert.equal(String(query.filter._id), COMPANY_ID);
  assert.ok(query.selection);
});

test('profile returns an uncached 404 when the authenticated company is unavailable', async () => {
  const harness = createHarness({ companies: [] });
  const route = await harness.route('profile');
  const response = await route.GET(spoofedRequest('profile'));
  assert.equal(response.status, 404);
  assertNoStore(response);
});

test('stats scopes every query, includes all five statuses, and bounds trends and recent records', async () => {
  const harness = createHarness();
  const route = await harness.route('stats');
  const response = await route.GET(spoofedRequest('stats'));
  assert.equal(response.status, 200);
  assertNoStore(response);
  const stats = await response.json();
  assert.deepEqual(stats.statusBreakdown, {
    draft: 1, validated: 1, ready_for_submission: 1, submitted: 1, failed: 1,
  });
  assert.equal(stats.readySubmissions, 1);
  assert.equal(stats.totalSubmissions, 5);
  assert.equal(stats.totalBillAmount, 580);
  assert.equal(stats.monthlyTrend.length, 6);
  assert.deepEqual(stats.monthlyTrend[5], { label: 'Nov 26', count: 3, saleValue: 300, taxAmount: 48, billAmount: 348 });
  assert.equal(stats.recent.length, 1);
  assert.equal(stats.recent[0].buyer, 'Own buyer');

  const aggregates = harness.calls.filter((call) => call.pipeline);
  assert.equal(aggregates.length, 3);
  for (const { pipeline } of aggregates) assert.equal(String(pipeline[0].$match.companyId), COMPANY_ID);
  // Summary and top buyers cover all statuses; request status filters cannot narrow the report.
  assert.deepEqual(Object.keys(aggregates[0].pipeline[0].$match), ['companyId']);
  assert.deepEqual(Object.keys(aggregates[2].pipeline[0].$match), ['companyId']);
  assert.equal(aggregates[0].pipeline[1].$group.currentMonthSubmissions.$sum.$cond[0].$and[0].$eq[1], 11);
  for (const [field, status] of [
    ['draftSubmissions', 'draft'], ['validatedSubmissions', 'validated'],
    ['readySubmissions', 'ready_for_submission'], ['submittedSubmissions', 'submitted'],
    ['failedSubmissions', 'failed'],
  ]) {
    assert.equal(aggregates[0].pipeline[1].$group[field].$sum.$cond[0].$eq[1], status);
  }
  assert.equal(aggregates[1].pipeline[0].$match.$or.length, 6);
  assert.equal(aggregates[2].pipeline.at(-1).$limit, 5);
  const recentQuery = harness.calls.find((call) => call.filter);
  assert.equal(String(recentQuery.filter.companyId), COMPANY_ID);
  assert.equal(recentQuery.limit, 6);
});

test('stats returns a complete zero-valued report when the company has no submissions', async () => {
  const harness = createHarness({ emptyStats: true, submissions: [] });
  const route = await harness.route('stats');
  const response = await route.GET(spoofedRequest('stats'));
  assert.equal(response.status, 200);
  assertNoStore(response);
  const stats = await response.json();
  assert.equal(stats.totalSubmissions, 0);
  assert.equal(stats.currentMonthSubmissions, 0);
  assert.equal(stats.totalSaleValue, 0);
  assert.equal(stats.totalTaxAmount, 0);
  assert.equal(stats.totalBillAmount, 0);
  assert.deepEqual(stats.statusBreakdown, {
    draft: 0, validated: 0, ready_for_submission: 0, submitted: 0, failed: 0,
  });
  assert.equal(stats.monthlyTrend.length, 6);
  assert.ok(stats.monthlyTrend.every((month) => month.count === 0 && month.billAmount === 0));
  assert.deepEqual(stats.topBuyers, []);
  assert.deepEqual(stats.recent, []);
});

test('reporting periods follow Karachi month and year boundaries and fill missing months with zero', async () => {
  const harness = createHarness();
  const { getReportingPeriods, buildMonthlyTrend } = await harness.load('lib/supervisor/reportingPeriods.js');
  assert.equal(getReportingPeriods(new Date('2026-10-31T18:59:59Z')).at(-1).label, 'Oct 26');
  assert.equal(getReportingPeriods(new Date('2026-10-31T19:00:00Z')).at(-1).label, 'Nov 26');
  const yearBoundary = getReportingPeriods(new Date('2026-12-31T19:00:00Z'));
  assert.equal(yearBoundary[0].label, 'Aug 26');
  assert.equal(yearBoundary.at(-1).label, 'Jan 27');
  const trend = buildMonthlyTrend(yearBoundary, [
    { _id: { year: 2027, month: 1 }, count: 2, saleValue: 100, taxAmount: 16, billAmount: 116 },
  ]);
  assert.equal(trend.length, 6);
  assert.deepEqual(JSON.parse(JSON.stringify(trend[0])), {
    label: 'Aug 26', count: 0, saleValue: 0, taxAmount: 0, billAmount: 0,
  });
  assert.equal(trend.at(-1).billAmount, 116);
});

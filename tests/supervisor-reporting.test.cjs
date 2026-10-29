const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

test('supervisor CSV reports preserve numbers and neutralize spreadsheet formulas', async () => {
  const module = new vm.SourceTextModule(fs.readFileSync(path.join(__dirname, '../components/supervisor/reporting.js'), 'utf8'));
  await module.link(() => { throw new Error('Reporting helpers must be usable without browser imports'); });
  await module.evaluate();
  const { csvCell, environment, date, statusLabel } = module.namespace;

  assert.equal(csvCell('Buyer, "Ltd"\nKarachi'), '"Buyer, ""Ltd""\nKarachi"');
  for (const value of ['=1+1', '+SUM(A1)', '-1+2', '@SUM(A1)', '  =1', '\t=1', '\r=1', '\n=1']) {
    assert.equal(csvCell(value), `"'${value}"`, `Unsafe spreadsheet text: ${JSON.stringify(value)}`);
  }
  assert.equal(csvCell(-1234.5), '"-1234.5"');
  assert.equal(csvCell(0), '"0"');
  assert.equal(csvCell(null), '""');
  assert.equal(environment('PRODUCTION'), 'production');
  assert.equal(environment(''), 'unspecified');
  assert.equal(statusLabel('ready_for_submission'), 'Ready for submission');
  assert.equal(date('invalid'), '—');
  // UTC evening crosses into the next calendar day in Pakistan.
  assert.match(date('2026-10-18T23:30:00Z'), /19/);
  console.log('Passed supervisor CSV escaping, formula protection, and reporting format checks.');
});

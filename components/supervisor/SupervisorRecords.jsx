'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import SubmissionViewModal from '../company/SubmissionViewModal';
import ReceiptViewModal from '../company/ReceiptViewModal';
import { formatFbrStatusLabel, getFbrInvoiceStatus, getFbrStatusBadgeClass } from '../../lib/fbr/fbrStatus';
import useSupervisorData from './useSupervisorData';
import { EnvironmentBadge, LoadState, Pagination, SubmissionStatus } from './ReportUi';
import { SUBMISSION_STATUSES, count, date, downloadCsv, environment, environmentLabel, money, number, show, statusLabel } from './reporting';
import styles from './Supervisor.module.css';

const PAGE_SIZE = 12;
const receiptStatus = (record) => String(getFbrInvoiceStatus(record) || (record.success ? 'success' : 'failed')).toLowerCase();
const receiptReference = (record) => record.fbrResponse?.reference || record.fbrResponse?.invoiceNumber || record.requestId || record.errorCode || '';
const scenario = (record) => record.scenarioId || record.invoicePayload?.scenarioId || record.fbrResponse?.scenarioId || '';
const submissionBuyer = (record) => record.itemList?.[0]?.buyerBusinessName || record.buyerBusinessName || '';
const invoiceNumber = (record) => record.itemList?.[0]?.invoiceNumber || record.invoiceNumber || '';
const recordTime = (record, invoices) => invoices ? record.receivedAt || record.createdAt : record.updatedAt || record.submittedAt || record.createdAt;

function exportRecords(records, invoices) {
  const rows = invoices ? [
    ['Receipt ID', 'Submission ID', 'Action', 'Status', 'Mock response', 'Scenario', 'Environment', 'FBR reference', 'Received (PKT)', 'Buyer', 'Sales (PKR)', 'Tax (PKR)', 'Bill (PKR)', 'Error'],
    ...records.map((record) => {
      const items = record.invoicePayload?.items || [];
      const sales = items.reduce((sum, item) => sum + number(item.valueSalesExcludingST), 0);
      const tax = items.reduce((sum, item) => sum + number(item.salesTaxApplicable), 0);
      return [record._id, record.submissionId, record.action, formatFbrStatusLabel(receiptStatus(record)), record.mock ? 'Yes' : 'No', scenario(record), environmentLabel(record.environment), receiptReference(record), date(recordTime(record, true)), record.invoicePayload?.buyerBusinessName, sales, tax, sales + tax, record.errorMessage || record.errorCode];
    }),
  ] : [
    ['Submission ID', 'Invoice number', 'Buyer', 'Tax period', 'Status', 'Scenario', 'Environment', 'Sales (PKR)', 'Tax (PKR)', 'Bill (PKR)', 'Last activity (PKT)'],
    ...records.map((record) => [record._id, invoiceNumber(record), submissionBuyer(record), `${record.taxPeriodMonth}/${record.taxPeriodYear}`, statusLabel(record.status), scenario(record), environmentLabel(record.fbrEnvironment), number(record.totalSaleValue), number(record.totalTaxAmount), number(record.totalBillAmount), date(recordTime(record, false))]),
  ];
  downloadCsv(invoices ? 'supervisor-fbr-invoices' : 'supervisor-submissions', rows);
}

export default function SupervisorRecords({ invoices = false }) {
  const searchParams = useSearchParams();
  const requestedStatus = searchParams.get('status') || 'all';
  const requestedSearch = searchParams.get('search') || '';
  const requestedRecord = searchParams.get('record');
  const { data, loading, error, reload } = useSupervisorData(invoices ? '/api/supervisor/fbr-invoices' : '/api/supervisor/submissions');
  const records = useMemo(() => data?.[invoices ? 'receipts' : 'submissions'] || [], [data, invoices]);
  const [search, setSearch] = useState(requestedSearch);
  const [status, setStatus] = useState(requestedStatus);
  const [environmentFilter, setEnvironmentFilter] = useState('all');
  const [pendingSearch, setPendingSearch] = useState(requestedSearch);
  const [pendingStatus, setPendingStatus] = useState(requestedStatus);
  const [pendingEnvironment, setPendingEnvironment] = useState('all');
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);

  const statuses = useMemo(() => invoices
    ? [...new Set(records.map(receiptStatus))].sort().map((value) => ({ value, label: formatFbrStatusLabel(value) }))
    : SUBMISSION_STATUSES, [invoices, records]);

  useEffect(() => {
    setStatus(requestedStatus);
    setPendingStatus(requestedStatus);
    setSearch(requestedSearch);
    setPendingSearch(requestedSearch);
    setPage(1);
  }, [requestedStatus, requestedSearch]);

  useEffect(() => {
    if (!requestedRecord || !records.length) return;
    const record = records.find((entry) => String(entry._id) === requestedRecord);
    if (record) setViewing(record);
  }, [requestedRecord, records]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return records.filter((record) => {
      const currentStatus = invoices ? receiptStatus(record) : record.status;
      const env = environment(invoices ? record.environment : record.fbrEnvironment);
      if (status !== 'all' && currentStatus !== status) return false;
      if (environmentFilter !== 'all' && env !== environmentFilter) return false;
      if (!query) return true;
      return [record._id, record.submissionId, invoiceNumber(record), submissionBuyer(record), record.invoicePayload?.buyerBusinessName, record.action, currentStatus, invoices ? formatFbrStatusLabel(currentStatus) : statusLabel(currentStatus), scenario(record), env, receiptReference(record), record.errorCode, record.errorMessage, `${record.taxPeriodMonth}/${record.taxPeriodYear}`, date(recordTime(record, invoices))].join(' ').toLowerCase().includes(query);
    }).sort((a, b) => (new Date(recordTime(b, invoices)).getTime() || 0) - (new Date(recordTime(a, invoices)).getTime() || 0));
  }, [records, search, status, environmentFilter, invoices]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRecords = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const title = invoices ? 'FBR Invoices' : 'Submissions';

  function resetFilters() {
    setSearch('');
    setStatus('all');
    setEnvironmentFilter('all');
    setPendingSearch('');
    setPendingStatus('all');
    setPendingEnvironment('all');
    setPage(1);
  }

  function applyFilters(event) {
    event.preventDefault();
    setSearch(pendingSearch);
    setStatus(pendingStatus);
    setEnvironmentFilter(pendingEnvironment);
    setPage(1);
  }

  return (
    <div className={`page-content ${styles.page}`}>
      <div className={`page-header ${styles.header}`}>
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">{invoices ? 'Review FBR responses, invoice details and reporting history.' : 'Follow every tax submission from draft to submitted.'}</p>
        </div>
        <div className={styles.actions}>
          <button type="button" className="button button-secondary" onClick={reload} disabled={loading}>Refresh</button>
          <button type="button" className="button button-primary" disabled={loading || !!error || !filtered.length} onClick={() => exportRecords(filtered, invoices)}>Download report CSV</button>
        </div>
      </div>
      <p className={styles.scope}>Company records · View and print details · CSV includes all matching records across every page</p>
      <form className={styles.filters} onSubmit={applyFilters}>
        <label htmlFor="supervisor-record-search"><span>Search {invoices ? 'FBR invoices' : 'submissions'}</span><input id="supervisor-record-search" className="input" type="search" autoComplete="off" value={pendingSearch} onChange={(event) => setPendingSearch(event.target.value)} placeholder={invoices ? 'Submission, reference, buyer…' : 'Buyer, invoice number, tax period…'} /></label>
        <label htmlFor="supervisor-status-filter"><span>Status</span><select id="supervisor-status-filter" className="select" value={pendingStatus} onChange={(event) => setPendingStatus(event.target.value)}><option value="all">All statuses</option>{statuses.map((entry) => <option value={entry.value} key={entry.value}>{entry.label}</option>)}{pendingStatus !== 'all' && !statuses.some((entry) => entry.value === pendingStatus) && <option value={pendingStatus}>{statusLabel(pendingStatus)}</option>}</select></label>
        <label htmlFor="supervisor-environment-filter"><span>Environment</span><select id="supervisor-environment-filter" className="select" value={pendingEnvironment} onChange={(event) => setPendingEnvironment(event.target.value)}><option value="all">All environments</option><option value="production">Production</option><option value="sandbox">Sandbox</option><option value="unspecified">Unspecified</option></select></label>
        <button type="submit" className="button button-primary">Filter</button>
      </form>
      <LoadState loading={loading} error={error} retry={reload} label={`Loading ${title.toLowerCase()}…`} />
      {!loading && !error && (
        <div className="table-wrapper">
          <div className={`table-toolbar ${styles.toolbar}`}><p className="chart-sub" role="status">{count(filtered.length)} matching {invoices ? 'FBR records' : 'submissions'} · {status === 'all' ? 'All statuses' : invoices ? formatFbrStatusLabel(status) : statusLabel(status)} · {environmentFilter === 'all' ? 'All environments' : environmentLabel(environmentFilter)}</p></div>
          {filtered.length ? (
            <>
              <div className={styles.tableScroll}>
                {invoices ? (
                  <table>
                    <thead><tr><th scope="col">Submission ID</th><th scope="col">Action</th><th scope="col">Status</th><th scope="col">Scenario</th><th scope="col">Environment</th><th scope="col">FBR reference</th><th scope="col">Received (PKT)</th><th scope="col">Details</th></tr></thead>
                    <tbody>{pageRecords.map((record) => {
                      const fbrStatus = receiptStatus(record);
                      return <tr key={record._id}><td className={styles.reference}>{show(record.submissionId)}</td><td>{record.action === 'validate' ? 'Validate' : record.action === 'submit' ? 'Submit' : show(record.action)}</td><td><span className={`status-badge ${getFbrStatusBadgeClass(fbrStatus)}`}>{formatFbrStatusLabel(fbrStatus)}{record.mock ? ' (mock)' : ''}</span></td><td>{show(scenario(record))}</td><td><EnvironmentBadge value={record.environment} /></td><td className={styles.reference}>{show(receiptReference(record))}</td><td>{date(recordTime(record, true))}</td><td><button type="button" className="button button-sm button-secondary" onClick={() => setViewing(record)} aria-label={`View FBR invoice ${receiptReference(record) || record.submissionId || record._id}`}>View</button></td></tr>;
                    })}</tbody>
                  </table>
                ) : (
                  <table>
                    <thead><tr><th scope="col">Buyer / invoice</th><th scope="col">Tax period</th><th scope="col">Status</th><th scope="col">Scenario</th><th scope="col">Environment</th><th scope="col" className={styles.numeric}>Sales (PKR)</th><th scope="col" className={styles.numeric}>Tax (PKR)</th><th scope="col" className={styles.numeric}>Bill (PKR)</th><th scope="col">Last activity (PKT)</th><th scope="col">Details</th></tr></thead>
                    <tbody>{pageRecords.map((record) => <tr key={record._id}><td>{show(submissionBuyer(record))}<div className={styles.hint}>{invoiceNumber(record) || record._id}</div></td><td>{record.taxPeriodMonth}/{record.taxPeriodYear}</td><td><SubmissionStatus value={record.status} /></td><td>{show(scenario(record))}</td><td><EnvironmentBadge value={record.fbrEnvironment} /></td><td className={styles.numeric}>{money(record.totalSaleValue)}</td><td className={styles.numeric}>{money(record.totalTaxAmount)}</td><td className={styles.numeric}>{money(record.totalBillAmount)}</td><td>{date(recordTime(record, false))}</td><td><button type="button" className="button button-sm button-secondary" onClick={() => setViewing(record)} aria-label={`View submission ${invoiceNumber(record) || record._id}`}>View</button></td></tr>)}</tbody>
                  </table>
                )}
              </div>
              <Pagination total={filtered.length} page={safePage} setPage={setPage} pageSize={PAGE_SIZE} />
            </>
          ) : (
            <div className={styles.empty}><h2>{records.length ? 'No matching records' : invoices ? 'No FBR invoices yet' : 'No submissions yet'}</h2><p>{records.length ? 'Try another search, status or environment.' : invoices ? 'FBR responses will appear here when your company processes submissions.' : 'Submissions will appear here when your company creates them.'}</p>{records.length > 0 && <button type="button" className="button button-secondary" onClick={resetFilters}>Clear filters</button>}</div>
          )}
          {invoices && <p className={styles.reportNote}>Records include successful and failed FBR responses and validation attempts. A successful validation is separate from a submitted invoice. Mock responses are labeled.</p>}
        </div>
      )}
      {invoices
        ? <ReceiptViewModal open={!!viewing} receipt={viewing} onClose={() => setViewing(null)} />
        : <SubmissionViewModal open={!!viewing} submission={viewing} onClose={() => setViewing(null)} invoicesHref="/supervisor/fbr-invoices" />}
    </div>
  );
}

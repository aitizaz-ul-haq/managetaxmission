'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import PayloadPreview from '../../../../components/company/PayloadPreview';

export default function AdminSubmissionDetailPage() {
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/submissions/${id}`)
      .then((r) => r.json())
      .then((d) => setSubmission(d.submission))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-spinner"><p>Loading…</p></div>;
  if (!submission) return <div className="page-content"><p>Submission not found.</p></div>;

  const fmt = (n) => (n || 0).toLocaleString('en-PK', { minimumFractionDigits: 2 });

  return (
    <>
      <div className="page-content">
        <div className="breadcrumb">
          <a href="/admin/submissions">Submissions</a>
          <span>/</span>
          <span>{submission.invoiceNumber}</span>
        </div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Submission Detail</h1>
            <p className="page-subtitle">{submission.companyId?.companyName}</p>
          </div>
          <span className={`status-badge ${submission.status}`}>{submission.status}</span>
        </div>

        <div className="form-card">
          <h3 className="form-section-title">Tax Period & Invoice</h3>
          <div className="form-grid">
            <div className="form-group"><label>Period</label><p>{submission.taxPeriodMonth}/{submission.taxPeriodYear}</p></div>
            <div className="form-group"><label>Invoice Type</label><p>{submission.invoiceType}</p></div>
            <div className="form-group"><label>Invoice Date</label><p>{submission.invoiceDate}</p></div>
            <div className="form-group"><label>Invoice Number</label><p>{submission.invoiceNumber}</p></div>
          </div>
        </div>

        <div className="form-card">
          <h3 className="form-section-title">Seller</h3>
          <div className="form-grid">
            <div className="form-group"><label>Business Name</label><p>{submission.sellerBusinessName}</p></div>
            <div className="form-group"><label>NTN</label><p>{submission.sellerNTN}</p></div>
            <div className="form-group"><label>Province</label><p>{submission.sellerProvince}</p></div>
            <div className="form-group"><label>Address</label><p>{submission.sellerAddress}</p></div>
          </div>
        </div>

        <div className="form-card">
          <h3 className="form-section-title">Buyer</h3>
          <div className="form-grid">
            <div className="form-group"><label>Business Name</label><p>{submission.buyerBusinessName}</p></div>
            <div className="form-group"><label>NTN</label><p>{submission.buyerNTN || '—'}</p></div>
            <div className="form-group"><label>CNIC</label><p>{submission.buyerCNIC || '—'}</p></div>
            <div className="form-group"><label>Province</label><p>{submission.buyerProvince}</p></div>
            <div className="form-group"><label>Type</label><p>{submission.buyerType || '—'}</p></div>
            <div className="form-group"><label>Address</label><p>{submission.buyerAddress}</p></div>
          </div>
        </div>

        <div className="form-card">
          <h3 className="form-section-title">Invoice Items</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Description</th><th>HS Code</th><th>Qty</th>
                  <th>Unit Price</th><th>Sale Value</th><th>Tax Rate</th><th>Tax Amount</th>
                </tr>
              </thead>
              <tbody>
                {(submission.itemList || []).map((item, i) => (
                  <tr key={i}>
                    <td>{item.itemSNo}</td>
                    <td>{item.itemDescription}</td>
                    <td>{item.hsCode}</td>
                    <td>{item.quantity}</td>
                    <td>{fmt(item.unitPrice)}</td>
                    <td>{fmt(item.saleValue)}</td>
                    <td>{item.taxRate}%</td>
                    <td>{fmt(item.taxAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '1rem', textAlign: 'right' }}>
            <p>Total Sale Value: <strong>PKR {fmt(submission.totalSaleValue)}</strong></p>
            <p>Total Tax: <strong>PKR {fmt(submission.totalTaxAmount)}</strong></p>
            <p style={{ fontSize: '1.1rem' }}>Total Bill: <strong>PKR {fmt(submission.totalBillAmount)}</strong></p>
          </div>
        </div>

        {submission.fbrPayload && <PayloadPreview payload={submission.fbrPayload} />}
      </div>
    </>
  );
}

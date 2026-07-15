/**
 * Maps a saved Submission document (DSI form shape) to the strict FBR invoice
 * payload the bridge expects.
 *
 * NOTE on shape: the bridge accepts ONE invoice (single buyer/seller) with an
 * items[] array. The DSI form stores per-row buyer/document data, so for now we
 * build a single invoice using the top-level seller, the FIRST row's buyer, and
 * all rows as items. Refine once real multi-buyer handling is defined.
 *
 * Type rules enforced by the bridge (see bridge invoice.schema.ts):
 * - NTN/CNIC fields must be STRINGS (never numbers).
 * - item.extraTax must be a STRING; other item tax fields are numbers.
 * - required text fields must be non-empty after trimming.
 */

const str = (v) => (v === undefined || v === null ? '' : String(v).trim());
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

function mapItem(item) {
  const rate = item.taxRate !== undefined && item.taxRate !== null && item.taxRate !== ''
    ? `${Number(item.taxRate)}%`
    : str(item.rate);

  return {
    hsCode: str(item.hsCode),
    productDescription: str(item.itemDescription),
    rate,
    uoM: str(item.uom),
    quantity: num(item.quantity) || 0,
    totalValues: num(item.totalValueOfSales),
    valueSalesExcludingST: num(item.saleValue),
    fixedNotifiedValueOrRetailPrice: num(item.fixedNotifiedValue),
    salesTaxApplicable: num(item.taxAmount),
    salesTaxWithheldAtSource: num(item.stWithheldAtSource),
    extraTax: str(item.extraTax ?? '0'),
    furtherTax: num(item.furtherTax),
    sroScheduleNo: str(item.sroScheduleNo),
    fedPayable: num(item.fedPayable),
    discount: num(item.discount),
    saleType: str(item.saleType),
    sroItemSerialNo: str(item.sroItemSerialNo),
  };
}

export function mapSubmissionToInvoice(submission) {
  const rows = Array.isArray(submission.itemList) ? submission.itemList : [];
  const first = rows[0] || {};

  return {
    invoiceType: str(first.invoiceType || submission.invoiceType) || 'Sale Invoice',
    invoiceDate: str(first.invoiceDate || submission.invoiceDate),
    sellerNTNCNIC: str(submission.sellerNTN),
    sellerBusinessName: str(submission.sellerBusinessName),
    sellerProvince: str(submission.sellerProvince),
    sellerAddress: str(submission.sellerAddress),
    buyerNTNCNIC: str(first.buyerNTN || submission.buyerNTN),
    buyerBusinessName: str(first.buyerBusinessName || submission.buyerBusinessName),
    buyerProvince: str(first.buyerProvince || submission.buyerProvince),
    buyerAddress: str(first.buyerAddress || submission.buyerAddress),
    buyerRegistrationType: str(first.buyerType || submission.buyerType),
    invoiceRefNo: str(first.invoiceReferenceNo),
    scenarioId: str(submission.scenarioId),
    items: rows.map(mapItem),
  };
}

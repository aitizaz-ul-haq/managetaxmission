/**
 * Example FBR invoice payload used for API-level testing before wiring the real
 * submission form. Field shape matches the bridge's strict Zod schema exactly —
 * NTN/CNIC values are strings, no unknown fields allowed.
 */
export function buildExampleInvoice() {
  return {
    invoiceType: 'Sale Invoice',
    invoiceDate: '2026-07-15',
    sellerNTNCNIC: '1234567',
    sellerBusinessName: 'Manage Taxmission Test Seller',
    sellerProvince: 'Sindh',
    sellerAddress: 'Office 1, Test Plaza, Karachi',
    buyerNTNCNIC: '7654321',
    buyerBusinessName: 'Test Buyer Pvt Ltd',
    buyerProvince: 'Punjab',
    buyerAddress: 'Suite 5, Buyer Tower, Lahore',
    buyerRegistrationType: 'Registered',
    invoiceRefNo: '',
    scenarioId: 'SN001',
    items: [
      {
        hsCode: '0101.2100',
        productDescription: 'Test product A',
        rate: '18%',
        uoM: 'Numbers, pieces, units',
        quantity: 1,
        totalValues: 0,
        valueSalesExcludingST: 1000,
        fixedNotifiedValueOrRetailPrice: 0,
        salesTaxApplicable: 180,
        salesTaxWithheldAtSource: 0,
        extraTax: '0',
        furtherTax: 0,
        sroScheduleNo: '',
        fedPayable: 0,
        discount: 0,
        saleType: 'Goods at standard rate (default)',
        sroItemSerialNo: '',
      },
    ],
  };
}

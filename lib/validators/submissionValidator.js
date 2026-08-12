const VALID_PROVINCES = [
  'Capital Territory',
  'Punjab',
  'Sindh',
  'KPK',
  'Balochistan',
  'AJK',
  'Gilgit-Baltistan',
  'CAPITAL TERRITORY',
  'KHYBER PAKHTUNKHWA',
  'AZAD JAMMU AND KASHMIR',
  'GILGIT BALTISTAN',
  'PUNJAB',
  'SINDH',
  'BALOCHISTAN',
];

const PROVINCE_ALIASES = {
  islamabad: 'CAPITAL TERRITORY',
  'capital territory': 'CAPITAL TERRITORY',
  'khyber pakhtunkhwa': 'KHYBER PAKHTUNKHWA',
  'gilgit-baltistan': 'GILGIT BALTISTAN',
  'gilgit baltistan': 'GILGIT BALTISTAN',
  'azad jammu and kashmir': 'AZAD JAMMU AND KASHMIR',
};

function normalizeText(value) {
  return String(value ?? '').trim();
}

function normalizeProvinceValue(value) {
  const text = normalizeText(value);
  if (!text) return '';
  const normalized = text.toLowerCase();
  return PROVINCE_ALIASES[normalized] || text;
}

function normalizeIdentifier(value) {
  return normalizeText(value).replace(/[^0-9]/g, '');
}

function isValidDate(value) {
  if (!value) return false;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return false;
  const dateText = d.toISOString().slice(0, 10);
  return dateText === normalizeText(value);
}

function isValidNumber(value, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY, decimals = null } = {}) {
  const num = Number(value);
  if (!Number.isFinite(num)) return false;
  if (num < min || num > max) return false;
  if (decimals !== null) {
    const text = String(value);
    if (text.includes('e') || text.includes('E')) return false;
    const fraction = text.split('.')[1] || '';
    if (fraction.length > decimals) return false;
  }
  return true;
}

export function validateSubmission(data) {
  const errors = [];
  const itemList = Array.isArray(data.itemList) ? data.itemList : [];
  const firstItem = itemList[0] || {};

  const submissionType = normalizeText(data.submissionType);
  if (!submissionType) errors.push('Submission type is required');
  else if (submissionType !== 'sale_tax_fed') errors.push('Submission type must be sale_tax_fed');

  const invoiceType = normalizeText(data.invoiceType) || normalizeText(firstItem.invoiceType);
  if (!invoiceType) errors.push('Invoice type is required');
  else if (invoiceType.toLowerCase() !== 'sale invoice'.toLowerCase()) {
    errors.push('Invoice type must be Sale Invoice');
  }

  const invoiceDate = normalizeText(data.invoiceDate) || normalizeText(firstItem.invoiceDate);
  if (!invoiceDate) errors.push('Invoice date is required');
  else if (!isValidDate(invoiceDate)) errors.push('Invoice date must be a valid YYYY-MM-DD date');
  else {
    const currentDate = new Date();
    const currentLocalDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const selectedDate = new Date(`${invoiceDate}T00:00:00`);
    if (selectedDate > currentLocalDate) errors.push('Invoice date cannot be in the future');
  }

  const sellerProvince = normalizeProvinceValue(data.sellerProvince) || normalizeProvinceValue(firstItem.sellerProvince);
  if (!sellerProvince) errors.push('Seller province is required');
  else if (!VALID_PROVINCES.includes(sellerProvince) && !VALID_PROVINCES.includes(sellerProvince.trim())) {
    errors.push('Seller province must be one of the valid FBR provinces');
  }

  const buyerProvince = normalizeProvinceValue(data.buyerProvince) || normalizeProvinceValue(firstItem.buyerProvince);
  if (!buyerProvince) errors.push('Buyer province is required');
  else if (!VALID_PROVINCES.includes(buyerProvince) && !VALID_PROVINCES.includes(buyerProvince.trim())) {
    errors.push('Buyer province must be one of the valid FBR provinces');
  }

  const sellerNtn = normalizeIdentifier(data.sellerNTN ?? data.sellerCNIC) || normalizeIdentifier(firstItem.sellerNTN ?? firstItem.sellerCNIC);
  if (!sellerNtn) errors.push('Seller NTN/CNIC is required');
  else if (!/^[0-9]{7}$|^[0-9]{13}$/.test(sellerNtn)) errors.push('Seller NTN/CNIC must be 7 or 13 numeric digits');

  const buyerNtn = normalizeIdentifier(data.buyerNTN ?? data.buyerCNIC) || normalizeIdentifier(firstItem.buyerNTN ?? firstItem.buyerCNIC);
  if (!buyerNtn) errors.push('Buyer NTN/CNIC is required');
  else if (!/^[0-9]{7}$|^[0-9]{13}$/.test(buyerNtn)) errors.push('Buyer NTN/CNIC must be 7 or 13 numeric digits');

  const sellerBusinessName = normalizeText(data.sellerBusinessName) || normalizeText(firstItem.sellerBusinessName);
  if (!sellerBusinessName) errors.push('Seller business name is required');
  const sellerAddress = normalizeText(data.sellerAddress) || normalizeText(firstItem.sellerAddress);
  if (!sellerAddress) errors.push('Seller address is required');
  const buyerBusinessName = normalizeText(data.buyerBusinessName) || normalizeText(firstItem.buyerBusinessName);
  if (!buyerBusinessName) errors.push('Buyer business name is required');
  const buyerAddress = normalizeText(data.buyerAddress) || normalizeText(firstItem.buyerAddress);
  if (!buyerAddress) errors.push('Buyer address is required');

  const scenario = normalizeText(data.scenarioId);
  if (!scenario) errors.push('FBR scenario ID is required');
  else if (scenario !== 'SN019') errors.push('FBR scenario ID must be SN019');

  if (!itemList.length) {
    errors.push('No invoice items added. Please add at least one item before validating or submitting.');
  } else {
    itemList.forEach((item, i) => {
      const n = i + 1;
      if (!item.itemDescription?.trim()) errors.push(`Item ${n}: description is required`);
      if (!item.hsCode?.trim()) errors.push(`Item ${n}: HS code is required`);
      if (!item.uom?.trim()) errors.push(`Item ${n}: UOM is required`);
      if (!normalizeText(item.sellerProvince)) errors.push(`Item ${n}: Sale Origination Province of Supplier is required`);
      if (!normalizeText(item.buyerProvince)) errors.push(`Item ${n}: Destination of Supply is required`);
      if (!item.saleType?.trim()) errors.push(`Item ${n}: sale type is required`);
      else if (normalizeText(item.saleType) !== 'Services') {
        errors.push(`Item ${n}: sale type must be Services for SN019`);
      }
      if (!item.quantity && item.quantity !== 0) {
        errors.push(`Item ${n}: quantity is required`);
      } else if (!isValidNumber(item.quantity, { min: 0.0001, decimals: 4 })) {
        errors.push(`Item ${n}: quantity must be greater than 0 and have up to 4 decimal places`);
      }
      if (!item.unitPrice && item.unitPrice !== 0) {
        errors.push(`Item ${n}: unit price is required`);
      } else if (!isValidNumber(item.unitPrice, { min: 0.01, decimals: 2 })) {
        errors.push(`Item ${n}: unit price must be greater than 0`);
      }
      if (item.taxRate === undefined || item.taxRate === null || !isValidNumber(item.taxRate, { min: 0, max: 100, decimals: 2 })) {
        errors.push(`Item ${n}: tax rate must be between 0 and 100`);
      }
      if (item.fixedNotifiedValue === undefined || item.fixedNotifiedValue === null || !isValidNumber(item.fixedNotifiedValue, { min: 0, decimals: 2 })) {
        errors.push(`Item ${n}: fixed/notified value is required`);
      }
      if (!item.sroScheduleNo?.trim()) errors.push(`Item ${n}: SRO schedule number is required`);
      if (!item.sroItemSerialNo?.trim()) errors.push(`Item ${n}: SRO item serial number is required`);
    });
  }

  return errors;
}

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

function normalizeText(value) {
  return String(value ?? '').trim();
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
  const submissionType = normalizeText(data.submissionType);
  if (!submissionType) errors.push('Submission type is required');
  else if (submissionType !== 'sale_tax_fed') errors.push('Submission type must be sale_tax_fed');

  const invoiceType = normalizeText(data.invoiceType);
  if (!invoiceType) errors.push('Invoice type is required');
  else if (invoiceType.toLowerCase() !== 'sale invoice'.toLowerCase()) {
    errors.push('Invoice type must be Sale Invoice');
  }

  const invoiceDate = normalizeText(data.invoiceDate);
  if (!invoiceDate) errors.push('Invoice date is required');
  else if (!isValidDate(invoiceDate)) errors.push('Invoice date must be a valid YYYY-MM-DD date');
  else {
    const future = new Date();
    future.setHours(0, 0, 0, 0);
    if (new Date(invoiceDate) > future) errors.push('Invoice date cannot be in the future');
  }

  const sellerProvince = normalizeText(data.sellerProvince);
  if (!sellerProvince) errors.push('Seller province is required');
  else if (!VALID_PROVINCES.includes(sellerProvince) && !VALID_PROVINCES.includes(sellerProvince.trim())) {
    errors.push('Seller province must be one of the valid FBR provinces');
  }

  const buyerProvince = normalizeText(data.buyerProvince);
  if (!buyerProvince) errors.push('Buyer province is required');
  else if (!VALID_PROVINCES.includes(buyerProvince) && !VALID_PROVINCES.includes(buyerProvince.trim())) {
    errors.push('Buyer province must be one of the valid FBR provinces');
  }

  const sellerNtn = normalizeIdentifier(data.sellerNTN ?? data.sellerCNIC);
  if (!sellerNtn) errors.push('Seller NTN/CNIC is required');
  else if (!/^[0-9]{7}$|^[0-9]{13}$/.test(sellerNtn)) errors.push('Seller NTN/CNIC must be 7 or 13 numeric digits');

  const buyerNtn = normalizeIdentifier(data.buyerNTN ?? data.buyerCNIC);
  if (!buyerNtn) errors.push('Buyer NTN/CNIC is required');
  else if (!/^[0-9]{7}$|^[0-9]{13}$/.test(buyerNtn)) errors.push('Buyer NTN/CNIC must be 7 or 13 numeric digits');

  if (!data.sellerBusinessName?.trim()) errors.push('Seller business name is required');
  if (!data.sellerAddress?.trim()) errors.push('Seller address is required');
  if (!data.buyerBusinessName?.trim()) errors.push('Buyer business name is required');
  if (!data.buyerAddress?.trim()) errors.push('Buyer address is required');

  const scenario = normalizeText(data.scenarioId);
  if (!scenario) errors.push('FBR scenario ID is required');
  else if (scenario !== 'SN019') errors.push('FBR scenario ID must be SN019');

  if (!data.itemList || data.itemList.length === 0) {
    errors.push('At least one invoice item is required');
  } else {
    data.itemList.forEach((item, i) => {
      const n = i + 1;
      if (!item.itemDescription?.trim()) errors.push(`Item ${n}: description is required`);
      if (!item.hsCode?.trim()) errors.push(`Item ${n}: HS code is required`);
      if (!item.uom?.trim()) errors.push(`Item ${n}: UOM is required`);
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

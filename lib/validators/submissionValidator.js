export function validateSubmission(data) {
  const errors = [];

  if (!data.invoiceType?.trim()) errors.push('Invoice type is required');
  if (!data.invoiceDate?.trim()) errors.push('Invoice date is required');
  if (!data.invoiceNumber?.trim()) errors.push('Invoice number is required');
  if (!data.sellerBusinessName?.trim()) errors.push('Seller business name is required');
  if (!data.sellerNTN?.trim()) errors.push('Seller NTN is required');
  if (!data.sellerProvince?.trim()) errors.push('Seller province is required');
  if (!data.sellerAddress?.trim()) errors.push('Seller address is required');
  if (!data.buyerBusinessName?.trim()) errors.push('Buyer business name is required');
  if (!data.buyerProvince?.trim()) errors.push('Buyer province is required');
  if (!data.buyerAddress?.trim()) errors.push('Buyer address is required');

  if (!data.buyerNTN?.trim() && !data.buyerCNIC?.trim()) {
    errors.push('Either buyer NTN or buyer CNIC is required');
  }

  if (!data.itemList || data.itemList.length === 0) {
    errors.push('At least one invoice item is required');
  } else {
    data.itemList.forEach((item, i) => {
      const n = i + 1;
      if (!item.itemDescription?.trim()) errors.push(`Item ${n}: description is required`);
      if (!item.hsCode?.trim()) errors.push(`Item ${n}: HS code is required`);
      if (!item.quantity || Number(item.quantity) <= 0) errors.push(`Item ${n}: quantity must be greater than 0`);
      if (!item.unitPrice || Number(item.unitPrice) <= 0) errors.push(`Item ${n}: unit price must be greater than 0`);
      if (item.taxRate === undefined || item.taxRate === null || Number(item.taxRate) < 0) {
        errors.push(`Item ${n}: tax rate must be 0 or greater`);
      }
    });
  }

  return errors;
}
